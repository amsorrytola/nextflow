"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Bot } from "lucide-react"
import { NodeWrapper, hs, FieldLabel } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { LLMNodeData } from "@/types"

const P = "#9B6FFF"    // purple — LLM accent
const Y = "#FCC800"    // yellow — text/prompt handles
const B = "#0080FF"    // blue   — image handles

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

export function LLMNode({ id, data }: NodeProps) {
  const nodeData = data as LLMNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges  = useEdges()
  const conn   = (h: string) => edges.some(e => e.target === id && e.targetHandle === h)

  const fieldInput = (disabled: boolean): React.CSSProperties => ({
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border-input)",
    borderRadius: 9,
    padding: "8px 11px",
    color: disabled ? "var(--text-ghost)" : "var(--text-soft)",
    fontSize: 12,
    outline: "none",
    opacity: disabled ? 0.38 : 1,
    cursor: disabled ? "not-allowed" : "text",
    fontFamily: "inherit",
    lineHeight: 1.55,
    transition: "border-color 0.14s ease, background 0.14s ease",
  })

  const onFocus = (accent: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = `${accent}50`
    e.currentTarget.style.background = "var(--bg-input-hover)"
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--border-input)"
    e.currentTarget.style.background = "var(--bg-input)"
  }

  return (
    <NodeWrapper nodeId={id} title="Run LLM" icon={<Bot size={11} strokeWidth={2} />} status={status} accentColor={P}>

      {/* Model selector */}
      <div>
        <FieldLabel>Model</FieldLabel>
        <select
          value={nodeData.model}
          onChange={e => updateNodeData(id, { model: e.target.value } as Partial<LLMNodeData>)}
          className="nodrag nowheel"
          style={{ ...fieldInput(false), cursor: "pointer", paddingRight: 28,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.28)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center", backgroundSize: "11px",
          }}
          onFocus={onFocus(P)}
          onBlur={onBlur}
        >
          {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* System prompt */}
      <div style={{ position: "relative" }}>
        <Handle type="target" position={Position.Left} id="system_prompt" style={hs(Y, "left", "50%")} />
        <FieldLabel>System prompt</FieldLabel>
        <input
          disabled={conn("system_prompt")}
          value={nodeData.systemPrompt}
          onChange={e => updateNodeData(id, { systemPrompt: e.target.value } as Partial<LLMNodeData>)}
          placeholder="Optional instructions…"
          className="nodrag nowheel"
          style={fieldInput(conn("system_prompt"))}
          onFocus={onFocus(Y)}
          onBlur={onBlur}
        />
      </div>

      {/* User message / prompt */}
      <div style={{ position: "relative" }}>
        <Handle type="target" position={Position.Left} id="prompt"       style={hs(Y, "left", "38px")} />
        <Handle type="target" position={Position.Left} id="user_message" style={hs(Y, "left", "38px")} />
        <FieldLabel>Prompt</FieldLabel>
        <textarea
          disabled={conn("prompt") || conn("user_message")}
          value={nodeData.userMessage}
          onChange={e => updateNodeData(id, { userMessage: e.target.value } as Partial<LLMNodeData>)}
          placeholder="What would you like to generate?"
          rows={3}
          className="nodrag nowheel"
          style={{ ...fieldInput(conn("prompt") || conn("user_message")), resize: "none" }}
          onFocus={onFocus(Y)}
          onBlur={onBlur}
        />
      </div>

      {/* Images handle */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 26 }}>
        <Handle type="target" position={Position.Left} id="images" style={hs(B, "left", "50%")} />
        <span style={{ fontSize: 11, color: "var(--text-ghost)", marginLeft: 2 }}>
          images{" "}
          {conn("images") && <span style={{ color: B }}>● connected</span>}
        </span>
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="output" style={hs(P, "right", "50%")} />

      {/* Result */}
      {nodeData.result && (
        <div style={{
          padding: "10px 12px",
          background: "rgba(41,210,70,0.055)",
          border: "1px solid rgba(41,210,70,0.16)",
          borderRadius: 10,
          animation: "fadeIn 0.22s ease",
        }}>
          <div style={{ fontSize: 9.5, color: "var(--krea-green)", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Output
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65, whiteSpace: "pre-wrap", maxHeight: 140, overflowY: "auto" }}>
            {nodeData.result}
          </p>
        </div>
      )}

      {nodeData.error && (
        <div style={{
          padding: "9px 12px",
          background: "rgba(255,69,69,0.065)",
          border: "1px solid rgba(255,69,69,0.20)",
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 9.5, color: "var(--krea-red)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Error
          </div>
          <p style={{ fontSize: 11.5, color: "rgba(255,100,100,0.82)" }}>{nodeData.error}</p>
        </div>
      )}
    </NodeWrapper>
  )
}