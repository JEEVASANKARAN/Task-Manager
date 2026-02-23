import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from "lucide-react";
import { EtherealShadow } from "../components/ui/ethereal-shadow";
import { ParticleTextEffect } from "../components/ui/particle-text-effect";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { signUpWithEmail, signInWithGoogle, signInWithGithub } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp, db } from "../lib/firebase";

function AuthInput({ label, type = "text", value, onChange, onFocus, onBlur, icon, placeholder }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const actualType = type === "password" ? (showPass ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && <label className="block mb-1.5 text-xs font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</label>}
      <div className="relative"
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20" style={{ color: "var(--color-text-secondary)" }}>{icon}</div>}
        <input
          type={actualType} value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur} placeholder={placeholder}
          className="peer relative z-10 w-full h-12 rounded-lg border-2 bg-[var(--color-surface)] font-light outline-none transition-all duration-200 placeholder:text-[var(--color-text-secondary)] text-[var(--color-text-primary)] text-sm"
          style={{ borderColor: "var(--color-border)", paddingLeft: icon ? "2.5rem" : "1rem", paddingRight: type === "password" ? "2.5rem" : "1rem" }}
          onFocusCapture={(e) => { e.target.style.borderColor = "#3E7DFB"; }}
          onBlurCapture={(e) => { e.target.style.borderColor = "var(--color-border)"; }}
        />
        {hovering && (
          <>
            <div className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-lg overflow-hidden"
              style={{ background: `radial-gradient(30px circle at ${mousePos.x}px 0px, var(--color-text-primary) 0%, transparent 70%)` }} />
            <div className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-lg overflow-hidden"
              style={{ background: `radial-gradient(30px circle at ${mousePos.x}px 2px, var(--color-text-primary) 0%, transparent 70%)` }} />
          </>
        )}
        {type === "password" && (
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const particleWords = isTyping ? ["make sure\nno one sees it"] : ["CREATE YOUR\nACCOUNT"];

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.message?.replace("Firebase: ", "").replace(/\(auth.*\)/, "").trim() || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, jobTitle: "", bio: "", status: "online", createdAt: serverTimestamp() });
      }
      navigate("/app/dashboard");
    } catch (err) {
      setError("Google sign-in failed.");
    } finally { setLoading(false); }
  };

  const handleGithub = async () => {
    setLoading(true);
    try {
      const result = await signInWithGithub();
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, jobTitle: "", bio: "", status: "online", createdAt: serverTimestamp() });
      }
      navigate("/app/dashboard");
    } catch (err) {
      setError("GitHub sign-in failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0D0D10]">
      <div className="absolute inset-0">
        <EtherealShadow color="rgba(62,125,251,0.7)" animation={{ scale: 85, speed: 55 }} noise={{ opacity: 0.2, scale: 1.2 }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(62,125,251,0.1) 0%, transparent 70%)" }} />
      </div>
      <div className="absolute top-6 right-6 z-50"><ThemeToggle /></div>
      <div className="relative z-10 h-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl flex h-[600px] rounded-2xl overflow-hidden"
          style={{ background: "rgba(16,18,20,0.92)", border: "1px solid rgba(62,125,251,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}
        >
          {/* Right: Particle (on signup, particle is on left visually) */}
          <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center bg-black">
            <ParticleTextEffect words={particleWords} key={particleWords.join(",")} />
          </div>
          {/* Right: Form */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-12 relative overflow-hidden">
            <div className="relative z-10 space-y-5">
              <div className="space-y-1">
                <motion.h1 className="text-3xl font-extrabold" style={{ color: "var(--color-heading)" }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>Create Account</motion.h1>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Join Task Manager and get organized.</p>
              </div>
              {/* Social */}
              <div className="flex gap-3">
                {[{ icon: <GoogleIcon />, label: "Google", fn: handleGoogle }, { icon: <GithubIcon />, label: "GitHub", fn: handleGithub }].map(({ icon, label, fn }) => (
                  <motion.button key={label} type="button" onClick={fn}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
                    whileHover={{ scale: 1.03, borderColor: "rgba(62,125,251,0.5)", boxShadow: "0 0 12px rgba(62,125,251,0.15)" }}
                    whileTap={{ scale: 0.97 }}
                  >{icon} {label}</motion.button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>or with email</span>
                <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
              </div>
              <form onSubmit={handleSignup} className="space-y-3">
                <AuthInput placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setIsTyping(true)} onBlur={() => { if (!email && !password) setIsTyping(false); }} icon={<User size={16} />} />
                <AuthInput type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setIsTyping(true)} onBlur={() => { if (!name && !password) setIsTyping(false); }} icon={<Mail size={16} />} />
                <AuthInput type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsTyping(true)} icon={<Lock size={16} />} />
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20">
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.button
                  type="submit" disabled={loading}
                  className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-all duration-300 relative overflow-hidden group cursor-pointer disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, #3E7DFB, #1E4298)" }}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(62,125,251,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10">{loading ? "Creating account..." : "Create Account"}</span>
                </motion.button>
                <p className="text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold hover:underline" style={{ color: "#3E7DFB" }}>Sign in</Link>
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
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

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
