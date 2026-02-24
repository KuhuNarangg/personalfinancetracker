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
    const router = useRouter();

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
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Outfit:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#f5f2ed;--bg2:#edeae3;--bg3:#e5e0d8;
          --ink:#1a1714;--muted:#7a7368;--faint:#b0a898;
          --red:#d94f3d;--red2:#e8604e;
          --red-glow:rgba(217,79,61,.2);--red-soft:rgba(217,79,61,.07);
          --border:rgba(26,23,20,.09);
          --fh:'Unbounded',sans-serif;--fb:'Outfit',sans-serif;
          --rad:14px;--rads:9px;
        }
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--ink);font-family:var(--fb);-webkit-font-smoothing:antialiased}

        /* NAV */
        .nav{
          position:sticky;top:0;z-index:200;
          background:rgba(245,242,237,.94);backdrop-filter:blur(20px);
          border-bottom:1px solid var(--border);
          height:62px;display:flex;align-items:center;justify-content:space-between;
          padding:0 2rem;gap:1rem;
          animation:slideDown .5s ease both;
        }
        .nav-left{display:flex;align-items:center;gap:2rem}
        .nav-logo{font-family:var(--fh);font-size:.68rem;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:.5rem}
        .logo-sq{width:28px;height:28px;border-radius:7px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:900;color:#fff;box-shadow:0 3px 12px var(--red-glow);transition:transform .2s,box-shadow .2s}
        .nav-logo:hover .logo-sq{transform:scale(1.08);box-shadow:0 5px 18px var(--red-glow)}
        .nav-links{display:flex;align-items:center;gap:.2rem}
        .nav-link{font-family:var(--fb);font-size:.83rem;font-weight:400;color:var(--muted);padding:.38rem .85rem;border-radius:8px;text-decoration:none;transition:all .18s;border:none;background:none;cursor:pointer;white-space:nowrap}
        .nav-link:hover{color:var(--ink);background:var(--bg2)}
        .nav-link.cur{color:var(--ink);font-weight:600;background:var(--bg2)}
        .nav-right{display:flex;align-items:center;gap:.75rem}
        .nav-greet{font-family:var(--fb);font-size:.85rem;color:var(--muted);white-space:nowrap}
        .nav-greet strong{color:var(--ink);font-weight:600}
        .btn-add{font-family:var(--fh);font-size:.56rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#fff;background:var(--red);border:none;cursor:pointer;padding:.5rem 1.1rem;border-radius:8px;display:flex;align-items:center;gap:.4rem;box-shadow:0 2px 12px var(--red-glow);transition:all .2s;white-space:nowrap}
        .btn-add:hover{background:var(--red2);transform:translateY(-1px);box-shadow:0 5px 18px var(--red-glow)}
        .btn-logout{font-family:var(--fb);font-size:.8rem;color:var(--muted);background:none;border:1px solid var(--border);border-radius:8px;padding:.42rem .9rem;cursor:pointer;transition:all .2s}
        .btn-logout:hover{color:var(--ink);border-color:rgba(26,23,20,.2)}

        /* SHELL */
        .shell{display:flex;min-height:calc(100vh - 62px)}

        /* SIDEBAR */
        .sidebar{width:220px;flex-shrink:0;background:#0f0e0b;border-right:1px solid rgba(255,255,255,.05);padding:1.5rem 0;display:flex;flex-direction:column;gap:1.5rem;position:sticky;top:62px;height:calc(100vh - 62px);overflow-y:auto;animation:fromLeft .6s .1s cubic-bezier(.16,1,.3,1) both}
        .sb-sec{padding:0 1rem}
        .sb-lbl{font-family:var(--fb);font-size:.56rem;font-weight:500;color:rgba(255,255,255,.18);letter-spacing:2px;text-transform:uppercase;margin-bottom:.5rem;padding:0 .5rem}
        .sb-item{display:flex;align-items:center;gap:.55rem;padding:.58rem .65rem;border-radius:8px;font-family:var(--fb);font-size:.82rem;font-weight:400;color:rgba(255,255,255,.28);cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:all .18s;text-decoration:none}
        .sb-item:hover{background:rgba(255,255,255,.05);color:rgba(255,255,255,.6)}
        .sb-item.cur{background:rgba(217,79,61,.13);color:#f0ede8;font-weight:500}
        .sb-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.1);flex-shrink:0;transition:all .2s}
        .sb-item.cur .sb-dot{background:var(--red);box-shadow:0 0 6px var(--red-glow)}
        .sb-divider{height:1px;background:rgba(255,255,255,.05);margin:.25rem 1rem}
        .sb-stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);border-radius:10px;padding:.8rem .9rem;margin-bottom:.4rem;transition:background .2s}
        .sb-stat:hover{background:rgba(255,255,255,.07)}
        .sb-stat-l{font-family:var(--fb);font-size:.55rem;color:rgba(255,255,255,.18);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:.2rem}
        .sb-stat-v{font-family:var(--fh);font-size:1.05rem;font-weight:900;color:#f0ede8;letter-spacing:-1px;line-height:1}
        .sb-stat-v.r{color:var(--red)}

        /* MAIN */
        .main{flex:1;padding:1.75rem 2rem;overflow:hidden;animation:fadeUp .6s .15s ease both}
        .pg-head{margin-bottom:1.5rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)}
        .pg-title{font-family:var(--fh);font-size:clamp(1.2rem,2vw,1.6rem);font-weight:900;letter-spacing:-1.5px;color:var(--ink);line-height:1}
        .pg-title span{color:var(--red)}
        .pg-sub{font-family:var(--fb);font-size:.82rem;color:var(--muted);font-weight:300;margin-top:.25rem}

        /* TAB BAR */
        .tab-bar{display:inline-flex;gap:.2rem;background:#fff;border:1px solid var(--border);border-radius:12px;padding:.28rem;margin-bottom:1.5rem}
        .tab-btn{font-family:var(--fb);font-size:.82rem;font-weight:400;color:var(--muted);background:none;border:none;cursor:pointer;padding:.42rem 1rem;border-radius:9px;transition:all .2s;white-space:nowrap}
        .tab-btn:hover{color:var(--ink);background:var(--bg2)}
        .tab-btn.on{background:var(--red);color:#fff;font-weight:600;box-shadow:0 2px 10px var(--red-glow)}

        /* STAT ROW */
        .stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:var(--rad);overflow:hidden;margin-bottom:1.25rem}
        .sc{background:#fff;padding:1.35rem 1.25rem;transition:background .2s;animation:riseCard .5s ease both}
        .sc:hover{background:var(--bg2)}
        .sc.hl{background:var(--red)}
        .sc.hl:hover{background:var(--red2)}
        .sc-lbl{font-family:var(--fb);font-size:.62rem;font-weight:500;color:var(--muted);letter-spacing:1.1px;text-transform:uppercase;margin-bottom:.45rem}
        .sc.hl .sc-lbl{color:rgba(255,255,255,.55)}
        .sc-val{font-family:var(--fh);font-size:1.5rem;font-weight:900;color:var(--red);letter-spacing:-1.5px;line-height:1}
        .sc.hl .sc-val{color:#fff}
        .sc-sub{font-family:var(--fb);font-size:.68rem;color:var(--faint);font-weight:300;margin-top:.28rem}
        .sc.hl .sc-sub{color:rgba(255,255,255,.45)}

        /* PANELS */
        .two-col{display:grid;grid-template-columns:1fr 256px;gap:1.1rem;margin-bottom:1.25rem}
        .panel{background:#fff;border:1px solid var(--border);border-radius:var(--rad);overflow:hidden}
        .panel-hd{padding:.9rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
        .panel-title{font-family:var(--fh);font-size:.68rem;font-weight:700;color:var(--ink);letter-spacing:-.2px}
        .panel-tag{font-family:var(--fb);font-size:.63rem;color:var(--red);font-weight:600;background:var(--red-soft);padding:.2rem .6rem;border-radius:100px}
        .panel-body{padding:1.25rem}
        .chart-total{font-family:var(--fh);font-size:1.6rem;font-weight:900;color:var(--ink);letter-spacing:-2px;margin-bottom:1.1rem;line-height:1}
        .chart-total span{font-family:var(--fb);font-size:.9rem;color:var(--muted);font-weight:300;letter-spacing:0}
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
        .sum-card{background:#fff;border:1px solid var(--border);border-radius:var(--rad);padding:1.2rem;display:flex;flex-direction:column;gap:.55rem;transition:transform .22s,box-shadow .22s;animation:riseCard .5s ease both;position:relative;overflow:hidden}
        .sum-card::after{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .3s cubic-bezier(.16,1,.3,1)}
        .sum-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(26,23,20,.08)}
        .sum-card:hover::after{transform:scaleX(1)}
        .sum-icon{width:36px;height:36px;border-radius:9px;background:var(--red-soft);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1rem}
        .sum-name{font-family:var(--fh);font-size:.78rem;font-weight:700;color:var(--ink);letter-spacing:-.2px}
        .sum-cat{font-family:var(--fb);font-size:.7rem;color:var(--muted)}
        .sum-amt{font-family:var(--fh);font-size:1.2rem;font-weight:900;color:var(--red);letter-spacing:-1px;line-height:1}
        .sum-per{font-family:var(--fb);font-size:.68rem;color:var(--faint);font-weight:300}
        .sum-date{font-family:var(--fb);font-size:.7rem;color:var(--muted)}
        .sum-badge{display:inline-flex;font-family:var(--fb);font-size:.58rem;font-weight:600;letter-spacing:.8px;text-transform:uppercase;padding:.18rem .55rem;border-radius:100px}
        .b-red{background:var(--red-soft);color:var(--red)}
        .b-gray{background:var(--bg2);color:var(--muted)}

        /* SIP CARD */
        .sip-card{background:#fff;border:1px solid var(--border);border-radius:var(--rad);padding:1.2rem;display:flex;align-items:center;gap:1rem;transition:background .2s;animation:riseCard .5s ease both}
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
        .overlay{position:fixed;inset:0;z-index:500;background:rgba(26,23,20,.42);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease both}
        .modal{background:var(--bg);border:1px solid var(--border);border-radius:18px;padding:2rem;width:min(440px,94vw);box-shadow:0 30px 70px rgba(26,23,20,.2);animation:popUp .3s cubic-bezier(.16,1,.3,1) both}
        .modal-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.25rem}
        .modal-tag{font-family:var(--fb);font-size:.6rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--red);background:var(--red-soft);border:1px solid rgba(217,79,61,.15);padding:.2rem .65rem;border-radius:100px;margin-bottom:.45rem;display:inline-block}
        .modal-title{font-family:var(--fh);font-size:.95rem;font-weight:900;color:var(--ink);letter-spacing:-.8px}
        .modal-close{background:none;border:none;cursor:pointer;font-size:.9rem;color:var(--muted);width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .modal-close:hover{background:var(--bg2);color:var(--ink)}
        .type-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1.1rem}
        .type-btn{display:flex;flex-direction:column;align-items:center;gap:.3rem;padding:.65rem .4rem;border:1.5px solid var(--border);border-radius:10px;background:#fff;cursor:pointer;transition:all .18s;font-family:var(--fb)}
        .type-btn span:first-child{font-size:1.1rem}
        .type-btn span:last-child{font-size:.65rem;font-weight:500;color:var(--muted)}
        .type-btn:hover,.type-btn.on{border-color:var(--red);background:var(--red-soft)}
        .type-btn.on span:last-child{color:var(--red);font-weight:700}
        .m-field{margin-bottom:.9rem}
        .m-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:.9rem}
        .m-lbl{display:block;font-family:var(--fb);font-size:.6rem;font-weight:500;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.35rem}
        .m-inp{width:100%;font-family:var(--fb);font-size:.9rem;font-weight:400;color:var(--ink);background:#fff;border:1.5px solid var(--border);border-radius:var(--rads);padding:.72rem .9rem;outline:none;transition:border-color .2s,box-shadow .2s}
        .m-inp::placeholder{color:rgba(26,23,20,.2)}
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
                    <Link href="/" className="nav-logo">
                        <div className="logo-sq">F</div>
                        Fintrack
                    </Link>
                    <div className="nav-links">
                        <Link href="/dashboard" className="nav-link cur">Dashboard</Link>
                        <Link href="/logs" className="nav-link">Logs</Link>
                        <Link href="/investments" className="nav-link">Investments</Link>
                    </div>
                </div>
                <div className="nav-right">
                    {username && <span className="nav-greet">Hey, <strong>{username}</strong> 👋</span>}
                    <button className="btn-add" onClick={handleRequestStatement} disabled={requesting} style={{ background: "var(--ink)", color: "white" }}>
                        {requesting ? "Sending..." : "📄 Statement"}
                    </button>
                    <button className="btn-add" onClick={() => router.push("/logs")}>+ Add Expense</button>
                    <button className="btn-logout" onClick={() => { localStorage.removeItem("username"); router.push("/login"); }}>Log out</button>
                </div>
            </nav>

            <div className="shell">
                {/* ── SIDEBAR ── */}
                <aside className="sidebar">
                    <div className="sb-sec">
                        <div className="sb-lbl">Pages</div>
                        {[
                            { label: "Dashboard", icon: "◈", href: "/dashboard" },
                            { label: "Logs", icon: "☰", href: "/logs" },
                            { label: "Investments", icon: "📈", href: "/investments" },
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
        </>
    );
}
