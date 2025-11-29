import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { CreateProjectContent } from "@/components/projects/create-project-content"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface CreateProjectPageProps {
  searchParams: Promise<{ teamId?: string }>
}

export const metadata = {
  title: "새 프로젝트 - JiraLite",
  description: "새 프로젝트 생성",
}

export default async function CreateProjectPage({ searchParams }: CreateProjectPageProps) {
  const { teamId } = await searchParams

  return (
    <AppLayout>
      <Suspense fallback={<SkeletonCard />}>
        <CreateProjectContent teamId={teamId} />
      </Suspense>
    </AppLayout>
  )
}

