import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ProfileSettingsContent } from "@/components/settings/profile-settings-content"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export const metadata = {
  title: "프로필 설정 - JiraLite",
  description: "프로필 정보를 수정하세요",
}

export default function ProfileSettingsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<SkeletonCard />}>
        <ProfileSettingsContent />
      </Suspense>
    </AppLayout>
  )
}

