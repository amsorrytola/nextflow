"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  type NodeTypes,
  type IsValidConnection,
  type Edge,
  type EdgeTypes,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useWorkflowStore } from "@/store/workflowStore"
import { TextNode } from "@/components/nodes/TextNode"
import { UploadImageNode } from "@/components/nodes/UploadImageNode"
import { UploadVideoNode } from "@/components/nodes/UploadVideoNode"
import { LLMNode } from "@/components/nodes/LLMNode"
import { CropImageNode } from "@/components/nodes/CropImageNode"
import { ExtractFrameNode } from "@/components/nodes/ExtractFrameNode"
import { CanvasContextMenu } from "@/components/canvas/CanvasContextMenu"

const nodeTypes: NodeTypes = {
  textNode: TextNode,
  uploadImageNode: UploadImageNode,
  uploadVideoNode: UploadVideoNode,
  llmNode: LLMNode,
  cropImageNode: CropImageNode,
  extractFrameNode: ExtractFrameNode,
}

const HANDLE_TYPES: Record<string, "text" | "image" | "video"> = {
  "textNode:outputText": "text",
  "textNode:output": "text",
  "uploadImageNode:outputImage": "image",
  "uploadImageNode:output": "image",
  "uploadVideoNode:outputVideo": "video",
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

const DATA_TYPE_COLORS: Record<string, string> = {
  text: "#FCC800",
  image: "#0080FF",
  video: "#29D246",
}

function KreaEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const color = (data?.color as string) ?? "#FCC800"
  const isActive = (data?.isActive as boolean) ?? false
  const isDone = (data?.isDone as boolean) ?? false

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  })

  const opacity = isActive ? 1 : isDone ? 0.85 : selected ? 0.9 : 0.55

  return (
    <>
      {(isActive || selected) && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 10 : 6}
          opacity={isActive ? 0.2 : 0.1}
          style={{ filter: `blur(${isActive ? 8 : 4}px)`, pointerEvents: "none" }}
        />
      )}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 2 : 1.5}
        opacity={opacity}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: isActive ? `drop-shadow(0 0 4px ${color}bb)` : "none",
          transition: "opacity 0.3s ease, stroke-width 0.2s ease",
          pointerEvents: "none",
        }}
      />
      {isActive && (
        <circle r="3.5" fill={color} opacity={0.95}>
          <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        style={{ cursor: "pointer" }}
      />
    </>
  )
}

const edgeTypes: EdgeTypes = {
  kreaEdge: KreaEdge,
}

// Inner component that has access to useReactFlow
function CanvasInner() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeIds,
    setSelectedEdgeIds,
    removeEdge,
    removeSelectedElements,
    executionStatus,
  } = useWorkflowStore()

  const { screenToFlowPosition } = useReactFlow()

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    screenX: number
    screenY: number
    canvasX: number
    canvasY: number
  } | null>(null)

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const { source, sourceHandle, target, targetHandle } = connection
      if (source === target) return false
      const sourceNode = nodes.find((n) => n.id === source)
      const targetNode = nodes.find((n) => n.id === target)
      if (!sourceNode || !targetNode) return false
      const sourceType = HANDLE_TYPES[`${sourceNode.type}:${sourceHandle}`]
      const targetType = HANDLE_TYPES[`${targetNode.type}:${targetHandle}`]
      if (!sourceType || !targetType) return true
      return sourceType === targetType
    },
    [nodes]
  )

  const onSelectionChange = useCallback(
    ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }: {
      nodes: { id: string }[]
      edges: { id: string }[]
    }) => {
      setSelectedNodeIds(selectedNodes.map((n) => n.id))
      setSelectedEdgeIds(selectedEdges.map((e) => e.id))
    },
    [setSelectedEdgeIds, setSelectedNodeIds]
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable

      if (isTypingTarget) return

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        removeSelectedElements()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [removeSelectedElements])

  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      const canvasPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      setContextMenu({
        screenX: event.clientX,
        screenY: event.clientY,
        canvasX: canvasPos.x,
        canvasY: canvasPos.y,
      })
    },
    [screenToFlowPosition]
  )

  const styledEdges: Edge[] = edges.map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const handleKey = `${sourceNode?.type}:${edge.sourceHandle}`
    const dataType = HANDLE_TYPES[handleKey] ?? "text"
    const color = DATA_TYPE_COLORS[dataType] ?? "#FCC800"
    const sourceStatus = executionStatus[edge.source ?? ""]
    const targetStatus = executionStatus[edge.target ?? ""]
    const isActive = sourceStatus === "running" || targetStatus === "running"
    const isDone = sourceStatus === "success"

    return {
      ...edge,
      type: "kreaEdge",
      animated: false,
      style: undefined,
      data: { ...(edge.data ?? {}), color, isActive, isDone },
    }
  })

  return (
    <>
      <style>{`
        .react-flow__edge path { stroke-dasharray: none !important; animation: none !important; }
        .react-flow__edge.animated path { stroke-dasharray: none !important; animation: none !important; }
        .react-flow__connection-path {
          stroke: color-mix(in srgb, var(--text-primary) 35%, transparent) !important;
          stroke-width: 1.5px !important;
          stroke-dasharray: none !important;
          animation: none !important;
        }
        .react-flow__handle { transition: width 0.15s ease, height 0.15s ease, opacity 0.15s ease !important; }
        .react-flow__handle:hover { width: 14px !important; height: 14px !important; }
        .react-flow__background pattern circle { fill: color-mix(in srgb, var(--text-primary) 10%, transparent) !important; }
        .react-flow__pane { cursor: default !important; }
      `}</style>

      <div className="flex-1 w-full" style={{ height: "100vh" }} onContextMenu={handleContextMenu}>
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          deleteKeyCode={null}
          multiSelectionKeyCode="Shift"
          style={{ background: "var(--bg-primary)" }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{ type: "kreaEdge", animated: false }}
          nodeDragHandle=".node-drag-handle"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          // Dismiss context menu on canvas click
          onPaneClick={() => setContextMenu(null)}
          onNodeClick={() => setContextMenu(null)}
          onEdgeClick={(_, edge) => {
            setContextMenu(null)
            setSelectedNodeIds([])
            setSelectedEdgeIds([edge.id])
          }}
          onEdgeDoubleClick={(_, edge) => {
            setContextMenu(null)
            removeEdge(edge.id)
            setSelectedEdgeIds([])
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={0.9}
            color="color-mix(in srgb, var(--text-primary) 10%, transparent)"
          />

          <MiniMap
            position="bottom-right"
            style={{
              background: "#161616",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              overflow: "hidden",
            }}
            nodeColor={(node) => {
              const status = executionStatus[node.id]
              if (status === "running") return "#a855f7"
              if (status === "success") return "#4CAF50"
              if (status === "error") return "#ef4444"
              return "#2e2e2e"
            }}
            maskColor="rgba(0,0,0,0.65)"
          />

          <Controls
            position="bottom-left"
            style={{
              background: "#1a1a1a",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          />
        </ReactFlow>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.screenX}
          y={contextMenu.screenY}
          canvasX={contextMenu.canvasX}
          canvasY={contextMenu.canvasY}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

// Outer component wraps with ReactFlowProvider so useReactFlow works
import { ReactFlowProvider } from "@xyflow/react"

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
