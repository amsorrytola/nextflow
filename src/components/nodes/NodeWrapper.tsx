"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Play, Trash2, Workflow } from "lucide-react"
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
  const removeNode = useWorkflowStore((state) => state.removeNode)
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
    <div
      className="flex flex-col"
      style={{ minWidth: 272, maxWidth: 340 }}
      onMouseEnter={() => setActionsVisible(true)}
      onMouseLeave={() => setActionsVisible(false)}
    >
      <div
        className={cn(
          "rounded-[16px] relative overflow-visible transition-all duration-300",
          className
        )}
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--bg-node) 94%, white 6%) 0%, var(--bg-node) 100%)",
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
              : "0 16px 40px rgba(0,0,0,0.22), 0 2px 10px rgba(0,0,0,0.18)",
          outline: isRunning ? `2px solid ${outlineColor}` : "none",
          outlineOffset: 1,
          transition:
            "border-color 0.25s ease-out, box-shadow 0.25s ease-out, outline 0.25s ease-out, transform 0.2s ease-out",
          transform: actionsVisible ? "translateY(-1px)" : "translateY(0px)",
        }}
      >
        <div
          className="node-drag-handle flex items-center justify-between gap-3 px-3.5 py-2.5"
          style={{
            borderBottom: "1px solid color-mix(in srgb, var(--border) 88%, transparent)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 20,
                height: 20,
                borderRadius: 8,
                color: titleColor ?? accentColor,
                background: `${titleColor ?? accentColor}14`,
                border: `1px solid ${titleColor ?? accentColor}22`,
              }}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <div
                className="text-[12px] font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: isRunning ? accentColor : isSuccess ? "#4CAF50" : isError ? "#ef4444" : "rgba(255,255,255,0.18)",
                boxShadow: isRunning ? `0 0 10px ${accentColor}80` : "none",
              }}
            />
            <div
              aria-hidden="true"
              className="flex flex-col gap-[3px]"
              style={{ opacity: 0.42 }}
            >
              <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--text-faint)" }} />
              <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--text-faint)" }} />
              <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--text-faint)" }} />
            </div>
          </div>
        </div>

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
            <HoverAction
              label="Delete node"
              icon={<Trash2 size={12} />}
              disabled={isRunning}
              variant="danger"
              onClick={(event) => {
                event.stopPropagation()
                removeNode(nodeId)
              }}
            />
          </div>
        )}

        {/* Running pulse ring */}
        {isRunning && (
          <div
            className="absolute inset-0 rounded-[16px] pointer-events-none"
            style={{
              animation: "krea-pulse-ring 1.5s ease-out infinite",
              border: `1px solid ${accentColor}`,
            }}
          />
        )}

        <div className="p-3.5 flex flex-col gap-3">{children}</div>
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
  variant: "primary" | "secondary" | "danger"
}) {
  return (
    <button
      type="button"
      className={cn(
        "nodrag flex items-center gap-2 rounded-[12px] pl-3 pr-3.5 py-2 text-[12px] font-medium shadow-lg transition-all whitespace-nowrap",
        disabled ? "cursor-not-allowed opacity-60" : "hover:brightness-110"
      )}
      style={{
        background:
          variant === "primary"
            ? "#1f7aff"
            : variant === "danger"
            ? "rgba(127,29,29,0.94)"
            : "#0d0d0d",
        border:
          variant === "primary"
            ? "1px solid rgba(255,255,255,0.14)"
            : variant === "danger"
            ? "1px solid rgba(248,113,113,0.18)"
            : "1px solid rgba(255,255,255,0.08)",
        color: "white",
        boxShadow:
          variant === "primary"
            ? "0 10px 24px rgba(31,122,255,0.26)"
            : variant === "danger"
            ? "0 10px 24px rgba(127,29,29,0.24)"
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
