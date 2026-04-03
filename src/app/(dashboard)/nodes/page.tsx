"use client"

import { useEffect, useState } from "react"
import { KreaLeftSidebar } from "@/components/sidebar/KreaLeftSidebar"
import { Plus, Search, ChevronDown, Grid2x2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface WorkflowCard {
  id: string
  name: string
  updatedAt: string
  thumbnailNodes?: { color: string; x: number; y: number }[]
}

function WorkflowThumbnail({ workflow }: { workflow: WorkflowCard }) {
  // Generate a simple visual preview
  const colors = ["#4d9de0", "#4CAF50", "#f5a623", "#a855f7", "#ef4444"]
  return (
    <div className="w-full h-full bg-[#1e1e1e] relative overflow-hidden">
      {/* Simple node graph preview */}
      <svg className="w-full h-full" viewBox="0 0 200 120">
        {/* Random-looking node connections based on workflow id */}
        {workflow.thumbnailNodes?.map((node, i) => (
          <g key={i}>
            {i < (workflow.thumbnailNodes?.length ?? 0) - 1 && (
              <path
                d={`M ${node.x + 20} ${node.y + 12} C ${node.x + 60} ${node.y + 12} ${(workflow.thumbnailNodes?.[i + 1]?.x ?? 0) - 20} ${(workflow.thumbnailNodes?.[i + 1]?.y ?? 0) + 12} ${(workflow.thumbnailNodes?.[i + 1]?.x ?? 0)} ${(workflow.thumbnailNodes?.[i + 1]?.y ?? 0) + 12}`}
                stroke={node.color}
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
              />
            )}
            <rect x={node.x} y={node.y} width={40} height={24} rx="4"
              fill="#2a2a2a" stroke={node.color} strokeWidth="0.5" opacity="0.8" />
          </g>
        ))}
      </svg>
    </div>
  )
}

const SAMPLE_THUMBNAILS: WorkflowCard["thumbnailNodes"][] = [
  [
    { color: "#4d9de0", x: 10, y: 20 },
    { color: "#4d9de0", x: 70, y: 50 },
    { color: "#4CAF50", x: 130, y: 30 },
    { color: "#a855f7", x: 150, y: 70 },
  ],
  [
    { color: "#f5a623", x: 10, y: 40 },
    { color: "#4d9de0", x: 80, y: 20 },
    { color: "#4d9de0", x: 80, y: 60 },
    { color: "#4CAF50", x: 150, y: 40 },
  ],
  [
    { color: "#a855f7", x: 20, y: 50 },
    { color: "#f5a623", x: 90, y: 20 },
    { color: "#4d9de0", x: 90, y: 70 },
    { color: "#4CAF50", x: 155, y: 45 },
  ],
]

export default function NodesPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<WorkflowCard[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch("/api/workflows")
      .then(r => r.json())
      .then((data: { id: string; name: string; updatedAt: string }[]) => {
        if (Array.isArray(data)) {
          setWorkflows(data.map((w, i) => ({
            ...w,
            thumbnailNodes: SAMPLE_THUMBNAILS[i % SAMPLE_THUMBNAILS.length],
          })))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleNewWorkflow = async () => {
    const res = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled Workflow", nodes: [], edges: [] }),
    })
    const data = await res.json()
    if (data.id) router.push(`/workflow/${data.id}`)
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#141414]">
      <KreaLeftSidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Hero banner */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#0e0e0e]">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #4d9de033 0%, transparent 50%), radial-gradient(circle at 80% 20%, #a855f733 0%, transparent 50%)" }} />
          {/* Decorative node preview */}
          <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-20">
            <svg viewBox="0 0 800 256" className="w-full h-full">
              <rect x="100" y="60" width="120" height="80" rx="12" fill="#1e1e1e" stroke="#4d9de0" strokeWidth="1"/>
              <rect x="320" y="40" width="100" height="60" rx="12" fill="#1e1e1e" stroke="#f5a623" strokeWidth="1"/>
              <rect x="550" y="80" width="120" height="90" rx="12" fill="#1e1e1e" stroke="#4CAF50" strokeWidth="1"/>
              <rect x="320" y="140" width="100" height="60" rx="12" fill="#1e1e1e" stroke="#a855f7" strokeWidth="1"/>
              <path d="M220 100 C270 100 270 70 320 70" stroke="#4d9de0" strokeWidth="1.5" fill="none"/>
              <path d="M420 70 C470 70 500 100 550 110" stroke="#f5a623" strokeWidth="1.5" fill="none"/>
              <path d="M420 170 C470 170 500 140 550 130" stroke="#a855f7" strokeWidth="1.5" fill="none"/>
              <circle cx="220" cy="100" r="5" fill="#4d9de0"/>
              <circle cx="320" cy="70" r="5" fill="#f5a623"/>
              <circle cx="550" cy="110" r="5" fill="#4CAF50"/>
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-center h-full px-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#4d9de0] flex items-center justify-center">
                <span className="text-white text-lg">⬡</span>
              </div>
              <h1 className="text-3xl font-semibold text-white">Node Editor</h1>
            </div>
            <p className="text-[#888] text-sm max-w-md leading-relaxed">
              Nodes is the most powerful way to operate NextFlow. Connect every tool and model into complex automated pipelines.
            </p>
            <button
              onClick={handleNewWorkflow}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#eee] text-black text-sm font-medium rounded-full transition-colors w-fit">
              New Workflow
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Tabs + Controls */}
        <div className="px-8 py-4 flex items-center justify-between border-b border-[#222]">
          <div className="flex items-center gap-1">
            {["Projects", "Apps", "Examples", "Templates"].map(tab => (
              <button key={tab}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  tab === "Projects"
                    ? "bg-[#2a2a2a] text-white"
                    : "text-[#666] hover:text-[#aaa] hover:bg-[#1e1e1e]"
                }`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg">
              <Search size={13} className="text-[#555]" />
              <input placeholder="Search projects..."
                className="bg-transparent text-[12px] text-[#ccc] placeholder:text-[#444] outline-none w-40" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg text-[12px] text-[#888] hover:text-[#ccc] transition-colors">
              Last viewed
              <ChevronDown size={12} />
            </button>
            <button className="p-1.5 bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg text-[#666] hover:text-[#aaa] transition-colors">
              <Grid2x2 size={14} />
            </button>
          </div>
        </div>

        {/* Workflow grid */}
        <div className="p-8">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#1e1e1e] animate-pulse" style={{ height: 160 }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* New Workflow card */}
              <button onClick={handleNewWorkflow}
                className="flex flex-col group">
                <div className="rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#3a3a3a]
                  transition-all overflow-hidden flex items-center justify-center"
                  style={{ height: 140 }}>
                  <div className="w-10 h-10 rounded-full border border-[#444] flex items-center justify-center
                    group-hover:border-[#666] transition-colors">
                    <Plus size={18} className="text-[#666] group-hover:text-[#aaa] transition-colors" />
                  </div>
                </div>
                <span className="mt-2 text-[13px] text-[#888] group-hover:text-[#ccc] transition-colors px-0.5">
                  New Workflow
                </span>
              </button>

              {/* Existing workflows */}
              {workflows.map((workflow) => (
                <button key={workflow.id}
                  onClick={() => router.push(`/workflow/${workflow.id}`)}
                  className="flex flex-col group text-left">
                  <div className="rounded-2xl overflow-hidden border border-[#2a2a2a] hover:border-[#3a3a3a]
                    transition-all" style={{ height: 140 }}>
                    <WorkflowThumbnail workflow={workflow} />
                  </div>
                  <div className="mt-2 px-0.5">
                    <div className="text-[13px] text-[#ccc] group-hover:text-white transition-colors font-medium truncate">
                      {workflow.name}
                    </div>
                    <div className="text-[11px] text-[#555] mt-0.5">
                      Edited {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
