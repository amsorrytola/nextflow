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
  const glowColor = status === "running" ? accentColor
    : status === "success" ? "#4CAF50"
    : status === "error" ? "#ef4444"
    : "transparent"

  const borderColor = status === "running" ? accentColor
    : status === "success" ? "#4CAF5066"
    : status === "error" ? "#ef444466"
    : "transparent"

  return (
    <div className="flex flex-col nodrag" style={{ minWidth: 260, maxWidth: 320 }}>
      {/* Title row — above card, Krea style */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
        {icon && (
          <span style={{ color: titleColor ?? accentColor }}>
            {icon}
          </span>
        )}
        <span className="text-[13px] font-normal" style={{ color: titleColor ?? "#aaa" }}>
          {title}
        </span>
      </div>

      {/* Card */}
      <div
        className={cn(
          "rounded-2xl bg-[#1e1e1e] relative overflow-visible",
          "transition-all duration-200",
          status === "running" && "animate-pulse",
          className
        )}
        style={{
          border: `1px solid ${borderColor}`,
          boxShadow: status !== "idle"
            ? `0 0 0 1px ${borderColor}, 0 0 16px ${glowColor}44`
            : "none",
        }}
      >
        <div className="p-3 flex flex-col gap-2.5">
          {children}
        </div>
      </div>
    </div>
  )
}
