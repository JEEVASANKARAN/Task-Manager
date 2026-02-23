import React, { useState, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

// ── Liquid Button ─────────────────────────────────────────
const liquidbuttonVariants = cva(
  "inline-flex items-center transition-all justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full text-sm font-medium disabled:pointer-events-none disabled:opacity-50 outline-none",
  {
    variants: {
      variant: {
        default: "bg-transparent hover:scale-105 duration-300 transition text-primary",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 text-xs gap-1.5 px-4",
        lg: "h-10 px-6",
        xl: "h-12 px-8",
        xxl: "h-14 px-10",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "xxl" },
  }
);

export function LiquidButton({ className, variant, size, asChild = false, children, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <>
      <Comp
        data-slot="button"
        className={cn("relative", liquidbuttonVariants({ variant, size, className }))}
        {...props}
      >
        <div
          className="absolute top-0 left-0 z-0 h-full w-full rounded-full transition-all
            shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_0_0_6px_6px_rgba(0,0,0,0.12),0_0_12px_rgba(255,255,255,0.15)]
            dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_0_0_6px_6px_rgba(255,255,255,0.12),0_0_12px_rgba(0,0,0,0.15)]"
        />
        <div
          className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
          style={{ backdropFilter: 'url("#container-glass")' }}
        />
        <div className="pointer-events-none z-10">{children}</div>
        <GlassFilter />
      </Comp>
    </>
  );
}

function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter id="container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

// ── Metal Button ──────────────────────────────────────────
const colorVariants = {
  default: {
    outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
    inner: "bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]",
    button: "bg-gradient-to-b from-[#B9B9B9] to-[#969696]",
    textColor: "text-white",
    textShadow: "",
  },
  primary: {
    outer: "bg-gradient-to-b from-[#1a3580] to-[#3E7DFB]",
    inner: "bg-gradient-to-b from-[#3E7DFB] via-[#1a3580] to-[#5B8FFC]",
    button: "bg-gradient-to-b from-[#3E7DFB] to-[#1a3580]",
    textColor: "text-white",
    textShadow: "",
  },
  success: {
    outer: "bg-gradient-to-b from-[#005A43] to-[#7CCB9B]",
    inner: "bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]",
    button: "bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]",
    textColor: "text-white",
    textShadow: "",
  },
  error: {
    outer: "bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]",
    inner: "bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]",
    button: "bg-gradient-to-b from-[#F08D8F] to-[#A45253]",
    textColor: "text-white",
    textShadow: "",
  },
  gold: {
    outer: "bg-gradient-to-b from-[#917100] to-[#EAD98F]",
    inner: "bg-gradient-to-b from-[#FFFDDD] via-[#856807] to-[#FFF1B3]",
    button: "bg-gradient-to-b from-[#FFEBA1] to-[#9B873F]",
    textColor: "text-[#1a1a00]",
    textShadow: "",
  },
};

export const MetalButton = React.forwardRef(({ children, className, variant = "default", ...props }, ref) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => { setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0); }, []);
  const colors = colorVariants[variant] || colorVariants.default;
  const transitionStyle = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)";

  return (
    <div
      className={cn("relative inline-flex transform-gpu rounded-full p-[1.25px] will-change-transform", colors.outer)}
      style={{
        transform: isPressed ? "translateY(2.5px) scale(0.99)" : "translateY(0) scale(1)",
        boxShadow: isPressed ? "0 1px 2px rgba(0,0,0,0.15)" : isHovered ? "0 4px 12px rgba(0,0,0,0.12)" : "0 3px 8px rgba(0,0,0,0.08)",
        transition: transitionStyle,
      }}
    >
      <div className={cn("absolute inset-[1px] transform-gpu rounded-full will-change-transform", colors.inner)} style={{ transition: transitionStyle, filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.05)" : "none" }} />
      <button
        ref={ref}
        className={cn(
          "relative z-10 m-[1px] rounded-full inline-flex h-10 transform-gpu cursor-pointer items-center justify-center overflow-hidden px-6 py-2 text-sm font-semibold will-change-transform outline-none",
          colors.button, colors.textColor, className
        )}
        style={{ transform: isPressed ? "scale(0.97)" : "scale(1)", transition: transitionStyle, filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.02)" : "none" }}
        {...props}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => { setIsPressed(false); setIsHovered(false); }}
        onMouseEnter={() => { if (!isTouchDevice) setIsHovered(true); }}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
      >
        {isPressed && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent" />
          </div>
        )}
        {children}
        {isHovered && !isPressed && !isTouchDevice && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t rounded-full from-transparent to-white/5" />
        )}
      </button>
    </div>
  );
});
MetalButton.displayName = "MetalButton";
