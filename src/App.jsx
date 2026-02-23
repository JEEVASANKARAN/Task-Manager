import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TaskProvider } from "./context/TaskContext";
import { MorphingSquareLoader, Preloader } from "./components/ui/loaders";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import MyTasksPage from "./pages/MyTasksPage";
import CalendarPage from "./pages/CalendarPage";
import MailPage from "./pages/MailPage";
import NotificationsPage from "./pages/NotificationsPage";
import "./index.css";

function AppRoutes() {
  const { user, loading, profile } = useAuth();
  const [showPreloader, setShowPreloader] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const [prevUser, setPrevUser] = useState(null);

  useEffect(() => {
    if (!loading && user && !prevUser) {
      // Just logged in — show preloader
      setShowPreloader(true);
      setPrevUser(user);
    } else if (!loading && !user) {
      setShowPreloader(false);
      setPreloaderDone(false);
      setPrevUser(null);
    }
  }, [user, loading]);

  // Safety timeout for global loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.warn("Root loading safety timeout triggered");
        // We don't want to set loading to false globally as it's from context,
        // but we can force the AppRoutes to proceed if it's stuck.
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) return <MorphingSquareLoader message="Booting System" />;

  if (user && showPreloader && !preloaderDone) {
    return (
      <Preloader
        userName={profile?.displayName || user?.displayName || user?.email?.split("@")[0]}
        onComplete={() => { setShowPreloader(false); setPreloaderDone(true); }}
      />
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/app/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/app/dashboard" replace /> : <SignupPage />} />
      <Route path="/app" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tasks" element={<MyTasksPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="mail" element={<MailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="/" element={<Navigate to={user ? "/app/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/app/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
