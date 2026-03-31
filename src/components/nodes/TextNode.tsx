"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Type } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { TextNodeData } from "@/types"

export function TextNode({ id, data }: NodeProps) {
  const nodeData = data as TextNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  return (
    <NodeWrapper title="Text" icon={<Type size={12} />} status={status} color="#6366f1">
      <textarea
        value={nodeData.text}
        onChange={(e) =>
          updateNodeData(id, { text: e.target.value } as Partial<TextNodeData>)
        }
        placeholder="Enter text..."
        rows={3}
        className="w-full bg-[#111111] border border-[#2a2a2a] rounded-md px-2 py-1.5
          text-xs text-white placeholder:text-[#6b7280] resize-none outline-none
          focus:border-[#6366f1] transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: "#6366f1", width: 8, height: 8, border: "2px solid #1a1a1a" }}
      />
    </NodeWrapper>
  )
}
