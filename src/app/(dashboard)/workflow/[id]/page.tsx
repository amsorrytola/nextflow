"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { WorkflowCanvas } from "@/components/canvas/WorkflowCanvas"
import { KreaLeftSidebar } from "@/components/sidebar/KreaLeftSidebar"
import { RightSidebar } from "@/components/sidebar/RightSidebar"
import { KreaToolbar } from "@/components/canvas/KreaToolbar"
import { KreaTopBar } from "@/components/canvas/KreaTopBar"
import { useWorkflowStore } from "@/store/workflowStore"

export default function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mounted, setMounted] = useState(false)
  const { setNodes, setEdges, setWorkflowId, setWorkflowName } = useWorkflowStore()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (id === "default" || id === "new") {
      setWorkflowId(id)
      return
    }
    // Load workflow from DB
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
      <div className="flex h-screen w-screen items-center justify-center bg-[#141414]">
        <div className="text-[#555] text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#141414]">
      <KreaLeftSidebar />
      <div className="flex flex-col flex-1 min-w-0 relative">
        <KreaTopBar workflowId={id} />
        <WorkflowCanvas />
        <KreaToolbar />
      </div>
      <RightSidebar />
    </div>
  )
}
