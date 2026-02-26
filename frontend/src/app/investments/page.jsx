"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INV_TYPES = [
    { value: "sip", label: "SIP Investment", icon: "📈", color: "#2a9d8f", soft: "rgba(42,157,143,0.1)" },
    { value: "emi", label: "EMI / Loan", icon: "🏦", color: "#e9c46a", soft: "rgba(233,196,106,0.15)" },
    { value: "insurance", label: "Insurance", icon: "🛡️", color: "#6c63ff", soft: "rgba(108,99,255,0.1)" },
];

const typeInfo = (t) => INV_TYPES.find(x => x.value === t) || INV_TYPES[0];

const CATEGORIES = [
    "Mutual Fund", "Stocks", "PPF", "NPS", "ELSS",
    "Home Loan", "Car Loan", "Personal Loan", "Education Loan",
    "Term Insurance", "Health Insurance", "Life Insurance", "Vehicle Insurance",
];

export default function InvestmentsPage() {
    const [username, setUsername] = useState("");
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("sip");
    const [form, setForm] = useState({ title: "", amount: "", category: "", billing_day: "", billing_period: "monthly", custom_months: "" });
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [requesting, setRequesting] = useState(false);
    const [theme, setTheme] = useState("light");
    const router = useRouter();

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

    useEffect(() => { if (username) fetchAll(); }, [username]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAll = async () => {
        setLoading(true);
        try {
            const r = await fetch("http://127.0.0.1:8000/api/get-expenses/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const d = await r.json();
            const inv = (d.expenses || []).filter(e => ["sip", "emi", "insurance"].includes(e.expense_type));
            setEntries(inv);
        } catch { showToast("Failed to load", "error"); }
        finally { setLoading(false); }
    };

    const handleRequestStatement = async () => {
        if (!username) return;
        setRequesting(true);
        try {
            const res = await fetch("http://127.0.0.1:8000/api/request-statement/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });
            const d = await res.json();
            if (res.ok) showToast("Statement sent to your email!");
            else showToast(d.error || "Failed to send statement", "error");
        } catch { showToast("Network error", "error"); }
        finally { setRequesting(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title || !form.amount) return showToast("Fill title and amount", "error");
        const endpoint = editingId ? "edit-expense" : "add-expense";
        const body = { ...resolvedBody(form), username, id: editingId, expense_type: tab };
        try {
            await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            showToast(editingId ? "Updated!" : "Added!");
            setForm({ title: "", amount: "", category: "", billing_day: "", billing_period: "monthly", custom_months: "" });
            setEditingId(null);
            fetchAll();
        } catch { showToast("Failed to save", "error"); }
    };

    // resolve custom period before save
    const resolvedBody = (f) => {
        const period = f.billing_period === "custom"
            ? (f.custom_months ? `${f.custom_months}months` : "monthly")
            : f.billing_period;
        return { ...f, billing_period: period };
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this entry?")) return;
        try {
            await fetch("http://127.0.0.1:8000/api/delete-expense/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, id }),
            });
            showToast("Removed!");
            fetchAll();
        } catch { showToast("Delete failed", "error"); }
    };

    const startEdit = (e) => {
        setEditingId(e.id);
        setTab(e.expense_type);
        setForm({
            title: e.title, amount: e.amount,
            category: e.category || "",
            billing_day: e.billing_day || "",
            billing_period: e.billing_period || "monthly",
            custom_months: "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ title: "", amount: "", category: "", billing_day: "", billing_period: "monthly", custom_months: "" });
    };

    const filtered = entries.filter(e => e.expense_type === tab);
    const tabTotal = filtered.reduce((a, b) => a + Number(b.amount), 0);
    const monthly = entries.reduce((a, b) => a + Number(b.amount), 0);
    const info = typeInfo(tab);

    return (
        <div className={theme}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f5f2ed; --bg2: #edeae3; --bg3: #e6e1d8;
          --card-bg: #fff;
          --ink: #1a1714; --red: #d94f3d; --red2: #e8604e;
          --red-glow: rgba(217,79,61,0.22); --red-soft: rgba(217,79,61,0.08);
          --muted: #7a7368; --border: rgba(26,23,20,0.09);
          --fh: 'Plus Jakarta Sans', sans-serif; --fb: 'Outfit', sans-serif;
        }
        .dark {
          --bg: #0d0d0d; --bg2: #1a1a1a; --bg3: #242424;
          --card-bg: #181818;
          --ink: #f0ede8; --muted: #9e9690;
          --red: #e05a48; --red2: #f07060;
          --red-glow: rgba(224,90,72,.25); --red-soft: rgba(224,90,72,.1);
          --border: rgba(255,255,255,0.07);
          --nav-bg: rgba(13,13,13,0.96);
        }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--ink); font-family: var(--fb); -webkit-font-smoothing: antialiased; transition: background .3s, color .3s; }

        /* NAV */
        .nav { position: sticky; top: 0; z-index: 100; background: var(--nav-bg, rgba(245,242,237,0.93)); backdrop-filter: blur(18px); border-bottom: 1px solid var(--border); height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 2.5rem; animation: fadeDown 0.5s ease both; transition: background 0.3s, border-color 0.3s; }
        .nav-logo { font-family: var(--fh); font-size: 0.7rem; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: var(--ink); text-decoration: none; display: flex; align-items: center; gap: 0.5rem; }
        .nav-logo-sq { width: 26px; height: 26px; border-radius: 6px; background: var(--red); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 900; color: #fff; box-shadow: 0 3px 12px var(--red-glow); }
        .nav-right { display: flex; align-items: center; gap: 1rem; }
        .nav-link { font-family: var(--fb); font-size: 0.82rem; color: var(--muted); text-decoration: none; transition: color 0.2s; }
        .nav-link:hover { color: var(--ink); }
        .nav-cta { font-family: var(--fh); font-size: 0.58rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #fff; background: var(--red); border: none; cursor: pointer; padding: 0.5rem 1.1rem; border-radius: 7px; text-decoration: none; display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s; box-shadow: 0 2px 12px var(--red-glow); }
        .nav-cta:hover { background: var(--red2); transform: translateY(-1px); }

        /* LAYOUT */
        .pw { max-width: 960px; margin: 0 auto; padding: 2.5rem 2rem; animation: fadeUp 0.6s 0.1s ease both; }

        /* PAGE HEADER */
        .ph { margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
        .ph-eyebrow { font-family: var(--fb); font-size: 0.62rem; font-weight: 600; color: var(--red); letter-spacing: 2px; text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .ph-eyebrow-line { width: 16px; height: 1px; background: var(--red); }
        .ph-title { font-family: var(--fh); font-size: clamp(1.4rem,2.5vw,2rem); font-weight: 900; letter-spacing: -2px; color: var(--ink); margin-bottom: 0.3rem; }
        .ph-title span { color: var(--red); }
        .ph-sub { font-family: var(--fb); font-size: 0.82rem; color: var(--muted); font-weight: 300; }

        /* STAT CHIPS */
        .chips { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .chip { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 0.9rem 1.25rem; min-width: 150px; animation: riseCard 0.5s ease both; }
        .chip-lbl { font-family: var(--fb); font-size: 0.6rem; font-weight: 500; color: var(--muted); letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 0.3rem; }
        .chip-val { font-family: var(--fh); font-size: 1.3rem; font-weight: 900; letter-spacing: -1px; line-height: 1; }
        .chip.dark { background: var(--bg2); border-color: transparent; }
        .chip.dark .chip-lbl { color: var(--muted); }
        .chip.dark .chip-val { color: var(--ink); }

        /* TYPE TABS */
        .type-tabs { display: flex; gap: 0.75rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .type-tab { display: flex; align-items: center; gap: 0.6rem; font-family: var(--fb); font-size: 0.82rem; font-weight: 400; color: var(--muted); background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 0.65rem 1.2rem; cursor: pointer; transition: all 0.22s; }
        .type-tab:hover { border-color: rgba(255,255,255,0.2) }
        .type-tab.active { font-weight: 600; color: var(--ink); border-color: transparent; box-shadow: 0 4px 18px rgba(0,0,0,0.08); }
        .type-icon { font-size: 1rem; }

        /* FORM */
        .fc { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 1.75rem; margin-bottom: 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.04); animation: riseCard 0.5s 0.1s ease both; }
        .fc-hd { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
        .fc-title { font-family: var(--fh); font-size: 0.72rem; font-weight: 700; color: var(--ink); }
        .fc-badge { font-family: var(--fb); font-size: 0.62rem; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 0.22rem 0.65rem; border-radius: 100px; }
        .cancel-btn { font-family: var(--fb); font-size: 0.8rem; color: var(--muted); cursor: pointer; background: none; border: none; transition: color 0.2s; }
        .cancel-btn:hover { color: var(--ink); }
        .fr { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem; }
        .fr2 { display: grid; grid-template-columns: 2fr auto; gap: 0.85rem; }
        .f-lbl { font-family: var(--fb); font-size: 0.62rem; font-weight: 500; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 0.4rem; }
        .f-inp { width: 100%; font-family: var(--fb); font-size: 0.88rem; color: var(--ink); background: var(--bg2); border: 1px solid var(--border); border-radius: 9px; padding: 0.72rem 0.9rem; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
        .f-inp::placeholder { color: var(--muted); opacity: 0.6; }
        .f-inp:focus { border-color: var(--red); box-shadow: 0 0 0 3px var(--red-soft); }
        .save-btn { font-family: var(--fh); font-size: 0.58rem; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #fff; background: var(--red); border: none; cursor: pointer; padding: 0.72rem 1.5rem; border-radius: 9px; white-space: nowrap; transition: all 0.2s; box-shadow: 0 3px 14px var(--red-glow); align-self: flex-end; height: fit-content; }
        .save-btn:hover { background: var(--red2); transform: translateY(-1px); }

        /* CARDS GRID */
        .inv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .inv-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 1.4rem; position: relative; overflow: hidden; transition: transform 0.22s, box-shadow 0.22s; animation: riseCard 0.5s ease both; }
        .inv-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 3px 3px 0 0; }
        .inv-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .inv-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.85rem; }
        .inv-type-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
        .inv-actions { display: flex; gap: 0.35rem; }
        .act { background: none; border: none; cursor: pointer; font-size: 0.8rem; color: var(--muted); width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .act.edit:hover { color: var(--ink); background: var(--bg2); }
        .act.del:hover { color: var(--red); background: var(--red-soft); }
        .inv-name { font-family: var(--fh); font-size: 0.82rem; font-weight: 700; color: var(--ink); letter-spacing: -0.3px; margin-bottom: 0.15rem; }
        .inv-cat { font-family: var(--fb); font-size: 0.72rem; color: var(--muted); margin-bottom: 0.75rem; }
        .inv-amt { font-family: var(--fh); font-size: 1.5rem; font-weight: 900; letter-spacing: -1px; line-height: 1; margin-bottom: 0.25rem; }
        .inv-amt span { font-size: 0.72rem; color: var(--muted); font-weight: 300; font-family: var(--fb); letter-spacing: 0; }
        .inv-date { font-family: var(--fb); font-size: 0.72rem; color: var(--muted); }

        /* EMPTY */
        .empty { text-align: center; padding: 4rem 2rem; background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; }
        .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; animation: bounce 2s ease-in-out infinite; }
        .empty-t { font-family: var(--fh); font-size: 0.85rem; font-weight: 700; color: var(--ink); letter-spacing: -0.5px; margin-bottom: 0.35rem; }
        .empty-s { font-family: var(--fb); font-size: 0.8rem; color: var(--muted); font-weight: 300; }

        /* LOADING */
        .loading-bar { height: 2px; background: linear-gradient(90deg, var(--red), var(--red2)); border-radius: 2px; animation: loadBar 1s ease-in-out infinite; margin-bottom: 1.5rem; }

        /* TOAST */
        .toast { position: fixed; bottom: 1.75rem; right: 1.75rem; z-index: 600; display: flex; align-items: center; gap: 0.65rem; padding: 0.8rem 1.2rem; border-radius: 10px; font-family: var(--fb); font-size: 0.82rem; font-weight: 500; box-shadow: 0 8px 28px rgba(26,23,20,0.14); animation: toastIn 0.35s cubic-bezier(.16,1,.3,1) both; }
        .toast.success { background: var(--ink); color: #f0eee9; }
        .toast.error   { background: var(--red); color: #fff; }

        /* KEYFRAMES */
        @keyframes fadeDown  { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes riseCard  { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes toastIn   { from{opacity:0;transform:translateX(10px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes bounce    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes loadBar   { 0%{width:0;opacity:1} 70%{width:100%;opacity:1} 100%{width:100%;opacity:0} }

        @media (max-width: 768px) {
          .fr { grid-template-columns: 1fr 1fr; }
          .fr2 { grid-template-columns: 1fr; }
          .pw { padding: 1.5rem 1rem; }
          .nav { padding: 0 1rem; }
        }
      `}</style>

            {/* NAV */}
            <nav className="nav">
                <Link href="/" className="nav-logo">
                    <div className="nav-logo-sq">F</div>
                    PocketPilot
                </Link>
                <div className="nav-right">
                    <button className="btn-theme" onClick={toggleTheme}>
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                    <button className="nav-cta" onClick={handleRequestStatement} disabled={requesting} style={{ background: "var(--ink)", color: "var(--bg)" }}>
                        {requesting ? "Sending..." : "📄 Statement"}
                    </button>
                    <Link href="/logs" className="nav-link">Logs</Link>
                    <Link href="/goals" className="nav-link">Goals</Link>
                    <Link href="/salary" className="nav-link">Smart Investment</Link>
                    <Link href="/dashboard" className="nav-link">Dashboard</Link>
                    <Link href="/dashboard" className="nav-cta">← Back</Link>
                </div>
            </nav>

            <div className="pw">
                {/* Header */}
                <div className="ph">
                    <div className="ph-eyebrow"><div className="ph-eyebrow-line" />Investments & Commitments</div>
                    <div className="ph-title">Your <span>Portfolio</span></div>
                    <div className="ph-sub">{entries.length} tracked · ₹{monthly.toLocaleString("en-IN")} /mo total commitment</div>
                </div>

                {/* Stat Chips */}
                <div className="chips">
                    <div className="chip dark" style={{ animationDelay: "0ms" }}>
                        <div className="chip-lbl">Total / Month</div>
                        <div className="chip-val">₹{monthly.toLocaleString("en-IN")}</div>
                    </div>
                    {INV_TYPES.map((t, i) => {
                        const count = entries.filter(e => e.expense_type === t.value);
                        const tot = count.reduce((a, b) => a + Number(b.amount), 0);
                        return (
                            <div key={t.value} className="chip" style={{ animationDelay: `${(i + 1) * 60}ms` }}>
                                <div className="chip-lbl">{t.label}</div>
                                <div className="chip-val" style={{ color: t.color }}>
                                    {count.length > 0 ? `₹${tot.toLocaleString("en-IN")}` : count.length}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Type Tabs */}
                <div className="type-tabs">
                    {INV_TYPES.map(t => (
                        <div key={t.value}
                            className={`type-tab${tab === t.value ? " active" : ""}`}
                            style={tab === t.value ? { background: t.soft, borderColor: t.color + "44" } : {}}
                            onClick={() => { setTab(t.value); cancelEdit(); }}>
                            <span className="type-icon">{t.icon}</span>
                            {t.label}
                            <span style={{ fontFamily: "var(--fh)", fontSize: "0.65rem", color: t.color, marginLeft: "0.3rem" }}>
                                {entries.filter(e => e.expense_type === t.value).length}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="fc">
                    <div className="fc-hd">
                        <span className="fc-title">{editingId ? `Edit ${info.label}` : `Add ${info.label}`}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span className="fc-badge" style={{ color: info.color, background: info.soft, border: `1px solid ${info.color}30` }}>
                                {info.icon} {info.label}
                            </span>
                            {editingId && <button className="cancel-btn" onClick={cancelEdit}>✕ Cancel</button>}
                        </div>
                    </div>
                    <form onSubmit={handleSave}>
                        <div className="fr">
                            <div>
                                <label className="f-lbl">Title</label>
                                <input className="f-inp" value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder={tab === "sip" ? "e.g. Mirae Asset Large Cap" : tab === "emi" ? "e.g. Home Loan EMI" : "e.g. LIC Term Plan"} required />
                            </div>
                            <div>
                                <label className="f-lbl">Amount (₹/mo)</label>
                                <input className="f-inp" type="number" value={form.amount}
                                    onChange={e => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0" required />
                            </div>
                            <div>
                                <label className="f-lbl">Category</label>
                                <input className="f-inp" list="inv-cat-opts" value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    placeholder="Mutual Fund, Car Loan…" />
                                <datalist id="inv-cat-opts">
                                    {CATEGORIES.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </div>
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
                                        <input className="f-inp" type="number" min="1" placeholder="e.g. 5"
                                            value={form.custom_months}
                                            onChange={e => setForm({ ...form, custom_months: e.target.value })}
                                            style={{ width: "90px" }} />
                                        <span style={{ fontFamily: "var(--fb)", fontSize: "0.82rem", color: "var(--muted)" }}>months</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="fr2">
                            <div />
                            <button type="submit" className="save-btn" style={{ background: info.color }}>
                                {editingId ? "Update →" : `Add ${info.icon} →`}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Cards */}
                {loading && <div className="loading-bar" />}

                {filtered.length === 0 ? (
                    <div className="empty">
                        <span className="empty-icon">{info.icon}</span>
                        <div className="empty-t">No {info.label}s yet</div>
                        <div className="empty-s">Use the form above to add your first {info.label.toLowerCase()}.</div>
                    </div>
                ) : (
                    <div className="inv-grid">
                        {filtered.map((e, i) => {
                            const t = typeInfo(e.expense_type);
                            return (
                                <div key={e.id} className="inv-card" style={{ "--card-top": t.color, animationDelay: `${i * 50}ms` }}>
                                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: t.color, borderRadius: "3px 3px 0 0" }} />
                                    <div className="inv-top">
                                        <div className="inv-type-icon" style={{ background: t.soft }}>
                                            {t.icon}
                                        </div>
                                        <div className="inv-actions">
                                            <button className="act edit" onClick={() => startEdit(e)}>✎</button>
                                            <button className="act del" onClick={() => handleDelete(e.id)}>🗑</button>
                                        </div>
                                    </div>
                                    <div className="inv-name">{e.title}</div>
                                    <div className="inv-cat">{e.category || t.label}</div>
                                    <div className="inv-amt" style={{ color: t.color }}>
                                        ₹{Number(e.amount).toLocaleString("en-IN")}
                                        <span> {e.billing_period === "monthly" ? "/mo" : e.billing_period === "yearly" ? "/yr" : e.billing_period === "quarterly" ? "/qtr" : e.billing_period === "half-yearly" ? "/6mo" : e.billing_period ? `/${e.billing_period}` : "/mo"}</span>
                                    </div>
                                    {e.billing_day && (
                                        <div className="inv-date">
                                            🗓 {e.billing_day}{e.billing_day === 1 ? "st" : e.billing_day === 2 ? "nd" : e.billing_day === 3 ? "rd" : "th"} of every month
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === "success" ? "✓" : "✕"} {toast.msg}
                </div>
            )}
        </div>
    );
}
