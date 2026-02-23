import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  createTask,
  updateTask,
  deleteTask,
  getUserTasksListener,
} from "../lib/firebase";

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    const unsub = getUserTasksListener(user.uid, (t) => setTasks(t));
    return unsub;
  }, [user]);

  const addTask = async (taskData) => {
    if (!user) return;
    setLoading(true);
    try {
      const id = await createTask(user.uid, taskData);
      return id;
    } finally {
      setLoading(false);
    }
  };

  const editTask = async (taskId, data) => {
    setLoading(true);
    try {
      await updateTask(taskId, data);
      if (selectedTask?.id === taskId) {
        setSelectedTask((prev) => ({ ...prev, ...data }));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeTask = async (taskId) => {
    await deleteTask(taskId);
    if (selectedTask?.id === taskId) setSelectedTask(null);
  };

  const toggleComplete = async (taskId, current) => {
    const nextValue = !current;
    // Optimistic update for immediate feedback
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, completed: nextValue }));
    }
    
    try {
      await updateTask(taskId, { completed: nextValue });
    } catch (err) {
      console.error("Failed to toggle complete:", err);
      // Rollback if needed
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => ({ ...prev, completed: current }));
      }
    }
  };

  const toggleImportant = async (taskId, current) => {
    const nextValue = !current;
    // Optimistic update
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => ({ ...prev, important: nextValue }));
    }

    try {
      await updateTask(taskId, { important: nextValue });
    } catch (err) {
      console.error("Failed to toggle important:", err);
      // Rollback
      if (selectedTask?.id === taskId) {
        setSelectedTask(prev => ({ ...prev, important: current }));
      }
    }
  };

  const filteredTasks = tasks.filter((t) =>
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayTasks = filteredTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = t.dueDate?.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
    return d.toDateString() === new Date().toDateString();
  });

  const importantTasks = filteredTasks.filter((t) => t.important && !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);
  const pendingTasks = filteredTasks.filter((t) => !t.completed);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        filteredTasks,
        todayTasks,
        importantTasks,
        completedTasks,
        pendingTasks,
        selectedTask,
        setSelectedTask,
        searchQuery,
        setSearchQuery,
        selectedDate,
        setSelectedDate,
        loading,
        addTask,
        editTask,
        removeTask,
        toggleComplete,
        toggleImportant,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export const useTask = () => useContext(TaskContext);
