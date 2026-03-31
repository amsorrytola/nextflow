"use client"

import { useState, useCallback } from "react"
import { ChevronLeft, ChevronRight, Search, Type, Image, Video, Bot, Crop, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import type { AnyNodeData, NodeType } from "@/types"

const NODE_BUTTONS: { type: NodeType; label: string; icon: React.ElementType; description: string }[] = [
  { type: "textNode", label: "Text", icon: Type, description: "Plain text input" },
  { type: "uploadImageNode", label: "Upload Image", icon: Image, description: "Upload image file" },
  { type: "uploadVideoNode", label: "Upload Video", icon: Video, description: "Upload video file" },
  { type: "llmNode", label: "Run LLM", icon: Bot, description: "Call Gemini model" },
  { type: "cropImageNode", label: "Crop Image", icon: Crop, description: "Crop via FFmpeg" },
  { type: "extractFrameNode", label: "Extract Frame", icon: Film, description: "Extract video frame" },
]

function createDefaultData(type: NodeType): AnyNodeData {
  switch (type) {
    case "textNode": return { type, label: "Text", text: "" }
    case "uploadImageNode": return { type, label: "Upload Image", imageUrl: null, fileName: null }
    case "uploadVideoNode": return { type, label: "Upload Video", videoUrl: null, fileName: null }
    case "llmNode": return { type, label: "Run LLM", model: "gemini-2.0-flash", systemPrompt: "", userMessage: "", result: null, error: null }
    case "cropImageNode": return { type, label: "Crop Image", xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100, result: null, error: null }
    case "extractFrameNode": return { type, label: "Extract Frame", timestamp: "0", result: null, error: null }
  }
}

let nodeCounter = 1

export function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const { addNode, nodes } = useWorkflowStore()

  const handleAddNode = useCallback((type: NodeType) => {
    const id = `${type}-${nodeCounter++}`
    const offset = nodes.length * 20
    addNode({
      id,
      type,
      position: { x: 300 + offset, y: 200 + offset },
      data: createDefaultData(type),
    })
  }, [addNode, nodes.length])

  const filtered = NODE_BUTTONS.filter(
    (n) => n.label.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={cn(
      "flex flex-col h-full border-r border-[#2a2a2a] bg-[#111111] shrink-0 transition-all duration-200",
      collapsed ? "w-12" : "w-64"
    )}>
      <div className="flex items-center justify-between px-3 h-12 border-b border-[#2a2a2a]">
        {!collapsed && (
          <span className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Nodes</span>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-[#2a2a2a] text-[#6b7280] transition-colors ml-auto">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#1a1a1a] border border-[#2a2a2a]">
              <Search size={12} className="text-[#6b7280] shrink-0" />
              <input type="text" placeholder="Search nodes..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder:text-[#6b7280] outline-none" />
            </div>
          </div>
          <div className="px-3 py-2">
            <span className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Quick Access</span>
            <div className="mt-2 flex flex-col gap-1">
              {filtered.map((node) => (
                <button key={node.type}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#1f1f1f] text-left transition-colors"
                  onClick={() => handleAddNode(node.type)}>
                  <node.icon size={14} className="text-[#a855f7] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{node.label}</div>
                    <div className="text-[10px] text-[#6b7280] truncate">{node.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {collapsed && (
        <div className="flex flex-col items-center gap-1 py-2">
          {NODE_BUTTONS.map((node) => (
            <button key={node.type} title={node.label}
              className="p-2 rounded-md hover:bg-[#1f1f1f] text-[#a855f7] transition-colors"
              onClick={() => handleAddNode(node.type)}>
              <node.icon size={14} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
