import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ListTodo, Calendar, Mail, Bell, Search, Star, Trash2, CheckCircle2, Circle, Flag, Plus, X, Edit3, ChevronDown, LogOut, User, Clock } from "lucide-react";
import { ShinyText } from "../ui/shiny-text";
import { ThemeToggle } from "../ui/theme-toggle";
// TiltedCard removed — using custom StatsOverviewCard instead
import { useAuth } from "../../context/AuthContext";
import { useTask } from "../../context/TaskContext";
import { useTheme } from "../../context/ThemeContext";
import { signOutUser, updateUserProfile } from "../../lib/firebase";
import { formatDate } from "../../lib/utils";

// ─── NAV ITEMS ────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/app/dashboard" },
  { icon: ListTodo, label: "My Tasks", to: "/app/tasks" },
  { icon: Calendar, label: "Calendar", to: "/app/calendar" },
  { icon: Mail, label: "Mail", to: "/app/mail" },
  { icon: Bell, label: "Notifications", to: "/app/notifications" },
];

// ─── CREATE TASK MODAL ────────────────────────────────────
function CreateTaskModal({ onClose }) {
  const { addTask } = useTask();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", priority: "medium", important: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    
    // Mandatory Due Date check
    if (!form.dueDate) {
      setError("Please select a valid date and time.");
      return;
    }

    // 4-digit Year check
    const year = form.dueDate.split("-")[0];
    if (year.length !== 4) {
      setError("Please enter a valid 4-digit year.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await addTask({
        ...form,
        dueDate: new Date(form.dueDate),
      });
      onClose();
      // Force navigation to dashboard immediately
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("Failed to create task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Create New Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"><X size={18} style={{ color: "var(--text-muted)" }} /></button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Task Title *</label>
            <input className="app-input" placeholder="e.g., Complete project report" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Description</label>
            <textarea className="app-input resize-none" rows={3} placeholder="Add details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Due Date *</label>
              <input type="datetime-local" className="app-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Priority</label>
              <select className="app-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.important} onChange={(e) => setForm({ ...form, important: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: "var(--accent)" }} />
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Mark as important</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg text-sm font-medium cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>Cancel</button>
            <motion.button type="submit" disabled={loading} className="flex-1 h-10 rounded-lg text-sm font-semibold text-white cursor-pointer transition-all relative overflow-hidden group" style={{ background: "linear-gradient(135deg, var(--accent), #1E4298)" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">{loading ? "Creating..." : "Create Task"}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── USER PROFILE MODAL ───────────────────────────────────
function UserProfileModal({ onClose }) {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ displayName: profile?.displayName || user?.displayName || "", jobTitle: profile?.jobTitle || "", bio: profile?.bio || "", status: profile?.status || "online" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserProfile(user.uid, form);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const statusColors = { online: "#10b981", away: "#f59e0b", offline: "#94a3b8" };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>My Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"><X size={18} style={{ color: "var(--text-muted)" }} /></button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold relative" style={{ background: "linear-gradient(135deg, var(--accent), #1E4298)", color: "white" }}>
              {(form.displayName || user?.email || "?")[0].toUpperCase()}
              <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2" style={{ background: statusColors[form.status], borderColor: "var(--bg-card)" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{form.displayName || user?.email}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
            </div>
          </div>
          {[{ label: "Display Name", key: "displayName", placeholder: "Your name" }, { label: "Job Title", key: "jobTitle", placeholder: "e.g., Software Engineer" }, { label: "Bio", key: "bio", placeholder: "Tell us about yourself..." }].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
              {key === "bio"
                ? <textarea className="app-input resize-none" rows={2} placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
                : <input className="app-input" placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              }
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Status</label>
            <select className="app-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="online">🟢 Online</option>
              <option value="away">🟡 Away</option>
              <option value="offline">⚪ Offline</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 h-10 rounded-lg text-sm cursor-pointer transition-all hover:opacity-80" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-lg text-sm font-semibold text-white cursor-pointer relative overflow-hidden group" style={{ background: saved ? "#10b981" : "linear-gradient(135deg, var(--accent), #1E4298)" }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">{saving ? "Saving..." : saved ? "Saved! ✓" : "Save Changes"}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── GEMINI STAR ICON ─────────────────────────────────────
function GeminiStar({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2 C12 2 12.8 8.2 15.5 10.5 C18.2 12.8 24 12 24 12 C24 12 18.2 11.2 15.5 13.5 C12.8 15.8 12 22 12 22 C12 22 11.2 15.8 8.5 13.5 C5.8 11.2 0 12 0 12 C0 12 5.8 12.8 8.5 10.5 C11.2 8.2 12 2 12 2 Z"
        fill="white"
      />
    </svg>
  );
}

// ─── ANIMATED STATS CARD ──────────────────────────────────
function StatsOverviewCard({ total, completed, pending, important }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl select-none"
      style={{
        background: "linear-gradient(135deg, #1a2a6c 0%, #2a3fb5 55%, #4959D0 100%)",
        border: "1px solid rgba(73,89,208,0.45)",
        boxShadow: "0 8px 28px rgba(73,89,208,0.28), inset 0 1px 0 rgba(255,255,255,0.12)",
        padding: "16px 18px",
        minHeight: "120px",
      }}
      whileHover={{ scale: 1.02, boxShadow: "0 12px 40px rgba(73,89,208,0.5)" }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.11) 50%, transparent 60%)" }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
      />
      {/* Sparkle dots */}
      {[{ l: "14%", t: "16%", s: 3 }, { l: "78%", t: "12%", s: 2 }, { l: "68%", t: "70%", s: 3 }, { l: "22%", t: "74%", s: 2 }].map((sp, i) => (
        <motion.div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ width: sp.s, height: sp.s, left: sp.l, top: sp.t }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.5, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
        />
      ))}
      <p className="text-[10px] uppercase tracking-widest font-semibold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Overview</p>
      <div className="flex items-end justify-between">
        <div>
          <p style={{ color: "rgba(255,255,255,0.58)", fontSize: "11px", marginBottom: "2px" }}>Total Tasks</p>
          <motion.p className="text-white font-bold" style={{ fontSize: "34px", lineHeight: 1 }}
            key={total} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >{total}</motion.p>
        </div>
        <div className="text-right" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={{ color: "#6ee7b7", fontSize: "11px", fontWeight: 600 }}>✓ {completed} done</p>
          <p style={{ color: "#fca5a5", fontSize: "11px", fontWeight: 600 }}>◷ {pending} pending</p>
          {important > 0 && <p style={{ color: "#fde68a", fontSize: "11px", fontWeight: 600 }}>⭐ {important} starred</p>}
        </div>
      </div>
    </motion.div>
  );
}

// ─── LEFT SIDEBAR ─────────────────────────────────────────
function LeftSidebar({ onCreateTask }) {
  const { user, profile } = useAuth();
  const { filteredTasks, completedTasks, pendingTasks, importantTasks, searchQuery, setSearchQuery } = useTask();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const statusColors = { online: "#10b981", away: "#f59e0b", offline: "#94a3b8" };
  const status = profile?.status || "online";
  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOutUser();
    navigate("/login");
  };

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border)",
        padding: "20px 14px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* ── User Profile ── */}
      <motion.div
        onClick={() => setShowProfile(true)}
        whileHover={{ scale: 1.01 }}
        className="cursor-pointer rounded-2xl flex items-center gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "12px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
      >
        <div className="relative flex-shrink-0 flex items-center justify-center font-bold rounded-full"
          style={{ width: 40, height: 40, background: "linear-gradient(135deg, #4959D0, #6366f1)", color: "white", fontSize: "16px" }}
        >
          {displayName[0].toUpperCase()}
          <div className="absolute bottom-0 right-0 rounded-full border-2"
            style={{ width: 11, height: 11, background: statusColors[status], borderColor: "var(--bg-card)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{displayName}</p>
          <p className="text-xs capitalize" style={{ color: statusColors[status] }}>{status}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
          className="p-1.5 rounded-lg cursor-pointer transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </motion.div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
        <input
          className="w-full rounded-xl text-sm outline-none"
          style={{
            background: "var(--bg-secondary)",
            border: "1.5px solid var(--border)",
            color: "var(--text-primary)",
            padding: "9px 12px 9px 34px",
            height: "40px",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#4959D0"; e.target.style.boxShadow = "0 0 0 3px rgba(73,89,208,0.15)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
          placeholder="Search tasks\u2026"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Navigation ── */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
          const isNotif = label === "Notifications";
          const overdueCount = pendingTasks.filter(t => {
            if (!t.dueDate) return false;
            const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
            return d < new Date();
          }).length;
          
          const upcomingCount = pendingTasks.filter(t => {
            if (!t.dueDate) return false;
            const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
            const diff = d - new Date();
            return diff > 0 && diff < 48 * 60 * 60 * 1000;
          }).length;

          const showDot = isNotif && (overdueCount + upcomingCount > 0);

          return (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <div className="relative flex items-center justify-center">
                <Icon size={17} />
                {showDot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-sidebar)] animate-pulse" />
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── Overview Stats Card ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p className="text-[10px] uppercase tracking-widest font-semibold px-1" style={{ color: "var(--text-muted)" }}>Overview</p>
        <StatsOverviewCard
          total={filteredTasks.length}
          completed={completedTasks.length}
          pending={pendingTasks.length}
          important={importantTasks.length}
        />
      </div>

      {/* ── Gemini-star Create Task FAB ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", paddingTop: "4px", paddingBottom: "6px" }}>
        <motion.button
          onClick={onCreateTask}
          className="relative flex items-center justify-center rounded-full cursor-pointer overflow-hidden"
          style={{
            width: 62,
            height: 62,
            background: "linear-gradient(135deg, #3a47b8 0%, #4959D0 55%, #6473e8 100%)",
            boxShadow: "0 4px 24px rgba(73,89,208,0.5)",
            border: "2px solid rgba(255,255,255,0.18)",
          }}
          whileHover={{ scale: 1.12, boxShadow: "0 8px 36px rgba(73,89,208,0.75)" }}
          whileTap={{ scale: 0.94 }}
          animate={{ boxShadow: ["0 4px 20px rgba(73,89,208,0.45)", "0 4px 36px rgba(73,89,208,0.8)", "0 4px 20px rgba(73,89,208,0.45)"] }}
          transition={{ boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
        >
          {/* Rotating shimmer ring */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)" }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          {/* Shine sweep */}
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 50%, transparent 70%)" }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
          />
          <GeminiStar size={26} />
        </motion.button>
        <p className="text-xs font-semibold text-center" style={{ color: "var(--text-secondary)", letterSpacing: "0.2px" }}>Create New Task</p>
      </div>

      {/* Profile modal */}
      <AnimatePresence>
        {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── RIGHT SIDEBAR ────────────────────────────────────────
function RightSidebar() {
  const { importantTasks, completedTasks, todayTasks } = useTask();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const pendingToday = todayTasks.filter((t) => !t.completed);
  const doneToday = todayTasks.filter((t) => t.completed);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto" style={{ background: "var(--bg-sidebar)", borderLeft: "1px solid var(--border)" }}>
      {/* Date */}
      <div className="app-card space-y-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>Today</p>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{today}</p>
      </div>

      {/* Important/High Priority */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Flag size={13} style={{ color: "#ef4444" }} />
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>Priority Tasks</p>
        </div>
        {importantTasks.slice(0, 5).length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No urgent tasks! 🎉</p>
        ) : (
          importantTasks.slice(0, 5).map((task) => (
            <motion.div key={task.id} className="app-card py-3 px-3 gap-2 flex items-start" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Flag size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                {task.dueDate && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{formatDate(task.dueDate)}</p>}
              </div>
              <span className={`badge-${task.priority || "medium"}`}>{task.priority || "med"}</span>
            </motion.div>
          ))
        )}
      </div>

      {/* Today's Deadlines */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Clock size={13} style={{ color: "var(--accent)" }} />
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>Today's Tasks</p>
        </div>
        {pendingToday.slice(0, 4).length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>All clear for today!</p>
        ) : (
          pendingToday.slice(0, 4).map((task) => (
            <motion.div key={task.id} className="app-card py-3 px-3 flex items-center gap-2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Circle size={13} style={{ color: "var(--accent)" }} />
              <p className="text-xs truncate flex-1" style={{ color: "var(--text-primary)" }}>{task.title}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Completed Today */}
      {doneToday.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 size={13} style={{ color: "#10b981" }} />
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>Done Today</p>
          </div>
          {doneToday.slice(0, 4).map((task) => (
            <motion.div key={task.id} className="app-card py-3 px-3 flex items-center gap-2 opacity-60" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }}>
              <CheckCircle2 size={13} style={{ color: "#10b981" }} />
              <p className="text-xs truncate flex-1 line-through" style={{ color: "var(--text-muted)" }}>{task.title}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP LAYOUT ──────────────────────────────────────
export default function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden theme-transition" style={{ background: "var(--bg-primary)" }}>
      {/* TOP BAR */}
      <header className="flex items-center justify-between px-6 h-14 flex-shrink-0" style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>
        <ShinyText text="Task Manager" size="text-xl" />
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      {/* THREE COLUMNS */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left */}
        <div className="w-64 flex-shrink-0 overflow-hidden">
          <LeftSidebar onCreateTask={() => setShowCreateTask(true)} />
        </div>

        {/* Center */}
        <main className="flex-1 overflow-y-auto px-16 py-14 custom-scrollbar" style={{ background: "var(--bg-primary)" }}>
          <div className="max-w-7xl mx-auto" style={{ padding: "40px 48px 80px" }}>
            <Outlet context={{ onCreateTask: () => setShowCreateTask(true) }} />
          </div>
        </main>

        {/* Right */}
        <div className="w-72 flex-shrink-0 overflow-hidden">
          <RightSidebar />
        </div>
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreateTask && <CreateTaskModal onClose={() => setShowCreateTask(false)} />}
      </AnimatePresence>
    </div>
  );
}
