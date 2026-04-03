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

export function KreaTopBar({ workflowId, rightPanel, onRightPanelChange }: KreaTopBarProps) {
  const { workflowName, setWorkflowName, nodes, edges } = useWorkflowStore()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(workflowName)
  const inputRef = useRef<HTMLInputElement>(null)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [panelMenuOpen, setPanelMenuOpen] = useState(false)
  const panelMenuRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<ThemeMode>("dark")

  // Keep draft in sync when name changes externally (e.g. on load)
  useEffect(() => {
    if (!editing) setDraft(workflowName)
  }, [workflowName, editing])

  // Focus & select-all when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (!panelMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (panelMenuRef.current && !panelMenuRef.current.contains(e.target as Node)) {
        setPanelMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [panelMenuOpen])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("nextflow-theme")
    const initialTheme: ThemeMode = savedTheme === "light" ? "light" : "dark"
    setTheme(initialTheme)
    document.documentElement.setAttribute("data-theme", initialTheme)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    window.localStorage.setItem("nextflow-theme", theme)
  }, [theme])

  const startEditing = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDropdownOpen(false)
    setEditing(true)
    setDraft(workflowName)
  }, [workflowName])

  const commitRename = useCallback(async () => {
    const trimmed = draft.trim() || "Untitled Workflow"
    setWorkflowName(trimmed)
    setDraft(trimmed)
    setEditing(false)

    // Persist immediately if we have a real workflow ID
    if (workflowId && workflowId !== "default" && workflowId !== "new" && workflowId !== "sample") {
      try {
        await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        })
      } catch (err) {
        console.error("Failed to save workflow name", err)
      }
    }
  }, [draft, workflowId, setWorkflowName])

  const cancelEdit = useCallback(() => {
    setDraft(workflowName)
    setEditing(false)
  }, [workflowName])

  const handleSave = async () => {
    setDropdownOpen(false)
    if (!workflowId || workflowId === "default" || workflowId === "new") {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        }),
      })
      const data = await res.json()
      if (data.id) router.push(`/workflow/${data.id}`)
    } else {
      await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        }),
      })
    }
  }

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  return (
    <div className="absolute top-0 left-0 right-0 h-[56px] flex items-start justify-between px-12 pt-4 z-30 pointer-events-none">

      {/* ── Left: workflow name + dropdown ── */}
      <div className="pointer-events-auto relative" ref={dropdownRef}>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer select-none transition-colors hover:bg-white/[0.06]"
          style={{
            minHeight: 36,
            background: editing ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.065)",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.22)",
            backdropFilter: "blur(14px)",
          }}
          onClick={() => { if (!editing) setDropdownOpen(v => !v) }}
        >
          {/* Brand icon */}
          <div
            className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "transparent" }}
          >
            <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 700 }}>N</span>
          </div>

          {/* ── Editable name ── */}
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                e.stopPropagation()
                if (e.key === "Enter") { e.preventDefault(); commitRename() }
                if (e.key === "Escape") cancelEdit()
              }}
              onClick={e => e.stopPropagation()}
              className="bg-transparent text-[13px] font-medium outline-none min-w-[80px] max-w-[200px]"
              style={{ color: "var(--text-primary)", width: Math.max(80, Math.min(200, draft.length * 8)) }}
            />
          ) : (
            <span
              className="text-[13px] font-medium max-w-[180px] truncate"
              style={{ color: "var(--text-primary)" }}
              onDoubleClick={startEditing}
            >
              {workflowName}
            </span>
          )}

          {/* Pencil icon — always visible on hover, always visible while editing */}
          {!editing && (
            <button
              onClick={startEditing}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all hover:bg-white/10"
              style={{ opacity: 0 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
              title="Rename workflow"
            >
              <Pencil size={10} style={{ color: "var(--text-faint)" }} />
            </button>
          )}

          {!editing && <ChevronDown size={12} className="shrink-0" style={{ color: "var(--text-faint)" }} />}
        </div>

        {/* ── Dropdown menu ── */}
        {dropdownOpen && !editing && (
          <div
            className="absolute top-[calc(100%+4px)] left-0 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[220px]"
            style={{ background: "var(--bg-secondary)", border: "0.5px solid var(--border-strong)" }}
          >
            {/* Thumbnail preview */}
            <div className="px-3 pt-3 pb-2">
              <div className="rounded-lg overflow-hidden mb-2" style={{ height: 80, background: "var(--bg-primary)" }}>
                <svg viewBox="0 0 220 80" className="w-full h-full">
                  <rect x="10" y="20" width="50" height="30" rx="6" fill="#1e1e1e" stroke="#4d9de0" strokeWidth="0.75" />
                  <rect x="85" y="10" width="50" height="30" rx="6" fill="#1e1e1e" stroke="#f5a623" strokeWidth="0.75" />
                  <rect x="85" y="48" width="50" height="30" rx="6" fill="#1e1e1e" stroke="#a855f7" strokeWidth="0.75" />
                  <rect x="162" y="28" width="50" height="30" rx="6" fill="#1e1e1e" stroke="#4CAF50" strokeWidth="0.75" />
                  <path d="M60 35 C72 35 72 25 85 25" stroke="#4d9de0" strokeWidth="1" fill="none" />
                  <path d="M60 35 C72 35 72 63 85 63" stroke="#4d9de0" strokeWidth="1" fill="none" />
                  <path d="M135 25 C148 25 150 43 162 43" stroke="#f5a623" strokeWidth="1" fill="none" />
                  <path d="M135 63 C148 63 150 43 162 43" stroke="#a855f7" strokeWidth="1" fill="none" />
                </svg>
              </div>
            </div>

            <div className="h-px mx-3" style={{ background: "var(--border)" }} />

            <div className="p-1.5 flex flex-col gap-0.5">
              <button
                onClick={() => { setDropdownOpen(false); router.push("/nodes") }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full"
              >
                <ArrowLeft size={15} className="text-white/40" />
                Back
              </button>

              {/* ── Rename ── */}
              <button
                onClick={startEditing}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full"
              >
                <Pencil size={15} className="text-white/40" />
                Rename
              </button>

              <button
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full"
              >
                <AppWindow size={15} className="text-blue-400" />
                Turn Into App
                <span className="ml-auto text-blue-400"><Check size={13} /></span>
              </button>

              <button
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full"
              >
                <Upload size={15} className="text-white/40" />
                Import
              </button>

              <button
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full"
              >
                <Download size={15} className="text-white/40" />
                Export
              </button>

              <div className="h-px mx-1 my-1" style={{ background: "var(--border)" }} />

              <div className="px-3 py-1.5">
                <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-ghost)" }}>Workspaces</span>
              </div>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full">
                <Building2 size={14} className="text-white/40" />
                Default Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right controls ── */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          className="h-8 w-8 flex items-center justify-center rounded-[10px] transition-colors"
          style={{
            background: "rgba(255,255,255,0.065)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.82)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            backdropFilter: "blur(14px)",
          }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] transition-colors"
          style={{
            minHeight: 36,
            background: "rgba(255,255,255,0.065)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.48)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            backdropFilter: "blur(14px)",
          }}
        >
          <Share2 size={12} />
          Save
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] transition-colors"
          style={{
            minHeight: 36,
            background: "rgba(255,255,255,0.065)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.88)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            backdropFilter: "blur(14px)",
          }}
        >
          <AppWindow size={12} />
          Turn workflow into app
        </button>
        <div className="relative" ref={panelMenuRef}>
          <button
            onClick={() => setPanelMenuOpen(v => !v)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-[10px] transition-colors"
            style={{
              minHeight: 36,
              background: panelMenuOpen || rightPanel ? "rgba(255,255,255,0.085)" : "rgba(255,255,255,0.065)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.52)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              backdropFilter: "blur(14px)",
            }}
            title="Open right panel"
            aria-label="Open right panel"
          >
            <PanelRight size={13} />
            <ChevronDown size={11} className={`transition-transform ${panelMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {panelMenuOpen && (
            <div
              className="absolute right-0 top-[calc(100%+6px)] min-w-[220px] rounded-xl p-1.5 shadow-2xl z-50"
              style={{ background: "var(--bg-secondary)", border: "0.5px solid var(--border-strong)" }}
            >
              <button
                onClick={() => {
                  onRightPanelChange("assets")
                  setPanelMenuOpen(false)
                }}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <Database size={15} className="text-white/45" />
                <span className="text-[13px] font-medium">Assets</span>
                <span className="ml-auto text-[11px] text-white/30">Ctrl+Alt+A</span>
              </button>
              <button
                onClick={() => {
                  onRightPanelChange("history")
                  setPanelMenuOpen(false)
                }}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <History size={15} className="text-white/45" />
                <span className="text-[13px] font-medium leading-tight">Version History</span>
                <span className="ml-auto text-[11px] text-white/30">Ctrl+Alt+S</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
