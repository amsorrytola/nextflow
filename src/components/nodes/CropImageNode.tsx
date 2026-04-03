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
    <NodeWrapper title="Crop Image" icon={<Crop size={13} />} status={status} accentColor={BLUE}>
      {/* image input */}
      <div className="relative flex items-center h-7">
        <Handle type="target" position={Position.Left} id="image_url"
          style={{ background: BLUE, width: 10, height: 10, border: "2px solid #1e1e1e", left: -18 }} />
        <span className="text-[12px] text-[#555] ml-1">
          image {isConnected("image_url") ? <span style={{ color: BLUE }}>● connected</span> : <span className="text-[#ef4444]">*</span>}
        </span>
      </div>

      {/* Crop params */}
      {params.map(p => (
        <div key={p.id} className="relative flex items-center gap-2">
          <Handle type="target" position={Position.Left} id={p.id}
            style={{ background: GRAY, width: 7, height: 7, border: "2px solid #1e1e1e", left: -18 }} />
          <span className="text-[11px] text-[#555] w-16 shrink-0">{p.label}</span>
          <input type="number" min={0} max={100}
            disabled={isConnected(p.id)}
            value={nodeData[p.key] as number}
            onChange={e => update(p.key, Number(e.target.value))}
            className={cn(
              "flex-1 bg-[#2a2a2a] border border-[#333] rounded-lg px-2 py-1.5",
              "text-[12px] text-[#ddd] outline-none text-right",
              isConnected(p.id) && "opacity-40 cursor-not-allowed"
            )}
          />
          <span className="text-[11px] text-[#555]">%</span>
        </div>
      ))}

      <button disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[13px] font-medium transition-colors mt-1",
          status === "running" ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed" : "bg-[#4d9de0] hover:bg-[#3d8dd0] text-white"
        )}>
        {status === "running" ? <><Loader2 size={13} className="animate-spin" /> Running...</> : <><Play size={13} /> Crop</>}
      </button>

      {nodeData.result && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={nodeData.result} alt="cropped" className="w-full h-32 object-cover rounded-xl" />
      )}
      {nodeData.error && <p className="text-[12px] text-[#ef4444]">{nodeData.error}</p>}

      <Handle type="source" position={Position.Right} id="output"
        style={{ background: BLUE, width: 10, height: 10, border: "2px solid #1e1e1e", right: -18 }} />
    </NodeWrapper>
  )
}
