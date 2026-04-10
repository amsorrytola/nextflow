import { task, logger, metadata, tasks, runs } from "@trigger.dev/sdk/v3"
import type { DeserializedJson } from "@trigger.dev/core"
import { z } from "zod"
import { cropImageTask } from "./cropImageTask"
import { extractFrameTask } from "./extractFrameTask"
import { llmTask } from "./llmTask"

// ── Payload schemas ─────────────────────────────────────────────────────────

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
})

const NodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
})

const inputSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  mode: z.enum(["FULL", "PARTIAL", "SINGLE"]),
  selectedNodeIds: z.array(z.string()).default([]),
  transloaditKey: z.string().optional(),
  transloaditSecret: z.string().optional(),
  transloaditImageTemplateId: z.string().optional(),
  transloaditVideoTemplateId: z.string().optional(),
})

export type OrchestrateWorkflowPayload = z.infer<typeof inputSchema>
export type NodeResult = {
  nodeId: string
  status: "success" | "failed"
  output: unknown
  error: string | null
  durationMs: number
}

type RealtimeNodeState = {
  status: "running" | "success" | "error"
  output?: unknown
  error?: string | null
  durationMs?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ── Adjacency / BFS helpers for server-side orchestration ───────────────────

function buildAdjacency(
  nodeIds: string[],
  edges: z.infer<typeof EdgeSchema>[]
) {
  const inDegree: Record<string, number> = {}
  const dependents: Record<string, string[]> = {}

  for (const id of nodeIds) {
    inDegree[id] = 0
    dependents[id] = []
  }

  for (const edge of edges) {
    if (!nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)) continue
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
    dependents[edge.source]?.push(edge.target)
  }

  return { inDegree, dependents }
}

function buildLevels(
  nodeIds: string[],
  edges: z.infer<typeof EdgeSchema>[]
): string[][] {
  const { inDegree, dependents } = buildAdjacency(nodeIds, edges)
  const tempDeg = { ...inDegree }
  const levels: string[][] = []
  let current = nodeIds.filter((id) => (tempDeg[id] ?? 0) === 0)

  while (current.length > 0) {
    levels.push(current)
    const next: string[] = []
    for (const id of current) {
      for (const dep of dependents[id] ?? []) {
        tempDeg[dep] = (tempDeg[dep] ?? 1) - 1
        if (tempDeg[dep] === 0) next.push(dep)
      }
    }
    current = next
  }
  return levels
}

function resolveInputs(
  nodeId: string,
  edges: z.infer<typeof EdgeSchema>[],
  nodeOutputs: Record<string, unknown>
): Record<string, unknown> {
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
  return inputs
}

// ── Main orchestrator task ───────────────────────────────────────────────────

export const orchestrateWorkflowTask = task({
  id: "orchestrate-workflow",
  maxDuration: 600,

  run: async (payload: OrchestrateWorkflowPayload) => {
    const parsed = inputSchema.parse(payload)
    const { nodes, edges, mode, selectedNodeIds } = parsed

    // Determine which nodes to execute
    let targetIds: string[]
    if (mode === "FULL") targetIds = nodes.map((n) => n.id)
    else if (mode === "SINGLE") targetIds = selectedNodeIds.slice(0, 1)
    else targetIds = selectedNodeIds

    const levels = buildLevels(targetIds, edges)
    const nodeOutputs: Record<string, unknown> = {}
    const results: NodeResult[] = []
    const realtimeNodeStates: Record<string, RealtimeNodeState> = Object.fromEntries(
      targetIds.map((nodeId) => [nodeId, { status: "running" } satisfies RealtimeNodeState])
    )

    const publishRealtimeState = async () => {
      metadata.set("mode", mode)
      metadata.set("nodeStates", realtimeNodeStates as unknown as DeserializedJson)
      await metadata.flush()
    }

    logger.info("Starting workflow orchestration", {
      mode,
      totalNodes: targetIds.length,
      levels: levels.length,
    })
    await publishRealtimeState()

    for (const level of levels) {
      logger.info(`Executing level with ${level.length} node(s)`, { nodeIds: level })

      // Collect batch items for all nodes in this level
      const batchItems = level.map((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId)!
        const inputs = resolveInputs(nodeId, edges, nodeOutputs)
        const nodeType = node.data.type as string
        const nodeData = node.data

        // Build per-task payload based on node type
        if (nodeType === "textNode") {
          // text nodes are trivial — no external task needed, handled inline below
          return null
        }
        if (nodeType === "uploadImageNode") return null
        if (nodeType === "uploadVideoNode") return null

        if (nodeType === "llmNode") {
          const rawImages = inputs["images"]
          const imageUrls: string[] = Array.isArray(rawImages)
            ? rawImages.filter((u): u is string => typeof u === "string" && u.length > 0)
            : typeof rawImages === "string" && rawImages.length > 0 ? [rawImages] : []

          const userMessage =
            typeof inputs["user_message"] === "string" ? inputs["user_message"] :
            typeof inputs["prompt"] === "string" ? inputs["prompt"] :
            typeof nodeData["userMessage"] === "string" ? nodeData["userMessage"] : ""

          const systemPrompt =
            typeof inputs["system_prompt"] === "string" ? inputs["system_prompt"] :
            typeof nodeData["systemPrompt"] === "string" ? nodeData["systemPrompt"] : ""

          return {
            nodeId,
            taskId: llmTask.id,
            payload: {
              model: (nodeData["model"] as string) ?? "gemini-2.5-flash",
              systemPrompt,
              userMessage,
              imageUrls,
            },
          }
        }

        if (nodeType === "cropImageNode") {
          const imageUrl =
            typeof inputs["image_url"] === "string" ? inputs["image_url"] :
            typeof inputs["outputImage"] === "string" ? inputs["outputImage"] : ""

          return {
            nodeId,
            taskId: cropImageTask.id,
            payload: {
              imageUrl,
              xPercent: Number(inputs["x_percent"] ?? nodeData["xPercent"] ?? 0),
              yPercent: Number(inputs["y_percent"] ?? nodeData["yPercent"] ?? 0),
              widthPercent: Number(inputs["width_percent"] ?? nodeData["widthPercent"] ?? 100),
              heightPercent: Number(inputs["height_percent"] ?? nodeData["heightPercent"] ?? 100),
              transloaditKey: parsed.transloaditKey ?? process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "",
              transloaditSecret: parsed.transloaditSecret ?? process.env.TRANSLOADIT_SECRET ?? "",
              transloaditTemplateId: parsed.transloaditImageTemplateId ?? process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID ?? "",
            },
          }
        }

        if (nodeType === "extractFrameNode") {
          const videoUrl =
            typeof inputs["video_url"] === "string" ? inputs["video_url"] :
            typeof inputs["outputVideo"] === "string" ? inputs["outputVideo"] : ""

          return {
            nodeId,
            taskId: extractFrameTask.id,
            payload: {
              videoUrl,
              timestamp: (inputs["timestamp"] as string) ?? (nodeData["timestamp"] as string) ?? "0",
              transloaditKey: parsed.transloaditKey ?? process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "",
              transloaditSecret: parsed.transloaditSecret ?? process.env.TRANSLOADIT_SECRET ?? "",
              transloaditTemplateId: parsed.transloaditImageTemplateId ?? process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID ?? "",
            },
          }
        }

        return null
      })

      // Split into inline (no task) and batch (needs trigger.dev task)
      const inlineNodeIds = level.filter((_, i) => batchItems[i] === null)
      const batchTasks = batchItems.filter(
        (item): item is NonNullable<typeof item> => item !== null
      )

      // Execute inline nodes (text / upload — they just return their stored value)
      for (const nodeId of inlineNodeIds) {
        const node = nodes.find((n) => n.id === nodeId)!
        const nodeType = node.data.type as string
        const start = Date.now()
        let output: unknown = null

        if (nodeType === "textNode") output = node.data["text"] ?? ""
        else if (nodeType === "uploadImageNode") output = node.data["imageUrl"] ?? null
        else if (nodeType === "uploadVideoNode") output = node.data["videoUrl"] ?? null

        nodeOutputs[nodeId] = output
        const durationMs = Date.now() - start
        results.push({ nodeId, status: "success", output, error: null, durationMs })
        realtimeNodeStates[nodeId] = { status: "success", output, error: null, durationMs }
        await publishRealtimeState()
        logger.info(`Inline node complete`, { nodeId, nodeType })
      }

      // Execute batch nodes in parallel and publish each completion immediately.
      // We can't use Promise.all(tasks.triggerAndWait(...)) because Trigger.dev forbids concurrent waits.
      if (batchTasks.length > 0) {
        logger.info(`Batch triggering ${batchTasks.length} task(s)`)
        const triggeredTasks = await Promise.all(
          batchTasks.map(async (batchTask) => {
            const handle = await tasks.trigger(batchTask.taskId, batchTask.payload)
            return {
              ...batchTask,
              runId: handle.id,
              startedAt: Date.now(),
            }
          })
        )

        const pendingTasks = new Map(triggeredTasks.map((task) => [task.nodeId, task]))

        while (pendingTasks.size > 0) {
          const runSnapshots = await Promise.all(
            Array.from(pendingTasks.values()).map(async (pendingTask) => ({
              pendingTask,
              run: await runs.retrieve(pendingTask.runId),
            }))
          )

          let didCompleteAnyTask = false

          for (const { pendingTask, run } of runSnapshots) {
            if (!run.isCompleted) continue

            didCompleteAnyTask = true
            pendingTasks.delete(pendingTask.nodeId)
            const durationMs = Date.now() - pendingTask.startedAt

            if (run.isSuccess) {
              const taskOutput = (run.output as Record<string, unknown> | null) ?? null
              let output: unknown = null
              if (taskOutput?.output !== undefined) output = taskOutput.output
              else if (taskOutput?.outputUrl !== undefined) output = taskOutput.outputUrl

              nodeOutputs[pendingTask.nodeId] = output
              results.push({ nodeId: pendingTask.nodeId, status: "success", output, error: null, durationMs })
              realtimeNodeStates[pendingTask.nodeId] = { status: "success", output, error: null, durationMs }
              await publishRealtimeState()
              logger.info(`Batch task succeeded`, { nodeId: pendingTask.nodeId, taskId: run.id })
              continue
            }

            const errorMessage =
              typeof run.error?.message === "string" && run.error.message.length > 0
                ? run.error.message
                : "Task failed"

            results.push({ nodeId: pendingTask.nodeId, status: "failed", output: null, error: errorMessage, durationMs })
            realtimeNodeStates[pendingTask.nodeId] = { status: "error", output: null, error: errorMessage, durationMs }
            await publishRealtimeState()
            logger.error(`Batch task failed`, { nodeId: pendingTask.nodeId, taskId: run.id, error: errorMessage })
          }

          if (pendingTasks.size > 0 && !didCompleteAnyTask) {
            await sleep(600)
          }
        }
      }
    }

    await publishRealtimeState()
    logger.info("Workflow orchestration complete", { totalResults: results.length })
    return { results, nodeOutputs }
  },
})
