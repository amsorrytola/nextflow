"use client"

import { useRef, useCallback } from "react"
import {
  Play, SquarePlay, Undo2, Redo2, Download, Upload, Save, FlaskConical, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTemporalStore } from "@/hooks/useTemporalStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"
import { executeWorkflow } from "@/lib/executionEngine"

export function Toolbar() {
  const {
    workflowName, setNodes, setEdges, selectedNodeIds,
    nodes, edges, updateNodeData, setNodeExecutionStatus,
    resetExecutionStatus, addRun, executionStatus,
  } = useWorkflowStore()
  const { undo, redo, pastStates, futureStates } = useTemporalStore()
  const importRef = useRef<HTMLInputElement>(null)

  const isRunning = Object.values(executionStatus).some((s) => s === "running")
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const handleRun = useCallback(async (mode: "FULL" | "PARTIAL" | "SINGLE") => {
    if (isRunning) return
    resetExecutionStatus()

    const startTime = Date.now()
    const nodeRunRecords: Parameters<typeof addRun>[0]["nodeRuns"] = []

    await executeWorkflow(
      nodes, edges, mode, selectedNodeIds,
      (nodeId) => setNodeExecutionStatus(nodeId, "running"),
      (nodeId, result) => {
        setNodeExecutionStatus(nodeId, result.status === "success" ? "success" : "error")
        if (result.status === "success" && result.output !== null) {
          const node = nodes.find((n) => n.id === nodeId)
          if (node?.data.type === "llmNode") {
            updateNodeData(nodeId, { result: result.output as string, error: null })
          } else if (node?.data.type === "cropImageNode") {
            updateNodeData(nodeId, { result: result.output as string, error: null })
          } else if (node?.data.type === "extractFrameNode") {
            updateNodeData(nodeId, { result: result.output as string, error: null })
          }
        } else if (result.status === "failed") {
          updateNodeData(nodeId, { error: result.error })
        }
        const node = nodes.find((n) => n.id === nodeId)
        nodeRunRecords.push({
          nodeId,
          nodeType: node?.data.type ?? "unknown",
          nodeLabel: (node?.data as { label?: string }).label ?? nodeId,
          status: result.status === "success" ? "success" : "failed",
          inputs: {},
          outputs: result.output ? { result: result.output } : {},
          error: result.error,
          durationMs: result.durationMs,
        })
      }
    )

    const totalDuration = Date.now() - startTime
    const allSuccess = nodeRunRecords.every((n) => n.status === "success")
    const anySuccess = nodeRunRecords.some((n) => n.status === "success")

    addRun({
      id: `run-${Date.now()}`,
      runNumber: useWorkflowStore.getState().runs.length + 1,
      scope: mode,
      status: allSuccess ? "SUCCESS" : anySuccess ? "PARTIAL" : "FAILED",
      durationMs: totalDuration,
      createdAt: new Date(),
      nodeRuns: nodeRunRecords,
    })
  }, [isRunning, nodes, edges, selectedNodeIds, resetExecutionStatus,
    setNodeExecutionStatus, updateNodeData, addRun])

  const handleExport = () => {
    const { nodes, edges } = useWorkflowStore.getState()
    const data = JSON.stringify({ nodes, edges }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
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
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes)
          setEdges(parsed.edges)
        }
      } catch {
        alert("Invalid workflow JSON file")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <div className="flex items-center gap-2 px-4 h-12 border-b border-[#2a2a2a] bg-[#111111] shrink-0">
      <span className="text-sm font-medium text-white mr-2">{workflowName}</span>
      <div className="flex-1" />

      <button onClick={() => { setNodes(getSampleWorkflow().nodes); setEdges(getSampleWorkflow().edges) }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
          bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#9ca3af] border border-[#2a2a2a] transition-colors">
        <FlaskConical size={12} />Sample
      </button>

      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />

      <button disabled={isRunning} onClick={() => handleRun("FULL")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
          isRunning ? "bg-[#7c3aed] text-white cursor-not-allowed" : "bg-[#a855f7] hover:bg-[#9333ea] text-white"
        )}>
        {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
        Run Workflow
      </button>

      <button
        disabled={selectedNodeIds.length === 0 || isRunning}
        onClick={() => handleRun(selectedNodeIds.length === 1 ? "SINGLE" : "PARTIAL")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
          "bg-[#1a1a1a] border border-[#2a2a2a]",
          selectedNodeIds.length > 0 && !isRunning
            ? "text-[#9ca3af] hover:bg-[#2a2a2a]"
            : "text-[#3a3a3a] cursor-not-allowed"
        )}>
        <SquarePlay size={12} />
        Run Selected {selectedNodeIds.length > 0 && `(${selectedNodeIds.length})`}
      </button>

      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />

      <button disabled={!canUndo} onClick={() => undo()}
        className={cn("p-1.5 rounded-md transition-colors",
          canUndo ? "hover:bg-[#2a2a2a] text-[#9ca3af]" : "text-[#3a3a3a] cursor-not-allowed")}>
        <Undo2 size={14} />
      </button>
      <button disabled={!canRedo} onClick={() => redo()}
        className={cn("p-1.5 rounded-md transition-colors",
          canRedo ? "hover:bg-[#2a2a2a] text-[#9ca3af]" : "text-[#3a3a3a] cursor-not-allowed")}>
        <Redo2 size={14} />
      </button>

      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />

      <button onClick={handleExport} className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors">
        <Download size={14} />
      </button>
      <button onClick={() => importRef.current?.click()}
        className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors">
        <Upload size={14} />
      </button>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      <button className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors"
        onClick={() => console.log("save")}>
        <Save size={14} />
      </button>
    </div>
  )
}
