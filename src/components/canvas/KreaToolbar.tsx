"use client"

import { useRef, useCallback } from "react"
import {
  Plus, MousePointer2, Hand, Scissors, Link2,
  Undo2, Redo2, Download, Upload, Play, SquarePlay, Loader2, FlaskConical, Keyboard
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTemporalStore } from "@/hooks/useTemporalStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"
import { executeWorkflow } from "@/lib/executionEngine"
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
    workflowName, setNodes, setEdges, selectedNodeIds,
    nodes, edges, updateNodeData, setNodeExecutionStatus,
    resetExecutionStatus, addRun, executionStatus,
  } = useWorkflowStore()
  const { undo, redo, pastStates, futureStates } = useTemporalStore()
  const importRef = useRef<HTMLInputElement>(null)

  const isRunning = Object.values(executionStatus).some(s => s === "running")
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const handleRun = useCallback(async (mode: "FULL" | "PARTIAL" | "SINGLE") => {
    if (isRunning) return
    resetExecutionStatus()
    const startTime = Date.now()
    const nodeRunRecords: Parameters<typeof addRun>[0]["nodeRuns"] = []

    await executeWorkflow(nodes, edges, mode, selectedNodeIds,
      (nodeId) => setNodeExecutionStatus(nodeId, "running"),
      (nodeId, result) => {
        setNodeExecutionStatus(nodeId, result.status === "success" ? "success" : "error")
        const node = nodes.find(n => n.id === nodeId)
        if (result.status === "success" && result.output !== null) {
          if (node?.data.type === "llmNode") updateNodeData(nodeId, { result: result.output as string, error: null })
          else if (node?.data.type === "cropImageNode") updateNodeData(nodeId, { result: result.output as string, error: null })
          else if (node?.data.type === "extractFrameNode") updateNodeData(nodeId, { result: result.output as string, error: null })
        } else if (result.status === "failed") {
          updateNodeData(nodeId, { error: result.error })
        }
        nodeRunRecords.push({
          nodeId, nodeType: node?.data.type ?? "unknown",
          nodeLabel: (node?.data as { label?: string }).label ?? nodeId,
          status: result.status === "success" ? "success" : "failed",
          inputs: {}, outputs: result.output ? { result: result.output } : {},
          error: result.error, durationMs: result.durationMs,
        })
      }
    )

    const totalDuration = Date.now() - startTime
    const allSuccess = nodeRunRecords.every(n => n.status === "success")
    const anySuccess = nodeRunRecords.some(n => n.status === "success")
    addRun({
      id: `run-${Date.now()}`,
      runNumber: useWorkflowStore.getState().runs.length + 1,
      scope: mode, status: allSuccess ? "SUCCESS" : anySuccess ? "PARTIAL" : "FAILED",
      durationMs: totalDuration, createdAt: new Date(), nodeRuns: nodeRunRecords,
    })
  }, [isRunning, nodes, edges, selectedNodeIds, resetExecutionStatus, setNodeExecutionStatus, updateNodeData, addRun])

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
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
      {/* Run controls */}
      <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl shadow-xl"
        style={{ background: "rgba(30,30,30,0.95)", border: "0.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <button
          onClick={() => handleRun("FULL")}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all",
            isRunning
              ? "text-[#a855f7] cursor-not-allowed"
              : "bg-[#a855f7] hover:bg-[#9333ea] text-white"
          )}>
          {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          {isRunning ? "Running..." : "Run"}
        </button>
        {selectedNodeIds.length > 0 && (
          <button
            disabled={isRunning}
            onClick={() => handleRun(selectedNodeIds.length === 1 ? "SINGLE" : "PARTIAL")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[13px] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-colors">
            <SquarePlay size={13} />
            {selectedNodeIds.length > 0 ? `(${selectedNodeIds.length})` : "Selected"}
          </button>
        )}
      </div>

      {/* Main tools — matches Krea's 4-icon toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl shadow-xl"
        style={{ background: "rgba(30,30,30,0.95)", border: "0.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <ToolBtn icon={Plus} label="Add node" />
        <ToolBtn icon={MousePointer2} label="Select (V)" />
        <ToolBtn icon={Hand} label="Pan (H)" />
        <ToolBtn icon={Scissors} label="Cut" />
        <ToolBtn icon={Link2} label="Connect" />
      </div>

      {/* History + IO */}
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl shadow-xl"
        style={{ background: "rgba(30,30,30,0.95)", border: "0.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <ToolBtn icon={Undo2} label="Undo" onClick={() => undo()} disabled={!canUndo} />
        <ToolBtn icon={Redo2} label="Redo" onClick={() => redo()} disabled={!canRedo} />
        <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />
        <ToolBtn icon={Download} label="Export JSON" onClick={handleExport} />
        <ToolBtn icon={Upload} label="Import JSON" onClick={() => importRef.current?.click()} />
        <ToolBtn icon={FlaskConical} label="Load Sample" onClick={() => {
          const s = getSampleWorkflow(); setNodes(s.nodes); setEdges(s.edges)
        }} />
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>

      {/* Keyboard shortcuts */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-xl"
        style={{ background: "rgba(30,30,30,0.95)", border: "0.5px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
        <Keyboard size={13} className="text-white/30" />
        <span className="text-[12px] text-white/30">Shortcuts</span>
      </div>
    </div>
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
        "w-8 h-8 flex items-center justify-center rounded-lg transition-colors",
        disabled
          ? "text-white/15 cursor-not-allowed"
          : "text-white/50 hover:text-white/90 hover:bg-white/[0.08]"
      )}>
      <Icon size={15} />
    </button>
  )
}