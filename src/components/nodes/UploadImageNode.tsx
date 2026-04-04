"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { ImageIcon, Upload, LayoutGrid, Loader2, X } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadImageNodeData } from "@/types"

const B = "#0080FF"
const hs = (right?: boolean): React.CSSProperties => ({
  background: B, width: 10, height: 10,
  border: "2.5px solid var(--bg-node)",
  boxShadow: `0 0 0 2px ${B}30`,
  ...(right ? { right: -16 } : { left: -16 }),
  top: "40%",
})

export function UploadImageNode({ id, data }: NodeProps) {
  const nodeData = data as UploadImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const { upload, uploading, progress } = useTransloaditUpload({
    templateId: process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID!,
    accept: ".jpg,.jpeg,.png,.webp,.gif",
    onSuccess: r => updateNodeData(id, { imageUrl: r.url, fileName: r.name } as Partial<UploadImageNodeData>),
    onError: err => alert(err),
  })

  return (
    <NodeWrapper nodeId={id} title="Image" icon={<ImageIcon size={11} />}
      status={status} accentColor={B} titleColor={B}>
      <Handle type="source" position={Position.Right} id="outputImage" style={hs(true)} />
      <Handle type="target" position={Position.Left}  id="image"       style={hs()} />

      {nodeData.imageUrl ? (
        <div className="nodrag" style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nodeData.imageUrl} alt="uploaded" draggable={false}
            style={{ width: "100%", height: 156, objectFit: "cover", borderRadius: 10, display: "block" }} />
          <button className="nodrag" onClick={() => updateNodeData(id, { imageUrl: null, fileName: null } as Partial<UploadImageNodeData>)}
            style={{
              position: "absolute", top: 7, right: 7, width: 24, height: 24, borderRadius: "50%",
              background: "rgba(0,0,0,0.72)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(8px)",
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
            const sharedStyle: React.CSSProperties = {
              display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
              padding: "18px 10px", borderRadius: 10,
              background: "var(--bg-input)",
              border: "1px solid var(--border-input)",
              color: "var(--text-ghost)",
              cursor: i === 0 && uploading ? "not-allowed" : "pointer",
              transition: "background 0.15s ease, border-color 0.15s ease",
              fontSize: 11,
            }
            if (btn.isLabel) return (
              <label key={i} style={sharedStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input-hover)"; (e.currentTarget as HTMLElement).style.borderColor = `${B}40` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-input)" }}>
                {btn.icon}<span>{btn.label}</span>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" style={{ display: "none" }}
                  disabled={uploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = "" }} />
              </label>
            )
            return (
              <button key={i} className="nodrag" style={sharedStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-input-hover)"; (e.currentTarget as HTMLElement).style.borderColor = `${B}40` }}
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
