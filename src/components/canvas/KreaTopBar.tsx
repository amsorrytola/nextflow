"use client"

import { Share2, AppWindow, Maximize2, Moon } from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import { useRouter } from "next/navigation"

interface KreaTopBarProps {
  workflowId?: string
}

export function KreaTopBar({ workflowId }: KreaTopBarProps) {
  const { workflowName, nodes, edges } = useWorkflowStore()
  const router = useRouter()

  const handleSave = async () => {
    if (!workflowId || workflowId === "default" || workflowId === "new") {
      // Create new workflow
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        }),
      })
      const data = await res.json()
      if (data.id) router.push(`/workflow/${data.id}`)
    } else {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        }),
      })
    }
  }

  return (
    <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 z-10 pointer-events-none">
      <div className="pointer-events-auto">
        <button
          onClick={() => router.push("/nodes")}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#242424] rounded-lg border border-[#2e2e2e] transition-colors">
          <div className="w-4 h-4 bg-[#a855f7] rounded-sm flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">N</span>
          </div>
          <span className="text-xs text-[#ccc] font-medium">{workflowName}</span>
          <span className="text-[#555] text-xs">▾</span>
        </button>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <button className="p-1.5 rounded-lg hover:bg-[#242424] text-[#666] hover:text-[#999] transition-colors">
          <Moon size={14} />
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#242424] rounded-lg border border-[#2e2e2e] text-xs text-[#ccc] transition-colors">
          <Share2 size={12} />
          Save
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#242424] rounded-lg border border-[#2e2e2e] text-xs text-[#ccc] transition-colors">
          <AppWindow size={12} />
          Turn workflow into app
        </button>
        <button className="p-1.5 rounded-lg hover:bg-[#242424] text-[#666] hover:text-[#999] transition-colors">
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}
