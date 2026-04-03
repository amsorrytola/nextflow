"use client"

import { useEffect, useState } from "react"
import { KreaLeftSidebar } from "@/components/sidebar/KreaLeftSidebar"
import { Search, ChevronDown, SlidersHorizontal, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface WorkflowCard {
  id: string
  name: string
  updatedAt: string
  isSample?: boolean
  thumbnailNodes?: { color: string; x: number; y: number; label?: string }[]
}

// SVG thumbnail matching Krea's style
function WorkflowThumbnail({ workflow }: { workflow: WorkflowCard }) {
  return (
    <div className="w-full h-full relative overflow-hidden" style={{ background: "#141414" }}>
      <svg className="w-full h-full" viewBox="0 0 280 175" preserveAspectRatio="xMidYMid meet">
        {workflow.thumbnailNodes?.map((node, i) => {
          const next = workflow.thumbnailNodes?.[i + 1]
          return (
            <g key={i}>
              {next && (
                <path
                  d={`M ${node.x + 52} ${node.y + 16} C ${node.x + 82} ${node.y + 16} ${next.x - 20} ${next.y + 16} ${next.x} ${next.y + 16}`}
                  stroke={node.color}
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.7"
                />
              )}
              {/* Node card */}
              <rect x={node.x} y={node.y} width={52} height={32} rx="7"
                fill="#1e1e1e" stroke={node.color} strokeWidth="0.75" />
              {/* Left handle */}
              <circle cx={node.x} cy={node.y + 16} r="4" fill={node.color} opacity="0.9" />
              {/* Right handle */}
              <circle cx={node.x + 52} cy={node.y + 16} r="4" fill={node.color} opacity="0.9" />
              {/* Content lines */}
              <rect x={node.x + 9} y={node.y + 10} width={20} height={3} rx="1.5" fill={node.color} opacity="0.4" />
              <rect x={node.x + 9} y={node.y + 18} width={30} height={2.5} rx="1.25" fill="rgba(255,255,255,0.1)" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const SAMPLE_THUMBNAILS: WorkflowCard["thumbnailNodes"][] = [
  [
    { color: "#4d9de0", x: 14, y: 28 },
    { color: "#4d9de0", x: 100, y: 60 },
    { color: "#4CAF50", x: 178, y: 28 },
    { color: "#a855f7", x: 210, y: 88 },
  ],
  [
    { color: "#f5a623", x: 12, y: 50 },
    { color: "#4d9de0", x: 94, y: 18 },
    { color: "#4d9de0", x: 94, y: 86 },
    { color: "#4CAF50", x: 192, y: 52 },
  ],
  [
    { color: "#a855f7", x: 12, y: 68 },
    { color: "#f5a623", x: 98, y: 20 },
    { color: "#4d9de0", x: 98, y: 96 },
    { color: "#4CAF50", x: 196, y: 58 },
  ],
  [
    { color: "#4CAF50", x: 8, y: 38 },
    { color: "#a855f7", x: 88, y: 18 },
    { color: "#f5a623", x: 88, y: 78 },
    { color: "#4d9de0", x: 188, y: 52 },
  ],
]

// Sample workflow card (always shown)
const SAMPLE_WORKFLOW_CARD: WorkflowCard = {
  id: "sample",
  name: "SampleWorkflow",
  updatedAt: new Date().toISOString(),
  isSample: true,
  thumbnailNodes: [
    { color: "#4d9de0", x: 14, y: 18 },
    { color: "#f5a623", x: 14, y: 88 },
    { color: "#a855f7", x: 110, y: 52 },
    { color: "#4CAF50", x: 210, y: 52 },
  ],
}

const TABS = ["projects", "apps", "examples", "templates"]

export default function NodesPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<WorkflowCard[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("projects")

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

  const handleOpenSample = () => {
    // Navigate to a "sample" workflow route — WorkflowPage loads sample data
    router.push("/workflow/sample")
  }

  if (!mounted) return null

  // Build displayed cards: sample always first, then real workflows
  const displayedCards: WorkflowCard[] = [
    SAMPLE_WORKFLOW_CARD,
    ...workflows,
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "#0a0a0a" }}>
      <KreaLeftSidebar />

      <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://s.krea.ai/nodesHeaderBannerBlurGradient.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            style={{ zIndex: 1 }}
            fetchPriority="high"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://s.krea.ai/nodesHeaderBannerBlurGradient.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-[1.3] blur-2xl opacity-[0.15]"
            style={{ zIndex: 0 }}
          />
          <div
            className="relative flex flex-col justify-between gap-6 text-white"
            style={{ zIndex: 2, minHeight: 280, padding: "clamp(24px, 4vw, 88px)" }}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://s.krea.ai/icons/NodeEditor.png" alt="" className="w-9 h-9 object-contain" />
                <h1 className="font-normal text-[30px] tracking-tight">Node Editor</h1>
              </div>
              <p className="text-white/60 text-[14px] leading-relaxed font-light" style={{ maxWidth: 380 }}>
                Nodes is the most powerful way to operate Krea. Connect every tool and model into complex automated pipelines.
              </p>
            </div>
            <button
              onClick={handleNewWorkflow}
              className="flex items-center gap-2 text-[14px] font-medium text-black bg-white hover:bg-white/90 rounded-full transition-all w-fit"
              style={{ padding: "9px 32px" }}>
              New Workflow
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* ── Tabs + controls ── */}
        <div style={{ padding: "0 clamp(24px, 4vw, 88px)", paddingTop: 48 }}>
          <div className="flex items-center justify-between pb-3"
            style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-0.5">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative h-10 px-4 text-[13px] font-medium capitalize rounded-lg transition-colors"
                  style={{
                    minWidth: 96,
                    color: activeTab === tab ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
                    background: activeTab === tab ? "rgba(255,255,255,0.08)" : "transparent",
                  }}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px]"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.09)" }}>
                <Search size={12} className="text-white/30 shrink-0" />
                <input placeholder="Search projects..."
                  className="bg-transparent text-white/60 placeholder:text-white/20 outline-none w-36 text-[13px]" />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-white/40 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.09)" }}>
                Last viewed <ChevronDown size={11} />
              </button>
              <button className="flex items-center justify-center w-9 h-9 rounded-lg text-white/30 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.09)" }}>
                <SlidersHorizontal size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Workflow grid ── */}
        <div style={{ padding: "28px clamp(24px, 4vw, 88px)" }}>
          {loading ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-2xl animate-pulse" style={{ height: 180, background: "#1c1c1c" }} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" }}>

              {/* New Workflow card */}
              <button onClick={handleNewWorkflow} className="flex flex-col group text-left">
                <div
                  className="rounded-2xl overflow-hidden flex items-center justify-center transition-all group-hover:brightness-125"
                  style={{ height: 180, background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                      <path d="M5 12h14" /><path d="M12 5v14" />
                    </svg>
                  </div>
                </div>
                <span className="mt-2 text-[13px] px-0.5 text-white/40 group-hover:text-white/70 transition-colors">
                  New Workflow
                </span>
              </button>

              {/* Sample + real workflows */}
              {displayedCards.map(workflow => (
                <button
                  key={workflow.id}
                  onClick={() => workflow.isSample ? handleOpenSample() : router.push(`/workflow/${workflow.id}`)}
                  className="flex flex-col group text-left">
                  <div
                    className="rounded-2xl overflow-hidden transition-all group-hover:brightness-110"
                    style={{ height: 180, border: "0.5px solid rgba(255,255,255,0.08)" }}>
                    <WorkflowThumbnail workflow={workflow} />
                  </div>
                  <div className="mt-2 px-0.5">
                    <div className="text-[13px] font-medium truncate text-white/80 group-hover:text-white transition-colors">
                      {workflow.name}
                    </div>
                    <div className="text-[11px] mt-0.5 text-white/30">
                      {workflow.isSample
                        ? "Sample workflow"
                        : `Edited ${formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}