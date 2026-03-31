import { useWorkflowStore } from "@/store/workflowStore"
import { useStore } from "zustand"

export function useTemporalStore() {
  const { undo, redo, pastStates, futureStates } = useStore(
    useWorkflowStore.temporal
  )
  return { undo, redo, pastStates, futureStates }
}
