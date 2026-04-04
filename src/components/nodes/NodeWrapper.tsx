"use client"

import { useState } from "react"
import { Play, Trash2, Workflow } from "lucide-react"
import { runWorkflowMode } from "@/lib/runWorkflowMode"
import { useWorkflowStore } from "@/store/workflowStore"
import type { NodeExecutionStatus } from "@/types"

interface NodeWrapperProps {
  children: React.ReactNode
  status?: NodeExecutionStatus
  title: string
  icon?: React.ReactNode
  accentColor?: string
  titleColor?: string
  nodeId?: string
  className?: string
}

export function NodeWrapper({
  children,
  status = "idle",
  title,
  icon,
  accentColor = "var(--krea-purple)",
  titleColor,
  nodeId,
}: NodeWrapperProps) {
  const [hovered, setHovered] = useState(false)
  const { setSelectedNodeIds, removeNode } = useWorkflowStore()

  const isRunning = status === "running"
  const isSuccess = status === "success"
  const isError   = status === "error"
  const isActive  = isRunning || isSuccess || isError

  // Per-state border + glow colours
  const statusColor =
    isRunning ? accentColor :
    isSuccess ? "var(--krea-green)" :
    isError   ? "var(--krea-red)" : ""

  const glowStyles = isActive ? {
    border:     `1px solid ${statusColor}55`,
    boxShadow:  `0 0 0 1px ${statusColor}30, 0 0 30px ${statusColor}22, var(--shadow-node)`,
    outline:    isRunning ? `1.5px solid ${statusColor}55` : "none",
    outlineOffset: 2,
  } : {
    border:    "1px solid var(--border-node)",
    boxShadow: hovered ? "var(--shadow-node-hover)" : "var(--shadow-node)",
    outline:   "none",
  }

  return (
    // NOTE: NO nodrag here — wrapper must remain draggable
    <div
      style={{ minWidth: 268, maxWidth: 340, position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Hover action pills (float left of node) ── */}
      {nodeId && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: "calc(100% + 10px)",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            paddingTop: 2,
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateX(0)" : "translateX(6px)",
            pointerEvents: hovered ? "auto" : "none",
            transition: "opacity 0.18s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
            zIndex: 30,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <HoverPill
            label="Run workflow"
            icon={<Workflow size={10} strokeWidth={2.2} />}
            bg="rgba(31,122,255,0.92)"
            disabled={isRunning}
            onClick={e => { e.stopPropagation(); void runWorkflowMode("FULL") }}
          />
          <HoverPill
            label="Run node"
            icon={<Play size={10} fill="currentColor" strokeWidth={0} />}
            bg="rgba(32,32,32,0.96)"
            disabled={isRunning}
            onClick={e => { e.stopPropagation(); setSelectedNodeIds([nodeId]); void runWorkflowMode("SINGLE", [nodeId]) }}
          />
          <HoverPill
            label="Delete"
            icon={<Trash2 size={10} strokeWidth={2.2} />}
            bg="rgba(48,18,18,0.96)"
            textColor="var(--krea-red)"
            disabled={isRunning}
            onClick={e => { e.stopPropagation(); removeNode(nodeId) }}
          />
        </div>
      )}

      {/* ── Card ── */}
      <div
        style={{
          borderRadius: "var(--radius-node)",
          background: "var(--bg-node)",
          transform: hovered ? "translateY(-1px)" : "translateY(0)",
          transition: "box-shadow 0.22s ease, border-color 0.22s ease, transform 0.16s ease",
          ...glowStyles,
        }}
      >
        {/* ── Drag-handle header ── */}
        <div
          className="node-drag-handle"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 12px 9px 12px",
            borderBottom: "1px solid var(--border)",
            borderTopLeftRadius: "calc(var(--radius-node) - 1px)",
            borderTopRightRadius: "calc(var(--radius-node) - 1px)",
            background: "var(--bg-node-header)",
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {/* Left: icon + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            <span style={{
              width: 20, height: 20,
              borderRadius: 7,
              background: `${titleColor ?? accentColor}14`,
              border: `1px solid ${titleColor ?? accentColor}24`,
              color: titleColor ?? accentColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {icon}
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-primary)",
              letterSpacing: "-0.012em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {title}
            </span>
          </div>

          {/* Right: status dot + grip */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: isRunning ? accentColor :
                          isSuccess ? "var(--krea-green)" :
                          isError   ? "var(--krea-red)" : "var(--border-strong)",
              boxShadow: isRunning ? `0 0 8px ${accentColor}` : "none",
              transition: "background 0.2s, box-shadow 0.2s",
            }} />
            <DragGrip />
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "11px 13px", display: "flex", flexDirection: "column", gap: 9 }}>
          {children}
        </div>

        {/* ── Running pulse ring ── */}
        {isRunning && (
          <div style={{
            position: "absolute",
            inset: -1,
            borderRadius: "calc(var(--radius-node) + 1px)",
            border: `1px solid ${accentColor}`,
            animation: "krea-pulse-ring 1.7s ease-out infinite",
            pointerEvents: "none",
          }} />
        )}
      </div>
    </div>
  )
}

function DragGrip() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2.5, opacity: 0.22 }}>
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

function HoverPill({ label, icon, bg, textColor, disabled, onClick }: {
  label: string; icon: React.ReactNode; bg: string; textColor?: string; disabled?: boolean
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
        padding: "5px 11px 5px 9px",
        borderRadius: 9,
        background: bg,
        border: "1px solid rgba(255,255,255,0.08)",
        color: textColor ?? "rgba(255,255,255,0.84)",
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        boxShadow: "0 4px 18px rgba(0,0,0,0.45)",
        letterSpacing: "-0.01em",
        transition: "filter 0.1s ease, opacity 0.1s ease",
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.filter = "brightness(1.14)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)" }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ── Shared handle style factory ─────────────────────────────────────────────
export function hs(color: string, side: "left" | "right", topOffset?: string): React.CSSProperties {
  return {
    background: color,
    width: 10,
    height: 10,
    border: "2.5px solid var(--bg-node)",
    boxShadow: `0 0 0 2px ${color}26`,
    ...(side === "left" ? { left: -17 } : { right: -17 }),
    ...(topOffset ? { top: topOffset } : { top: "50%" }),
  }
}

// ── Shared field label ───────────────────────────────────────────────────────
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, color: "var(--text-ghost)", marginBottom: 4, letterSpacing: "0.01em" }}>
      {children}
    </div>
  )
}

// ── Shared input style ───────────────────────────────────────────────────────
export function inputStyle(disabled = false, accentColor = "var(--krea-purple)"): React.CSSProperties {
  return {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border-input)",
    borderRadius: 8,
    padding: "7px 11px",
    color: disabled ? "var(--text-ghost)" : "var(--text-soft)",
    fontSize: 12,
    outline: "none",
    opacity: disabled ? 0.40 : 1,
    cursor: disabled ? "not-allowed" : "text",
    fontFamily: "inherit",
    lineHeight: 1.5,
    transition: "border-color 0.14s ease, background 0.14s ease",
  }
}