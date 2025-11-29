import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { IssueDetailContent } from "@/components/issues/issue-detail-content"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface IssueDetailPageProps {
  params: Promise<{ issueId: string }>
}

export async function generateMetadata({ params }: IssueDetailPageProps) {
  const { issueId } = await params
  return {
    title: "이슈 - JiraLite",
    description: "이슈 상세",
  }
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { issueId } = await params

  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="p-6">
            <SkeletonCard />
          </div>
        }
      >
        <IssueDetailContent issueId={issueId} />
      </Suspense>
    </AppLayout>
  )
}
