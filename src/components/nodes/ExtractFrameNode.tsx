"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Film, Play, Loader2 } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { ExtractFrameNodeData } from "@/types"
import { cn } from "@/lib/utils"

export function ExtractFrameNode({ id, data }: NodeProps) {
  const nodeData = data as ExtractFrameNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()

  const isConnected = (handleId: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handleId)

  return (
    <NodeWrapper title="Extract Frame" icon={<Film size={12} />} status={status} color="#06b6d4">
      {/* video_url handle */}
      <div className="relative flex items-center h-6">
        <Handle type="target" position={Position.Left} id="video_url"
          style={{ top: "50%", background: "#f59e0b", width: 8, height: 8, border: "2px solid #1a1a1a" }} />
        <span className="text-[10px] text-[#6b7280] ml-5">
          video {isConnected("video_url") ? <span className="text-[#f59e0b]">● connected</span> : <span className="text-[#ef4444]">*</span>}
        </span>
      </div>

      {/* timestamp */}
      <div className="relative">
        <Handle type="target" position={Position.Left} id="timestamp"
          style={{ top: "50%", background: "#6b7280", width: 6, height: 6, border: "2px solid #1a1a1a" }} />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6b7280] w-16 shrink-0 ml-3">Timestamp</span>
          <input
            disabled={isConnected("timestamp")}
            value={nodeData.timestamp}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value } as Partial<ExtractFrameNodeData>)}
            placeholder="0 or 50%"
            className={cn(
              "flex-1 bg-[#111111] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white outline-none",
              "focus:border-[#06b6d4] transition-colors",
              isConnected("timestamp") && "opacity-40 cursor-not-allowed"
            )}
          />
        </div>
      </div>

      <button
        disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-xs font-medium transition-colors mt-1",
          status === "running" ? "bg-[#2a2a2a] text-[#6b7280] cursor-not-allowed" : "bg-[#06b6d4] hover:bg-[#0891b2] text-black"
        )}
        onClick={() => console.log("run extract frame", id)}
      >
        {status === "running" ? <><Loader2 size={12} className="animate-spin" /> Running...</> : <><Play size={12} /> Extract</>}
      </button>

      {nodeData.result && (
        <div className="mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nodeData.result} alt="frame" className="w-full h-24 object-cover rounded-md border border-[#2a2a2a]" />
        </div>
      )}
      {nodeData.error && (
        <p className="text-[11px] text-[#ef4444]">{nodeData.error}</p>
      )}

      <Handle type="source" position={Position.Right} id="output"
        style={{ background: "#06b6d4", width: 8, height: 8, border: "2px solid #1a1a1a" }} />
    </NodeWrapper>
  )
}
