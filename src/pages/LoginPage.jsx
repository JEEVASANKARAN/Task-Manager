import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Github, AlertCircle, CheckCircle } from "lucide-react";
import { EtherealShadow } from "../components/ui/ethereal-shadow";
import { ParticleTextEffect } from "../components/ui/particle-text-effect";
import { MetalButton } from "../components/ui/liquid-glass-button";
import { signInWithEmail, signInWithGoogle, signInWithGithub, sendPasswordReset } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "../lib/firebase";
import { db } from "../lib/firebase";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "../components/ui/theme-toggle";

// ──────────────────────────────────────────────────────────
// Particle words for each state
// ──────────────────────────────────────────────────────────
const WORDS_IDLE = ["TYPE IN YOUR\nCREDENTIALS"];
const WORDS_TYPING = ["make sure\nno one sees it"];
const WORDS_LOADING = ["SIGNING\nYOU IN..."];
const WORDS_SUCCESS = ["WELCOME\nBACK! ✓"];
const WORDS_ERROR = ["TRY\nAGAIN"];

// ──────────────────────────────────────────────────────────
// Input component with hover glow effect
// ──────────────────────────────────────────────────────────
function AuthInput({ label, type = "text", value, onChange, onFocus, onBlur, icon, placeholder, endIcon, onEndIconClick }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const actualType = type === "password" ? (showPass ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && <label className="block mb-1.5 text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</label>}
      <div
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20" style={{ color: "var(--color-text-secondary)" }}>
            {icon}
          </div>
        )}
        <input
          type={actualType}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className="peer relative z-10 w-full h-12 rounded-lg border-2 bg-[var(--color-surface)] px-4 font-light outline-none transition-all duration-200 placeholder:text-[var(--color-text-secondary)] placeholder:font-medium text-[var(--color-text-primary)] text-sm"
          style={{
            borderColor: "var(--color-border)",
            paddingLeft: icon ? "2.5rem" : "1rem",
            paddingRight: type === "password" ? "2.5rem" : "1rem",
          }}
          onFocusCapture={(e) => { e.target.style.borderColor = "#3E7DFB"; }}
          onBlurCapture={(e) => { e.target.style.borderColor = "var(--color-border)"; }}
        />
        {/* Hover glow borders */}
        {hovering && (
          <>
            <div className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-lg overflow-hidden"
              style={{ background: `radial-gradient(30px circle at ${mousePos.x}px 0px, var(--color-text-primary) 0%, transparent 70%)` }} />
            <div className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-lg overflow-hidden"
              style={{ background: `radial-gradient(30px circle at ${mousePos.x}px 2px, var(--color-text-primary) 0%, transparent 70%)` }} />
          </>
        )}
        {type === "password" && (
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 cursor-pointer"
            style={{ color: "var(--color-text-secondary)" }}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Lock icon animation
// ──────────────────────────────────────────────────────────
function LockIcon({ state }) {
  // state: idle | loading | success | error
  const color = state === "success" ? "#10b981" : state === "error" ? "#ef4444" : state === "loading" ? "#f59e0b" : "transparent";
  const visible = state !== "idle";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div key={state} className="flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <motion.div
            animate={state === "error" ? { x: [-4, 4, -4, 4, 0] } : state === "success" ? { scale: [1, 1.2, 1] } : { rotate: 360 }}
            transition={state === "loading" ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.4 }}
          >
            <Lock size={28} color={color} strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────────────────
// Main Login Page
// ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authState, setAuthState] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [activeInputs, setActiveInputs] = useState(0);

  const particleWords = authState === "loading" ? WORDS_LOADING
    : authState === "success" ? WORDS_SUCCESS
    : authState === "error" ? WORDS_ERROR
    : isTyping ? WORDS_TYPING
    : WORDS_IDLE;

  const handleFocus = () => setIsTyping(true);
  const handleBlur = () => { if (!email && !password) setIsTyping(false); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setAuthState("loading");
    try {
      await signInWithEmail(email, password);
      setAuthState("success");
      setTimeout(() => navigate("/app/dashboard"), 1200);
    } catch (err) {
      setAuthState("error");
      setError(err.message?.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim() || "Login failed");
      setTimeout(() => { setAuthState("idle"); }, 3000);
    }
  };

  const handleGoogle = async () => {
    setAuthState("loading");
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, email: user.email, displayName: user.displayName,
          photoURL: user.photoURL, jobTitle: "", bio: "", status: "online",
          createdAt: serverTimestamp(),
        });
      }
      setAuthState("success");
      setTimeout(() => navigate("/app/dashboard"), 1000);
    } catch (err) {
      setAuthState("error");
      setError("Google sign-in failed. Try again.");
      setTimeout(() => setAuthState("idle"), 3000);
    }
  };

  const handleGithub = async () => {
    setAuthState("loading");
    try {
      const result = await signInWithGithub();
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid, email: user.email, displayName: user.displayName,
          photoURL: user.photoURL, jobTitle: "", bio: "", status: "online",
          createdAt: serverTimestamp(),
        });
      }
      setAuthState("success");
      setTimeout(() => navigate("/app/dashboard"), 1000);
    } catch (err) {
      setAuthState("error");
      setError("GitHub sign-in failed. Check Firebase Console config.");
      setTimeout(() => setAuthState("idle"), 3000);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first."); return; }
    try {
      await sendPasswordReset(email);
      setForgotSent(true);
      setError("");
    } catch { setError("Could not send reset email."); }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0D0D10]">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <EtherealShadow
          color="rgba(30,66,152,0.85)"
          animation={{ scale: 90, speed: 60 }}
          noise={{ opacity: 0.25, scale: 1.2 }}
        />
        {/* Extra glow overlay */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(62,125,251,0.12) 0%, transparent 70%)",
        }} />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl flex rounded-2xl overflow-hidden"
          style={{
            background: "rgba(16,18,20,0.9)",
            border: "1px solid rgba(62,125,251,0.2)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Left: Form */}
          <div
            className="w-full lg:w-[55%] flex flex-col justify-center relative"
            style={{ padding: "3rem 3.5rem" }}
          >
            {/* Mouse follow glow */}
            <GlowFollower />

            <div className="relative z-10 space-y-5" style={{ maxWidth: "420px", width: "100%", margin: "0 auto" }}>
              {/* Header */}
              <div className="space-y-1">
                <motion.h1
                  className="text-3xl font-extrabold"
                  style={{ color: "var(--color-heading)" }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Sign In
                </motion.h1>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Welcome back! Please enter your details.
                </p>
              </div>

              {/* Social buttons */}
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <SocialButton icon={<GoogleIcon />} label="Google" onClick={handleGoogle} />
                <SocialButton icon={<Github size={18} />} label="GitHub" onClick={handleGithub} />
              </motion.div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>or continue with email</span>
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <AuthInput
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  icon={<Mail size={16} />}
                />
                <AuthInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  icon={<Lock size={16} />}
                />

                {/* Forgot / error / success */}
                <div className="flex items-center justify-between">
                  <button type="button" onClick={handleForgotPassword}
                    className="text-xs hover:underline transition-all cursor-pointer"
                    style={{ color: "var(--color-text-secondary)" }}>
                    Forgot password?
                  </button>
                  {forgotSent && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={12} /> Reset email sent!
                    </motion.span>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sign In button with lock */}
                <div className="flex items-center gap-3">
                  <motion.button
                    type="submit"
                    disabled={authState === "loading" || authState === "success"}
                    className="flex-1 h-11 rounded-lg font-semibold text-sm text-white transition-all duration-300 relative overflow-hidden group cursor-pointer disabled:opacity-70"
                    style={{ background: authState === "success" ? "#10b981" : authState === "error" ? "#ef4444" : "linear-gradient(135deg, #3E7DFB, #1E4298)" }}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(62,125,251,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    <span className="relative z-10">
                      {authState === "loading" ? "Signing in..." : authState === "success" ? "Welcome!" : authState === "error" ? "Failed — Try Again" : "Sign In"}
                    </span>
                  </motion.button>
                  <LockIcon state={authState} />
                </div>

                <p className="text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Don't have an account?{" "}
                  <Link to="/signup" className="font-semibold hover:underline" style={{ color: "#3E7DFB" }}>
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Right: Particle Effect */}
          <div className="hidden lg:flex w-[45%] flex-shrink-0 relative overflow-hidden items-center justify-center bg-black" style={{ minHeight: "580px" }}>
            <ParticleTextEffect words={particleWords} key={particleWords.join(",")} />
            {/* Bottom label */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>
                {authState !== "idle" ? "" : "Right-click + drag to scatter particles"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
function GlowFollower() {
  const [pos, setPos] = useState({ x: 200, y: 200 });
  const [show, setShow] = useState(false);
  // pointer-events:none on both wrapper and inner ensures it never intercepts clicks/input
  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: "none", zIndex: 0 }}
    >
      <div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(62,125,251,0.07) 0%, transparent 70%)",
          transform: `translate(${pos.x - 250}px, ${pos.y - 250}px)`,
          opacity: show ? 1 : 0,
          transition: "transform 0.15s ease-out, opacity 0.3s ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function SocialButton({ icon, label, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer group"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
      whileHover={{ scale: 1.03, borderColor: "rgba(62,125,251,0.5)", boxShadow: "0 0 12px rgba(62,125,251,0.15)" }}
      whileTap={{ scale: 0.97 }}
    >
      {icon} {label}
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
