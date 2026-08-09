import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SuperAdminLogin.css";
import usePageTitle from '../usePageTitle';
import ptagLogo from '../assets/PTag.png';

const BASE_URL = "http://localhost:8080";

const SuperAdminLogin = () => {
  usePageTitle("Super-Admin Login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [step,     setStep]     = useState(1);   // ✅ 1=login, 2=otp
  const [otp,      setOtp]      = useState("");
  const [otpUser,  setOtpUser]  = useState("");  // ✅ store username for step 2
  const [loading,  setLoading]  = useState(false);
  const [otpMsg,   setOtpMsg]   = useState("");
  const navigate                = useNavigate();
  const canvasRef               = useRef(null);

  // ── Particle network ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const DOTS = 60;
    const dots = Array.from({ length: DOTS }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.38,
      vy: (Math.random() - 0.5) * 0.38,
      r:  Math.random() * 2 + 1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < DOTS; i++) {
        for (let j = i + 1; j < DOTS; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139,58,58,${0.16 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139,58,58,0.35)";
        ctx.fill();
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > canvas.width)  d.vx *= -1;
        if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // ✅ Step 1 — validate credentials, trigger OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/super-admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ username, password })
      });
      const text = await res.text();
      let data   = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }

      // ✅ If no email set — direct login without OTP
      if (data.otpRequired === "false" && data.token) {
        localStorage.setItem("superAdminToken", data.token);
        navigate("/super-admin/dashboard");
        return;
      }

      // ✅ OTP required — go to step 2
      setOtpUser(username);
      setOtpMsg("OTP sent to your registered email");
      setStep(2);

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!otp) { setError("Please enter the OTP"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/super-admin/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ username: otpUser, otp })
      });
      const text = await res.text();
      let data   = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      // ✅ OTP valid — store token and go to dashboard
      localStorage.setItem("superAdminToken", data.token);
      navigate("/super-admin/dashboard");

    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend OTP
  const handleResendOtp = async () => {
    setError("");
    setOtp("");
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/super-admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ username, password })
      });
      setOtpMsg("New OTP sent to your registered email");
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

 

  return (
    <div className="salog-wrapper">
      <canvas ref={canvasRef} className="salog-canvas" />

      {/* NAVBAR */}
      <nav className="salog-navbar">
        <a href="#" className="salog-nav-logo">
          <img src={ptagLogo} alt="PTag Logo" className="salog-nav-logo-img" />
          <div className="salog-nav-logo-text">
            <span className="ptag-bold">P</span>
            <span className="ptag-thin">Tag</span>
          </div>
        </a>
        <span className="salog-nav-title">Super Admin Command Center</span>
        <div style={{ width: 120 }} />
      </nav>

      {/* CARD */}
      <div className="salog-body">
        <div className="salog-card">

          {/* ── Step indicators ── */}
          <div className="salog-steps">
            <div className={`salog-step ${step >= 1 ? "salog-step--active" : ""} ${step > 1 ? "salog-step--done" : ""}`}>
              <div className="salog-step-dot">{step > 1 ? "✓" : "1"}</div>
              <span>Credentials</span>
            </div>
            <div className="salog-step-line" />
            <div className={`salog-step ${step >= 2 ? "salog-step--active" : ""}`}>
              <div className="salog-step-dot">2</div>
              <span>Verify OTP</span>
            </div>
          </div>

          {/* ── STEP 1 — Username & Password ── */}
          {step === 1 && (
            <>
              <h2 className="salog-title">Super Admin Login</h2>
              <form onSubmit={handleSubmit}>
                <div className="salog-field">
                  <label>Username</label>
                  <div className="salog-input-wrap">
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                    />
                    <span className="salog-input-icon">👤</span>
                  </div>
                </div>

                <div className="salog-field">
                  <label>Password</label>
                  <div className="salog-input-wrap">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                    <span className="salog-input-icon">🔒</span>
                  </div>
                </div>

                {error && <p className="salog-error">{error}</p>}

                <button type="submit" className="salog-btn-login" disabled={loading}>
                  {loading ? "Sending OTP..." : "Login →"}
                </button>
              </form>

             
            </>
          )}

          {/* ── STEP 2 — OTP Verification ── */}
          {step === 2 && (
            <>
              <h2 className="salog-title">Verify OTP</h2>

              {otpMsg && (
                <p className="salog-otp-msg">📧 {otpMsg}</p>
              )}

              <p className="salog-otp-hint">
                Enter the 6-digit OTP sent to your registered email address.
                Valid for <strong>5 minutes</strong>.
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div className="salog-field">
                  <label>One-Time Password</label>
                  <div className="salog-input-wrap">
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      maxLength={6}
                      required
                      autoComplete="one-time-code"
                    />
                    <span className="salog-input-icon">🔢</span>
                  </div>
                </div>

                {error && <p className="salog-error">{error}</p>}

                <button type="submit" className="salog-btn-login" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
              </form>

              <button className="salog-otp-resend" onClick={handleResendOtp} disabled={loading}>
                Resend OTP
              </button>

              
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;