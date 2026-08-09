import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./RegistrationFailed.css";
import usePageTitle from '../usePageTitle';
import ptagLogo from '../assets/PTag.png';

const RegistrationFailed = () => {
  usePageTitle("Payment Failed");
  const canvasRef = useRef(null);

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

  return (
    <div className="regfailed-wrapper">

      <canvas ref={canvasRef} className="regfailed-canvas" />

      {/* Navbar */}
      <nav className="regfailed-navbar">
        <a href="#" className="regfailed-nav-logo">
          <img src={ptagLogo} alt="PTag Logo" className="regfailed-nav-logo-img" />
          <div className="regfailed-nav-logo-text">
            <span className="ptag-bold">P</span>
            <span className="ptag-thin">Tag</span>
          </div>
        </a>
      </nav>

      {/* Card */}
      <div className="regfailed-body">
        <div className="regfailed-card">

          <p className="regfailed-status">Status: Failed</p>

          {/* Animated X mark */}
          <div className="regfailed-icon-wrap">
            <div className="regfailed-ripple" />
            <div className="regfailed-ripple" />
            <div className="regfailed-icon-circle">
              <svg className="regfailed-xmark" viewBox="0 0 36 36">
                <line x1="10" y1="10" x2="26" y2="26" />
                <line x1="26" y1="10" x2="10" y2="26" />
              </svg>
            </div>
          </div>

          <h1 className="regfailed-title">
            Payment<br />Failed
          </h1>

          <p className="regfailed-subtitle">
            Your payment was not completed.<br />
            No amount has been deducted. Please try again.
          </p>

          <div className="regfailed-actions">
            <Link to="/register" className="regfailed-btn-primary">
              Try Again
            </Link>
            <Link to="/userLogin" className="regfailed-btn-secondary">
              Go to Login
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default RegistrationFailed;