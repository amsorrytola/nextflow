"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Database, History } from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import type { WorkflowRunRecord } from "@/types/workflow"

type RightPanelView = "assets" | "history" | null

interface RightSidebarProps {
  panel: RightPanelView
  onClose: () => void
}

function RunStatusBadge({ status }: { status: WorkflowRunRecord["status"] }) {
  const cfg = {
    SUCCESS: { icon: <CheckCircle2 size={11} />, color: "var(--krea-green)" },
    FAILED:  { icon: <XCircle      size={11} />, color: "var(--krea-red)"  },
    RUNNING: { icon: <Clock        size={11} />, color: "var(--krea-purple)" },
    PARTIAL: { icon: <Clock        size={11} />, color: "#FF9F43" },
  }[status] ?? { icon: <Clock size={11} />, color: "var(--text-muted)" }

  return <span style={{ color: cfg.color, display: "flex" }}>{cfg.icon}</span>
}

function NodeStatusDot({ status }: { status: "success" | "failed" | "running" | "skipped" }) {
  const color = {
    success: "var(--krea-green)",
    failed:  "var(--krea-red)",
    running: "var(--krea-purple)",
    skipped: "var(--border-strong)",
  }[status]
  return <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, marginTop: 5 }} />
}

function summarizeValue(value: unknown): string {
  if (value == null) return "None"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map(summarizeValue).join(", ")
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function RightSidebar({ panel, onClose }: RightSidebarProps) {
  const runs = useWorkflowStore(s => s.runs)
  if (!panel) return null

  return (
    <div style={{
      width: 248,
      minWidth: 248,
      background: "var(--panel-backdrop)",
      borderLeft: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 14px",
        height: 52,
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {panel === "assets"
            ? <Database size={13} style={{ color: "var(--text-faint)" }} />
            : <History  size={13} style={{ color: "var(--text-faint)" }} />}
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "-0.01em" }}>
            {panel === "assets" ? "Assets" : "Version History"}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 26, height: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 7, border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-ghost)",
            transition: "background 0.12s ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Panel content */}
      {panel === "assets" ? <AssetsPanel /> : <HistoryPanel runs={runs} />}
    </div>
  )
}

function AssetsPanel() {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px", scrollbarWidth: "none" }}>
      {["Images", "Videos", "Audio", "3D Objects"].map(label => (
        <button key={label} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "8px 10px",
          borderRadius: 9, border: "none",
          background: "transparent",
          cursor: "pointer",
          transition: "background 0.11s ease",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
        >
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)", letterSpacing: "-0.01em" }}>{label}</span>
          <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>0</span>
        </button>
      ))}

      {/* Empty state */}
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "0 16px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Database size={16} style={{ color: "var(--text-ghost)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-ghost)" }}>No assets yet</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.55 }}>
            Uploads and generated files will appear here
          </p>
        </div>
      </div>
    </div>
  )
}

function HistoryPanel({ runs }: { runs: WorkflowRunRecord[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (runs.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "0 20px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12,
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <History size={16} style={{ color: "var(--text-ghost)" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "var(--text-ghost)" }}>No runs yet</p>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3, lineHeight: 1.55 }}>
            Run a workflow to see history
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", minHeight: 0, scrollbarWidth: "none" }}>
      {runs.map(run => (
        <div key={run.id} style={{ borderBottom: "1px solid var(--border)" }}>
          {/* Run row */}
          <button
            onClick={() => setExpanded(expanded === run.id ? null : run.id)}
            style={{
              width: "100%", display: "flex", alignItems: "flex-start", gap: 8,
              padding: "10px 12px",
              border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
              transition: "background 0.11s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            {expanded === run.id
              ? <ChevronDown  size={10} style={{ color: "var(--text-ghost)", marginTop: 3, flexShrink: 0 }} />
              : <ChevronRight size={10} style={{ color: "var(--text-ghost)", marginTop: 3, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RunStatusBadge status={run.status} />
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-soft)", letterSpacing: "-0.01em" }}>
                  Run #{run.runNumber}
                </span>
                <span style={{ fontSize: 10.5, color: "var(--text-ghost)", marginLeft: "auto", flexShrink: 0 }}>
                  {(run.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                <span style={{ fontSize: 10.5, color: "var(--text-ghost)" }}>
                  {run.scope === "FULL" ? "Full run" : run.scope === "SINGLE" ? "Single node" : `${run.nodeRuns.length} nodes`}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-muted)" }}>·</span>
                <span style={{ fontSize: 10.5, color: "var(--text-ghost)" }}>
                  {run.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </button>

          {/* Expanded node runs */}
          {expanded === run.id && (
            <div style={{ paddingBottom: 6, paddingLeft: 4, paddingRight: 4 }}>
              {run.nodeRuns.map((nr, i) => (
                <div key={nr.nodeId} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <NodeStatusDot status={nr.status} />
                    {i < run.nodeRuns.length - 1 && (
                      <div style={{ width: 1, flex: 1, background: "var(--border)", minHeight: 12, marginTop: 3 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 11.5, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nr.nodeLabel}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-ghost)", marginLeft: "auto", flexShrink: 0 }}>
                        {(nr.durationMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                    {nr.error && (
                      <p style={{ fontSize: 10.5, color: "rgba(255,100,100,0.65)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nr.error}
                      </p>
                    )}
                    {Object.keys(nr.inputs).length > 0 && (
                      <p style={{ fontSize: 10.5, color: "var(--text-ghost)", marginTop: 3, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        Inputs: {Object.entries(nr.inputs).map(([key, value]) => `${key}: ${summarizeValue(value)}`).join(" | ")}
                      </p>
                    )}
                    {Object.keys(nr.outputs).length > 0 && (
                      <p style={{ fontSize: 10.5, color: "var(--text-ghost)", marginTop: 3, lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        Output: {Object.entries(nr.outputs).map(([, value]) => summarizeValue(value)).join(" | ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
