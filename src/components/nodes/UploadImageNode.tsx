"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Image as ImageIcon, Upload } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { UploadImageNodeData } from "@/types"

export function UploadImageNode({ id, data }: NodeProps) {
  const nodeData = data as UploadImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  return (
    <NodeWrapper title="Upload Image" icon={<ImageIcon size={12} />} status={status} color="#ec4899">
      {nodeData.imageUrl ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nodeData.imageUrl}
            alt="uploaded"
            className="w-full h-32 object-cover rounded-md border border-[#2a2a2a]"
          />
          <button
            onClick={() => updateNodeData(id, { imageUrl: null, fileName: null } as Partial<UploadImageNodeData>)}
            className="absolute top-1 right-1 bg-[#1a1a1a] text-[#9ca3af] rounded px-1.5 py-0.5 text-[10px]
              opacity-0 group-hover:opacity-100 transition-opacity"
          >
            remove
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-1.5 py-4 border border-dashed border-[#2a2a2a]
          rounded-md cursor-pointer hover:border-[#ec4899] transition-colors">
          <Upload size={16} className="text-[#6b7280]" />
          <span className="text-[10px] text-[#6b7280]">jpg, jpeg, png, webp, gif</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const url = URL.createObjectURL(file)
                updateNodeData(id, { imageUrl: url, fileName: file.name } as Partial<UploadImageNodeData>)
              }
            }}
          />
        </label>
      )}
      {nodeData.fileName && (
        <span className="text-[10px] text-[#6b7280] truncate">{nodeData.fileName}</span>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: "#ec4899", width: 8, height: 8, border: "2px solid #1a1a1a" }}
      />
    </NodeWrapper>
  )
}
