"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Crop } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { CropImageNodeData } from "@/types"

const B = "#0080FF"

const hs = (color: string, right?: boolean): React.CSSProperties => ({
  background: color, width: 10, height: 10,
  border: "2.5px solid var(--bg-node)",
  boxShadow: `0 0 0 2px ${color}28`,
  ...(right ? { right: -16 } : { left: -16 }),
  top: "50%",
})

const PARAMS = [
  { id: "x_percent",      label: "X",      key: "xPercent"      },
  { id: "y_percent",      label: "Y",      key: "yPercent"      },
  { id: "width_percent",  label: "Width",  key: "widthPercent"  },
  { id: "height_percent", label: "Height", key: "heightPercent" },
] as const

export function CropImageNode({ id, data }: NodeProps) {
  const nodeData = data as CropImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()
  const conn = (h: string) => edges.some(e => e.target === id && e.targetHandle === h)

  return (
    <NodeWrapper nodeId={id} title="Crop Image" icon={<Crop size={11} />}
      status={status} accentColor={B}>

      {/* Image input */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: 26 }}>
        <Handle type="target" position={Position.Left} id="image_url" style={hs(B)} />
        <span style={{ fontSize: 11, color: "var(--text-ghost)", marginLeft: 4 }}>
          image {conn("image_url")
            ? <span style={{ color: B }}>● connected</span>
            : <span style={{ color: "#FF4545" }}>*</span>}
        </span>
      </div>

      {/* Crop params */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
        {PARAMS.map(p => (
          <div key={p.id} style={{ position: "relative" }}>
            <Handle type="target" position={Position.Left} id={p.id}
              style={{ ...hs("rgba(255,255,255,0.25)"), width: 7, height: 7, boxShadow: "none" }} />
            <div style={{ fontSize: 10.5, color: "var(--text-ghost)", marginBottom: 3 }}>{p.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="number" min={0} max={100}
                disabled={conn(p.id)}
                value={nodeData[p.key]}
                onChange={e => updateNodeData(id, { [p.key]: Number(e.target.value) } as Partial<CropImageNodeData>)}
                className="nodrag nowheel"
                style={{
                  flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-input)",
                  borderRadius: 7, padding: "5px 8px",
                  color: conn(p.id) ? "var(--text-ghost)" : "var(--text-soft)",
                  fontSize: 12, outline: "none", textAlign: "right",
                  opacity: conn(p.id) ? 0.4 : 1, fontFamily: "inherit",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = `${B}50` }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--border-input)" }}
              />
              <span style={{ fontSize: 10.5, color: "var(--text-ghost)" }}>%</span>
            </div>
          </div>
        ))}
      </div>

      {nodeData.result && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nodeData.result} alt="cropped"
          style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10,
            border: "1px solid var(--border)", animation: "fadeIn 0.25s ease" }} />
      )}
      {nodeData.error && (
        <p style={{ fontSize: 11.5, color: "#FF4545" }}>{nodeData.error}</p>
      )}

      <Handle type="source" position={Position.Right} id="output" style={hs(B, true)} />
    </NodeWrapper>
  )
}
