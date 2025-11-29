import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ProjectDetailContent } from "@/components/projects/project-detail-content"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { projectId } = await params
  return {
    title: "프로젝트 - JiraLite",
    description: "프로젝트 상세",
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params

  return (
    <AppLayout>
      <Suspense fallback={<SkeletonCard />}>
        <ProjectDetailContent projectId={projectId} />
      </Suspense>
    </AppLayout>
  )
}
