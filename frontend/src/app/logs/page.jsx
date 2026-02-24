"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TYPE_COLORS = {
    expense: "#d94f3d",
    subscription: "#e8604e",
    sip: "#2a9d8f",
    emi: "#e9c46a",
    insurance: "#6c63ff",
};

const CATEGORIES = [
    "Food & Dining", "Travel", "Entertainment", "Shopping",
    "Utilities", "Essentials", "Office", "Gifts",
    "Subscriptions", "Cloud Storage", "Health & Fitness",
];

export default function LogsPage() {
    const [username, setUsername] = useState("");
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: "", amount: "", category: "", type: "expense", billing_day: "", billing_period: "monthly", custom_months: "", entry_date: "" });
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [search, setSearch] = useState("");
    const router = useRouter();

    useEffect(() => {
        const u = localStorage.getItem("username");
        if (!u) { router.push("/login"); return; }
        setUsername(u);
    }, []);

    useEffect(() => { if (username) fetchLogs(); }, [username]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const r = await fetch("http://127.0.0.1:8000/api/get-expenses/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const d = await r.json();
            setExpenses(d.expenses || []);
        } catch { showToast("Failed to fetch logs", "error"); }
        finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title || !form.amount) return showToast("Fill title and amount", "error");
        const endpoint = editingId ? "edit-expense" : "add-expense";
        // Resolve custom billing period
        const resolvedPeriod = form.billing_period === "custom"
            ? (form.custom_months ? `${form.custom_months}months` : "monthly")
            : form.billing_period;
        const body = { ...form, username, id: editingId, expense_type: form.type, billing_period: resolvedPeriod };
        try {
            await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            showToast(editingId ? "Entry updated!" : "Entry saved!");
            setForm({ title: "", amount: "", category: "", type: "expense", billing_day: "", billing_period: "monthly", custom_months: "", entry_date: "" });
            setEditingId(null);
            fetchLogs();
        } catch { showToast("Action failed", "error"); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this entry?")) return;
        try {
            await fetch("http://127.0.0.1:8000/api/delete-expense/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, id }),
            });
            showToast("Entry deleted!");
            fetchLogs();
        } catch { showToast("Delete failed", "error"); }
    };

    const handleStop = async (id) => {
        if (!confirm("Stop this subscription? It will show as stopped but remain in your logs.")) return;
        try {
            await fetch("http://127.0.0.1:8000/api/stop-subscription/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, id }),
            });
            showToast("Subscription stopped");
            fetchLogs();
        } catch { showToast("Failed to stop", "error"); }
    };

    const startEdit = (exp) => {
        setEditingId(exp.id);
        setForm({
            title: exp.title,
            amount: exp.amount,
            category: exp.category || "",
            type: exp.expense_type || "expense",
            billing_day: exp.billing_day || "",
            billing_period: exp.billing_period || "monthly",
            custom_months: "",
            entry_date: (exp.date || "").slice(0, 10),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ title: "", amount: "", category: "", type: "expense", billing_day: "", billing_period: "monthly", custom_months: "", entry_date: "" });
    };

    const filtered = expenses.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.category || "").toLowerCase().includes(search.toLowerCase())
    );

    const totalSpend = expenses.reduce((a, b) => {
        const isRecurring = b.is_subscription || ["subscription", "sip", "emi"].includes(b.expense_type);
        // If recurring and months_paid exists, use it. Some older ones might not have it cleanly, but it defaults to 0.
        // Wait, if months_paid is 0, the total spent so far is 0.
        const paid = isRecurring ? (b.months_paid || 0) : 1;
        return a + (Number(b.amount) * paid);
    }, 0);
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #f5f2ed;
          --bg2:      #edeae3;
          --bg3:      #e6e1d8;
          --ink:      #1a1714;
          --red:      #d94f3d;
          --red2:     #e8604e;
          --red-glow: rgba(217,79,61,0.22);
          --red-soft: rgba(217,79,61,0.08);
          --muted:    #7a7368;
          --border:   rgba(26,23,20,0.09);
          --fh: 'Unbounded', sans-serif;
          --fb: 'Outfit', sans-serif;
        }

        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); font-family: var(--fb); -webkit-font-smoothing: antialiased; }

        /* ── NAV ── */
        .nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(245,242,237,0.93); backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border);
          height: 60px; display: flex; align-items: center; justify-content: space-between;
          padding: 0 2.5rem;
          animation: fadeDown 0.5s ease both;
        }
        .nav-logo {
          font-family: var(--fh); font-size: 0.7rem; font-weight: 900;
          letter-spacing: 3px; text-transform: uppercase; color: var(--ink);
          text-decoration: none; display: flex; align-items: center; gap: 0.5rem;
        }
        .nav-logo-sq {
          width: 26px; height: 26px; border-radius: 6px; background: var(--red);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 900; color: #fff;
          box-shadow: 0 3px 12px var(--red-glow); transition: transform 0.2s, box-shadow 0.2s;
        }
        .nav-logo:hover .nav-logo-sq { transform: scale(1.09); box-shadow: 0 5px 18px var(--red-glow); }
        .nav-right { display: flex; align-items: center; gap: 1rem; }
        .nav-link {
          font-family: var(--fb); font-size: 0.82rem; color: var(--muted);
          text-decoration: none; transition: color 0.2s;
        }
        .nav-link:hover { color: var(--ink); }
        .nav-cta {
          font-family: var(--fh); font-size: 0.58rem; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #fff; background: var(--red); border: none; cursor: pointer;
          padding: 0.5rem 1.1rem; border-radius: 7px;
          text-decoration: none; display: flex; align-items: center; gap: 0.4rem;
          transition: all 0.2s; box-shadow: 0 2px 12px var(--red-glow);
        }
        .nav-cta:hover { background: var(--red2); transform: translateY(-1px); }

        /* ── LAYOUT ── */
        .page-wrap {
          max-width: 960px; margin: 0 auto; padding: 2.5rem 2rem;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        /* ── PAGE HEADER ── */
        .page-hd { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
        .page-hd-eyebrow {
          font-family: var(--fb); font-size: 0.62rem; font-weight: 600; color: var(--red);
          letter-spacing: 2px; text-transform: uppercase;
          display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;
        }
        .page-hd-eyebrow-line { width: 16px; height: 1px; background: var(--red); }
        .page-hd-title {
          font-family: var(--fh); font-size: clamp(1.4rem, 2.5vw, 2rem);
          font-weight: 900; letter-spacing: -2px; color: var(--ink); margin-bottom: 0.3rem;
        }
        .page-hd-title span { color: var(--red); }
        .page-hd-sub { font-family: var(--fb); font-size: 0.82rem; color: var(--muted); font-weight: 300; }

        /* ── STAT CHIPS ── */
        .stat-chips { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .chip {
          background: #fff; border: 1px solid var(--border); border-radius: 12px;
          padding: 0.9rem 1.25rem; min-width: 140px;
          animation: riseCard 0.5s ease both;
        }
        .chip-lbl { font-family: var(--fb); font-size: 0.6rem; font-weight: 500; color: var(--muted); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 0.3rem; }
        .chip-val { font-family: var(--fh); font-size: 1.3rem; font-weight: 900; color: var(--red); letter-spacing: -1px; line-height: 1; }
        .chip.dark { background: #111108; border-color: transparent; }
        .chip.dark .chip-lbl { color: rgba(255,255,255,0.25); }
        .chip.dark .chip-val { color: #f0eee9; }

        /* ── FORM CARD ── */
        .form-card {
          background: #fff; border: 1px solid var(--border); border-radius: 16px;
          padding: 1.75rem; margin-bottom: 2rem;
          box-shadow: 0 4px 24px rgba(26,23,20,0.04);
          animation: riseCard 0.5s 0.1s ease both;
        }
        .form-card-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .form-card-title { font-family: var(--fh); font-size: 0.72rem; font-weight: 700; color: var(--ink); letter-spacing: -0.3px; }
        .form-badge {
          font-family: var(--fb); font-size: 0.62rem; font-weight: 600; letter-spacing: 1px;
          text-transform: uppercase; color: var(--red); background: var(--red-soft);
          border: 1px solid rgba(217,79,61,0.15); padding: 0.22rem 0.65rem; border-radius: 100px;
        }
        .cancel-link { font-family: var(--fb); font-size: 0.8rem; color: var(--muted); cursor: pointer; transition: color 0.2s; background: none; border: none; }
        .cancel-link:hover { color: var(--ink); }

        .fields-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem; }
        .fields-row-2 { display: grid; grid-template-columns: 2fr 1fr auto; gap: 0.85rem; }
        .f-lbl { font-family: var(--fb); font-size: 0.62rem; font-weight: 500; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 0.4rem; }
        .f-inp {
          width: 100%; font-family: var(--fb); font-size: 0.88rem; font-weight: 400;
          color: var(--ink); background: var(--bg); border: 1px solid var(--border);
          border-radius: 9px; padding: 0.72rem 0.9rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .f-inp::placeholder { color: rgba(26,23,20,0.22); }
        .f-inp:focus { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-soft); background: #fff; }
        .f-inp option { background: #fff; }

        .save-btn {
          font-family: var(--fh); font-size: 0.58rem; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #fff; background: var(--red); border: none; cursor: pointer;
          padding: 0.72rem 1.5rem; border-radius: 9px; white-space: nowrap;
          transition: all 0.2s; box-shadow: 0 3px 14px var(--red-glow);
          align-self: flex-end; height: fit-content;
        }
        .save-btn:hover { background: var(--red2); transform: translateY(-1px); box-shadow: 0 6px 20px var(--red-glow); }

        /* ── SEARCH ── */
        .search-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .search-wrap { position: relative; flex: 1; max-width: 320px; }
        .search-ico { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: var(--muted); pointer-events: none; }
        .search-inp {
          width: 100%; font-family: var(--fb); font-size: 0.88rem; color: var(--ink);
          background: #fff; border: 1px solid var(--border);
          border-radius: 9px; padding: 0.65rem 0.9rem 0.65rem 2.4rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-inp:focus { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-soft); }
        .count-tag { font-family: var(--fb); font-size: 0.75rem; color: var(--muted); }

        /* ── TABLE ── */
        .table-wrap { background: #fff; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .table-head {
          display: grid; grid-template-columns: 1fr 100px 120px 100px 80px;
          padding: 0.7rem 1.5rem; background: var(--bg2); border-bottom: 1px solid var(--border);
        }
        .th { font-family: var(--fb); font-size: 0.6rem; font-weight: 500; color: var(--muted); letter-spacing: 1.2px; text-transform: uppercase; }
        .tr {
          display: grid; grid-template-columns: 1fr 100px 120px 100px 80px;
          padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
          align-items: center; transition: background 0.15s;
          animation: rowIn 0.35s ease both;
        }
        .tr:last-child { border-bottom: none; }
        .tr:hover { background: var(--red-soft); }

        .td-title-main { font-family: var(--fb); font-size: 0.88rem; font-weight: 500; color: var(--ink); }
        .td-title-sub { font-family: var(--fb); font-size: 0.7rem; color: var(--muted); font-weight: 300; margin-top: 0.1rem; }

        .type-badge {
          display: inline-flex; font-family: var(--fb); font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.8px; text-transform: uppercase;
          padding: 0.2rem 0.55rem; border-radius: 100px;
        }
        .cat-badge {
          display: inline-flex; font-family: var(--fb); font-size: 0.7rem; font-weight: 400; color: var(--muted);
          background: var(--bg2); padding: 0.2rem 0.6rem; border-radius: 100px;
        }
        .td-amt { font-family: var(--fh); font-size: 0.88rem; font-weight: 700; color: var(--red); }
        .td-actions { display: flex; gap: 0.4rem; justify-content: flex-end; align-items: center; }
        .act-btn {
          background: none; border: none; cursor: pointer;
          font-size: 0.8rem; color: var(--muted);
          width: 28px; height: 28px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .act-btn.edit:hover { color: var(--ink); background: var(--bg2); }
        .act-btn.del:hover  { color: var(--red); background: var(--red-soft); }
        .stop-btn {
          font-family: var(--fb); font-size: 0.62rem; font-weight: 600;
          letter-spacing: 0.5px; color: var(--muted);
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 6px; padding: 0.2rem 0.6rem;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .stop-btn:hover { color: var(--red); border-color: rgba(217,79,61,0.3); background: var(--red-soft); }
        .stopped-badge {
          display: inline-flex; font-family: var(--fb); font-size: 0.58rem; font-weight: 600;
          letter-spacing: 0.8px; text-transform: uppercase;
          background: rgba(26,23,20,0.06); color: var(--muted);
          padding: 0.18rem 0.5rem; border-radius: 100px;
        }
        .tr.stopped { opacity: 0.55; }

        /* ── EMPTY ── */
        .empty { text-align: center; padding: 4rem 2rem; }
        .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; animation: bounce 2s ease-in-out infinite; }
        .empty-t { font-family: var(--fh); font-size: 0.85rem; font-weight: 700; color: var(--ink); letter-spacing: -0.5px; margin-bottom: 0.35rem; }
        .empty-s { font-family: var(--fb); font-size: 0.8rem; color: var(--muted); font-weight: 300; }

        /* ── LOADING ── */
        .loading-bar { height: 2px; background: linear-gradient(90deg, var(--red), var(--red2)); border-radius: 2px; animation: loadBar 1s ease-in-out infinite; margin-bottom: 1.5rem; }

        /* ── TOAST ── */
        .toast {
          position: fixed; bottom: 1.75rem; right: 1.75rem; z-index: 600;
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0.8rem 1.2rem; border-radius: 10px;
          font-family: var(--fb); font-size: 0.82rem; font-weight: 500;
          box-shadow: 0 8px 28px rgba(26,23,20,0.14);
          animation: toastIn 0.35s cubic-bezier(.16,1,.3,1) both;
        }
        .toast.success { background: var(--ink); color: #f0eee9; }
        .toast.error   { background: var(--red); color: #fff; box-shadow: 0 8px 24px var(--red-glow); }

        /* ── KEYFRAMES ── */
        @keyframes fadeDown  { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes riseCard  { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn     { from{opacity:0;transform:translateX(-8px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes toastIn   { from{opacity:0;transform:translateX(10px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes loadBar   { 0%{width:0;opacity:1} 70%{width:100%;opacity:1} 100%{width:100%;opacity:0} }

        @media (max-width: 768px) {
          .fields-row, .fields-row-2 { grid-template-columns: 1fr 1fr; }
          .table-head, .tr { grid-template-columns: 1fr 90px 80px 60px; }
          .th:nth-child(3), .tr > .cat-wrap { display: none; }
          .page-wrap { padding: 1.5rem 1rem; }
          .nav { padding: 0 1rem; }
        }
      `}</style>

            {/* NAV */}
            <nav className="nav">
                <Link href="/" className="nav-logo">
                    <div className="nav-logo-sq">F</div>
                    Fintrack
                </Link>
                <div className="nav-right">
                    <Link href="/investments" className="nav-link">Investments</Link>
                    <Link href="/dashboard" className="nav-link">Dashboard</Link>
                    <Link href="/dashboard" className="nav-cta">← Back</Link>
                </div>
            </nav>

            <div className="page-wrap">
                {/* Page Header */}
                <div className="page-hd">
                    <div className="page-hd-eyebrow">
                        <div className="page-hd-eyebrow-line" />
                        Expense Logs
                    </div>
                    <div className="page-hd-title">All <span>Entries</span></div>
                    <div className="page-hd-sub">
                        {expenses.length} total entries · ₹{totalSpend.toLocaleString("en-IN")} tracked
                    </div>
                </div>

                {/* Stat Chips */}
                <div className="stat-chips">
                    <div className="chip dark" style={{ animationDelay: "0ms" }}>
                        <div className="chip-lbl">Total Entries</div>
                        <div className="chip-val">{expenses.length}</div>
                    </div>
                    <div className="chip" style={{ animationDelay: "60ms" }}>
                        <div className="chip-lbl">Total Spend</div>
                        <div className="chip-val">₹{totalSpend.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="chip" style={{ animationDelay: "120ms" }}>
                        <div className="chip-lbl">Subscriptions</div>
                        <div className="chip-val">{expenses.filter(e => e.is_subscription).length}</div>
                    </div>
                    <div className="chip" style={{ animationDelay: "180ms" }}>
                        <div className="chip-lbl">Categories</div>
                        <div className="chip-val">{new Set(expenses.map(e => e.category || "Other")).size}</div>
                    </div>
                </div>

                {/* Form */}
                <div className="form-card">
                    <div className="form-card-hd">
                        <span className="form-card-title">{editingId ? "Edit Entry" : "New Entry"}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div className="form-badge">{editingId ? "Editing" : "Add"}</div>
                            {editingId && <button className="cancel-link" onClick={cancelEdit}>✕ Cancel</button>}
                        </div>
                    </div>
                    <form onSubmit={handleSave}>
                        <div className="fields-row">
                            <div>
                                <label className="f-lbl">Title</label>
                                <input className="f-inp" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="Netflix, Dinner, Uber…" required />
                            </div>
                            <div>
                                <label className="f-lbl">Amount (₹)</label>
                                <input className="f-inp" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0" required />
                            </div>
                            <div>
                                <label className="f-lbl">Type</label>
                                <select className="f-inp" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="expense">One-time Expense</option>
                                    <option value="subscription">Subscription</option>
                                </select>
                            </div>
                        </div>
                        {form.type === "subscription" && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <label className="f-lbl">🗓 Billing Day of Month</label>
                                    <select className="f-inp" value={form.billing_day} onChange={e => setForm({ ...form, billing_day: e.target.value })}>
                                        <option value="">Select day…</option>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                            <option key={d} value={d}>{d}{d === 1 ? "st" : d === 2 ? "nd" : d === 3 ? "rd" : "th"} of every month</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="f-lbl">⏱ Billing Period</label>
                                    <select className="f-inp" value={form.billing_period} onChange={e => setForm({ ...form, billing_period: e.target.value })}>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly (3 months)</option>
                                        <option value="half-yearly">Half-Yearly (6 months)</option>
                                        <option value="yearly">Yearly (1 year)</option>
                                        <option value="custom">Custom…</option>
                                    </select>
                                    {form.billing_period === "custom" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                                            <input
                                                className="f-inp"
                                                type="number"
                                                min="1"
                                                placeholder="e.g. 5"
                                                value={form.custom_months}
                                                onChange={e => setForm({ ...form, custom_months: e.target.value })}
                                                style={{ width: "90px" }}
                                            />
                                            <span style={{ fontFamily: "var(--fb)", fontSize: "0.82rem", color: "var(--muted)" }}>months</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="fields-row-2">
                            <div>
                                <label className="f-lbl">Category</label>
                                <input className="f-inp" list="log-cat-options" value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    placeholder="Food & Dining, Travel…" />
                                <datalist id="log-cat-options">
                                    {CATEGORIES.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
                            <div />
                            <button type="submit" className="save-btn">
                                {editingId ? "Update →" : "Save Entry →"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Search & count */}
                <div className="search-row">
                    <div className="search-wrap">
                        <span className="search-ico">🔍</span>
                        <input className="search-inp" placeholder="Search title or category…"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <span className="count-tag">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
                </div>

                {/* Table */}
                {loading && <div className="loading-bar" />}
                <div className="table-wrap">
                    <div className="table-head">
                        <span className="th">Title</span>
                        <span className="th">Type</span>
                        <span className="th">Category</span>
                        <span className="th">Amount</span>
                        <span className="th" style={{ textAlign: "right" }}>Actions</span>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="empty">
                            <span className="empty-icon">🧾</span>
                            <div className="empty-t">{search ? "No results found" : "No entries yet"}</div>
                            <div className="empty-s">{search ? `Nothing matches "${search}"` : "Use the form above to add your first entry."}</div>
                        </div>
                    ) : filtered.map((exp, i) => {
                        const typeColor = TYPE_COLORS[exp.expense_type] || TYPE_COLORS.expense;
                        const isSub = exp.expense_type === "subscription";
                        const isStopped = isSub && exp.is_active === false;
                        const periodLabel = { monthly: "/mo", quarterly: "/qtr", "half-yearly": "/6mo", yearly: "/yr" }[exp.billing_period] || (exp.billing_period ? `/${exp.billing_period}` : "");
                        return (
                            <div key={exp.id} className={`tr${isStopped ? " stopped" : ""}`} style={{ animationDelay: `${i * 30}ms` }}>
                                <div>
                                    <div className="td-title-main">
                                        {exp.title}
                                        {isStopped && <span className="stopped-badge" style={{ marginLeft: "0.5rem" }}>Stopped</span>}
                                    </div>
                                    <div className="td-title-sub">
                                        {isSub && exp.billing_day
                                            ? `🗓 ${exp.billing_day}${exp.billing_day === 1 ? "st" : exp.billing_day === 2 ? "nd" : exp.billing_day === 3 ? "rd" : "th"} of every month · ${exp.billing_period || "monthly"}`
                                            : exp.date ? new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                                    </div>
                                </div>
                                <div>
                                    <span className="type-badge" style={{ background: `${typeColor}18`, color: typeColor }}>
                                        {exp.expense_type || "expense"}
                                    </span>
                                </div>
                                <span className="cat-wrap">
                                    {exp.category ? <span className="cat-badge">{exp.category}</span> : <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>}
                                </span>
                                <span className="td-amt">
                                    ₹{Number(exp.amount).toLocaleString("en-IN")}
                                    {periodLabel && <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontFamily: "var(--fb)", fontWeight: 300 }}>{periodLabel}</span>}
                                </span>
                                <div className="td-actions">
                                    {!isStopped && <button className="act-btn edit" onClick={() => startEdit(exp)}>✎</button>}
                                    {isSub
                                        ? isStopped
                                            ? <span className="stopped-badge">Billing off</span>
                                            : <button className="stop-btn" onClick={() => handleStop(exp.id)}>Stop</button>
                                        : <button className="act-btn del" onClick={() => handleDelete(exp.id)}>🗑</button>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === "success" ? "✓" : "✕"} {toast.msg}
                </div>
            )}
        </>
    );
}