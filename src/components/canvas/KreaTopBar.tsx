"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import {
  Share2, AppWindow, Moon, Sun, ChevronDown,
  ArrowLeft, Upload, Download, Building2, Check, Pencil, Database, History, PanelRight
} from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import { useRouter } from "next/navigation"

type RightPanelView = "assets" | "history" | null
type ThemeMode = "dark" | "light"

interface KreaTopBarProps {
  workflowId?: string
  rightPanel: RightPanelView
  onRightPanelChange: (panel: RightPanelView) => void
}

const pill = (active = false): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: 6,
  height: 30, padding: "0 10px", borderRadius: 8,
  border: `1px solid ${active ? "var(--border-strong)" : "var(--border)"}`,
  background: active ? "var(--bg-elevated-hover)" : "var(--bg-elevated)",
  backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
  cursor: "pointer", whiteSpace: "nowrap" as const,
  fontSize: 12.5, fontWeight: 400, letterSpacing: "-0.012em",
  color: active ? "var(--text-primary)" : "var(--text-secondary)",
  transition: "background 0.12s, border-color 0.12s, color 0.12s",
  userSelect: "none" as const,
})

const hover = (el: HTMLElement, enter: boolean) => {
  el.style.background    = enter ? "var(--bg-elevated-hover)" : "var(--bg-elevated)"
  el.style.borderColor   = enter ? "var(--border-strong)"  : "var(--border)"
  el.style.color         = enter ? "var(--text-primary)"      : "var(--text-secondary)"
}

export function KreaTopBar({ workflowId, rightPanel, onRightPanelChange }: KreaTopBarProps) {
  const { workflowName, setWorkflowName, nodes, edges } = useWorkflowStore()
  const router = useRouter()

  const [editing, setEditing]         = useState(false)
  const [draft, setDraft]             = useState(workflowName)
  const [dropOpen, setDropOpen]       = useState(false)
  const [panelOpen, setPanelOpen]     = useState(false)
  const [theme, setTheme]             = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark"
    return localStorage.getItem("nextflow-theme") === "light" ? "light" : "dark"
  })

  const inputRef    = useRef<HTMLInputElement>(null)
  const dropRef     = useRef<HTMLDivElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)

  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select() } }, [editing])

  useEffect(() => {
    if (!dropOpen) return
    const h = (e: MouseEvent) => { if (!dropRef.current?.contains(e.target as Node)) setDropOpen(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [dropOpen])

  useEffect(() => {
    if (!panelOpen) return
    const h = (e: MouseEvent) => { if (!panelRef.current?.contains(e.target as Node)) setPanelOpen(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [panelOpen])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  const startEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation(); setDropOpen(false); setEditing(true); setDraft(workflowName)
  }, [workflowName])

  const commitRename = useCallback(async () => {
    const trimmed = draft.trim() || "Untitled Workflow"
    setWorkflowName(trimmed); setDraft(trimmed); setEditing(false)
    if (workflowId && !["default","new","sample"].includes(workflowId)) {
      try { await fetch(`/api/workflows/${workflowId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: trimmed }) }) } catch {}
    }
  }, [draft, workflowId, setWorkflowName])

  const cancelEdit = useCallback(() => { setDraft(workflowName); setEditing(false) }, [workflowName])

  const handleSave = async () => {
    setDropOpen(false)
    if (!workflowId || ["default","new"].includes(workflowId)) {
      const res = await fetch("/api/workflows", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }) })
      const d = await res.json(); if (d.id) router.push(`/workflow/${d.id}`)
    } else {
      await fetch(`/api/workflows/${workflowId}`, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }) })
    }
  }

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next); document.documentElement.setAttribute("data-theme", next); localStorage.setItem("nextflow-theme", next)
  }

  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 52,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 12px", zIndex: 30, pointerEvents: "none",
    }}>

      {/* ── Left: name pill ── */}
      <div style={{ pointerEvents: "auto", position: "relative" }} ref={dropRef}>
        <div
          style={{ ...pill(editing || dropOpen), padding: "0 8px 0 6px", gap: 6, cursor: editing ? "default" : "pointer" }}
          onClick={() => { if (!editing) setDropOpen(v => !v) }}
          onMouseEnter={e => { if (!editing && !dropOpen) hover(e.currentTarget as HTMLElement, true) }}
          onMouseLeave={e => { if (!editing && !dropOpen) hover(e.currentTarget as HTMLElement, false) }}
        >
          {/* Gradient brand icon */}
          <div style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            background: "linear-gradient(135deg,#7c4fff 0%,#4d9de0 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 700, color: "#fff",
          }}>N</div>

          {/* Editable name */}
          {editing ? (
            <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { e.stopPropagation(); if (e.key==="Enter") { e.preventDefault(); commitRename() } if (e.key==="Escape") cancelEdit() }}
              onClick={e => e.stopPropagation()}
              style={{ background:"transparent", border:"none", outline:"none",
                fontSize:12.5, fontWeight:500, color:"var(--text-primary)", fontFamily:"inherit",
                letterSpacing:"-0.012em", minWidth:80, width: Math.max(80, Math.min(220, draft.length * 8)) }} />
          ) : (
            <span onDoubleClick={startEdit}
              style={{ fontSize:12.5, fontWeight:500, color:"var(--text-primary)", letterSpacing:"-0.012em",
                maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {workflowName}
            </span>
          )}

          {!editing && <ChevronDown size={11} style={{ color:"var(--text-ghost)", flexShrink:0 }} />}
        </div>

        {/* Dropdown */}
        {dropOpen && !editing && (
          <div style={{
            position:"absolute", top:"calc(100% + 6px)", left:0, minWidth:228,
            borderRadius:14, border:"1px solid var(--border)",
            background:"var(--bg-menu)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)",
            boxShadow:"var(--shadow-menu)",
            zIndex:9999, overflow:"hidden",
            animation:"contextMenuIn 0.14s cubic-bezier(0.22,1,0.36,1) both",
          }}>
            {/* Mini workflow SVG preview */}
            <div style={{ padding:"10px 10px 6px" }}>
              <div style={{ borderRadius:9, overflow:"hidden", background:"var(--bg-elevated)", border:"1px solid var(--border)", height:68 }}>
                <svg viewBox="0 0 208 68" style={{ width:"100%", height:"100%" }}>
                  <rect x="6"   y="18" width="40" height="22" rx="5" fill="#141414" stroke="#0080FF" strokeWidth="0.55" />
                  <rect x="6"   y="46" width="40" height="14" rx="4" fill="#141414" stroke="#FCC800" strokeWidth="0.5"  />
                  <rect x="78"  y="10" width="40" height="22" rx="5" fill="#141414" stroke="#FCC800" strokeWidth="0.55" />
                  <rect x="78"  y="40" width="40" height="22" rx="5" fill="#141414" stroke="#9B6FFF" strokeWidth="0.55" />
                  <rect x="152" y="24" width="50" height="22" rx="5" fill="#141414" stroke="#29D246" strokeWidth="0.55" />
                  <path d="M46 29 C62 29 62 21 78 21" stroke="#0080FF" strokeWidth="0.8" fill="none" opacity="0.65"/>
                  <path d="M46 29 C62 29 62 51 78 51" stroke="#FCC800" strokeWidth="0.8" fill="none" opacity="0.65"/>
                  <path d="M118 21 C135 21 135 35 152 35" stroke="#FCC800" strokeWidth="0.8" fill="none" opacity="0.65"/>
                  <path d="M118 51 C135 51 135 35 152 35" stroke="#9B6FFF" strokeWidth="0.8" fill="none" opacity="0.65"/>
                </svg>
              </div>
            </div>
            <div style={{ height:1, background:"var(--border)", margin:"0 10px" }} />
            <div style={{ padding:"5px 5px 7px", display:"flex", flexDirection:"column", gap:1 }}>
              <DI icon={<ArrowLeft size={13}/>}    label="Back"          onClick={() => { setDropOpen(false); router.push("/nodes") }} />
              <DI icon={<Pencil size={13}/>}       label="Rename"        onClick={startEdit} />
              <DI icon={<AppWindow size={13} style={{color:"#4d9de0"}}/>} label="Turn Into App"
                right={<Check size={11} style={{color:"#4d9de0"}}/>}  onClick={() => setDropOpen(false)} />
              <DI icon={<Upload size={13}/>}        label="Import"       onClick={() => setDropOpen(false)} />
              <DI icon={<Download size={13}/>}      label="Export"       onClick={() => setDropOpen(false)} />
              <div style={{ height:1, background:"var(--border)", margin:"3px 4px" }} />
              <div style={{ padding:"3px 9px", fontSize:10, color:"var(--text-ghost)", letterSpacing:"0.055em", textTransform:"uppercase" }}>Workspaces</div>
              <DI icon={<Building2 size={13}/>}    label="Default Workspace" onClick={() => setDropOpen(false)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Right buttons ── */}
      <div style={{ pointerEvents:"auto", display:"flex", alignItems:"center", gap:5 }}>
        {/* Theme */}
        <button onClick={toggleTheme} style={{ ...pill(), width:30, padding:0, justifyContent:"center" }}
          title={`Switch to ${theme==="dark"?"light":"dark"} mode`}
          onMouseEnter={e => hover(e.currentTarget as HTMLElement, true)}
          onMouseLeave={e => hover(e.currentTarget as HTMLElement, false)}>
          {theme==="dark" ? <Moon size={13}/> : <Sun size={13}/>}
        </button>

        {/* Share / Save */}
        <button onClick={handleSave} style={pill()}
          onMouseEnter={e => hover(e.currentTarget as HTMLElement, true)}
          onMouseLeave={e => hover(e.currentTarget as HTMLElement, false)}>
          <Share2 size={12} style={{ color:"var(--text-ghost)" }}/>
          Share
        </button>

        {/* Turn into app */}
        <button style={pill()}
          onMouseEnter={e => hover(e.currentTarget as HTMLElement, true)}
          onMouseLeave={e => hover(e.currentTarget as HTMLElement, false)}>
          <AppWindow size={12} style={{ color:"var(--text-ghost)" }}/>
          Turn workflow into app
        </button>

        {/* Panel toggle */}
        <div style={{ position:"relative" }} ref={panelRef}>
          <button onClick={() => setPanelOpen(v => !v)}
            style={{ ...pill(panelOpen || !!rightPanel), padding:"0 8px", gap:4 }}
            onMouseEnter={e => { if (!panelOpen) hover(e.currentTarget as HTMLElement, true) }}
            onMouseLeave={e => { if (!panelOpen) hover(e.currentTarget as HTMLElement, false) }}>
            <PanelRight size={13}/>
            <ChevronDown size={10} style={{ transition:"transform 0.14s", transform: panelOpen ? "rotate(180deg)" : "none" }}/>
          </button>

          {panelOpen && (
            <div style={{
              position:"absolute", top:"calc(100% + 6px)", right:0, minWidth:215,
              borderRadius:12, border:"1px solid var(--border)",
              background:"var(--bg-menu)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)",
              boxShadow:"var(--shadow-menu)", zIndex:9999,
              animation:"contextMenuIn 0.13s cubic-bezier(0.22,1,0.36,1) both",
              padding:"5px",
            }}>
              <PanelItem icon={<Database size={13}/>} label="Assets"         shortcut="⌃⌥A"
                active={rightPanel==="assets"}
                onClick={() => { onRightPanelChange(rightPanel==="assets"?null:"assets"); setPanelOpen(false) }} />
              <PanelItem icon={<History  size={13}/>} label="Version History" shortcut="⌃⌥S"
                active={rightPanel==="history"}
                onClick={() => { onRightPanelChange(rightPanel==="history"?null:"history"); setPanelOpen(false) }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DI({ icon, label, right, onClick }: { icon: React.ReactNode; label: string; right?: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:9, width:"100%", padding:"7px 10px",
      borderRadius:8, border:"none", background:"transparent", cursor:"pointer",
      textAlign:"left", color:"var(--text-secondary)", fontSize:12.5, letterSpacing:"-0.01em",
      transition:"background 0.10s, color 0.10s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background="var(--bg-elevated-hover)"; (e.currentTarget as HTMLElement).style.color="var(--text-primary)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="transparent";               (e.currentTarget as HTMLElement).style.color="var(--text-secondary)" }}>
      <span style={{ color:"var(--text-ghost)", display:"flex", flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {right}
    </button>
  )
}

function PanelItem({ icon, label, shortcut, active, onClick }: { icon: React.ReactNode; label: string; shortcut: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:9, width:"100%", padding:"7px 10px",
      borderRadius:8, border:"none", cursor:"pointer", textAlign:"left",
      background: active ? "var(--bg-elevated-hover)" : "transparent",
      color: active ? "var(--text-primary)" : "var(--text-secondary)",
      fontSize:12.5, letterSpacing:"-0.01em",
      transition:"background 0.10s, color 0.10s",
    }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background="var(--bg-elevated)"; (e.currentTarget as HTMLElement).style.color="var(--text-primary)" }}}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background="transparent";              (e.currentTarget as HTMLElement).style.color="var(--text-secondary)" }}}>
      <span style={{ color:"var(--text-ghost)", display:"flex", flexShrink:0 }}>{icon}</span>
      <span style={{ flex:1, fontWeight: active ? 500 : 400 }}>{label}</span>
      <span style={{ fontSize:10.5, color:"var(--text-ghost)", fontFamily:"monospace" }}>{shortcut}</span>
    </button>
  )
}
