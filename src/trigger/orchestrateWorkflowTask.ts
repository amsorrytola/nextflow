import { task, batch, metadata, logger } from "@trigger.dev/sdk/v3"
import type { DeserializedJson } from "@trigger.dev/core"
import { z } from "zod"
import { cropImageTask } from "./cropImageTask"
import { extractFrameTask } from "./extractFrameTask"
import { llmTask } from "./llmTask"

// ── Schemas ──────────────────────────────────────────────────────────────────

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

// ── BFS helpers ───────────────────────────────────────────────────────────────

function buildAdjacency(nodeIds: string[], edges: z.infer<typeof EdgeSchema>[]) {
  const inDegree: Record<string, number> = {}
  const dependents: Record<string, string[]> = {}
  for (const id of nodeIds) { inDegree[id] = 0; dependents[id] = [] }
  for (const edge of edges) {
    if (!nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)) continue
    inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
    dependents[edge.source]?.push(edge.target)
  }
  return { inDegree, dependents }
}

function buildLevels(nodeIds: string[], edges: z.infer<typeof EdgeSchema>[]): string[][] {
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

// ── Metadata helper ───────────────────────────────────────────────────────────

async function publishNodeState(
  nodeStates: Record<string, RealtimeNodeState>,
  mode: string
) {
  metadata.set("mode", mode)
  metadata.set("nodeStates", nodeStates as unknown as DeserializedJson)
  await metadata.flush()
}

// ── Build batch items for a level ─────────────────────────────────────────────
// Returns null for inline nodes (text/upload) that don't need a child task.

type BatchItem = {
  nodeId: string
  taskIdentifier: string
  payload: Record<string, unknown>
}

function buildBatchItem(
  nodeId: string,
  nodes: z.infer<typeof NodeSchema>[],
  edges: z.infer<typeof EdgeSchema>[],
  nodeOutputs: Record<string, unknown>,
  parsed: z.infer<typeof inputSchema>
): BatchItem | null {
  const node = nodes.find((n) => n.id === nodeId)!
  const nodeType = node.data.type as string
  const nodeData = node.data
  const inputs = resolveInputs(nodeId, edges, nodeOutputs)

  if (nodeType === "textNode" || nodeType === "uploadImageNode" || nodeType === "uploadVideoNode") {
    return null
  }

  if (nodeType === "llmNode") {
    const rawImages = inputs["images"]
    const imageUrls: string[] = Array.isArray(rawImages)
      ? rawImages.filter((u): u is string => typeof u === "string" && u.length > 0)
      : typeof rawImages === "string" && rawImages.length > 0 ? [rawImages] : []

    const userMessage =
      typeof inputs["user_message"] === "string" ? inputs["user_message"]
      : typeof inputs["prompt"] === "string" ? inputs["prompt"]
      : typeof nodeData["userMessage"] === "string" ? nodeData["userMessage"] : ""

    const systemPrompt =
      typeof inputs["system_prompt"] === "string" ? inputs["system_prompt"]
      : typeof nodeData["systemPrompt"] === "string" ? nodeData["systemPrompt"] : ""

    return {
      nodeId,
      taskIdentifier: llmTask.id,
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
      typeof inputs["image_url"] === "string" ? inputs["image_url"]
      : typeof inputs["outputImage"] === "string" ? inputs["outputImage"] : ""

    return {
      nodeId,
      taskIdentifier: cropImageTask.id,
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
      typeof inputs["video_url"] === "string" ? inputs["video_url"]
      : typeof inputs["outputVideo"] === "string" ? inputs["outputVideo"] : ""

    return {
      nodeId,
      taskIdentifier: extractFrameTask.id,
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
}

// ── Orchestrator task ─────────────────────────────────────────────────────────

export const orchestrateWorkflowTask = task({
  id: "orchestrate-workflow",
  maxDuration: 600,

  run: async (payload: OrchestrateWorkflowPayload) => {
    const parsed = inputSchema.parse(payload)
    const { nodes, edges, mode, selectedNodeIds } = parsed

    let targetIds: string[]
    if (mode === "FULL") targetIds = nodes.map((n) => n.id)
    else if (mode === "SINGLE") targetIds = selectedNodeIds.slice(0, 1)
    else targetIds = selectedNodeIds

    const levels = buildLevels(targetIds, edges)
    const nodeOutputs: Record<string, unknown> = {}
    const results: NodeResult[] = []

    // Initialise all nodes as "running" so the glow appears immediately on the client
    const nodeStates: Record<string, RealtimeNodeState> = Object.fromEntries(
      targetIds.map((id) => [id, { status: "running" } satisfies RealtimeNodeState])
    )
    await publishNodeState(nodeStates, mode)

    logger.info("Orchestration started", { mode, totalNodes: targetIds.length, levels: levels.length })

    for (const level of levels) {
      logger.info(`Level: ${level.length} node(s)`, { nodeIds: level })

      // ── Step A: resolve inline nodes (text / upload) synchronously ────────
      // These have no child task. Resolve them immediately before the batch.
      const inlineNodeIds = level.filter((nodeId) => {
        const node = nodes.find((n) => n.id === nodeId)!
        const t = node.data.type as string
        return t === "textNode" || t === "uploadImageNode" || t === "uploadVideoNode"
      })

      for (const nodeId of inlineNodeIds) {
        const node = nodes.find((n) => n.id === nodeId)!
        const nodeType = node.data.type as string
        const start = Date.now()
        let output: unknown = null
        if (nodeType === "textNode") output = node.data["text"] ?? ""
        else if (nodeType === "uploadImageNode") output = node.data["imageUrl"] ?? null
        else if (nodeType === "uploadVideoNode") output = node.data["videoUrl"] ?? null

        nodeOutputs[nodeId] = output
        results.push({ nodeId, status: "success", output, error: null, durationMs: Date.now() - start })
        nodeStates[nodeId] = { status: "success", output, error: null, durationMs: Date.now() - start }
      }

      // Publish inline completions before triggering child tasks
      if (inlineNodeIds.length > 0) {
        await publishNodeState(nodeStates, mode)
      }

      // ── Step B: batch-trigger all child tasks in this level ───────────────
      // tasks.batchTriggerAndWait is the ONE supported API for parallel waits.
      // It suspends the orchestrator and resumes when ALL items complete.
      // Per-node glow: we iterate results as they come and publish each one.
      const batchItems = level
        .filter((nodeId) => !inlineNodeIds.includes(nodeId))
        .map((nodeId) => buildBatchItem(nodeId, nodes, edges, nodeOutputs, parsed))
        .filter((item): item is BatchItem => item !== null)

      if (batchItems.length === 0) continue

      logger.info(`Batch triggering ${batchItems.length} task(s)`)

      // batchTriggerAndWait accepts items with { taskIdentifier, payload }
      // It returns a BatchResult where .runs is in the same order as the input items
      const batchResult = await batch.triggerAndWait(
        batchItems.map((item) => ({
          id: item.taskIdentifier,
          payload: item.payload,
        }))
      )

      // Process results in order — each one gets its glow updated independently
      for (let i = 0; i < batchResult.runs.length; i++) {
        const run = batchResult.runs[i]
        const item = batchItems[i]
        if (!run || !item) continue

        const start = Date.now()

        if (run.ok) {
          const taskOutput = run.output as Record<string, unknown> | null
          let output: unknown = null
          if (taskOutput?.output !== undefined) output = taskOutput.output         // llm-task
          else if (taskOutput?.outputUrl !== undefined) output = taskOutput.outputUrl  // crop/extract

          nodeOutputs[item.nodeId] = output
          results.push({ nodeId: item.nodeId, status: "success", output, error: null, durationMs: Date.now() - start })
          nodeStates[item.nodeId] = { status: "success", output, error: null, durationMs: Date.now() - start }
          logger.info(`Task succeeded`, { nodeId: item.nodeId })
        } else {
          results.push({ nodeId: item.nodeId, status: "failed", output: null, error: "Task failed", durationMs: Date.now() - start })
          nodeStates[item.nodeId] = { status: "error", output: null, error: "Task failed", durationMs: Date.now() - start }
          logger.error(`Task failed`, { nodeId: item.nodeId })
        }

        // Publish after EACH result so the glow updates per-node, not per-level
        await publishNodeState(nodeStates, mode)
      }
    }

    logger.info("Orchestration complete", { totalResults: results.length })
    return { results, nodeOutputs }
  },
})
