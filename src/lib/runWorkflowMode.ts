import { executeWorkflow, type ExecutionMode } from "@/lib/executionEngine"
import { useWorkflowStore } from "@/store/workflowStore"

export async function runWorkflowMode(
  mode: ExecutionMode,
  selectedIds?: string[]
) {
  const state = useWorkflowStore.getState()
  const {
    nodes,
    edges,
    executionStatus,
    updateNodeData,
    setNodeExecutionStatus,
    resetExecutionStatus,
    addRun,
    selectedNodeIds,
  } = state

  const targetIds = selectedIds ?? selectedNodeIds
  const isRunning = Object.values(executionStatus).some((status) => status === "running")
  if (isRunning) return false

  resetExecutionStatus()
  const startTime = Date.now()
  const nodeRunRecords: Parameters<typeof addRun>[0]["nodeRuns"] = []

  await executeWorkflow(
    nodes,
    edges,
    mode,
    targetIds,
    (nodeId) => setNodeExecutionStatus(nodeId, "running"),
    (nodeId, result) => {
      setNodeExecutionStatus(nodeId, result.status === "success" ? "success" : "error")
      const node = nodes.find((n) => n.id === nodeId)

      if (result.status === "success" && result.output !== null) {
        if (node?.data.type === "llmNode") updateNodeData(nodeId, { result: result.output as string, error: null })
        else if (node?.data.type === "cropImageNode") updateNodeData(nodeId, { result: result.output as string, error: null })
        else if (node?.data.type === "extractFrameNode") updateNodeData(nodeId, { result: result.output as string, error: null })
      } else if (result.status === "failed") {
        updateNodeData(nodeId, { error: result.error })
      }

      nodeRunRecords.push({
        nodeId,
        nodeType: node?.data.type ?? "unknown",
        nodeLabel: (node?.data as { label?: string }).label ?? nodeId,
        status: result.status === "success" ? "success" : "failed",
        inputs: {},
        outputs: result.output ? { result: result.output } : {},
        error: result.error,
        durationMs: result.durationMs,
      })
    }
  )

  const totalDuration = Date.now() - startTime
  const allSuccess = nodeRunRecords.every((node) => node.status === "success")
  const anySuccess = nodeRunRecords.some((node) => node.status === "success")

  addRun({
    id: `run-${Date.now()}`,
    runNumber: useWorkflowStore.getState().runs.length + 1,
    scope: mode,
    status: allSuccess ? "SUCCESS" : anySuccess ? "PARTIAL" : "FAILED",
    durationMs: totalDuration,
    createdAt: new Date(),
    nodeRuns: nodeRunRecords,
  })

  return true
}
