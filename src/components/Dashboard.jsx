import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import axios from 'axios';
import './dashboard.css';
import usePageTitle from '../usePageTitle';
import ptagLogo from '../assets/PTag.png';

const BASE_URL = "https://anpr-api.gconnectt.com";
const WS_URL   = "wss://anpr-api.gconnectt.com/ws/websocket";

function Dashboard() {
  usePageTitle("Admin Dashboard");

  const [data,             setData]           = useState([]);
  const [filtered,         setFiltered]       = useState([]);
  const [fromDate,         setFromDate]       = useState("");
  const [toDate,           setToDate]         = useState("");
  const [alertMessage,     setAlertMessage]   = useState("");
  const [newIds,           setNewIds]         = useState(new Set());
  const [pricePerMinute,   setPricePerMinute] = useState(null);
  const [newPrice,         setNewPrice]       = useState("");
  const [priceMsg,         setPriceMsg]       = useState("");
  const [myBranches,       setMyBranches]     = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [menuOpen,         setMenuOpen]       = useState(false);

  // ✅ Special price state
  const [specialPrice,      setSpecialPrice]      = useState("");
  const [specialPriceFrom,  setSpecialPriceFrom]  = useState("");
  const [specialPriceUntil, setSpecialPriceUntil] = useState("");
  const [currentSpecial,    setCurrentSpecial]    = useState(null);
  const [specialActive,     setSpecialActive]     = useState(false);
  const [specialFromDate,   setSpecialFromDate]   = useState("");
  const [specialUntilDate,  setSpecialUntilDate]  = useState("");

  const menuRef = useRef(null);
  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
  };

  const formatDateTime = (dt) => {
    if (!dt) return "-";
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true
    });
  };

  const getDate = (dt) => formatDateTime(dt).split(",")[0] ?? "-";
  const getTime = (dt) => formatDateTime(dt).split(",")[1]?.trim() ?? "-";

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  // ✅ Apply date filter
  const applyFilter = (logs, from, to) => {
    if (!from && !to) return logs;
    return logs.filter(log => {
      if (!log.entryTime) return false;
      const entryDate = new Date(log.entryTime);
      const fromD = from ? new Date(from) : null;
      const toD   = to   ? new Date(to)   : null;
      if (toD) toD.setHours(23, 59, 59, 999);
      if (fromD && entryDate < fromD) return false;
      if (toD   && entryDate > toD)   return false;
      return true;
    });
  };

  const handleFilter = () => {
    setFiltered(applyFilter(data, fromDate, toDate));
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setFiltered(data);
  };

  // ✅ Total revenue from filtered data
  const totalRevenue = filtered.reduce((sum, log) => sum + (log.price ?? 0), 0);

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

  // ✅ Fetch branches
  useEffect(() => {
    axios.get(`${BASE_URL}/branch/my-branches`, { headers: authHeaders })
      .then(res => {
        setMyBranches(res.data);
        if (res.data.length > 0) setSelectedBranchId(res.data[0].id);
      })
      .catch(err => console.error("Error fetching branches:", err));

    const stompClient = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
      connectHeaders: authHeaders,
      onStompError:     (frame) => console.error("STOMP error:", frame.headers['message']),
      onWebSocketError: (error) => console.error("WebSocket error:", error),
      onDisconnect:     ()      => console.warn("STOMP disconnected"),
      debug:            (str)   => console.log("[STOMP]", str)
    });

    stompClient.onConnect = () => {
      stompClient.subscribe("/topic/plates", (message) => {
        const log = JSON.parse(message.body);
        const id  = log.id ?? `ws-${Date.now()}`;
        setAlertMessage(`New plate detected: ${log.plateNumber}`);
        setTimeout(() => setAlertMessage(""), 5000);
        setData(prev => {
          const updated = [{ ...log, _wsId: id }, ...prev];
          setFiltered(applyFilter(updated, fromDate, toDate));
          return updated;
        });
        setNewIds(prev => new Set([...prev, id]));
        setTimeout(() => setNewIds(prev => {
          const next = new Set(prev); next.delete(id); return next;
        }), 2000);
      });
    };

    stompClient.activate();
    return () => stompClient.deactivate();
  }, []);

  // ✅ Fetch logs and price when branch changes
  useEffect(() => {
    if (!selectedBranchId) return;

    axios.get(`${BASE_URL}/getLogs?branchId=${selectedBranchId}`, { headers: authHeaders })
      .then(res => {
        setData(res.data);
        setFiltered(applyFilter(res.data, fromDate, toDate));
      })
      .catch(err => console.error("Error fetching logs:", err));

    axios.get(`${BASE_URL}/branch/price/${selectedBranchId}`, { headers: authHeaders })
      .then(res => {
        setPricePerMinute(res.data.pricePerMinute);
        setCurrentSpecial(res.data.specialPrice || null);
        setSpecialActive(res.data.specialActive || false);
      })
      .catch(err => console.error("Error fetching price:", err));

  }, [selectedBranchId]);

  const updatePrice = () => {
    if (!newPrice || isNaN(newPrice)) {
      setPriceMsg("Please enter a valid price.");
      setTimeout(() => setPriceMsg(""), 3000);
      return;
    }
    axios.put(`${BASE_URL}/branch/price/${selectedBranchId}`,
      { pricePerMinute: parseFloat(newPrice) },
      { headers: authHeaders }
    ).then(res => {
      setPricePerMinute(res.data.pricePerMinute);
      setNewPrice("");
      setPriceMsg("Price updated successfully!");
      setTimeout(() => setPriceMsg(""), 3000);
    }).catch(err => {
      console.error(err);
      setPriceMsg("Failed to update price.");
      setTimeout(() => setPriceMsg(""), 3000);
    });
  };

  const updateSpecialPrice = () => {
    if (!specialPrice || isNaN(specialPrice)) {
      setPriceMsg("Please enter a valid special price.");
      setTimeout(() => setPriceMsg(""), 3000);
      return;
    }
    if (!specialPriceFrom) {
      setPriceMsg("Please select a from date.");
      setTimeout(() => setPriceMsg(""), 3000);
      return;
    }
    if (!specialPriceUntil) {
      setPriceMsg("Please select an until date.");
      setTimeout(() => setPriceMsg(""), 3000);
      return;
    }
    axios.put(`${BASE_URL}/branch/price/${selectedBranchId}`,
      { pricePerMinute, specialPrice: parseFloat(specialPrice), specialPriceFrom, specialPriceUntil },
      { headers: authHeaders }
    ).then(res => {
      setCurrentSpecial(res.data.specialPrice);
      setSpecialActive(true);
      setSpecialFromDate(specialPriceFrom);
      setSpecialUntilDate(specialPriceUntil);
      setSpecialPrice("");
      setSpecialPriceFrom("");
      setSpecialPriceUntil("");
      setPriceMsg("Special price set successfully!");
      setTimeout(() => setPriceMsg(""), 3000);
    }).catch(err => {
      console.error(err);
      setPriceMsg("Failed to set special price.");
      setTimeout(() => setPriceMsg(""), 3000);
    });
  };

  const clearSpecialPrice = () => {
    axios.put(`${BASE_URL}/branch/price/${selectedBranchId}`,
      { pricePerMinute, clearSpecialPrice: true },
      { headers: authHeaders }
    ).then(() => {
      setCurrentSpecial(null);
      setSpecialActive(false);
      setSpecialFromDate("");
      setSpecialUntilDate("");
      setPriceMsg("Special price cleared.");
      setTimeout(() => setPriceMsg(""), 3000);
    }).catch(err => {
      console.error(err);
      setPriceMsg("Failed to clear special price.");
      setTimeout(() => setPriceMsg(""), 3000);
    });
  };

  const selectedBranch = myBranches.find(b => b.id === selectedBranchId);

  return (
    <div className="admindash-wrapper">

      {/* ── NAVBAR ── */}
      <nav className="admindash-navbar">
        <a href="#" className="admindash-nav-logo">
          <img src={ptagLogo} alt="PTag Logo" className="admindash-nav-logo-img" />
          <div className="admindash-nav-logo-text">
            <span className="ptag-bold">P</span>
            <span className="ptag-thin">Tag</span>
          </div>
        </a>

        <span className="admindash-nav-title">Admin Command Center</span>

        <div className="admindash-nav-right" ref={menuRef}>
          <button
            className="admindash-menu-btn"
            onClick={() => setMenuOpen(prev => !prev)}
          >
            ☰
          </button>

          {menuOpen && (
            <div className="admindash-menu-dropdown">
              {myBranches.length > 1 && (
                <select
                  value={selectedBranchId ?? ""}
                  onChange={e => setSelectedBranchId(Number(e.target.value))}
                  className="admindash-branch-select"
                >
                  {myBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.branchName}</option>
                  ))}
                </select>
              )}
              {myBranches.length === 1 && (
                <div className="admindash-branch-tag">
                  {myBranches[0].branchName}
                </div>
              )}
              <button onClick={handleLogout} className="admindash-logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── MAIN BODY ── */}
      <main className="admindash-body">

        {alertMessage && (
          <div className="admindash-alert">
            <span className="admindash-alert-dot" />
            {alertMessage}
          </div>
        )}

        {/* ✅ Price Card */}
        <div className="admindash-price-card">
          <div className="admindash-price-left">
            <p className="admindash-price-label">
              Current Parking Rate
              {selectedBranch && (
                <span style={{ marginLeft: "8px", color: "#8B3A3A" }}>
                  — {selectedBranch.branchName}
                </span>
              )}
            </p>
            <p className="admindash-price-value">
              ₹{pricePerMinute ?? "—"}
              <span className="admindash-price-unit"> / min</span>
            </p>

            {specialActive && currentSpecial && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                <div className="admindash-special-badge">
                  🏷️ Special: ₹{currentSpecial}/min active
                  <button onClick={clearSpecialPrice} className="admindash-clear-btn">
                    ✕ Clear
                  </button>
                </div>
                {specialFromDate && specialUntilDate && (
                  <span style={{ fontSize: "11px", color: "#9a6060", fontWeight: 600, paddingLeft: "4px" }}>
                    {new Date(specialFromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {" → "}
                    {new Date(specialUntilDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="admindash-price-right">
            <input
              type="number"
              placeholder="New price per minute"
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              className="admindash-price-input"
            />
            <button onClick={updatePrice} className="admindash-price-btn">
              Update Price
            </button>

            <div className="admindash-special-row">
              <input
                type="number"
                placeholder="Special price / min"
                value={specialPrice}
                onChange={e => setSpecialPrice(e.target.value)}
                className="admindash-price-input"
              />
              <input
                type="date"
                value={specialPriceFrom}
                onChange={e => setSpecialPriceFrom(e.target.value)}
                className="admindash-price-input admindash-date-input"
                min={new Date().toISOString().split("T")[0]}
              />
              <input
                type="date"
                value={specialPriceUntil}
                onChange={e => setSpecialPriceUntil(e.target.value)}
                className="admindash-price-input admindash-date-input"
                min={new Date().toISOString().split("T")[0]}
              />
              <button onClick={updateSpecialPrice} className="admindash-price-btn admindash-special-btn">
                Set Special Price
              </button>
            </div>

            {priceMsg && (
              <span className="admindash-price-msg"
                style={{
                  color: priceMsg.includes("success") || priceMsg.includes("cleared")
                    ? "#27ae60" : "#e74c3c"
                }}>
                {priceMsg}
              </span>
            )}
          </div>
        </div>

        {/* ✅ Date Filter Card */}
        <div className="admindash-filter-card">
          <div className="admindash-filter-left">
            <p className="admindash-filter-heading">📅 Filter by Date</p>
            <div className="admindash-filter-fields">
              <div className="admindash-filter-field">
                <label>From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="admindash-price-input admindash-date-input"
                />
              </div>
              <div className="admindash-filter-field">
                <label>To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="admindash-price-input admindash-date-input"
                />
              </div>
              <button onClick={handleFilter} className="admindash-price-btn">
                Apply
              </button>
              <button onClick={handleReset} className="admindash-reset-btn">
                Reset
              </button>
            </div>
          </div>
          {(fromDate || toDate) && (
            <div className="admindash-filter-result">
              <span className="admindash-filter-count">
                {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
              </span>
              {fromDate && toDate && (
                <span className="admindash-filter-range">
                  {new Date(fromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  {" → "}
                  {new Date(toDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Table card */}
        <div className="admindash-card">
          <h2 className="admindash-title">
            Vehicle Entry Logs
            {selectedBranch && (
              <span style={{ fontSize: "14px", fontWeight: "500",
                             color: "#9a6060", marginLeft: "12px" }}>
                {selectedBranch.branchName} — {selectedBranch.location}
              </span>
            )}
          </h2>

          <div className="admindash-table-scroll">
            <table className="admindash-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Date</th>
                  <th>Vehicle Number</th>
                  <th>In Time</th>
                  <th>Exit Time</th>
                  <th>Status</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admindash-empty">
                      {fromDate || toDate
                        ? "No logs found for the selected date range."
                        : "No logs found."}
                    </td>
                  </tr>
                ) : (
                  <>
                    {filtered.map((log, index) => {
                      const rowId = log._wsId ?? log.id ?? index;
                      const isNew = newIds.has(rowId);
                      return (
                        <tr key={rowId}
                            className={`admindash-row${isNew ? " admindash-row-new" : ""}`}>
                          <td style={{ color: "#b09090", fontSize: 12 }}>{index + 1}</td>
                          <td>{getDate(log.entryTime)}</td>
                          <td className="admindash-plate">{log.plateNumber}</td>
                          <td>{getTime(log.entryTime)}</td>
                          <td>{log.exitTime ? getTime(log.exitTime) : "—"}</td>
                          <td>
                            <span className={`admindash-badge ${log.inside
                              ? "admindash-badge--in"
                              : "admindash-badge--out"}`}>
                              {log.inside ? "Inside" : "Exited"}
                            </span>
                          </td>
                          <td className="admindash-price">
                            {log.price != null ? `₹${log.price}` : "—"}
                          </td>
                        </tr>
                      );
                    })}

                    <tr className="admindash-total-row">
                      <td colSpan={6} className="admindash-total-label">
                        Total Revenue ({filtered.length} records)
                      </td>
                      <td className="admindash-total-amount">
                        ₹{totalRevenue.toFixed(0)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;