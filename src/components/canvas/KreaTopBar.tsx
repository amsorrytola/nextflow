"use client"

import { useRef, useState, useEffect } from "react"
import { Share2, AppWindow, Maximize2, Moon, ChevronDown, ArrowLeft, Upload, Download, Building2, Check } from "lucide-react"
import { useWorkflowStore } from "@/store/workflowStore"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface KreaTopBarProps {
  workflowId?: string
}

export function KreaTopBar({ workflowId }: KreaTopBarProps) {
  const { workflowName, setWorkflowName, nodes, edges } = useWorkflowStore()
  const router = useRouter()

  // Rename state
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(workflowName)
  const inputRef = useRef<HTMLInputElement>(null)

  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setDraft(workflowName) }, [workflowName])

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

  const commitRename = () => {
    const trimmed = draft.trim() || "Untitled Workflow"
    setWorkflowName(trimmed)
    setDraft(trimmed)
    setEditing(false)
  }

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

  return (
    <div className="absolute top-0 left-0 right-0 h-[52px] flex items-center justify-between px-3 z-30 pointer-events-none">
      {/* Left — workflow name button + dropdown */}
      <div className="pointer-events-auto relative" ref={dropdownRef}>
        {/* Name pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-colors hover:bg-white/[0.06]"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)" }}
          onClick={() => { if (!editing) setDropdownOpen(v => !v) }}>
          {/* Icon */}
          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
            style={{ background: "#1a1a2e", border: "0.5px solid rgba(255,255,255,0.15)" }}>
            <span className="text-white font-bold" style={{ fontSize: 10 }}>N</span>
          </div>

          {/* Editable name */}
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === "Enter") commitRename()
                if (e.key === "Escape") { setDraft(workflowName); setEditing(false) }
              }}
              autoFocus
              className="bg-transparent text-white text-[13px] font-medium outline-none border-b border-white/40 min-w-[80px]"
              style={{ width: Math.max(80, draft.length * 8) }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-[13px] font-medium text-white/90 max-w-[180px] truncate"
              onDoubleClick={e => { e.stopPropagation(); setEditing(true); setDropdownOpen(false) }}>
              {workflowName}
            </span>
          )}

          <ChevronDown size={12} className="text-white/40 shrink-0" />
        </div>

        {/* Dropdown menu — matches krea_top-left-drop-down.png */}
        {dropdownOpen && !editing && (
          <div className="absolute top-[calc(100%+4px)] left-0 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[220px]"
            style={{ background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.12)" }}>

            {/* Workflow thumbnail preview */}
            <div className="px-3 pt-3 pb-2">
              <div className="rounded-lg overflow-hidden mb-2" style={{ height: 80, background: "#111" }}>
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

            <div className="h-px mx-3" style={{ background: "rgba(255,255,255,0.08)" }} />

            {/* Menu items */}
            <div className="p-1.5 flex flex-col gap-0.5">
              <button onClick={() => { setDropdownOpen(false); router.push("/nodes") }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full">
                <ArrowLeft size={15} className="text-white/40" />
                Back
              </button>
              <button onClick={() => { setDropdownOpen(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full">
                <AppWindow size={15} className="text-blue-400" />
                Turn Into App
                <span className="ml-auto text-blue-400">
                  <Check size={13} />
                </span>
              </button>
              <button onClick={() => { setDropdownOpen(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full">
                <Upload size={15} className="text-white/40" />
                Import
              </button>
              <button onClick={() => { setDropdownOpen(false) }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full">
                <Download size={15} className="text-white/40" />
                Export
              </button>

              <div className="h-px mx-1 my-1" style={{ background: "rgba(255,255,255,0.08)" }} />

              {/* Workspaces */}
              <div className="px-3 py-1.5">
                <span className="text-[11px] text-white/30 uppercase tracking-wider">Workspaces</span>
              </div>
              <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors text-left w-full">
                <Building2 size={14} className="text-white/40" />
                Default Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="pointer-events-auto flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors">
          <Moon size={15} />
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-white/70 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
          <Share2 size={13} />
          Save
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-white/70 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)" }}>
          <AppWindow size={13} />
          Turn workflow into app
        </button>
        <button className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-colors">
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}