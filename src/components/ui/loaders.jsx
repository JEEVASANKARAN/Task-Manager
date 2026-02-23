import React, { useState, useEffect, useMemo } from "react";

// ─── NestedSquaresLoader ───────────────────────────────────
export function NestedSquaresLoader({
  onComplete,
  duration = 0,
  message = "Loading",
  showGreeting = false,
  userName = "",
}) {
  const [dots, setDots] = useState(".");

  // 1. Dots animation
  useEffect(() => {
    const iv = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 420);
    return () => clearInterval(iv);
  }, []);

  // 2. Completion Logic with Safety Timeout
  useEffect(() => {
    if (!onComplete) return;

    // Safety timeout: Always complete after 10 seconds max
    const safetyTimeout = setTimeout(() => {
      console.warn("Loader safety timeout triggered");
      onComplete();
    }, 10000);

    // Explicit duration completion
    let durationTimeout;
    if (duration > 0) {
      durationTimeout = setTimeout(() => {
        onComplete();
      }, duration);
    }

    return () => {
      clearTimeout(safetyTimeout);
      if (durationTimeout) clearTimeout(durationTimeout);
    };
  }, [onComplete, duration]);

  // 3. Squares properties
  const squareCount = 6;
  const squares = useMemo(() => {
    return Array.from({ length: squareCount }, (_, i) => {
      const index = i + 1;
      const t = index / squareCount;
      // Blue/Indigo palette
      const r = Math.round(30 + (62 - 30) * t);
      const g = Math.round(66 + (125 - 66) * t);
      const b = Math.round(152 + (251 - 152) * t);
      return {
        id: index,
        size: index * 14 + 10, // Base size + growth
        color: `rgb(${r},${g},${b})`,
        delay: i * 0.1,
      };
    });
  }, [squareCount]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at center, #111118 0%, #08080A 100%)",
        overflow: "hidden",
        zIndex: 9999,
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ── Background Star Particles ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.6 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "2px",
              height: "2px",
              background: "#3E7DFB",
              borderRadius: "50%",
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 13 + 7) % 100}%`,
              animation: "ns-twinkle 4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* ── Center Animation ── */}
      <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyItems: "center" }}>
        {squares.map((square) => (
          <div
            key={square.id}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: `${square.size}px`,
              height: `${square.size}px`,
              border: `1.5px solid ${square.color}`,
              boxShadow: `0 0 10px ${square.color}40, inset 0 0 4px ${square.color}20`,
              borderRadius: "4px",
              transform: "translate(-50%, -50%)",
              animation: "ns-morph 4s ease-in-out infinite",
              animationDelay: `${square.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── Message Area ── */}
      <div style={{ marginTop: "48px", textAlign: "center", animation: "ns-float 4s ease-in-out infinite" }}>
        {showGreeting && userName && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginBottom: "8px", fontWeight: 500 }}>
            Welcome back, <span style={{ color: "#4959D0", fontWeight: 700 }}>{userName}</span>
          </p>
        )}
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "11px", fontWeight: 700, letterSpacing: "5px", textTransform: "uppercase", fontFamily: "monospace" }}>
          {message}{dots}
        </p>
      </div>

      {/* ── Keyframes ── */}
      <style>
        {`
          @keyframes ns-twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.4); }
          }
          @keyframes ns-morph {
            0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.4; }
            50% { transform: translate(-50%, -50%) scale(1.1) rotate(90deg); opacity: 0.9; }
          }
          @keyframes ns-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
}

// ── Legacy Aliases ──────────────────────────────────────────
export function MorphingSquareLoader({ message = "Loading" }) {
  return <NestedSquaresLoader message={message} />;
}

export function Preloader({ userName, onComplete }) {
  return (
    <NestedSquaresLoader
      message="Fetching your workspace"
      showGreeting={true}
      userName={userName}
      duration={3000}
      onComplete={onComplete}
    />
  );
}
