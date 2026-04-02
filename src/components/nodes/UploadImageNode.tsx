"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Image as ImageIcon, Upload, Loader2, X } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadImageNodeData } from "@/types"
import { cn } from "@/lib/utils"

export function UploadImageNode({ id, data }: NodeProps) {
  const nodeData = data as UploadImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  const { upload, uploading, progress } = useTransloaditUpload({
    templateId: process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID!,
    accept: ".jpg,.jpeg,.png,.webp,.gif",
    onSuccess: (result) => {
      updateNodeData(id, {
        imageUrl: result.url,
        fileName: result.name,
      } as Partial<UploadImageNodeData>)
    },
    onError: (err) => alert(err),
  })

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
          uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#ec4899]"
        )}>
          {uploading ? (
            <>
              <Loader2 size={16} className="text-[#ec4899] animate-spin" />
              <span className="text-[10px] text-[#6b7280]">Uploading {progress}%</span>
              <div className="w-full px-3">
                <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ec4899] rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <Upload size={16} className="text-[#6b7280]" />
              <span className="text-[10px] text-[#6b7280]">jpg, jpeg, png, webp, gif</span>
            </>
          )}
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif"
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
        style={{ background: "#ec4899", width: 8, height: 8, border: "2px solid #1a1a1a" }}
      />
    </NodeWrapper>
  )
}
