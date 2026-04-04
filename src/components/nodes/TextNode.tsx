"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { TextCursor } from "lucide-react"
import { NodeWrapper, hs } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { TextNodeData } from "@/types"

const Y = "#FCC800"

export function TextNode({ id, data }: NodeProps) {
  const nodeData = data as TextNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  return (
    <NodeWrapper
      nodeId={id}
      title="Prompt"
      icon={<TextCursor size={11} strokeWidth={2} />}
      status={status}
      accentColor={Y}
      titleColor={Y}
    >
      {/* Input / Output row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 11, color: "var(--text-ghost)", position: "relative",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Handle type="target" position={Position.Left} id="inputText" style={hs(Y, "left")} />
          <span>Input</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Output</span>
          <Handle type="source" position={Position.Right} id="outputText" style={hs(Y, "right")} />
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={nodeData.text}
        onChange={e => updateNodeData(id, { text: e.target.value } as Partial<TextNodeData>)}
        placeholder="Write something…"
        rows={5}
        className="nowheel nodrag"
        style={{
          width: "100%",
          background: "var(--bg-input)",
          border: "1px solid var(--border-input)",
          borderRadius: 9,
          padding: "9px 11px",
          color: "var(--text-soft)",
          fontSize: 12,
          lineHeight: 1.65,
          resize: "none",
          outline: "none",
          fontFamily: "inherit",
          transition: "border-color 0.14s ease, background 0.14s ease",
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = `${Y}55`
          e.currentTarget.style.background = "var(--bg-input-hover)"
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = "var(--border-input)"
          e.currentTarget.style.background = "var(--bg-input)"
        }}
      />
    </NodeWrapper>
  )
}