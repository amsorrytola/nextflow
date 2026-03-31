"use client"

import { useRef } from "react"
import {
  Play, SquarePlay, Undo2, Redo2, Download, Upload, Save, FlaskConical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTemporalStore } from "@/hooks/useTemporalStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"

export function Toolbar() {
  const { workflowName, setNodes, setEdges, selectedNodeIds, nodes } = useWorkflowStore()
  const { undo, redo, pastStates, futureStates } = useTemporalStore()
  const importRef = useRef<HTMLInputElement>(null)

  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

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

  const handleLoadSample = () => {
    const { nodes, edges } = getSampleWorkflow()
    setNodes(nodes)
    setEdges(edges)
  }

  return (
    <div className="flex items-center gap-2 px-4 h-12 border-b border-[#2a2a2a] bg-[#111111] shrink-0">
      <span className="text-sm font-medium text-white mr-2">{workflowName}</span>
      <div className="flex-1" />

      {/* Load sample */}
      <button
        onClick={handleLoadSample}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
          bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#9ca3af] border border-[#2a2a2a] transition-colors"
        title="Load sample workflow"
      >
        <FlaskConical size={12} />
        Sample
      </button>

      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />

      {/* Run buttons */}
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
          bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors"
        onClick={() => console.log("run all")}
      >
        <Play size={12} />
        Run Workflow
      </button>
      <button
        disabled={selectedNodeIds.length === 0}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
          "bg-[#1a1a1a] border border-[#2a2a2a]",
          selectedNodeIds.length > 0
            ? "text-[#9ca3af] hover:bg-[#2a2a2a]"
            : "text-[#3a3a3a] cursor-not-allowed"
        )}
        onClick={() => console.log("run selected", selectedNodeIds)}
      >
        <SquarePlay size={12} />
        Run Selected {selectedNodeIds.length > 0 && `(${selectedNodeIds.length})`}
      </button>

      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />

      {/* Undo / Redo */}
      <button
        disabled={!canUndo}
        onClick={() => undo()}
        title="Undo (Cmd+Z)"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          canUndo ? "hover:bg-[#2a2a2a] text-[#9ca3af]" : "text-[#3a3a3a] cursor-not-allowed"
        )}
      >
        <Undo2 size={14} />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => redo()}
        title="Redo (Cmd+Shift+Z)"
        className={cn(
          "p-1.5 rounded-md transition-colors",
          canRedo ? "hover:bg-[#2a2a2a] text-[#9ca3af]" : "text-[#3a3a3a] cursor-not-allowed"
        )}
      >
        <Redo2 size={14} />
      </button>

      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />

      {/* Export / Import / Save */}
      <button
        onClick={handleExport}
        title="Export workflow as JSON"
        className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors"
      >
        <Download size={14} />
      </button>
      <button
        onClick={() => importRef.current?.click()}
        title="Import workflow from JSON"
        className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors"
      >
        <Upload size={14} />
      </button>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      <button
        title="Save workflow"
        className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors"
        onClick={() => console.log("save")}
      >
        <Save size={14} />
      </button>
    </div>
  )
}
