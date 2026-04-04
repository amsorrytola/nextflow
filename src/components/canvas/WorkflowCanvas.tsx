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
  getBezierPath,
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

// Exact Krea edge colors
const DATA_TYPE_COLORS: Record<string, string> = {
  text:  "#FCC800",   // prompt/text — Krea gold
  image: "#0080FF",   // image — Krea blue
  video: "#29D246",   // video — Krea green
}

// ─── Krea-style tubular bezier edge ─────────────────────────────────────────
// Renders: glow halo + core stroke + animated flow tubes + travel dot
function KreaEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data, selected,
}: EdgeProps) {
  const color   = (data?.color   as string)  ?? "#FCC800"
  const isActive = (data?.isActive as boolean) ?? false
  const isDone   = (data?.isDone  as boolean) ?? false

  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.42,      // Krea uses a gentler, natural-feeling curve
  })

  // Opacity tiers
  const baseOpacity = isActive ? 1 : isDone ? 0.80 : selected ? 0.85 : 0.48

  return (
    <g>
      {/* ① Wide glow halo — always visible but faint, strong when active */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 14 : selected ? 8 : 5}
        opacity={isActive ? 0.18 : selected ? 0.10 : 0.055}
        style={{
          filter: `blur(${isActive ? 9 : 4}px)`,
          pointerEvents: "none",
          transition: "opacity 0.3s ease, stroke-width 0.25s ease",
        }}
      />

      {/* ② Tubular core — the "pipe" body */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={isActive ? 2.2 : 1.6}
        strokeLinecap="round"
        opacity={baseOpacity}
        style={{
          pointerEvents: "none",
          filter: isActive ? `drop-shadow(0 0 5px ${color}aa)` : "none",
          transition: "opacity 0.3s ease, stroke-width 0.22s ease, filter 0.25s ease",
        }}
      />

      {/* ③ Inner highlight — thin bright line giving the "tube" illusion */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={isActive ? 0.7 : 0.5}
        strokeLinecap="round"
        opacity={isActive ? 0.55 : baseOpacity * 0.45}
        style={{ pointerEvents: "none", transition: "opacity 0.3s ease" }}
      />

      {/* ④ Animated flow — only when running */}
      {isActive && (
        <>
          {/* Moving dash segment — simulates signal travelling */}
          <path
            d={edgePath}
            fill="none"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeDasharray="10 28"
            opacity={0.9}
            style={{
              pointerEvents: "none",
              filter: `drop-shadow(0 0 4px ${color}cc)`,
              animation: "krea-edge-flow 0.9s linear infinite",
            }}
          />
          {/* Travelling dot (brighter leading point) */}
          <circle r="3.2" fill={color} opacity={0.96} style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
            <animateMotion
              dur="0.9s"
              repeatCount="indefinite"
              path={edgePath}
              rotate="auto"
            />
          </circle>
        </>
      )}

      {/* ⑤ Invisible fat hit area for pointer events */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        style={{ cursor: "pointer" }}
      />
    </g>
  )
}

const edgeTypes: EdgeTypes = { kreaEdge: KreaEdge }

// ─── Inner canvas (has access to useReactFlow) ───────────────────────────────
function CanvasInner() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    setSelectedNodeIds, setSelectedEdgeIds,
    removeEdge, removeSelectedElements,
    executionStatus,
  } = useWorkflowStore()

  const { screenToFlowPosition } = useReactFlow()

  const [contextMenu, setContextMenu] = useState<{
    screenX: number; screenY: number; canvasX: number; canvasY: number
  } | null>(null)

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

  const onSelectionChange = useCallback(({
    nodes: sn, edges: se,
  }: { nodes: { id: string }[]; edges: { id: string }[] }) => {
    setSelectedNodeIds(sn.map(n => n.id))
    setSelectedEdgeIds(se.map(e => e.id))
  }, [setSelectedEdgeIds, setSelectedNodeIds])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t?.isContentEditable) return
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeSelectedElements() }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [removeSelectedElements])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const canvasPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setContextMenu({ screenX: e.clientX, screenY: e.clientY, canvasX: canvasPos.x, canvasY: canvasPos.y })
  }, [screenToFlowPosition])

  // Attach color + active/done status to each edge
  const styledEdges: Edge[] = edges.map(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const handleKey  = `${sourceNode?.type}:${edge.sourceHandle}`
    const dataType   = HANDLE_TYPES[handleKey] ?? "text"
    const color      = DATA_TYPE_COLORS[dataType] ?? "#FCC800"
    const srcStatus  = executionStatus[edge.source ?? ""]
    const tgtStatus  = executionStatus[edge.target ?? ""]
    const isActive   = srcStatus === "running" || tgtStatus === "running"
    const isDone     = srcStatus === "success"
    return { ...edge, type: "kreaEdge", animated: false, style: undefined, data: { ...(edge.data ?? {}), color, isActive, isDone } }
  })

  const draggableNodes = nodes.map(n => ({ ...n, dragHandle: ".node-drag-handle" }))

  return (
    <>
      <style>{`
        /* Edge flow animation */
        @keyframes krea-edge-flow {
          from { stroke-dashoffset: 38; }
          to   { stroke-dashoffset:  0; }
        }
        /* Kill any RF default edge styling */
        .react-flow__edge path { stroke-dasharray: none !important; animation: none !important; }
        .react-flow__edge.animated path { stroke-dasharray: none !important; animation: none !important; }
        /* Handle scale on hover */
        .react-flow__handle { transition: transform 0.13s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .react-flow__handle:hover { transform: scale(1.5) !important; }
        /* Dot grid colour */
        .react-flow__background pattern circle { fill: var(--border) !important; }
        /* Remove RF pane cursor override */
        .react-flow__pane { cursor: default !important; }
        /* Connection line */
        .react-flow__connection-path {
          stroke: var(--border-strong) !important;
          stroke-width: 1.5px !important;
          stroke-dasharray: none !important;
          animation: none !important;
        }
      `}</style>

      <div className="flex-1 w-full" style={{ height: "100vh" }} onContextMenu={handleContextMenu}>
        <ReactFlow
          nodes={draggableNodes}
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
          style={{ background: "var(--bg-base)" }}
          minZoom={0.15}
          maxZoom={2.5}
          defaultEdgeOptions={{ type: "kreaEdge", animated: false }}
          nodesDraggable
          nodesConnectable
          elementsSelectable
          panOnDrag
          zoomOnScroll
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
            gap={20}
            size={1}
            color="var(--border)"
          />
          <MiniMap
            position="bottom-right"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12 }}
            nodeColor={node => {
              const s = executionStatus[node.id]
              if (s === "running") return "var(--krea-purple)"
              if (s === "success") return "var(--krea-green)"
              if (s === "error")   return "var(--krea-red)"
              return "var(--bg-elevated)"
            }}
            maskColor="rgba(0,0,0,0.60)"
          />
          <Controls
            position="bottom-left"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12 }}
          />
        </ReactFlow>
      </div>

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

import { ReactFlowProvider } from "@xyflow/react"

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}