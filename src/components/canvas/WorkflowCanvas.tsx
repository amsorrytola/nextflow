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

const HANDLE_COLORS: Record<string, string> = {
  text: "#f5a623",
  image: "#4d9de0",
  video: "#4CAF50",
}

export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeIds } = useWorkflowStore()

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

  // Color edges based on source handle type
  const coloredEdges = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const handleKey = `${sourceNode?.type}:${edge.sourceHandle}`
    const dataType = HANDLE_TYPES[handleKey] ?? "text"
    const color = HANDLE_COLORS[dataType] ?? "#555"
    return {
      ...edge,
      style: { stroke: color, strokeWidth: 1.5 },
      animated: false,
    }
  })

  return (
    <div className="flex-1 w-full" style={{ height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={coloredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={["Delete", "Backspace"]}
        multiSelectionKeyCode="Shift"
        style={{ background: "#0e0e0e" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="#2a2a2a"
        />
        <MiniMap
          position="bottom-right"
          style={{ background: "#1a1a1a", border: "1px solid #2e2e2e", borderRadius: 8 }}
          nodeColor="#333"
          maskColor="rgba(0,0,0,0.7)"
        />
        <Controls
          position="bottom-left"
          style={{ background: "#1e1e1e", border: "1px solid #2e2e2e", borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  )
}
