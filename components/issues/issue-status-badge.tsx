import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
  Backlog: { label: "Backlog", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  "In Progress": { label: "In Progress", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  Review: { label: "Review", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  Testing: { label: "Testing", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  Done: { label: "Done", className: "bg-green-100 text-green-800 hover:bg-green-100" },
}

interface IssueStatusBadgeProps {
  status: string
  size?: "sm" | "default"
}

export function IssueStatusBadge({ status, size = "default" }: IssueStatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" }

  return (
    <Badge variant="secondary" className={cn(config.className, size === "sm" && "text-xs px-1.5 py-0")}>
      {config.label}
    </Badge>
  )
}
