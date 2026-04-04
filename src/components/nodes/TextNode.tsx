"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { TextCursor } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { TextNodeData } from "@/types"

const Y = "#FCC800"
const hs = (right?: boolean) => ({
  background: Y,
  width: 10, height: 10,
  border: "2.5px solid var(--bg-node)",
  boxShadow: `0 0 0 2px ${Y}30`,
  ...(right ? { right: -16 } : { left: -16 }),
})

export function TextNode({ id, data }: NodeProps) {
  const nodeData = data as TextNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  return (
    <NodeWrapper nodeId={id} title="Prompt" icon={<TextCursor size={11} />}
      status={status} accentColor={Y} titleColor={Y}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        fontSize: 11, color: "var(--text-ghost)", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Handle type="target" position={Position.Left} id="inputText" style={hs()} />
          <span>Input</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>Output</span>
          <Handle type="source" position={Position.Right} id="outputText" style={hs(true)} />
        </div>
      </div>

      <textarea
        value={nodeData.text}
        onChange={e => updateNodeData(id, { text: e.target.value } as Partial<TextNodeData>)}
        placeholder="Write something..."
        rows={5}
        className="nowheel nodrag"
        style={{
          width: "100%",
          background: "var(--bg-input)",
          border: "1px solid var(--border-input)",
          borderRadius: 8,
          padding: "9px 11px",
          color: "var(--text-soft)",
          fontSize: 12.5,
          lineHeight: 1.6,
          resize: "none",
          outline: "none",
          transition: "border-color 0.15s ease, background 0.15s ease",
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = `${Y}60`
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
