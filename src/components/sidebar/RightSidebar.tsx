"use client"

import { useState } from "react"
import {
  ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Database, History,
} from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import type { WorkflowRunRecord } from "@/types/workflow"

type RightPanelView = "assets" | "history" | null

interface RightSidebarProps {
  panel: RightPanelView
  onClose: () => void
}

function StatusDot({ status }: { status: "success" | "failed" | "running" | "skipped" }) {
  const colors = {
    success: "#4CAF50",
    failed: "#ef4444",
    running: "#a855f7",
    skipped: "#555",
  }
  return (
    <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: colors[status] }} />
  )
}

function RunStatusIcon({ status }: { status: WorkflowRunRecord["status"] }) {
  if (status === "SUCCESS") return <CheckCircle2 size={12} className="text-[#4CAF50] shrink-0" />
  if (status === "FAILED") return <XCircle size={12} className="text-[#ef4444] shrink-0" />
  if (status === "RUNNING") return <Clock size={12} className="text-[#a855f7] shrink-0 animate-pulse" />
  return <Clock size={12} className="text-[#f5a623] shrink-0" />
}

export function RightSidebar({ panel, onClose }: RightSidebarProps) {
  const runs = useWorkflowStore((s) => s.runs)

  if (!panel) return null

  return (
    <div
      className="flex flex-col h-full shrink-0"
      style={{
        width: 242,
        background: "var(--panel-backdrop)",
        borderLeft: "0.5px solid var(--border)",
      }}
    >
      <div
        className="shrink-0 flex items-center justify-between px-3"
        style={{ height: 52, borderBottom: "0.5px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          {panel === "assets" ? <Database size={13} style={{ color: "var(--text-faint)" }} /> : <History size={13} style={{ color: "var(--text-faint)" }} />}
          <span className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {panel === "assets" ? "Assets" : "Version History"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/[0.06]"
          style={{ width: 28, height: 28 }}
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <ChevronRight size={14} style={{ color: "var(--text-faint)" }} />
        </button>
      </div>

      {panel === "assets" ? <AssetsPanel /> : <HistoryPanel runs={runs} />}
    </div>
  )
}

function AssetsPanel() {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
      <div className="flex flex-col gap-1.5">
        {["Images", "Videos", "Audio", "3D Objects"].map((label) => (
          <div
            key={label}
            className="flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.05]"
          >
            <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{label}</span>
            <span className="text-[11px]" style={{ color: "var(--text-ghost)" }}>0</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-center py-10 px-4 gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border)",
          }}
        >
          <Database size={16} style={{ color: "var(--text-ghost)" }} />
        </div>
        <div className="text-center">
          <p className="text-[12px]" style={{ color: "var(--text-ghost)" }}>No assets yet</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Uploads and generated files will appear here</p>
        </div>
      </div>
    </div>
  )
}

function HistoryPanel({ runs }: { runs: WorkflowRunRecord[] }) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  return (
    <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: "none" }}>
      {runs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
          <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border)",
          }}
        >
          <History size={16} style={{ color: "var(--text-ghost)" }} />
        </div>
        <div className="text-center">
          <p className="text-[12px]" style={{ color: "var(--text-ghost)" }}>No runs yet</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Run a workflow to see history</p>
        </div>
      </div>
      )}

      {runs.map((run) => (
        <div key={run.id} style={{ borderBottom: "0.5px solid var(--border)" }}>
          <button
            className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-white/[0.04] text-left transition-colors"
            onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
          >
            {expandedRun === run.id
              ? <ChevronDown size={11} className="mt-0.5 shrink-0" style={{ color: "var(--text-ghost)" }} />
              : <ChevronRight size={11} className="mt-0.5 shrink-0" style={{ color: "var(--text-ghost)" }} />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <RunStatusIcon status={run.status} />
                <span className="text-[12px] font-medium" style={{ color: "var(--text-soft)" }}>Run #{run.runNumber}</span>
                <span className="text-[10px] ml-auto shrink-0" style={{ color: "var(--text-ghost)" }}>
                  {(run.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px]" style={{ color: "var(--text-ghost)" }}>
                  {run.scope === "FULL" ? "Full run" : run.scope === "SINGLE" ? "Single node" : `${run.nodeRuns.length} nodes`}
                </span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>·</span>
                <span className="text-[11px]" style={{ color: "var(--text-ghost)" }}>
                  {run.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </button>

          {expandedRun === run.id && (
            <div className="pb-2 px-1">
              {run.nodeRuns.map((nr, i) => (
                <div key={nr.nodeId} className="flex items-start gap-2 px-3 py-1.5">
                  <div className="flex flex-col items-center pt-0.5">
                    <StatusDot status={nr.status} />
                    {i < run.nodeRuns.length - 1 && (
                      <div
                        className="w-px flex-1 my-1"
                        style={{ background: "var(--border)", minHeight: 10 }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>{nr.nodeLabel}</span>
                      <span className="text-[10px] shrink-0 ml-auto" style={{ color: "var(--text-ghost)" }}>
                        {(nr.durationMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                    {nr.error && (
                      <p className="text-[10px] text-red-400/60 mt-0.5 truncate">{nr.error}</p>
                    )}
                    {!nr.error && nr.outputs && Object.keys(nr.outputs).length > 0 && (
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-ghost)" }}>
                        {String(Object.values(nr.outputs)[0] ?? "").slice(0, 48)}
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
