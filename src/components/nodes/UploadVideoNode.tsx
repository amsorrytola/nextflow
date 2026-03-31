"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Video, Upload } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { UploadVideoNodeData } from "@/types"

export function UploadVideoNode({ id, data }: NodeProps) {
  const nodeData = data as UploadVideoNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  return (
    <NodeWrapper title="Upload Video" icon={<Video size={12} />} status={status} color="#f59e0b">
      {nodeData.videoUrl ? (
        <div className="relative group">
          <video
            src={nodeData.videoUrl}
            controls
            className="w-full h-32 rounded-md border border-[#2a2a2a] bg-black"
          />
          <button
            onClick={() => updateNodeData(id, { videoUrl: null, fileName: null } as Partial<UploadVideoNodeData>)}
            className="absolute top-1 right-1 bg-[#1a1a1a] text-[#9ca3af] rounded px-1.5 py-0.5 text-[10px]
              opacity-0 group-hover:opacity-100 transition-opacity"
          >
            remove
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-1.5 py-4 border border-dashed border-[#2a2a2a]
          rounded-md cursor-pointer hover:border-[#f59e0b] transition-colors">
          <Upload size={16} className="text-[#6b7280]" />
          <span className="text-[10px] text-[#6b7280]">mp4, mov, webm, m4v</span>
          <input
            type="file"
            accept=".mp4,.mov,.webm,.m4v"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const url = URL.createObjectURL(file)
                updateNodeData(id, { videoUrl: url, fileName: file.name } as Partial<UploadVideoNodeData>)
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
        style={{ background: "#f59e0b", width: 8, height: 8, border: "2px solid #1a1a1a" }}
      />
    </NodeWrapper>
  )
}
