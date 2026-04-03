"use client"

import { cn } from "@/lib/utils"
import type { NodeExecutionStatus } from "@/types"

interface NodeWrapperProps {
  children: React.ReactNode
  status?: NodeExecutionStatus
  className?: string
  title: string
  icon?: React.ReactNode
  accentColor?: string
  titleColor?: string
}

export function NodeWrapper({
  children,
  status = "idle",
  className,
  title,
  icon,
  accentColor = "#a855f7",
  titleColor,
}: NodeWrapperProps) {
  const isRunning = status === "running"
  const isSuccess = status === "success"
  const isError = status === "error"

  const outlineColor = isRunning
    ? accentColor
    : isSuccess
    ? "#4CAF50"
    : isError
    ? "#ef4444"
    : "transparent"

  const shadowColor = isRunning
    ? accentColor
    : isSuccess
    ? "#4CAF50"
    : isError
    ? "#ef4444"
    : "transparent"

  return (
    // NOTE: NO `nodrag` class here — that was preventing node dragging!
    <div className="flex flex-col" style={{ minWidth: 256, maxWidth: 320 }}>
      {/* Title row — floats above card like Krea's design */}
      <div
        className="absolute flex items-center gap-1"
        style={{ top: -20, left: 4 }}
      >
        {icon && (
          <span style={{ color: titleColor ?? accentColor }}>{icon}</span>
        )}
        <span
          className="text-[12px] font-normal truncate max-w-[160px]"
          style={{ color: titleColor ?? accentColor }}
        >
          {title}
        </span>
      </div>

      {/* Card body — matches Krea's dark card with subtle border */}
      <div
        className={cn(
          "rounded-[12px] relative overflow-visible transition-all duration-300",
          className
        )}
        style={{
          background: "#1c1c1c",
          border: `1px solid ${
            isRunning || isSuccess || isError
              ? outlineColor + "60"
              : "rgba(255,255,255,0.07)"
          }`,
          boxShadow:
            isRunning
              ? `0 0 0 1px ${shadowColor}40, 0 0 20px ${shadowColor}30, 0 0 40px ${shadowColor}15`
              : isSuccess
              ? `0 0 0 1px ${shadowColor}30, 0 0 12px ${shadowColor}20`
              : isError
              ? `0 0 0 1px ${shadowColor}40, 0 0 12px ${shadowColor}25`
              : "0 2px 8px rgba(0,0,0,0.4)",
          outline: isRunning ? `2px solid ${outlineColor}` : "none",
          outlineOffset: 1,
          transition:
            "border-color 0.3s ease-out, box-shadow 0.3s ease-out, outline 0.3s ease-out",
        }}
      >
        {/* Running pulse ring */}
        {isRunning && (
          <div
            className="absolute inset-0 rounded-[12px] pointer-events-none"
            style={{
              animation: "krea-pulse-ring 1.5s ease-out infinite",
              border: `1px solid ${accentColor}`,
            }}
          />
        )}

        <div className="p-3 flex flex-col gap-2.5">{children}</div>
      </div>

      <style>{`
        @keyframes krea-pulse-ring {
          0%   { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.04); }
        }
      `}</style>
    </div>
  )
}