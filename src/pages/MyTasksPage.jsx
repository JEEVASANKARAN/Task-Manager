import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Star, Trash2, Edit3, X, Flag, Clock, Plus, ChevronDown } from "lucide-react";
import { useTask } from "../context/TaskContext";
import { useOutletContext } from "react-router-dom";
import { formatDate } from "../lib/utils";

function TaskDetailPanel({ task, onClose, onEdit, onDelete, onToggleComplete, onToggleImportant }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ title: task.title, description: task.description || "", dueDate: "", priority: task.priority || "medium" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onEdit(task.id, form);
    setSaving(false);
    setEditMode(false);
  };

  return (
    <motion.div className="h-full flex flex-col p-6 overflow-y-auto" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          {editMode ? (
            <input className="app-input text-lg font-bold w-full" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus />
          ) : (
            <h2 className={`text-xl font-bold ${task.completed ? "line-through opacity-50" : ""}`} style={{ color: "var(--text-primary)" }}>{task.title}</h2>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge-${task.priority || "medium"}`}>{task.priority || "medium"}</span>
            {task.important && <span className="flex items-center gap-1 text-xs text-red-400"><Star size={11} fill="currentColor" /> Important</span>}
            {task.completed && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 size={11} /> Completed</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          {!editMode && <button onClick={() => setEditMode(true)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"><Edit3 size={15} style={{ color: "var(--text-muted)" }} /></button>}
          <button onClick={() => onToggleImportant(task.id, task.important)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors">
            <Star size={15} fill={task.important ? "#ef4444" : "none"} style={{ color: task.important ? "#ef4444" : "var(--text-muted)" }} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"><Trash2 size={15} style={{ color: "#ef4444" }} /></button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"><X size={15} style={{ color: "var(--text-muted)" }} /></button>
        </div>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Due: {formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* Description */}
      <div className="flex-1 mb-4">
        <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Notes & Description</p>
        {editMode ? (
          <textarea className="app-input w-full resize-none text-sm" rows={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add notes, details, links..." />
        ) : (
          <div className="p-4 rounded-lg min-h-[120px] text-sm leading-relaxed" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            {task.description || <span className="italic opacity-50">No description. Click edit to add details.</span>}
          </div>
        )}
      </div>

      {/* Edit mode controls */}
      {editMode && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Priority</label>
            <select className="app-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditMode(false)} className="flex-1 h-10 rounded-lg text-sm cursor-pointer" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
            <motion.button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-lg text-sm text-white cursor-pointer font-semibold" style={{ background: "linear-gradient(135deg, var(--accent), #1E4298)" }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </div>
        </div>
      )}

      {/* Mark complete */}
      <motion.button
        onClick={() => onToggleComplete(task.id, task.completed)}
        className="w-full h-12 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group shadow-lg shadow-blue-500/10"
        style={{ 
          background: "linear-gradient(135deg, var(--accent), #1E4298)",
          color: "white" 
        }}
        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.3)" }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {task.completed ? (
          <><CheckCircle2 size={18} className="text-emerald-300" /> Mark as Incomplete</>
        ) : (
          <><Circle size={18} /> Mark as Complete</>
        )}
      </motion.button>
    </motion.div>
  );
}

export default function MyTasksPage() {
  const { filteredTasks, completedTasks, pendingTasks, selectedTask, setSelectedTask, editTask, removeTask, toggleComplete, toggleImportant } = useTask();
  const [filter, setFilter] = useState("all"); // all | pending | completed | important
  const ctx = useOutletContext();

  const displayed = filter === "pending" ? pendingTasks
    : filter === "completed" ? completedTasks
    : filter === "important" ? filteredTasks.filter((t) => t.important)
    : filteredTasks;

  return (
    <div className="flex w-full">
      {/* Task list */}
      <div className={`${selectedTask ? "hidden md:flex" : "flex"} flex-col w-full`} style={{ width: selectedTask ? "48%" : "100%", borderRight: selectedTask ? "1px solid var(--border)" : "none", transition: "width 0.3s ease-in-out" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>My Tasks</h1>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
            {[{ k: "all", l: "All" }, { k: "pending", l: "Active" }, { k: "completed", l: "Done" }, { k: "important", l: "⭐" }].map(({ k, l }) => (
              <button key={k} onClick={() => setFilter(k)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{ background: filter === k ? "var(--accent)" : "transparent", color: filter === k ? "white" : "var(--text-muted)" }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Timeline list */}
        <div className="flex-1 px-2 py-5">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
              <p className="text-4xl">✅</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {filter === "completed" ? "No completed tasks yet." : filter === "pending" ? "All tasks done! Great job." : "No tasks here."}
              </p>
            </div>
          ) : (
            <div className="relative pl-8">
              {/* Timeline vertical line */}
              <div className="timeline-line" />
              <div className="space-y-3">
                {displayed.map((task, i) => (
                  <motion.div
                    key={task.id}
                    layout // Smooth transitions for position changes
                    className={`app-card cursor-pointer relative ${selectedTask?.id === task.id ? "ring-2" : ""}`}
                    style={selectedTask?.id === task.id ? { ringColor: "var(--accent)", borderColor: "var(--accent)" } : {}}
                    onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    whileHover={{ x: 2 }}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[29px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: task.completed ? "#10b981" : "var(--accent)", border: "2px solid var(--bg-primary)" }}>
                      {task.completed && <CheckCircle2 size={10} color="white" />}
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${task.completed ? "line-through opacity-50" : ""}`} style={{ color: "var(--text-primary)" }}>{task.title}</p>
                        {task.description && <p className="text-xs mt-0.5 line-clamp-1 opacity-60" style={{ color: "var(--text-secondary)" }}>{task.description}</p>}
                        {task.dueDate && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Clock size={10} />{formatDate(task.dueDate)}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`badge-${task.priority || "medium"}`}>{task.priority || "med"}</span>
                        <div className="flex gap-1">
                          {task.important && <Star size={12} fill="#ef4444" color="#ef4444" />}
                          <button onClick={(e) => { e.stopPropagation(); toggleComplete(task.id, task.completed); }}
                            className="cursor-pointer hover:scale-110 transition-transform">
                            {task.completed ? <CheckCircle2 size={14} style={{ color: "#10b981" }} /> : <Circle size={14} style={{ color: "var(--text-muted)" }} />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); removeTask(task.id); }}
                            className="cursor-pointer hover:scale-110 transition-transform">
                            <Trash2 size={13} style={{ color: "#ef4444" }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Panel */}
      <AnimatePresence>
        {selectedTask && (
          <div className="flex-1 h-full overflow-hidden" style={{ borderLeft: "1px solid var(--border)" }}>
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onEdit={editTask}
              onDelete={(id) => { removeTask(id); setSelectedTask(null); }}
              onToggleComplete={toggleComplete}
              onToggleImportant={toggleImportant}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
