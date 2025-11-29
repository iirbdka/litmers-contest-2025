import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ChartSkeletonProps {
  type?: "bar" | "pie" | "line"
}

export function ChartSkeleton({ type = "bar" }: ChartSkeletonProps) {
  if (type === "pie") {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${Math.random() * 60 + 40}%` }} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
