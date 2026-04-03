"use client"

import { useState } from "react"
import {
  Home, Zap, Workflow, FolderOpen,
  Image, Video, Wand2, Banana, Play, PenLine,
  MoreHorizontal, Type, Upload, Bot, Crop, Film,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import type { AnyNodeData, NodeType } from "@/types"
import { UserButton } from "@clerk/nextjs"

const NAV_ITEMS = [
  { icon: Home, label: "Home" },
  { icon: Zap, label: "Train Lora" },
  { icon: Workflow, label: "Node Editor", active: true },
  { icon: FolderOpen, label: "Assets" },
]

const TOOL_ITEMS = [
  { icon: Image, label: "Image" },
  { icon: Video, label: "Video" },
  { icon: Wand2, label: "Enhancer" },
  { icon: Banana, label: "Nano Banana" },
  { icon: Play, label: "Realtime" },
  { icon: PenLine, label: "Edit" },
  { icon: MoreHorizontal, label: "More" },
]

const NODE_TYPES: { type: NodeType; icon: React.ElementType; label: string; color: string }[] = [
  { type: "textNode", icon: Type, label: "Text", color: "#f5a623" },
  { type: "uploadImageNode", icon: Upload, label: "Upload Image", color: "#4d9de0" },
  { type: "uploadVideoNode", icon: Video, label: "Upload Video", color: "#4CAF50" },
  { type: "llmNode", icon: Bot, label: "Run LLM", color: "#a855f7" },
  { type: "cropImageNode", icon: Crop, label: "Crop Image", color: "#4d9de0" },
  { type: "extractFrameNode", icon: Film, label: "Extract Frame", color: "#4CAF50" },
]

function createDefaultData(type: NodeType): AnyNodeData {
  switch (type) {
    case "textNode": return { type, label: "Text", text: "" }
    case "uploadImageNode": return { type, label: "Upload Image", imageUrl: null, fileName: null }
    case "uploadVideoNode": return { type, label: "Upload Video", videoUrl: null, fileName: null }
    case "llmNode": return { type, label: "Run LLM", model: "gemini-2.5-flash", systemPrompt: "", userMessage: "", result: null, error: null }
    case "cropImageNode": return { type, label: "Crop Image", xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100, result: null, error: null }
    case "extractFrameNode": return { type, label: "Extract Frame", timestamp: "0", result: null, error: null }
  }
}

let nodeCounter = 1

export function KreaLeftSidebar() {
  const [expanded, setExpanded] = useState(true)
  const [search, setSearch] = useState("")
  const { addNode, nodes } = useWorkflowStore()

  const handleAdd = (type: NodeType) => {
    const id = `${type}-${nodeCounter++}`
    const offset = (nodes.length % 8) * 25
    addNode({ id, type, position: { x: 320 + offset, y: 220 + offset }, data: createDefaultData(type) })
  }

  const filtered = NODE_TYPES.filter(n =>
    n.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={cn(
      "flex flex-col h-full bg-[#1a1a1a] border-r border-[#222] shrink-0 transition-all duration-200 z-20",
      expanded ? "w-52" : "w-12"
    )}>
      {/* Toggle + Logo */}
      <div className="flex items-center h-12 px-2 border-b border-[#222] gap-2">
        <button onClick={() => setExpanded(!expanded)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#242424] transition-colors shrink-0">
          <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#666] rounded-[1px]" />
            ))}
          </div>
        </button>
        {expanded && <span className="text-sm font-semibold text-[#ccc]">NextFlow</span>}
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 p-2">
        {NAV_ITEMS.map(item => (
          <button key={item.label} title={!expanded ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left",
              item.active
                ? "bg-[#2a2a2a] text-white"
                : "text-[#666] hover:text-[#aaa] hover:bg-[#242424]"
            )}>
            <item.icon size={16} className="shrink-0" />
            {expanded && <span className="text-[13px]">{item.label}</span>}
          </button>
        ))}
      </div>

      {expanded && <div className="w-full h-px bg-[#222] mx-0 my-1" />}

      {/* Tools section */}
      {expanded && (
        <div className="px-3 py-1">
          <span className="text-[10px] text-[#444] uppercase tracking-wider font-medium">Tools</span>
        </div>
      )}
      <div className="flex flex-col gap-0.5 px-2">
        {TOOL_ITEMS.map(item => (
          <button key={item.label} title={!expanded ? item.label : undefined}
            className="flex items-center gap-3 px-2 py-2 rounded-lg text-[#555] hover:text-[#999] hover:bg-[#242424] transition-colors text-left">
            <item.icon size={15} className="shrink-0" />
            {expanded && <span className="text-[13px]">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Quick Access nodes */}
      {expanded && (
        <>
          <div className="w-full h-px bg-[#222] my-1" />
          <div className="px-3 py-1">
            <span className="text-[10px] text-[#444] uppercase tracking-wider font-medium">Quick Access</span>
          </div>
          <div className="px-2 pb-2">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#242424] rounded-lg border border-[#2e2e2e] mb-2">
              <span className="text-[#555] text-xs">🔍</span>
              <input placeholder="Search nodes..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-[#ccc] placeholder:text-[#444] outline-none" />
            </div>
            <div className="flex flex-col gap-0.5">
              {filtered.map(node => (
                <button key={node.type} onClick={() => handleAdd(node.type)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#242424] transition-colors text-left">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: node.color + "22" }}>
                    <node.icon size={13} style={{ color: node.color }} />
                  </div>
                  <span className="text-[12px] text-[#bbb]">{node.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* User avatar at bottom */}
      <div className="mt-auto p-2 border-t border-[#222] flex items-center gap-2">
        <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
        {expanded && <span className="text-[11px] text-[#555] truncate">Free</span>}
      </div>
    </div>
  )
}
