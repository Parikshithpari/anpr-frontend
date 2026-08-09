import React, { useState } from "react";
import "./UserLogin.css";
import { useNavigate, Link } from "react-router-dom";
import usePageTitle from '../usePageTitle';
import ptagLogo from '../assets/PTag.png';

const BASE_URL = "https://anpr-api.gconnectt.com";

const UserLogin = ({ onLogin }) => {
  usePageTitle("User Login");
  const [name,     setName]     = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");

  const [showForgot,  setShowForgot]  = useState(false);
  const [fpStep,      setFpStep]      = useState(1);
  const [fpEmail,     setFpEmail]     = useState("");
  const [fpOtp,       setFpOtp]       = useState("");
  const [fpNewPass,   setFpNewPass]   = useState("");
  const [fpConfirm,   setFpConfirm]   = useState("");
  const [fpMsg,       setFpMsg]       = useState("");
  const [fpError,     setFpError]     = useState("");
  const [fpLoading,   setFpLoading]   = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const navigate = useNavigate();

  const safeFetch = async (url, options) => {
    const res  = await fetch(url, options);
    const text = await res.text();
    let data   = {};
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { error: "Unexpected server response" }; }
    return { ok: res.ok, status: res.status, data };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { ok, data } = await safeFetch(`${BASE_URL}/userLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!ok) { setError(data.error || data.message || "Invalid username or password."); return; }
      if (!data || !data.name) { setError("Invalid username or password."); return; }
      if (onLogin) onLogin(data);
      navigate("/userDashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleSendOtp = async () => {
    if (!fpEmail) { setFpError("Please enter your email"); return; }
    setFpLoading(true); setFpError(""); setFpMsg("");
    try {
      const { ok, data } = await safeFetch(`${BASE_URL}/api/user/forgot-password/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail })
      });
      if (!ok) { setFpError(data.error || "Failed to send OTP"); return; }
      setMaskedEmail(data.maskedEmail || fpEmail);
      setFpMsg(`OTP sent to ${data.maskedEmail || fpEmail}`);
      setFpStep(2);
    } catch { setFpError("Something went wrong."); }
    finally { setFpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!fpOtp) { setFpError("Please enter the OTP"); return; }
    setFpLoading(true); setFpError("");
    try {
      const { ok, data } = await safeFetch(`${BASE_URL}/api/user/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp })
      });
      if (!ok || !data.valid) { setFpError(data.error || "Invalid OTP"); return; }
      setFpStep(3); setFpMsg("");
    } catch { setFpError("Something went wrong."); }
    finally { setFpLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!fpNewPass)              { setFpError("Please enter a new password");         return; }
    if (fpNewPass !== fpConfirm) { setFpError("Passwords do not match");              return; }
    if (fpNewPass.length < 6)   { setFpError("Password must be at least 6 chars");   return; }
    setFpLoading(true); setFpError("");
    try {
      const { ok, data } = await safeFetch(`${BASE_URL}/api/user/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail, otp: fpOtp, newPassword: fpNewPass })
      });
      if (!ok) { setFpError(data.error || "Failed to reset password"); return; }
      setFpMsg("Password reset successfully! You can now login.");
      setFpStep(4);
    } catch { setFpError("Something went wrong."); }
    finally { setFpLoading(false); }
  };

  const resetForgotFlow = () => {
    setShowForgot(false); setFpStep(1);
    setFpEmail(""); setFpOtp(""); setFpNewPass(""); setFpConfirm("");
    setFpMsg(""); setFpError(""); setMaskedEmail("");
  };

  return (
    <div className="userlogin-wrapper">
      <div className="userlogin-card">

        {/* ── LEFT PANEL ── */}
        <div className="userlogin-left">
          <a href="#" className="userlogin-nav-logo">
            <img src={ptagLogo} alt="PTag Logo" className="userlogin-nav-logo-img" />
            <div className="userlogin-nav-logo-text">
              <span className="ptag-bold">P</span>
              <span className="ptag-thin">Tag</span>
            </div>
          </a>
          <div className="userlogin-headline">
            <h2>Welcome <span>Back</span></h2>
            <p className="userlogin-subtitle">
              Login to access your PTag dashboard
            </p>
          </div>
          <div className="userlogin-left-features">
            <div className="userlogin-feature">
              <span className="userlogin-feature-dot" />
              <span>Auto deduction on exit</span>
            </div>
            <div className="userlogin-feature">
              <span className="userlogin-feature-dot" />
              <span>Real-time balance tracking</span>
            </div>
            <div className="userlogin-feature">
              <span className="userlogin-feature-dot" />
              <span>Secure PhonePe payments</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="userlogin-right">

          {/* ── NORMAL LOGIN ── */}
          {!showForgot && (
            <div className="userlogin-form-wrap">
              <h3 className="userlogin-form-title">Sign In</h3>
              <p className="userlogin-form-sub">Enter your credentials to continue</p>

              <form onSubmit={handleSubmit}>
                <div className="userlogin-field-group">
                  <label className="userlogin-label">Username</label>
                  <div className="userlogin-input-wrap">
                    <span className="userlogin-field-icon">👤</span>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="userlogin-field-group">
                  <label className="userlogin-label">Password</label>
                  <div className="userlogin-input-wrap">
                    <span className="userlogin-field-icon">🔑</span>
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button type="button"
                      className="userlogin-eye-btn"
                      onClick={() => setShowPass(p => !p)}>
                      {showPass ? "👁" : "🙈"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="userlogin-error-box">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <div className="userlogin-forgot-row">
                  <span className="userlogin-forgot-link"
                    onClick={() => setShowForgot(true)}>
                    Forgot Password?
                  </span>
                </div>

                <button type="submit" className="userlogin-submit-btn">
                  Sign In →
                </button>

                <p className="userlogin-register-text">
                  New to PTag?{" "}
                  <Link to="/register" className="userlogin-register-link">
                    Create an account
                  </Link>
                </p>
              </form>
            </div>
          )}

          {/* ── FORGOT PASSWORD FLOW ── */}
          {showForgot && (
            <div className="userlogin-forgot-wrap">

              {/* ── Step progress ── */}
              <div className="userlogin-steps">
                {["Email", "Verify", "Reset"].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`userlogin-step
                      ${fpStep > i + 1 ? "done" : ""}
                      ${fpStep === i + 1 ? "active" : ""}`}>
                      <div className="userlogin-step-circle">
                        {fpStep > i + 1 ? "✓" : i + 1}
                      </div>
                      <span className="userlogin-step-label">{s}</span>
                    </div>
                    {i < 2 && <div className={`userlogin-step-line ${fpStep > i + 1 ? "done" : ""}`} />}
                  </React.Fragment>
                ))}
              </div>

              {/* ── Step 1 — Email ── */}
              {fpStep === 1 && (
                <div className="userlogin-fp-body">
                  <div className="userlogin-fp-icon-wrap">
                    <span>📧</span>
                  </div>
                  <h3 className="userlogin-fp-title">Find your account</h3>
                  <p className="userlogin-fp-hint">
                    Enter the email address linked to your PTag account
                  </p>
                  <div className="userlogin-elegant-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={fpEmail}
                      onChange={e => setFpEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {fpError && <div className="userlogin-fp-error">{fpError}</div>}
                  <button className="userlogin-fp-btn"
                    onClick={handleSendOtp}
                    disabled={fpLoading}>
                    {fpLoading ? (
                      <span className="userlogin-spinner" />
                    ) : "Send OTP →"}
                  </button>
                  <button className="userlogin-fp-back" onClick={resetForgotFlow}>
                    ← Back to login
                  </button>
                </div>
              )}

              {/* ── Step 2 — OTP ── */}
              {fpStep === 2 && (
                <div className="userlogin-fp-body">
                  <div className="userlogin-fp-icon-wrap">
                    <span>🔐</span>
                  </div>
                  <h3 className="userlogin-fp-title">Enter OTP</h3>
                  {fpMsg && (
                    <div className="userlogin-fp-success-pill">
                      ✓ {fpMsg}
                    </div>
                  )}
                  <p className="userlogin-fp-hint">
                    6-digit code sent to <strong>{maskedEmail}</strong><br/>
                    <span style={{ fontSize: "11px", color: "#c09090" }}>
                      This is your registered email
                    </span>
                  </p>
                  {/* OTP boxes */}
                  <div className="userlogin-otp-wrap">
                    <input
                      type="text"
                      className="userlogin-otp-input"
                      placeholder="— — — — — —"
                      maxLength={6}
                      value={fpOtp}
                      onChange={e => setFpOtp(e.target.value.replace(/\D/g, ""))}
                      autoFocus
                    />
                  </div>
                  {fpError && <div className="userlogin-fp-error">{fpError}</div>}
                  <button className="userlogin-fp-btn"
                    onClick={handleVerifyOtp}
                    disabled={fpLoading || fpOtp.length < 6}>
                    {fpLoading ? <span className="userlogin-spinner" /> : "Verify OTP →"}
                  </button>
                  <button className="userlogin-fp-resend" onClick={handleSendOtp}
                    disabled={fpLoading}>
                    Didn't receive it? Resend OTP
                  </button>
                  <button className="userlogin-fp-back" onClick={resetForgotFlow}>
                    ← Back to login
                  </button>
                </div>
              )}

              {/* ── Step 3 — New password ── */}
              {fpStep === 3 && (
                <div className="userlogin-fp-body">
                  <div className="userlogin-fp-icon-wrap">
                    <span>🔒</span>
                  </div>
                  <h3 className="userlogin-fp-title">New password</h3>
                  <p className="userlogin-fp-hint">Choose a strong password for your account</p>
                  <div className="userlogin-elegant-field">
                    <label>New Password</label>
                    <div className="userlogin-pass-wrap">
                      <input
                        type={showNewPass ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={fpNewPass}
                        onChange={e => setFpNewPass(e.target.value)}
                        autoFocus
                      />
                      <button type="button"
                        className="userlogin-eye-inline"
                        onClick={() => setShowNewPass(p => !p)}>
                        {showNewPass ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>
                  <div className="userlogin-elegant-field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Repeat password"
                      value={fpConfirm}
                      onChange={e => setFpConfirm(e.target.value)}
                    />
                  </div>
                  {fpNewPass && fpConfirm && fpNewPass !== fpConfirm && (
                    <div className="userlogin-fp-error">Passwords do not match</div>
                  )}
                  {fpError && <div className="userlogin-fp-error">{fpError}</div>}
                  <button className="userlogin-fp-btn"
                    onClick={handleResetPassword}
                    disabled={fpLoading || !fpNewPass || fpNewPass !== fpConfirm}>
                    {fpLoading ? <span className="userlogin-spinner" /> : "Reset Password →"}
                  </button>
                  <button className="userlogin-fp-back" onClick={resetForgotFlow}>
                    ← Back to login
                  </button>
                </div>
              )}

              {/* ── Step 4 — Success ── */}
              {fpStep === 4 && (
                <div className="userlogin-fp-body userlogin-fp-success-body">
                  <div className="userlogin-fp-success-icon">✓</div>
                  <h3 className="userlogin-fp-title">All done!</h3>
                  <p className="userlogin-fp-hint">{fpMsg}</p>
                  <button className="userlogin-fp-btn" onClick={resetForgotFlow}>
                    Back to Login →
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserLogin;