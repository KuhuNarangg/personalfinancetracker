"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Counter({ value, duration = 800 }) {
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

function Donut({ data, size = 110 }) {
    const r = 40, cx = 55, cy = 55;
    const circ = 2 * Math.PI * r;
    const total = data.reduce((a, b) => a + b.value, 0);
    const REDS = ["#d94f3d", "#e8604e", "#c1121f", "#ff7a6a", "#a8201a", "#f28b7d"];
    let offset = 0;
    return (
        <svg width={size} height={size} viewBox="0 0 110 110">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(26,23,20,0.07)" strokeWidth="16" />
            {data.map((d, i) => {
                const dash = total ? (d.value / total) * circ : 0;
                const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={REDS[i % REDS.length]} strokeWidth="16"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={-offset} strokeLinecap="butt"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "55px 55px", transition: "stroke-dasharray 0.6s ease" }} />;
                offset += dash;
                return el;
            })}
            <text x="55" y="51" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1a1714" fontFamily="Unbounded,sans-serif">{data.length}</text>
            <text x="55" y="62" textAnchor="middle" fontSize="5.5" fill="#7a7368" fontFamily="Outfit,sans-serif" letterSpacing="0.8">CATS</text>
        </svg>
    );
}

function SparkBars({ expenses }) {
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const ds = d.toISOString().slice(0, 10);
        return expenses.filter(e => (e.date || "").slice(0, 10) === ds).reduce((a, b) => a + Number(b.amount), 0);
    });
    const max = Math.max(...last7, 1);
    const days = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const today = new Date().getDay();
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px" }}>
            {last7.map((v, i) => {
                const dayIdx = (today - 6 + i + 7) % 7;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                        <div style={{
                            width: "100%", borderRadius: "4px 4px 0 0",
                            height: `${Math.max((v / max) * 44, v > 0 ? 8 : 3)}px`,
                            background: i === 6 ? "#d94f3d" : "rgba(26,23,20,0.1)",
                            transition: "height 0.5s ease",
                        }} />
                        <span style={{ fontSize: "0.55rem", color: "#7a7368", fontFamily: "Outfit,sans-serif", fontWeight: 400 }}>{days[dayIdx]}</span>
                    </div>
                );
            })}
        </div>
    );
}

const CAT_REDS = ["#d94f3d", "#e8604e", "#c1121f", "#ff7a6a", "#a8201a", "#f28b7d"];

export default function Dashboard() {
    const [username, setUsername] = useState("");
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [adding, setAdding] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState(null);
    const [filter, setFilter] = useState("all");
    const router = useRouter();

    // ── Read username from localStorage on mount ──
    useEffect(() => {
        const saved = localStorage.getItem("username");
        if (!saved) { router.push("/login"); return; }
        setUsername(saved);
    }, []);

    // ── Auto-fetch when username is set ──
    useEffect(() => {
        if (username) fetchExpenses();
    }, [username]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchExpenses = async () => {
        if (!username) return;
        setLoading(true);
        try {
            const res = await fetch("http://127.0.0.1:8001/api/get-expenses/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            setExpenses(data.expenses || []);
        } catch { showToast("Failed to load expenses", "error"); }
        finally { setLoading(false); }
    };

    const handleAddExpense = async () => {
        if (!title || !amount) return showToast("Fill all fields", "error");
        setAdding(true);
        try {
            await fetch("http://127.0.0.1:8001/api/add-expense/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, title, amount, category }),
            });
            showToast("Expense added!");
            setTitle(""); setAmount(""); setCategory("");
            setShowForm(false);
            fetchExpenses();
        } catch { showToast("Failed to add", "error"); }
        finally { setAdding(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("username");
        router.push("/login");
    };

    // Derived
    const total = expenses.reduce((a, b) => a + Number(b.amount), 0);
    const highest = expenses.length ? Math.max(...expenses.map(e => Number(e.amount))) : 0;
    const avgDay = total ? Math.round(total / 30) : 0;
    const catMap = {};
    expenses.forEach(e => { const k = (e.category || "Other"); catMap[k] = (catMap[k] || 0) + Number(e.amount); });
    const catData = Object.entries(catMap).map(([k, v]) => ({ label: k, value: v }));
    const cats = Object.keys(catMap);
    const filtered = filter === "all" ? expenses : expenses.filter(e => (e.category || "Other") === filter);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Outfit:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        :root {
          --bg:    #f5f2ed;
          --bg2:   #edeae3;
          --bg3:   #e6e1d8;
          --ink:   #1a1714;
          --red:   #d94f3d;
          --red2:  #e8604e;
          --muted: #7a7368;
          --border: rgba(26,23,20,0.09);
          --fh: 'Unbounded', sans-serif;
          --fb: 'Outfit', sans-serif;
        }

        html { scroll-behavior: smooth; }
        body { background:var(--bg); color:var(--ink); font-family:var(--fb); -webkit-font-smoothing:antialiased; }

        /* NAV */
        .nav {
          position:sticky; top:0; z-index:100;
          background:rgba(245,242,237,0.92); backdrop-filter:blur(16px);
          border-bottom:1px solid var(--border);
          height:60px; display:flex; align-items:center; justify-content:space-between;
          padding:0 2.5rem;
          animation: fadeDown 0.5s ease both;
        }
        .nav-logo { font-family:var(--fh); font-size:0.7rem; font-weight:900; letter-spacing:3px; text-transform:uppercase; color:var(--ink); text-decoration:none; display:flex; align-items:center; gap:0.5rem; }
        .nav-logo-sq { width:24px; height:24px; border-radius:5px; background:var(--red); display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:900; color:#fff; }
        .nav-right { display:flex; align-items:center; gap:1rem; }
        .nav-greeting { font-family:var(--fb); font-size:0.85rem; font-weight:400; color:var(--muted); }
        .nav-greeting strong { color:var(--ink); font-weight:600; }
        .nav-add {
          font-family:var(--fh); font-size:0.58rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
          color:#fff; background:var(--red); border:none; cursor:pointer;
          padding:0.5rem 1.1rem; border-radius:7px; display:flex; align-items:center; gap:0.4rem;
          transition:all 0.2s; box-shadow:0 2px 12px rgba(217,79,61,0.25);
        }
        .nav-add:hover { background:var(--red2); transform:translateY(-1px); }
        .nav-logout {
          font-family:var(--fb); font-size:0.8rem; font-weight:400; color:var(--muted);
          background:none; border:1px solid var(--border); border-radius:7px;
          padding:0.45rem 0.9rem; cursor:pointer; transition:all 0.2s;
        }
        .nav-logout:hover { color:var(--ink); border-color:rgba(26,23,20,0.2); }

        /* LAYOUT */
        .layout { display:grid; grid-template-columns:240px 1fr; min-height:calc(100vh - 60px); }

        /* SIDEBAR */
        .sidebar {
          background:#111108; border-right:1px solid rgba(255,255,255,0.05);
          padding:1.75rem 0; display:flex; flex-direction:column; gap:1.75rem;
          animation: fromLeft 0.7s 0.1s cubic-bezier(.16,1,.3,1) both;
        }
        .sb-section { padding:0 1.25rem; }
        .sb-lbl { font-family:var(--fb); font-size:0.58rem; font-weight:500; color:rgba(255,255,255,0.2); letter-spacing:2px; text-transform:uppercase; margin-bottom:0.6rem; padding:0 0.4rem; }
        .sb-link { display:flex; align-items:center; gap:0.6rem; padding:0.6rem 0.75rem; border-radius:8px; margin-bottom:0.1rem; font-family:var(--fb); font-size:0.82rem; font-weight:400; color:rgba(255,255,255,0.3); cursor:pointer; transition:all 0.2s; text-decoration:none; }
        .sb-link:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.65); }
        .sb-link.active { background:rgba(217,79,61,0.12); color:#f0eee9; }
        .sb-dot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.12); flex-shrink:0; }
        .sb-link.active .sb-dot { background:var(--red); }

        .sb-stat { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:0.9rem 1rem; margin-bottom:0.6rem; }
        .sb-stat-l { font-family:var(--fb); font-size:0.58rem; color:rgba(255,255,255,0.2); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:0.25rem; }
        .sb-stat-v { font-family:var(--fh); font-size:1.2rem; font-weight:900; color:#f0eee9; letter-spacing:-1.5px; line-height:1; }
        .sb-stat-v.red { color:var(--red); }

        /* MAIN */
        .main { padding:2rem 2.5rem; animation: fadeUp 0.6s 0.15s ease both; }

        .page-head { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:2rem; padding-bottom:1.5rem; border-bottom:1px solid var(--border); }
        .page-head-title { font-family:var(--fh); font-size:clamp(1.4rem,2.5vw,2rem); font-weight:900; letter-spacing:-2px; color:var(--ink); line-height:1; }
        .page-head-title span { color:var(--red); }
        .page-head-sub { font-family:var(--fb); font-size:0.82rem; color:var(--muted); font-weight:300; margin-top:0.3rem; line-height:1.5; }

        /* STAT CARDS */
        .stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:14px; overflow:hidden; margin-bottom:1.75rem; }
        .stat-card { background:#fff; padding:1.5rem; transition:background 0.2s; animation:riseCard 0.5s ease both; }
        .stat-card:hover { background:var(--bg2); }
        .stat-card-lbl { font-family:var(--fb); font-size:0.65rem; font-weight:500; color:var(--muted); letter-spacing:1.2px; text-transform:uppercase; margin-bottom:0.5rem; }
        .stat-card-val { font-family:var(--fh); font-size:1.55rem; font-weight:900; color:var(--ink); letter-spacing:-1.5px; line-height:1; }
        .stat-card-val.red { color:var(--red); }
        .stat-card-sub { font-family:var(--fb); font-size:0.7rem; color:var(--muted); font-weight:300; margin-top:0.3rem; }

        /* MID */
        .mid { display:grid; grid-template-columns:1fr 260px; gap:1.25rem; margin-bottom:1.75rem; }
        .panel { background:#fff; border:1px solid var(--border); border-radius:14px; overflow:hidden; }
        .panel-head { padding:1rem 1.5rem; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
        .panel-head-title { font-family:var(--fh); font-size:0.7rem; font-weight:700; color:var(--ink); letter-spacing:-0.3px; }
        .panel-head-tag { font-family:var(--fb); font-size:0.65rem; color:var(--muted); font-weight:300; }
        .panel-body { padding:1.5rem; }

        .spark-total { font-family:var(--fh); font-size:1.8rem; font-weight:900; color:var(--ink); letter-spacing:-2px; margin-bottom:1.25rem; line-height:1; }
        .spark-total span { font-size:1rem; color:var(--muted); font-weight:300; letter-spacing:0; }

        .donut-body { padding:1.25rem; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .cat-list { width:100%; display:flex; flex-direction:column; gap:0.45rem; }
        .cat-row { display:flex; align-items:center; gap:0.55rem; }
        .cat-dot { width:7px; height:7px; border-radius:2px; flex-shrink:0; }
        .cat-name { font-family:var(--fb); font-size:0.75rem; color:var(--muted); flex:1; font-weight:400; }
        .cat-amt { font-family:var(--fh); font-size:0.7rem; font-weight:700; color:var(--ink); }

        /* FILTER */
        .filter-bar { display:flex; gap:0.4rem; margin-bottom:1rem; flex-wrap:wrap; }
        .filter-btn { font-family:var(--fb); font-size:0.75rem; font-weight:400; color:var(--muted); background:#fff; border:1px solid var(--border); padding:0.3rem 0.85rem; border-radius:100px; cursor:pointer; transition:all 0.2s; }
        .filter-btn:hover { border-color:var(--red); color:var(--red); }
        .filter-btn.on { background:var(--red); color:#fff; border-color:var(--red); }

        /* TABLE */
        .table-wrap { background:#fff; border:1px solid var(--border); border-radius:14px; overflow:hidden; }
        .table-head { display:grid; grid-template-columns:1fr 140px 110px 100px; padding:0.75rem 1.5rem; background:var(--bg2); border-bottom:1px solid var(--border); }
        .th { font-family:var(--fb); font-size:0.62rem; font-weight:500; color:var(--muted); letter-spacing:1.2px; text-transform:uppercase; }
        .tr {
          display:grid; grid-template-columns:1fr 140px 110px 100px;
          padding:1rem 1.5rem; border-bottom:1px solid var(--border);
          align-items:center; transition:background 0.18s;
          animation:rowIn 0.35s ease both;
        }
        .tr:last-child { border-bottom:none; }
        .tr:hover { background:var(--bg2); }
        .td-title { display:flex; align-items:center; gap:0.65rem; font-family:var(--fb); font-size:0.9rem; font-weight:500; color:var(--ink); }
        .td-dot { width:8px; height:8px; border-radius:3px; flex-shrink:0; }
        .td-cat { font-family:var(--fb); font-size:0.78rem; color:var(--muted); font-weight:400; }
        .td-amt { font-family:var(--fh); font-size:0.9rem; font-weight:700; color:var(--ink); }
        .td-date { font-family:var(--fb); font-size:0.75rem; color:var(--muted); font-weight:300; }

        .empty { text-align:center; padding:3.5rem; }
        .empty-icon { font-size:2.5rem; margin-bottom:0.75rem; animation:bounce 2s ease-in-out infinite; }
        .empty-t { font-family:var(--fh); font-size:0.88rem; font-weight:700; color:var(--ink); letter-spacing:-0.5px; margin-bottom:0.35rem; }
        .empty-s { font-family:var(--fb); font-size:0.8rem; color:var(--muted); font-weight:300; }

        /* MODAL */
        .overlay { position:fixed; inset:0; z-index:500; background:rgba(26,23,20,0.35); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; animation:overlayIn 0.2s ease both; }
        .modal { background:var(--bg); border:1px solid var(--border); border-radius:18px; padding:2.25rem; width:min(430px,92vw); box-shadow:0 32px 64px rgba(26,23,20,0.18); animation:modalIn 0.3s cubic-bezier(.16,1,.3,1) both; }
        .modal-t { font-family:var(--fh); font-size:1rem; font-weight:900; color:var(--ink); letter-spacing:-1px; margin-bottom:0.35rem; }
        .modal-s { font-family:var(--fb); font-size:0.82rem; color:var(--muted); font-weight:300; margin-bottom:1.75rem; }
        .m-field { margin-bottom:1rem; }
        .m-lbl { font-family:var(--fb); font-size:0.62rem; font-weight:500; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase; display:block; margin-bottom:0.4rem; }
        .m-inp { width:100%; font-family:var(--fb); font-size:0.9rem; font-weight:400; color:var(--ink); background:#fff; border:1px solid var(--border); border-radius:9px; padding:0.8rem 1rem; outline:none; transition:border-color 0.2s, box-shadow 0.2s; }
        .m-inp::placeholder { color:rgba(26,23,20,0.2); }
        .m-inp:focus { border-color:var(--red); box-shadow:0 0 0 3px rgba(217,79,61,0.1); }
        .m-actions { display:flex; gap:0.75rem; margin-top:1.5rem; }
        .m-btn { flex:1; font-family:var(--fh); font-size:0.6rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#fff; background:var(--red); border:none; cursor:pointer; padding:0.9rem; border-radius:9px; transition:all 0.2s; box-shadow:0 3px 14px rgba(217,79,61,0.25); }
        .m-btn:hover { background:var(--red2); transform:translateY(-1px); }
        .m-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
        .m-cancel { font-family:var(--fb); font-size:0.82rem; font-weight:400; color:var(--muted); background:transparent; border:1px solid var(--border); padding:0.9rem 1.25rem; border-radius:9px; cursor:pointer; transition:all 0.2s; }
        .m-cancel:hover { background:var(--bg2); color:var(--ink); }

        /* TOAST */
        .toast { position:fixed; bottom:1.75rem; right:1.75rem; z-index:600; display:flex; align-items:center; gap:0.65rem; padding:0.8rem 1.2rem; border-radius:10px; font-family:var(--fb); font-size:0.82rem; font-weight:500; box-shadow:0 8px 28px rgba(26,23,20,0.14); animation:toastIn 0.35s cubic-bezier(.16,1,.3,1) both; }
        .toast.success { background:var(--ink); color:#f0eee9; }
        .toast.error { background:var(--red); color:#fff; }

        /* LOADING */
        .loading-bar { height:2px; background:var(--red); animation:loadBar 1s ease-in-out infinite; border-radius:2px; margin-bottom:1.5rem; }
        @keyframes loadBar { 0%{width:0;opacity:1} 70%{width:100%;opacity:1} 100%{width:100%;opacity:0} }

        @keyframes fadeDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fromLeft { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes riseCard { from{opacity:0;transform:translateY(14px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn    { from{opacity:0;transform:translateX(-8px)}  to{opacity:1;transform:translateX(0)} }
        @keyframes overlayIn{ from{opacity:0} to{opacity:1} }
        @keyframes modalIn  { from{opacity:0;transform:scale(0.95) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes toastIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

        @media (max-width:860px) {
          .layout { grid-template-columns:1fr; }
          .sidebar { display:none; }
          .stat-row { grid-template-columns:1fr 1fr; }
          .mid { grid-template-columns:1fr; }
          .table-head,.tr { grid-template-columns:1fr 90px 90px; }
          .th:last-child,.td-date { display:none; }
        }
      `}</style>

            {/* NAV */}
            <nav className="nav">
                <Link href="/" className="nav-logo">
                    <div className="nav-logo-sq">F</div>
                    Fintrack
                </Link>
                <div className="nav-right">
                    {username && <span className="nav-greeting">Hey, <strong>{username}</strong> 👋</span>}
                    <button className="nav-add" onClick={() => setShowForm(true)}>+ Add Expense</button>
                    <button className="nav-logout" onClick={handleLogout}>Log out</button>
                </div>
            </nav>

            <div className="layout">
                {/* SIDEBAR */}
                <aside className="sidebar">
                    <div className="sb-section">
                        <div className="sb-lbl">Navigation</div>
                        <a className="sb-link active"><span className="sb-dot" />Overview</a>
                        <a className="sb-link"><span className="sb-dot" />Subscriptions</a>
                        <a className="sb-link"><span className="sb-dot" />Analytics</a>
                        <a className="sb-link"><span className="sb-dot" />Goals</a>
                    </div>
                    <div className="sb-section">
                        <div className="sb-lbl">Quick Stats</div>
                        <div className="sb-stat">
                            <div className="sb-stat-l">Total Spent</div>
                            <div className="sb-stat-v red">₹{total.toLocaleString("en-IN")}</div>
                        </div>
                        <div className="sb-stat">
                            <div className="sb-stat-l">Transactions</div>
                            <div className="sb-stat-v">{expenses.length}</div>
                        </div>
                        <div className="sb-stat">
                            <div className="sb-stat-l">Categories</div>
                            <div className="sb-stat-v">{cats.length}</div>
                        </div>
                    </div>
                </aside>

                {/* MAIN */}
                <main className="main">
                    <div className="page-head">
                        <div>
                            <div className="page-head-title">
                                {username ? `${username}'s` : "Your"} <span>Dashboard</span>
                            </div>
                            <div className="page-head-sub">
                                {loading ? "Loading your data…"
                                    : expenses.length > 0
                                        ? `${expenses.length} expense${expenses.length > 1 ? "s" : ""} · ₹${total.toLocaleString("en-IN")} total spend`
                                        : "No expenses yet — add your first one!"}
                            </div>
                        </div>
                    </div>

                    {loading && <div className="loading-bar" />}

                    {/* Stat cards */}
                    <div className="stat-row">
                        {[
                            { lbl: "Total Spent", val: <Counter value={total} />, sub: "all time", red: true, d: "0ms" },
                            { lbl: "Daily Average", val: <Counter value={avgDay} />, sub: "per day (30d avg)", red: false, d: "70ms" },
                            { lbl: "Highest", val: <Counter value={highest} />, sub: "single expense", red: false, d: "140ms" },
                            { lbl: "Entries", val: expenses.length, sub: `${cats.length} categories`, red: false, d: "210ms" },
                        ].map((s, i) => (
                            <div key={i} className="stat-card" style={{ animationDelay: s.d }}>
                                <div className="stat-card-lbl">{s.lbl}</div>
                                <div className={`stat-card-val${s.red ? " red" : ""}`}>{s.val}</div>
                                <div className="stat-card-sub">{s.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Mid row */}
                    <div className="mid">
                        <div className="panel">
                            <div className="panel-head">
                                <span className="panel-head-title">Weekly Spending</span>
                                <span className="panel-head-tag">Last 7 days</span>
                            </div>
                            <div className="panel-body">
                                <div className="spark-total">
                                    ₹{expenses.filter(e => (new Date() - new Date(e.date)) / 86400000 <= 7)
                                        .reduce((a, b) => a + Number(b.amount), 0)
                                        .toLocaleString("en-IN")}
                                    <span> this week</span>
                                </div>
                                <SparkBars expenses={expenses} />
                            </div>
                        </div>

                        <div className="panel">
                            <div className="panel-head">
                                <span className="panel-head-title">By Category</span>
                                <span className="panel-head-tag">{catData.length} cats</span>
                            </div>
                            <div className="donut-body">
                                {catData.length > 0
                                    ? <>
                                        <Donut data={catData} size={100} />
                                        <div className="cat-list">
                                            {catData.map((c, i) => (
                                                <div key={i} className="cat-row">
                                                    <div className="cat-dot" style={{ background: CAT_REDS[i % CAT_REDS.length] }} />
                                                    <span className="cat-name">{c.label}</span>
                                                    <span className="cat-amt">₹{c.value.toLocaleString("en-IN")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                    : <div style={{ padding: "1.5rem 0", textAlign: "center", fontFamily: "var(--fb)", fontSize: "0.82rem", color: "var(--muted)", fontWeight: 300 }}>
                                        Add expenses to see breakdown
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    {expenses.length > 0 && (
                        <div className="filter-bar">
                            <button className={`filter-btn${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>All</button>
                            {cats.map(c => (
                                <button key={c} className={`filter-btn${filter === c ? " on" : ""}`} onClick={() => setFilter(c)}>{c}</button>
                            ))}
                        </div>
                    )}

                    {/* Table */}
                    <div className="table-wrap">
                        <div className="table-head">
                            <span className="th">Title</span>
                            <span className="th">Category</span>
                            <span className="th">Amount</span>
                            <span className="th">Date</span>
                        </div>
                        {filtered.length === 0
                            ? <div className="empty">
                                <div className="empty-icon">🧾</div>
                                <div className="empty-t">No expenses here</div>
                                <div className="empty-s">{username ? "Hit '+ Add Expense' to get started" : "Loading…"}</div>
                            </div>
                            : filtered.map((e, i) => (
                                <div key={i} className="tr" style={{ animationDelay: `${i * 35}ms` }}>
                                    <div className="td-title">
                                        <div className="td-dot" style={{ background: CAT_REDS[cats.indexOf(e.category || "Other") % CAT_REDS.length] || "#7a7368" }} />
                                        {e.title}
                                    </div>
                                    <span className="td-cat">{e.category || "—"}</span>
                                    <span className="td-amt">₹{Number(e.amount).toLocaleString("en-IN")}</span>
                                    <span className="td-date">{e.date ? new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "—"}</span>
                                </div>
                            ))
                        }
                    </div>
                </main>
            </div>

            {/* MODAL */}
            {showForm && (
                <div className="overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal">
                        <div className="modal-t">Add Expense</div>
                        <div className="modal-s">Adding to <strong>{username}'s</strong> account.</div>
                        <div className="m-field">
                            <label className="m-lbl">Title</label>
                            <input className="m-inp" placeholder="e.g. Netflix subscription" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div className="m-field">
                            <label className="m-lbl">Amount (₹)</label>
                            <input className="m-inp" placeholder="e.g. 649" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                        <div className="m-field">
                            <label className="m-lbl">Category</label>
                            <input className="m-inp" placeholder="e.g. Streaming, Food, Cloud…" value={category} onChange={e => setCategory(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddExpense()} />
                        </div>
                        <div className="m-actions">
                            <button className="m-cancel" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="m-btn" onClick={handleAddExpense} disabled={adding}>{adding ? "Adding…" : "Add Expense →"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && <div className={`toast ${toast.type}`}>{toast.type === "success" ? "✓" : "✕"} {toast.msg}</div>}
        </>
    );
}