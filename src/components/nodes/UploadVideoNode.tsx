"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { VideoIcon, Upload, LayoutGrid, Loader2, X } from "lucide-react"
import { NodeWrapper, hs } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadVideoNodeData } from "@/types"

const G = "#29D246"

export function UploadVideoNode({ id, data }: NodeProps) {
  const nodeData = data as UploadVideoNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  const { upload, uploading, progress } = useTransloaditUpload({
    templateId: process.env.NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID!,
    accept: ".mp4,.mov,.webm,.m4v",
    onSuccess: r => updateNodeData(id, { videoUrl: r.url, fileName: r.name } as Partial<UploadVideoNodeData>),
    onError: err => alert(err),
  })

  const slotStyle: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7,
    padding: "18px 10px",
    borderRadius: 10,
    background: "var(--bg-input)",
    border: "1px solid var(--border-input)",
    color: "var(--text-ghost)",
    fontSize: 11,
    cursor: "pointer",
    transition: "background 0.14s ease, border-color 0.14s ease",
  }
  const slotHover = (e: React.MouseEvent, enter: boolean) => {
    const el = e.currentTarget as HTMLElement
    el.style.background = enter ? "var(--bg-input-hover)" : "var(--bg-input)"
    el.style.borderColor = enter ? `${G}44` : "var(--border-input)"
  }

  return (
    <NodeWrapper nodeId={id} title="Video" icon={<VideoIcon size={11} strokeWidth={2} />}
      status={status} accentColor={G} titleColor={G}>

      {/* Handles */}
      <Handle type="source" position={Position.Right} id="outputVideo" style={{ ...hs(G, "right"), top: "40%" }} />
      <Handle type="target" position={Position.Left}  id="video"       style={{ ...hs(G, "left"),  top: "40%" }} />

      {nodeData.videoUrl ? (
        <div className="nodrag" style={{ position: "relative" }}>
          <video
            src={nodeData.videoUrl} controls
            style={{ width: "100%", height: 156, borderRadius: 9, background: "#000", objectFit: "contain", display: "block", border: "1px solid var(--border)" }}
          />
          <button
            className="nodrag"
            onClick={() => updateNodeData(id, { videoUrl: null, fileName: null } as Partial<UploadVideoNodeData>)}
            style={{
              position: "absolute", top: 7, right: 7,
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(0,0,0,0.72)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={11} color="rgba(255,255,255,0.80)" />
          </button>
          {nodeData.fileName && (
            <div style={{ fontSize: 10.5, color: "var(--text-ghost)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nodeData.fileName}
            </div>
          )}
        </div>
      ) : (
        <div className="nodrag" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <label
            style={{ ...slotStyle, cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.55 : 1 }}
            onMouseEnter={e => !uploading && slotHover(e, true)}
            onMouseLeave={e => slotHover(e, false)}
          >
            {uploading
              ? <Loader2 size={18} style={{ color: "var(--text-ghost)", animation: "spin 1s linear infinite" }} />
              : <Upload size={18} style={{ color: "var(--text-ghost)" }} />}
            <span>{uploading ? `${progress}%` : "Upload"}</span>
            <input type="file" accept=".mp4,.mov,.webm,.m4v" style={{ display: "none" }}
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = "" }} />
          </label>

          <button
            className="nodrag"
            style={slotStyle}
            onMouseEnter={e => slotHover(e, true)}
            onMouseLeave={e => slotHover(e, false)}
          >
            <LayoutGrid size={18} style={{ color: "var(--text-ghost)" }} />
            <span>Select asset</span>
          </button>
        </div>
      )}
    </NodeWrapper>
  )
}