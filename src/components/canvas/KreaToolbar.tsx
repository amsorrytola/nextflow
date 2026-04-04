"use client"

import { useRef, useState } from "react"
import {
  MousePointer2, Hand, Scissors, Plus,
  Undo2, Redo2, Download, Upload, FlaskConical, Keyboard,
  Play, SquarePlay, Loader2, ZoomIn, ZoomOut, Maximize2,
} from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import { useTemporalStore } from "@/hooks/useTemporalStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"
import { runWorkflowMode } from "@/lib/runWorkflowMode"

// ── shared container pill ─────────────────────────────────────────────────────
const PILL: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 2, padding: "4px",
  background: "rgba(18,18,18,0.96)",
  border: "1px solid rgba(255,255,255,0.072)",
  borderRadius: 11,
  backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 8px 28px rgba(0,0,0,0.52), 0 1px 4px rgba(0,0,0,0.28)",
}

// ── icon button ───────────────────────────────────────────────────────────────
function IBtn({ icon: Icon, label, onClick, disabled, active, size = 14 }: {
  icon: React.ElementType; label: string; size?: number;
  onClick?: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      title={label} onClick={onClick} disabled={disabled}
      style={{
        width: 30, height: 30, borderRadius: 7, border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: active ? "rgba(255,255,255,0.09)" : "transparent",
        color: disabled ? "var(--text-ghost)" : active ? "var(--text-primary)" : "var(--text-faint)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.32 : 1,
        transition: "background 0.10s, color 0.10s",
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!disabled) { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.075)"; (e.currentTarget as HTMLElement).style.color="var(--text-soft)" }}}
      onMouseLeave={e => { if (!disabled && !active) { (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="var(--text-faint)" }}}
    >
      <Icon size={size} strokeWidth={active ? 2.2 : 1.9}/>
    </button>
  )
}

const Div = () => <div style={{ width:1, height:14, background:"rgba(255,255,255,0.08)", margin:"0 2px", flexShrink:0 }}/>

export function KreaToolbar() {
  const { workflowName, setNodes, setEdges, selectedNodeIds, removeSelectedElements, executionStatus } = useWorkflowStore()
  const { undo, redo, pastStates, futureStates } = useTemporalStore()
  const importRef = useRef<HTMLInputElement>(null)

  // Active tool state
  const [activeTool, setActiveTool] = useState<"select" | "pan" | "cut">("select")

  const isRunning = Object.values(executionStatus).some(s => s === "running")
  const hasSel    = selectedNodeIds.length > 0

  const handleExport = () => {
    const { nodes, edges } = useWorkflowStore.getState()
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href = url; a.download = `${workflowName.replace(/\s+/g,"-").toLowerCase()}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try { const p = JSON.parse(ev.target?.result as string); if (p.nodes && p.edges) { setNodes(p.nodes); setEdges(p.edges) } }
      catch { alert("Invalid workflow JSON") }
    }
    reader.readAsText(file); e.target.value = ""
  }

  return (
    <>
      {/* ── Bottom-left: undo/redo + keyboard hint ── */}
      <div style={{ position:"absolute", bottom:22, left:54, zIndex:20, display:"flex", alignItems:"center", gap:7 }}>
        <div style={PILL}>
          <IBtn icon={Undo2} label="Undo (⌘Z)"  onClick={() => undo()} disabled={pastStates.length===0}/>
          <IBtn icon={Redo2} label="Redo (⌘⇧Z)" onClick={() => redo()} disabled={futureStates.length===0}/>
        </div>
        <div style={{ ...PILL, padding:"6px 12px", cursor:"default", gap:7 }}>
          <Keyboard size={11} style={{ color:"var(--text-ghost)", flexShrink:0 }}/>
          <span style={{ fontSize:11.5, color:"var(--text-ghost)", letterSpacing:"-0.01em" }}>Keyboard shortcuts</span>
        </div>
      </div>

      {/* ── Bottom-center: run + tools + io ── */}
      <div style={{ position:"absolute", bottom:22, left:"50%", transform:"translateX(-50%)", zIndex:20, display:"flex", alignItems:"center", gap:6 }}>

        {/* Run pill */}
        <div style={PILL}>
          {/* Run All button */}
          <button
            onClick={() => { if (!isRunning) runWorkflowMode("FULL") }}
            disabled={isRunning}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "5px 14px 5px 8px", borderRadius: 8, border: "none",
              background: isRunning
                ? "rgba(124,79,255,0.14)"
                : "linear-gradient(180deg,#a47aff 0%,#7c4fff 100%)",
              color: "rgba(255,255,255,0.94)",
              cursor: isRunning ? "not-allowed" : "pointer",
              fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.014em",
              boxShadow: isRunning ? "none" : "0 4px 18px rgba(124,79,255,0.40), inset 0 1px 0 rgba(255,255,255,0.14)",
              transition: "all 0.14s ease",
            }}
            onMouseEnter={e => { if (!isRunning) (e.currentTarget as HTMLElement).style.filter="brightness(1.08)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter="brightness(1)" }}
          >
            <span style={{
              width:22, height:22, borderRadius:7,
              background:"rgba(255,255,255,0.16)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>
              {isRunning
                ? <Loader2 size={12} style={{ animation:"spin 1s linear infinite" }}/>
                : <Play    size={12} fill="currentColor" strokeWidth={0}/>}
            </span>
            {isRunning ? "Running…" : "Run"}
          </button>

          {/* Run Selected */}
          {hasSel && !isRunning && (
            <>
              <Div/>
              <button
                onClick={() => runWorkflowMode(selectedNodeIds.length===1 ? "SINGLE" : "PARTIAL")}
                style={{
                  display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
                  borderRadius:7, border:"none", background:"transparent",
                  color:"var(--text-faint)", fontSize:12, cursor:"pointer",
                  transition:"background 0.10s, color 0.10s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color="var(--text-soft)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="transparent";             (e.currentTarget as HTMLElement).style.color="var(--text-faint)" }}>
                <SquarePlay size={13}/>
                <span>({selectedNodeIds.length})</span>
              </button>
            </>
          )}
        </div>

        {/* Tools pill — select / pan / cut + add */}
        <div style={PILL}>
          <IBtn icon={Plus}          label="Add node (click to open node picker)" size={14}
            onClick={() => {
              // Dispatch a synthetic right-click at center to open context menu
              const el = document.querySelector(".react-flow__pane") as HTMLElement
              if (el) {
                const rect = el.getBoundingClientRect()
                el.dispatchEvent(new MouseEvent("contextmenu", {
                  bubbles: true, clientX: rect.left + rect.width/2, clientY: rect.top + rect.height/2,
                }))
              }
            }} />
          <Div/>
          <IBtn icon={MousePointer2} label="Select (V)"   active={activeTool==="select"} onClick={() => setActiveTool("select")}/>
          <IBtn icon={Hand}          label="Pan (H)"      active={activeTool==="pan"}    onClick={() => setActiveTool("pan")}/>
          <IBtn icon={Scissors}      label="Cut selected" active={activeTool==="cut"}
            disabled={!hasSel} onClick={() => { if (hasSel) { removeSelectedElements(); setActiveTool("select") } }}/>
        </div>

        {/* IO pill */}
        <div style={PILL}>
          <IBtn icon={Download}     label="Export JSON"    onClick={handleExport}/>
          <IBtn icon={Upload}       label="Import JSON"    onClick={() => importRef.current?.click()}/>
          <Div/>
          <IBtn icon={FlaskConical} label="Load sample workflow" onClick={() => { const s=getSampleWorkflow(); setNodes(s.nodes); setEdges(s.edges) }}/>
          <input ref={importRef} type="file" accept=".json" style={{ display:"none" }} onChange={handleImport}/>
        </div>
      </div>

      {/* ── Bottom-right: zoom hint ── */}
      <div style={{ position:"absolute", bottom:22, right:16, zIndex:20 }}>
        <div style={{ ...PILL, padding:"6px 10px", gap:6, cursor:"default" }}>
          <ZoomIn  size={11} style={{ color:"var(--text-ghost)" }}/>
          <span style={{ fontSize:11, color:"var(--text-ghost)" }}>scroll to zoom</span>
        </div>
      </div>
    </>
  )
}