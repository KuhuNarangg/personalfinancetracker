"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = "http://localhost:8000";

export default function GoalsPage() {
    const [username, setUsername] = useState("");
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState("light");
    const [showForm, setShowForm] = useState(false);
    const [expandedGoal, setExpandedGoal] = useState(null);
    const [missedInput, setMissedInput] = useState({});
    const router = useRouter();

    const [form, setForm] = useState({
        title: "",
        target_amount: "",
        monthly_salary: "",
        months_target: "",
    });

    useEffect(() => {
        const t = localStorage.getItem("theme") || "light";
        setTheme(t);
        document.documentElement.classList.toggle("dark", t === "dark");
    }, []);

    const toggleTheme = () => {
        const n = theme === "light" ? "dark" : "light";
        setTheme(n);
        localStorage.setItem("theme", n);
        document.documentElement.classList.toggle("dark", n === "dark");
    };

    useEffect(() => {
        const u = localStorage.getItem("username");
        if (!u) { router.push("/login"); return; }
        setUsername(u);
    }, []);

    useEffect(() => { if (username) fetchGoals(); }, [username]);

    const fetchGoals = async () => {
        setLoading(true);
        try {
            const r = await fetch(`${API}/api/goals/?username=${username}`);
            const d = await r.json();
            setGoals(d.goals || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const addGoal = async () => {
        const { title, target_amount, monthly_salary, months_target } = form;
        if (!title || !target_amount || !months_target) return alert("Please fill all required fields");
        try {
            const r = await fetch(`${API}/api/goals/add/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username, title,
                    target_amount: +target_amount,
                    monthly_salary: +(monthly_salary || 0),
                    months_target: +months_target,
                }),
            });
            if (r.ok) {
                setForm({ title: "", target_amount: "", monthly_salary: "", months_target: "" });
                setShowForm(false);
                fetchGoals();
            }
        } catch (e) { console.error(e); }
    };

    const deleteGoal = async (id) => {
        if (!confirm("Delete this goal? This cannot be undone.")) return;
        await fetch(`${API}/api/goals/delete/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goal_id: id }),
        });
        fetchGoals();
    };

    // A month is only actionable if ALL previous months are resolved (not pending)
    const isMonthUnlocked = (monthlyData, idx) => {
        for (let i = 0; i < idx; i++) {
            if (monthlyData[i].status === "pending") return false;
        }
        return true;
    };

    const updateMonth = async (goalId, monthIndex, action, actualSaved = null) => {
        const body = { goal_id: goalId, month_index: monthIndex, action };
        if (actualSaved !== null) body.actual_saved = actualSaved;

        try {
            const r = await fetch(`${API}/api/goals/update-month/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const d = await r.json();
            setGoals(prev => prev.map(g =>
                g.id === goalId
                    ? { ...g, monthly_data: d.monthly_data, amount_saved: d.amount_saved, months_done: d.months_done, monthly_saving: d.monthly_saving, is_active: d.is_active }
                    : g
            ));
        } catch {
            // Optimistic client-side fallback
            setGoals(prev => prev.map(g => {
                if (g.id !== goalId) return g;
                const data = g.monthly_data.map(m => ({ ...m }));
                const month = data[monthIndex];

                if (action === "undo") {
                    month.status = "pending";
                    month.actual = 0;
                    // Recalculate remaining amount evenly across this and future pending months
                    const savedSoFar = data.slice(0, monthIndex).reduce((s, m) => s + (m.actual || 0), 0);
                    const remaining = g.target_amount - savedSoFar;
                    const pendingFromHere = data.filter((m, i) => i >= monthIndex && m.status !== "paid" && m.status !== "missed").length;
                    const newPlan = Math.ceil(remaining / Math.max(1, pendingFromHere));
                    data.forEach((m, i) => { if (i >= monthIndex && m.status === "pending") m.planned = newPlan; });
                } else if (action === "paid") {
                    month.status = "paid";
                    month.actual = month.planned;
                } else if (action === "missed" && actualSaved !== null) {
                    const shortfall = month.planned - actualSaved;
                    month.status = "missed";
                    month.actual = actualSaved;
                    const pendingIndices = data.map((m, i) => (i > monthIndex && m.status === "pending" ? i : -1)).filter(i => i !== -1);
                    if (pendingIndices.length > 0) {
                        const extra = Math.ceil(shortfall / pendingIndices.length);
                        pendingIndices.forEach(i => { data[i].planned += extra; });
                    }
                }

                const totalSaved = data.reduce((s, m) => s + (m.actual || 0), 0);
                const monthsDone = data.filter(m => m.status !== "pending").length;
                return { ...g, monthly_data: data, amount_saved: totalSaved, months_done: monthsDone };
            }));
        }

        setMissedInput(prev => {
            const n = { ...prev };
            delete n[`${goalId}_${monthIndex}`];
            return n;
        });
    };

    const undoMonth = async (goalId, monthIndex) => {
        if (!confirm("Undo this month? Amounts will be recalculated for remaining months.")) return;
        await updateMonth(goalId, monthIndex, "undo");
    };

    const fmt = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
    const pct = (saved, target) => Math.min(100, Math.round((saved / target) * 100));
    const calcMonthly = () => {
        const t = +form.target_amount || 0, m = +form.months_target || 1;
        return t > 0 && m > 0 ? Math.round(t / m) : 0;
    };
    const salaryPct = () => {
        if (!form.monthly_salary || +form.monthly_salary === 0) return null;
        return Math.round((calcMonthly() / +form.monthly_salary) * 100);
    };

    const ICONS = ["🚗", "🏠", "✈️", "💍", "📱", "🎓", "💻", "🏖️", "🎯", "🏋️", "🎸", "🛍️"];

    return (
        <div className={theme}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #F8F7F5;
          --bg2:      #EFEFEC;
          --bg3:      #E5E4DF;
          --card:     #FFFFFF;
          --ink:      #1A1A1A;
          --ink2:     #404040;
          --muted:    #737373;
          --faint:    #A3A3A3;
          --border:   #E5E5E5;
          --border2:  #D4D4D4;

          --red:       #DC2626;
          --red-dark:  #B91C1C;
          --red-bg:    #FEF2F2;
          --red-ring:  #FECACA;

          --green:     #15803D;
          --green-bg:  #F0FDF4;
          --green-ring:#BBF7D0;

          --amber:     #B45309;
          --amber-bg:  #FFFBEB;
          --amber-ring:#FDE68A;

          --blue:      #1D4ED8;
          --blue-bg:   #EFF6FF;
          --blue-ring: #BFDBFE;

          --r:    12px;
          --r-sm: 8px;
          --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

          --sh0: 0 1px 2px rgba(0,0,0,.05);
          --sh1: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
          --sh2: 0 4px 8px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
          --sh3: 0 12px 24px rgba(0,0,0,.09), 0 4px 8px rgba(0,0,0,.04);
        }

        .dark {
          --bg:   #111111;
          --bg2:  #1C1C1C;
          --bg3:  #262626;
          --card: #1A1A1A;
          --ink:  #F5F5F5;
          --ink2: #E5E5E5;
          --muted: #A3A3A3;
          --faint: #525252;
          --border:  #2A2A2A;
          --border2: #3A3A3A;
          --red:       #EF4444;
          --red-dark:  #DC2626;
          --red-bg:    rgba(239,68,68,.08);
          --red-ring:  rgba(239,68,68,.25);
          --green:     #22C55E;
          --green-bg:  rgba(34,197,94,.07);
          --green-ring:rgba(34,197,94,.25);
          --amber:     #F59E0B;
          --amber-bg:  rgba(245,158,11,.07);
          --amber-ring:rgba(245,158,11,.25);
          --blue:      #60A5FA;
          --blue-bg:   rgba(96,165,250,.07);
          --blue-ring: rgba(96,165,250,.25);
          --sh0: 0 1px 2px rgba(0,0,0,.4);
          --sh1: 0 1px 3px rgba(0,0,0,.5);
          --sh2: 0 4px 8px rgba(0,0,0,.5);
          --sh3: 0 12px 24px rgba(0,0,0,.6);
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--bg); color: var(--ink);
          font-family: var(--font); font-size: 14px; line-height: 1.5;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh; transition: background .2s, color .2s;
        }

        /* NAV */
        .nav {
          position: sticky; top: 0; z-index: 50;
          height: 56px; padding: 0 20px;
          display: flex; align-items: center; justify-content: space-between;
          background: var(--card); border-bottom: 1px solid var(--border);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 700; color: var(--ink); text-decoration: none;
        }
        .logo-mark {
          width: 28px; height: 28px; border-radius: 7px;
          background: var(--red);
          color: #fff; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(220,38,38,.3);
        }
        .nav-end { display: flex; align-items: center; gap: 4px; }
        .nav-link {
          font-size: 13px; font-weight: 500; color: var(--muted);
          text-decoration: none; padding: 6px 10px; border-radius: 7px;
          transition: color .15s, background .15s;
        }
        .nav-link:hover { color: var(--ink); background: var(--bg2); }
        .nav-link.active { color: var(--ink); background: var(--bg2); font-weight: 600; }
        .icon-btn {
          width: 32px; height: 32px; border-radius: 7px;
          background: var(--bg2); border: 1px solid var(--border);
          color: var(--ink); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: background .15s; margin-left: 8px;
        }
        .icon-btn:hover { background: var(--bg3); }

        /* PAGE */
        .page { max-width: 780px; margin: 0 auto; padding: 32px 20px 80px; }

        /* HEADER ROW */
        .header-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; margin-bottom: 24px;
        }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -.4px; color: var(--ink); }
        .page-title span { color: var(--red); }
        .page-sub { font-size: 13px; color: var(--muted); margin-top: 3px; }

        /* STATS */
        .stats { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .stat-pill {
          flex: 1; min-width: 120px;
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--r); padding: 14px 16px;
          box-shadow: var(--sh0);
        }
        .stat-label { font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 700; color: var(--ink); letter-spacing: -.4px; }
        .stat-value.c-red { color: var(--red); }
        .stat-value.c-green { color: var(--green); }

        /* ADD BTN */
        .btn-add {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600;
          background: var(--red); color: #fff;
          border: none; cursor: pointer;
          padding: 9px 16px; border-radius: 9px;
          box-shadow: 0 1px 4px rgba(220,38,38,.25);
          transition: background .15s, transform .15s, box-shadow .15s;
          white-space: nowrap;
        }
        .btn-add:hover { background: var(--red-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(220,38,38,.3); }

        /* FORM CARD */
        .form-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--r); padding: 20px;
          margin-bottom: 20px; box-shadow: var(--sh2);
          animation: fadeDown .2s ease both;
        }
        .form-title { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 16px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field.full { grid-column: 1 / -1; }
        .field-lbl { font-size: 12px; font-weight: 600; color: var(--muted); }
        .field-inp {
          background: var(--bg2); border: 1px solid var(--border2);
          color: var(--ink); font-family: var(--font); font-size: 14px;
          border-radius: var(--r-sm); padding: 9px 12px;
          outline: none; transition: border-color .15s, box-shadow .15s, background .15s;
        }
        .field-inp::placeholder { color: var(--faint); }
        .field-inp:focus { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-bg); background: var(--card); }

        .calc-box {
          background: var(--red-bg); border: 1px solid var(--red-ring);
          border-radius: var(--r-sm); padding: 12px 14px; margin-bottom: 12px;
          font-size: 13px; color: var(--ink2);
        }
        .calc-row { display: flex; justify-content: space-between; align-items: center; }
        .calc-big { font-size: 16px; font-weight: 700; color: var(--red); }
        .salary-track { height: 4px; background: var(--border); border-radius: 100px; margin-top: 8px; overflow: hidden; }
        .salary-fill { height: 100%; border-radius: 100px; background: var(--red); transition: width .4s; }

        .form-footer { display: flex; gap: 8px; justify-content: flex-end; }
        .btn-ghost {
          background: none; border: 1px solid var(--border2); color: var(--muted);
          font-family: var(--font); font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 8px 14px; border-radius: 8px; transition: all .15s;
        }
        .btn-ghost:hover { color: var(--ink); border-color: var(--ink2); background: var(--bg2); }
        .btn-primary {
          background: var(--red); border: none; color: #fff;
          font-family: var(--font); font-size: 13px; font-weight: 600;
          cursor: pointer; padding: 8px 18px; border-radius: 8px;
          box-shadow: 0 1px 4px rgba(220,38,38,.2); transition: background .15s;
        }
        .btn-primary:hover { background: var(--red-dark); }

        /* GOAL CARD */
        .goal-card {
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--r); margin-bottom: 10px;
          box-shadow: var(--sh0); overflow: hidden;
          transition: box-shadow .2s;
          animation: fadeUp .3s ease both;
        }
        .goal-card:hover { box-shadow: var(--sh1); }

        .goal-head {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 18px; cursor: pointer; user-select: none;
        }
        .goal-emoji {
          width: 44px; height: 44px; flex-shrink: 0;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 11px; display: flex; align-items: center; justify-content: center;
          font-size: 20px;
        }
        .goal-body { flex: 1; min-width: 0; }
        .goal-name { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .goal-meta { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
        .goal-meta b { color: var(--ink2); font-weight: 600; }
        .goal-meta .missed-warn { color: var(--amber); margin-left: 6px; }

        .prog-track { height: 6px; background: var(--bg3); border-radius: 100px; overflow: hidden; }
        .prog-fill { height: 100%; border-radius: 100px; background: var(--red); transition: width .7s cubic-bezier(.16,1,.3,1); }
        .prog-fill.done { background: var(--green); }

        .prog-footer { display: flex; justify-content: space-between; margin-top: 4px; }
        .prog-label { font-size: 11px; color: var(--muted); }

        .pip-row { display: flex; gap: 3px; margin-top: 6px; flex-wrap: wrap; }
        .pip { height: 4px; flex: 1; min-width: 6px; max-width: 18px; border-radius: 2px; }
        .pip.paid { background: var(--green); }
        .pip.missed { background: var(--amber); }
        .pip.pending { background: var(--bg3); border: 1px solid var(--border2); }

        .goal-tail { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .pct-badge { font-size: 15px; font-weight: 700; min-width: 42px; text-align: right; }
        .del-btn {
          width: 28px; height: 28px; border-radius: 7px;
          background: none; border: none;
          color: var(--faint); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: all .15s;
        }
        .del-btn:hover { color: var(--red); background: var(--red-bg); }
        .chev { font-size: 10px; color: var(--muted); transition: transform .2s; }
        .chev.open { transform: rotate(180deg); }

        /* CHECKLIST */
        .checklist { border-top: 1px solid var(--border); }
        .checklist-body { padding: 10px; display: flex; flex-direction: column; gap: 5px; }

        .month-row {
          display: grid;
          grid-template-columns: 48px 1fr 88px 28px 152px;
          gap: 8px; align-items: center;
          padding: 10px 12px; border-radius: 9px;
          border: 1px solid var(--border); background: var(--bg);
          transition: background .15s, border-color .15s;
        }
        .month-row.s-paid    { background: var(--green-bg); border-color: var(--green-ring); }
        .month-row.s-missed  { background: var(--amber-bg); border-color: var(--amber-ring); }
        .month-row.s-pending { background: var(--bg); border-color: var(--border); }
        .month-row.s-locked  { background: var(--bg2); border-color: transparent; opacity: .45; pointer-events: none; }

        .m-num { font-size: 11px; font-weight: 700; color: var(--muted); }
        .m-info { font-size: 13px; color: var(--ink2); }
        .m-info .m-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }
        .m-amt { font-size: 13px; font-weight: 700; text-align: right; }
        .m-amt.c-green { color: var(--green); }
        .m-amt.c-amber { color: var(--amber); }
        .m-ico { font-size: 14px; text-align: center; }

        .m-acts { display: flex; gap: 5px; }
        .act-btn {
          flex: 1; font-family: var(--font); font-size: 12px; font-weight: 600;
          border-radius: 7px; padding: 5px 6px; cursor: pointer;
          transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 3px;
          white-space: nowrap;
        }
        .act-green { background: var(--green-bg); border: 1px solid var(--green-ring); color: var(--green); }
        .act-green:hover { background: var(--green); color: #fff; border-color: var(--green); }
        .act-amber { background: var(--amber-bg); border: 1px solid var(--amber-ring); color: var(--amber); }
        .act-amber:hover { background: var(--amber); color: #fff; border-color: var(--amber); }
        .act-undo  { background: var(--blue-bg);  border: 1px solid var(--blue-ring);  color: var(--blue);  font-size: 11px; }
        .act-undo:hover  { background: var(--blue);  color: #fff; border-color: var(--blue); }
        .locked-hint { font-size: 11px; color: var(--faint); font-style: italic; }

        /* MISSED INLINE FORM */
        .missed-form {
          margin-top: 4px;
          background: var(--amber-bg); border: 1px solid var(--amber-ring);
          border-radius: 9px; padding: 12px 14px;
          display: flex; flex-direction: column; gap: 8px;
          animation: fadeDown .18s ease both;
        }
        .missed-form-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
        .missed-q { font-size: 13px; font-weight: 500; color: var(--amber); flex-shrink: 0; }
        .missed-inp {
          background: var(--card); border: 1px solid var(--amber-ring);
          color: var(--ink); font-family: var(--font); font-size: 14px;
          border-radius: 7px; padding: 6px 10px; outline: none;
          width: 130px; transition: border-color .15s;
        }
        .missed-inp:focus { border-color: var(--amber); }
        .btn-confirm {
          background: var(--amber); border: none; color: #fff;
          font-family: var(--font); font-size: 13px; font-weight: 600;
          cursor: pointer; padding: 7px 14px; border-radius: 7px; transition: filter .15s;
        }
        .btn-confirm:hover { filter: brightness(1.1); }
        .redist-hint { font-size: 12px; color: var(--muted); line-height: 1.5; }
        .redist-hint b { color: var(--ink2); }
        .redist-hint.c-green { color: var(--green); }
        .redist-hint.c-red { color: var(--red); }

        /* CHECKLIST FOOTER */
        .cl-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 14px 14px; font-size: 13px; color: var(--muted);
          border-top: 1px dashed var(--border);
        }
        .cl-footer b { color: var(--ink2); font-weight: 600; }
        .complete-banner {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          margin: 0 10px 10px; padding: 10px;
          background: var(--green-bg); border: 1px solid var(--green-ring);
          border-radius: 9px; font-size: 13px; font-weight: 600; color: var(--green);
        }

        /* EMPTY */
        .empty { text-align: center; padding: 64px 24px; animation: fadeUp .4s ease both; }
        .empty-icon {
          width: 68px; height: 68px; border-radius: 50%;
          background: var(--red-bg); border: 2px dashed var(--red-ring);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin: 0 auto 16px;
        }
        .empty-title { font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: var(--muted); }

        /* SKELETON */
        .skel {
          height: 82px; border-radius: var(--r); margin-bottom: 10px;
          background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%);
          background-size: 200%; animation: shimmer 1.4s infinite;
        }

        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px);  } to { opacity:1; transform:translateY(0); } }

        @media (max-width: 580px) {
          .nav { padding: 0 14px; }
          .page { padding: 24px 14px 60px; }
          .form-grid { grid-template-columns: 1fr; }
          .month-row { grid-template-columns: 42px 1fr 74px 24px auto; gap: 6px; }
          .stats { flex-direction: column; }
          .nav-link:not(.active) { display: none; }
        }
      `}</style>

            {/* ── NAV ── */}
            <nav className="nav">
                <Link href="/" className="nav-logo">
                    <div className="logo-mark">F</div>
                    PocketPilot
                </Link>
                <div className="nav-end">
                    <Link href="/dashboard" className="nav-link">Dashboard</Link>
                    <Link href="/logs" className="nav-link">Logs</Link>
                    <Link href="/investments" className="nav-link">Investments</Link>
                    <Link href="/goals" className="nav-link active">Goals</Link>
                    <Link href="/salary" className="nav-link">Smart Investment</Link>
                    <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                </div>
            </nav>

            <main className="page">

                {/* ── HEADER ── */}
                <div className="header-row">
                    <div>
                        <h1 className="page-title">Saving <span>Goals</span></h1>
                        <p className="page-sub">Track monthly progress toward every financial target.</p>
                    </div>
                    <button className="btn-add" onClick={() => setShowForm(f => !f)}>
                        {showForm ? "✕ Cancel" : "+ New Goal"}
                    </button>
                </div>

                {/* ── STATS ── */}
                {goals.length > 0 && (
                    <div className="stats">
                        <div className="stat-pill">
                            <div className="stat-label">Goals</div>
                            <div className="stat-value c-red">{goals.length}</div>
                        </div>
                        <div className="stat-pill">
                            <div className="stat-label">Total Saved</div>
                            <div className="stat-value c-green">{fmt(goals.reduce((s, g) => s + (g.amount_saved || 0), 0))}</div>
                        </div>
                        <div className="stat-pill">
                            <div className="stat-label">Total Target</div>
                            <div className="stat-value">{fmt(goals.reduce((s, g) => s + (g.target_amount || 0), 0))}</div>
                        </div>
                    </div>
                )}

                {/* ── FORM ── */}
                {showForm && (
                    <div className="form-card">
                        <div className="form-title">🎯 Create a New Goal</div>
                        <div className="form-grid">
                            <div className="field full">
                                <label className="field-lbl">Goal Title *</label>
                                <input className="field-inp" placeholder='e.g. "Buy a Car", "Emergency Fund"'
                                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                            </div>
                            <div className="field">
                                <label className="field-lbl">Target Amount (₹) *</label>
                                <input className="field-inp" type="number" placeholder="500000"
                                    value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
                            </div>
                            <div className="field">
                                <label className="field-lbl">Months to Achieve *</label>
                                <input className="field-inp" type="number" placeholder="12"
                                    value={form.months_target} onChange={e => setForm(f => ({ ...f, months_target: e.target.value }))} />
                            </div>
                            <div className="field full">
                                <label className="field-lbl">Monthly Salary (₹) — optional, for % insight</label>
                                <input className="field-inp" type="number" placeholder="80000"
                                    value={form.monthly_salary} onChange={e => setForm(f => ({ ...f, monthly_salary: e.target.value }))} />
                            </div>
                        </div>

                        {calcMonthly() > 0 && (
                            <div className="calc-box">
                                <div className="calc-row">
                                    <span>Save <span className="calc-big">{fmt(calcMonthly())}/mo</span> for {form.months_target} month{+form.months_target !== 1 ? "s" : ""}</span>
                                    {salaryPct() !== null && <span style={{ fontWeight: 700, color: "var(--red)" }}>{salaryPct()}% of salary</span>}
                                </div>
                                {salaryPct() !== null && (
                                    <div className="salary-track">
                                        <div className="salary-fill" style={{ width: `${Math.min(100, salaryPct())}%` }} />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="form-footer">
                            <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="btn-primary" onClick={addGoal}>Create Goal →</button>
                        </div>
                    </div>
                )}

                {/* ── LOADING ── */}
                {loading && [0, 1, 2].map(i => <div key={i} className="skel" style={{ animationDelay: `${i * .1}s` }} />)}

                {/* ── EMPTY ── */}
                {!loading && goals.length === 0 && !showForm && (
                    <div className="empty">
                        <div className="empty-icon">🎯</div>
                        <div className="empty-title">No goals yet</div>
                        <p className="empty-sub">Create your first saving goal to get a personalised monthly plan.</p>
                    </div>
                )}

                {/* ── GOAL CARDS ── */}
                {goals.map((goal, gi) => {
                    const progress = pct(goal.amount_saved, goal.target_amount);
                    const remaining = goal.months_target - goal.months_done;
                    const isExpanded = expandedGoal === goal.id;
                    const monthlyData = goal.monthly_data || [];
                    const missedCount = monthlyData.filter(m => m.status === "missed").length;
                    const pctColor = progress >= 100 ? "var(--green)" : progress >= 60 ? "var(--ink)" : "var(--red)";

                    return (
                        <div className="goal-card" key={goal.id} style={{ animationDelay: `${gi * .06}s` }}>
                            {/* HEADER */}
                            <div className="goal-head" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}>
                                <div className="goal-emoji">{ICONS[gi % ICONS.length]}</div>
                                <div className="goal-body">
                                    <div className="goal-name">{goal.title}</div>
                                    <div className="goal-meta">
                                        <b>{fmt(goal.amount_saved)}</b> saved of {fmt(goal.target_amount)} · {fmt(goal.monthly_saving)}/mo
                                        {missedCount > 0 && <span className="missed-warn">· ⚠️ {missedCount} missed</span>}
                                    </div>
                                    <div className="prog-track">
                                        <div className={`prog-fill${progress >= 100 ? " done" : ""}`} style={{ width: `${progress}%` }} />
                                    </div>
                                    <div className="prog-footer">
                                        <span className="prog-label">{goal.months_done} / {goal.months_target} months done</span>
                                        {remaining > 0 && <span className="prog-label">{remaining} remaining</span>}
                                    </div>
                                    <div className="pip-row">
                                        {monthlyData.map((m, i) => (
                                            <div key={i} className={`pip ${m.status}`} title={`Month ${m.month}: ${m.status}`} />
                                        ))}
                                    </div>
                                </div>
                                <div className="goal-tail">
                                    <span className="pct-badge" style={{ color: pctColor }}>{progress}%</span>
                                    <button className="del-btn" onClick={e => { e.stopPropagation(); deleteGoal(goal.id); }} title="Delete">🗑</button>
                                    <span className={`chev${isExpanded ? " open" : ""}`}>▼</span>
                                </div>
                            </div>

                            {/* CHECKLIST */}
                            {isExpanded && (
                                <div className="checklist">
                                    <div className="checklist-body">
                                        {monthlyData.map((m, idx) => {
                                            const key = `${goal.id}_${idx}`;
                                            const isPaid = m.status === "paid";
                                            const isMissed = m.status === "missed";
                                            const isPending = m.status === "pending";
                                            const unlocked = isMonthUnlocked(monthlyData, idx);
                                            const showMF = missedInput[key] !== undefined;
                                            const isLocked = isPending && !unlocked;

                                            // Live redistribution preview
                                            const inputAmt = +(missedInput[key] || 0);
                                            const shortfall = m.planned - inputAmt;
                                            const pendingAfter = monthlyData.filter((mm, ii) => ii > idx && mm.status === "pending").length;
                                            const redistAmt = pendingAfter > 0 ? Math.ceil(shortfall / pendingAfter) : 0;

                                            const rowState = isLocked ? "locked" : m.status;

                                            return (
                                                <div key={idx}>
                                                    <div className={`month-row s-${rowState}`}>
                                                        <div className="m-num">Mo. {m.month}</div>
                                                        <div className="m-info">
                                                            {isPaid && <div>Saved in full</div>}
                                                            {isMissed && <>
                                                                <div>Partial</div>
                                                                <div className="m-sub">{fmt(m.actual)} of {fmt(m.planned)} planned</div>
                                                            </>}
                                                            {isPending && !isLocked && <div>Plan: {fmt(m.planned)}</div>}
                                                            {isLocked && <>
                                                                <div>Locked</div>
                                                                <div className="m-sub">Complete month {idx} first</div>
                                                            </>}
                                                        </div>
                                                        <div className={`m-amt${isPaid ? " c-green" : isMissed ? " c-amber" : ""}`}>
                                                            {isPaid ? fmt(m.actual) : isMissed ? fmt(m.actual) : fmt(m.planned)}
                                                        </div>
                                                        <div className="m-ico">
                                                            {isPaid ? "✅" : isMissed ? "⚠️" : isLocked ? "🔒" : "⏳"}
                                                        </div>
                                                        <div className="m-acts">
                                                            {isPending && unlocked && !showMF && <>
                                                                <button className="act-btn act-green" onClick={() => updateMonth(goal.id, idx, "paid")}>✓ Paid</button>
                                                                <button className="act-btn act-amber" onClick={() => setMissedInput(p => ({ ...p, [key]: "" }))}>✗ Missed</button>
                                                            </>}
                                                            {(isPaid || isMissed) && (
                                                                <button className="act-btn act-undo" onClick={() => undoMonth(goal.id, idx)}>↩ Undo</button>
                                                            )}
                                                            {isLocked && <span className="locked-hint">Complete previous month</span>}
                                                        </div>
                                                    </div>

                                                    {/* MISSED FORM */}
                                                    {isPending && showMF && (
                                                        <div className="missed-form">
                                                            <div className="missed-form-row">
                                                                <span className="missed-q">How much did you actually save?</span>
                                                                <input
                                                                    className="missed-inp" type="number"
                                                                    placeholder={`0 – ${Math.round(m.planned)}`}
                                                                    value={missedInput[key]}
                                                                    onChange={e => setMissedInput(p => ({ ...p, [key]: e.target.value }))}
                                                                    autoFocus
                                                                />
                                                                <button className="btn-confirm" onClick={() => updateMonth(goal.id, idx, "missed", inputAmt)}>
                                                                    Confirm →
                                                                </button>
                                                                <button className="btn-ghost" style={{ fontSize: "12px", padding: "6px 12px" }}
                                                                    onClick={() => setMissedInput(p => { const n = { ...p }; delete n[key]; return n; })}>
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                            {inputAmt >= m.planned && (
                                                                <div className="redist-hint c-green">✅ Amount meets or exceeds plan — will be marked as fully paid.</div>
                                                            )}
                                                            {inputAmt > 0 && shortfall > 0 && pendingAfter > 0 && (
                                                                <div className="redist-hint">
                                                                    Shortfall of <b>{fmt(shortfall)}</b> will be spread across <b>{pendingAfter} remaining month{pendingAfter > 1 ? "s" : ""}</b> — each increases by <b>{fmt(redistAmt)}/mo</b>.
                                                                </div>
                                                            )}
                                                            {inputAmt > 0 && shortfall > 0 && pendingAfter === 0 && (
                                                                <div className="redist-hint c-red">⚠️ No remaining months — you will fall short of your goal.</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* FOOTER */}
                                    {progress < 100 && remaining > 0 && (
                                        <div className="cl-footer">
                                            <span>{remaining} month{remaining !== 1 ? "s" : ""} remaining</span>
                                            <span><b>{fmt(goal.target_amount - goal.amount_saved)}</b> left to save</span>
                                        </div>
                                    )}
                                    {progress >= 100 && (
                                        <div className="complete-banner">🎉 Goal achieved! You saved {fmt(goal.amount_saved)}.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </main>
        </div>
    );
}
