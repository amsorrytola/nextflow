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
      { type: "textNode" as NodeType, label: "Text", icon: Type, color: "#f5a623", iconUrl: "https://s.krea.ai/icons/Edit.png" },
      { type: "uploadImageNode" as NodeType, label: "Image", icon: ImageIcon, color: "#4d9de0", iconUrl: "https://s.krea.ai/icons/imageV4.png" },
      { type: "uploadVideoNode" as NodeType, label: "Video", icon: Video, color: "#4CAF50", iconUrl: "https://s.krea.ai/icons/videoV2.png" },
    ]
  },
  {
    label: "Utility",
    items: [
      { type: "llmNode" as NodeType, label: "Run LLM", icon: Bot, color: "#a855f7", iconUrl: "https://s.krea.ai/icons/NanoBanana.png" },
      { type: "cropImageNode" as NodeType, label: "Crop Image", icon: Crop, color: "#4d9de0", iconUrl: "https://s.krea.ai/icons/Enhance.png" },
      { type: "extractFrameNode" as NodeType, label: "Extract Frame", icon: Film, color: "#4CAF50", iconUrl: "https://s.krea.ai/icons/videoV2.png" },
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
        "flex flex-col h-full shrink-0 transition-[width] duration-150 ease-out z-20 relative ",
      )}
      style={{
        width: collapsed ? 44 : 148,
        background: "#070707",
        borderRight: "1px solid rgba(255,255,255,0.03)",
        color: "var(--text-primary)",
      }}>

      {/* Toggle */}
      <div className="flex items-center h-10 px-4 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-white/[0.04]"
          style={{ color: "rgba(255,255,255,0.38)" }}>
          <PanelLeft size={12} strokeWidth={2.1} />
        </button>
      </div>

      {/* Top nav */}
      <div className="flex flex-col gap-[3px] px-4 pt-1 ">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href ||
            (item.href === "/nodes" && (pathname === "/nodes" || isOnWorkflow))
          return (
            <button
              key={item.label}
              title={collapsed ? item.label : undefined}
              onClick={() => router.push(item.href)}
              className={cn(
                "relative flex items-center gap-2.5 pl-4 pr-2.5 h-7 rounded-md transition-colors text-left w-full text-[12px]",
              )}>
              <span
                className="absolute inset-0 rounded-md pointer-events-none"
                style={{
                  background: isActive ? "var(--bg-elevated-hover)" : "transparent",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.iconUrl} alt={item.label} draggable={false}
                className="w-4 h-4 shrink-0 object-contain relative z-[1]" />
              {!collapsed && (
                <span
                  className="truncate font-normal relative z-[1]"
                  style={{ color: isActive ? "var(--text-primary)" : "var(--text-soft)" }}
                >
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden mt-3" style={{ scrollbarWidth: "none" }}>

        {/* Tools */}
        <div className="px-4">
          {!collapsed && (
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="flex items-center w-full h-7 rounded-md pl-4 pr-2.5 text-[11px] transition-colors select-none"
              style={{ color: "rgba(255,255,255,0.22)" }}>
              Tools
            </button>
          )}
          {(toolsOpen || collapsed) && (
            <div className="flex flex-col gap-[2px]">
              {TOOL_ITEMS.map(item => (
                <button
                  key={item.label}
                  title={collapsed ? item.label : undefined}
                  className="flex items-center gap-2.5 pl-4 pr-2.5 h-7 rounded-md transition-colors text-left w-full text-[12px] font-normal hover:bg-white/[0.04]"
                  style={{ color: "rgba(255,255,255,0.72)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.iconUrl} alt={item.label} draggable={false}
                    className="w-4 h-4 shrink-0 object-contain" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
              {!collapsed && (
                <button
                  className="flex items-center gap-2.5 pl-4 pr-2.5 h-7 rounded-md transition-colors text-left w-full text-[12px] hover:bg-white/[0.04]"
                  style={{ color: "rgba(255,255,255,0.32)" }}>
                  <MoreHorizontal size={14} className="shrink-0" />
                  <span>More</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sessions */}
        {!collapsed && (
          <div className="px-4 mt-1">
            <button
              onClick={() => setSessionsOpen(!sessionsOpen)}
              className="flex items-center w-full h-7 rounded-md pl-4 pr-2.5 text-[11px] transition-colors select-none"
              style={{ color: "rgba(255,255,255,0.22)" }}>
              Sessions
            </button>
          </div>
        )}

        {/* Quick Access — only on workflow editor, matches krea_left-mouse-click.png right panel */}
        {!collapsed && isOnWorkflow && (
          <div className="px-4 mt-1">
            {/* Header with search icon */}
            <div className="flex items-center justify-between pl-4 pr-2.5 h-7">
              <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>Quick Access</span>
              <button className="transition-colors" style={{ color: "rgba(255,255,255,0.22)" }}>
                <Search size={11} />
              </button>
            </div>

            {/* Search input */}
            <div className="mx-0 mb-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.045)" }}>
                <Search size={10} className="shrink-0" style={{ color: "rgba(255,255,255,0.22)" }} />
                <input
                  placeholder="Search nodes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[12px] outline-none"
                  style={{ color: "var(--text-soft)" }}
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
                  <p className="text-[12px] pl-4 pr-2.5 py-2" style={{ color: "var(--text-ghost)" }}>No nodes found</p>
                )}
              </div>
            ) : (
              // Categorized list
              NODE_CATEGORIES.map(category => (
                <div key={category.label} className="mb-2.5">
                  <div className="flex items-center gap-2 pl-4 pr-2.5 mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.24)" }}>
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
      <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.035)" }}>
        <div className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-pointer hover:bg-white/[0.04]",
          collapsed && "justify-center"
        )}>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-lg" } }} />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] truncate" style={{ color: "var(--text-soft)" }}>uncomplicatedusefulcuttlefish1</div>
              <div className="text-[11px]" style={{ color: "var(--text-ghost)" }}>Free</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Reusable node button matching Krea's style
function NodeButton({ node, onClick }: {
  node: { type: NodeType; label: string; icon: React.ElementType; color: string; iconUrl?: string }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 pl-4 pr-2.5 py-[7px] rounded-lg text-left w-full transition-colors group hover:bg-white/[0.04]"
      style={{ background: "transparent" }}>
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        {node.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={node.iconUrl} alt="" draggable={false} className="w-3.5 h-3.5 object-contain opacity-95" />
        ) : (
          <node.icon size={11} style={{ color: node.color }} />
        )}
      </div>
      <span className="text-[12px] transition-colors" style={{ color: "var(--text-soft)" }}>{node.label}</span>
    </button>
  )
}
