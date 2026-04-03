"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Crop, Play, Loader2 } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { CropImageNodeData } from "@/types"
import { cn } from "@/lib/utils"

const BLUE = "#4d9de0"
const GRAY = "#666"

export function CropImageNode({ id, data }: NodeProps) {
  const nodeData = data as CropImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()
  const isConnected = (h: string) => edges.some(e => e.target === id && e.targetHandle === h)
  const update = (field: keyof CropImageNodeData, value: unknown) =>
    updateNodeData(id, { [field]: value } as Partial<CropImageNodeData>)

  const params = [
    { id: "x_percent", label: "X offset", key: "xPercent" as keyof CropImageNodeData },
    { id: "y_percent", label: "Y offset", key: "yPercent" as keyof CropImageNodeData },
    { id: "width_percent", label: "Width", key: "widthPercent" as keyof CropImageNodeData },
    { id: "height_percent", label: "Height", key: "heightPercent" as keyof CropImageNodeData },
  ]

  return (
    <NodeWrapper nodeId={id} title="Crop Image" icon={<Crop size={13} />} status={status} accentColor={BLUE}>
      {/* image input */}
      <div className="relative flex items-center h-7">
        <Handle type="target" position={Position.Left} id="image_url"
          style={{ background: BLUE, width: 10, height: 10, border: "2px solid var(--bg-node)", left: -18 }} />
        <span className="text-[12px] ml-1" style={{ color: "var(--text-muted)" }}>
          image {isConnected("image_url") ? <span style={{ color: BLUE }}>● connected</span> : <span className="text-[#ef4444]">*</span>}
        </span>
      </div>

      {/* Crop params */}
      {params.map(p => (
        <div key={p.id} className="relative flex items-center gap-2">
          <Handle type="target" position={Position.Left} id={p.id}
            style={{ background: GRAY, width: 7, height: 7, border: "2px solid var(--bg-node)", left: -18 }} />
          <span className="text-[11px] w-16 shrink-0" style={{ color: "var(--text-muted)" }}>{p.label}</span>
          <input type="number" min={0} max={100}
            disabled={isConnected(p.id)}
            value={nodeData[p.key] as number}
            onChange={e => update(p.key, Number(e.target.value))}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-[12px] outline-none text-right",
              isConnected(p.id) && "opacity-40 cursor-not-allowed"
            )}
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>%</span>
        </div>
      ))}

      <button disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[13px] font-medium transition-colors mt-1",
          status === "running" ? "cursor-not-allowed" : ""
        )}
        style={status === "running"
          ? { background: "var(--bg-elevated)", color: "var(--text-muted)" }
          : { background: BLUE, color: "white" }}>
        {status === "running" ? <><Loader2 size={13} className="animate-spin" /> Running...</> : <><Play size={13} /> Crop</>}
      </button>

      {nodeData.result && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nodeData.result} alt="cropped" className="w-full h-32 object-cover rounded-xl" />
      )}
      {nodeData.error && <p className="text-[12px] text-[#ef4444]">{nodeData.error}</p>}

      <Handle type="source" position={Position.Right} id="output"
        style={{ background: BLUE, width: 10, height: 10, border: "2px solid var(--bg-node)", right: -18 }} />
    </NodeWrapper>
  )
}
