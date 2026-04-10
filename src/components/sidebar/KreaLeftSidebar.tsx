"use client"
/* eslint-disable @next/next/no-img-element */

import { useState } from "react"
import { PanelLeft, Search, MoreHorizontal, Video, Type, Image as ImageIcon, Bot, Crop, Film } from "lucide-react"
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
    { type: "textNode"         as NodeType, label: "Text",          Icon: Type,      color: "var(--krea-yellow)", icon: "https://s.krea.ai/icons/Edit.png" },
    { type: "uploadImageNode"  as NodeType, label: "Image",         Icon: ImageIcon, color: "var(--krea-blue)",   icon: "https://s.krea.ai/icons/imageV4.png" },
    { type: "uploadVideoNode"  as NodeType, label: "Video",         Icon: Video,     color: "var(--krea-green)",  icon: "https://s.krea.ai/icons/videoV2.png" },
  ]},
  { label: "Utility", items: [
    { type: "llmNode"          as NodeType, label: "Run LLM",       Icon: Bot,       color: "var(--krea-purple)", icon: "https://s.krea.ai/icons/NanoBanana.png" },
    { type: "cropImageNode"    as NodeType, label: "Crop Image",    Icon: Crop,      color: "var(--krea-blue)",   icon: "https://s.krea.ai/icons/Enhance.png" },
    { type: "extractFrameNode" as NodeType, label: "Extract Frame", Icon: Film,      color: "var(--krea-green)",  icon: "https://s.krea.ai/icons/videoV2.png" },
  ]},
]

const ALL_NODES = NODE_CATS.flatMap(c => c.items)

function mkDefault(type: NodeType): AnyNodeData {
  switch (type) {
    case "textNode":         return { type, label: "Text",          text: "" }
    case "uploadImageNode":  return { type, label: "Upload Image",  imageUrl: null, fileName: null }
    case "uploadVideoNode":  return { type, label: "Upload Video",  videoUrl: null, fileName: null }
    case "llmNode":          return { type, label: "Run LLM",       model: "gemini-2.5-flash", systemPrompt: "", userMessage: "", result: null, error: null }
    case "cropImageNode":    return { type, label: "Crop Image",    xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100, result: null, error: null }
    case "extractFrameNode": return { type, label: "Extract Frame", timestamp: "0", result: null, error: null }
  }
}

let nc = 1

export function KreaLeftSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState("")
  const { addNode, nodes } = useWorkflowStore()
  const pathname = usePathname()
  const router   = useRouter()
  const onWorkflow = pathname?.startsWith("/workflow")

  const add = (type: NodeType) => {
    const id = `${type}-${nc++}`
    const off = (nodes.length % 8) * 24
    addNode({ id, type, position: { x: 300 + off, y: 200 + off }, data: mkDefault(type) })
  }

  const filtered = search ? ALL_NODES.filter(n => n.label.toLowerCase().includes(search.toLowerCase())) : null

  const W = collapsed ? 44 : 152

  // ── Section label ──────────────────────────────
  const SectionLabel = ({ children }: { children: React.ReactNode }) => collapsed ? null : (
    <div style={{
      padding: "8px 12px 4px",
      fontSize: 10,
      color: "var(--text-ghost)",
      letterSpacing: "0.065em",
      textTransform: "uppercase",
      fontWeight: 600,
      userSelect: "none",
    }}>
      {children}
    </div>
  )

  // ── Nav button ─────────────────────────────────
  const NavBtn = ({ label, href, iconUrl }: { label: string; href: string; iconUrl: string }) => {
    const isActive = pathname === href || (href === "/nodes" && (pathname === "/nodes" || onWorkflow))
    return (
      <button
        key={label}
        title={collapsed ? label : undefined}
        onClick={() => router.push(href)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: collapsed ? "7px 12px" : "6px 10px 6px 12px",
          borderRadius: 8,
          background: isActive ? "var(--bg-elevated-hover)" : "transparent",
          border: "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "left",
          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: 12.5,
          fontWeight: isActive ? 500 : 400,
          letterSpacing: "-0.01em",
          transition: "background 0.12s ease, color 0.12s ease",
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)" }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
      >
        <img
          src={iconUrl} alt={label} draggable={false}
          style={{ width: 16, height: 16, objectFit: "contain", opacity: isActive ? 0.9 : 0.5, flexShrink: 0 }}
        />
        {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>}
      </button>
    )
  }

  // ── Tool button ────────────────────────────────
  const ToolBtn = ({ label, iconUrl }: { label: string; iconUrl: string }) => (
    <button
      key={label}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: collapsed ? "7px 12px" : "6px 10px 6px 12px",
        borderRadius: 8,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        color: "var(--text-secondary)",
        fontSize: 12.5,
        width: "100%",
        textAlign: "left",
        letterSpacing: "-0.01em",
        transition: "background 0.12s ease, color 0.12s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"
        ;(e.currentTarget as HTMLElement).style.color = "var(--text-primary)"
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "transparent"
        ;(e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"
      }}
    >
      <img src={iconUrl} alt={label} draggable={false} style={{ width: 16, height: 16, objectFit: "contain", opacity: 0.52, flexShrink: 0 }} />
      {!collapsed && <span>{label}</span>}
    </button>
  )

  return (
    <div style={{
      width: W, minWidth: W, maxWidth: W,
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-sidebar)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      flexShrink: 0,
      overflow: "hidden",
      transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
      zIndex: 20,
    }}>

      {/* Toggle button */}
      <div style={{ height: 42, display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            width: 26, height: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 7, border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-ghost)",
            transition: "background 0.12s ease, color 0.12s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"
            ;(e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = "transparent"
            ;(e.currentTarget as HTMLElement).style.color = "var(--text-ghost)"
          }}
        >
          <PanelLeft size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 5px", flexShrink: 0 }}>
        {NAV.map(n => <NavBtn key={n.label} label={n.label} href={n.href} iconUrl={n.icon} />)}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", marginTop: 6, scrollbarWidth: "none" }}>

        <SectionLabel>Tools</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 5px" }}>
          {TOOLS.map(t => <ToolBtn key={t.label} label={t.label} iconUrl={t.icon} />)}
          {!collapsed && (
            <button style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "6px 10px 6px 12px", borderRadius: 8,
              border: "none", background: "transparent", cursor: "pointer",
              color: "var(--text-ghost)", fontSize: 12.5, width: "100%",
            }}>
              <MoreHorizontal size={14} style={{ opacity: 0.35, flexShrink: 0 }} />
              <span>More</span>
            </button>
          )}
        </div>

        {!collapsed && <SectionLabel>Sessions</SectionLabel>}

        {/* Quick Access — only when on workflow page */}
        {!collapsed && onWorkflow && (
          <div style={{ padding: "6px 5px 0" }}>
            <SectionLabel>Quick Access</SectionLabel>

            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              margin: "0 5px 6px",
              padding: "5px 10px",
              borderRadius: 8,
              background: "var(--bg-input)",
              border: "1px solid var(--border-input)",
            }}>
              <Search size={10} style={{ color: "var(--text-ghost)", flexShrink: 0 }} />
              <input
                placeholder="Search nodes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 11.5, color: "var(--text-soft)",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* Node list */}
            {(filtered ?? NODE_CATS.flatMap(c => [
              { type: null as NodeType | null, label: `__CAT__${c.label}`, Icon: null, color: "", icon: "" },
              ...c.items,
            ])).map((node, i) => {
              if (node.label.startsWith("__CAT__")) {
                return (
                  <div key={`cat-${i}`} style={{
                    padding: "7px 12px 3px",
                    fontSize: 10,
                    color: "var(--text-ghost)",
                    letterSpacing: "0.065em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    userSelect: "none",
                  }}>
                    {node.label.replace("__CAT__", "")}
                  </div>
                )
              }
              return (
                <button
                  key={String(node.type)}
                  onClick={() => add(node.type!)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "5px 10px 5px 12px",
                    borderRadius: 8,
                    border: "none", background: "transparent",
                    cursor: "pointer", width: "100%", textAlign: "left",
                    transition: "background 0.11s ease",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                >
                  {/* Icon badge */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    background: "var(--bg-input)",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <img src={node.icon} alt="" draggable={false} style={{ width: 12, height: 12, objectFit: "contain", opacity: 0.72 }} />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", letterSpacing: "-0.01em" }}>
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
        flexShrink: 0,
        padding: "7px 9px",
        borderTop: "1px solid var(--border-sidebar)",
      }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 5px",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background 0.12s ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
        >
          <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}>
                Free plan
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
