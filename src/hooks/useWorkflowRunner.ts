"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Edge } from "@xyflow/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { useWorkflowStore } from "@/store/workflowStore"
import { triggerWorkflow, persistWorkflowRun } from "@/app/actions/executeWorkflow"
import type { NodeResult } from "@/trigger/orchestrateWorkflowTask"
import type { AnyNodeData } from "@/types"

type RunMode = "FULL" | "PARTIAL" | "SINGLE"
type RealtimeNodeState = {
  status: "running" | "success" | "error"
  output?: unknown
  error?: string | null
  durationMs?: number
}
type WorkflowRunMetadata = {
  mode?: RunMode
  nodeStates?: Record<string, RealtimeNodeState>
}

function resolvePersistedInputs(
  nodeId: string,
  edges: Edge[],
  nodeOutputs: Record<string, unknown>
): Record<string, unknown> {
  const inputs: Record<string, unknown> = {}

  for (const edge of edges) {
    if (edge.target !== nodeId) continue

    const sourceOutput = nodeOutputs[edge.source]
    const handle = edge.targetHandle ?? ""

    if (handle === "images") {
      const existing = inputs.images
      if (Array.isArray(existing)) existing.push(sourceOutput)
      else inputs.images = [sourceOutput]
      continue
    }

    if (handle) inputs[handle] = sourceOutput
  }

  return inputs
}

function buildNodeRunInputs(nodeData: AnyNodeData, resolvedInputs: Record<string, unknown>) {
  switch (nodeData.type) {
    case "textNode":
      return { text: nodeData.text }
    case "uploadImageNode":
      return { imageUrl: nodeData.imageUrl, fileName: nodeData.fileName }
    case "uploadVideoNode":
      return { videoUrl: nodeData.videoUrl, fileName: nodeData.fileName }
    case "llmNode":
      return {
        model: nodeData.model,
        systemPrompt:
          typeof resolvedInputs.system_prompt === "string"
            ? resolvedInputs.system_prompt
            : nodeData.systemPrompt,
        userMessage:
          typeof resolvedInputs.user_message === "string"
            ? resolvedInputs.user_message
            : typeof resolvedInputs.prompt === "string"
              ? resolvedInputs.prompt
              : nodeData.userMessage,
        imageUrls: Array.isArray(resolvedInputs.images)
          ? resolvedInputs.images
          : resolvedInputs.images != null
            ? [resolvedInputs.images]
            : [],
      }
    case "cropImageNode":
      return {
        imageUrl: resolvedInputs.image_url ?? null,
        xPercent: resolvedInputs.x_percent ?? nodeData.xPercent,
        yPercent: resolvedInputs.y_percent ?? nodeData.yPercent,
        widthPercent: resolvedInputs.width_percent ?? nodeData.widthPercent,
        heightPercent: resolvedInputs.height_percent ?? nodeData.heightPercent,
      }
    case "extractFrameNode":
      return {
        videoUrl: resolvedInputs.video_url ?? null,
        timestamp: resolvedInputs.timestamp ?? nodeData.timestamp,
      }
  }
}

/**
 * Drives workflow execution end-to-end:
 *  1. Calls triggerWorkflow() server action → gets a Trigger.dev run ID
 *  2. Subscribes to that run via useRealtimeRun → drives per-node glow from real task state
 *  3. On completion, persists WorkflowRun + NodeRun rows to PostgreSQL
 *  4. Updates Zustand store (executionStatus, node results, run history)
 */
export function useWorkflowRunner() {
  const [activeRun, setActiveRun] = useState<{ id: string; accessToken: string } | null>(null)
  const [isTriggering, setIsTriggering] = useState(false)
  const appliedNodeStatesRef = useRef<Record<string, string>>({})

  const {
    nodes,
    edges,
    workflowId,
    selectedNodeIds,
    setNodeExecutionStatus,
    updateNodeData,
    resetExecutionStatus,
    addRun,
  } = useWorkflowStore()

  // Subscribe to real Trigger.dev run state
  const { run } = useRealtimeRun(activeRun?.id, {
    enabled: !!activeRun?.id && !!activeRun.accessToken,
    accessToken: activeRun?.accessToken,
    onComplete(completedRun) {
      if (!completedRun) return

      const output = completedRun.output as {
        results: NodeResult[]
        nodeOutputs: Record<string, unknown>
      } | null

      const results: NodeResult[] = output?.results ?? []
      const nodeOutputs = output?.nodeOutputs ?? {}
      const startedAt = completedRun.startedAt ? new Date(completedRun.startedAt).getTime() : Date.now()
      const finishedAt = completedRun.finishedAt ? new Date(completedRun.finishedAt).getTime() : Date.now()
      const durationMs = finishedAt - startedAt

      // Apply results to store
      for (const r of results) {
        setNodeExecutionStatus(r.nodeId, r.status === "success" ? "success" : "error")
        if (r.status === "success" && r.output != null) {
          const node = nodes.find((n) => n.id === r.nodeId)
          if (node?.data.type === "llmNode") updateNodeData(r.nodeId, { result: r.output as string, error: null })
          else if (node?.data.type === "cropImageNode") updateNodeData(r.nodeId, { result: r.output as string, error: null })
          else if (node?.data.type === "extractFrameNode") updateNodeData(r.nodeId, { result: r.output as string, error: null })
        } else if (r.status === "failed") {
          updateNodeData(r.nodeId, { error: r.error })
        }
      }

      const allSuccess = results.every((r) => r.status === "success")
      const anySuccess = results.some((r) => r.status === "success")
      const overallStatus: "SUCCESS" | "FAILED" | "PARTIAL" =
        allSuccess ? "SUCCESS" : anySuccess ? "PARTIAL" : "FAILED"

      const nodeRunRecords = results.map((r) => {
        const node = nodes.find((n) => n.id === r.nodeId)
        const resolvedInputs = resolvePersistedInputs(r.nodeId, edges, nodeOutputs)
        return {
          nodeId: r.nodeId,
          nodeType: node?.data.type ?? "unknown",
          nodeLabel: (node?.data as { label?: string }).label ?? r.nodeId,
          status: r.status,
          inputs: node ? buildNodeRunInputs(node.data, resolvedInputs) : resolvedInputs,
          outputs: r.output != null ? { result: r.output } : {},
          error: r.error,
          durationMs: r.durationMs,
        }
      })

      // Add to in-memory run history
      addRun({
        id: `run-${Date.now()}`,
        runNumber: useWorkflowStore.getState().runs.length + 1,
        scope: completedRun.metadata?.mode as RunMode ?? "FULL",
        status: overallStatus,
        durationMs,
        createdAt: new Date(),
        nodeRuns: nodeRunRecords,
      })

      // Persist to PostgreSQL
      if (workflowId && workflowId !== "sample") {
        persistWorkflowRun(workflowId, {
          scope: completedRun.metadata?.mode as RunMode ?? "FULL",
          status: overallStatus,
          durationMs,
          nodeRuns: nodeRunRecords,
        }).catch(console.error)
      }

      setActiveRun(null)
    },
  })

  useEffect(() => {
    appliedNodeStatesRef.current = {}
  }, [activeRun?.id])

  useEffect(() => {
    const metadata = (run?.metadata as WorkflowRunMetadata | null) ?? null
    const realtimeNodeStates = metadata?.nodeStates ?? {}

    for (const [nodeId, nodeState] of Object.entries(realtimeNodeStates)) {
      const nextFingerprint = JSON.stringify({
        status: nodeState.status,
        output: nodeState.output ?? null,
        error: nodeState.error ?? null,
      })

      if (appliedNodeStatesRef.current[nodeId] === nextFingerprint) continue

      if (nodeState.status === "running") {
        setNodeExecutionStatus(nodeId, "running")
      } else if (nodeState.status === "success") {
        setNodeExecutionStatus(nodeId, "success")
        const node = useWorkflowStore.getState().nodes.find((n) => n.id === nodeId)
        if (node?.data.type === "llmNode") updateNodeData(nodeId, { result: nodeState.output as string, error: null })
        else if (node?.data.type === "cropImageNode") updateNodeData(nodeId, { result: nodeState.output as string, error: null })
        else if (node?.data.type === "extractFrameNode") updateNodeData(nodeId, { result: nodeState.output as string, error: null })
      } else if (nodeState.status === "error") {
        setNodeExecutionStatus(nodeId, "error")
        updateNodeData(nodeId, { error: nodeState.error ?? "Task failed" })
      }

      appliedNodeStatesRef.current[nodeId] = nextFingerprint
    }
  }, [run?.metadata, setNodeExecutionStatus, updateNodeData])

  // Drive per-node glow from real run status metadata
  const realtimeNodeStatuses =
    (((run?.metadata as WorkflowRunMetadata | null)?.nodeStates ?? null) &&
      Object.fromEntries(
        Object.entries((run?.metadata as WorkflowRunMetadata).nodeStates ?? {}).map(([nodeId, nodeState]) => [
          nodeId,
          nodeState.status,
        ])
      )) ?? {}

  const run_ = useCallback(async (mode: RunMode, overrideSelectedIds?: string[]) => {
    const isRunning = Object.values(useWorkflowStore.getState().executionStatus).some((s) => s === "running")
    if (isRunning || isTriggering) return

    setIsTriggering(true)
    resetExecutionStatus()

    // Optimistically mark all target nodes as running
    const targetIds =
      mode === "FULL" ? nodes.map((n) => n.id)
      : mode === "SINGLE" ? (overrideSelectedIds ?? selectedNodeIds).slice(0, 1)
      : (overrideSelectedIds ?? selectedNodeIds)

    for (const id of targetIds) {
      setNodeExecutionStatus(id, "running")
      updateNodeData(id, { error: null })
    }

    try {
      const result = await triggerWorkflow({
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type ?? n.data.type,
          data: n.data as Record<string, unknown>,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? null,
          targetHandle: e.targetHandle ?? null,
        })),
        mode,
        selectedNodeIds: overrideSelectedIds ?? selectedNodeIds,
      })

      if (!result.ok) {
        console.error("Failed to trigger workflow:", result.error)
        for (const id of targetIds) setNodeExecutionStatus(id, "error")
        return
      }

      setActiveRun({ id: result.runId, accessToken: result.accessToken })
    } catch (err) {
      console.error("Trigger error:", err)
      for (const id of targetIds) setNodeExecutionStatus(id, "error")
    } finally {
      setIsTriggering(false)
    }
  }, [nodes, edges, selectedNodeIds, isTriggering, resetExecutionStatus, setNodeExecutionStatus, updateNodeData])

  const isRunning = isTriggering || !!activeRun

  return { run: run_, isRunning, activeRunId: activeRun?.id ?? null, realtimeNodeStatuses }
}
