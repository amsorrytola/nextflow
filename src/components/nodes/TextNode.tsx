"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { TextCursor } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { TextNodeData } from "@/types"

const YELLOW = "#FCC800"

export function TextNode({ id, data }: NodeProps) {
  const nodeData = data as TextNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  return (
    <NodeWrapper
      title="Prompt"
      icon={<TextCursor size={12} />}
      status={status}
      accentColor={YELLOW}
      titleColor={YELLOW}
    >
      {/* Input / Output label row */}
      <div className="flex items-center justify-between text-[11px] relative" style={{ color: "rgba(255,255,255,0.3)" }}>
        <div className="flex items-center gap-1.5">
          <Handle
            type="target"
            position={Position.Left}
            id="inputText"
            style={{
              background: YELLOW,
              width: 9,
              height: 9,
              border: "2px solid #1c1c1c",
              left: -20,
              boxShadow: `0 0 0 3px ${YELLOW}25`,
            }}
          />
          <span>Input</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Output</span>
          <Handle
            type="source"
            position={Position.Right}
            id="outputText"
            style={{
              background: YELLOW,
              width: 9,
              height: 9,
              border: "2px solid #1c1c1c",
              right: -20,
              boxShadow: `0 0 0 3px ${YELLOW}25`,
            }}
          />
        </div>
      </div>

      {/* Textarea — nowheel prevents canvas scroll stealing, nodrag not set so node stays draggable */}
      <textarea
        value={nodeData.text}
        onChange={(e) =>
          updateNodeData(id, { text: e.target.value } as Partial<TextNodeData>)
        }
        placeholder="Write something..."
        rows={5}
        className="nowheel nodrag"
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "8px 10px",
          color: "rgba(255,255,255,0.75)",
          fontSize: 12,
          fontFamily: "inherit",
          resize: "none",
          outline: "none",
          lineHeight: 1.6,
        }}
      />
    </NodeWrapper>
  )
}