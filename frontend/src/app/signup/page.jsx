"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/signup/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("username", username);
        router.push("/dashboard");
      } else {
        alert(data.message || data.error);
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:    #f5f2ed;
          --bg2:   #edeae3;
          --ink:   #1a1714;
          --red:   #d94f3d;
          --red2:  #e8604e;
          --muted: #7a7368;
          --border: rgba(26,23,20,0.1);
          --fh: 'Unbounded', sans-serif;
          --fb: 'Outfit', sans-serif;
        }

        body { background: var(--bg); font-family: var(--fb); -webkit-font-smoothing: antialiased; }

        .page { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; }

        .form-panel {
          position: relative;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          padding: 3rem;
          animation: fromLeft 0.9s cubic-bezier(.16,1,.3,1) both;
        }
        .btn-back {
          position: absolute; top: 2rem; left: 2.5rem;
          font-family: var(--fb); font-size: 0.8rem; font-weight: 500;
          color: var(--muted); text-decoration: none;
          transition: color 0.2s; z-index: 10;
        }
        .btn-back:hover { color: var(--ink); }
        .form-wrap { width: 100%; max-width: 400px; }

        .form-eyebrow {
          font-family: var(--fb); font-size: 0.68rem; font-weight: 500; color: var(--red);
          letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 0.75rem;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .form-eyebrow-line { width: 18px; height: 1px; background: var(--red); }
        .form-title {
          font-family: var(--fh); font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 900; letter-spacing: -2px; line-height: 1;
          color: var(--ink); margin-bottom: 0.6rem;
        }
        .form-sub {
          font-family: var(--fb); font-size: 0.88rem; font-weight: 300; color: var(--muted);
          margin-bottom: 2.5rem; line-height: 1.6;
        }
        .field { margin-bottom: 1.25rem; }
        .field-label {
          font-family: var(--fb); font-size: 0.68rem; font-weight: 500; color: var(--muted);
          letter-spacing: 1.5px; text-transform: uppercase; display: block; margin-bottom: 0.5rem;
        }
        .field-input {
          width: 100%; font-family: var(--fb); font-size: 0.92rem; font-weight: 400;
          color: var(--ink); background: #fff; border: 1px solid var(--border);
          border-radius: 10px; padding: 0.9rem 1.1rem; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field-input::placeholder { color: rgba(26,23,20,0.2); }
        .field-input:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(217,79,61,0.1); }

        .btn-submit {
          font-family: var(--fh); font-size: 0.65rem; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase;
          color: #fff; background: var(--red); border: none; cursor: pointer;
          width: 100%; padding: 1rem; border-radius: 10px; margin-top: 0.5rem;
          transition: all 0.25s cubic-bezier(.16,1,.3,1);
          box-shadow: 0 4px 20px rgba(217,79,61,0.25);
          position: relative; overflow: hidden;
        }
        .btn-submit::before {
          content: ''; position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: skewX(-15deg); transition: left 0.5s;
        }
        .btn-submit:hover::before { left: 160%; }
        .btn-submit:hover { background: var(--red2); box-shadow: 0 4px 32px rgba(217,79,61,0.4); transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .form-footer {
          font-family: var(--fb); font-size: 0.82rem; color: var(--muted); font-weight: 300;
          text-align: center; margin-top: 1.5rem;
          padding-top: 1.5rem; border-top: 1px solid var(--border);
        }
        .form-footer a { color: var(--red); font-weight: 500; text-decoration: none; transition: opacity 0.2s; }
        .form-footer a:hover { opacity: 0.75; }

        .brand-panel {
          background: #111108;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 3rem; position: relative; overflow: hidden;
          animation: fromRight 0.9s cubic-bezier(.16,1,.3,1) both;
        }
        .brand-glow {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(217,79,61,0.12) 0%, transparent 65%);
          bottom: -100px; right: -100px; pointer-events: none;
        }
        .brand-logo {
          font-family: var(--fh); font-size: 0.75rem; font-weight: 900;
          letter-spacing: 3px; text-transform: uppercase;
          color: #f0eee9; text-decoration: none;
          display: flex; align-items: center; gap: 0.6rem; position: relative; z-index: 1;
        }
        .brand-logo-sq {
          width: 26px; height: 26px; border-radius: 5px; background: var(--red);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 900; color: #fff;
        }
        .brand-mid { position: relative; z-index: 1; }
        .brand-big {
          font-family: var(--fh); font-size: clamp(2.5rem, 4vw, 4rem);
          font-weight: 900; line-height: 0.93; letter-spacing: -3px; color: #f0eee9; margin-bottom: 1.5rem;
        }
        .brand-big .out { color: transparent; -webkit-text-stroke: 1.5px rgba(240,238,233,0.25); }
        .brand-big .r { color: var(--red); }
        .brand-sub {
          font-family: var(--fb); font-size: 0.88rem; font-weight: 300;
          color: rgba(255,255,255,0.3); line-height: 1.75; max-width: 280px;
        }
        .perks { margin-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .perk {
          display: flex; align-items: center; gap: 0.75rem;
          font-family: var(--fb); font-size: 0.8rem; font-weight: 300; color: rgba(255,255,255,0.35);
        }
        .perk-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--red); flex-shrink: 0; }
        .brand-footer {
          font-family: var(--fb); font-size: 0.72rem; color: rgba(255,255,255,0.15);
          font-weight: 300; position: relative; z-index: 1;
        }

        @keyframes fromLeft { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fromRight { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }

        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; }
          .brand-panel { display: none; }
          .form-panel { padding: 2rem 1.5rem; }
        }
      `}</style>

      <div className="page">
        <div className="form-panel">
          <Link href="/" className="btn-back">← Home</Link>
          <div className="form-wrap">
            <div className="form-eyebrow"><span className="form-eyebrow-line" />Get started</div>
            <h1 className="form-title">Create account</h1>
            <p className="form-sub">Free forever. No credit card. Set up in 2 minutes.</p>

            <div className="field">
              <label className="field-label">Username</label>
              <input className="field-input" placeholder="e.g. rahul_dev"
                value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input type="email" className="field-input" placeholder="you@domain.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input type="password" className="field-input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignup()} />
            </div>

            <button className="btn-submit" onClick={handleSignup} disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account →"}
            </button>

            <p className="form-footer">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="brand-panel">
          <div className="brand-glow" />
          <Link href="/" className="brand-logo">
            <div className="brand-logo-sq">F</div>
            PocketPilot
          </Link>
          <div className="brand-mid">
            <div className="brand-big">
              <span>KNOW</span><br />
              <span className="out">YOUR</span><br />
              <span className="r">MONEY.</span>
            </div>
            <p className="brand-sub">Join thousands of Indians who stopped losing money to forgotten subscriptions.</p>
            <div className="perks">
              <div className="perk"><span className="perk-dot" />Track all subscriptions in one place</div>
              <div className="perk"><span className="perk-dot" />Get renewal reminders before you're charged</div>
              <div className="perk"><span className="perk-dot" />See your monthly burn rate instantly</div>
              <div className="perk"><span className="perk-dot" />Visualize spending with charts</div>
            </div>
          </div>
          <span className="brand-footer">© 2025 PocketPilot</span>
        </div>
      </div>
    </>
  );
}