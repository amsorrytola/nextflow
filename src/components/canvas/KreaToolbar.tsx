"use client"

import { useRef } from "react"
import { MousePointer2, Hand, Scissors, Plus, Undo2, Redo2, Download, Upload, FlaskConical, Keyboard, Play, SquarePlay, Loader2 } from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTemporalStore } from "@/hooks/useTemporalStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"
import { runWorkflowMode } from "@/lib/runWorkflowMode"

// Shared pill container style
const PILL: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "4px 5px",
  background: "var(--bg-pill)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-pill)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "var(--shadow-pill)",
}

// Icon tool button
function TBtn({ icon: Icon, label, onClick, disabled, active }: {
  icon: React.ElementType; label: string; onClick?: () => void; disabled?: boolean; active?: boolean
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 30, height: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, border: "none",
        background: active ? "var(--bg-elevated-hover)" : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled
          ? "var(--text-ghost)"
          : active
          ? "var(--text-primary)"
          : "var(--text-faint)",
        opacity: disabled ? 0.35 : 1,
        transition: "background 0.11s ease, color 0.11s ease",
      }}
      onMouseEnter={e => {
        if (!disabled) {
          ;(e.currentTarget as HTMLElement).style.background = "var(--bg-elevated-hover)"
          ;(e.currentTarget as HTMLElement).style.color = "var(--text-soft)"
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !active) {
          ;(e.currentTarget as HTMLElement).style.background = "transparent"
          ;(e.currentTarget as HTMLElement).style.color = "var(--text-faint)"
        }
      }}
    >
      <Icon size={13} strokeWidth={active ? 2.4 : 2} />
    </button>
  )
}

// Thin vertical divider
const Div = () => (
  <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 3px", flexShrink: 0 }} />
)

export function KreaToolbar() {
  const { workflowName, setNodes, setEdges, selectedNodeIds, removeSelectedElements, executionStatus } = useWorkflowStore()
  const { undo, redo, pastStates, futureStates } = useTemporalStore()
  const importRef = useRef<HTMLInputElement>(null)
  const isRunning = Object.values(executionStatus).some(s => s === "running")
  const hasSel    = selectedNodeIds.length > 0

  const handleExport = () => {
    const { nodes, edges } = useWorkflowStore.getState()
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
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
      {/* Bottom-left: undo / redo + keyboard hint */}
      <div style={{ position: "absolute", bottom: 24, left: 56, zIndex: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={PILL}>
          <TBtn icon={Undo2} label="Undo (⌘Z)"  onClick={() => undo()} disabled={pastStates.length  === 0} />
          <TBtn icon={Redo2} label="Redo (⌘⇧Z)" onClick={() => redo()} disabled={futureStates.length === 0} />
        </div>
        <div style={{ ...PILL, padding: "6px 12px", gap: 6, cursor: "default" }}>
          <Keyboard size={11} style={{ color: "var(--text-ghost)", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "var(--text-ghost)", letterSpacing: "-0.01em" }}>Keyboard shortcuts</span>
        </div>
      </div>

      {/* Bottom-center: run + tools + IO */}
      <div style={{
        position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
        zIndex: 20, display: "flex", alignItems: "center", gap: 7,
      }}>

        {/* Run pill */}
        <div style={PILL}>
          <button
            onClick={() => runWorkflowMode("FULL")}
            disabled={isRunning}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "5px 14px 5px 9px",
              borderRadius: 9,
              background: isRunning
                ? "rgba(155,111,255,0.15)"
                : "linear-gradient(180deg, #a47aff 0%, #7c4fff 100%)",
              border: "none",
              cursor: isRunning ? "not-allowed" : "pointer",
              color: "rgba(255,255,255,0.95)",
              fontSize: 12.5, fontWeight: 500,
              letterSpacing: "-0.015em",
              boxShadow: isRunning ? "none" : "0 6px 22px rgba(124,79,255,0.42), inset 0 1px 0 rgba(255,255,255,0.16)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1)" }}
          >
            {/* Icon badge */}
            <span style={{
              width: 22, height: 22, borderRadius: 7,
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {isRunning
                ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                : <Play size={12} fill="currentColor" strokeWidth={0} />}
            </span>
            {isRunning ? "Running…" : "Run"}
          </button>

          {hasSel && !isRunning && (
            <button
              onClick={() => runWorkflowMode(selectedNodeIds.length === 1 ? "SINGLE" : "PARTIAL")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 10px",
                borderRadius: 8, border: "none", background: "transparent",
                cursor: "pointer", color: "var(--text-faint)", fontSize: 12,
                transition: "background 0.11s ease, color 0.11s ease",
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.background = "var(--bg-elevated-hover)"
                ;(e.currentTarget as HTMLElement).style.color = "var(--text-soft)"
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.background = "transparent"
                ;(e.currentTarget as HTMLElement).style.color = "var(--text-faint)"
              }}
            >
              <SquarePlay size={13} />
              <span>({selectedNodeIds.length})</span>
            </button>
          )}
        </div>

        {/* Tools pill */}
        <div style={PILL}>
          <TBtn icon={Plus}          label="Add node" />
          <TBtn icon={MousePointer2} label="Select (V)" active />
          <TBtn icon={Hand}          label="Pan (H)" />
          <TBtn icon={Scissors}      label="Cut selected" onClick={hasSel ? removeSelectedElements : undefined} disabled={!hasSel} />
        </div>

        {/* IO pill */}
        <div style={PILL}>
          <TBtn icon={Download}     label="Export JSON"  onClick={handleExport} />
          <TBtn icon={Upload}       label="Import JSON"  onClick={() => importRef.current?.click()} />
          <Div />
          <TBtn icon={FlaskConical} label="Load sample"  onClick={() => { const s = getSampleWorkflow(); setNodes(s.nodes); setEdges(s.edges) }} />
          <input ref={importRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        </div>
      </div>
    </>
  )
}