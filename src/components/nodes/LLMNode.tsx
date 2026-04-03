"use client"

import { Handle, Position, type NodeProps, useEdges } from "@xyflow/react"
import { Bot, Play, Loader2 } from "lucide-react"
import { NodeWrapper } from "./NodeWrapper"
import { useWorkflowStore } from "@/store/workflowStore"
import type { LLMNodeData } from "@/types"
import { cn } from "@/lib/utils"

const PURPLE = "#a855f7"
const YELLOW = "#f5a623"
const BLUE = "#4d9de0"

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
]

export function LLMNode({ id, data }: NodeProps) {
  const nodeData = data as LLMNodeData
  const { updateNodeData, executionStatus } = useWorkflowStore()
  const status = executionStatus[id] ?? "idle"
  const edges = useEdges()
  const isConnected = (handleId: string) =>
    edges.some(e => e.target === id && e.targetHandle === handleId)

  return (
    <NodeWrapper title="Run LLM" icon={<Bot size={13} />} status={status} accentColor={PURPLE}>
      {/* Model selector */}
      <select value={nodeData.model}
        onChange={e => updateNodeData(id, { model: e.target.value } as Partial<LLMNodeData>)}
        className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2
          text-[13px] text-[#ddd] outline-none appearance-none cursor-pointer
          hover:border-[#444] transition-colors">
        {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      {/* System prompt */}
      <div className="relative">
        <Handle type="target" position={Position.Left} id="system_prompt"
          style={{ background: YELLOW, width: 10, height: 10, border: "2px solid #1e1e1e", top: "50%", left: -18 }} />
        <input
          disabled={isConnected("system_prompt")}
          value={nodeData.systemPrompt}
          onChange={e => updateNodeData(id, { systemPrompt: e.target.value } as Partial<LLMNodeData>)}
          placeholder="System prompt (optional)"
          className={cn(
            "w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 pl-6",
            "text-[13px] text-[#ddd] placeholder:text-[#444] outline-none transition-colors",
            isConnected("system_prompt") ? "opacity-40 cursor-not-allowed" : "hover:border-[#444]"
          )}
        />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#666]">sys</span>
      </div>

      {/* User message */}
      <div className="relative">
        <Handle type="target" position={Position.Left} id="user_message"
          style={{ background: YELLOW, width: 10, height: 10, border: "2px solid #1e1e1e", top: "50%", left: -18 }} />
        <textarea
          disabled={isConnected("user_message")}
          value={nodeData.userMessage}
          onChange={e => updateNodeData(id, { userMessage: e.target.value } as Partial<LLMNodeData>)}
          placeholder="User message *"
          rows={2}
          className={cn(
            "w-full bg-[#2a2a2a] border border-[#333] rounded-lg px-3 py-2 pl-6 resize-none",
            "text-[13px] text-[#ddd] placeholder:text-[#444] outline-none transition-colors",
            isConnected("user_message") ? "opacity-40 cursor-not-allowed" : "hover:border-[#444]"
          )}
        />
        <span className="absolute left-2 top-2.5 text-[9px] text-[#666]">msg</span>
      </div>

      {/* Images handle */}
      <div className="relative flex items-center h-7 gap-2">
        <Handle type="target" position={Position.Left} id="images"
          style={{ background: BLUE, width: 10, height: 10, border: "2px solid #1e1e1e", top: "50%", left: -18 }} />
        <span className="text-[12px] text-[#555] ml-1">
          images {isConnected("images") && <span style={{ color: BLUE }}>● connected</span>}
        </span>
      </div>

      {/* Run button */}
      <button
        disabled={status === "running"}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[13px] font-medium transition-colors",
          status === "running"
            ? "bg-[#2a2a2a] text-[#666] cursor-not-allowed"
            : "bg-[#a855f7] hover:bg-[#9333ea] text-white"
        )}>
        {status === "running"
          ? <><Loader2 size={13} className="animate-spin" /> Running...</>
          : <><Play size={13} /> Run</>}
      </button>

      {/* Output handle */}
      <Handle type="source" position={Position.Right} id="output"
        style={{ background: PURPLE, width: 10, height: 10, border: "2px solid #1e1e1e", right: -18 }} />

      {/* Result */}
      {nodeData.result && (
        <div className="mt-1 p-3 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
          <div className="text-[10px] text-[#4CAF50] mb-1.5 font-medium uppercase tracking-wider">Output</div>
          <p className="text-[12px] text-[#aaa] leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
            {nodeData.result}
          </p>
        </div>
      )}
      {nodeData.error && (
        <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#ef4444]/20">
          <div className="text-[10px] text-[#ef4444] mb-1 font-medium">Error</div>
          <p className="text-[12px] text-[#ef4444]/80">{nodeData.error}</p>
        </div>
      )}
    </NodeWrapper>
  )
}
