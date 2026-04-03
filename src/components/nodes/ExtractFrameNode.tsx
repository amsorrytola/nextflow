"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Film, Play, Loader2 } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { ExtractFrameNodeData } from "@/types"
import { cn } from "@/lib/utils"

const GREEN = "#4CAF50"
const GRAY = "#666"

export function ExtractFrameNode({ id, data }: NodeProps) {
  const nodeData = data as ExtractFrameNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()
  const isConnected = (h: string) => edges.some(e => e.target === id && e.targetHandle === h)

  return (
    <NodeWrapper nodeId={id} title="Extract Frame" icon={<Film size={13} />} status={status} accentColor={GREEN}>
      <div className="relative flex items-center h-7">
        <Handle type="target" position={Position.Left} id="video_url"
          style={{ background: GREEN, width: 10, height: 10, border: "2px solid var(--bg-node)", left: -18 }} />
        <span className="text-[12px] ml-1" style={{ color: "var(--text-muted)" }}>
          video {isConnected("video_url") ? <span style={{ color: GREEN }}>● connected</span> : <span className="text-[#ef4444]">*</span>}
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        <Handle type="target" position={Position.Left} id="timestamp"
          style={{ background: GRAY, width: 7, height: 7, border: "2px solid var(--bg-node)", left: -18 }} />
        <span className="text-[11px] w-16 shrink-0" style={{ color: "var(--text-muted)" }}>Timestamp</span>
        <input
          disabled={isConnected("timestamp")}
          value={nodeData.timestamp}
          onChange={e => updateNodeData(id, { timestamp: e.target.value } as Partial<ExtractFrameNodeData>)}
          placeholder="0 or 50%"
          className={cn(
            "flex-1 rounded-lg px-2 py-1.5 text-[12px] outline-none",
            isConnected("timestamp") && "opacity-40 cursor-not-allowed"
          )}
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>

      <button disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[13px] font-medium transition-colors mt-1",
          status === "running" ? "cursor-not-allowed" : ""
        )}
        style={status === "running"
          ? { background: "var(--bg-elevated)", color: "var(--text-muted)" }
          : { background: GREEN, color: "white" }}>
        {status === "running" ? <><Loader2 size={13} className="animate-spin" /> Running...</> : <><Play size={13} /> Extract</>}
      </button>

      {nodeData.result && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nodeData.result} alt="frame" className="w-full h-32 object-cover rounded-xl" />
      )}
      {nodeData.error && <p className="text-[12px] text-[#ef4444]">{nodeData.error}</p>}

      <Handle type="source" position={Position.Right} id="output"
        style={{ background: GREEN, width: 10, height: 10, border: "2px solid var(--bg-node)", right: -18 }} />
    </NodeWrapper>
  )
}
