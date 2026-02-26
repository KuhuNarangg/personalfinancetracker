"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* ─── Animated Counter ───────────────────────────── */
function Counter({ value, duration = 900 }) {
    const [display, setDisplay] = useState(0);
    const prev = useRef(0);
    useEffect(() => {
        const start = prev.current;
        const end = Number(value) || 0;
        if (start === end) return;
        let s = null;
        const step = (ts) => {
            if (!s) s = ts;
            const p = Math.min((ts - s) / duration, 1);
            setDisplay(Math.floor(start + (1 - Math.pow(1 - p, 3)) * (end - start)));
            if (p < 1) requestAnimationFrame(step);
            else prev.current = end;
        };
        requestAnimationFrame(step);
    }, [value]);
    return <>₹{display.toLocaleString("en-IN")}</>;
}

/* ─── Mini Donut ─────────────────────────────────── */
function MiniDonut({ data, size = 96 }) {
    const r = 36, cx = 48, cy = 48;
    const circ = 2 * Math.PI * r;
    const total = data.reduce((a, b) => a + b.v, 0);
    const COLS = ["#d94f3d", "#e8604e", "#c1121f", "#ff7a6a", "#a8201a", "#f28b7d"];
    let off = 0;
    return (
        <svg width={size} height={size} viewBox="0 0 96 96">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(26,23,20,0.06)" strokeWidth="13" />
            {data.map((d, i) => {
                const dash = total ? (d.v / total) * circ : 0;
                const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={COLS[i % COLS.length]} strokeWidth="13"
                    strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "48px 48px", transition: "stroke-dasharray .7s cubic-bezier(.16,1,.3,1)" }} />;
                off += dash;
                return el;
            })}
        </svg>
    );
}

/* ─── Spark Bars ─────────────────────────────────── */
function SparkBars({ data, highlight = -1 }) {
    const max = Math.max(...data.map(d => d.v), 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "56px" }}>
            {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                    <div style={{
                        width: "100%", borderRadius: "3px 3px 0 0",
                        height: `${Math.max((d.v / max) * 42, d.v > 0 ? 7 : 2)}px`,
                        background: i === highlight ? "#d94f3d" : "rgba(217,79,61,0.15)",
                        transition: "height .5s cubic-bezier(.16,1,.3,1)",
                        boxShadow: i === highlight ? "0 0 8px rgba(217,79,61,.4)" : "none",
                    }} />
                    <span style={{ fontSize: "0.52rem", color: i === highlight ? "#d94f3d" : "#a09080", fontFamily: "Outfit,sans-serif", fontWeight: i === highlight ? 600 : 400 }}>
                        {d.l}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ─── Progress Ring ──────────────────────────────── */
function Ring({ pct, size = 52 }) {
    const r = (size - 5) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (Math.min(pct, 100) / 100) * circ;
    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(217,79,61,0.1)" strokeWidth="5" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d94f3d" strokeWidth="5"
                strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray .8s cubic-bezier(.16,1,.3,1)" }} />
        </svg>
    );
}

const CAT_COLS = ["#d94f3d", "#e8604e", "#c1121f", "#ff7a6a", "#a8201a", "#f28b7d"];
const TABS = ["Daily", "Weekly", "Monthly", "Subscriptions", "SIPs & EMIs"];
const sum = arr => arr.reduce((a, b) => a + Number(b.amount), 0);

function getIcon(cat = "") {
    const c = cat.toLowerCase();
    if (c.includes("stream") || c.includes("music") || c.includes("netflix")) return "🎵";
    if (c.includes("food") || c.includes("eat")) return "🍜";
    if (c.includes("cloud") || c.includes("storage")) return "☁️";
    if (c.includes("gym") || c.includes("health")) return "💪";
    if (c.includes("game")) return "🎮";
    if (c.includes("learn") || c.includes("edu")) return "📚";
    if (c.includes("invest") || c.includes("sip")) return "📈";
    return "↻";
}

/* ─── DASHBOARD ──────────────────────────────────── */
export default function Dashboard() {
    const [username, setUsername] = useState("");
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("Daily");
    const [requesting, setRequesting] = useState(false);
    const [theme, setTheme] = useState("light");
    const router = useRouter();

    // ── Add Expense Modal ──────────────────────────────
    const [showModal, setShowModal] = useState(false);
    const [modalForm, setModalForm] = useState({ title: "", amount: "", category: "", type: "expense", billing_day: "", billing_period: "monthly", custom_months: "", entry_date: "" });
    const [modalSaving, setModalSaving] = useState(false);
    const [modalToast, setModalToast] = useState(null);
    const resetModal = () => setModalForm({ title: "", amount: "", category: "", type: "expense", billing_day: "", billing_period: "monthly", custom_months: "", entry_date: "" });
    const openModal = () => { resetModal(); setShowModal(true); };
    const closeModal = () => { setShowModal(false); resetModal(); };

    const handleModalSave = async (e) => {
        e.preventDefault();
        if (!modalForm.title || !modalForm.amount) return;
        setModalSaving(true);
        const resolvedPeriod = modalForm.billing_period === "custom"
            ? (modalForm.custom_months ? `${modalForm.custom_months}months` : "monthly")
            : modalForm.billing_period;
        try {
            await fetch("http://127.0.0.1:8000/api/add-expense/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...modalForm, username, expense_type: modalForm.type, billing_period: resolvedPeriod }),
            });
            setModalToast("Entry saved! ✓");
            setTimeout(() => setModalToast(null), 2500);
            resetModal();
            load(); // refresh dashboard numbers
        } catch { setModalToast("Save failed ✕"); setTimeout(() => setModalToast(null), 2500); }
        finally { setModalSaving(false); }
    };

    // ── Sidebar collapse ─────────────
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
    useEffect(() => { if (username) load(); }, [username]);

    const load = async () => {
        setLoading(true);
        try {
            const r = await fetch("http://127.0.0.1:8000/api/get-expenses/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const d = await r.json();
            setExpenses(d.expenses || []);
        } catch { }
        finally { setLoading(false); }
    };

    const handleRequestStatement = async () => {
        setRequesting(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/request-statement/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Statement request sent successfully! Check your email.");
            } else {
                alert(data.error || "Failed to request statement.");
            }
        } catch (err) {
            alert("Something went wrong.");
        } finally {
            setRequesting(false);
        }
    };

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const weekAgo = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);
    const yesterStr = new Date(now - 86400000).toISOString().slice(0, 10);

    const regular = expenses.filter(e => !e.expense_type || e.expense_type === "expense");
    const subs = expenses.filter(e => e.expense_type === "subscription");
    const sips = expenses.filter(e => e.expense_type === "sip");
    const emis = expenses.filter(e => e.expense_type === "emi");

    const todayExp = regular.filter(e => (e.date || "").slice(0, 10) === todayStr);
    const weekExp = regular.filter(e => (e.date || "").slice(0, 10) >= weekAgo);
    const activeRecurring = expenses.filter(e => e.expense_type && e.expense_type !== "expense" && e.is_active !== false);
    const monthExp = [
        ...regular.filter(e => (e.date || "").slice(0, 7) === monthStr),
        ...activeRecurring
    ];

    const todayTotal = sum(todayExp);
    const weekTotal = sum(weekExp);
    const monthTotal = sum(monthExp);
    const subTotal = sum(subs.filter(e => e.is_active !== false));
    const sipTotal = sum(sips.filter(e => e.is_active !== false));
    const emiTotal = sum(emis.filter(e => e.is_active !== false));
    const recurringTotal = subTotal + sipTotal + emiTotal;

    const visExp = tab === "Daily" ? todayExp : tab === "Weekly" ? weekExp : monthExp;
    const tabLogs = tab === "Daily" ? todayExp : tab === "Weekly" ? weekExp : regular.filter(e => (e.date || "").slice(0, 7) === monthStr);
    const visTotal = sum(visExp);
    const catMap = {};
    visExp.forEach(e => { const k = e.category || "Other"; catMap[k] = (catMap[k] || 0) + Number(e.amount); });
    const catData = Object.entries(catMap).map(([k, v]) => ({ k, v }));

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const weekBars = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i));
        return { v: sum(regular.filter(e => (e.date || "").slice(0, 10) === d.toISOString().slice(0, 10))), l: dayNames[d.getDay()] };
    });
    const monthBars = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const pastRegular = sum(regular.filter(e => (e.date || "").slice(0, 7) === d.toISOString().slice(0, 7)));
        return { v: pastRegular + recurringTotal, l: d.toLocaleString("en-IN", { month: "short" }) };
    }).reverse();

    const CatPanel = () => (
        <div className="panel">
            <div className="panel-hd">
                <span className="panel-title">By Category</span>
                <span className="panel-tag">{catData.length} cats</span>
            </div>
            <div className="panel-body">
                {catData.length > 0 ? (<>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <MiniDonut data={catData} size={96} />
                    </div>
                    <div className="cat-list">
                        {catData.map((c, i) => (
                            <div key={i}>
                                <div className="cat-row">
                                    <div className="cat-dot" style={{ background: CAT_COLS[i % CAT_COLS.length] }} />
                                    <span className="cat-name">{c.k}</span>
                                    <span className="cat-pct">{visTotal ? Math.round((c.v / visTotal) * 100) : 0}%</span>
                                    <span className="cat-amt">₹{c.v.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="cat-track">
                                    <div className="cat-fill" style={{ width: `${visTotal ? (c.v / visTotal) * 100 : 0}%`, background: CAT_COLS[i % CAT_COLS.length] }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </>) : (
                    <div className="empty"><span className="empty-ico">📊</span><div className="empty-t">No data yet</div></div>
                )}
            </div>
        </div>
    );

    return (
        <div className={theme}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#f5f2ed;--bg2:#edeae3;--bg3:#e5e0d8;
          --card-bg:#fff;
          --ink:#1a1714;--muted:#7a7368;--faint:#b0a898;
          --red:#d94f3d;--red2:#e8604e;
          --red-glow:rgba(217,79,61,.2);--red-soft:rgba(217,79,61,.07);
          --border:rgba(26,23,20,.09);
          --fh:'Plus Jakarta Sans',sans-serif;--fb:'Outfit',sans-serif;
          --rad:14px;--rads:9px;
        }
        .dark {
          --bg: #0d0d0d; --bg2: #1a1a1a; --bg3: #242424;
          --card-bg: #181818;
          --ink: #f0ede8; --muted: #9e9690; --faint: #6a6460;
          --red: #e05a48; --red2: #f07060;
          --red-glow: rgba(224,90,72,.25); --red-soft: rgba(224,90,72,.1);
          --border: rgba(255,255,255,0.07);
          --nav-bg: rgba(13,13,13,0.96); --sidebar-bg: #111111;
        }
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--ink);font-family:var(--fb);-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}

        /* THEME BTN */
        .btn-theme{background:none;border:1px solid var(--border);color:var(--ink);font-size:1rem;cursor:pointer;width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;transition:all .2s;}
        .btn-theme:hover{background:var(--bg2);}

        /* NAV */
        .nav{
          position:sticky;top:0;z-index:200;
          background:var(--nav-bg, rgba(245,242,237,.94));backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
          height:62px;display:flex;align-items:center;justify-content:space-between;
          padding:0 2rem;gap:1rem;
          animation:slideDown .5s ease both;
          transition: background 0.3s, border-color 0.3s;
        }
        .nav-left{display:flex;align-items:center;gap:2rem}
        .nav-logo{font-family:var(--fh);font-size:.95rem;font-weight:800;letter-spacing:-.3px;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:.55rem}
        .logo-sq{width:30px;height:30px;border-radius:8px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:800;color:#fff;box-shadow:0 3px 12px var(--red-glow);transition:transform .2s,box-shadow .2s}
        .nav-logo:hover .logo-sq{transform:scale(1.08);box-shadow:0 5px 18px var(--red-glow)}
        .nav-links{display:flex;align-items:center;gap:.2rem}
        .nav-link{font-family:var(--fb);font-size:.88rem;font-weight:400;color:var(--muted);padding:.38rem .85rem;border-radius:8px;text-decoration:none;transition:all .18s;border:none;background:none;cursor:pointer;white-space:nowrap}
        .nav-link:hover{color:var(--ink);background:var(--bg2)}
        .nav-link.cur{color:var(--ink);font-weight:600;background:var(--bg2)}
        .nav-right{display:flex;align-items:center;gap:.75rem}
        .nav-greet{font-family:var(--fb);font-size:.9rem;color:var(--muted);white-space:nowrap}
        .nav-greet strong{color:var(--ink);font-weight:600}
        .btn-add{font-family:var(--fh);font-size:.82rem;font-weight:600;color:#fff;background:var(--red);border:none;cursor:pointer;padding:.5rem 1.1rem;border-radius:9px;display:flex;align-items:center;gap:.4rem;box-shadow:0 2px 12px var(--red-glow);transition:all .2s;white-space:nowrap}
        .btn-add:hover{background:var(--red2);transform:translateY(-1px);box-shadow:0 5px 18px var(--red-glow)}

        /* MODAL FORM INPUTS */
        .m-lbl{display:block;font-family:var(--fb);font-size:.75rem;font-weight:600;color:var(--muted);margin-bottom:.4rem}
        .m-inp{width:100%;background:var(--bg2,#f0ede8);border:1.5px solid var(--border);color:var(--ink);font-family:var(--fb);font-size:.9rem;border-radius:10px;padding:.72rem .9rem;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
        .m-inp::placeholder{color:var(--muted);opacity:.6}
        .m-inp:focus{border-color:var(--red);box-shadow:0 0 0 3px var(--red-soft,rgba(217,79,61,.08))}

        /* PROMINENT ADD CTA */
        .add-cta-wrap{display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,var(--red),var(--red2));border-radius:14px;padding:1rem 1.4rem;margin-bottom:1.5rem;gap:1rem;box-shadow:0 8px 28px var(--red-glow)}
        .add-cta-left{display:flex;flex-direction:column;gap:.2rem}
        .add-cta-title{font-family:var(--fh);font-size:.95rem;font-weight:700;color:#fff;letter-spacing:-.2px}
        .add-cta-sub{font-family:var(--fb);font-size:.8rem;color:rgba(255,255,255,.8)}
        .add-cta-btn{background:#fff;color:var(--red);font-family:var(--fh);font-size:.82rem;font-weight:700;border:none;cursor:pointer;padding:.6rem 1.25rem;border-radius:9px;white-space:nowrap;transition:all .2s;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.12)}
        .add-cta-btn:hover{transform:scale(1.04);box-shadow:0 4px 16px rgba(0,0,0,.18)}
        .btn-logout{font-family:var(--fb);font-size:.88rem;color:var(--muted);background:none;border:1px solid var(--border);border-radius:8px;padding:.42rem .9rem;cursor:pointer;transition:all .2s}
        .btn-logout:hover{color:var(--ink);border-color:rgba(26,23,20,.2)}

        /* SHELL */
        .shell{display:flex;min-height:calc(100vh - 62px)}

        /* SIDEBAR */
        .sidebar{
          width:220px;flex-shrink:0;
          background:var(--sidebar-bg, #111);
          border-right:1px solid var(--border);
          padding:1.5rem 0;
          display:flex;flex-direction:column;gap:1.5rem;
          position:sticky;top:62px;
          height:calc(100vh - 62px);overflow-y:auto;
          overflow-x:hidden;
          animation:fromLeft .5s .1s cubic-bezier(.16,1,.3,1) both;
          transition:width .25s cubic-bezier(.16,1,.3,1), background .3s, border-color .3s;
        }
        .sidebar.collapsed{
          width:0;padding:0;border-right:none;
        }
        .sidebar.collapsed *{opacity:0;pointer-events:none}
        .sb-sec{padding:0 1rem;white-space:nowrap}
        .sb-lbl{font-family:var(--fb);font-size:.68rem;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.5px;text-transform:uppercase;margin-bottom:.5rem;padding:0 .5rem}
        .sb-item{
          display:flex;align-items:center;gap:.55rem;
          padding:.62rem .7rem;border-radius:9px;
          font-family:var(--fb);font-size:.88rem;font-weight:500;
          color:rgba(255,255,255,.62);
          cursor:pointer;border:none;background:none;
          width:100%;text-align:left;white-space:nowrap;
          transition:all .18s;text-decoration:none;
        }
        .sb-item:hover{background:rgba(255,255,255,.08);color:rgba(255,255,255,.9)}
        .sb-item.cur{background:rgba(217,79,61,.18);color:#fff;font-weight:600}
        .sb-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.2);flex-shrink:0;transition:all .2s}
        .sb-item.cur .sb-dot{background:var(--red);box-shadow:0 0 6px var(--red-glow)}
        .sb-divider{height:1px;background:rgba(255,255,255,.07);margin:.25rem 1rem}
        .sb-stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:.8rem .9rem;margin-bottom:.4rem;transition:background .2s;white-space:nowrap}
        .sb-stat:hover{background:rgba(255,255,255,.1)}
        .sb-stat-l{font-family:var(--fb);font-size:.72rem;color:rgba(255,255,255,.35);margin-bottom:.2rem}
        .sb-stat-v{font-family:var(--fh);font-size:1.1rem;font-weight:700;color:#f0ede8;letter-spacing:-.3px;line-height:1}
        .sb-stat-v.r{color:var(--red)}

        /* MAIN */
        .main{flex:1;padding:1.75rem 2rem;overflow:hidden;animation:fadeUp .6s .15s ease both}
        .pg-head{margin-bottom:1.5rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)}
        .pg-title{font-family:var(--fh);font-size:clamp(1.3rem,2vw,1.75rem);font-weight:800;letter-spacing:-.5px;color:var(--ink);line-height:1.1}
        .pg-title span{color:var(--red)}
        .pg-sub{font-family:var(--fb);font-size:.88rem;color:var(--muted);font-weight:400;margin-top:.3rem}

        /* TAB BAR */
        .tab-bar{display:inline-flex;gap:.2rem;background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:.28rem;margin-bottom:1.5rem}
        .tab-btn{font-family:var(--fb);font-size:.82rem;font-weight:400;color:var(--muted);background:none;border:none;cursor:pointer;padding:.42rem 1rem;border-radius:9px;transition:all .2s;white-space:nowrap}
        .tab-btn:hover{color:var(--ink);background:var(--bg2)}
        .tab-btn.on{background:var(--red);color:#fff;font-weight:600;box-shadow:0 2px 10px var(--red-glow)}

        /* STAT ROW */
        .stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--rad);overflow:hidden;margin-bottom:1.25rem}
        .sc{background:var(--card-bg);padding:1.35rem 1.25rem;transition:background .2s;animation:riseCard .5s ease both}
        .sc:hover{background:var(--bg2)}
        .sc.hl{background:var(--red)}
        .sc.hl:hover{background:var(--red2)}
        .sc-lbl{font-family:var(--fb);font-size:.72rem;font-weight:500;color:var(--muted);margin-bottom:.45rem}
        .sc.hl .sc-lbl{color:rgba(255,255,255,.6)}
        .sc-val{font-family:var(--fh);font-size:1.4rem;font-weight:700;color:var(--red);letter-spacing:-.5px;line-height:1}
        .sc.hl .sc-val{color:#fff}
        .sc-sub{font-family:var(--fb);font-size:.72rem;color:var(--faint);font-weight:400;margin-top:.28rem}
        .sc.hl .sc-sub{color:rgba(255,255,255,.5)}

        /* PANELS */
        .two-col{display:grid;grid-template-columns:1fr 256px;gap:1.1rem;margin-bottom:1.25rem}
        .panel{background:var(--card-bg);border:1px solid var(--border);border-radius:var(--rad);overflow:hidden;transition:background .3s}
        .panel-hd{padding:.9rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
        .panel-title{font-family:var(--fh);font-size:.85rem;font-weight:700;color:var(--ink);letter-spacing:-.2px}
        .panel-tag{font-family:var(--fb);font-size:.72rem;color:var(--red);font-weight:600;background:var(--red-soft);padding:.2rem .6rem;border-radius:100px}
        .panel-body{padding:1.25rem}
        .chart-total{font-family:var(--fh);font-size:1.6rem;font-weight:800;color:var(--ink);letter-spacing:-.5px;margin-bottom:1.1rem;line-height:1}
        .chart-total span{font-family:var(--fb);font-size:.9rem;color:var(--muted);font-weight:400;letter-spacing:0}
        .cat-list{display:flex;flex-direction:column;gap:.5rem;margin-top:.9rem}
        .cat-row{display:flex;align-items:center;gap:.5rem}
        .cat-dot{width:7px;height:7px;border-radius:2px;flex-shrink:0}
        .cat-name{font-family:var(--fb);font-size:.75rem;color:var(--muted);flex:1;font-weight:400}
        .cat-pct{font-family:var(--fb);font-size:.67rem;color:var(--faint)}
        .cat-amt{font-family:var(--fh);font-size:.7rem;font-weight:700;color:var(--ink)}
        .cat-track{height:3px;background:var(--bg2);border-radius:2px;margin-top:.1rem}
        .cat-fill{height:3px;border-radius:2px;transition:width .8s cubic-bezier(.16,1,.3,1)}

        /* SUMMARY CARDS */
        .sum-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:.9rem}
        .sum-card{background:var(--card-bg);border:1px solid var(--border);border-radius:var(--rad);padding:1.2rem;display:flex;flex-direction:column;gap:.55rem;transition:transform .22s,box-shadow .22s;animation:riseCard .5s ease both;position:relative;overflow:hidden}
        .sum-card::after{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.16,1,.3,1)}
        .sum-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.08)}
        .sum-card:hover::after{transform:scaleX(1)}
        .sum-icon{width:36px;height:36px;border-radius:9px;background:var(--red-soft);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1rem}
        .sum-name{font-family:var(--fh);font-size:.9rem;font-weight:700;color:var(--ink);letter-spacing:-.2px}
        .sum-cat{font-family:var(--fb);font-size:.75rem;color:var(--muted)}
        .sum-amt{font-family:var(--fh);font-size:1.15rem;font-weight:700;color:var(--red);letter-spacing:-.3px;line-height:1}
        .sum-per{font-family:var(--fb);font-size:.72rem;color:var(--faint);font-weight:400}
        .sum-date{font-family:var(--fb);font-size:.75rem;color:var(--muted)}
        .sum-badge{display:inline-flex;font-family:var(--fb);font-size:.68rem;font-weight:600;padding:.2rem .6rem;border-radius:100px}
        .b-red{background:var(--red-soft);color:var(--red)}
        .b-gray{background:var(--bg2);color:var(--muted)}

        /* DASH TABLE */
        .dash-table { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1.5rem; }
        .dash-row { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 1rem 1.4rem; display: flex; align-items: center; justify-content: space-between; transition: transform .2s, box-shadow .2s; animation: riseCard .5s ease both; }
        .dash-row:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.06); }
        .dash-r-left { display: flex; flex-direction: column; gap: 0.2rem; }
        .dash-r-title { font-family: var(--fh); font-size: 0.85rem; font-weight: 700; color: var(--ink); letter-spacing: -0.2px; }
        .dash-r-cat { font-family: var(--fb); font-size: 0.72rem; color: var(--muted); }
        .dash-r-right { text-align: right; }
        .dash-r-amt { font-family: var(--fh); font-size: 1.1rem; font-weight: 900; color: var(--ink); letter-spacing: -0.5px; }
        .dash-r-date { font-family: var(--fb); font-size: 0.7rem; color: var(--muted); }
        .sec-title { font-family: var(--fh); font-size: 1.15rem; font-weight: 800; color: var(--ink); letter-spacing: -0.5px; margin-bottom: 0.5rem; margin-top: 2.5rem; display: flex; align-items: center; justify-content: space-between; }
        .dl-all { font-family: var(--fb); font-size: 0.75rem; color: var(--red); text-decoration: none; font-weight: 500; }
        .dl-all:hover { text-decoration: underline; }

        /* SIP CARD */
        .sip-card{background:var(--card-bg);border:1px solid var(--border);border-radius:var(--rad);padding:1.2rem;display:flex;align-items:center;gap:1rem;transition:background .2s;animation:riseCard .5s ease both}
        .sip-card:hover{background:var(--bg2)}
        .sip-info{flex:1}
        .sip-name{font-family:var(--fh);font-size:.8rem;font-weight:700;color:var(--ink);letter-spacing:-.2px}
        .sip-cat{font-family:var(--fb);font-size:.7rem;color:var(--muted);margin-top:.1rem}
        .sip-amt{font-family:var(--fh);font-size:1.1rem;font-weight:900;color:var(--red);letter-spacing:-.8px;margin-top:.4rem}
        .sip-sub{font-family:var(--fb);font-size:.68rem;color:var(--faint);font-weight:300}
        .ring-wrap{position:relative;flex-shrink:0}
        .ring-pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--fh);font-size:.6rem;font-weight:900;color:var(--red)}

        /* SECTION LABEL */
        .sec-lbl{font-family:var(--fh);font-size:.68rem;font-weight:700;color:var(--ink);letter-spacing:-.2px;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
        .sec-lbl span{color:var(--red)}

        /* EMPTY */
        .empty{text-align:center;padding:3rem 1.5rem}
        .empty-ico{font-size:2rem;display:block;margin-bottom:.65rem;animation:bounce 2s ease-in-out infinite}
        .empty-t{font-family:var(--fh);font-size:.85rem;font-weight:700;color:var(--ink);letter-spacing:-.3px;margin-bottom:.3rem}
        .empty-s{font-family:var(--fb);font-size:.78rem;color:var(--muted);font-weight:300}

        /* LOADING */
        .loading-bar{height:2px;background:linear-gradient(90deg,var(--red),var(--red2));border-radius:2px;animation:loadBar 1s ease-in-out infinite;margin-bottom:1.25rem}
        @keyframes loadBar{0%{width:0;opacity:1}70%{width:100%;opacity:1}100%{width:100%;opacity:0}}

        /* MODAL */
        .overlay{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.6);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease both}
        .modal{background:var(--card-bg);border:1px solid var(--border);border-radius:18px;padding:2rem;width:min(440px,94vw);box-shadow:0 30px 70px rgba(0,0,0,.4);animation:popUp .3s cubic-bezier(.16,1,.3,1) both}
        .modal-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem}
        .modal-tag{font-family:var(--fb);font-size:.6rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--red);background:var(--red-soft);border:1px solid rgba(217,79,61,.15);padding:.2rem .65rem;border-radius:100px;margin-bottom:.45rem;display:inline-block}
        .modal-title{font-family:var(--fh);font-size:.95rem;font-weight:900;color:var(--ink);letter-spacing:-.8px}
        .modal-close{background:none;border:none;cursor:pointer;font-size:.9rem;color:var(--muted);width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .modal-close:hover{background:var(--bg2);color:var(--ink)}
        .type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1.1rem}
        .type-btn{display:flex;flex-direction:column;align-items:center;gap:.3rem;padding:.65rem .4rem;border:1.5px solid var(--border);border-radius:10px;background:var(--card-bg);cursor:pointer;transition:all .18s;font-family:var(--fb)}
        .type-btn span:first-child{font-size:1.1rem}
        .type-btn span:last-child{font-size:.65rem;font-weight:500;color:var(--muted)}
        .type-btn:hover,.type-btn.on{border-color:var(--red);background:var(--red-soft)}
        .type-btn.on span:last-child{color:var(--red);font-weight:700}
        .m-field{margin-bottom:.9rem}
        .m-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.9rem}
        .m-lbl{display:block;font-family:var(--fb);font-size:.6rem;font-weight:500;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.35rem}
        .m-inp{width:100%;font-family:var(--fb);font-size:.9rem;font-weight:400;color:var(--ink);background:var(--bg2);border:1.5px solid var(--border);border-radius:var(--rads);padding:.72rem .9rem;outline:none;transition:border-color .2s,box-shadow .2s}
        .m-inp::placeholder{color:var(--muted);opacity:.6}
        .m-inp:focus{border-color:var(--red);box-shadow:0 0 0 3px var(--red-soft)}
        .m-err{background:var(--red);color:#fff;font-family:var(--fb);font-size:.78rem;padding:.6rem .9rem;border-radius:8px;margin-bottom:.9rem}
        .m-actions{display:flex;gap:.7rem;margin-top:1.35rem}
        .m-btn{flex:1;font-family:var(--fh);font-size:.58rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff;background:var(--red);border:none;cursor:pointer;padding:.85rem;border-radius:var(--rads);transition:all .2s;box-shadow:0 3px 14px var(--red-glow)}
        .m-btn:hover{background:var(--red2);transform:translateY(-1px);box-shadow:0 6px 20px var(--red-glow)}
        .m-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .m-cancel{font-family:var(--fb);font-size:.82rem;font-weight:400;color:var(--muted);background:transparent;border:1.5px solid var(--border);padding:.85rem 1.2rem;border-radius:var(--rads);cursor:pointer;transition:all .2s}
        .m-cancel:hover{background:var(--bg2);color:var(--ink)}

        /* KEYFRAMES */
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fromLeft{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes riseCard{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popUp{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}

        @media(max-width:900px){
          .sidebar{display:none}
          .stat-row{grid-template-columns:1fr 1fr}
          .two-col{grid-template-columns:1fr}
          .main{padding:1.1rem}
          .nav-links{display:none}
        }
      `}</style>

            {/* ── NAV ── */}
            <nav className="nav">
                <div className="nav-left">
                    <button
                        onClick={() => setSidebarOpen(o => !o)}
                        style={{ background: "none", border: "1px solid var(--border)", color: "var(--ink)", width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, lineHeight: 1, flexShrink: 0, transition: "all .2s", flexDirection: "column", gap: 4 }}
                        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                        aria-label="Toggle sidebar"
                    >
                        <span style={{ display: "block", width: 14, height: 1.5, background: "currentColor", borderRadius: 2, transition: "transform .2s, opacity .2s", ...(sidebarOpen ? {} : { transform: "translateY(3px) rotate(45deg)" }) }} />
                        <span style={{ display: "block", width: 14, height: 1.5, background: "currentColor", borderRadius: 2, transition: "opacity .2s", opacity: sidebarOpen ? 1 : 0 }} />
                        <span style={{ display: "block", width: 14, height: 1.5, background: "currentColor", borderRadius: 2, transition: "transform .2s, opacity .2s", ...(sidebarOpen ? {} : { transform: "translateY(-3px) rotate(-45deg)" }) }} />
                    </button>
                    <Link href="/" className="nav-logo">
                        <div className="logo-sq">F</div>
                        PocketPilot
                    </Link>
                    <div className="nav-links">
                        <Link href="/dashboard" className="nav-link cur">Dashboard</Link>
                        <Link href="/logs" className="nav-link">Logs</Link>
                        <Link href="/investments" className="nav-link">Investments</Link>
                        <Link href="/goals" className="nav-link">Goals</Link>
                        <Link href="/salary" className="nav-link">Smart Investment</Link>
                    </div>
                </div>
                <div className="nav-right">
                    <button className="btn-theme" onClick={toggleTheme}>
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                    {username && <span className="nav-greet">Hey, <strong>{username}</strong> 👋</span>}
                    <button className="btn-add" onClick={handleRequestStatement} disabled={requesting} style={{ background: "var(--ink)", color: "var(--bg)" }}>
                        {requesting ? "Sending..." : "📄 Statement"}
                    </button>
                    <button className="btn-add" onClick={openModal}>+ Add Expense</button>
                    <button className="btn-logout" onClick={() => { localStorage.removeItem("username"); router.push("/login"); }}>Log out</button>
                </div>
            </nav>

            <div className="shell">
                {/* ── SIDEBAR ── */}
                <aside className={`sidebar${sidebarOpen ? "" : " collapsed"}`}>
                    <div className="sb-sec">
                        <div className="sb-lbl">Pages</div>
                        {[
                            { label: "Dashboard", icon: "◈", href: "/dashboard" },
                            { label: "Logs", icon: "☰", href: "/logs" },
                            { label: "Investments", icon: "📈", href: "/investments" },
                            { label: "Goals", icon: "🎯", href: "/goals" },
                            { label: "Smart Investment", icon: "💰", href: "/salary" },
                        ].map(({ label, icon, href }) => (
                            <Link key={label} href={href} className={`sb-item${href === "/dashboard" ? " cur" : ""}`}>
                                <span className="sb-dot" /> {icon} {label}
                            </Link>
                        ))}
                    </div>
                    <div className="sb-sec">
                        <div className="sb-lbl">This Month</div>
                        {[
                            { l: "Expenses", v: `₹${monthTotal.toLocaleString("en-IN")}`, r: true },
                            { l: "Subs", v: `₹${subTotal.toLocaleString("en-IN")}` },
                            { l: "SIPs", v: `₹${sipTotal.toLocaleString("en-IN")}` },
                            { l: "EMIs", v: `₹${emiTotal.toLocaleString("en-IN")}` },
                        ].map((s, i) => (
                            <div key={i} className="sb-stat">
                                <div className="sb-stat-l">{s.l}</div>
                                <div className={`sb-stat-v${s.r ? " r" : ""}`}>{s.v}</div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ── MAIN ── */}
                <main className="main">
                    <div className="pg-head">
                        <div className="pg-title">{username ? `${username}'s ` : ""}<span>Dashboard</span></div>
                        <div className="pg-sub">
                            {loading ? "Loading…" : `${expenses.length} entries tracked · ₹${monthTotal.toLocaleString("en-IN")} committed this month`}
                        </div>
                    </div>

                    {loading && <div className="loading-bar" />}

                    {/* ── PROMINENT ADD EXPENSE CTA ── */}
                    <div className="add-cta-wrap">
                        <div className="add-cta-left">
                            <div className="add-cta-title">➕ Track a new expense</div>
                            <div className="add-cta-sub">Add it right here — no need to leave the dashboard</div>
                        </div>
                        <button className="add-cta-btn" onClick={openModal}>+ Add Expense</button>
                    </div>

                    <div className="tab-bar">
                        {TABS.map(t => (
                            <button key={t} className={`tab-btn${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* ══ DAILY ══ */}
                    {tab === "Daily" && (<>
                        <div className="stat-row">
                            {[
                                { lbl: "Today", val: <Counter value={todayTotal} />, sub: now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" }), hl: true, d: "0ms" },
                                { lbl: "Transactions", val: todayExp.length, sub: "entries today", hl: false, d: "55ms" },
                                { lbl: "Highest", val: <Counter value={todayExp.length ? Math.max(...todayExp.map(e => Number(e.amount))) : 0} />, sub: "single entry", hl: false, d: "110ms" },
                                { lbl: "Yesterday", val: <Counter value={sum(regular.filter(e => (e.date || "").slice(0, 10) === yesterStr))} />, sub: "comparison", hl: false, d: "165ms" },
                            ].map((s, i) => (
                                <div key={i} className={`sc${s.hl ? " hl" : ""}`} style={{ animationDelay: s.d }}>
                                    <div className="sc-lbl">{s.lbl}</div>
                                    <div className="sc-val">{s.val}</div>
                                    <div className="sc-sub">{s.sub}</div>
                                </div>
                            ))}
                        </div>
                        <div className="two-col">
                            <div className="panel">
                                <div className="panel-hd">
                                    <span className="panel-title">Past 7 Days</span>
                                    <span className="panel-tag">₹{weekTotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="panel-body"><SparkBars data={weekBars} highlight={6} /></div>
                            </div>
                            <CatPanel />
                        </div>
                    </>)}

                    {/* ══ WEEKLY ══ */}
                    {tab === "Weekly" && (<>
                        <div className="stat-row">
                            {[
                                { lbl: "This Week", val: <Counter value={weekTotal} />, sub: "last 7 days", hl: true, d: "0ms" },
                                { lbl: "Entries", val: weekExp.length, sub: "transactions", hl: false, d: "55ms" },
                                { lbl: "Daily Avg", val: <Counter value={Math.round(weekTotal / 7)} />, sub: "per day", hl: false, d: "110ms" },
                                { lbl: "Top Spend", val: <Counter value={weekExp.length ? Math.max(...weekExp.map(e => Number(e.amount))) : 0} />, sub: "single entry", hl: false, d: "165ms" },
                            ].map((s, i) => (
                                <div key={i} className={`sc${s.hl ? " hl" : ""}`} style={{ animationDelay: s.d }}>
                                    <div className="sc-lbl">{s.lbl}</div>
                                    <div className="sc-val">{s.val}</div>
                                    <div className="sc-sub">{s.sub}</div>
                                </div>
                            ))}
                        </div>
                        <div className="two-col">
                            <div className="panel">
                                <div className="panel-hd">
                                    <span className="panel-title">Day-by-Day</span>
                                    <span className="panel-tag">7 days</span>
                                </div>
                                <div className="panel-body">
                                    <div className="chart-total"><Counter value={weekTotal} /><span> this week</span></div>
                                    <SparkBars data={weekBars} highlight={6} />
                                </div>
                            </div>
                            <CatPanel />
                        </div>
                    </>)}

                    {/* ══ MONTHLY ══ */}
                    {tab === "Monthly" && (<>
                        <div className="stat-row">
                            {[
                                { lbl: "This Month", val: <Counter value={monthTotal} />, sub: now.toLocaleString("en-IN", { month: "long", year: "numeric" }), hl: true, d: "0ms" },
                                { lbl: "Entries", val: monthExp.length, sub: "transactions", hl: false, d: "55ms" },
                                { lbl: "Daily Avg", val: <Counter value={Math.round(monthTotal / now.getDate())} />, sub: "per day so far", hl: false, d: "110ms" },
                                { lbl: "Recurring", val: <Counter value={recurringTotal} />, sub: "subs+SIPs+EMIs", hl: false, d: "165ms" },
                            ].map((s, i) => (
                                <div key={i} className={`sc${s.hl ? " hl" : ""}`} style={{ animationDelay: s.d }}>
                                    <div className="sc-lbl">{s.lbl}</div>
                                    <div className="sc-val">{s.val}</div>
                                    <div className="sc-sub">{s.sub}</div>
                                </div>
                            ))}
                        </div>
                        <div className="two-col">
                            <div className="panel">
                                <div className="panel-hd">
                                    <span className="panel-title">6-Month Trend</span>
                                    <span className="panel-tag">Monthly</span>
                                </div>
                                <div className="panel-body">
                                    <div className="chart-total"><Counter value={monthTotal} /><span> this month</span></div>
                                    <SparkBars data={monthBars} highlight={5} />
                                </div>
                            </div>
                            <CatPanel />
                        </div>
                    </>)}

                    {/* ── RECENT LOGS (ONLY REGULAR EXPENSES) ── */}
                    {(tab === "Daily" || tab === "Weekly" || tab === "Monthly") && (
                        <>
                            <div className="sec-title">
                                <span>Recent Entries <span style={{ fontFamily: "var(--fb)", fontSize: "0.8rem", color: "var(--muted)", fontWeight: 400, marginLeft: "0.5rem" }}>({tabLogs.length} regular expenses)</span></span>
                                <Link href="/logs" className="dl-all">View All →</Link>
                            </div>
                            <div className="dash-table">
                                {tabLogs.slice().reverse().slice(0, 15).map((exp, i) => (
                                    <div key={exp.id || i} className="dash-row" style={{ animationDelay: `${i * 30}ms` }}>
                                        <div className="dash-r-left">
                                            <div className="dash-r-title">{exp.title}</div>
                                            <div className="dash-r-cat">{exp.category || "Uncategorized"}</div>
                                        </div>
                                        <div className="dash-r-right">
                                            <div className="dash-r-amt">₹{Number(exp.amount).toLocaleString("en-IN")}</div>
                                            <div className="dash-r-date">{exp.date ? new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}</div>
                                        </div>
                                    </div>
                                ))}
                                {tabLogs.length === 0 && (
                                    <div className="panel" style={{ marginTop: "0" }}><div className="empty">
                                        <span className="empty-ico">🧾</span>
                                        <div className="empty-t">No standard expenses in this period</div>
                                        <div className="empty-s">Subscriptions and SIPs are tracked in their respective tabs.</div>
                                    </div></div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ══ SUBSCRIPTIONS ══ */}
                    {tab === "Subscriptions" && (<>
                        <div className="stat-row">
                            {[
                                { lbl: "Monthly Burn", val: <Counter value={subTotal} />, sub: `${subs.length} subscriptions`, hl: true, d: "0ms" },
                                { lbl: "Annual Cost", val: <Counter value={subTotal * 12} />, sub: "projected yearly", hl: false, d: "55ms" },
                                { lbl: "Avg Per Sub", val: <Counter value={subs.length ? Math.round(subTotal / subs.length) : 0} />, sub: "per subscription", hl: false, d: "110ms" },
                                { lbl: "Active", val: subs.length, sub: "tracked", hl: false, d: "165ms" },
                            ].map((s, i) => (
                                <div key={i} className={`sc${s.hl ? " hl" : ""}`} style={{ animationDelay: s.d }}>
                                    <div className="sc-lbl">{s.lbl}</div>
                                    <div className="sc-val">{s.val}</div>
                                    <div className="sc-sub">{s.sub}</div>
                                </div>
                            ))}
                        </div>
                        {subs.length === 0 ? (
                            <div className="panel"><div className="empty">
                                <span className="empty-ico">↻</span>
                                <div className="empty-t">No subscriptions yet</div>
                                <div className="empty-s">Click '+ Add Expense' and choose Subscription.</div>
                            </div></div>
                        ) : (
                            <div className="sum-grid">
                                {subs.map((s, i) => {
                                    const daysLeft = s.billing_date ? Math.ceil((new Date(s.billing_date) - now) / 86400000) : null;
                                    return (
                                        <div key={i} className="sum-card" style={{ animationDelay: `${i * 45}ms` }}>
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                                                <div className="sum-icon">{getIcon(s.category)}</div>
                                                {daysLeft !== null && (
                                                    <span className={`sum-badge ${daysLeft <= 3 ? "b-red" : "b-gray"}`}>
                                                        {daysLeft <= 0 ? "Due today" : `${daysLeft}d left`}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="sum-name">{s.title}</div>
                                                <div className="sum-cat">{s.category || "Subscription"}</div>
                                            </div>
                                            <div>
                                                <div className="sum-amt">₹{Number(s.amount).toLocaleString("en-IN")} <span className="sum-per">/mo</span></div>
                                                {s.billing_date && <div className="sum-date">🗓 Renews {new Date(s.billing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>)}

                    {/* ══ SIPs & EMIs ══ */}
                    {tab === "SIPs & EMIs" && (<>
                        <div className="stat-row">
                            {[
                                { lbl: "Total Committed", val: <Counter value={sipTotal + emiTotal} />, sub: "SIPs + EMIs/mo", hl: true, d: "0ms" },
                                { lbl: "SIP Total", val: <Counter value={sipTotal} />, sub: `${sips.length} SIPs`, hl: false, d: "55ms" },
                                { lbl: "EMI Total", val: <Counter value={emiTotal} />, sub: `${emis.length} loans`, hl: false, d: "110ms" },
                                { lbl: "Annual Outflow", val: <Counter value={(sipTotal + emiTotal) * 12} />, sub: "projected", hl: false, d: "165ms" },
                            ].map((s, i) => (
                                <div key={i} className={`sc${s.hl ? " hl" : ""}`} style={{ animationDelay: s.d }}>
                                    <div className="sc-lbl">{s.lbl}</div>
                                    <div className="sc-val">{s.val}</div>
                                    <div className="sc-sub">{s.sub}</div>
                                </div>
                            ))}
                        </div>

                        {sips.length > 0 && (<>
                            <div className="sec-lbl"><span>◈</span> SIPs</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: ".65rem", marginBottom: "1.25rem" }}>
                                {sips.map((s, i) => {
                                    const pct = sipTotal ? Math.round((Number(s.amount) / sipTotal) * 100) : 0;
                                    return (
                                        <div key={i} className="sip-card" style={{ animationDelay: `${i * 50}ms` }}>
                                            <div className="sip-info">
                                                <div className="sip-name">{s.title}</div>
                                                <div className="sip-cat">{s.category || "Investment"}</div>
                                                <div className="sip-amt">₹{Number(s.amount).toLocaleString("en-IN")} <span className="sip-sub">/mo</span></div>
                                            </div>
                                            <div className="ring-wrap">
                                                <Ring pct={pct} size={52} />
                                                <div className="ring-pct">{pct}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>)}

                        {emis.length > 0 && (<>
                            <div className="sec-lbl"><span>◈</span> EMIs & Loans</div>
                            <div className="sum-grid">
                                {emis.map((e, i) => (
                                    <div key={i} className="sum-card" style={{ animationDelay: `${i * 45}ms` }}>
                                        <div className="sum-icon">🏦</div>
                                        <div>
                                            <div className="sum-name">{e.title}</div>
                                            <div className="sum-cat">{e.category || "Loan"}</div>
                                        </div>
                                        <div>
                                            <div className="sum-amt">₹{Number(e.amount).toLocaleString("en-IN")} <span className="sum-per">/mo</span></div>
                                            {e.billing_date && <div className="sum-date">📅 Due {new Date(e.billing_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>)}

                        {sips.length === 0 && emis.length === 0 && (
                            <div className="panel"><div className="empty">
                                <span className="empty-ico">📈</span>
                                <div className="empty-t">No SIPs or EMIs yet</div>
                                <div className="empty-s">Visit the <Link href="/investments" style={{ color: "var(--red)" }}>Investments page</Link> to track SIPs, EMIs &amp; Insurance.</div>
                            </div></div>
                        )}
                    </>)}
                </main>
            </div>

            {/* ── ADD EXPENSE MODAL ── */}
            {showModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
                    zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "1rem", animation: "fadeUp .25s ease both"
                }} onClick={e => e.target === e.currentTarget && closeModal()}>
                    <div style={{
                        background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "20px",
                        padding: "2rem", width: "100%", maxWidth: "520px", position: "relative",
                        boxShadow: "0 24px 64px rgba(0,0,0,.25)", animation: "riseCard .3s ease both"
                    }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                            <div>
                                <div style={{ fontFamily: "var(--fh)", fontSize: ".95rem", fontWeight: 900, color: "var(--ink)", letterSpacing: "-.5px" }}>Add Expense</div>
                                <div style={{ fontFamily: "var(--fb)", fontSize: ".75rem", color: "var(--muted)", marginTop: ".2rem" }}>New entry — same as Logs</div>
                            </div>
                            <button onClick={closeModal} style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", borderRadius: "9px", width: "34px", height: "34px", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>✕</button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleModalSave}>
                            {/* Row 1: Title + Amount + Type */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div style={{ gridColumn: "1/-1" }}>
                                    <label className="m-lbl">Title</label>
                                    <input className="m-inp" placeholder='Netflix, Dinner, Uber…' value={modalForm.title} onChange={e => setModalForm(f => ({ ...f, title: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="m-lbl">Amount (₹)</label>
                                    <input className="m-inp" type="number" placeholder="0" value={modalForm.amount} onChange={e => setModalForm(f => ({ ...f, amount: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="m-lbl">Type</label>
                                    <select className="m-inp" value={modalForm.type} onChange={e => setModalForm(f => ({ ...f, type: e.target.value }))}>
                                        <option value="expense">One-time Expense</option>
                                        <option value="subscription">Subscription</option>
                                        <option value="sip">SIP Investment</option>
                                        <option value="emi">EMI / Loan</option>
                                        <option value="insurance">Insurance</option>
                                    </select>
                                </div>
                            </div>

                            {/* Subscription extras */}
                            {(modalForm.type === "subscription" || modalForm.type === "sip" || modalForm.type === "emi" || modalForm.type === "insurance") && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                    <div>
                                        <label className="m-lbl">📅 Billing Day of Month</label>
                                        <select className="m-inp" value={modalForm.billing_day} onChange={e => setModalForm(f => ({ ...f, billing_day: e.target.value }))}>
                                            <option value="">Select day…</option>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of every month</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="m-lbl">⏱ Billing Period</label>
                                        <select className="m-inp" value={modalForm.billing_period} onChange={e => setModalForm(f => ({ ...f, billing_period: e.target.value }))}>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly (3 months)</option>
                                            <option value="half-yearly">Half-Yearly (6 months)</option>
                                            <option value="yearly">Yearly (1 year)</option>
                                            <option value="custom">Custom…</option>
                                        </select>
                                        {modalForm.billing_period === "custom" && (
                                            <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginTop: ".5rem" }}>
                                                <input className="m-inp" type="number" min="1" placeholder="e.g. 5" value={modalForm.custom_months} onChange={e => setModalForm(f => ({ ...f, custom_months: e.target.value }))} style={{ width: "90px" }} />
                                                <span style={{ fontFamily: "var(--fb)", fontSize: ".82rem", color: "var(--muted)" }}>months</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Category */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <label className="m-lbl">Category</label>
                                <input className="m-inp" list="modal-cats" placeholder="Food & Dining, Travel…" value={modalForm.category} onChange={e => setModalForm(f => ({ ...f, category: e.target.value }))} />
                                <datalist id="modal-cats">
                                    {["Food & Dining", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Rent", "Education", "Travel", "Groceries", "Investment", "Loan", "Insurance"].map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: ".75rem", justifyContent: "flex-end", alignItems: "center" }}>
                                {modalToast && <span style={{ fontFamily: "var(--fb)", fontSize: ".78rem", color: "var(--green, #10b981)", marginRight: "auto" }}>{modalToast}</span>}
                                <button type="button" onClick={closeModal} style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", fontFamily: "var(--fb)", fontSize: ".82rem", cursor: "pointer", padding: ".55rem 1rem", borderRadius: "8px" }}>Cancel</button>
                                <button type="submit" disabled={modalSaving} style={{ background: "var(--red)", border: "none", color: "#fff", fontFamily: "var(--fh)", fontSize: ".62rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", cursor: "pointer", padding: ".65rem 1.5rem", borderRadius: "9px", boxShadow: "0 3px 12px var(--red-glow)", transition: "all .2s", opacity: modalSaving ? .7 : 1 }}>
                                    {modalSaving ? "Saving…" : "Save Entry →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
