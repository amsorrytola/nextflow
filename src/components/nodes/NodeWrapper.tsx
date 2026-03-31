"use client"

import { cn } from "@/lib/utils"
import type { NodeExecutionStatus } from "@/types"

interface NodeWrapperProps {
  children: React.ReactNode
  status?: NodeExecutionStatus
  className?: string
  title: string
  icon: React.ReactNode
  color?: string
}

export function NodeWrapper({
  children,
  status = "idle",
  className,
  title,
  icon,
  color = "#a855f7",
}: NodeWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[#1a1a1a] min-w-[240px] max-w-[280px]",
        "transition-all duration-200",
        status === "idle" && "border-[#2a2a2a]",
        status === "running" && "border-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.4)] animate-pulse",
        status === "success" && "border-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.2)]",
        status === "error" && "border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.2)]",
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2a2a] rounded-t-xl"
        style={{ borderTopColor: color, borderTopWidth: 2 }}
      >
        <span style={{ color }}>{icon}</span>
        <span className="text-xs font-semibold text-white">{title}</span>
      </div>
      {/* Body */}
      <div className="p-3 flex flex-col gap-2">{children}</div>
    </div>
  )
}
