import { z } from "zod"

const jsonArray = z.array(z.record(z.string(), z.unknown())).default([])
const jsonObject = z.record(z.string(), z.unknown()).default({})

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100).default("Untitled Workflow"),
  description: z.string().max(500).optional(),
  nodes: jsonArray,
  edges: jsonArray,
})

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  nodes: z.array(z.record(z.string(), z.unknown())).optional(),
  edges: z.array(z.record(z.string(), z.unknown())).optional(),
})

export const createRunSchema = z.object({
  scope: z.enum(["FULL", "PARTIAL", "SINGLE"]),
  status: z.enum(["RUNNING", "SUCCESS", "FAILED", "PARTIAL"]),
  durationMs: z.number().int().min(0),
  nodeRuns: z.array(z.object({
    nodeId: z.string(),
    nodeType: z.string(),
    nodeLabel: z.string(),
    status: z.enum(["RUNNING", "SUCCESS", "FAILED", "SKIPPED"]),
    inputs: jsonObject,
    outputs: jsonObject,
    error: z.string().nullable().optional(),
    durationMs: z.number().int().min(0),
  })),
})

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>
export type CreateRunInput = z.infer<typeof createRunSchema>
