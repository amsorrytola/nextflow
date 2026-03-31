export type RunScope = "FULL" | "PARTIAL" | "SINGLE"
export type RunStatus = "SUCCESS" | "FAILED" | "PARTIAL" | "RUNNING"

export interface NodeRunRecord {
  nodeId: string
  nodeType: string
  nodeLabel: string
  status: "success" | "failed" | "running" | "skipped"
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  error: string | null
  durationMs: number
}

export interface WorkflowRunRecord {
  id: string
  runNumber: number
  scope: RunScope
  status: RunStatus
  durationMs: number
  createdAt: Date
  nodeRuns: NodeRunRecord[]
}
