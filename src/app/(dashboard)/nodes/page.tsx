"use client"

import { useEffect, useState } from "react"
import { KreaLeftSidebar } from "@/components/sidebar/KreaLeftSidebar"
import { Search, ChevronDown, SlidersHorizontal, ArrowRight, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"

interface WorkflowCard {
  id: string
  name: string
  updatedAt: string
  isSample?: boolean
  thumbnailNodes?: { color: string; x: number; y: number }[]
}

// ── SVG mini-workflow thumbnail ───────────────────────────────────────────────
function WorkflowThumbnail({ workflow }: { workflow: WorkflowCard }) {
  const ns = workflow.thumbnailNodes ?? []
  return (
    <svg viewBox="0 0 280 175" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
      <rect width="280" height="175" fill="#111111" />
      {/* dot grid */}
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 14 }, (_, col) => (
          <circle key={`${row}-${col}`} cx={10 + col * 20} cy={10 + row * 22} r={0.8} fill="rgba(255,255,255,0.07)" />
        ))
      )}
      {ns.map((node, i) => {
        const next = ns[i + 1]
        return (
          <g key={i}>
            {next && (
              <path
                d={`M ${node.x + 54} ${node.y + 16} C ${node.x + 80} ${node.y + 16} ${next.x - 18} ${next.y + 16} ${next.x} ${next.y + 16}`}
                stroke={node.color}
                strokeWidth={1.4}
                fill="none"
                opacity={0.55}
                strokeLinecap="round"
              />
            )}
            {/* card */}
            <rect x={node.x} y={node.y} width={54} height={32} rx={7}
              fill="#1c1c1c" stroke={node.color} strokeWidth={0.7} opacity={0.95} />
            {/* handles */}
            <circle cx={node.x}       cy={node.y + 16} r={3.5} fill={node.color} opacity={0.85} />
            <circle cx={node.x + 54}  cy={node.y + 16} r={3.5} fill={node.color} opacity={0.85} />
            {/* inner lines */}
            <rect x={node.x + 8} y={node.y + 10} width={18} height={2.5} rx={1.25} fill={node.color} opacity={0.35} />
            <rect x={node.x + 8} y={node.y + 17} width={28} height={2}   rx={1}    fill="rgba(255,255,255,0.09)" />
          </g>
        )
      })}
    </svg>
  )
}

const SAMPLE_THUMBNAILS: WorkflowCard["thumbnailNodes"][] = [
  [{ color: "#0080FF", x: 14, y: 28 }, { color: "#FCC800", x: 100, y: 56 }, { color: "#29D246", x: 178, y: 28 }, { color: "#9B6FFF", x: 212, y: 88 }],
  [{ color: "#FCC800", x: 12, y: 50 }, { color: "#0080FF", x: 94, y: 18 }, { color: "#0080FF", x: 94, y: 88 }, { color: "#29D246", x: 192, y: 52 }],
  [{ color: "#9B6FFF", x: 12, y: 68 }, { color: "#FCC800", x: 98, y: 20 }, { color: "#0080FF", x: 98, y: 96 }, { color: "#29D246", x: 196, y: 58 }],
  [{ color: "#29D246", x: 8,  y: 38 }, { color: "#9B6FFF", x: 88, y: 18 }, { color: "#FCC800", x: 88, y: 78 }, { color: "#0080FF", x: 188, y: 52 }],
]

const SAMPLE_CARD: WorkflowCard = {
  id: "sample",
  name: "SampleWorkflow",
  updatedAt: new Date().toISOString(),
  isSample: true,
  thumbnailNodes: [
    { color: "#0080FF", x: 14, y: 18 },
    { color: "#FCC800", x: 14, y: 88 },
    { color: "#9B6FFF", x: 110, y: 52 },
    { color: "#29D246", x: 210, y: 52 },
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

  const handleOpenSample = () => { router.push("/workflow/sample") }

  if (!mounted) return null

  const displayedCards: WorkflowCard[] = [SAMPLE_CARD, ...workflows]

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-base)" }}>
      <KreaLeftSidebar />

      <main style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>

        {/* ── Hero banner ── */}
        <div style={{ position: "relative", overflow: "hidden", minHeight: 260 }}>
          {/* Background image */}
          <img
            src="https://s.krea.ai/nodesHeaderBannerBlurGradient.webp"
            alt=""
            draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
          />
          {/* Blur bleed */}
          <img
            src="https://s.krea.ai/nodesHeaderBannerBlurGradient.webp"
            alt=""
            draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, transform: "scale(1.35)", filter: "blur(24px)", opacity: 0.14, pointerEvents: "none" }}
          />
          {/* Gradient vignette */}
          <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "linear-gradient(to bottom, transparent 40%, var(--bg-base) 100%)", pointerEvents: "none" }} />

          <div style={{
            position: "relative", zIndex: 3,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            gap: 20, minHeight: 260, padding: "clamp(28px,4vw,80px)",
            color: "white",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="https://s.krea.ai/icons/NodeEditor.png" alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                <h1 style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.92)" }}>
                  Node Editor
                </h1>
              </div>
              <p style={{
                fontSize: 13.5, color: "rgba(255,255,255,0.52)", lineHeight: 1.7,
                maxWidth: 360, fontWeight: 400,
              }}>
                Nodes is the most powerful way to operate Krea. Connect every tool and model into complex automated pipelines.
              </p>
            </div>

            <button
              onClick={handleNewWorkflow}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "9px 28px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.95)",
                border: "none",
                color: "#000",
                fontSize: 13.5,
                fontWeight: 500,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                width: "fit-content",
                transition: "background 0.15s ease, transform 0.12s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,1)"
                ;(e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.95)"
                ;(e.currentTarget as HTMLElement).style.transform = "translateY(0)"
              }}
            >
              New Workflow
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ── Tabs + controls ── */}
        <div style={{ padding: "0 clamp(28px,4vw,80px)", paddingTop: 36 }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingBottom: 14,
            borderBottom: "1px solid var(--border)",
          }}>
            {/* Tabs */}
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 9,
                    border: "none",
                    background: activeTab === tab ? "var(--bg-elevated-hover)" : "transparent",
                    color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: activeTab === tab ? 500 : 400,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    letterSpacing: "-0.01em",
                    transition: "background 0.12s ease, color 0.12s ease",
                  }}
                  onMouseEnter={e => { if (activeTab !== tab) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)" }}
                  onMouseLeave={e => { if (activeTab !== tab) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)" }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "7px 12px",
                borderRadius: 9,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}>
                <Search size={12} style={{ color: "var(--text-ghost)", flexShrink: 0 }} />
                <input
                  placeholder="Search projects…"
                  style={{
                    background: "transparent", border: "none", outline: "none",
                    fontSize: 12.5, color: "var(--text-soft)",
                    fontFamily: "inherit", width: 140,
                  }}
                />
              </div>
              <button style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px",
                borderRadius: 9, border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                fontSize: 12.5, cursor: "pointer",
                transition: "background 0.12s",
              }}>
                Last viewed <ChevronDown size={11} />
              </button>
              <button style={{
                width: 34, height: 34,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 9, border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "background 0.12s",
              }}>
                <SlidersHorizontal size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Workflow grid ── */}
        <div style={{ padding: "24px clamp(28px,4vw,80px) 48px" }}>
          {loading ? (
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{
                  height: 175, borderRadius: 14,
                  background: "var(--bg-elevated)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>

              {/* New Workflow button */}
              <button
                onClick={handleNewWorkflow}
                style={{ display: "flex", flexDirection: "column", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <div style={{
                  height: 175, borderRadius: 14,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated-hover)"
                    ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"
                    ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    border: "1px solid var(--border-strong)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--text-ghost)",
                  }}>
                    <Plus size={15} />
                  </div>
                </div>
                <div style={{ marginTop: 8, paddingLeft: 2 }}>
                  <div style={{ fontSize: 12.5, color: "var(--text-muted)", letterSpacing: "-0.01em" }}>
                    New Workflow
                  </div>
                </div>
              </button>

              {/* Workflow cards */}
              {displayedCards.map(workflow => (
                <button
                  key={workflow.id}
                  onClick={() => workflow.isSample ? handleOpenSample() : router.push(`/workflow/${workflow.id}`)}
                  style={{ display: "flex", flexDirection: "column", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  <div style={{
                    height: 175, borderRadius: 14, overflow: "hidden",
                    border: "1px solid var(--border)",
                    transition: "border-color 0.15s ease, transform 0.16s ease",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"
                      ;(e.currentTarget as HTMLElement).style.transform = "scale(1.012)"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"
                      ;(e.currentTarget as HTMLElement).style.transform = "scale(1)"
                    }}
                  >
                    <WorkflowThumbnail workflow={workflow} />
                  </div>
                  <div style={{ marginTop: 8, paddingLeft: 2 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-soft)", letterSpacing: "-0.012em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {workflow.name}
                    </div>
                    <div style={{ fontSize: 11, marginTop: 2, color: "var(--text-ghost)" }}>
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