"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Image as ImageIcon, Upload, Loader2, X } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadImageNodeData } from "@/types"
import { cn } from "@/lib/utils"

const BLUE = "#4d9de0"

export function UploadImageNode({ id, data }: NodeProps) {
  const nodeData = data as UploadImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  const { upload, uploading, progress } = useTransloaditUpload({
    templateId: process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID!,
    accept: ".jpg,.jpeg,.png,.webp,.gif",
    onSuccess: (result) => updateNodeData(id, { imageUrl: result.url, fileName: result.name } as Partial<UploadImageNodeData>),
    onError: (err) => alert(err),
  })

  return (
    <NodeWrapper title="Image" icon={<ImageIcon size={13} />} status={status}
      accentColor={BLUE} titleColor={BLUE}>
      <Handle type="source" position={Position.Right} id="output"
        style={{ background: BLUE, width: 10, height: 10, border: "2px solid #1e1e1e", right: -18 }} />
      <Handle type="target" position={Position.Left} id="input"
        style={{ background: BLUE, width: 10, height: 10, border: "2px solid #1e1e1e", left: -18 }} />

      {nodeData.imageUrl ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nodeData.imageUrl} alt="uploaded"
            className="w-full h-40 object-cover rounded-xl border border-[#2a2a2a]" />
          <button
            onClick={() => updateNodeData(id, { imageUrl: null, fileName: null } as Partial<UploadImageNodeData>)}
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center
              opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={12} className="text-white" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <label className={cn(
            "flex flex-col items-center gap-2 py-5 rounded-xl bg-[#252525] cursor-pointer",
            "hover:bg-[#2a2a2a] transition-colors border border-transparent hover:border-[#333]",
            uploading && "opacity-50 cursor-not-allowed"
          )}>
            {uploading
              ? <Loader2 size={18} className="text-[#555] animate-spin" />
              : <Upload size={18} className="text-[#555]" />}
            <span className="text-[11px] text-[#555]">
              {uploading ? `${progress}%` : "Upload"}
            </span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden"
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = "" }} />
          </label>
          <button className="flex flex-col items-center gap-2 py-5 rounded-xl bg-[#252525]
            hover:bg-[#2a2a2a] transition-colors border border-transparent hover:border-[#333]">
            <ImageIcon size={18} className="text-[#555]" />
            <span className="text-[11px] text-[#555]">Select asset</span>
          </button>
        </div>
      )}
      {nodeData.fileName && (
        <span className="text-[10px] text-[#555] truncate px-1">{nodeData.fileName}</span>
      )}
    </NodeWrapper>
  )
}
