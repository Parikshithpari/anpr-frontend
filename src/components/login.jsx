import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './login.css';
import usePageTitle from '../usePageTitle';
import ptagLogo from '../assets/PTag.png';   // ← your actual jpg

const BASE_URL = "https://anpr-api.gconnectt.com";

function Login({ onLogin }) {
  usePageTitle("Admin Login");
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const navigate  = useNavigate();
  const canvasRef = useRef(null);

  // ── Particle network ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

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
          const dx   = dots[i].x - dots[j].x;
          const dy   = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139,58,58,${0.15 * (1 - dist / 140)})`;
            ctx.lineWidth   = 0.7;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      dots.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139,58,58,0.35)';
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
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username,
      password
    }, {
      headers: { "ngrok-skip-browser-warning": "true" }
    });

    const token = res.data.token;
    localStorage.setItem('token', token);

    // ✅ Remove getLogs call here — Dashboard fetches its own logs
    onLogin({});
    navigate('/dashboard');

  } catch (err) {
    console.error(err);
    setError('Login failed. Check username and password.');
  }
};

  

  return (
    <div className="adminlog-wrapper">

      {/* Background particle network */}
      <canvas ref={canvasRef} className="adminlog-canvas" />

      {/* ── NAVBAR ── */}
      <nav className="adminlog-navbar">
        <a href="#" className="adminlog-nav-logo">
          {/* ✅ Real logo image — change className prefix to match any page */}
          <img src={ptagLogo} alt="PTag Logo" className="adminlog-nav-logo-img" />
          <div className="adminlog-nav-logo-text">
            <span className="ptag-bold">P</span>
            <span className="ptag-thin">Tag</span>
          </div>
        </a>
        <span className="adminlog-nav-title">Admin Command Center</span>
        <div style={{ width: 120 }} />
      </nav>

      {/* ── CARD ── */}
      <div className="adminlog-body">
        <div className="adminlog-card">

          <h2 className="adminlog-title">Admin Login</h2>

          <form onSubmit={handleSubmit}>

            <div className="adminlog-field">
              <label>Username</label>
              <div className="adminlog-input-wrap">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
                <span className="adminlog-input-icon">👤</span>
              </div>
            </div>

            <div className="adminlog-field">
              <label>Password</label>
              <div className="adminlog-input-wrap">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <span className="adminlog-input-icon">🔒</span>
              </div>
            </div>

            {error && <p className="adminlog-error">{error}</p>}

            <button type="submit" className="adminlog-btn-login">Login</button>

          </form>

          
        </div>
      </div>

    </div>
  );
}

export default Login;