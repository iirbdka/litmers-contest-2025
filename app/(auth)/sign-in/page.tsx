import { Suspense } from "react"
import { SignInForm } from "@/components/auth/sign-in-form"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "로그인 - JiraLite",
  description: "JiraLite에 로그인하세요",
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full max-w-md" />}>
      <SignInForm />
    </Suspense>
  )
}
