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
    <NodeWrapper title="Extract Frame" icon={<Film size={13} />} status={status} accentColor={GREEN}>
      <div className="relative flex items-center h-7">
        <Handle type="target" position={Position.Left} id="video_url"
          style={{ background: GREEN, width: 10, height: 10, border: "2px solid #1e1e1e", left: -18 }} />
        <span className="text-[12px] text-[#555] ml-1">
          video {isConnected("video_url") ? <span style={{ color: GREEN }}>● connected</span> : <span className="text-[#ef4444]">*</span>}
        </span>
      </div>

      <div className="relative flex items-center gap-2">
        <Handle type="target" position={Position.Left} id="timestamp"
          style={{ background: GRAY, width: 7, height: 7, border: "2px solid #1e1e1e", left: -18 }} />
        <span className="text-[11px] text-[#555] w-16 shrink-0">Timestamp</span>
        <input
          disabled={isConnected("timestamp")}
          value={nodeData.timestamp}
          onChange={e => updateNodeData(id, { timestamp: e.target.value } as Partial<ExtractFrameNodeData>)}
          placeholder="0 or 50%"
          className={cn(
            "flex-1 bg-[#2a2a2a] border border-[#333] rounded-lg px-2 py-1.5",
            "text-[12px] text-[#ddd] outline-none",
            isConnected("timestamp") && "opacity-40 cursor-not-allowed"
          )}
        />
      </div>

      <button disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[13px] font-medium transition-colors mt-1",
          status === "running" ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed" : "bg-[#4CAF50] hover:bg-[#3d9f40] text-white"
        )}>
        {status === "running" ? <><Loader2 size={13} className="animate-spin" /> Running...</> : <><Play size={13} /> Extract</>}
      </button>

      {nodeData.result && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nodeData.result} alt="frame" className="w-full h-32 object-cover rounded-xl" />
      )}
      {nodeData.error && <p className="text-[12px] text-[#ef4444]">{nodeData.error}</p>}

      <Handle type="source" position={Position.Right} id="output"
        style={{ background: GREEN, width: 10, height: 10, border: "2px solid #1e1e1e", right: -18 }} />
    </NodeWrapper>
  )
}
