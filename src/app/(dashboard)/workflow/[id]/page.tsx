"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas"
import { KreaLeftSidebar } from "@/components/sidebar/KreaLeftSidebar"
import { RightSidebar } from "@/components/sidebar/RightSidebar"
import { KreaToolbar } from "@/components/canvas/KreaToolbar"
import { KreaTopBar } from "@/components/canvas/KreaTopBar"
import { useWorkflowStore } from "@/store/workflowStore"
import { getSampleWorkflow } from "@/lib/sampleWorkflow"

export type RightPanelView = "assets" | "history" | null

export default function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mounted, setMounted] = useState(false)
  const [rightPanel, setRightPanel] = useState<RightPanelView>(null)
  const { setNodes, setEdges, setWorkflowId, setWorkflowName } = useWorkflowStore()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    // "sample" → load the built-in sample workflow
    if (id === "sample") {
      setWorkflowId("sample")
      setWorkflowName("SampleWorkflow")
      const { nodes, edges } = getSampleWorkflow()
      setNodes(nodes)
      setEdges(edges)
      return
    }

    if (id === "default" || id === "new") {
      setWorkflowId(id)
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
        }
      })
      .catch(console.error)
  }, [id, setNodes, setEdges, setWorkflowId, setWorkflowName])

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
