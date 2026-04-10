/**
 * Thin shim kept for NodeWrapper hover pills ("Run workflow" / "Run node").
 * Real execution is driven by useWorkflowRunner hook in KreaToolbar.
 *
 * We dispatch a custom DOM event that KreaToolbar listens for,
 * so this stays framework-agnostic (no hook calls outside components).
 */
export type ExecutionMode = "FULL" | "PARTIAL" | "SINGLE"

export function runWorkflowMode(mode: ExecutionMode, selectedIds?: string[]) {
  window.dispatchEvent(
    new CustomEvent("nextflow:run", { detail: { mode, selectedIds } })
  )
}

