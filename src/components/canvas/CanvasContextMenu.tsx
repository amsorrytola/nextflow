"use client"

import { useEffect, useRef, useCallback } from "react"
import {
  Video, Type, Image as ImageIcon, Mic, Box, Layers,
  Zap, Hash, Film, Crop, Bot, Search, ChevronRight,
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

// ── Node definitions matching krea_right-mouse-click.png ──
const VIDEO_NODES = [
  { type: "llmNode" as NodeType, label: "Generate Video", icon: Video, color: "#29D246", description: "AI video generation" },
  { type: "llmNode" as NodeType, label: "Enhance Video", icon: Zap, color: "#29D246", description: "Upscale & improve" },
  { type: "extractFrameNode" as NodeType, label: "Motion Transfer", icon: Film, color: "#29D246", description: "Transfer motion style" },
  { type: "llmNode" as NodeType, label: "Lipsync", icon: Mic, color: "#29D246", description: "Sync lips to audio" },
  { type: "extractFrameNode" as NodeType, label: "Video Utility", icon: Film, color: "#29D246", description: "Extract & process frames" },
]

const OTHER_NODES = [
  { type: "llmNode" as NodeType, label: "Generate 3D", icon: Box, color: "#a855f7", description: "3D asset generation" },
  { type: "llmNode" as NodeType, label: "Audio", icon: Mic, color: "#f5a623", description: "Audio generation & FX" },
  { type: "uploadImageNode" as NodeType, label: "Assets", icon: Layers, color: "#4d9de0", description: "Upload & manage files" },
  { type: "textNode" as NodeType, label: "Utility", icon: Zap, color: "#888", description: "Text, math, logic nodes" },
]

const ASSET_NODES = [
  { type: "textNode" as NodeType, label: "Text", icon: Type, color: "#FCC800" },
  { type: "uploadImageNode" as NodeType, label: "Image", icon: ImageIcon, color: "#0080FF" },
  { type: "uploadVideoNode" as NodeType, label: "Video", icon: Video, color: "#29D246" },
  { type: "uploadVideoNode" as NodeType, label: "Audio", icon: Mic, color: "#f5a623" },
  { type: "llmNode" as NodeType, label: "3D Object", icon: Box, color: "#a855f7" },
  { type: "textNode" as NodeType, label: "Style", icon: Layers, color: "#888" },
  { type: "llmNode" as NodeType, label: "Kling Element", icon: Zap, color: "#4d9de0" },
  { type: "textNode" as NodeType, label: "Number", icon: Hash, color: "#888" },
]

function createDefaultData(type: NodeType, label?: string): AnyNodeData {
  switch (type) {
    case "textNode": return { type, label: label ?? "Text", text: "" }
    case "uploadImageNode": return { type, label: label ?? "Image", imageUrl: null, fileName: null }
    case "uploadVideoNode": return { type, label: label ?? "Video", videoUrl: null, fileName: null }
    case "llmNode": return { type, label: label ?? "Run LLM", model: "gemini-2.5-flash", systemPrompt: "", userMessage: "", result: null, error: null }
    case "cropImageNode": return { type, label: label ?? "Crop Image", xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100, result: null, error: null }
    case "extractFrameNode": return { type, label: label ?? "Extract Frame", timestamp: "0", result: null, error: null }
  }
}

let nodeCounter = 200

export function CanvasContextMenu({ x, y, canvasX, canvasY, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const { addNode } = useWorkflowStore()

  // Close on outside click or Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("keydown", handleKey)
    document.addEventListener("mousedown", handleClick)
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.removeEventListener("mousedown", handleClick)
    }
  }, [onClose])

  // Clamp menu to viewport
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) menuRef.current.style.left = `${x - rect.width}px`
    if (rect.bottom > vh) menuRef.current.style.top = `${y - rect.height}px`
  }, [x, y])

  const handleAdd = useCallback((type: NodeType, label?: string) => {
    const id = `ctx-${type}-${nodeCounter++}`
    addNode({
      id,
      type,
      position: { x: canvasX, y: canvasY },
      data: createDefaultData(type, label),
    })
    onClose()
  }, [addNode, canvasX, canvasY, onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] select-none"
      style={{ top: y, left: x }}
    >
      {/* ── Floating panel — matches Krea's right-click menu ── */}
      <div
        className="flex rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "rgba(18,18,18,0.97)",
          border: "0.5px solid rgba(255,255,255,0.11)",
          backdropFilter: "blur(20px)",
          minWidth: 460,
        }}
      >
        {/* Left: category list */}
        <div className="flex flex-col py-2" style={{ width: 220, borderRight: "0.5px solid rgba(255,255,255,0.07)" }}>
          {/* Search */}
          <div className="px-3 pb-2">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.08)" }}
            >
              <Search size={12} className="text-white/30 shrink-0" />
              <input
                autoFocus
                placeholder="Search nodes or models..."
                className="flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/25 outline-none"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Video section */}
          <div className="px-3 pt-1 pb-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: "#29D246" }} />
              <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Video</span>
            </div>
            {VIDEO_NODES.map(node => (
              <button
                key={node.label}
                onClick={() => handleAdd(node.type, node.label)}
                className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg transition-colors hover:bg-white/[0.07] group"
              >
                <span className="text-[13px] text-white/65 group-hover:text-white/90 transition-colors">
                  {node.label}
                </span>
                <ChevronRight size={11} className="text-white/20 group-hover:text-white/50" />
              </button>
            ))}
          </div>

          <div className="mx-3 my-1.5" style={{ height: "0.5px", background: "rgba(255,255,255,0.07)" }} />

          {/* Other section */}
          <div className="px-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: "#888" }} />
              <span className="text-[10px] text-white/30 font-medium uppercase tracking-widest">Other</span>
            </div>
            {OTHER_NODES.map(node => (
              <button
                key={node.label}
                onClick={() => handleAdd(node.type, node.label)}
                className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg transition-colors hover:bg-white/[0.07] group"
              >
                <span className="text-[13px] text-white/65 group-hover:text-white/90 transition-colors">
                  {node.label}
                </span>
                <ChevronRight size={11} className="text-white/20 group-hover:text-white/50" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: asset grid panel — matches krea_right-mouse-click.png */}
        <div className="flex flex-col py-2 px-2" style={{ width: 220 }}>
          {/* Hoverable preview card at top — mirrors Krea's "Image" tooltip */}
          <div
            className="rounded-xl p-3 mb-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <ImageIcon size={13} className="text-[#0080FF]" />
                <span className="text-[13px] text-white/80 font-medium">Image</span>
              </div>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(0,128,255,0.15)", color: "#0080FF" }}
              >
                Output: image
              </span>
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed">
              Handle an Image. Use as an input for other nodes or visualize the output of an image generation node.
            </p>
          </div>

          {/* Asset type grid */}
          <div className="flex flex-col gap-0.5">
            {ASSET_NODES.map(node => (
              <button
                key={node.label}
                onClick={() => handleAdd(node.type, node.label)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors hover:bg-white/[0.07] group text-left"
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: node.color + "18",
                    border: `0.5px solid ${node.color}35`,
                  }}
                >
                  <node.icon size={11} style={{ color: node.color }} />
                </div>
                <span className="text-[13px] text-white/60 group-hover:text-white/90 transition-colors">
                  {node.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}