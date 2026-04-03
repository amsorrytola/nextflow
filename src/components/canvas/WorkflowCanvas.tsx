"use client"

import { useCallback } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  type NodeTypes,
  type IsValidConnection,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useWorkflowStore } from "@/store/workflowStore"
import { TextNode } from "@/components/nodes/TextNode"
import { UploadImageNode } from "@/components/nodes/UploadImageNode"
import { UploadVideoNode } from "@/components/nodes/UploadVideoNode"
import { LLMNode } from "@/components/nodes/LLMNode"
import { CropImageNode } from "@/components/nodes/CropImageNode"
import { ExtractFrameNode } from "@/components/nodes/ExtractFrameNode"

const nodeTypes: NodeTypes = {
  textNode: TextNode,
  uploadImageNode: UploadImageNode,
  uploadVideoNode: UploadVideoNode,
  llmNode: LLMNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode,
}

// Handle type → data type mapping
const HANDLE_TYPES: Record<string, "text" | "image" | "video"> = {
  "textNode:output": "text",
  "uploadImageNode:output": "image",
  "uploadVideoNode:output": "video",
  "llmNode:output": "text",
  "cropImageNode:output": "image",
  "extractFrameNode:output": "image",
  "llmNode:system_prompt": "text",
  "llmNode:user_message": "text",
  "llmNode:images": "image",
  "cropImageNode:image_url": "image",
  "cropImageNode:x_percent": "text",
  "cropImageNode:y_percent": "text",
  "cropImageNode:width_percent": "text",
  "cropImageNode:height_percent": "text",
  "extractFrameNode:video_url": "video",
  "extractFrameNode:timestamp": "text",
}

// Colors matching Krea's handle colors
const HANDLE_COLORS: Record<string, string> = {
  text: "#f5a623",   // yellow/orange for text
  image: "#4d9de0",  // blue for image
  video: "#4CAF50",  // green for video
}

export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeIds, executionStatus } = useWorkflowStore()

  const isValidConnection: IsValidConnection = useCallback((connection) => {
    const { source, sourceHandle, target, targetHandle } = connection
    if (source === target) return false
    const sourceNode = nodes.find(n => n.id === source)
    const targetNode = nodes.find(n => n.id === target)
    if (!sourceNode || !targetNode) return false
    const sourceType = HANDLE_TYPES[`${sourceNode.type}:${sourceHandle}`]
    const targetType = HANDLE_TYPES[`${targetNode.type}:${targetHandle}`]
    if (!sourceType || !targetType) return true
    return sourceType === targetType
  }, [nodes])

  const onSelectionChange = useCallback(({ nodes }: { nodes: { id: string }[] }) => {
    setSelectedNodeIds(nodes.map(n => n.id))
  }, [setSelectedNodeIds])

  // Build colored + animated edges
  const styledEdges: Edge[] = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const handleKey = `${sourceNode?.type}:${edge.sourceHandle}`
    const dataType = HANDLE_TYPES[handleKey] ?? "text"
    const color = HANDLE_COLORS[dataType] ?? "#f5a623"

    // Check if source node is running → animate edge
    const sourceStatus = executionStatus[edge.source ?? ""]
    const targetStatus = executionStatus[edge.target ?? ""]
    const isActive = sourceStatus === "running" || targetStatus === "running"
    const isDone = sourceStatus === "success"

    return {
      ...edge,
      type: "default",
      animated: isActive,
      style: {
        stroke: color,
        strokeWidth: isActive ? 2 : 1.5,
        opacity: isDone ? 1 : 0.75,
        // glow effect when active
        filter: isActive ? `drop-shadow(0 0 4px ${color}99)` : "none",
      },
      markerEnd: undefined,
    }
  })

  return (
    <div className="flex-1 w-full" style={{ height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        style={{ background: "#0e0e0e" }}
        defaultEdgeOptions={{
          type: "default",
          style: { strokeWidth: 1.5 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="#1e1e1e"
        />
        <MiniMap
          position="bottom-right"
          style={{
            background: "#161616",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
          }}
          nodeColor={(node) => {
            const status = executionStatus[node.id]
            if (status === "running") return "#a855f7"
            if (status === "success") return "#4CAF50"
            if (status === "error") return "#ef4444"
            return "#2a2a2a"
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
        <Controls
          position="bottom-left"
          style={{
            background: "#161616",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        />
      </ReactFlow>
    </div>
  )
}