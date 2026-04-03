"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Bot } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { LLMNodeData } from "@/types"

const PURPLE = "#a855f7"
const YELLOW = "#FCC800"
const BLUE = "#0080FF"

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
]

// Shared handle style factory
const handle = (color: string) => ({
  background: color,
  width: 9,
  height: 9,
  border: "2px solid var(--bg-node)",
  boxShadow: `0 0 0 3px ${color}25`,
})

export function LLMNode({ id, data }: NodeProps) {
  const nodeData = data as LLMNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()
  const isConnected = (handleId: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handleId)

  const inputRowStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--text-ghost)",
    marginBottom: 2,
  }

  const fieldStyle = (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    background: disabled ? "color-mix(in srgb, var(--bg-elevated) 65%, transparent)" : "var(--bg-elevated)",
    border: "0.5px solid var(--border)",
    borderRadius: 6,
    padding: "6px 10px",
    color: disabled ? "var(--text-ghost)" : "var(--text-soft)",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "text",
  })

  return (
    <NodeWrapper
      nodeId={id}
      title="Hailuo 2.3"
      icon={<Bot size={12} />}
      status={status}
      accentColor={PURPLE}
    >
      {/* Model selector */}
      <select
        value={nodeData.model}
        onChange={(e) =>
          updateNodeData(id, { model: e.target.value } as Partial<LLMNodeData>)
        }
        className="nodrag nowheel"
        style={{
          ...fieldStyle(false),
          appearance: "none",
          cursor: "pointer",
          paddingRight: 28,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          backgroundSize: "12px",
        }}
      >
        {MODELS.map((m) => (
          <option key={m} value={m} style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
            {m}
          </option>
        ))}
      </select>

      {/* Video output handle row */}
      <div className="flex items-center justify-end h-6 relative">
        <span style={inputRowStyle}>Video</span>
        <Handle
          type="source"
          position={Position.Right}
          id="outputVideo"
          style={{ ...handle(BLUE), right: -20 }}
        />
      </div>

      {/* Model row with input on left */}
      <div className="flex items-center justify-end h-6 relative">
        <span style={inputRowStyle}>Model</span>
      </div>

      {/* Prompt input */}
      <div className="relative">
        <Handle
          type="target"
          position={Position.Left}
          id="prompt"
          style={{ ...handle(YELLOW), left: -20, top: "50%" }}
        />
        <div style={inputRowStyle}>Prompt</div>
        <textarea
          disabled={isConnected("prompt")}
          value={nodeData.userMessage}
          onChange={(e) =>
            updateNodeData(id, {
              userMessage: e.target.value,
            } as Partial<LLMNodeData>)
          }
          placeholder="A beautiful sunset over a calm ocean"
          rows={3}
          className="nodrag nowheel"
          style={{
            ...fieldStyle(isConnected("prompt")),
            resize: "none",
          }}
        />
      </div>

      {/* System prompt */}
      <div className="relative">
        <Handle
          type="target"
          position={Position.Left}
          id="system_prompt"
          style={{ ...handle(YELLOW), left: -20, top: "50%" }}
        />
        <input
          disabled={isConnected("system_prompt")}
          value={nodeData.systemPrompt}
          onChange={(e) =>
            updateNodeData(id, {
              systemPrompt: e.target.value,
            } as Partial<LLMNodeData>)
          }
          placeholder="System prompt (optional)"
          className="nodrag nowheel"
          style={fieldStyle(isConnected("system_prompt"))}
        />
      </div>

      {/* Start Frame row */}
      <div className="relative flex items-center justify-between h-7">
        <Handle
          type="target"
          position={Position.Left}
          id="startFrame"
          style={{ ...handle(BLUE), left: -20 }}
        />
        <span style={inputRowStyle}>Start Frame</span>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-ghost)",
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--border)",
            borderRadius: 4,
            padding: "2px 8px",
          }}
        >
          Add file
        </div>
      </div>

      {/* Images handle */}
      <div className="relative flex items-center h-6">
        <Handle
          type="target"
          position={Position.Left}
          id="images"
          style={{ ...handle(BLUE), left: -20 }}
        />
        <span style={{ ...inputRowStyle, marginLeft: 4 }}>
          images{" "}
          {isConnected("images") && (
            <span style={{ color: BLUE }}>● connected</span>
          )}
        </span>
      </div>

      {/* Settings toggle */}
      <button
        className="nodrag flex items-center gap-1 w-full text-left"
        style={{
          fontSize: 11,
          color: "var(--text-ghost)",
          padding: "2px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
        Settings
      </button>

      {/* Result */}
      {nodeData.result && (
        <div
          style={{
            marginTop: 4,
            padding: "10px 12px",
            background: "var(--bg-elevated)",
            borderRadius: 8,
            border: "0.5px solid var(--border)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#4CAF50",
              marginBottom: 6,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Output
          </div>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              maxHeight: 120,
              overflowY: "auto",
            }}
          >
            {nodeData.result}
          </p>
        </div>
      )}

      {nodeData.error && (
        <div
          style={{
            padding: "8px 12px",
            background: "rgba(239,68,68,0.08)",
            borderRadius: 8,
            border: "0.5px solid rgba(239,68,68,0.3)",
          }}
        >
          <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 4 }}>
            Error
          </div>
          <p style={{ fontSize: 11, color: "rgba(239,68,68,0.8)" }}>
            {nodeData.error}
          </p>
        </div>
      )}
    </NodeWrapper>
  )
}
