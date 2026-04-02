"use server"

import { tasks, runs } from "@trigger.dev/sdk/v3"
import { auth } from "@clerk/nextjs/server"

export type NodePayload = {
  nodeId: string
  nodeType: string
  nodeData: Record<string, unknown>
  inputs: Record<string, unknown>
}

export type ExecuteResult = {
  nodeId: string
  status: "success" | "failed"
  output: unknown
  error: string | null
  durationMs: number
}

async function waitForRun(runId: string): Promise<{ ok: boolean; output: unknown; error?: string }> {
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const run = await runs.retrieve(runId)
    if (run.status === "COMPLETED") return { ok: true, output: run.output }
    if (["FAILED", "CRASHED", "CANCELED", "TIMED_OUT", "SYSTEM_FAILURE"].includes(run.status)) {
      return { ok: false, output: null, error: `Task ${run.status}` }
    }
  }
  return { ok: false, output: null, error: "Task timed out" }
}

export async function executeNode(payload: NodePayload): Promise<ExecuteResult> {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const start = Date.now()

  try {
    let output: unknown = null
    const d = payload.nodeData
    const inputs = payload.inputs

    if (payload.nodeType === "textNode") {
      output = d["text"] ?? ""
    } else if (payload.nodeType === "uploadImageNode") {
      output = d["imageUrl"] ?? null
    } else if (payload.nodeType === "uploadVideoNode") {
      output = d["videoUrl"] ?? null
    } else if (payload.nodeType === "llmNode") {
      // Collect image URLs — filter nulls
      const rawImages = inputs["images"]
      const imageUrls: string[] = Array.isArray(rawImages)
        ? rawImages.filter((u): u is string => typeof u === "string" && u.length > 0)
        : typeof rawImages === "string" && rawImages.length > 0 ? [rawImages] : []

      // user_message: prefer connected input, fall back to node's own field
      const userMessage = (
        typeof inputs["user_message"] === "string" ? inputs["user_message"] :
        typeof d["userMessage"] === "string" ? d["userMessage"] : ""
      )

      const systemPrompt = (
        typeof inputs["system_prompt"] === "string" ? inputs["system_prompt"] :
        typeof d["systemPrompt"] === "string" ? d["systemPrompt"] : ""
      )

      const handle = await tasks.trigger("llm-task", {
        model: (d["model"] as string) ?? "gemini-2.0-flash",
        systemPrompt,
        userMessage,
        imageUrls,
      })
      const result = await waitForRun(handle.id)
      if (result.ok) output = (result.output as { output: string }).output
      else throw new Error(result.error ?? "LLM task failed")

    } else if (payload.nodeType === "cropImageNode") {
      const imageUrl = typeof inputs["image_url"] === "string" ? inputs["image_url"] : ""
      if (!imageUrl) throw new Error("No image URL connected to crop node")

      const handle = await tasks.trigger("crop-image-task", {
        imageUrl,
        xPercent: Number(inputs["x_percent"] ?? d["xPercent"] ?? 0),
        yPercent: Number(inputs["y_percent"] ?? d["yPercent"] ?? 0),
        widthPercent: Number(inputs["width_percent"] ?? d["widthPercent"] ?? 100),
        heightPercent: Number(inputs["height_percent"] ?? d["heightPercent"] ?? 100),
        transloaditKey: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!,
        transloaditSecret: process.env.TRANSLOADIT_SECRET!,
        transloaditTemplateId: process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID!,
      })
      const result = await waitForRun(handle.id)
      if (result.ok) output = (result.output as { outputUrl: string }).outputUrl
      else throw new Error(result.error ?? "Crop task failed")

    } else if (payload.nodeType === "extractFrameNode") {
      const videoUrl = typeof inputs["video_url"] === "string" ? inputs["video_url"] : ""
      if (!videoUrl) throw new Error("No video URL connected to extract frame node")

      const handle = await tasks.trigger("extract-frame-task", {
        videoUrl,
        timestamp: (inputs["timestamp"] as string) ?? (d["timestamp"] as string) ?? "0",
        transloaditKey: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!,
        transloaditSecret: process.env.TRANSLOADIT_SECRET!,
        transloaditTemplateId: process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID!,
      })
      const result = await waitForRun(handle.id)
      if (result.ok) output = (result.output as { outputUrl: string }).outputUrl
      else throw new Error(result.error ?? "Extract frame task failed")
    }

    await new Promise((r) => setTimeout(r, 100))
    return { nodeId: payload.nodeId, status: "success", output, error: null, durationMs: Date.now() - start }
  } catch (err) {
    return {
      nodeId: payload.nodeId,
      status: "failed",
      output: null,
      error: err instanceof Error ? err.message : "Unknown error",
      durationMs: Date.now() - start,
    }
  }
}
