import { executeNode } from "@/app/actions/executeWorkflow"
import type { WorkflowNode } from "@/store/workflowStore"
import type { Edge } from "@xyflow/react"

export type ExecutionMode = "FULL" | "PARTIAL" | "SINGLE"

export interface NodeExecutionResult {
  nodeId: string
  status: "success" | "failed"
  output: unknown
  error: string | null
  durationMs: number
}

function buildAdjacency(nodes: WorkflowNode[], edges: Edge[], targetIds: string[]) {
  const inDegree: Record<string, number> = {}
  const dependents: Record<string, string[]> = {}

  for (const id of targetIds) {
    inDegree[id] = 0
    dependents[id] = []
  }

  for (const edge of edges) {
    if (!targetIds.includes(edge.source) || !targetIds.includes(edge.target)) continue
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
    dependents[edge.source]?.push(edge.target)
  }

  return { inDegree, dependents }
}

export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: Edge[],
  mode: ExecutionMode,
  selectedIds: string[],
  onNodeStart: (nodeId: string) => void,
  onNodeComplete: (nodeId: string, result: NodeExecutionResult) => void
): Promise<NodeExecutionResult[]> {
  let targetIds: string[]
  if (mode === "FULL") targetIds = nodes.map((n) => n.id)
  else if (mode === "SINGLE") targetIds = selectedIds.slice(0, 1)
  else targetIds = selectedIds

  const { inDegree, dependents } = buildAdjacency(nodes, edges, targetIds)
  const nodeOutputs: Record<string, unknown> = {}
  const results: NodeExecutionResult[] = []
  const completed = new Set<string>()

  // Build execution levels via topological BFS
  const levels: string[][] = []
  const tempInDegree = { ...inDegree }
  let currentLevel = targetIds.filter((id) => (tempInDegree[id] ?? 0) === 0)

  while (currentLevel.length > 0) {
    levels.push(currentLevel)
    const nextLevel: string[] = []
    for (const id of currentLevel) {
      for (const depId of dependents[id] ?? []) {
        tempInDegree[depId] = (tempInDegree[depId] ?? 1) - 1
        if (tempInDegree[depId] === 0) nextLevel.push(depId)
      }
    }
    currentLevel = nextLevel
  }

  for (const level of levels) {
    await Promise.all(level.map(async (nodeId) => {
      onNodeStart(nodeId)
      const node = nodes.find((n) => n.id === nodeId)!

      // Collect inputs from upstream node outputs
      const inputs: Record<string, unknown> = {}
      for (const edge of edges) {
        if (edge.target !== nodeId) continue
        const srcOutput = nodeOutputs[edge.source]
        const handle = edge.targetHandle ?? ""

        if (handle === "images") {
          const existing = inputs["images"]
          if (Array.isArray(existing)) existing.push(srcOutput)
          else inputs["images"] = [srcOutput]
        } else if (handle) {
          inputs[handle] = srcOutput
        }
      }

      const result = await executeNode({
        nodeId,
        nodeType: node.data.type,
        nodeData: node.data as Record<string, unknown>,
        inputs,
      })

      nodeOutputs[nodeId] = result.output
      results.push(result)
      onNodeComplete(nodeId, result)
      completed.add(nodeId)
    }))
  }

  return results
}
