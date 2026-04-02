"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Video, Upload, Loader2, X } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadVideoNodeData } from "@/types"
import { cn } from "@/lib/utils"

export function UploadVideoNode({ id, data }: NodeProps) {
  const nodeData = data as UploadVideoNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  const { upload, uploading, progress } = useTransloaditUpload({
    templateId: process.env.NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID!,
    accept: ".mp4,.mov,.webm,.m4v",
    onSuccess: (result) => {
      updateNodeData(id, {
        videoUrl: result.url,
        fileName: result.name,
      } as Partial<UploadVideoNodeData>)
    },
    onError: (err) => alert(err),
  })

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
            className="absolute top-1 right-1 p-0.5 bg-[#1a1a1a] text-[#9ca3af] rounded
              opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={10} />
          </button>
          <div className="text-[10px] text-[#6b7280] mt-1 truncate">{nodeData.fileName}</div>
        </div>
      ) : (
        <label className={cn(
          "flex flex-col items-center gap-1.5 py-4 border border-dashed border-[#2a2a2a]",
          "rounded-md transition-colors",
          uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#f59e0b]"
        )}>
          {uploading ? (
            <>
              <Loader2 size={16} className="text-[#f59e0b] animate-spin" />
              <span className="text-[10px] text-[#6b7280]">Uploading {progress}%</span>
              <div className="w-full px-3">
                <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#f59e0b] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <Upload size={16} className="text-[#6b7280]" />
              <span className="text-[10px] text-[#6b7280]">mp4, mov, webm, m4v</span>
            </>
          )}
          <input
            type="file"
            accept=".mp4,.mov,.webm,.m4v"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload(file)
              e.target.value = ""
            }}
          />
        </label>
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
