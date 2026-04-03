"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Type } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { TextNodeData } from "@/types"

const YELLOW = "#f5a623"

export function TextNode({ id, data }: NodeProps) {
  const nodeData = data as TextNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  return (
    <NodeWrapper title="Prompt" icon={<Type size={13} />} status={status}
      accentColor={YELLOW} titleColor={YELLOW}>
      {/* Input handle row */}
      <div className="flex items-center justify-between text-xs text-[#666] relative">
        <div className="flex items-center gap-1.5">
          <Handle type="target" position={Position.Left} id="input"
            style={{ background: YELLOW, width: 10, height: 10, border: "2px solid #1e1e1e", left: -18 }} />
          <span>Input</span>
        </div>
        <span>Output</span>
        <Handle type="source" position={Position.Right} id="output"
          style={{ background: YELLOW, width: 10, height: 10, border: "2px solid #1e1e1e", right: -18 }} />
      </div>

      {/* Action icons */}
      <div className="flex items-center justify-between opacity-40">
        <span className="text-[#999] text-xs">✏</span>
        <span className="text-[#999] text-xs">⧉</span>
      </div>

      {/* Textarea */}
      <textarea
        value={nodeData.text}
        onChange={e => updateNodeData(id, { text: e.target.value } as Partial<TextNodeData>)}
        placeholder="Write something..."
        rows={5}
        className="w-full bg-transparent text-[13px] text-[#ddd] placeholder:text-[#444]
          resize-none outline-none leading-relaxed"
      />
    </NodeWrapper>
  )
}
