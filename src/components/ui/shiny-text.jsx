import React from "react";

export function ShinyText({ text, className = "", size = "text-2xl" }) {
  return (
    <span className={`shiny-text font-bold ${size} ${className}`}>
      {text}
    </span>
  );
}
