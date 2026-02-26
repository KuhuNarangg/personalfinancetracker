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

/* ─── Mini Donut / Pie Chart ──────────────────────── */
function MiniDonut({ data, size = 160 }) {
    const r = size * 0.35;
    const cx = size / 2;
    const cy = size / 2;
    const circ = 2 * Math.PI * r;
    const total = data.reduce((a, b) => a + b.v, 0);
    let off = 0;

    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(26,23,20,0.06)" strokeWidth={size * 0.15} />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(26,23,20,0.06)" strokeWidth={size * 0.15} />
            {data.map((d, i) => {
                const dash = (d.v / total) * circ;
                const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={d.color} strokeWidth={size * 0.15}
                    strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-off}
                    style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px`, transition: "stroke-dasharray 1s cubic-bezier(.16,1,.3,1)" }} />;
                off += dash;
                return el;
            })}
        </svg>
    );
}

/* ─── SALARY CALC PAGE ────────────────────────────── */
export default function SalaryPage() {
    const [username, setUsername] = useState("");
    const [ctcInput, setCtcInput] = useState("");
    const [inHandInput, setInHandInput] = useState("");  // direct in-hand monthly
    const [directMode, setDirectMode] = useState(false); // checkbox state
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

    // ── Tax Calculation (CTC mode) ──────────────────────────
    let gross = Number(ctcInput) || 0;
    const stdDeduction = 75000;

    const taxable = Math.max(0, gross - stdDeduction);
    let tax = 0;
    let temp = taxable;

    // Step 1: Slab calculation (new regime)
    if (temp > 1500000) {
        tax += (temp - 1500000) * 0.30;
        temp = 1500000;
    }
    if (temp > 1200000) {
        tax += (temp - 1200000) * 0.20;
        temp = 1200000;
    }
    if (temp > 900000) {
        tax += (temp - 900000) * 0.15;
        temp = 900000;
    }
    if (temp > 600000) {
        tax += (temp - 600000) * 0.10;
        temp = 600000;
    }
    if (temp > 300000) {
        tax += (temp - 300000) * 0.05;
    }

    // Step 2: Rebate (IMPORTANT — use original taxable)
    if (taxable <= 700000) {
        tax = 0;
    }

    // Step 3: Marginal Relief (correct logic)
    if (taxable > 700000) {
        const extraIncome = taxable - 700000;
        tax = Math.min(tax, extraIncome);
    }

    // Step 4: Add cess
    tax = tax * 1.04;

    // Final in-hand
    const inHandAnnual = Math.max(0, gross - tax);
    const inHandMonthly = inHandAnnual / 12;

    // ── Budget planner ──────────────────────────
    const directMonthly = Number(inHandInput) || 0;
    const budgetBase = directMode ? directMonthly : inHandMonthly;

    const needs = budgetBase * 0.50;
    const wants = budgetBase * 0.30;
    const invest = budgetBase * 0.20;

    const chartData = [
        { name: "Needs (50%)", v: needs || 0, color: "#d94f3d" },
        { name: "Wants (30%)", v: wants || 0, color: "#ff8fab" },
        { name: "Invest/Save (20%)", v: invest || 0, color: "#e8604e" },
    ];
    return (
        <div className={theme}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#f5f2ed;--bg2:#edeae3;
          --card-bg:#fff;
          --ink:#1a1714;--muted:#7a7368;--faint:#b0a898;
          --red:#d94f3d;--red2:#e8604e;
          --red-glow:rgba(217,79,61,.2);--red-soft:rgba(217,79,61,.07);
          --border:rgba(26,23,20,.09);
          --fh:'Plus Jakarta Sans',sans-serif;--fb:'Outfit',sans-serif;
          --rad:16px;
        }
        .dark {
          --bg: #0d0d0d; --bg2: #1a1a1a;
          --card-bg: #181818;
          --ink: #f0ede8; --muted: #9e9690; --faint: #6a6460;
          --red: #e05a48; --red2: #f07060;
          --red-glow: rgba(224,90,72,.25); --red-soft: rgba(224,90,72,.1);
          --border: rgba(255,255,255,0.07);
          --nav-bg: rgba(13,13,13,0.96);
        }
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--ink);font-family:var(--fb);-webkit-font-smoothing:antialiased;min-height:100vh;transition:background .3s,color .3s}

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
        }
        .nav-logo{font-family:var(--fh);font-size:.68rem;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:var(--ink);text-decoration:none;display:flex;align-items:center;gap:.5rem}
        .logo-sq{width:28px;height:28px;border-radius:7px;background:var(--red);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:900;color:#fff;box-shadow:0 3px 12px var(--red-glow);transition:transform .2s,box-shadow .2s}
        .nav-logo:hover .logo-sq{transform:scale(1.08);box-shadow:0 5px 18px var(--red-glow)}
        .nav-right{display:flex;align-items:center;gap:1.5rem}
        .nav-link{font-family:var(--fb);font-size:.83rem;font-weight:500;color:var(--muted);text-decoration:none;transition:color .2s}
        .nav-link:hover,.nav-link.cur{color:var(--ink)}
        .nav-link.cur{font-weight:700}
        .nav-cta{font-family:var(--fh);font-size:.6rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#fff;background:var(--red);border:none;cursor:pointer;padding:.5rem 1.1rem;border-radius:8px;text-decoration:none;box-shadow:0 3px 12px var(--red-glow);transition:all .2s}
        .nav-cta:hover{transform:translateY(-2px);background:var(--red2);box-shadow:0 6px 16px var(--red-glow)}

        /* CONTENT */
        .page-wrap{max-width:1080px;margin:0 auto;padding:3rem 2rem;animation:fadeUp .6s .1s ease both}
        
        .pg-head{margin-bottom:2rem;text-align:center}
        .pg-title{font-family:var(--fh);font-size:clamp(1.8rem,4vw,2.5rem);font-weight:900;letter-spacing:-1.5px;color:var(--ink);line-height:1;margin-bottom:.5rem}
        .pg-title span{color:var(--red)}
        .pg-sub{font-family:var(--fb);font-size:.95rem;color:var(--muted);font-weight:400;max-width:500px;margin:0 auto}

        /* INPUT BOX */
        .calc-box{background:var(--card-bg);border:1px solid var(--border);border-radius:var(--rad);padding:2.5rem;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.05);margin-bottom:2rem;transition:transform .3s,background .3s;position:relative;z-index:10}
        .calc-box:hover{transform:translateY(-3px)}
        .calc-lbl{font-family:var(--fh);font-size:.8rem;font-weight:700;color:var(--ink);letter-spacing:-.2px;margin-bottom:1rem;display:block}
        .ctc-input-wrap{position:relative;max-width:320px;margin:0 auto}
        .ctc-sym{position:absolute;left:1.2rem;top:50%;transform:translateY(-50%);font-family:var(--fh);font-size:1.5rem;font-weight:900;color:var(--muted)}
        .ctc-input{width:100%;background:var(--bg);border:2px solid var(--border);border-radius:12px;padding:1rem 1.2rem 1rem 2.8rem;font-family:var(--fh);font-size:1.6rem;font-weight:900;color:var(--ink);text-align:center;outline:none;transition:all .2s;letter-spacing:-1px}
        .ctc-input:focus{background:var(--bg2);border-color:var(--red);box-shadow:0 0 0 4px var(--red-soft)}
        .std-deduct{font-family:var(--fb);font-size:.75rem;color:var(--muted);margin-top:.85rem;display:flex;align-items:center;justify-content:center;gap:.3rem}
        .std-deduct span{background:var(--bg);padding:.15rem .45rem;border-radius:4px;font-weight:600;color:var(--ink)}

        /* RESULTS GRID */
        .res-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:2rem}
        
        /* CARD */
        .card{background:var(--card-bg);border:1px solid var(--border);border-radius:var(--rad);padding:2rem;box-shadow:0 6px 20px rgba(0,0,0,.03);transition:background .3s}
        .card-title{font-family:var(--fh);font-size:.9rem;font-weight:900;color:var(--ink);letter-spacing:-.3px;margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem}
        .card-title .i{color:var(--red);font-size:1.1rem}
        
        .divider{height:1px;background:var(--border);margin:1.25rem 0}

        /* BREAKDOWN ROWS */
        .b-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:.85rem}
        .b-lbl{font-family:var(--fb);font-size:.85rem;color:var(--muted);font-weight:400}
        .b-val{font-family:var(--fb);font-size:.9rem;color:var(--ink);font-weight:600}
        .b-row.red .b-val{color:var(--red)}
        .b-row.total{margin-top:1.25rem;padding-top:1.25rem;border-top:1px dashed var(--border)}
        .b-row.total .b-lbl{font-family:var(--fh);font-size:.9rem;color:var(--ink);font-weight:800;letter-spacing:-.5px}
        .b-row.total .b-val{font-family:var(--fh);font-size:1.5rem;font-weight:900;letter-spacing:-1px}
        
        /* CHECKBOX ROW */
        .mode-row{display:flex;align-items:center;justify-content:center;gap:.65rem;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border)}
        .mode-cb{width:17px;height:17px;accent-color:var(--red);cursor:pointer;border-radius:4px;flex-shrink:0}
        .mode-lbl{font-family:var(--fb);font-size:.8rem;color:var(--muted);cursor:pointer;user-select:none}
        .mode-lbl b{color:var(--ink)}

        /* DIRECT INPUT */
        .direct-box{margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border);animation:fadeUp .35s ease both}
        .direct-lbl{font-family:var(--fh);font-size:.75rem;font-weight:700;color:var(--ink);letter-spacing:-.1px;margin-bottom:.75rem;display:block;text-align:center}
        .direct-badge{display:inline-flex;align-items:center;gap:.35rem;background:var(--red-soft);color:var(--red);border:1px solid rgba(217,79,61,.2);font-family:var(--fb);font-size:.68rem;font-weight:600;letter-spacing:.8px;text-transform:uppercase;padding:.22rem .65rem;border-radius:100px;margin-bottom:.85rem}
        .chart-sec{display:flex;align-items:center;gap:2rem}
        .chart-legend{flex:1;display:flex;flex-direction:column;gap:.85rem}
        
        .leg-row{display:flex;align-items:center;justify-content:space-between}
        .leg-left{display:flex;align-items:center;gap:.5rem}
        .leg-dot{width:12px;height:12px;border-radius:50%}
        .leg-lbl{font-family:var(--fb);font-size:.85rem;font-weight:600;color:var(--ink)}
        .leg-val{font-family:var(--fh);font-size:.85rem;font-weight:700;letter-spacing:-.5px}

        /* KEYFRAMES */
        @keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

        @media(max-width:800px){
            .res-grid{grid-template-columns:1fr}
            .chart-sec{flex-direction:column;text-align:center}
            .chart-legend{width:100%}
            .leg-row{padding:0 1rem}
            .nav{padding:0 1rem}
        }
      `}</style>

            <nav className="nav">
                <Link href="/" className="nav-logo">
                    <div className="logo-sq">F</div>
                    PocketPilot
                </Link>
                <div className="nav-right">
                    <button className="btn-theme" onClick={toggleTheme}>
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                    <Link href="/dashboard" className="nav-link">Dashboard</Link>
                    <Link href="/logs" className="nav-link">Logs</Link>
                    <Link href="/investments" className="nav-link">Investments</Link>
                    <Link href="/goals" className="nav-link">Goals</Link>
                    <Link href="/salary" className="nav-link cur">Smart Investment</Link>
                    <Link href="/dashboard" className="nav-cta">← Back</Link>
                </div>
            </nav>

            <main className="page-wrap">
                <div className="pg-head">
                    <h1 className="pg-title">Salary & <span>Tax Planner</span></h1>
                    <p className="pg-sub">Calculate your exact In-Hand Salary under the New Tax Regime (FY24-25) and intelligently budget your monthly income.</p>
                </div>

                <div className="calc-box">
                    {/* ── Mode toggle row ── */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                        <label className="calc-lbl" style={{ margin: 0 }}>
                            {directMode ? "Enter your Monthly In-Hand salary (₹)" : "Enter your Annual CTC (₹)"}
                        </label>
                        <label className="mode-row" style={{ margin: 0, padding: 0, border: "none" }}>
                            <input
                                type="checkbox"
                                className="mode-cb"
                                checked={directMode}
                                onChange={() => setDirectMode(d => !d)}
                            />
                            <span className="mode-lbl">I know my <b>in-hand</b> salary</span>
                        </label>
                    </div>

                    {/* ── Main input ── */}
                    {!directMode && (
                        <div className="ctc-input-wrap">
                            <span className="ctc-sym">₹</span>
                            <input
                                className="ctc-input"
                                type="number"
                                placeholder="1200000"
                                value={ctcInput}
                                onChange={(e) => setCtcInput(e.target.value)}
                            />
                        </div>
                    )}

                    {/* ── Direct in-hand input ── */}
                    {directMode && (
                        <div className="direct-box">
                            <div style={{ textAlign: "center" }}>
                                <span className="direct-badge">✓ Post-Tax Mode</span>
                            </div>
                            <div className="ctc-input-wrap">
                                <span className="ctc-sym">₹</span>
                                <input
                                    className="ctc-input"
                                    type="number"
                                    placeholder="80000"
                                    value={inHandInput}
                                    onChange={(e) => setInHandInput(e.target.value)}
                                />
                            </div>
                            <p style={{ fontFamily: "var(--fb)", fontSize: ".72rem", color: "var(--muted)", textAlign: "center", marginTop: ".75rem" }}>
                                Enter your actual <b>monthly in-hand</b> (after all deductions). The 50-30-20 budget will be calculated directly from this.
                            </p>
                        </div>
                    )}

                    {/* ── Standard deduction note ── */}
                    {!directMode && (
                        <div className="std-deduct" style={{ marginTop: ".85rem" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            The tax calculations are not 100% accurate , so if you know your in hand salary click the checkbox
                        </div>
                    )}
                </div>

                <div className="res-grid">
                    {/* ── TAX BREAKDOWN (only in CTC mode) ── */}
                    {!directMode && (
                        <div className="card">
                            <div className="card-title"><span className="i">⚖️</span> Tax Breakdown (New Regime)</div>
                            <div className="b-row">
                                <span className="b-lbl">Gross Salary</span>
                                <span className="b-val">+ ₹{gross.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="b-row">
                                <span className="b-lbl">Standard Deduction</span>
                                <span className="b-val" style={{ color: "var(--muted)" }}>- ₹75,000</span>
                            </div>
                            <div className="b-row">
                                <span className="b-lbl">Taxable Income</span>
                                <span className="b-val">₹{taxable.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="divider" />
                            <div className="b-row red">
                                <span className="b-lbl">Computed Tax (Slabs)</span>
                                <span className="b-val">- ₹{Math.round(tax / 1.04).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="b-row red">
                                <span className="b-lbl">Health & Ed. Cess (4%)</span>
                                <span className="b-val">- ₹{Math.round(tax - (tax / 1.04)).toLocaleString("en-IN")}</span>
                            </div>
                            {gross > 0 && taxable <= 700000 && (
                                <div className="b-row" style={{ marginTop: "0.5rem" }}>
                                    <span className="b-lbl" style={{ color: "#10b981", fontWeight: 600 }}>Sec 87A Rebate</span>
                                    <span className="b-val" style={{ color: "#10b981" }}>Zero Tax Applicable 🎉</span>
                                </div>
                            )}
                            <div className="b-row total">
                                <span className="b-lbl">Annual In-Hand</span>
                                <span className="b-val" style={{ color: "var(--ink)" }}><Counter value={inHandAnnual} /></span>
                            </div>
                            <div className="b-row" style={{ marginTop: "0.5rem" }}>
                                <span className="b-lbl">Monthly In-Hand</span>
                                <span className="b-val" style={{ color: "var(--red)", fontSize: "1.1rem", fontFamily: "var(--fh)", fontWeight: 800 }}>
                                    ₹{Math.round(inHandMonthly).toLocaleString("en-IN")}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* BUDGET SUGGESTION */}
                    <div className="card" style={directMode ? { gridColumn: "1 / -1" } : {}}>
                        <div className="card-title"><span className="i">💸</span> 50-30-20 Budget Planner</div>
                        <p style={{ fontFamily: "var(--fb)", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "1.5rem", lineHeight: 1.4 }}>
                            {directMode
                                ? <>Based on your entered monthly in-hand of <b>₹{Math.round(directMonthly).toLocaleString("en-IN")}</b>, here is your recommended budget split:</>
                                : <>Based on your calculated monthly in-hand of <b>₹{Math.round(inHandMonthly).toLocaleString("en-IN")}</b>, here is the recommended standard budget split:</>
                            }
                        </p>
                        <div className="chart-sec">
                            <MiniDonut
                                data={(directMode ? directMonthly : gross) > 0
                                    ? chartData
                                    : [{ color: "#d94f3d", v: 1 }, { color: "#ff8fab", v: 1 }, { color: "#e8604e", v: 1 }]}
                                size={140}
                            />
                            <div className="chart-legend">
                                {chartData.map((d, i) => (
                                    <div key={i} className="leg-row">
                                        <div className="leg-left">
                                            <div className="leg-dot" style={{ background: d.color }}></div>
                                            <span className="leg-lbl">{d.name}</span>
                                        </div>
                                        <span className="leg-val" style={{ color: d.color }}>₹{Math.round(d.v).toLocaleString("en-IN")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="divider" style={{ marginTop: "1.75rem" }} />
                        <ul style={{ fontFamily: "var(--fb)", fontSize: "0.76rem", color: "var(--muted)", paddingLeft: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <li><b>Needs:</b> Groceries, Rent, Utilities, Daily Commute.</li>
                            <li><b>Wants:</b> Dining out, Entertainment, Shopping.</li>
                            <li><b>Invest:</b> SIPs, Emergency Funds, Debt Repayment.</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
