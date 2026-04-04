"use client"

import { useState } from "react"
import { PanelLeft, Search, MoreHorizontal, Video, Type, Image as ImageIcon, Bot, Crop, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import type { AnyNodeData, NodeType } from "@/types"
import { UserButton } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"

const NAV = [
  { label: "Home",        href: "/",      icon: "https://s.krea.ai/icons/HomeIcon.png" },
  { label: "Train Lora",  href: "/train", icon: "https://s.krea.ai/icons/Train.png" },
  { label: "Node Editor", href: "/nodes", icon: "https://s.krea.ai/icons/NodeEditor.png" },
  { label: "Assets",      href: "/assets",icon: "https://s.krea.ai/icons/Assets.png" },
]
const TOOLS = [
  { label: "Image",       icon: "https://s.krea.ai/icons/imageV4.png" },
  { label: "Video",       icon: "https://s.krea.ai/icons/videoV2.png" },
  { label: "Enhancer",    icon: "https://s.krea.ai/icons/Enhance.png" },
  { label: "Nano Banana", icon: "https://s.krea.ai/icons/NanoBanana.png" },
  { label: "Realtime",    icon: "https://s.krea.ai/icons/realtimeV2.png" },
  { label: "Edit",        icon: "https://s.krea.ai/icons/Edit.png" },
]
const NODE_CATS = [
  { label: "Assets", items: [
    { type: "textNode" as NodeType,        label: "Text",          Icon: Type,       color: "#FCC800", icon: "https://s.krea.ai/icons/Edit.png" },
    { type: "uploadImageNode" as NodeType, label: "Image",         Icon: ImageIcon,  color: "#0080FF", icon: "https://s.krea.ai/icons/imageV4.png" },
    { type: "uploadVideoNode" as NodeType, label: "Video",         Icon: Video,      color: "#29D246", icon: "https://s.krea.ai/icons/videoV2.png" },
  ]},
  { label: "Utility", items: [
    { type: "llmNode" as NodeType,         label: "Run LLM",       Icon: Bot,        color: "#9B6FFF", icon: "https://s.krea.ai/icons/NanoBanana.png" },
    { type: "cropImageNode" as NodeType,   label: "Crop Image",    Icon: Crop,       color: "#0080FF", icon: "https://s.krea.ai/icons/Enhance.png" },
    { type: "extractFrameNode" as NodeType,label: "Extract Frame", Icon: Film,       color: "#29D246", icon: "https://s.krea.ai/icons/videoV2.png" },
  ]},
]
const ALL_NODES = NODE_CATS.flatMap(c => c.items)

function mkDefault(type: NodeType): AnyNodeData {
  switch (type) {
    case "textNode":        return { type, label: "Text",          text: "" }
    case "uploadImageNode": return { type, label: "Upload Image",  imageUrl: null, fileName: null }
    case "uploadVideoNode": return { type, label: "Upload Video",  videoUrl: null, fileName: null }
    case "llmNode":         return { type, label: "Run LLM",       model: "gemini-2.5-flash", systemPrompt: "", userMessage: "", result: null, error: null }
    case "cropImageNode":   return { type, label: "Crop Image",    xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100, result: null, error: null }
    case "extractFrameNode":return { type, label: "Extract Frame", timestamp: "0", result: null, error: null }
  }
}

let nc = 1

export function KreaLeftSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const { addNode, nodes } = useWorkflowStore()
  const pathname = usePathname()
  const router = useRouter()
  const onWorkflow = pathname?.startsWith("/workflow")

  const add = (type: NodeType) => {
    const id = `${type}-${nc++}`
    const offset = (nodes.length % 8) * 24
    addNode({ id, type, position: { x: 320 + offset, y: 220 + offset }, data: mkDefault(type) })
  }

  const filtered = search ? ALL_NODES.filter(n => n.label.toLowerCase().includes(search.toLowerCase())) : null

  const W = collapsed ? 44 : 148

  const navBtn = (label: string, href: string, iconUrl: string) => {
    const isActive = pathname === href || (href === "/nodes" && (pathname === "/nodes" || onWorkflow))
    return (
      <button key={label} title={collapsed ? label : undefined}
        onClick={() => router.push(href)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "5px 10px 5px 12px", borderRadius: 7,
          background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
          border: "none", cursor: "pointer", width: "100%", textAlign: "left",
          color: isActive ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.50)",
          fontSize: 12.5, fontWeight: isActive ? 500 : 400,
          transition: "background 0.12s ease, color 0.12s ease",
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconUrl} alt={label} draggable={false} style={{ width: 16, height: 16, objectFit: "contain", opacity: isActive ? 0.95 : 0.55 }} />
        {!collapsed && <span style={{ letterSpacing: "-0.01em" }}>{label}</span>}
      </button>
    )
  }

  return (
    <div style={{
      width: W, minWidth: W, maxWidth: W,
      background: "#050505",
      borderRight: "1px solid rgba(255,255,255,0.04)",
      display: "flex", flexDirection: "column", height: "100%",
      transition: "width 0.18s cubic-bezier(0.4,0,0.2,1)",
      overflow: "hidden", flexShrink: 0, position: "relative", zIndex: 20,
    }}>

      {/* Toggle */}
      <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{
            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 6, border: "none", background: "transparent", cursor: "pointer",
            color: "rgba(255,255,255,0.30)", transition: "background 0.12s, color 0.12s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)" }}
        >
          <PanelLeft size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Nav items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 6px", flexShrink: 0 }}>
        {NAV.map(n => navBtn(n.label, n.href, n.icon))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", marginTop: 8 }}>
        {/* Tools header */}
        {!collapsed && (
          <div style={{ padding: "2px 18px 4px", fontSize: 10.5, color: "rgba(255,255,255,0.20)",
            letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, userSelect: "none" }}>
            Tools
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 6px" }}>
          {TOOLS.map(t => (
            <button key={t.label} title={collapsed ? t.label : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "5px 10px 5px 12px",
                borderRadius: 7, border: "none", background: "transparent", cursor: "pointer",
                color: "rgba(255,255,255,0.48)", fontSize: 12.5, width: "100%", textAlign: "left",
                transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.48)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.icon} alt={t.label} draggable={false} style={{ width: 16, height: 16, objectFit: "contain", opacity: 0.55 }} />
              {!collapsed && <span style={{ letterSpacing: "-0.01em" }}>{t.label}</span>}
            </button>
          ))}
          {!collapsed && (
            <button style={{
              display: "flex", alignItems: "center", gap: 10, padding: "5px 10px 5px 12px",
              borderRadius: 7, border: "none", background: "transparent", cursor: "pointer",
              color: "rgba(255,255,255,0.25)", fontSize: 12.5, width: "100%",
            }}>
              <MoreHorizontal size={14} style={{ opacity: 0.4 }} />
              {!collapsed && <span>More</span>}
            </button>
          )}
        </div>

        {/* Sessions */}
        {!collapsed && (
          <div style={{ padding: "10px 18px 2px", fontSize: 10.5, color: "rgba(255,255,255,0.20)",
            letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, userSelect: "none" }}>
            Sessions
          </div>
        )}

        {/* Quick Access — workflow only */}
        {!collapsed && onWorkflow && (
          <div style={{ padding: "8px 6px 0" }}>
            <div style={{ padding: "0 12px 6px", fontSize: 10.5, color: "rgba(255,255,255,0.20)",
              letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, userSelect: "none" }}>
              Quick Access
            </div>

            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              margin: "0 6px 6px", padding: "6px 10px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <Search size={10} style={{ color: "rgba(255,255,255,0.22)", flexShrink: 0 }} />
              <input placeholder="Search nodes..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "inherit",
                }} />
            </div>

            {/* Node list */}
            {(filtered ?? NODE_CATS.flatMap(c => [
              { type: null as NodeType | null, label: `__CAT__${c.label}`, Icon: null, color: "", icon: "" },
              ...c.items,
            ])).map(node => {
              if (node.label.startsWith("__CAT__")) {
                return (
                  <div key={node.label} style={{ padding: "6px 18px 3px", fontSize: 10.5,
                    color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em",
                    textTransform: "uppercase", fontWeight: 500, userSelect: "none" }}>
                    {node.label.replace("__CAT__", "")}
                  </div>
                )
              }
              return (
                <button key={node.type} onClick={() => add(node.type!)}
                  style={{
                    display: "flex", alignItems: "center", gap: 9, padding: "5px 12px",
                    borderRadius: 7, border: "none", background: "transparent", cursor: "pointer",
                    width: "100%", textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.045)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, overflow: "hidden",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={node.icon} alt="" draggable={false} style={{ width: 13, height: 13, objectFit: "contain", opacity: 0.80 }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)", letterSpacing: "-0.01em" }}>
                    {node.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: "8px 10px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "4px 4px",
          borderRadius: 8, cursor: "pointer",
          transition: "background 0.12s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
        >
          <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                Free
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
