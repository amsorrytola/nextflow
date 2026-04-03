"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Video, Upload, Film, Loader2, X } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTransloaditUpload } from "@/hooks/useTransloaditUpload"
import type { UploadVideoNodeData } from "@/types"

const GREEN = "#29D246"

const handleStyle = {
  background: GREEN,
  width: 9,
  height: 9,
  border: "2px solid #1c1c1c",
  boxShadow: `0 0 0 3px ${GREEN}25`,
}

export function UploadVideoNode({ id, data }: NodeProps) {
  const nodeData = data as UploadVideoNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"

  const { upload, uploading, progress } = useTransloaditUpload({
    templateId: process.env.NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID!,
    accept: ".mp4,.mov,.webm,.m4v",
    onSuccess: (result) =>
      updateNodeData(id, {
        videoUrl: result.url,
        fileName: result.name,
      } as Partial<UploadVideoNodeData>),
    onError: (err) => alert(err),
  })

  return (
    <NodeWrapper
      title="Video"
      icon={<Video size={12} />}
      status={status}
      accentColor={GREEN}
      titleColor={GREEN}
    >
      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="outputVideo"
        style={{ ...handleStyle, right: -20, top: "40%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="video"
        style={{ ...handleStyle, left: -20, top: "40%" }}
      />

      {nodeData.videoUrl ? (
        <div className="relative group nodrag">
          <video
            src={nodeData.videoUrl}
            controls
            style={{
              width: "100%",
              height: 160,
              borderRadius: 8,
              background: "#000",
              objectFit: "contain",
              display: "block",
            }}
          />
          <button
            className="nodrag"
            onClick={() =>
              updateNodeData(id, {
                videoUrl: null,
                fileName: null,
              } as Partial<UploadVideoNodeData>)
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
            }}
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
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              cursor: uploading ? "not-allowed" : "pointer",
              opacity: uploading ? 0.5 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              !uploading && ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")
            }
          >
            {uploading ? (
              <Loader2 size={18} color="rgba(255,255,255,0.3)" style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Upload size={18} color="rgba(255,255,255,0.3)" />
            )}
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {uploading ? `${progress}%` : "Upload"}
            </span>
            <input
              type="file"
              accept=".mp4,.mov,.webm,.m4v"
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
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")
            }
          >
            <Film size={18} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              Select asset
            </span>
          </button>
        </div>
      )}

      {nodeData.fileName && (
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
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