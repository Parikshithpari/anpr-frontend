import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./UserRegistration.css";
import usePageTitle from '../usePageTitle';
import ptagLogo from '../assets/PTag.png';

//const BASE_URL = "https://anpr-api.gconnectt.com";
const BASE_URL = "http://localhost:8080";

const UserRegistration = ({ onRegister }) => {
  usePageTitle("User Registration");

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name:        "",
    phoneNumber: "",
    email:       "",
    password:    "",
    plateNumber: "",
    rcNumber:    "",
    dateOfBirth: "",
  });

  const [amount,  setAmount]  = useState("200");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Step 1 validation — go to step 2
  const handleNextStep = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setStep(2);
  };

  // ✅ Step 2 — submit full form
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.plateNumber.trim()) {
      setError("Please enter your vehicle plate number.");
      return;
    }
    if (!formData.rcNumber.trim()) {
      setError("Please enter your RC number.");
      return;
    }
    if (parseFloat(amount) < 200) {
      setError("Minimum top-up amount is ₹200");
      return;
    }

    setLoading(true);

    fetch(`${BASE_URL}/api/payment/initiate`, {   // ✅ changed from /mock-register
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, amount })
    })
      .then(async res => {
        const text = await res.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
        if (!res.ok) throw new Error(data.error || "Payment initiation failed");
        return data;
      })
      .then(data => {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;  // ✅ redirect to PhonePe page
        } else {
          throw new Error("No payment URL received");
        }
      })
      .catch(err => {
        console.error(err);
        setError(err.message || "Payment initiation failed. Please try again.");
        setLoading(false);
      });
  };

  return (
    <div className="userreg-wrapper">

      <nav className="userreg-navbar">
        <a href="#" className="userreg-nav-logo">
          <img src={ptagLogo} alt="PTag Logo" className="userreg-nav-logo-img" />
          <div className="userreg-nav-logo-text">
            <span className="ptag-bold">P</span>
            <span className="ptag-thin">Tag</span>
          </div>
        </a>
      </nav>

      <div className="userreg-body">
        <div className="userreg-card">

          {/* ── LEFT PANEL ── */}
          <div className="userreg-left">
            <h2>Create Your<br /><span>PTag</span> Account</h2>
            <p>Register your vehicle and add money to get started with seamless parking.</p>

            {/* ✅ Step indicator on left panel */}
            <div className="userreg-steps">
              <div className={`userreg-step ${step >= 1 ? "userreg-step--active" : ""} ${step > 1 ? "userreg-step--done" : ""}`}>
                <div className="userreg-step-dot">
                  {step > 1 ? "✓" : "1"}
                </div>
                <div className="userreg-step-info">
                  <span className="userreg-step-label">Step 1</span>
                  <span className="userreg-step-name">Personal Info</span>
                </div>
              </div>

              <div className="userreg-step-line" />

              <div className={`userreg-step ${step >= 2 ? "userreg-step--active" : ""}`}>
                <div className="userreg-step-dot">2</div>
                <div className="userreg-step-info">
                  <span className="userreg-step-label">Step 2</span>
                  <span className="userreg-step-name">Vehicle & Payment</span>
                </div>
              </div>
            </div>

            <div className="userreg-left-info">
              <div className="userreg-left-info-item"><span>✅</span><span>Minimum top-up ₹200</span></div>
              <div className="userreg-left-info-item"><span>✅</span><span>Auto deduction on exit</span></div>
              <div className="userreg-left-info-item"><span>✅</span><span>Secure PhonePe payment</span></div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="userreg-right">

            {/* ── STEP 1 — Personal Info ── */}
            {step === 1 && (
              <form onSubmit={handleNextStep}>
                <p className="userreg-form-title">Personal Information</p>
                <p className="userreg-form-subtitle">Tell us about yourself to create your account.</p>

                <div className="userreg-field">
                  <span className="userreg-field-icon">👤</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="userreg-field">
                  <span className="userreg-field-icon">✉</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="userreg-field">
                  <span className="userreg-field-icon">✆</span>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="Mobile Number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="userreg-field">
                  <span className="userreg-field-icon">🔒</span>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="userreg-field">
  <span className="userreg-field-icon">🎂</span>
  <input
    type="date"
    name="dateOfBirth"
    placeholder="Date of Birth"
    value={formData.dateOfBirth}
    onChange={handleChange}
    max={new Date().toISOString().split("T")[0]}
    required
  />
</div>

                {error && <p className="userreg-error">{error}</p>}

                <button type="submit" className="userreg-next-btn">
                  Continue →
                </button>

                <p className="userreg-login-text">
                  Already registered?{" "}
                  <Link to="/userLogin" className="userreg-login-link">Login here</Link>
                </p>
              </form>
            )}

            {/* ── STEP 2 — Vehicle & Payment ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <p className="userreg-form-title">Vehicle & Payment</p>
                <p className="userreg-form-subtitle">Add your vehicle details and initial wallet balance.</p>

                <div className="userreg-field">
                  <span className="userreg-field-icon">🚗</span>
                  <input
                    type="text"
                    name="plateNumber"
                    placeholder="Vehicle Plate Number (e.g. TS09AB1234)"
                    value={formData.plateNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="userreg-field">
                  <span className="userreg-field-icon">📄</span>
                  <input
                    type="text"
                    name="rcNumber"
                    placeholder="RC Number"
                    value={formData.rcNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="userreg-field">
                  <span className="userreg-field-icon">₹</span>
                  <input
                    type="number"
                    name="amount"
                    placeholder="Top-up Amount (min ₹200)"
                    value={amount}
                    min="200"
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>

                {error && <p className="userreg-error">{error}</p>}

                <button type="submit" disabled={loading}>
                  {loading ? "Redirecting to PhonePe..." : `Register & Pay ₹${amount}`}
                </button>

                {/* ✅ Back button */}
                <button
                  type="button"
                  className="userreg-back-btn"
                  onClick={() => { setStep(1); setError(""); }}>
                  ← Back
                </button>

                <p className="userreg-login-text">
                  Already registered?{" "}
                  <Link to="/userLogin" className="userreg-login-link">Login here</Link>
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;