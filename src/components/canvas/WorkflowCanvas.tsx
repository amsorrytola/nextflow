"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  type NodeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useWorkflowStore } from "@/store/workflowStore"

const nodeTypes: NodeTypes = {}

export function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeIds,
  } = useWorkflowStore()

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: { id: string }[] }) => {
      setSelectedNodeIds(nodes.map((n) => n.id))
    },
    [setSelectedNodeIds]
  )

  return (
    <div className="flex-1 w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        className="bg-[#0d0d0d]"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2a2a2a"
        />
        <MiniMap
          position="bottom-right"
          style={{ background: "#111111", border: "1px solid #2a2a2a" }}
          nodeColor="#a855f7"
          maskColor="rgba(0,0,0,0.6)"
        />
        <Controls
          position="bottom-left"
          style={{ background: "#111111", border: "1px solid #2a2a2a" }}
        />
      </ReactFlow>
    </div>
  )
}
