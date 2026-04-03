"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import type { AnyNodeData, NodeType } from "@/types"
import { UserButton } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"
import {
  PanelLeft, Search, Video, Type, Upload, Bot, Crop, Film, MoreHorizontal,
  ChevronRight, Image as ImageIcon
} from "lucide-react"

const NAV_ITEMS = [
  { label: "Home", href: "/", iconUrl: "https://s.krea.ai/icons/HomeIcon.png" },
  { label: "Train Lora", href: "/train", iconUrl: "https://s.krea.ai/icons/Train.png" },
  { label: "Node Editor", href: "/nodes", iconUrl: "https://s.krea.ai/icons/NodeEditor.png" },
  { label: "Assets", href: "/assets", iconUrl: "https://s.krea.ai/icons/Assets.png" },
]

const TOOL_ITEMS = [
  { label: "Image", href: "/image", iconUrl: "https://s.krea.ai/icons/imageV4.png" },
  { label: "Video", href: "/video", iconUrl: "https://s.krea.ai/icons/videoV2.png" },
  { label: "Enhancer", href: "/enhancer", iconUrl: "https://s.krea.ai/icons/Enhance.png" },
  { label: "Nano Banana", href: "/nano-banana", iconUrl: "https://s.krea.ai/icons/NanoBanana.png" },
  { label: "Realtime", href: "/realtime", iconUrl: "https://s.krea.ai/icons/realtimeV2.png" },
  { label: "Edit", href: "/edit", iconUrl: "https://s.krea.ai/icons/Edit.png" },
]

// Krea's node panel categories (from krea_left-mouse-click.png right panel)
const NODE_CATEGORIES = [
  {
    label: "Assets",
    items: [
      { type: "textNode" as NodeType, label: "Text", icon: Type, color: "#f5a623" },
      { type: "uploadImageNode" as NodeType, label: "Image", icon: ImageIcon, color: "#4d9de0" },
      { type: "uploadVideoNode" as NodeType, label: "Video", icon: Video, color: "#4CAF50" },
    ]
  },
  {
    label: "Utility",
    items: [
      { type: "llmNode" as NodeType, label: "Run LLM", icon: Bot, color: "#a855f7" },
      { type: "cropImageNode" as NodeType, label: "Crop Image", icon: Crop, color: "#4d9de0" },
      { type: "extractFrameNode" as NodeType, label: "Extract Frame", icon: Film, color: "#4CAF50" },
    ]
  },
]

// Flat list for search
const ALL_NODE_TYPES = NODE_CATEGORIES.flatMap(c => c.items)

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
  const [collapsed, setCollapsed] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(true)
  const [sessionsOpen, setSessionsOpen] = useState(false)
  // Quick Access panel state (shown on workflow page)
  const [qaOpen, setQaOpen] = useState(true)
  const [search, setSearch] = useState("")
  const { addNode, nodes } = useWorkflowStore()
  const pathname = usePathname()
  const router = useRouter()

  const handleAdd = (type: NodeType) => {
    const id = `${type}-${nodeCounter++}`
    const offset = (nodes.length % 8) * 25
    addNode({ id, type, position: { x: 320 + offset, y: 220 + offset }, data: createDefaultData(type) })
  }

  const isOnWorkflow = pathname?.startsWith("/workflow")

  const filtered = search
    ? ALL_NODE_TYPES.filter(n => n.label.toLowerCase().includes(search.toLowerCase()))
    : null

  return (
    <div
      className={cn(
        "flex flex-col h-full shrink-0 transition-[width] duration-150 ease-out z-20 relative",
      )}
      style={{
        width: collapsed ? 52 : 208,
        background: "hsl(240 5.9% 10%)",
        borderRight: "0.5px solid rgba(255,255,255,0.07)"
      }}>

      {/* Toggle */}
      <div className="flex items-center h-12 px-2 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 flex items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors">
          <PanelLeft size={16} />
        </button>
      </div>

      {/* Top nav */}
      <div className="flex flex-col gap-[1px] px-2">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href ||
            (item.href === "/nodes" && (pathname === "/nodes" || isOnWorkflow))
          return (
            <button
              key={item.label}
              title={collapsed ? item.label : undefined}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex items-center gap-2.5 px-2 h-9 rounded-md transition-colors text-left w-full text-[13px]",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-white/60 hover:text-white/90 hover:bg-white/[0.05]"
              )}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.iconUrl} alt={item.label} draggable={false}
                className="w-5 h-5 shrink-0 object-contain" />
              {!collapsed && <span className="truncate font-normal">{item.label}</span>}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden mt-1" style={{ scrollbarWidth: "none" }}>

        {/* Tools */}
        <div className="px-2">
          {!collapsed && (
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="flex items-center w-full h-9 rounded-md px-2 text-[13px] text-white/25 hover:text-white/50 hover:bg-white/[0.05] transition-colors select-none">
              Tools
            </button>
          )}
          {(toolsOpen || collapsed) && (
            <div className="flex flex-col gap-[1px]">
              {TOOL_ITEMS.map(item => (
                <button
                  key={item.label}
                  title={collapsed ? item.label : undefined}
                  className="flex items-center gap-2.5 px-2 h-9 rounded-md text-white/60 hover:text-white/90 hover:bg-white/[0.05] transition-colors text-left w-full text-[13px] font-normal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.iconUrl} alt={item.label} draggable={false}
                    className="w-5 h-5 shrink-0 object-contain" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
              {!collapsed && (
                <button className="flex items-center gap-2.5 px-2 h-9 rounded-md text-white/25 hover:text-white/50 hover:bg-white/[0.05] transition-colors text-left w-full text-[13px]">
                  <MoreHorizontal size={18} className="shrink-0" />
                  <span>More</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sessions */}
        {!collapsed && (
          <div className="px-2 mt-1">
            <button
              onClick={() => setSessionsOpen(!sessionsOpen)}
              className="flex items-center w-full h-9 rounded-md px-2 text-[13px] text-white/25 hover:text-white/50 hover:bg-white/[0.05] transition-colors select-none">
              Sessions
            </button>
          </div>
        )}

        {/* Quick Access — only on workflow editor, matches krea_left-mouse-click.png right panel */}
        {!collapsed && isOnWorkflow && (
          <div className="px-2 mt-1">
            {/* Header with search icon */}
            <div className="flex items-center justify-between px-2 h-9">
              <span className="text-[13px] text-white/25">Quick Access</span>
              <button className="text-white/25 hover:text-white/60 transition-colors">
                <Search size={12} />
              </button>
            </div>

            {/* Search input */}
            <div className="mx-0 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <Search size={11} className="text-white/25 shrink-0" />
                <input
                  placeholder="Search nodes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/20 outline-none"
                />
              </div>
            </div>

            {/* Node categories — matches Krea's right panel layout in krea_left-mouse-click.png */}
            {filtered ? (
              // Search results — flat list
              <div className="flex flex-col gap-[2px]">
                {filtered.map(node => (
                  <NodeButton key={node.type} node={node} onClick={() => handleAdd(node.type)} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-[12px] text-white/25 px-2 py-2">No nodes found</p>
                )}
              </div>
            ) : (
              // Categorized list
              NODE_CATEGORIES.map(category => (
                <div key={category.label} className="mb-3">
                  <div className="flex items-center gap-2 px-2 mb-1">
                    <span className="text-[11px] text-white/30 font-medium uppercase tracking-wider">
                      {category.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[2px]">
                    {category.items.map(node => (
                      <NodeButton key={node.type} node={node} onClick={() => handleAdd(node.type)} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer",
          collapsed && "justify-center"
        )}>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-white/70 truncate">uncomplicatedusefulcuttlefish1</div>
              <div className="text-[11px] text-white/30">Free</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Reusable node button matching Krea's style
function NodeButton({ node, onClick }: {
  node: { type: NodeType; label: string; icon: React.ElementType; color: string }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-2 py-[7px] rounded-lg text-left w-full transition-colors hover:bg-white/[0.06] group">
      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
        style={{ background: node.color + "18", border: `0.5px solid ${node.color}40` }}>
        <node.icon size={11} style={{ color: node.color }} />
      </div>
      <span className="text-[13px] text-white/60 group-hover:text-white/90 transition-colors">{node.label}</span>
    </button>
  )
}