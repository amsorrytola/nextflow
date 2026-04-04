"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Bot } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { LLMNodeData } from "@/types"

const P = "#9B6FFF"
const Y = "#FCC800"
const B = "#0080FF"

const hs = (color: string, right?: boolean, top?: string): React.CSSProperties => ({
  background: color, width: 10, height: 10,
  border: "2.5px solid var(--bg-node)",
  boxShadow: `0 0 0 2px ${color}28`,
  ...(right ? { right: -16 } : { left: -16 }),
  ...(top ? { top } : {}),
})

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

const inputStyle = (focused = false, disabled = false): React.CSSProperties => ({
  width: "100%",
  background: focused ? "var(--bg-input-hover)" : "var(--bg-input)",
  border: `1px solid ${focused ? "rgba(155,111,255,0.40)" : "var(--border-input)"}`,
  borderRadius: 8,
  padding: "8px 11px",
  color: disabled ? "var(--text-ghost)" : "var(--text-soft)",
  fontSize: 12.5,
  outline: "none",
  opacity: disabled ? 0.45 : 1,
  cursor: disabled ? "not-allowed" : "text",
  transition: "border-color 0.15s ease, background 0.15s ease",
  fontFamily: "inherit",
})

export function LLMNode({ id, data }: NodeProps) {
  const nodeData = data as LLMNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()
  const conn = (h: string) => edges.some(e => e.target === id && e.targetHandle === h)

  const label = (text: string) => (
    <div style={{ fontSize: 11, color: "var(--text-ghost)", marginBottom: 3, letterSpacing: "0.01em" }}>
      {text}
    </div>
  )

  return (
    <NodeWrapper nodeId={id} title="Run LLM" icon={<Bot size={11} />}
      status={status} accentColor={P}>

      {/* Model selector */}
      <select value={nodeData.model}
        onChange={e => updateNodeData(id, { model: e.target.value } as Partial<LLMNodeData>)}
        className="nodrag nowheel"
        style={{ ...inputStyle(), cursor: "pointer", paddingRight: 28,
          
        }}>
        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* System prompt */}
      <div style={{ position: "relative" }}>
        <Handle type="target" position={Position.Left} id="system_prompt" style={hs(Y, false, "50%")} />
        {label("System prompt")}
        <input disabled={conn("system_prompt")} value={nodeData.systemPrompt}
          onChange={e => updateNodeData(id, { systemPrompt: e.target.value } as Partial<LLMNodeData>)}
          placeholder="Optional instructions..."
          className="nodrag nowheel"
          style={inputStyle(false, conn("system_prompt"))}
          onFocus={e => { e.currentTarget.style.borderColor = `${Y}50`; e.currentTarget.style.background = "var(--bg-input-hover)" }}
          onBlur={e => { e.currentTarget.style.borderColor = "var(--border-input)"; e.currentTarget.style.background = "var(--bg-input)" }}
        />
      </div>

      {/* User message / prompt */}
      <div style={{ position: "relative" }}>
        <Handle type="target" position={Position.Left} id="prompt" style={hs(Y, false, "36px")} />
        <Handle type="target" position={Position.Left} id="user_message" style={hs(Y, false, "36px")} />
        {label("Prompt")}
        <textarea disabled={conn("prompt") || conn("user_message")}
          value={nodeData.userMessage}
          onChange={e => updateNodeData(id, { userMessage: e.target.value } as Partial<LLMNodeData>)}
          placeholder="What would you like to generate?"
          rows={3} className="nodrag nowheel"
          style={{ ...inputStyle(false, conn("prompt") || conn("user_message")), resize: "none", lineHeight: 1.6 }}
          onFocus={e => { e.currentTarget.style.borderColor = `${Y}50`; e.currentTarget.style.background = "var(--bg-input-hover)" }}
          onBlur={e => { e.currentTarget.style.borderColor = "var(--border-input)"; e.currentTarget.style.background = "var(--bg-input)" }}
        />
      </div>

      {/* Images handle */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 28 }}>
        <Handle type="target" position={Position.Left} id="images" style={hs(B, false, "50%")} />
        <span style={{ fontSize: 11, color: "var(--text-ghost)", marginLeft: 4 }}>
          images {conn("images") && <span style={{ color: B }}>● connected</span>}
        </span>
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="output" style={hs(P, true, "50%")} />

      {/* Result */}
      {nodeData.result && (
        <div style={{
          marginTop: 2, padding: "10px 12px", background: "rgba(41,210,70,0.06)",
          borderRadius: 10, border: "1px solid rgba(41,210,70,0.18)",
          animation: "fadeIn 0.25s ease",
        }}>
          <div style={{ fontSize: 10, color: "#29D246", marginBottom: 5, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.06em" }}>Output</div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65,
            whiteSpace: "pre-wrap", maxHeight: 140, overflowY: "auto" }}>
            {nodeData.result}
          </p>
        </div>
      )}
      {nodeData.error && (
        <div style={{ padding: "9px 12px", background: "rgba(255,69,69,0.07)",
          borderRadius: 10, border: "1px solid rgba(255,69,69,0.22)" }}>
          <div style={{ fontSize: 10, color: "#FF4545", marginBottom: 4, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.06em" }}>Error</div>
          <p style={{ fontSize: 11.5, color: "rgba(255,100,100,0.85)" }}>{nodeData.error}</p>
        </div>
      )}
    </NodeWrapper>
  )
}
