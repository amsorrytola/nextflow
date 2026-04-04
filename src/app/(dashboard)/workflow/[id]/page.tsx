"use client"

import { useEffect, useRef, useState } from "react"
import { use } from "react"
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas"
import { KreaLeftSidebar } from "@/components/sidebar/KreaLeftSidebar"
import { RightSidebar } from "@/components/sidebar/RightSidebar"
import { KreaToolbar } from "@/components/canvas/KreaToolbar"
import { KreaTopBar } from "@/components/canvas/KreaTopBar"
import { useWorkflowStore } from "@/store/workflowStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"
import { useRouter } from "next/navigation"

export type RightPanelView = "assets" | "history" | null

export default function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanelView>(null)
  const {
    nodes,
    edges,
    workflowName,
    setNodes,
    setEdges,
    setWorkflowId,
    setWorkflowName,
  } = useWorkflowStore()
  const loadCompleteRef = useRef(false)
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedSnapshotRef = useRef("")

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    loadCompleteRef.current = false

    // "sample" → load the built-in sample workflow
    if (id === "sample") {
      setWorkflowId("sample")
      setWorkflowName("Product Marketing Kit Generator")
      const { nodes, edges } = getSampleWorkflow()
      setNodes(nodes)
      setEdges(edges)
      lastSavedSnapshotRef.current = JSON.stringify({
        name: "Product Marketing Kit Generator",
        nodes,
        edges,
      })
      loadCompleteRef.current = true
      return
    }

    if (id === "default" || id === "new") {
      setWorkflowId(id)
      lastSavedSnapshotRef.current = ""
      loadCompleteRef.current = true
      return
    }

    // Load from DB
    fetch(`/api/workflows/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setWorkflowId(data.id)
          setWorkflowName(data.name)
          if (Array.isArray(data.nodes)) setNodes(data.nodes)
          if (Array.isArray(data.edges)) setEdges(data.edges)
          lastSavedSnapshotRef.current = JSON.stringify({
            name: data.name,
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            edges: Array.isArray(data.edges) ? data.edges : [],
          })
          loadCompleteRef.current = true
        }
      })
      .catch(console.error)
  }, [id, setNodes, setEdges, setWorkflowId, setWorkflowName])

  useEffect(() => {
    if (!mounted || !loadCompleteRef.current || id === "sample") return

    const snapshot = JSON.stringify({
      name: workflowName,
      nodes,
      edges,
    })

    if (snapshot === lastSavedSnapshotRef.current) return

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current)

    autosaveTimeoutRef.current = setTimeout(async () => {
      const hasMeaningfulContent =
        nodes.length > 0 ||
        edges.length > 0 ||
        workflowName.trim() !== "Untitled Workflow"

      try {
        if ((id === "default" || id === "new") && hasMeaningfulContent) {
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
          if (data.id) {
            lastSavedSnapshotRef.current = snapshot
            setWorkflowId(data.id)
            router.replace(`/workflow/${data.id}`)
          }
          return
        }

        if (id !== "default" && id !== "new") {
          await fetch(`/api/workflows/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: workflowName,
              nodes: JSON.parse(JSON.stringify(nodes)),
              edges: JSON.parse(JSON.stringify(edges)),
            }),
          })
          lastSavedSnapshotRef.current = snapshot
        }
      } catch (error) {
        console.error("Autosave failed", error)
      }
    }, 800)

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current)
    }
  }, [mounted, id, nodes, edges, workflowName, router, setWorkflowId])

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="text-sm" style={{ color: "var(--text-ghost)" }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <KreaLeftSidebar />
      <div className="flex flex-col flex-1 min-w-0 relative">
        <KreaTopBar workflowId={id} rightPanel={rightPanel} onRightPanelChange={setRightPanel} />
        <WorkflowCanvas />
        <KreaToolbar />
      </div>
      <RightSidebar panel={rightPanel} onClose={() => setRightPanel(null)} />
    </div>
  )
}
