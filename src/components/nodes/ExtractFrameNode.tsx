"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Film } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { ExtractFrameNodeData } from "@/types"

const G = "#29D246"

const hs = (color: string, right?: boolean): React.CSSProperties => ({
  background: color, width: 10, height: 10,
  border: "2.5px solid var(--bg-node)",
  boxShadow: `0 0 0 2px ${color}28`,
  ...(right ? { right: -16 } : { left: -16 }),
  top: "50%",
})

export function ExtractFrameNode({ id, data }: NodeProps) {
  const nodeData = data as ExtractFrameNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()
  const conn = (h: string) => edges.some(e => e.target === id && e.targetHandle === h)

  return (
    <NodeWrapper nodeId={id} title="Extract Frame" icon={<Film size={11} />}
      status={status} accentColor={G}>

      {/* Video input */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 26 }}>
        <Handle type="target" position={Position.Left} id="video_url" style={hs(G)} />
        <span style={{ fontSize: 11, color: "var(--text-ghost)", marginLeft: 4 }}>
          video {conn("video_url")
            ? <span style={{ color: G }}>● connected</span>
            : <span style={{ color: "#FF4545" }}>*</span>}
        </span>
      </div>

      {/* Timestamp */}
      <div style={{ position: "relative" }}>
        <Handle type="target" position={Position.Left} id="timestamp"
          style={{ ...hs("rgba(255,255,255,0.25)"), width: 7, height: 7, boxShadow: "none" }} />
        <div style={{ fontSize: 10.5, color: "var(--text-ghost)", marginBottom: 3 }}>Timestamp</div>
        <input disabled={conn("timestamp")} value={nodeData.timestamp}
          onChange={e => updateNodeData(id, { timestamp: e.target.value } as Partial<ExtractFrameNodeData>)}
          placeholder="0  or  50%"
          className="nodrag nowheel"
          style={{
            width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-input)",
            borderRadius: 8, padding: "8px 11px",
            color: conn("timestamp") ? "var(--text-ghost)" : "var(--text-soft)",
            fontSize: 12.5, outline: "none", fontFamily: "inherit",
            opacity: conn("timestamp") ? 0.4 : 1,
            transition: "border-color 0.15s",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = `${G}50` }}
          onBlur={e => { e.currentTarget.style.borderColor = "var(--border-input)" }}
        />
      </div>

      {nodeData.result && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nodeData.result} alt="frame"
          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10,
            border: "1px solid var(--border)", animation: "fadeIn 0.25s ease" }} />
      )}
      {nodeData.error && <p style={{ fontSize: 11.5, color: "#FF4545" }}>{nodeData.error}</p>}

      <Handle type="source" position={Position.Right} id="output" style={hs(G, true)} />
    </NodeWrapper>
  )
}
