"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Image as ImageIcon, Upload, Film, Loader2, X } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadImageNodeData } from "@/types"

const BLUE = "#0080FF"

const handleStyle = {
  background: BLUE,
  width: 9,
  height: 9,
  border: "2px solid var(--bg-node)",
  boxShadow: `0 0 0 3px ${BLUE}25`,
}

export function UploadImageNode({ id, data }: NodeProps) {
  const nodeData = data as UploadImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  const { upload, uploading, progress } = useTransloaditUpload({
    templateId: process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID!,
    accept: ".jpg,.jpeg,.png,.webp,.gif",
    onSuccess: (result) =>
      updateNodeData(id, {
        imageUrl: result.url,
        fileName: result.name,
      } as Partial<UploadImageNodeData>),
    onError: (err) => alert(err),
  })

  return (
    <NodeWrapper
      nodeId={id}
      title="Image"
      icon={<ImageIcon size={12} />}
      status={status}
      accentColor={BLUE}
      titleColor={BLUE}
    >
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="outputImage"
        style={{ ...handleStyle, right: -20, top: "40%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        style={{ ...handleStyle, left: -20, top: "40%" }}
      />

      {nodeData.imageUrl ? (
        <div className="relative group nodrag">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={nodeData.imageUrl}
            alt="uploaded"
            draggable={false}
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              borderRadius: 8,
              display: "block",
            }}
          />
          <button
            className="nodrag"
            onClick={() =>
              updateNodeData(id, {
                imageUrl: null,
                fileName: null,
              } as Partial<UploadImageNodeData>)
            }
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.7)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0")}
          >
            <X size={11} color="white" />
          </button>
        </div>
      ) : (
        <div
          className="nodrag"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "20px 8px",
              borderRadius: 8,
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border)",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.5 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              !uploading && ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated-hover)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")
            }
          >
            {uploading ? (
              <Loader2 size={18} color="var(--text-ghost)" style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Upload size={18} color="var(--text-ghost)" />
            )}
            <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>
              {uploading ? `${progress}%` : "Upload"}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload(f)
                e.target.value = ""
              }}
            />
          </label>

          <button
            className="nodrag"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "20px 8px",
              borderRadius: 8,
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--border)",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated-hover)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)")
            }
          >
            <Film size={18} color="var(--text-ghost)" />
            <span style={{ fontSize: 11, color: "var(--text-ghost)" }}>
              Select asset
            </span>
          </button>
        </div>
      )}

      {nodeData.fileName && (
        <span
          style={{
            fontSize: 10,
            color: "var(--text-ghost)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 2px",
          }}
        >
          {nodeData.fileName}
        </span>
      )}
    </NodeWrapper>
  )
}
