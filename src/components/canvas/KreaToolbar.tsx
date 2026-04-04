"use client"

import { useRef } from "react"
import { MousePointer2, Hand, Scissors, Plus, Undo2, Redo2, Download, Upload, FlaskConical, Keyboard, Play, SquarePlay, Loader2 } from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTemporalStore } from "@/hooks/useTemporalStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"
import { runWorkflowMode } from "@/lib/runWorkflowMode"
import { cn } from "@/lib/utils"

const pill: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 1,
  padding: "4px 4px",
  background: "rgba(18,18,18,0.92)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14,
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)",
}

function TBtn({ icon: Icon, label, onClick, disabled }: {
  icon: React.ElementType; label: string; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button title={label} onClick={onClick} disabled={disabled}
      className={cn("flex items-center justify-center rounded-[10px] transition-all",
        disabled ? "opacity-20 cursor-not-allowed" : "hover:bg-white/[0.07] active:scale-95")}
      style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.48)" }}>
      <Icon size={14} />
    </button>
  )
}

const div = () => <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />

export function KreaToolbar() {
  const { workflowName, setNodes, setEdges, selectedNodeIds, removeSelectedElements, executionStatus } = useWorkflowStore()
  const { undo, redo, pastStates, futureStates } = useTemporalStore()
  const importRef = useRef<HTMLInputElement>(null)
  const isRunning = Object.values(executionStatus).some(s => s === "running")
  const hasSelection = selectedNodeIds.length > 0

  const handleExport = () => {
    const { nodes, edges } = useWorkflowStore.getState()
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `${workflowName.replace(/\s+/g, "-").toLowerCase()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const p = JSON.parse(ev.target?.result as string)
        if (p.nodes && p.edges) { setNodes(p.nodes); setEdges(p.edges) }
      } catch { alert("Invalid workflow JSON") }
    }
    reader.readAsText(file); e.target.value = ""
  }

  return (
    <>
      {/* Bottom-left: undo/redo + shortcuts */}
      <div style={{ position: "absolute", bottom: 24, left: 56, zIndex: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={pill}>
          <TBtn icon={Undo2} label="Undo" onClick={() => undo()} disabled={pastStates.length === 0} />
          <TBtn icon={Redo2} label="Redo" onClick={() => redo()} disabled={futureStates.length === 0} />
        </div>
        <div style={{ ...pill, padding: "4px 12px", color: "rgba(255,255,255,0.28)", fontSize: 11.5,
          display: "flex", alignItems: "center", gap: 6, cursor: "default" }}>
          <Keyboard size={11} style={{ opacity: 0.6 }} />
          <span>Keyboard shortcuts</span>
        </div>
      </div>

      {/* Bottom-center: run + tools + io */}
      <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 20, display: "flex", alignItems: "center", gap: 8 }}>

        {/* Run pill */}
        <div style={pill}>
          <button onClick={() => runWorkflowMode("FULL")} disabled={isRunning}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "5px 14px 5px 8px", borderRadius: 11,
              background: isRunning ? "rgba(155,111,255,0.18)" : "linear-gradient(180deg,#a47aff 0%,#7c4fff 100%)",
              border: "none", cursor: isRunning ? "not-allowed" : "pointer",
              color: "white", fontSize: 12.5, fontWeight: 500,
              boxShadow: isRunning ? "none" : "0 6px 20px rgba(124,79,255,0.40), inset 0 1px 0 rgba(255,255,255,0.18)",
              transition: "all 0.15s ease", letterSpacing: "-0.01em",
            }}>
            <span style={{ width: 22, height: 22, borderRadius: 8, background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isRunning ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={12} fill="currentColor" />}
            </span>
            {isRunning ? "Running..." : "Run"}
          </button>

          {hasSelection && !isRunning && (
            <button onClick={() => runWorkflowMode(selectedNodeIds.length === 1 ? "SINGLE" : "PARTIAL")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                borderRadius: 10, border: "none", background: "transparent", cursor: "pointer",
                color: "rgba(255,255,255,0.45)", fontSize: 12, letterSpacing: "-0.01em",
                transition: "color 0.12s, background 0.12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.background = "transparent" }}>
              <SquarePlay size={13} />
              <span>({selectedNodeIds.length})</span>
            </button>
          )}
        </div>

        {/* Tool pill */}
        <div style={pill}>
          <TBtn icon={Plus}          label="Add node" />
          <TBtn icon={MousePointer2} label="Select (V)" />
          <TBtn icon={Hand}          label="Pan (H)" />
          <TBtn icon={Scissors}      label="Cut selected" onClick={hasSelection ? removeSelectedElements : undefined} disabled={!hasSelection} />
        </div>

        {/* IO pill */}
        <div style={pill}>
          {div()}
          <TBtn icon={Download}    label="Export JSON"  onClick={handleExport} />
          <TBtn icon={Upload}      label="Import JSON"  onClick={() => importRef.current?.click()} />
          <TBtn icon={FlaskConical}label="Load Sample"  onClick={() => { const s = getSampleWorkflow(); setNodes(s.nodes); setEdges(s.edges) }} />
          <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        </div>
      </div>
    </>
  )
}
