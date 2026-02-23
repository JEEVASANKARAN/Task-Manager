import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Clock, CheckCircle2, AlertTriangle, Info, Star, Trash2 } from "lucide-react";
import { useTask } from "../context/TaskContext";
import { formatDate } from "../lib/utils";

function NotifCard({ icon: Icon, iconColor, bg, title, desc, time, onDismiss }) {
  return (
    <motion.div className="app-card flex items-start gap-3 relative group" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout>
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
        <p className="text-[10px] mt-1.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{time}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer" title="Dismiss">
          <Trash2 size={13} style={{ color: "var(--text-muted)" }} />
        </button>
      )}
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { importantTasks, filteredTasks, completedTasks } = useTask();
  const [dismissed, setDismissed] = useState([]);

  const overdueTasksList = filteredTasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
    return d < new Date();
  });

  const upcomingTasks = filteredTasks.filter((t) => {
    if (!t.dueDate || t.completed) return false;
    const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
    const diff = d - new Date();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
  });

  const systemNotifs = [
    { id: "sys1", icon: Info, iconColor: "var(--accent)", bg: "var(--accent-light)", title: "Task Manager Pro", desc: "Welcome to Task Manager! Create your first task to get started.", time: "Just now" },
    ...(completedTasks.length > 0 ? [{ id: "sys2", icon: CheckCircle2, iconColor: "#10b981", bg: "rgba(16,185,129,0.1)", title: `${completedTasks.length} tasks completed!`, desc: "Great work keeping up with your tasks. Keep the momentum going!", time: "Today" }] : []),
  ].filter((n) => !dismissed.includes(n.id));

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2">
          <Bell size={22} style={{ color: "var(--accent)" }} />
          <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Notifications</h1>
          {(overdueTasksList.length + upcomingTasks.length) > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#ef4444" }}>
              {overdueTasksList.length + upcomingTasks.length}
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Stay on top of your deadlines and updates.</p>
      </motion.div>

      {/* Overdue */}
      {overdueTasksList.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#ef4444" }}>
            <AlertTriangle size={14} /> Overdue ({overdueTasksList.length})
          </h2>
          {overdueTasksList.map((task) => (
            <NotifCard key={task.id}
              icon={AlertTriangle} iconColor="#ef4444" bg="rgba(239,68,68,0.1)"
              title={`⚠️ Overdue: ${task.title}`}
              desc={`Was due ${formatDate(task.dueDate)}. Complete it as soon as possible.`}
              time={formatDate(task.dueDate)}
            />
          ))}
        </div>
      )}

      {/* Upcoming (within 48h) */}
      {upcomingTasks.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#f59e0b" }}>
            <Clock size={14} /> Due Soon ({upcomingTasks.length})
          </h2>
          {upcomingTasks.map((task) => (
            <NotifCard key={task.id}
              icon={Clock} iconColor="#f59e0b" bg="rgba(245,158,11,0.1)"
              title={`📅 Due soon: ${task.title}`}
              desc={`This task is due ${formatDate(task.dueDate)}. Don't forget to complete it!`}
              time={formatDate(task.dueDate)}
            />
          ))}
        </div>
      )}

      {/* Important */}
      {importantTasks.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Star size={14} fill="currentColor" style={{ color: "#f59e0b" }} /> Important Tasks ({importantTasks.length})
          </h2>
          {importantTasks.slice(0, 4).map((task) => (
            <NotifCard key={task.id}
              icon={Star} iconColor="#f59e0b" bg="rgba(245,158,11,0.1)"
              title={task.title}
              desc={task.description || "Marked as important. Prioritize this task."}
              time={task.dueDate ? formatDate(task.dueDate) : "No due date"}
            />
          ))}
        </div>
      )}

      {/* System Notifications */}
      {systemNotifs.length > 0 && (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>System</h2>
          {systemNotifs.map((n) => (
            <NotifCard key={n.id} {...n} time={n.time} onDismiss={() => setDismissed((p) => [...p, n.id])} />
          ))}
        </div>
      )}

      {overdueTasksList.length === 0 && upcomingTasks.length === 0 && importantTasks.length === 0 && systemNotifs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell size={48} style={{ color: "var(--text-muted)" }} className="opacity-30" />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>All caught up! No notifications.</p>
        </div>
      )}
    </div>
  );
}
