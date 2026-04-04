import { create } from "zustand"
import { temporal } from "zundo"
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react"
import type { AnyNodeData, NodeExecutionStatus } from "@/types"
import type { WorkflowRunRecord } from "@/types/workflow"

export interface WorkflowNode extends Node {
  data: AnyNodeData
}

interface ExecutionState {
  [nodeId: string]: NodeExecutionStatus
}

interface WorkflowState {
  // Canvas
  nodes: WorkflowNode[]
  edges: Edge[]
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: WorkflowNode) => void
  updateNodeData: (nodeId: string, data: Partial<AnyNodeData>) => void
  removeNode: (nodeId: string) => void
  removeEdge: (edgeId: string) => void
  removeSelectedElements: () => void

  // Selection
  selectedNodeIds: string[]
  selectedEdgeIds: string[]
  setSelectedNodeIds: (ids: string[]) => void
  setSelectedEdgeIds: (ids: string[]) => void

  // Execution status per node
  executionStatus: ExecutionState
  setNodeExecutionStatus: (nodeId: string, status: NodeExecutionStatus) => void
  resetExecutionStatus: () => void

  // Workflow history (runs)
  runs: WorkflowRunRecord[]
  addRun: (run: WorkflowRunRecord) => void

  // Workflow meta
  workflowId: string | null
  workflowName: string
  setWorkflowId: (id: string) => void
  setWorkflowName: (name: string) => void
}

import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react"

export const useWorkflowStore = create<WorkflowState>()(
  temporal(
    (set) => ({
      nodes: [],
      edges: [],

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as WorkflowNode[],
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        })),

      // No animated:true, no style override — let KreaEdge handle all styling
      onConnect: (connection) =>
        set((state) => ({
          edges: addEdge(
            { ...connection, type: "kreaEdge" },
            state.edges
          ),
        })),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      addNode: (node) =>
        set((state) => ({ nodes: [...state.nodes, node] })),

      updateNodeData: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          ) as WorkflowNode[],
        })),

      removeNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        })),

      removeEdge: (edgeId) =>
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== edgeId),
        })),

      removeSelectedElements: () =>
        set((state) => ({
          nodes: state.nodes.filter((n) => !state.selectedNodeIds.includes(n.id)),
          edges: state.edges.filter(
            (e) =>
              !state.selectedEdgeIds.includes(e.id) &&
              !state.selectedNodeIds.includes(e.source) &&
              !state.selectedNodeIds.includes(e.target)
          ),
          selectedNodeIds: [],
          selectedEdgeIds: [],
        })),

      selectedNodeIds: [],
      selectedEdgeIds: [],
      setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),
      setSelectedEdgeIds: (ids) => set({ selectedEdgeIds: ids }),

      executionStatus: {},
      setNodeExecutionStatus: (nodeId, status) =>
        set((state) => ({
          executionStatus: { ...state.executionStatus, [nodeId]: status },
        })),
      resetExecutionStatus: () => set({ executionStatus: {} }),

      runs: [],
      addRun: (run) =>
        set((state) => ({ runs: [run, ...state.runs] })),

      workflowId: null,
      workflowName: "Untitled Workflow",
      setWorkflowId: (id) => set({ workflowId: id }),
      setWorkflowName: (name) => set({ workflowName: name }),
    }),
    {
      limit: 50,
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    }
  )
)
