"use client"

import { useEffect, useRef, useCallback } from "react"
import {
  Video, Type, Image as ImageIcon, Mic, Box, Layers,
  Zap, Hash, Film, Search, ChevronRight,
} from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import type { AnyNodeData, NodeType } from "@/types"

interface ContextMenuProps {
  x: number
  y: number
  canvasX: number
  canvasY: number
  onClose: () => void
}

const VIDEO_NODES = [
  { type: "llmNode"          as NodeType, label: "Generate Video",  icon: Video, color: "#29D246" },
  { type: "llmNode"          as NodeType, label: "Enhance Video",   icon: Zap,   color: "#29D246" },
  { type: "extractFrameNode" as NodeType, label: "Motion Transfer", icon: Film,  color: "#29D246" },
  { type: "llmNode"          as NodeType, label: "Lipsync",         icon: Mic,   color: "#29D246" },
  { type: "extractFrameNode" as NodeType, label: "Video Utility",   icon: Film,  color: "#29D246" },
]

const OTHER_NODES = [
  { type: "llmNode"         as NodeType, label: "Generate 3D", icon: Box,    color: "#9B6FFF" },
  { type: "llmNode"         as NodeType, label: "Audio",        icon: Mic,   color: "#FF9F43" },
  { type: "uploadImageNode" as NodeType, label: "Assets",       icon: Layers,color: "#0080FF" },
  { type: "textNode"        as NodeType, label: "Utility",      icon: Zap,   color: "#888" },
]

const ASSET_NODES = [
  { type: "textNode"         as NodeType, label: "Text",         icon: Type,      color: "#FCC800" },
  { type: "uploadImageNode"  as NodeType, label: "Image",        icon: ImageIcon, color: "#0080FF" },
  { type: "uploadVideoNode"  as NodeType, label: "Video",        icon: Video,     color: "#29D246" },
  { type: "uploadVideoNode"  as NodeType, label: "Audio",        icon: Mic,       color: "#FF9F43" },
  { type: "llmNode"          as NodeType, label: "3D Object",    icon: Box,       color: "#9B6FFF" },
  { type: "textNode"         as NodeType, label: "Style",        icon: Layers,    color: "#888" },
  { type: "llmNode"          as NodeType, label: "Kling Element",icon: Zap,       color: "#0080FF" },
  { type: "textNode"         as NodeType, label: "Number",       icon: Hash,      color: "#888" },
]

function mkDefault(type: NodeType, label?: string): AnyNodeData {
  switch (type) {
    case "textNode":         return { type, label: label ?? "Text",          text: "" }
    case "uploadImageNode":  return { type, label: label ?? "Image",         imageUrl: null, fileName: null }
    case "uploadVideoNode":  return { type, label: label ?? "Video",         videoUrl: null, fileName: null }
    case "llmNode":          return { type, label: label ?? "Run LLM",       model: "gemini-2.5-flash", systemPrompt: "", userMessage: "", result: null, error: null }
    case "cropImageNode":    return { type, label: label ?? "Crop Image",    xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100, result: null, error: null }
    case "extractFrameNode": return { type, label: label ?? "Extract Frame", timestamp: "0", result: null, error: null }
  }
}

let ctxCounter = 500

export function CanvasContextMenu({ x, y, canvasX, canvasY, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { addNode } = useWorkflowStore()

  useEffect(() => {
    const onKey   = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    const onMouse = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onMouse)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onMouse)
    }
  }, [onClose])

  // Clamp to viewport edges
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth, vh = window.innerHeight
    if (rect.right  > vw) menuRef.current.style.left = `${x - rect.width}px`
    if (rect.bottom > vh) menuRef.current.style.top  = `${y - rect.height}px`
  }, [x, y])

  const handleAdd = useCallback((type: NodeType, label?: string) => {
    const id = `ctx-${type}-${ctxCounter++}`
    addNode({ id, type, position: { x: canvasX, y: canvasY }, data: mkDefault(type, label) })
    onClose()
  }, [addNode, canvasX, canvasY, onClose])

  // ── Shared row button ──
  const RowBtn = ({ type, label, icon: Icon, color }: { type: NodeType; label: string; icon: React.ElementType; color: string }) => (
    <button
      onClick={() => handleAdd(type, label)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "6px 10px",
        borderRadius: 8, border: "none", background: "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.1s ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.055)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
          background: color + "18",
          border: `1px solid ${color}32`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={10} style={{ color }} />
        </div>
        <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.68)", letterSpacing: "-0.01em" }}>
          {label}
        </span>
      </div>
      <ChevronRight size={10} style={{ color: "rgba(255,255,255,0.18)", flexShrink: 0 }} />
    </button>
  )

  // ── Asset grid button (right panel) ──
  const AssetBtn = ({ type, label, icon: Icon, color }: { type: NodeType; label: string; icon: React.ElementType; color: string }) => (
    <button
      onClick={() => handleAdd(type, label)}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        width: "100%", padding: "6px 10px",
        borderRadius: 8, border: "none", background: "transparent",
        cursor: "pointer", textAlign: "left",
        transition: "background 0.1s ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.055)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
        background: color + "16",
        border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={11} style={{ color }} />
      </div>
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.62)", letterSpacing: "-0.01em" }}>
        {label}
      </span>
    </button>
  )

  const Divider = () => (
    <div style={{ height: 1, margin: "4px 10px", background: "rgba(255,255,255,0.055)" }} />
  )

  const SectionHead = ({ color, label }: { color: string; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px 2px" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </span>
    </div>
  )

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: y,
        left: x,
        zIndex: 9999,
        animation: "contextMenuIn 0.16s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div style={{
        display: "flex",
        borderRadius: 18,
        overflow: "hidden",
        background: "rgba(13,13,13,0.97)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 28px 80px rgba(0,0,0,0.80), 0 4px 16px rgba(0,0,0,0.45)",
        minWidth: 470,
      }}>

        {/* ── Left panel: search + categories ── */}
        <div style={{ width: 220, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Search */}
          <div style={{ padding: "12px 10px 8px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 12px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <Search size={12} style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0 }} />
              <input
                autoFocus
                placeholder="Search nodes or models…"
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 12, color: "rgba(255,255,255,0.72)",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Video section */}
          <div style={{ paddingBottom: 4 }}>
            <SectionHead color="#29D246" label="Video" />
            {VIDEO_NODES.map(n => (
              <RowBtn key={n.label} type={n.type} label={n.label} icon={n.icon} color={n.color} />
            ))}
          </div>

          <Divider />

          {/* Other section */}
          <div style={{ paddingBottom: 8 }}>
            <SectionHead color="#888" label="Other" />
            {OTHER_NODES.map(n => (
              <RowBtn key={n.label} type={n.type} label={n.label} icon={n.icon} color={n.color} />
            ))}
          </div>
        </div>

        {/* ── Right panel: asset type grid ── */}
        <div style={{ width: 220, display: "flex", flexDirection: "column" }}>

          {/* Preview card */}
          <div style={{ padding: "12px 12px 8px" }}>
            <div style={{
              borderRadius: 12,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.034)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <ImageIcon size={13} style={{ color: "#0080FF" }} />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>Image</span>
                </div>
                <span style={{
                  fontSize: 9.5, padding: "2px 8px", borderRadius: 99,
                  background: "rgba(0,128,255,0.14)",
                  color: "#0080FF", letterSpacing: "0.01em",
                }}>
                  image
                </span>
              </div>
              <p style={{
                fontSize: 11, color: "rgba(255,255,255,0.32)",
                lineHeight: 1.55, letterSpacing: "0.005em",
              }}>
                Handle an image. Use as input or visualize output from image generation nodes.
              </p>
            </div>
          </div>

          {/* Asset list */}
          <div style={{ padding: "0 4px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
            {ASSET_NODES.map(n => (
              <AssetBtn key={n.label} type={n.type} label={n.label} icon={n.icon} color={n.color} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
