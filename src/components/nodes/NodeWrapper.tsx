"use client"

import { useState } from "react"
import { Play, Trash2, Workflow } from "lucide-react"
import { cn } from "@/lib/utils"
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
  accentColor = "#9B6FFF",
  titleColor,
  nodeId,
}: NodeWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const setSelectedNodeIds = useWorkflowStore(s => s.setSelectedNodeIds)
  const removeNode = useWorkflowStore(s => s.removeNode)

  const isRunning = status === "running"
  const isSuccess = status === "success"
  const isError   = status === "error"

  const accent = isRunning ? accentColor : isSuccess ? "#29D246" : isError ? "#FF4545" : "transparent"
  const glowAlpha = isRunning ? "55" : isSuccess ? "30" : isError ? "35" : "00"
  const borderAlpha = isRunning ? "80" : isSuccess ? "55" : isError ? "65" : "00"

  return (
    <div
      className="flex flex-col"
      style={{ minWidth: 264, maxWidth: 340 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Hover actions (left side) ── */}
      {nodeId && (
        <div
          className="absolute top-0 left-0 z-30 flex flex-col gap-1.5"
          style={{
            transform: hovered ? "translateX(calc(-100% - 10px))" : "translateX(calc(-100% - 4px))",
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
            transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease",
            paddingTop: 2,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <ActionPill label="Run workflow" icon={<Workflow size={11} />} color="#1f7aff"
            disabled={isRunning}
            onClick={e => { e.stopPropagation(); void runWorkflowMode("FULL") }} />
          <ActionPill label="Run node" icon={<Play size={11} fill="currentColor" />} color="#2a2a2a"
            disabled={isRunning}
            onClick={e => { e.stopPropagation(); setSelectedNodeIds([nodeId]); void runWorkflowMode("SINGLE", [nodeId]) }} />
          <ActionPill label="Delete" icon={<Trash2 size={11} />} color="#3a1414"
            textColor="#ff6b6b"
            disabled={isRunning}
            onClick={e => { e.stopPropagation(); removeNode(nodeId) }} />
        </div>
      )}

      {/* ── Card ── */}
      <div
        className={cn("relative overflow-visible", className)}
        style={{
          borderRadius: 16,
          background: "var(--bg-node)",
          border: `1px solid ${isRunning || isSuccess || isError
            ? `${accent}${borderAlpha}`
            : "var(--border-node)"}`,
          boxShadow: isRunning || isSuccess || isError
            ? `0 0 0 1px ${accent}${borderAlpha}, 0 0 28px ${accent}${glowAlpha}, 0 20px 60px rgba(0,0,0,0.55)`
            : hovered
            ? "0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.35)"
            : "0 12px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25)",
          transform: hovered ? "translateY(-1px)" : "translateY(0px)",
          transition: "box-shadow 0.22s ease, border-color 0.22s ease, transform 0.18s ease",
          outline: isRunning ? `1.5px solid ${accent}60` : "none",
          outlineOffset: 2,
        }}
      >
        {/* ── Header ── */}
        <div
          className="node-drag-handle flex items-center justify-between px-3.5 py-2.5"
          style={{
            borderBottom: "1px solid var(--border)",
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            background: "linear-gradient(180deg, var(--bg-node-header) 0%, var(--bg-node) 100%)",
            cursor: "grab",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex items-center justify-center shrink-0"
              style={{
                width: 20,
                height: 20,
                borderRadius: 8,
                background: `${titleColor ?? accentColor}16`,
                border: `1px solid ${titleColor ?? accentColor}28`,
                color: titleColor ?? accentColor,
              }}
            >
              {icon}
            </span>
            <span
              className="text-[12.5px] font-medium truncate"
              style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
            >
              {title}
            </span>
          </div>

          {/* Status dot + drag grip */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              style={{
                width: 5.5,
                height: 5.5,
                borderRadius: 999,
                background: isRunning ? accentColor
                  : isSuccess ? "#29D246"
                  : isError   ? "#FF4545"
                  : "rgba(255,255,255,0.14)",
                boxShadow: isRunning ? `0 0 8px ${accentColor}90` : "none",
                transition: "background 0.2s ease, box-shadow 0.2s ease",
              }}
            />
            <DragGrip />
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {children}
        </div>

        {/* ── Pulse ring when running ── */}
        {isRunning && (
          <div
            className="absolute pointer-events-none"
            style={{
              inset: -1,
              borderRadius: 17,
              border: `1px solid ${accentColor}`,
              animation: "krea-pulse-ring 1.6s ease-out infinite",
            }}
          />
        )}
      </div>
    </div>
  )
}

function DragGrip() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2.5, opacity: 0.28 }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ display: "flex", gap: 2.5 }}>
          {[0,1].map(j => (
            <div key={j} style={{ width: 2.5, height: 2.5, borderRadius: 99, background: "var(--text-primary)" }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function ActionPill({ label, icon, color, textColor, disabled, onClick }: {
  label: string
  icon: React.ReactNode
  color: string
  textColor?: string
  disabled?: boolean
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="nodrag"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px 6px 10px",
        borderRadius: 10,
        background: color,
        border: "1px solid rgba(255,255,255,0.1)",
        color: textColor ?? "rgba(255,255,255,0.88)",
        fontSize: 11.5,
        fontWeight: 500,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        transition: "filter 0.12s ease",
        letterSpacing: "-0.01em",
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.filter = "brightness(1.12)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)" }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
