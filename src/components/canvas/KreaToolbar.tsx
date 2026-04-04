"use client"

import { useRef } from "react"
import {
  Plus, MousePointer2, Hand, Scissors, Link2,
  Undo2, Redo2, Download, Upload, Play, SquarePlay, Loader2, FlaskConical, Keyboard, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTemporalStore } from "@/hooks/useTemporalStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"
import { runWorkflowMode } from "@/lib/runWorkflowMode"
import type { NodeType } from "@/types"
import type { AnyNodeData } from "@/types"

let nodeCounter = 100

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

export function KreaToolbar() {
  const {
    workflowName, setNodes, setEdges, selectedNodeIds, selectedEdgeIds, removeSelectedElements, executionStatus,
  } = useWorkflowStore()
  const { undo, redo, pastStates, futureStates } = useTemporalStore()
  const importRef = useRef<HTMLInputElement>(null)

  const isRunning = Object.values(executionStatus).some(s => s === "running")
  const hasSelection = selectedNodeIds.length > 0 || selectedEdgeIds.length > 0
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const handleExport = () => {
    const { nodes, edges } = useWorkflowStore.getState()
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, "-").toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (parsed.nodes && parsed.edges) { setNodes(parsed.nodes); setEdges(parsed.edges) }
      } catch { alert("Invalid workflow JSON") }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <>
      <div className="absolute bottom-6 left-12 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1 px-1 py-1 rounded-xl shadow-xl"
          style={{ background: "rgba(34,34,34,0.94)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(16px)" }}>
          <ToolBtn icon={Undo2} label="Undo" onClick={() => undo()} disabled={!canUndo} />
          <ToolBtn icon={Redo2} label="Redo" onClick={() => redo()} disabled={!canRedo} />
        </div>

        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium shadow-xl"
          style={{
            minHeight: 28,
            background: "rgba(34,34,34,0.94)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(16px)",
          }}
        >
          <Keyboard size={11} />
          Keyboard shortcuts
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      {/* Run controls */}
      <div className="flex items-center gap-1 px-1 py-1 rounded-[14px] shadow-xl"
        style={{ background: "rgba(34,34,34,0.94)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(16px)" }}>
        <button
          onClick={() => runWorkflowMode("FULL")}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-[12px] font-medium transition-all",
            isRunning ? "cursor-not-allowed" : "hover:brightness-110"
          )}
          style={{
            minHeight: 28,
            background: isRunning
              ? "rgba(168,85,247,0.18)"
              : "linear-gradient(180deg, #b05cff 0%, #8f3dff 100%)",
            color: "white",
            boxShadow: isRunning
              ? "0 6px 16px rgba(168,85,247,0.18)"
              : "0 8px 22px rgba(143,61,255,0.34), inset 0 1px 0 rgba(255,255,255,0.14)",
          }}
        >
          <span
            className="flex items-center justify-center rounded-full shrink-0"
            style={{
              width: 22,
              height: 22,
              background: "rgba(255,255,255,0.14)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            }}
          >
            {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
          </span>
          {isRunning ? "Running..." : "Run"}
        </button>
        {selectedNodeIds.length > 0 && (
          <button
            disabled={isRunning}
            onClick={() => runWorkflowMode(selectedNodeIds.length === 1 ? "SINGLE" : "PARTIAL")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[11px] text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors">
            <SquarePlay size={12} />
            {selectedNodeIds.length > 0 ? `(${selectedNodeIds.length})` : "Selected"}
          </button>
        )}
        {hasSelection && (
          <button
            disabled={isRunning}
            onClick={removeSelectedElements}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-[11px] text-[12px] transition-colors",
              isRunning
                ? "text-white/20 cursor-not-allowed"
                : "text-red-300/80 hover:text-red-200 hover:bg-red-500/10"
            )}>
            <Trash2 size={12} />
            Delete {selectedNodeIds.length > 0 ? `(${selectedNodeIds.length}${selectedEdgeIds.length > 0 ? ` + ${selectedEdgeIds.length}` : ""})` : `(edge${selectedEdgeIds.length > 1 ? "s" : ""})`}
          </button>
        )}
      </div>

      {/* Main tools — matches Krea's 4-icon toolbar */}
      <div className="flex items-center gap-0.5 px-1 py-1 rounded-[14px] shadow-xl"
        style={{ background: "rgba(34,34,34,0.94)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(16px)" }}>
        <ToolBtn icon={Plus} label="Add node" />
        <ToolBtn icon={MousePointer2} label="Select (V)" />
        <ToolBtn icon={Hand} label="Pan (H)" />
        <ToolBtn icon={Scissors} label="Cut selected" onClick={hasSelection ? removeSelectedElements : undefined} disabled={!hasSelection || isRunning} />
        <ToolBtn icon={Link2} label="Connect" />
      </div>

      {/* History + IO */}
      <div className="flex items-center gap-0.5 px-1 py-1 rounded-[14px] shadow-xl"
        style={{ background: "rgba(34,34,34,0.94)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(16px)" }}>
        <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
        <ToolBtn icon={Download} label="Export JSON" onClick={handleExport} />
        <ToolBtn icon={Upload} label="Import JSON" onClick={() => importRef.current?.click()} />
        <ToolBtn icon={FlaskConical} label="Load Sample" onClick={() => {
          const s = getSampleWorkflow(); setNodes(s.nodes); setEdges(s.edges)
        }} />
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
      </div>
    </>
  )
}

function ToolBtn({ icon: Icon, label, onClick, disabled }: {
  icon: React.ElementType; label: string; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-[10px] transition-colors",
        disabled
          ? "text-white/15 cursor-not-allowed"
          : "text-white/50 hover:text-white/90 hover:bg-white/[0.08]"
      )}>
      <Icon size={14} />
    </button>
  )
}
