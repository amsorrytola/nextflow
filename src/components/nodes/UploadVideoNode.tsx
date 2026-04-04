"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { VideoIcon, Upload, LayoutGrid, Loader2, X } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadVideoNodeData } from "@/types"

const G = "#29D246"
const hs = (right?: boolean): React.CSSProperties => ({
  background: G, width: 10, height: 10,
  border: "2.5px solid var(--bg-node)",
  boxShadow: `0 0 0 2px ${G}30`,
  ...(right ? { right: -16 } : { left: -16 }),
  top: "40%",
})

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

  return (
    <NodeWrapper nodeId={id} title="Video" icon={<VideoIcon size={11} />}
      status={status} accentColor={G} titleColor={G}>
      <Handle type="source" position={Position.Right} id="outputVideo" style={hs(true)} />
      <Handle type="target" position={Position.Left}  id="video"       style={hs()} />

      {nodeData.videoUrl ? (
        <div className="nodrag" style={{ position: "relative" }}>
          <video src={nodeData.videoUrl} controls
            style={{ width: "100%", height: 156, borderRadius: 10, background: "#000", objectFit: "contain", display: "block" }} />
          <button className="nodrag" onClick={() => updateNodeData(id, { videoUrl: null, fileName: null } as Partial<UploadVideoNodeData>)}
            style={{
              position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: "50%",
              background: "rgba(0,0,0,0.72)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <X size={12} color="white" />
          </button>
          {nodeData.fileName && (
            <div style={{ fontSize: 10.5, color: "var(--text-ghost)", marginTop: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nodeData.fileName}
            </div>
          )}
        </div>
      ) : (
        <div className="nodrag" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { icon: uploading ? <Loader2 size={17} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={17} />,
              label: uploading ? `${progress}%` : "Upload", isLabel: true },
            { icon: <LayoutGrid size={17} />, label: "Select asset", isLabel: false },
          ].map((btn, i) => {
            const shared: React.CSSProperties = {
              display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
              padding: "18px 10px", borderRadius: 10,
              background: "var(--bg-input)", border: "1px solid var(--border-input)",
              color: "var(--text-ghost)", cursor: "pointer", fontSize: 11,
              transition: "background 0.15s ease, border-color 0.15s ease",
            }
            if (btn.isLabel) return (
              <label key={i} style={shared}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input-hover)"; (e.currentTarget as HTMLElement).style.borderColor = `${G}40` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-input)" }}>
                {btn.icon}<span>{btn.label}</span>
                <input type="file" accept=".mp4,.mov,.webm,.m4v" style={{ display: "none" }}
                  disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = "" }} />
              </label>
            )
            return (
              <button key={i} className="nodrag" style={shared}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input-hover)"; (e.currentTarget as HTMLElement).style.borderColor = `${G}40` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-input)" }}>
                {btn.icon}<span>{btn.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </NodeWrapper>
  )
}
