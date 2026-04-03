import { cn } from "@/lib/utils"

interface HandleLabelProps {
  label: string
  side: "left" | "right"
  required?: boolean
  connected?: boolean
}

export function HandleLabel({ label, side, required, connected }: HandleLabelProps) {
  return (
    <span
      className={cn(
        "text-[10px] absolute top-1/2 -translate-y-1/2 pointer-events-none",
        side === "left" ? "left-4" : "right-4"
      )}
      style={{ color: connected ? "#a855f7" : "var(--text-muted)" }}
    >
      {label}
      {required && <span className="ml-0.5" style={{ color: "#ef4444" }}>*</span>}
    </span>
  )
}
