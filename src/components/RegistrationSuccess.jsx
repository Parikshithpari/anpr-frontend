import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./RegistrationSuccess.css";
import usePageTitle from '../usePageTitle';

// ── PTag SVG Logo ──
const PTagLogo = ({ size = 44 }) => (
  <svg width={size} height={size} viewBox="0 0 200 210"
    xmlns="http://www.w3.org/2000/svg" className="regsuccess-nav-logo-svg">
    <style>{`.pa{fill:none;stroke:#8B3A3A;stroke-linecap:round;stroke-width:5.5}`}</style>
    {/* 3 short arcs — top-left */}
    <path className="pa" d="M 62,100 A 42,42 0 0 1 100,58" />
    <path className="pa" d="M 50,100 A 54,54 0 0 1 100,46" />
    <path className="pa" d="M 38,100 A 66,66 0 0 1 100,34" />
    {/* 5 large spiral arcs */}
    <path className="pa" d="M 62,100 A 42,42 0 1 0 100,142" />
    <path className="pa" d="M 50,100 A 54,54 0 1 0 100,154" />
    <path className="pa" d="M 38,100 A 66,66 0 1 0 100,166" />
    <path className="pa" d="M 26,100 A 78,78 0 1 0 100,178" />
    <path className="pa" d="M 14,100 A 90,90 0 1 0 100,190" />
    {/* Car body */}
    <rect x="62" y="75" width="72" height="42" rx="16" fill="#8B3A3A"/>
    <rect x="116" y="82" width="14" height="28" rx="4" fill="rgba(255,255,255,0.55)"/>
    <rect x="66"  y="84" width="11" height="24" rx="3" fill="rgba(255,255,255,0.38)"/>
    <rect x="83"  y="77" width="3" height="38" rx="1.5" fill="rgba(255,255,255,0.28)"/>
    <rect x="91"  y="77" width="3" height="38" rx="1.5" fill="rgba(255,255,255,0.28)"/>
    <rect x="99"  y="77" width="3" height="38" rx="1.5" fill="rgba(255,255,255,0.28)"/>
    <ellipse cx="125" cy="73"  rx="5" ry="3" fill="#8B3A3A"/>
    <ellipse cx="125" cy="119" rx="5" ry="3" fill="#8B3A3A"/>
  </svg>
);

const RegistrationSuccess = ({ user }) => {
  usePageTitle("Registration Successful");
  const canvasRef = useRef(null);

  // ── Particle network — terracotta ──
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

    const DOTS = 55;
    const dots = Array.from({ length: DOTS }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r:  Math.random() * 2.5 + 1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < DOTS; i++) {
        for (let j = i + 1; j < DOTS; j++) {
          const dx   = dots[i].x - dots[j].x;
          const dy   = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            // Terracotta lines
            ctx.strokeStyle = `rgba(139,58,58,${0.16 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }
      dots.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139,58,58,0.38)";
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

  // ── Floating terracotta sparkles ──
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id:       i,
    size:     Math.random() * 8 + 4,
    left:     `${10 + Math.random() * 80}%`,
    delay:    `${Math.random() * 4}s`,
    duration: `${3 + Math.random() * 3}s`,
    bottom:   `${Math.random() * 30}%`,
  }));

  return (
    <div className="regsuccess-wrapper">

      {/* Background particle canvas */}
      <canvas ref={canvasRef} className="regsuccess-canvas" />

      {/* Floating sparkles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="regsuccess-sparkle"
          style={{
            width:             s.size,
            height:            s.size,
            left:              s.left,
            bottom:            s.bottom,
            animationDelay:    s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}

      {/* ── NAVBAR ── */}
      <nav className="regsuccess-navbar">
        <a href="#" className="regsuccess-nav-logo">
          <PTagLogo size={44} />
          <div className="regsuccess-nav-logo-text">
            <span className="ptag-bold">P</span>
            <span className="ptag-thin">Tag</span>
          </div>
        </a>
        <div className="regsuccess-nav-user">
          {user?.name && <span>{user.name}</span>}
          <div className="regsuccess-nav-avatar">
            {user?.name?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <span className="regsuccess-nav-chevron">▾</span>
        </div>
      </nav>

      {/* ── CARD ── */}
      <div className="regsuccess-body">
        <div className="regsuccess-card">

          <p className="regsuccess-status">Status: Successful</p>

          {/* Animated checkmark */}
          <div className="regsuccess-check-wrap">
            <div className="regsuccess-ripple" />
            <div className="regsuccess-ripple" />
            <div className="regsuccess-check-circle">
              <svg className="regsuccess-checkmark" viewBox="0 0 36 36">
                <polyline points="6,18 14,26 30,10" />
              </svg>
            </div>
          </div>

          <h1 className="regsuccess-title">
            Registration<br />Successful
          </h1>

          <p className="regsuccess-subtitle">
            Your FASTag account has been created successfully.
          </p>

          <Link to="/userLogin" className="regsuccess-btn">
            Go to Login
          </Link>

        </div>
      </div>

    </div>
  );
};

export default RegistrationSuccess;