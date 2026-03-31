"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Crop, Play, Loader2 } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { CropImageNodeData } from "@/types"
import { cn } from "@/lib/utils"

function PercentInput({
  label, value, onChange, disabled,
}: { label: string; value: number; onChange: (v: number) => void; disabled: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#6b7280] w-16 shrink-0">{label}</span>
      <input
        type="number"
        min={0} max={100}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "flex-1 bg-[#111111] border border-[#2a2a2a] rounded px-2 py-1 text-xs text-white outline-none",
          "focus:border-[#f59e0b] transition-colors",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      />
      <span className="text-[10px] text-[#6b7280]">%</span>
    </div>
  )
}

export function CropImageNode({ id, data }: NodeProps) {
  const nodeData = data as CropImageNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()

  const isConnected = (handleId: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handleId)

  const update = (field: keyof CropImageNodeData, value: unknown) =>
    updateNodeData(id, { [field]: value } as Partial<CropImageNodeData>)

  return (
    <NodeWrapper title="Crop Image" icon={<Crop size={12} />} status={status} color="#f59e0b">
      {/* image_url handle */}
      <div className="relative flex items-center h-6">
        <Handle type="target" position={Position.Left} id="image_url"
          style={{ top: "50%", background: "#ec4899", width: 8, height: 8, border: "2px solid #1a1a1a" }} />
        <span className="text-[10px] text-[#6b7280] ml-5">
          image {isConnected("image_url") ? <span className="text-[#ec4899]">● connected</span> : <span className="text-[#ef4444]">*</span>}
        </span>
      </div>

      {/* Crop params — each has a handle + manual input */}
      {(["x_percent","y_percent","width_percent","height_percent"] as const).map((field, i) => {
        const labels = ["X offset", "Y offset", "Width", "Height"]
        const dataKey = field.replace("_percent","Percent").replace(/_([a-z])/g, (_,c) => c.toUpperCase()) as keyof CropImageNodeData
        return (
          <div key={field} className="relative">
            <Handle type="target" position={Position.Left} id={field}
              style={{ top: "50%", background: "#6b7280", width: 6, height: 6, border: "2px solid #1a1a1a" }} />
            <PercentInput
              label={labels[i] ?? field}
              value={nodeData[dataKey] as number}
              onChange={(v) => update(dataKey, v)}
              disabled={isConnected(field)}
            />
          </div>
        )
      })}

      <button
        disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-xs font-medium transition-colors mt-1",
          status === "running" ? "bg-[#2a2a2a] text-[#6b7280] cursor-not-allowed" : "bg-[#f59e0b] hover:bg-[#d97706] text-black"
        )}
        onClick={() => console.log("run crop", id)}
      >
        {status === "running" ? <><Loader2 size={12} className="animate-spin" /> Running...</> : <><Play size={12} /> Crop</>}
      </button>

      {nodeData.result && (
        <div className="mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nodeData.result} alt="cropped" className="w-full h-24 object-cover rounded-md border border-[#2a2a2a]" />
        </div>
      )}
      {nodeData.error && (
        <p className="text-[11px] text-[#ef4444]">{nodeData.error}</p>
      )}

      <Handle type="source" position={Position.Right} id="output"
        style={{ background: "#f59e0b", width: 8, height: 8, border: "2px solid #1a1a1a" }} />
    </NodeWrapper>
  )
}
