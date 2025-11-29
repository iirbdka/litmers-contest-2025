import { ArrowUp, ArrowRight, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PriorityType } from "@/src/schemas/common"

const priorityConfig: Record<PriorityType, { icon: typeof ArrowUp; className: string; label: string }> = {
  HIGH: { icon: ArrowUp, className: "text-red-500", label: "높음" },
  MEDIUM: { icon: ArrowRight, className: "text-yellow-500", label: "보통" },
  LOW: { icon: ArrowDown, className: "text-green-500", label: "낮음" },
}

interface PriorityBadgeProps {
  priority: PriorityType
  size?: "sm" | "default"
  showLabel?: boolean
}

export function PriorityBadge({ priority, size = "default", showLabel = false }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-1", config.className)}>
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {showLabel && <span className={cn(size === "sm" ? "text-xs" : "text-sm")}>{config.label}</span>}
    </div>
  )
}
