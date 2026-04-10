"use server"

import { tasks } from "@trigger.dev/sdk/v3"
import { auth } from "@clerk/nextjs/server"
import type { OrchestrateWorkflowPayload } from "@/trigger/orchestrateWorkflowTask"

export type TriggerWorkflowResult =
  | { ok: true; runId: string; accessToken: string }
  | { ok: false; error: string }

/**
 * Triggers the server-side orchestrator task.
 * Returns immediately with the Trigger.dev run ID.
 * The client subscribes to real-time status via useRealtimeRun.
 */
export async function triggerWorkflow(
  payload: OrchestrateWorkflowPayload
): Promise<TriggerWorkflowResult> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: "Unauthorized" }

  try {
    const handle = await tasks.trigger("orchestrate-workflow", {
      ...payload,
      transloaditKey: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY ?? "",
      transloaditSecret: process.env.TRANSLOADIT_SECRET ?? "",
      transloaditImageTemplateId: process.env.NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID ?? "",
      transloaditVideoTemplateId: process.env.NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID ?? "",
    } satisfies OrchestrateWorkflowPayload)

    return { ok: true, runId: handle.id, accessToken: handle.publicAccessToken }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to trigger workflow"
    return { ok: false, error: msg }
  }
}

/**
 * Persists a completed workflow run to PostgreSQL.
 * Called by the client after useRealtimeRun reports completion.
 */
export async function persistWorkflowRun(
  workflowId: string,
  runData: {
    scope: "FULL" | "PARTIAL" | "SINGLE"
    status: "SUCCESS" | "FAILED" | "PARTIAL"
    durationMs: number
    nodeRuns: {
      nodeId: string
      nodeType: string
      nodeLabel: string
      status: "success" | "failed" | "running" | "skipped"
      inputs: Record<string, unknown>
      outputs: Record<string, unknown>
      error: string | null
      durationMs: number
    }[]
  }
): Promise<{ ok: boolean; runId?: string; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: "Unauthorized" }

  if (!workflowId || workflowId === "sample" || workflowId === "default" || workflowId === "new") {
    return { ok: true }
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const res = await fetch(`${appUrl}/api/workflows/${workflowId}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scope: runData.scope,
        status: runData.status,
        durationMs: runData.durationMs,
        nodeRuns: runData.nodeRuns.map((nr) => ({
          ...nr,
          status: nr.status === "success" ? "SUCCESS"
                : nr.status === "failed"  ? "FAILED"
                : nr.status === "running" ? "RUNNING"
                : "SKIPPED",
        })),
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { ok: false, error: JSON.stringify(body) }
    }
    const data = await res.json()
    return { ok: true, runId: data.id }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "persist failed" }
  }
}
