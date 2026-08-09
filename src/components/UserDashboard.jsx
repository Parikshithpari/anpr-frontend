import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import "./UserDashboard.css";
import usePageTitle from '../usePageTitle';
import ptagLogo from '../assets/PTag.png';

const BASE_URL = "https://anpr-api.gconnectt.com";

const UserDashboard = ({ user, onLogout }) => {
  usePageTitle("User Dashboard");
  const location = useLocation();

  const [activeView,   setActiveView]   = useState("dashboard");
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [txLoading,    setTxLoading]    = useState(false);
  const [topupAmount,  setTopupAmount]  = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMsg,     setTopupMsg]     = useState("");
  const [txFromDate,   setTxFromDate]   = useState("");
  const [txToDate,     setTxToDate]     = useState("");
  const [balFromDate,  setBalFromDate]  = useState("");
  const [balToDate,    setBalToDate]    = useState("");

  const menuRef = useRef(null);
  const token   = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
  };

  // ✅ Check topup result from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const topup  = params.get("topup");
    if (topup === "success") {
      setTopupMsg("✅ Balance added successfully!");
      setActiveView("balance");
    } else if (topup === "failed") {
      setTopupMsg("❌ Payment failed. Please try again.");
      setActiveView("balance");
    }
  }, []);

  // ✅ Fetch on page load for home stats count
  // ✅ Fetch on page load — safe parse
useEffect(() => {
  if (!user?.plateNumber) return;
  fetch(`${BASE_URL}/user/transactions/by-plate/${user.plateNumber}`, {
    headers: authHeaders
  })
    .then(async res => {
      const text = await res.text();
      try { return text ? JSON.parse(text) : []; } catch { return []; }
    })
    .then(data => setTransactions(Array.isArray(data) ? data : []))
    .catch(() => setTransactions([]));
}, [user?.plateNumber]);

// ✅ Fetch on view switch — safe parse
useEffect(() => {
  if (activeView !== "transactions" && activeView !== "balance") return;
  if (!user?.plateNumber) return;
  setTxLoading(true);
  fetch(`${BASE_URL}/user/transactions/by-plate/${user.plateNumber}`, {
    headers: authHeaders
  })
    .then(async res => {
      const text = await res.text();
      try { return text ? JSON.parse(text) : []; } catch { return []; }
    })
    .then(data => setTransactions(Array.isArray(data) ? data : []))
    .catch(() => setTransactions([]))
    .finally(() => setTxLoading(false));
}, [activeView, user?.plateNumber]);

  // ✅ Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  // ✅ Filter transactions by date
  const filterTx = (from, to) => {
    if (!from && !to) return transactions;
    return transactions.filter(tx => {
      const d = new Date(tx.exitTime || tx.entryTime);
      if (from && d < new Date(from)) return false;
      if (to) {
        const toD = new Date(to);
        toD.setHours(23, 59, 59);
        if (d > toD) return false;
      }
      return true;
    });
  };

  const filteredTx  = filterTx(txFromDate,  txToDate);
  const filteredBal = filterTx(balFromDate, balToDate);

  // ✅ Build chart data from transactions
  const buildDailyData = (txList) => {
    const map = {};
    txList.forEach(tx => {
      if (!tx.exitTime) return;
      const date = new Date(tx.exitTime).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short"
      });
      map[date] = (map[date] || 0) + (tx.price ?? 0);
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  };

  const txChartData  = buildDailyData(filteredTx);
  const balChartData = buildDailyData(filteredBal);

  const totalSpent    = filteredTx.reduce((s, tx) => s + (tx.price ?? 0), 0);
  const totalSessions = filteredTx.length;

  // ✅ Initiate top-up
  const handleTopUp = async (amt) => {
    const amount = amt || topupAmount;
    if (!amount || isNaN(amount) || parseFloat(amount) < 200) {
      setTopupMsg("Minimum top-up is ₹200");
      setTimeout(() => setTopupMsg(""), 3000);
      return;
    }
    setTopupLoading(true);
    try {
      const res  = await fetch(`${BASE_URL}/user/topup/initiate`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount: String(amount) })
      });
      const text = await res.text();
      let data   = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
      if (!res.ok) { setTopupMsg(data.error || "Failed to initiate"); return; }
      window.location.href = data.paymentUrl;
    } catch (err) {
      setTopupMsg("Something went wrong.");
    } finally {
      setTopupLoading(false);
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return "—";
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  const navItems = [
    { key: "dashboard",    label: "Home",         icon: "⬡" },
    { key: "profile",      label: "Profile",      icon: "👤" },
    { key: "balance",      label: "Balance",      icon: "₹" },
    { key: "transactions", label: "Transactions", icon: "📋" },
  ];

  // ✅ Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="userdash-tooltip">
          <p className="userdash-tooltip-label">{label}</p>
          <p className="userdash-tooltip-value">₹{payload[0].value.toFixed(0)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="userdash-wrapper">

      {/* ── NAVBAR ── */}
      <nav className="userdash-navbar">
        <a href="#" className="userdash-nav-logo">
          <img src={ptagLogo} alt="PTag Logo" className="userdash-nav-logo-img" />
          <div className="userdash-nav-logo-text">
            <span className="ptag-bold">P</span>
            <span className="ptag-thin">Tag</span>
          </div>
        </a>

        <ul className="userdash-nav-links">
          {navItems.map(item => (
            <li key={item.key}>
              <button
                className={`userdash-nav-link-btn ${activeView === item.key ? "userdash-nav-link-btn--active" : ""}`}
                onClick={() => setActiveView(item.key)}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="userdash-nav-avatar-wrap" ref={menuRef}>
          <div
            className="userdash-nav-avatar-placeholder"
            onClick={() => setMenuOpen(prev => !prev)}>
            {user.name?.charAt(0).toUpperCase()}
          </div>

          {menuOpen && (
            <div className="userdash-avatar-dropdown">
              <div className="userdash-dropdown-header">
                <div className="userdash-dropdown-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="userdash-dropdown-name">{user.name}</p>
                  <p className="userdash-dropdown-email">{user.email}</p>
                </div>
              </div>
              <div className="userdash-dropdown-divider" />
              {navItems.map(item => (
                <button key={item.key}
                  className={`userdash-dropdown-item ${activeView === item.key ? "userdash-dropdown-item--active" : ""}`}
                  onClick={() => { setActiveView(item.key); setMenuOpen(false); }}>
                  <span className="userdash-dropdown-item-icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="userdash-dropdown-divider" />
              <button className="userdash-dropdown-logout" onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/userLogin";
              }}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── MAIN BODY ── */}
      <div className="userdash-body">

        {/* ══════════════ DASHBOARD VIEW ══════════════ */}
        {activeView === "dashboard" && (
          <div className="userdash-home">

            {/* Greeting banner */}
            <div className="userdash-home-banner">
              <div className="userdash-home-banner-ring userdash-home-banner-ring--1" />
              <div className="userdash-home-banner-ring userdash-home-banner-ring--2" />
              <div className="userdash-home-banner-glow" />
              <div className="userdash-home-banner-left">
                <p className="userdash-home-greeting">Welcome back,</p>
                <h1 className="userdash-home-name">{user.name} 👋</h1>
                <p className="userdash-home-tagline">
                  Your smart parking companion. Seamless. Automatic. Effortless.
                </p>
              </div>
              <div className="userdash-home-banner-right">
                <div className="userdash-home-balance-pill">
                  <p className="userdash-home-balance-label">Wallet Balance</p>
                  <p className="userdash-home-balance-value">₹{user.balance?.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="userdash-home-stats">
              <div className="userdash-home-stat-card"
                onClick={() => setActiveView("balance")}>
                <div className="userdash-home-stat-icon userdash-home-stat-icon--green">💰</div>
                <p className="userdash-home-stat-label">Available Balance</p>
                <p className="userdash-home-stat-value">₹{user.balance?.toFixed(0)}</p>
                <p className="userdash-home-stat-action">Add Money →</p>
              </div>

              <div className="userdash-home-stat-card"
                onClick={() => setActiveView("transactions")}>
                <div className="userdash-home-stat-icon userdash-home-stat-icon--blue">🚗</div>
                <p className="userdash-home-stat-label">Parking Sessions</p>
                <p className="userdash-home-stat-value">{transactions.length}</p>
                <p className="userdash-home-stat-action">View History →</p>
              </div>

              <div className="userdash-home-stat-card"
                onClick={() => setActiveView("profile")}>
                <div className="userdash-home-stat-icon userdash-home-stat-icon--red">🚘</div>
                <p className="userdash-home-stat-label">Registered Vehicle</p>
                <p className="userdash-home-stat-value" style={{ fontSize: "18px" }}>
                  {user.plateNumber}
                </p>
                <p className="userdash-home-stat-action">View Profile →</p>
              </div>
            </div>

            {/* How it works */}
            <div className="userdash-home-how">
              <p className="userdash-home-how-title">How PTag Works</p>
              <div className="userdash-home-steps">
                {[
                  { icon: "📷", step: "01", title: "Camera Scans", desc: "ANPR camera detects your plate on entry" },
                  { icon: "⏱",  step: "02", title: "Timer Starts", desc: "Parking duration is tracked automatically" },
                  { icon: "💸", step: "03", title: "Auto Deduct",  desc: "Amount deducted from wallet on exit" },
                  { icon: "✅", step: "04", title: "Done!",        desc: "No cash, no queues, no hassle" },
                ].map(s => (
                  <div key={s.step} className="userdash-home-step">
                    <div className="userdash-home-step-icon">{s.icon}</div>
                    <p className="userdash-home-step-num">{s.step}</p>
                    <p className="userdash-home-step-title">{s.title}</p>
                    <p className="userdash-home-step-desc">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ══════════════ PROFILE VIEW ══════════════ */}
        {activeView === "profile" && (
          <div className="userdash-view-card">
            <div className="userdash-view-header">
              <div className="userdash-view-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="userdash-view-title">{user.name}</h2>
                <p className="userdash-view-subtitle">PTag Member · Active Account</p>
              </div>
            </div>

            {/* Profile banner */}
            <div className="userdash-profile-banner">
              <div className="userdash-profile-banner-item">
                <p className="userdash-profile-banner-val">₹{user.balance?.toFixed(0)}</p>
                <p className="userdash-profile-banner-label">Wallet</p>
              </div>
              <div className="userdash-profile-banner-div" />
              <div className="userdash-profile-banner-item">
                <p className="userdash-profile-banner-val">{user.plateNumber}</p>
                <p className="userdash-profile-banner-label">Vehicle</p>
              </div>
              <div className="userdash-profile-banner-div" />
              <div className="userdash-profile-banner-item">
                <p className="userdash-profile-banner-val">Active</p>
                <p className="userdash-profile-banner-label">Status</p>
              </div>
            </div>

            <div className="userdash-view-section">
              <p className="userdash-view-section-label">Personal Information</p>
              <div className="userdash-profile-grid">
                {[
                  { icon: "👤", label: "Full Name",     value: user.name },
                  { icon: "✉",  label: "Email Address", value: user.email },
                  { icon: "✆",  label: "Phone Number",  value: user.phoneNumber },
                  { icon: "◈",  label: "Vehicle Plate", value: user.plateNumber },
                  
                ].map(row => (
                  <div key={row.label} className="userdash-profile-item">
                    <div className="userdash-profile-item-icon-wrap">
                      <span className="userdash-profile-item-icon">{row.icon}</span>
                    </div>
                    <div className="userdash-profile-item-content">
                      <p className="userdash-profile-item-label">{row.label}</p>
                      <p className="userdash-profile-item-value">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ BALANCE VIEW ══════════════ */}
        {activeView === "balance" && (
          <div className="userdash-view-card userdash-view-card--wide">
            <div className="userdash-view-header">
              <div className="userdash-balance-icon">₹</div>
              <div>
                <h2 className="userdash-view-title">Wallet Balance</h2>
                <p className="userdash-view-subtitle">Manage your PTag wallet</p>
              </div>
            </div>

            {topupMsg && (
              <div className={`userdash-topup-msg ${
                topupMsg.includes("✅")
                  ? "userdash-topup-msg--success"
                  : "userdash-topup-msg--error"
              }`}>
                {topupMsg}
              </div>
            )}

            <div className="userdash-balance-body">

              {/* Left — balance display + top up */}
              <div className="userdash-balance-left">
                <div className="userdash-balance-display">
                  <div className="userdash-balance-display-ring" />
                  <p className="userdash-balance-display-label">Current Balance</p>
                  <p className="userdash-balance-display-amount">₹{user.balance?.toFixed(2)}</p>
                  <p className="userdash-balance-display-note">Auto-deducted on exit</p>
                </div>

                <div className="userdash-view-section">
                  <p className="userdash-view-section-label">Quick Top-Up</p>
                  <div className="userdash-topup-amounts">
                    {[200, 500, 1000, 2000].map(amt => (
                      <button key={amt} className="userdash-topup-chip"
                        onClick={() => handleTopUp(amt)}>
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  <div className="userdash-topup-row">
                    <input
                      type="number"
                      placeholder="Custom amount (min ₹200)"
                      className="userdash-topup-input"
                      value={topupAmount}
                      onChange={e => setTopupAmount(e.target.value)}
                      min="200"
                    />
                    <button
                      className="userdash-btn-primary"
                      style={{ whiteSpace: "nowrap", flex: "none", padding: "13px 20px" }}
                      disabled={topupLoading}
                      onClick={() => handleTopUp(null)}>
                      {topupLoading ? "Redirecting..." : "Pay via PhonePe"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right — spending chart */}
              <div className="userdash-balance-right">
                <div className="userdash-chart-header">
                  <p className="userdash-chart-title">Spending Over Time</p>
                  <div className="userdash-date-filters">
                    <input type="date" value={balFromDate}
                      onChange={e => setBalFromDate(e.target.value)}
                      className="userdash-date-input" />
                    <span className="userdash-date-sep">→</span>
                    <input type="date" value={balToDate}
                      onChange={e => setBalToDate(e.target.value)}
                      className="userdash-date-input" />
                    {(balFromDate || balToDate) && (
                      <button className="userdash-date-clear"
                        onClick={() => { setBalFromDate(""); setBalToDate(""); }}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {txLoading ? (
                  <div className="userdash-chart-empty">
                    <p>Loading data...</p>
                  </div>
                ) : balChartData.length === 0 ? (
                  <div className="userdash-chart-empty">
                    <p>No spending data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={balChartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#8b3a3a" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#8b3a3a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,58,58,0.10)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9a6060" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9a6060" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="amount"
                        stroke="#8b3a3a" strokeWidth={2.5}
                        fill="url(#balGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                <div className="userdash-balance-stats">
                  <div className="userdash-balance-stat">
                    <p className="userdash-balance-stat-val">
                      ₹{filteredBal.reduce((s, tx) => s + (tx.price ?? 0), 0).toFixed(0)}
                    </p>
                    <p className="userdash-balance-stat-label">Total Spent</p>
                  </div>
                  <div className="userdash-balance-stat">
                    <p className="userdash-balance-stat-val">{filteredBal.length}</p>
                    <p className="userdash-balance-stat-label">Sessions</p>
                  </div>
                  <div className="userdash-balance-stat">
                    <p className="userdash-balance-stat-val">
                      ₹{filteredBal.length > 0
                        ? (filteredBal.reduce((s, tx) => s + (tx.price ?? 0), 0) / filteredBal.length).toFixed(0)
                        : 0}
                    </p>
                    <p className="userdash-balance-stat-label">Avg/Session</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TRANSACTIONS VIEW ══════════════ */}
        {activeView === "transactions" && (
          <div className="userdash-view-card userdash-view-card--wide">
            <div className="userdash-view-header">
              <div className="userdash-tx-icon">📋</div>
              <div>
                <h2 className="userdash-view-title">Transaction History</h2>
                <p className="userdash-view-subtitle">Your parking sessions</p>
              </div>
            </div>

            {/* Summary cards */}
            <div className="userdash-tx-summary">
              <div className="userdash-tx-summary-card">
                <p className="userdash-tx-summary-val">₹{totalSpent.toFixed(0)}</p>
                <p className="userdash-tx-summary-label">Total Spent</p>
              </div>
              <div className="userdash-tx-summary-card">
                <p className="userdash-tx-summary-val">{totalSessions}</p>
                <p className="userdash-tx-summary-label">Sessions</p>
              </div>
              <div className="userdash-tx-summary-card">
                <p className="userdash-tx-summary-val">
                  ₹{totalSessions > 0 ? (totalSpent / totalSessions).toFixed(0) : 0}
                </p>
                <p className="userdash-tx-summary-label">Avg per Session</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="userdash-chart-section">
              <div className="userdash-chart-header">
                <p className="userdash-chart-title">Daily Spending</p>
                <div className="userdash-date-filters">
                  <input type="date" value={txFromDate}
                    onChange={e => setTxFromDate(e.target.value)}
                    className="userdash-date-input" />
                  <span className="userdash-date-sep">→</span>
                  <input type="date" value={txToDate}
                    onChange={e => setTxToDate(e.target.value)}
                    className="userdash-date-input" />
                  {(txFromDate || txToDate) && (
                    <button className="userdash-date-clear"
                      onClick={() => { setTxFromDate(""); setTxToDate(""); }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {txLoading ? (
                <div className="userdash-chart-empty">
                  <p>Loading chart...</p>
                </div>
              ) : txChartData.length === 0 ? (
                <div className="userdash-chart-empty">
                  <p>No data for selected range</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={txChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,58,58,0.10)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9a6060" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9a6060" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#8b3a3a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Transactions table */}
            {txLoading ? (
              <div className="userdash-tx-loading">Loading transactions...</div>
            ) : filteredTx.length === 0 ? (
              <div className="userdash-tx-empty">
                <div className="userdash-tx-empty-icon">🚗</div>
                <p className="userdash-tx-empty-text">No transactions yet</p>
                <p className="userdash-tx-empty-sub">
                  Your parking history will appear here after your first session.
                </p>
              </div>
            ) : (
              <div className="userdash-tx-table-wrap">
                <table className="userdash-tx-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Entry Time</th>
                      <th>Exit Time</th>
                      <th>Branch</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((tx, i) => (
                      <tr key={tx.id ?? i}>
                        <td style={{ color: "#c09090", fontSize: 12 }}>{i + 1}</td>
                        <td>{formatDateTime(tx.entryTime)}</td>
                        <td>{formatDateTime(tx.exitTime)}</td>
                        <td>{tx.branch?.branchName ?? "—"}</td>
                        <td className="userdash-tx-amount">
                          ₹{tx.price?.toFixed(0) ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboard;