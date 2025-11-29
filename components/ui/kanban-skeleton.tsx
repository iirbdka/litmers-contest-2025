import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface KanbanSkeletonProps {
  columns?: number
  cardsPerColumn?: number
}

export function KanbanSkeleton({ columns = 3, cardsPerColumn = 3 }: KanbanSkeletonProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <div key={colIndex} className="w-80 flex-shrink-0">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
                <Card key={cardIndex} className="p-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3 mb-3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
