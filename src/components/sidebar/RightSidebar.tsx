"use client"

import { useState } from "react"
import { History, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import type { WorkflowRunRecord } from "@/types/workflow"

function StatusBadge({ status }: { status: WorkflowRunRecord["status"] }) {
  const config = {
    SUCCESS: { color: "text-[#4CAF50] bg-[#4CAF50]/10", label: "Success" },
    FAILED: { color: "text-[#ef4444] bg-[#ef4444]/10", label: "Failed" },
    PARTIAL: { color: "text-[#f5a623] bg-[#f5a623]/10", label: "Partial" },
    RUNNING: { color: "text-[#a855f7] bg-[#a855f7]/10 animate-pulse", label: "Running" },
  }
  const c = config[status]
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", c.color)}>
      {c.label}
    </span>
  )
}

export function RightSidebar() {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const runs = useWorkflowStore(s => s.runs)

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        className="flex flex-col items-center justify-center w-8 bg-[#1a1a1a] border-l border-[#222] text-[#555] hover:text-[#999] transition-colors">
        <History size={14} />
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full w-64 bg-[#1a1a1a] border-l border-[#222] shrink-0">
      <div className="flex items-center justify-between px-4 h-11 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <History size={13} className="text-[#666]" />
          <span className="text-xs font-medium text-[#888]">History</span>
        </div>
        <button onClick={() => setCollapsed(true)} className="text-[#555] hover:text-[#999] transition-colors">
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {runs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <History size={20} className="text-[#333]" />
            <span className="text-xs text-[#444]">No runs yet</span>
          </div>
        )}
        {runs.map((run) => (
          <div key={run.id} className="border-b border-[#1e1e1e]">
            <button
              className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-[#1e1e1e] text-left transition-colors"
              onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}>
              {expandedRun === run.id
                ? <ChevronDown size={11} className="text-[#555] mt-0.5 shrink-0" />
                : <ChevronRight size={11} className="text-[#555] mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-[#ccc] font-medium">Run #{run.runNumber}</span>
                  <StatusBadge status={run.status} />
                  <span className="text-[10px] text-[#555]">
                    {run.scope === "FULL" ? "Full" : run.scope === "SINGLE" ? "Single" : `${run.nodeRuns.length} nodes`}
                  </span>
                </div>
                <div className="text-[10px] text-[#555] mt-0.5">
                  {run.createdAt.toLocaleTimeString()} · {(run.durationMs / 1000).toFixed(1)}s
                </div>
              </div>
            </button>

            {expandedRun === run.id && (
              <div className="px-3 pb-2 space-y-1.5">
                {run.nodeRuns.map((nr, i) => (
                  <div key={nr.nodeId} className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center pt-0.5">
                      {nr.status === "success"
                        ? <CheckCircle2 size={11} className="text-[#4CAF50] shrink-0" />
                        : nr.status === "failed"
                        ? <XCircle size={11} className="text-[#ef4444] shrink-0" />
                        : <Clock size={11} className="text-[#f5a623] shrink-0" />}
                      {i < run.nodeRuns.length - 1 && <div className="w-px flex-1 bg-[#2a2a2a] my-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#888] font-medium truncate text-[11px]">{nr.nodeLabel}</span>
                        <span className="text-[#555] shrink-0 text-[10px]">{(nr.durationMs / 1000).toFixed(1)}s</span>
                      </div>
                      {nr.error
                        ? <div className="text-[10px] text-[#ef4444]/80 mt-0.5 truncate">{nr.error}</div>
                        : <div className="text-[10px] text-[#555] mt-0.5 truncate">
                            {String(Object.values(nr.outputs)[0] ?? "—").slice(0, 60)}
                          </div>}
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
