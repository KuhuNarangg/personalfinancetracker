"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function useCounter(target, duration = 2200, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let s = null;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

const SUBS = [
  { name: "Netflix", price: 649, color: "#ff4d4d", days: 3, cat: "Streaming" },
  { name: "Spotify", price: 119, color: "#ff6b35", days: 8, cat: "Music" },
  { name: "Hotstar", price: 299, color: "#ff3366", days: 12, cat: "Streaming" },
  { name: "Notion", price: 330, color: "#cc2936", days: 19, cat: "Productivity" },
  { name: "ChatGPT Plus", price: 1650, color: "#e84545", days: 24, cat: "AI" },
  { name: "AWS", price: 2100, color: "#ff5c5c", days: 28, cat: "Cloud" },
];
const TOTAL = SUBS.reduce((a, b) => a + b.price, 0);

const TICKER = ["Track Subscriptions", "Kill Forgotten Charges", "Visualize Spending", "Know Your Burn Rate", "Set Savings Goals", "Get Renewal Alerts", "Stop Wasting Money", "Financial Clarity", "Save More", "Optimize Budget", "Reduce Costs", "Track Expenses", "Grow Wealth", "Financial Freedom", "Market Insights"];

export default function Home() {
  const [statsOn, setStatsOn] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const statsRef = useRef(null);

  const s1 = useCounter(2847, 2200, statsOn);
  const s2 = useCounter(317, 2200, statsOn);
  const s3 = useCounter(94, 2200, statsOn);

  useEffect(() => {
    setMounted(true);
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsOn(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) io.observe(statsRef.current);
    const t = setInterval(() => setActiveIdx(i => (i + 1) % SUBS.length), 2000);
    return () => { io.disconnect(); clearInterval(t); };
  }, []);

  // SVG donut
  const cx = 100, cy = 100, r = 70;
  const circ = 2 * Math.PI * r;
  let off = 0;
  const segments = SUBS.map(s => {
    const dash = (s.price / TOTAL) * circ;
    const seg = { dash, gap: circ - dash, offset: off, color: s.color };
    off += dash;
    return seg;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #f5f2ed;
          --bg2:     #edeae3;
          --bg3:     #e6e1d8;
          --surface: #e0dbd0;
          --s2:      #d8d2c6;
          --red:     #d94f3d;
          --red2:    #e8604e;
          --red3:    #b83d2d;
          --red-glow: rgba(217,79,61,0.18);
          --red-dim:  rgba(217,79,61,0.08);
          --white:   #1a1714;
          --muted:   #7a7368;
          --muted2:  #a09890;
          --border:  rgba(26,23,20,0.1);
          --br:      rgba(217,79,61,0.2);
          --fh: 'Unbounded', sans-serif;
          --fb: 'Outfit', sans-serif;
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--white);
          font-family: var(--fb);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ─────────── NAV ─────────── */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 200;
          height: 62px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 3.5rem;
          background: rgba(245,242,237,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          animation: slideDown 0.7s cubic-bezier(.16,1,.3,1) both;
        }
        .logo {
          font-family: var(--fh);
          font-size: 0.75rem; font-weight: 900;
          letter-spacing: 3px; text-transform: uppercase;
          color: var(--white); text-decoration: none;
          display: flex; align-items: center; gap: 0.6rem;
        }
        .logo-sq {
          width: 26px; height: 26px; border-radius: 5px;
          background: var(--red);
          box-shadow: 0 0 14px var(--red-glow);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 900; color: #fff;
          transition: box-shadow 0.3s;
        }
        .logo:hover .logo-sq { box-shadow: 0 0 24px rgba(230,57,70,0.5); }

        .nav-mid {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; gap: 0.15rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border); border-radius: 100px; padding: 0.28rem;
        }
        .nav-pill {
          font-family: var(--fb);
          font-size: 0.78rem; font-weight: 400; color: var(--muted);
          text-decoration: none; padding: 0.32rem 1rem; border-radius: 100px;
          transition: all 0.2s;
        }
        .nav-pill:hover { color: var(--white); background: rgba(255,255,255,0.05); }

        .nav-r { display: flex; align-items: center; gap: 0.75rem; }
        .nav-login {
          font-family: var(--fb);
          font-size: 0.8rem; font-weight: 400; color: var(--muted);
          text-decoration: none; padding: 0.4rem 0.9rem; transition: color 0.2s;
        }
        .nav-login:hover { color: var(--white); }
        .nav-cta {
          font-family: var(--fh);
          font-size: 0.65rem; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #fff; background: var(--red);
          text-decoration: none; padding: 0.55rem 1.25rem;
          border-radius: 7px; transition: all 0.25s;
          box-shadow: 0 0 18px var(--red-glow);
        }
        .nav-cta:hover {
          background: var(--red2);
          box-shadow: 0 0 30px rgba(230,57,70,0.45);
          transform: translateY(-1px);
        }

        /* ─────────── HERO ─────────── */
        .hero {
          min-height: 100vh;
          padding-top: 62px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid var(--border);
        }

        /* Ambient glows */
        .glow-tl {
          position: absolute; z-index: 0; pointer-events: none;
          width: 650px; height: 650px; border-radius: 50%;
          top: -200px; left: -100px;
          background: radial-gradient(circle, rgba(217,79,61,0.06) 0%, transparent 65%);
          animation: drift1 14s ease-in-out infinite;
        }
        .glow-br {
          position: absolute; z-index: 0; pointer-events: none;
          width: 400px; height: 400px; border-radius: 50%;
          bottom: -80px; right: 30%;
          background: radial-gradient(circle, rgba(217,79,61,0.04) 0%, transparent 65%);
          animation: drift2 18s ease-in-out infinite;
        }
        .grid-lines {
          position: absolute; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(26,23,20,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,23,20,0.04) 1px, transparent 1px);
          background-size: 70px 70px;
          mask-image: radial-gradient(ellipse 75% 75% at 30% 50%, black 0%, transparent 70%);
        }

        /* LEFT */
        .hero-left {
          position: relative; z-index: 1;
          padding: 5rem 3.5rem 4rem;
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column; justify-content: space-between;
          animation: fromLeft 1s 0.1s cubic-bezier(.16,1,.3,1) both;
        }
        .hero-eyebrow {
          font-family: var(--fb);
          font-size: 0.68rem; font-weight: 500; color: var(--red);
          letter-spacing: 2.5px; text-transform: uppercase;
          display: flex; align-items: center; gap: 0.6rem;
        }
        .eyebrow-line { width: 20px; height: 1px; background: var(--red); }

        .hero-h1 {
          font-family: var(--fh);
          font-size: clamp(3.2rem, 5.5vw, 5.5rem);
          font-weight: 900;
          line-height: 0.93;
          letter-spacing: -3px;
          color: var(--white);
          flex: 1; display: flex; flex-direction: column; justify-content: center;
          gap: 0.1em;
          padding: 2rem 0;
        }
        .h1-outline {
          color: transparent;
          -webkit-text-stroke: 2px rgba(26,23,20,0.8);
        }
        .h1-red { color: var(--red); }

        .hero-foot {
          display: flex; align-items: flex-end; gap: 2.5rem; justify-content: space-between;
        }
        .hero-desc {
          font-family: var(--fb);
          font-size: 0.88rem; font-weight: 300; color: var(--muted);
          line-height: 1.8; max-width: 280px;
        }
        .hero-actions { display: flex; flex-direction: column; gap: 0.65rem; align-items: flex-start; flex-shrink: 0; }
        .btn-primary {
          font-family: var(--fh);
          font-size: 0.65rem; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase;
          color: #fff; background: var(--red);
          text-decoration: none; padding: 1rem 2rem; border-radius: 9px;
          display: inline-flex; align-items: center; gap: 0.5rem;
          transition: all 0.28s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 4px 28px var(--red-glow);
          position: relative; overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: skewX(-15deg);
          transition: left 0.55s;
        }
        .btn-primary:hover::before { left: 160%; }
        .btn-primary:hover {
          background: var(--red2);
          box-shadow: 0 4px 40px rgba(230,57,70,0.5);
          transform: translateY(-2px);
        }
        .btn-primary .arr { transition: transform 0.28s cubic-bezier(.16,1,.3,1); }
        .btn-primary:hover .arr { transform: translateX(4px); }
        .link-muted {
          font-family: var(--fb);
          font-size: 0.78rem; font-weight: 300; color: var(--muted);
          text-decoration: none; transition: color 0.2s;
        }
        .link-muted:hover { color: var(--white); }

        /* Avatars */
        .trust {
          display: flex; align-items: center; gap: 0.85rem; margin-top: 1.5rem;
        }
        .avs { display: flex; }
        .av {
          width: 26px; height: 26px; border-radius: 50%;
          border: 2px solid var(--bg);
          font-family: var(--fh); font-size: 0.55rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin-left: -7px;
        }
        .av:first-child { margin-left: 0; }
        .trust-txt {
          font-family: var(--fb);
          font-size: 0.75rem; color: var(--muted); font-weight: 300; line-height: 1.4;
        }
        .trust-txt strong { color: var(--white); font-weight: 500; }

        /* RIGHT — dashboard */
        .hero-right {
          position: relative; z-index: 1;
          background: #111108;
          display: flex; flex-direction: column;
          animation: fromRight 1s 0.2s cubic-bezier(.16,1,.3,1) both;
        }

        .db-bar {
          padding: 1rem 1.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: space-between;
        }
        .db-bar-title {
          font-family: var(--fb);
          font-size: 0.65rem; font-weight: 400; color: rgba(255,255,255,0.3);
          letter-spacing: 1.2px; text-transform: uppercase;
        }
        .db-live {
          display: flex; align-items: center; gap: 0.35rem;
          font-family: var(--fb); font-size: 0.65rem; color: #4ade80; font-weight: 500;
        }
        .db-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
          box-shadow: 0 0 6px rgba(74,222,128,0.6);
          animation: blinkDot 1.8s infinite;
        }

        .db-burn {
          padding: 1.75rem 1.75rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .db-burn-lbl {
          font-family: var(--fb);
          font-size: 0.6rem; color: rgba(255,255,255,0.3);
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 0.4rem;
        }
        .db-burn-val {
          font-family: var(--fh);
          font-size: 3.2rem; font-weight: 900;
          color: #f0eee9; letter-spacing: -3px; line-height: 1;
        }
        .db-burn-cents {
          font-size: 1.4rem; color: rgba(255,255,255,0.3); font-weight: 400; letter-spacing: -1px;
        }
        .db-burn-meta {
          margin-top: 0.5rem; display: flex; align-items: center; gap: 0.75rem;
        }
        .db-burn-sub {
          font-family: var(--fb);
          font-size: 0.7rem; color: rgba(255,255,255,0.25); font-weight: 300;
        }
        .db-change {
          font-family: var(--fb);
          font-size: 0.65rem; font-weight: 500;
          padding: 0.18rem 0.5rem; border-radius: 4px;
          background: rgba(231,76,60,0.12); color: #e74c3c;
        }

        /* Donut row */
        .db-donut-row {
          padding: 1.25rem 1.75rem;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          display: flex; gap: 1.5rem; align-items: center;
        }
        .donut-wrap { position: relative; width: 78px; height: 78px; flex-shrink: 0; }
        .donut-wrap svg { width: 78px; height: 78px; transform: rotate(-90deg); }
        .donut-mid {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
        }
        .donut-mid-n {
          font-family: var(--fh); font-size: 0.8rem; font-weight: 900; color: #f0eee9; line-height: 1;
        }
        .donut-mid-l {
          font-family: var(--fb); font-size: 0.42rem; color: rgba(255,255,255,0.3);
          text-transform: uppercase; letter-spacing: 1px; margin-top: 1px;
        }
        .donut-legend { flex: 1; display: flex; flex-direction: column; gap: 0.38rem; }
        .dl-row { display: flex; align-items: center; gap: 0.5rem; }
        .dl-dot { width: 6px; height: 6px; border-radius: 2px; flex-shrink: 0; }
        .dl-name {
          font-family: var(--fb); font-size: 0.7rem; color: rgba(255,255,255,0.4); flex: 1; font-weight: 300;
        }
        .dl-price {
          font-family: var(--fh); font-size: 0.65rem; color: rgba(255,255,255,0.7); font-weight: 400;
        }

        /* Sub list */
        .db-subs { padding: 0.5rem 1.25rem 1rem; flex: 1; }
        .db-sub-row {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.55rem 0.5rem; border-radius: 8px;
          transition: background 0.2s;
        }
        .db-sub-row.active { background: rgba(255,255,255,0.04); }
        .db-sub-bar { width: 3px; height: 26px; border-radius: 2px; flex-shrink: 0; }
        .db-sub-name {
          font-family: var(--fb); font-size: 0.8rem; font-weight: 500;
          color: rgba(240,238,233,0.85);
        }
        .db-sub-days {
          font-family: var(--fb); font-size: 0.62rem; color: rgba(255,255,255,0.25); font-weight: 300; margin-top: 1px;
        }
        .db-sub-price {
          font-family: var(--fh); font-size: 0.78rem; font-weight: 700; color: #f0eee9;
        }

        /* ─────────── TICKER ─────────── */
        .ticker-strip {
          background: var(--red);
          overflow: hidden; padding: 0.65rem 0;
          position: relative;
        }
        .ticker-track {
          display: inline-flex; gap: 3rem;
          animation: scroll 28s linear infinite;
          white-space: nowrap;
        }
        .ticker-item {
          font-family: var(--fh);
          font-size: 0.6rem; font-weight: 700;
          letter-spacing: 2.5px; text-transform: uppercase; color: #fff;
          display: inline-flex; align-items: center; gap: 0.7rem;
        }
        .t-sep { opacity: 0.35; font-size: 0.8rem; }

        /* ─────────── STATS ─────────── */
        .stats-row {
          display: grid; grid-template-columns: repeat(3,1fr);
          border-bottom: 1px solid var(--border);
        }
        .stat-cell {
          padding: 3.5rem;
          border-right: 1px solid var(--border);
          animation: riseUp 0.8s ease both;
          transition: background 0.3s;
        }
        .stat-cell:last-child { border-right: none; }
        .stat-cell:hover { background: var(--bg3); }
        .stat-n {
          font-family: var(--fh);
          font-size: 3rem; font-weight: 900; letter-spacing: -2.5px;
          line-height: 1; margin-bottom: 0.5rem; color: var(--white);
        }
        .stat-n .accent { color: var(--red); }
        .stat-l {
          font-family: var(--fb);
          font-size: 0.82rem; color: var(--muted); font-weight: 300; line-height: 1.55;
        }

        /* ─────────── FEATURES ─────────── */
        .feat-wrap {
          display: grid; grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--border);
        }
        .feat-intro {
          padding: 5.5rem 3.5rem;
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column; justify-content: space-between;
          gap: 3rem;
        }
        .feat-tag {
          font-family: var(--fb); font-size: 0.68rem; font-weight: 500;
          color: var(--red); letter-spacing: 2.5px; text-transform: uppercase;
        }
        .feat-big {
          font-family: var(--fh);
          font-size: clamp(2.2rem, 3.8vw, 3.5rem); font-weight: 900;
          letter-spacing: -2.5px; line-height: 0.93; color: var(--white);
        }
        .feat-big .out { color: transparent; -webkit-text-stroke: 1.5px rgba(26,23,20,0.2); }
        .feat-body {
          font-family: var(--fb);
          font-size: 0.88rem; color: var(--muted); line-height: 1.75; font-weight: 300; max-width: 300px;
        }

        .feat-list { display: flex; flex-direction: column; }
        .feat-item {
          padding: 2rem 2.5rem;
          border-bottom: 1px solid var(--border);
          display: flex; gap: 1.5rem; align-items: flex-start;
          transition: background 0.25s; cursor: default;
        }
        .feat-item:last-child { border-bottom: none; }
        .feat-item:hover { background: var(--bg3); }
        .feat-item:hover .feat-item-num { color: var(--red); }
        .feat-item-num {
          font-family: var(--fh); font-size: 0.58rem; font-weight: 700;
          color: var(--muted2); letter-spacing: 1px; padding-top: 3px; flex-shrink: 0;
          transition: color 0.25s;
        }
        .feat-item-t {
          font-family: var(--fh); font-size: 0.85rem; font-weight: 700;
          color: var(--white); letter-spacing: -0.3px; margin-bottom: 0.4rem;
        }
        .feat-item-d {
          font-family: var(--fb); font-size: 0.82rem; color: var(--muted);
          line-height: 1.65; font-weight: 300;
        }

        /* ─────────── CTA ─────────── */
        .cta-section {
          display: grid; grid-template-columns: 1fr 1fr;
          min-height: 340px;
        }
        .cta-l {
          padding: 5.5rem 3.5rem;
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .cta-h {
          font-family: var(--fh);
          font-size: clamp(2rem, 3.5vw, 3.2rem); font-weight: 900;
          letter-spacing: -2.5px; line-height: 0.93; color: var(--white);
        }
        .cta-h .r { color: var(--red); }
        .cta-p {
          font-family: var(--fb);
          font-size: 0.88rem; color: var(--muted); line-height: 1.75; font-weight: 300;
        }
        .cta-r {
          padding: 5.5rem 3.5rem;
          display: flex; flex-direction: column; justify-content: center; gap: 1rem;
          background: var(--bg2);
        }
        .cta-note {
          font-family: var(--fb); font-size: 0.72rem; color: var(--muted); font-weight: 300;
        }

        /* ─────────── FOOTER ─────────── */
        footer {
          border-top: 1px solid var(--border);
          padding: 1.75rem 3.5rem;
          display: flex; align-items: center; justify-content: space-between;
        }
        .foot-logo {
          font-family: var(--fh); font-size: 0.7rem; font-weight: 900;
          letter-spacing: 3px; text-transform: uppercase;
          color: var(--white); text-decoration: none;
        }
        .foot-copy {
          font-family: var(--fb); font-size: 0.75rem; color: var(--muted); font-weight: 300;
        }
        .foot-links { display: flex; gap: 2rem; }
        .foot-link {
          font-family: var(--fb); font-size: 0.75rem; color: var(--muted);
          text-decoration: none; transition: color 0.2s;
        }
        .foot-link:hover { color: var(--white); }

        /* ─────────── KEYFRAMES ─────────── */
        @keyframes slideDown {
          from { opacity:0; transform: translateY(-14px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes fromLeft {
          from { opacity:0; transform: translateX(-28px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes fromRight {
          from { opacity:0; transform: translateX(28px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes riseUp {
          from { opacity:0; transform: translateY(22px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes drift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(30px,-25px) scale(1.08); }
          70%     { transform: translate(-20px,20px) scale(0.95); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(-30px,25px); }
        }
        @keyframes blinkDot {
          0%,100% { opacity:1; }
          50%     { opacity:0.2; }
        }
        @keyframes scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        @media (max-width: 860px) {
          .hero, .feat-wrap, .cta-section { grid-template-columns: 1fr; }
          .hero-left { border-right: none; border-bottom: 1px solid var(--border); }
          .stats-row { grid-template-columns: 1fr; }
          .stat-cell { border-right: none; border-bottom: 1px solid var(--border); }
          nav { padding: 0 1.5rem; }
          .nav-mid { display: none; }
          .feat-intro { border-right: none; border-bottom: 1px solid var(--border); }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <a href="/" className="logo">
          <div className="logo-sq">F</div>
          PocketPilot
        </a>
        <div className="nav-mid">
          <a href="#features" className="nav-pill">Features</a>
          <a href="#stats" className="nav-pill">Stats</a>
          <a href="#" className="nav-pill">Pricing</a>
        </div>
        <div className="nav-r">
          <Link href="/login" className="nav-login">Log in</Link>
          <Link href="/signup" className="nav-cta">Start free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="glow-tl" />
        <div className="glow-br" />
        <div className="grid-lines" />

        {/* Left */}
        <div className="hero-left">
          <div className="hero-eyebrow">
            <span className="eyebrow-line" />
            Personal Finance Tracker
          </div>

          <h1 className="hero-h1">
            <span>STOP</span>
            <span className="h1-outline">LOSING</span>
            <span className="h1-red">MONEY.</span>
          </h1>

          <div className="hero-foot">
            <p className="hero-desc">
              Most people waste hundreds every year on subscriptions they forgot about. PocketPilot shows you everything in one ruthlessly clear dashboard.
            </p>
            <div className="hero-actions">
              <Link href="/signup" className="btn-primary">
                Start free
                <svg className="arr" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5h9M7 2l4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/login" className="link-muted">Already have an account →</Link>
              <div className="trust">
                <div className="avs">
                  {[["#e63946", "AK"], ["#c1121f", "MS"], ["#ff4d5a", "RJ"], ["#a4161a", "TP"]].map(([bg, l]) => (
                    <div key={l} className="av" style={{ background: bg }}>{l}</div>
                  ))}
                </div>
                <span className="trust-txt"><strong>2,400+</strong> users saving money</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Dashboard */}
        <div className="hero-right">
          <div className="db-bar">
            <span className="db-bar-title">Live dashboard</span>
            <span className="db-live"><span className="db-dot" />Synced</span>
          </div>

          <div className="db-burn">
            <div className="db-burn-lbl">Monthly burn</div>
            <div className="db-burn-val">
              ₹{TOTAL.toLocaleString("en-IN")}
            </div>
            <div className="db-burn-meta">
              <span className="db-burn-sub">across {SUBS.length} active subscriptions</span>
              <span className="db-change">+₹330 this month</span>
            </div>
          </div>

          {/* Donut */}
          <div className="db-donut-row">
            <div className="donut-wrap">
              <svg viewBox="0 0 200 200">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="32" />
                {segments.map((seg, i) => (
                  <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                    stroke={seg.color} strokeWidth="32"
                    strokeDasharray={`${seg.dash} ${seg.gap}`}
                    strokeDashoffset={-seg.offset}
                    strokeLinecap="butt" opacity="0.9"
                  />
                ))}
              </svg>
              <div className="donut-mid">
                <span className="donut-mid-n">{SUBS.length}</span>
                <span className="donut-mid-l">subs</span>
              </div>
            </div>
            <div className="donut-legend">
              {SUBS.map(s => (
                <div key={s.name} className="dl-row">
                  <div className="dl-dot" style={{ background: s.color }} />
                  <span className="dl-name">{s.name}</span>
                  <span className="dl-price">₹{s.price.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub rows */}
          <div className="db-subs">
            {SUBS.map((s, i) => (
              <div key={s.name} className={`db-sub-row${i === activeIdx ? " active" : ""}`}>
                <div className="db-sub-bar" style={{ background: s.color }} />
                <div style={{ flex: 1 }}>
                  <div className="db-sub-name">{s.name}</div>
                  <div className="db-sub-days">{s.cat} · renews in {s.days}d</div>
                </div>
                <span className="db-sub-price">₹{s.price.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-strip">
        <div className="ticker-track">
          {Array.from({ length: 4 }).flatMap((_, x) =>
            TICKER.map((t, i) => (
              <span key={`${x}-${i}`} className="ticker-item">
                {t} <span className="t-sep">·</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-row" ref={statsRef} id="stats">
        {[
          { n: s1, suf: "+", accent: true, l: "users who finally know where their money goes" },
          { n: `₹${s2}`, suf: "", accent: false, l: "average saved in the first 3 months" },
          { n: s3, suf: "%", accent: false, l: "found at least one forgotten subscription" },
        ].map((s, i) => (
          <div key={i} className="stat-cell" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="stat-n">
              <span className={s.accent ? "accent" : ""}>{s.n}</span>{s.suf}
            </div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section className="feat-wrap" id="features">
        <div className="feat-intro">
          <span className="feat-tag">Core features</span>
          <h2 className="feat-big">
            EVERY<br />TOOL<br /><span className="out">YOU NEED.</span>
          </h2>
          <p className="feat-body">
            From spotting forgotten Netflix charges to understanding your full monthly cost — PocketPilot gives you clarity, not noise.
          </p>
        </div>
        <div className="feat-list">
          {[
            { n: "01", t: "Spending Visualization", d: "Pie charts, bar graphs, and trend lines that make your finances immediately legible." },
            { n: "02", t: "Renewal Reminders", d: "Automated alerts before every charge. Cancel before it's too late." },
            { n: "03", t: "Monthly Burn Rate", d: "One clean number — what you spend every month, to the cent." },
            { n: "04", t: "Savings Goals", d: "Set a monthly budget and see exactly which subscriptions are in the way." },
            { n: "05", t: "Smart Insights", d: "Automatic detection of spending spikes, duplicates, and waste." },
          ].map(f => (
            <div key={f.n} className="feat-item">
              <span className="feat-item-num">{f.n}</span>
              <div>
                <div className="feat-item-t">{f.t}</div>
                <div className="feat-item-d">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-l">
          <h2 className="cta-h">
            START<br />SAVING<br /><span className="r">TODAY.</span>
          </h2>
          <p className="cta-p">
            2-minute setup. No credit card. Cancel anytime. You'll know your monthly burn before you finish your coffee.
          </p>
        </div>
        <div className="cta-r">
          <Link href="/signup" className="btn-primary" style={{ fontSize: "0.7rem", padding: "1.1rem 2.25rem" }}>
            Create free account
            <svg className="arr" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5h9M7 2l4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/login" className="cta-note" style={{ textDecoration: "none", transition: "color 0.2s" }}>
            I already have an account →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <a href="/" className="foot-logo">PocketPilot</a>
        <span className="foot-copy">© 2025 PocketPilot. All rights reserved.</span>
        <div className="foot-links">
          <Link href="/login" className="foot-link">Login</Link>
          <Link href="/signup" className="foot-link">Sign up</Link>
        </div>
      </footer>
    </>
  );
}