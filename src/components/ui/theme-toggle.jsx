import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full cursor-pointer transition-all duration-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
      style={{ background: isDark ? "rgba(30,66,152,0.5)" : "rgba(62,125,251,0.2)", border: "1px solid var(--border-accent)" }}
      aria-label="Toggle theme"
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
        style={{ background: "var(--accent)" }}
        animate={{ left: isDark ? "calc(100% - 26px)" : "2px" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.div animate={{ rotate: isDark ? 360 : 0 }} transition={{ duration: 0.4 }}>
          {isDark ? <Moon size={12} color="white" /> : <Sun size={12} color="white" />}
        </motion.div>
      </motion.div>
    </button>
  );
}
