"use client"

import { useState } from "react"
import { History, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowRunRecord } from "@/types/workflow"

const MOCK_RUNS: WorkflowRunRecord[] = [
  {
    id: "run-1",
    runNumber: 1,
    scope: "FULL",
    status: "SUCCESS",
    durationMs: 8400,
    createdAt: new Date("2026-01-14T15:45:00"),
    nodeRuns: [
      { nodeId: "n1", nodeType: "textNode", nodeLabel: "Text Node", status: "success", inputs: {}, outputs: { text: "Generate a product description..." }, error: null, durationMs: 100 },
      { nodeId: "n2", nodeType: "uploadImageNode", nodeLabel: "Upload Image", status: "success", inputs: {}, outputs: { url: "https://cdn.example.com/img.jpg" }, error: null, durationMs: 2300 },
      { nodeId: "n3", nodeType: "llmNode", nodeLabel: "LLM Node", status: "success", inputs: {}, outputs: { result: "Introducing our premium product..." }, error: null, durationMs: 4200 },
    ],
  },
  {
    id: "run-2",
    runNumber: 2,
    scope: "SINGLE",
    status: "FAILED",
    durationMs: 1200,
    createdAt: new Date("2026-01-14T16:30:00"),
    nodeRuns: [
      { nodeId: "n3", nodeType: "llmNode", nodeLabel: "LLM Node", status: "failed", inputs: {}, outputs: {}, error: "API rate limit exceeded", error: "API rate limit exceeded", durationMs: 1200 },
    ],
  },
]

function StatusBadge({ status }: { status: WorkflowRunRecord["status"] }) {
  const config = {
    SUCCESS: { color: "text-green-400 bg-green-400/10", label: "Success" },
    FAILED: { color: "text-red-400 bg-red-400/10", label: "Failed" },
    PARTIAL: { color: "text-yellow-400 bg-yellow-400/10", label: "Partial" },
    RUNNING: { color: "text-blue-400 bg-blue-400/10 animate-pulse", label: "Running" },
  }
  const c = config[status]
  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", c.color)}>
      {c.label}
    </span>
  )
}

function NodeStatusIcon({ status }: { status: string }) {
  if (status === "success") return <CheckCircle2 size={12} className="text-green-400 shrink-0" />
  if (status === "failed") return <XCircle size={12} className="text-red-400 shrink-0" />
  return <Clock size={12} className="text-yellow-400 shrink-0" />
}

export function RightSidebar() {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const runs = MOCK_RUNS

  return (
    <div className="flex flex-col h-full w-72 border-l border-[#2a2a2a] bg-[#111111] shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-[#2a2a2a]">
        <History size={14} className="text-[#a855f7]" />
        <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
          Workflow History
        </span>
      </div>

      {/* Run list */}
      <div className="flex-1 overflow-y-auto">
        {runs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-[#6b7280] text-xs">
            No runs yet
          </div>
        )}
        {runs.map((run) => (
          <div key={run.id} className="border-b border-[#1f1f1f]">
            {/* Run header */}
            <button
              className="w-full flex items-start gap-2 px-4 py-3 hover:bg-[#1a1a1a] text-left transition-colors"
              onClick={() =>
                setExpandedRun(expandedRun === run.id ? null : run.id)
              }
            >
              {expandedRun === run.id ? (
                <ChevronDown size={12} className="text-[#6b7280] mt-0.5 shrink-0" />
              ) : (
                <ChevronRight size={12} className="text-[#6b7280] mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">
                    Run #{run.runNumber}
                  </span>
                  <StatusBadge status={run.status} />
                  <span className="text-[10px] text-[#6b7280]">
                    {run.scope === "FULL" ? "Full" : run.scope === "SINGLE" ? "Single" : `${run.nodeRuns.length} nodes`}
                  </span>
                </div>
                <div className="text-[10px] text-[#6b7280] mt-0.5">
                  {run.createdAt.toLocaleString()} · {(run.durationMs / 1000).toFixed(1)}s
                </div>
              </div>
            </button>

            {/* Expanded node details */}
            {expandedRun === run.id && (
              <div className="px-4 pb-3 space-y-2">
                {run.nodeRuns.map((nr, i) => (
                  <div key={nr.nodeId} className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center pt-0.5">
                      <NodeStatusIcon status={nr.status} />
                      {i < run.nodeRuns.length - 1 && (
                        <div className="w-px flex-1 bg-[#2a2a2a] my-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#9ca3af] font-medium truncate">
                          {nr.nodeLabel}
                        </span>
                        <span className="text-[#6b7280] shrink-0">
                          {(nr.durationMs / 1000).toFixed(1)}s
                        </span>
                      </div>
                      {nr.error ? (
                        <div className="text-[10px] text-red-400 mt-0.5 truncate">
                          {nr.error}
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#6b7280] mt-0.5 truncate">
                          {Object.values(nr.outputs)[0] as string ?? "—"}
                        </div>
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
