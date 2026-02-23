import React, { useState } from "react";
import { motion } from "framer-motion";
import Calendar from "react-calendar";
import { CheckCircle2, Circle, Clock, Star } from "lucide-react";
import { useTask } from "../context/TaskContext";
import { formatDate, formatTime } from "../lib/utils";

export default function CalendarPage() {
  const { filteredTasks, toggleComplete } = useTask();
  const [selected, setSelected] = useState(new Date());

  const tasksForDate = (date) =>
    filteredTasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
      return d.toDateString() === date.toDateString();
    });

  const selectedDateTasks = tasksForDate(selected);

  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    const tasks = tasksForDate(date);
    if (!tasks.length) return null;
    const hasPending = tasks.some((t) => !t.completed);
    const hasImportant = tasks.some((t) => t.important);
    return (
      <div className="flex justify-center gap-0.5 mt-0.5">
        {hasPending && <div className="w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />}
        {hasImportant && <div className="w-1 h-1 rounded-full bg-red-400" />}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Calendar</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Click any date to see tasks due that day.</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Calendar */}
        <motion.div className="app-card" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Calendar
            onChange={setSelected}
            value={selected}
            tileContent={tileContent}
            className="react-calendar"
          />
          <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Pending tasks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Important</span>
            </div>
          </div>
        </motion.div>

        {/* Tasks for selected date */}
        <motion.div className="app-card space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </h2>
          {selectedDateTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-3xl">📅</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tasks due this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateTasks.map((task, i) => (
                <motion.div key={task.id} className="app-card flex items-start gap-3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <button onClick={() => toggleComplete(task.id, task.completed)} className="cursor-pointer mt-0.5 flex-shrink-0">
                    {task.completed ? <CheckCircle2 size={16} style={{ color: "#10b981" }} /> : <Circle size={16} style={{ color: "var(--accent)" }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? "line-through opacity-50" : ""}`} style={{ color: "var(--text-primary)" }}>{task.title}</p>
                    {task.description && <p className="text-xs opacity-60 line-clamp-1 mt-0.5" style={{ color: "var(--text-secondary)" }}>{task.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge-${task.priority || "medium"}`}>{task.priority || "med"}</span>
                      {task.important && <Star size={11} fill="#ef4444" color="#ef4444" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
