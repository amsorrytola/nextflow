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
        "text-[10px] text-[#6b7280] absolute top-1/2 -translate-y-1/2 pointer-events-none",
        side === "left" ? "left-4" : "right-4",
        connected && "text-[#a855f7]"
      )}
    >
      {label}
      {required && <span className="text-[#ef4444] ml-0.5">*</span>}
    </span>
  )
}
