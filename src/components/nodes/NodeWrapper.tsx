"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Play, Workflow } from "lucide-react"
import { runWorkflowMode } from "@/lib/runWorkflowMode"
import { useWorkflowStore } from "@/store/workflowStore"
import type { NodeExecutionStatus } from "@/types"

interface NodeWrapperProps {
  children: React.ReactNode
  status?: NodeExecutionStatus
  className?: string
  title: string
  icon?: React.ReactNode
  accentColor?: string
  titleColor?: string
  nodeId?: string
}

export function NodeWrapper({
  children,
  status = "idle",
  className,
  title,
  icon,
  accentColor = "#a855f7",
  titleColor,
  nodeId,
}: NodeWrapperProps) {
  const isRunning = status === "running"
  const isSuccess = status === "success"
  const isError = status === "error"
  const setSelectedNodeIds = useWorkflowStore((state) => state.setSelectedNodeIds)
  const [actionsVisible, setActionsVisible] = useState(false)

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
    <div
      className="flex flex-col"
      style={{ minWidth: 256, maxWidth: 320 }}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
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
          background: "var(--bg-node)",
          border: `1px solid ${
            isRunning || isSuccess || isError
              ? outlineColor + "60"
              : "var(--border)"
          }`,
          boxShadow:
            isRunning
              ? `0 0 0 1px ${shadowColor}40, 0 0 20px ${shadowColor}30, 0 0 40px ${shadowColor}15`
              : isSuccess
              ? `0 0 0 1px ${shadowColor}30, 0 0 12px ${shadowColor}20`
              : isError
              ? `0 0 0 1px ${shadowColor}40, 0 0 12px ${shadowColor}25`
              : "0 2px 8px color-mix(in srgb, var(--bg-primary) 60%, transparent)",
          outline: isRunning ? `2px solid ${outlineColor}` : "none",
          outlineOffset: 1,
          transition:
            "border-color 0.3s ease-out, box-shadow 0.3s ease-out, outline 0.3s ease-out",
        }}
      >
        {nodeId && (
          <div
            className="absolute left-0 top-3 z-30 flex flex-col gap-2 transition-all duration-150"
            style={{
              transform: actionsVisible ? "translateX(-92px)" : "translateX(-84px)",
              opacity: actionsVisible ? 1 : 0,
              pointerEvents: actionsVisible ? "auto" : "none",
            }}
            onMouseEnter={() => setActionsVisible(true)}
            onMouseLeave={() => setActionsVisible(false)}
          >
            <HoverAction
              label="Run workflow"
              icon={<Workflow size={12} fill="currentColor" />}
              disabled={isRunning}
              variant="primary"
              onClick={(event) => {
                event.stopPropagation()
                void runWorkflowMode("FULL")
              }}
            />
            <HoverAction
              label="Run node"
              icon={<Play size={12} fill="currentColor" />}
              disabled={isRunning}
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation()
                setSelectedNodeIds([nodeId])
                void runWorkflowMode("SINGLE", [nodeId])
              }}
            />
          </div>
        )}

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

function HoverAction({
  label,
  icon,
  onClick,
  disabled,
  variant,
}: {
  label: string
  icon: React.ReactNode
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  variant: "primary" | "secondary"
}) {
  return (
    <button
      type="button"
      className={cn(
        "nodrag flex items-center gap-2 rounded-[12px] pl-3 pr-3.5 py-2 text-[12px] font-medium shadow-lg transition-all whitespace-nowrap",
        disabled ? "cursor-not-allowed opacity-60" : "hover:brightness-110"
      )}
      style={{
        background: variant === "primary" ? "#1f7aff" : "#0d0d0d",
        border: variant === "primary" ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.08)",
        color: "white",
        boxShadow: variant === "primary"
          ? "0 10px 24px rgba(31,122,255,0.26)"
          : "0 10px 24px rgba(0,0,0,0.28)",
        backdropFilter: "blur(12px)",
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
