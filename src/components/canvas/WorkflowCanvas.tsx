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
  type EdgeTypes,
  BaseEdge,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
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

// Colors matching Krea's handle system from the video:
// text/prompt → yellow/gold, image → blue, video → green
const DATA_TYPE_COLORS: Record<string, string> = {
  text: "#FCC800",   // Krea yellow (prompt/text handles)
  image: "#0080FF",  // Krea blue (image handles)
  video: "#29D246",  // Krea green (video handles)
}

// Custom animated edge with glow — matches Krea's video exactly
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
    borderRadius: 12,
  })

  const strokeWidth = isActive ? 2 : 1.5
  const opacity = isActive ? 1 : isDone ? 0.9 : 0.5

  return (
    <>
      {/* Glow layer — blurred wide stroke underneath */}
      {(isActive || isDone || selected) && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 8 : 5}
          opacity={isActive ? 0.25 : 0.12}
          style={{ filter: `blur(${isActive ? 6 : 3}px)`, pointerEvents: "none" }}
        />
      )}

      {/* Main edge path */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        opacity={opacity}
        style={{
          filter: isActive ? `drop-shadow(0 0 3px ${color}cc)` : "none",
          transition: "opacity 0.3s ease, stroke-width 0.3s ease",
          pointerEvents: "none",
        }}
      />

      {/* Animated flow dot — moves along the edge when active */}
      {isActive && (
        <circle r="3" fill={color} opacity={0.9}>
          <animateMotion dur="1.2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Dash animation overlay for active state */}
      {isActive && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="6 8"
          opacity={0.6}
          style={{ pointerEvents: "none" }}
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-28"
            dur="0.6s"
            repeatCount="indefinite"
          />
        </path>
      )}

      {/* Interaction area (invisible, wider for click target) */}
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

export function WorkflowCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeIds,
    executionStatus,
  } = useWorkflowStore()

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
    ({ nodes: selectedNodes }: { nodes: { id: string }[] }) => {
      setSelectedNodeIds(selectedNodes.map((n) => n.id))
    },
    [setSelectedNodeIds]
  )

  // Build styled edges with Krea color system
  const styledEdges: Edge[] = edges.map((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const handleKey = `${sourceNode?.type}:${edge.sourceHandle}`
    const dataType = HANDLE_TYPES[handleKey] ?? "text"
    const color = DATA_TYPE_COLORS[dataType] ?? "#FCC800"

    const sourceStatus = executionStatus[edge.source ?? ""]
    const targetStatus = executionStatus[edge.target ?? ""]
    const isActive =
      sourceStatus === "running" || targetStatus === "running"
    const isDone = sourceStatus === "success"

    return {
      ...edge,
      type: "kreaEdge",
      data: {
        color,
        isActive,
        isDone,
      },
    }
  })

  return (
    <>
      <style>{`
        /* Override ReactFlow defaults for Krea look */
        .react-flow__handle {
          transition: width 0.15s ease, height 0.15s ease, opacity 0.15s ease !important;
        }
        .react-flow__handle:hover {
          width: 14px !important;
          height: 14px !important;
        }
        .react-flow__node {
          /* Remove ReactFlow's default selection border - we handle it in NodeWrapper */
        }
        .react-flow__node.selected > div {
          outline: none !important;
        }
        /* Connection line style while dragging */
        .react-flow__connection-path {
          stroke: rgba(255,255,255,0.4) !important;
          stroke-width: 1.5px !important;
          stroke-dasharray: 5 5 !important;
        }
        /* Minimap node colors */
        .react-flow__minimap-node {
          rx: 4px;
        }
        /* Background dot color */
        .react-flow__background pattern circle {
          fill: #282828 !important;
        }
      `}</style>

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
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          deleteKeyCode={["Delete", "Backspace"]}
          multiSelectionKeyCode="Shift"
          style={{ background: "#101010" }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "kreaEdge",
          }}
          // CRITICAL: these must NOT be set to false for dragging to work
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={0.9}
            color="#282828"
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
    </>
  )
}