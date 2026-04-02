"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Bot, Play, Loader2 } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { LLMNodeData } from "@/types"
import { cn } from "@/lib/utils"

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.5-pro-preview-03-25",
]

export function LLMNode({ id, data }: NodeProps) {
  const nodeData = data as LLMNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()

  const isConnected = (handleId: string) =>
    edges.some((e) => e.target === id && e.targetHandle === handleId)

  return (
    <NodeWrapper title="Run LLM" icon={<Bot size={12} />} status={status} color="#a855f7">
      {/* Model selector */}
      <select
        value={nodeData.model}
        onChange={(e) => updateNodeData(id, { model: e.target.value } as Partial<LLMNodeData>)}
        className="w-full bg-[#111111] border border-[#2a2a2a] rounded-md px-2 py-1.5
          text-xs text-white outline-none focus:border-[#a855f7] transition-colors"
      >
        {MODELS.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* System prompt input handle */}
      <div className="relative">
        <Handle
          type="target"
          position={Position.Left}
          id="system_prompt"
          style={{ top: "50%", background: "#6366f1", width: 8, height: 8, border: "2px solid #1a1a1a" }}
        />
        <input
          disabled={isConnected("system_prompt")}
          value={nodeData.systemPrompt}
          onChange={(e) => updateNodeData(id, { systemPrompt: e.target.value } as Partial<LLMNodeData>)}
          placeholder="System prompt (optional)"
          className={cn(
            "w-full bg-[#111111] border border-[#2a2a2a] rounded-md px-2 py-1.5 pl-6",
            "text-xs text-white placeholder:text-[#6b7280] outline-none focus:border-[#a855f7] transition-colors",
            isConnected("system_prompt") && "opacity-40 cursor-not-allowed"
          )}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#6b7280]">sys</span>
      </div>

      {/* User message input handle */}
      <div className="relative">
        <Handle
          type="target"
          position={Position.Left}
          id="user_message"
          style={{ top: "50%", background: "#a855f7", width: 8, height: 8, border: "2px solid #1a1a1a" }}
        />
        <textarea
          disabled={isConnected("user_message")}
          value={nodeData.userMessage}
          onChange={(e) => updateNodeData(id, { userMessage: e.target.value } as Partial<LLMNodeData>)}
          placeholder="User message *"
          rows={2}
          className={cn(
            "w-full bg-[#111111] border border-[#2a2a2a] rounded-md px-2 py-1.5 pl-6 resize-none",
            "text-xs text-white placeholder:text-[#6b7280] outline-none focus:border-[#a855f7] transition-colors",
            isConnected("user_message") && "opacity-40 cursor-not-allowed"
          )}
        />
        <span className="absolute left-2 top-2 text-[9px] text-[#6b7280]">msg</span>
      </div>

      {/* Images handle */}
      <div className="relative flex items-center h-6">
        <Handle
          type="target"
          position={Position.Left}
          id="images"
          style={{ top: "50%", background: "#ec4899", width: 8, height: 8, border: "2px solid #1a1a1a" }}
        />
        <span className="text-[10px] text-[#6b7280] ml-5">
          images {isConnected("images") ? <span className="text-[#ec4899]">● connected</span> : "(optional)"}
        </span>
      </div>

      {/* Run button */}
      <button
        disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-xs font-medium transition-colors",
          status === "running"
            ? "bg-[#2a2a2a] text-[#6b7280] cursor-not-allowed"
            : "bg-[#a855f7] hover:bg-[#9333ea] text-white"
        )}
        onClick={() => console.log("run LLM node", id)}
      >
        {status === "running" ? (
          <><Loader2 size={12} className="animate-spin" /> Running...</>
        ) : (
          <><Play size={12} /> Run</>
        )}
      </button>

      {/* Result display */}
      {nodeData.result && (
        <div className="mt-1 p-2 bg-[#111111] border border-[#22c55e]/30 rounded-md">
          <div className="text-[9px] text-[#22c55e] mb-1 font-medium uppercase tracking-wider">Output</div>
          <p className="text-[11px] text-[#9ca3af] leading-relaxed whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {nodeData.result}
          </p>
        </div>
      )}

      {nodeData.error && (
        <div className="mt-1 p-2 bg-[#111111] border border-[#ef4444]/30 rounded-md">
          <div className="text-[9px] text-[#ef4444] mb-1 font-medium uppercase tracking-wider">Error</div>
          <p className="text-[11px] text-[#ef4444] leading-relaxed">{nodeData.error}</p>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: "#a855f7", width: 8, height: 8, border: "2px solid #1a1a1a" }}
      />
    </NodeWrapper>
  )
}
