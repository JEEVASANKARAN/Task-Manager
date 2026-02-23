import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, Star, BarChart2 } from "lucide-react";
import { useTask } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../lib/utils";

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      className="app-card flex items-center gap-5"
      style={{ padding: "1.25rem 1.5rem" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
      >
        <Icon size={24} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)", lineHeight: 1 }}>
          {value}
        </p>
        <p
          className="text-xs mt-2"
          style={{ color: "var(--text-muted)", fontWeight: 500, letterSpacing: "0.2px" }}
        >
          {label}
        </p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { filteredTasks, completedTasks, pendingTasks, importantTasks } = useTask();
  const { profile, user } = useAuth();
  const name = profile?.displayName || user?.displayName || "there";

  const recentTasks = [...filteredTasks].slice(0, 6);
  const completionRate = filteredTasks.length
    ? Math.round((completedTasks.length / filteredTasks.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-20 px-10 py-12 pb-24 min-h-screen">
      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1
          className="text-5xl font-extrabold tracking-tight mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Your Dashboard 👋
        </h1>
        <p
          className="text-xl opacity-80"
          style={{ color: "var(--text-muted)" }}
        >
          Welcome back, {name}. Here's your focused workspace overview.
        </p>
      </motion.div>

      {/* Stats Section */}
      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <StatCard icon={BarChart2} label="Total Tasks" value={filteredTasks.length} color="#3E7DFB" delay={0.05} />
          <StatCard icon={CheckCircle2} label="Completed" value={completedTasks.length} color="#10b981" delay={0.1} />
          <StatCard icon={Clock} label="Pending" value={pendingTasks.length} color="#f59e0b" delay={0.15} />
          <StatCard icon={Star} label="Important" value={importantTasks.length} color="#ef4444" delay={0.2} />
        </div>
      </section>

      {/* Progress Section */}
      <section className="mb-12">
        <motion.div
          className="app-card shadow-2xl p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-blue-500/10" style={{ color: "var(--accent)" }}>
                <TrendingUp size={28} />
              </div>
              <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                Overall Progress
              </span>
            </div>
            <span className="text-4xl font-extrabold" style={{ color: "var(--accent)" }}>
              {completionRate}%
            </span>
          </div>

          <div className="w-full h-5 rounded-full overflow-hidden mb-6" style={{ background: "var(--bg-secondary)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--accent), #6366f1)" }}
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          <p
            className="text-base opacity-70 font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            {completedTasks.length} of {filteredTasks.length} tasks completed
          </p>
        </motion.div>
      </section>

      {/* Recent Tasks Section */}
      <section className="pt-16 mb-12" style={{ borderTop: "2px solid var(--border)" }}>
        <h2
          className="text-2xl font-bold flex items-center gap-6 mb-10"
          style={{ color: "var(--text-secondary)" }}
        >
          <Clock size={28} /> Recent Tasks
        </h2>

        {recentTasks.length === 0 ? (
          <div className="app-card text-center py-24 bg-opacity-30">
            <p className="text-7xl mb-6">📋</p>
            <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              No tasks yet!
            </p>
            <p className="text-lg mt-4" style={{ color: "var(--text-muted)" }}>
              Create your first task to get started.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {recentTasks.map((task, i) => (
              <motion.div
                key={task.id}
                className="app-card flex items-center gap-8 p-10 hover:shadow-2xl transition-all"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 shadow-lg"
                  style={{
                    background: task.completed
                      ? "#10b981"
                      : task.priority === "high"
                      ? "#ef4444"
                      : task.priority === "medium"
                      ? "#f59e0b"
                      : "var(--accent)",
                  }}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xl font-bold truncate ${
                      task.completed ? "line-through opacity-50" : ""
                    }`}
                    style={{ color: "var(--text-primary)" }}
                  >
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p
                      className="text-base mt-2 font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  {task.important && (
                    <Star size={24} fill="#ef4444" style={{ color: "#ef4444" }} />
                  )}
                  <span className={`badge-${task.priority || "medium"} text-[14px] px-5 py-1 font-bold rounded-lg`}>
                    {task.priority || "med"}
                  </span>
                  {task.completed && (
                    <CheckCircle2 size={26} style={{ color: "#10b981" }} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Priority Breakdown Section */}
      {filteredTasks.length > 0 && (
        <section className="pt-16 mb-24" style={{ borderTop: "2px solid var(--border)" }}>
          <motion.div
            className="app-card p-12 shadow-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2
              className="text-2xl font-bold mb-10"
              style={{ color: "var(--text-secondary)" }}
            >
              Priority Breakdown
            </h2>

            <div className="flex flex-col gap-10">
              {[
                { label: "High", color: "#ef4444", key: "high" },
                { label: "Medium", color: "#f59e0b", key: "medium" },
                { label: "Low", color: "#10b981", key: "low" },
              ].map(({ label, color, key }) => {
                const count = filteredTasks.filter((t) => t.priority === key).length;
                const pct = filteredTasks.length
                  ? (count / filteredTasks.length) * 100
                  : 0;

                return (
                  <div key={key} className="flex flex-col gap-4">
                    <div
                      className="flex justify-between text-base"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="font-bold">{label}</span>
                      <span className="font-extrabold">{count} tasks</span>
                    </div>

                    <div
                      className="w-full h-4 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-secondary)" }}
                    >
                      <motion.div
                        className="h-full rounded-full shadow-inner"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>
      )}
    </div>
  );
}
