"use client"

import { Play, SquarePlay, Undo2, Redo2, Download, Upload, Save } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toolbar() {
  return (
    <div className="flex items-center gap-2 px-4 h-12 border-b border-[#2a2a2a] bg-[#111111] shrink-0">
      <span className="text-sm font-medium text-white mr-2">Untitled Workflow</span>
      <div className="flex-1" />
      <button
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
          "bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors"
        )}
      >
        <Play size={12} />
        Run Workflow
      </button>
      <button
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium",
          "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#9ca3af] border border-[#2a2a2a] transition-colors"
        )}
      >
        <SquarePlay size={12} />
        Run Selected
      </button>
      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />
      <button className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors">
        <Undo2 size={14} />
      </button>
      <button className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors">
        <Redo2 size={14} />
      </button>
      <div className="w-px h-5 bg-[#2a2a2a] mx-1" />
      <button className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors">
        <Download size={14} />
      </button>
      <button className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors">
        <Upload size={14} />
      </button>
      <button className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-[#9ca3af] transition-colors">
        <Save size={14} />
      </button>
    </div>
  )
}
