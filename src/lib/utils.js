import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date) => {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatTime = (date) => {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export const isToday = (date) => {
  if (!date) return false;
  const d = date?.toDate ? date.toDate() : new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isPast = (date) => {
  if (!date) return false;
  const d = date?.toDate ? date.toDate() : new Date(date);
  return d < new Date();
};
