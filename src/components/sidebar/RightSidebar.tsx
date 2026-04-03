"use client"

import { useState } from "react"
import { History, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import type { WorkflowRunRecord } from "@/types/workflow"

// Status dot matching Krea's history panel
function StatusDot({ status }: { status: "success" | "failed" | "running" | "skipped" }) {
  const colors = {
    success: "#4CAF50",
    failed: "#ef4444",
    running: "#a855f7",
    skipped: "#666",
  }
  return (
    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: colors[status] }} />
  )
}

function RunStatusIcon({ status }: { status: WorkflowRunRecord["status"] }) {
  if (status === "SUCCESS") return <CheckCircle2 size={13} className="text-[#4CAF50] shrink-0" />
  if (status === "FAILED") return <XCircle size={13} className="text-[#ef4444] shrink-0" />
  if (status === "RUNNING") return <Clock size={13} className="text-[#a855f7] shrink-0 animate-pulse" />
  return <Clock size={13} className="text-[#f5a623] shrink-0" />
}

export function RightSidebar() {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const runs = useWorkflowStore(s => s.runs)

  return (
    // Fixed right sidebar — matches Krea's version history/history panel
    <div className="flex flex-col h-full shrink-0"
      style={{
        width: 240,
        background: "rgba(18,18,18,0.98)",
        borderLeft: "0.5px solid rgba(255,255,255,0.07)"
      }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[52px] shrink-0"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <History size={14} className="text-white/40" />
          <span className="text-[13px] text-white/60 font-medium">History</span>
        </div>
      </div>

      {/* Empty state — "No runs yet" matching Krea */}
      {runs.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <History size={18} className="text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-[13px] text-white/30">No runs yet</p>
            <p className="text-[11px] text-white/20 mt-1">Run a workflow to see history</p>
          </div>
        </div>
      )}

      {/* Run list */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {runs.map((run) => (
          <div key={run.id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
            {/* Run header */}
            <button
              className="w-full flex items-start gap-2.5 px-4 py-3 hover:bg-white/[0.04] text-left transition-colors"
              onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}>
              {expandedRun === run.id
                ? <ChevronDown size={12} className="text-white/30 mt-0.5 shrink-0" />
                : <ChevronRight size={12} className="text-white/30 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <RunStatusIcon status={run.status} />
                  <span className="text-[13px] text-white/80 font-medium">Run #{run.runNumber}</span>
                  <span className="text-[11px] text-white/30 ml-auto shrink-0">
                    {(run.durationMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-white/30">
                    {run.scope === "FULL" ? "Full run" : run.scope === "SINGLE" ? "Single node" : `${run.nodeRuns.length} nodes`}
                  </span>
                  <span className="text-[11px] text-white/20">·</span>
                  <span className="text-[11px] text-white/30">
                    {run.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded node runs */}
            {expandedRun === run.id && (
              <div className="pb-2">
                {run.nodeRuns.map((nr, i) => (
                  <div key={nr.nodeId} className="flex items-start gap-2.5 px-5 py-1.5">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center pt-1">
                      <StatusDot status={nr.status} />
                      {i < run.nodeRuns.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ background: "rgba(255,255,255,0.08)", minHeight: 12 }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] text-white/60 font-medium truncate">{nr.nodeLabel}</span>
                        <span className="text-[10px] text-white/25 shrink-0 ml-auto">
                          {(nr.durationMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                      {nr.error && (
                        <p className="text-[10px] text-red-400/70 mt-0.5 truncate">{nr.error}</p>
                      )}
                      {!nr.error && nr.outputs && Object.keys(nr.outputs).length > 0 && (
                        <p className="text-[10px] text-white/25 mt-0.5 truncate">
                          {String(Object.values(nr.outputs)[0] ?? "").slice(0, 50)}
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
    </div>
  )
}