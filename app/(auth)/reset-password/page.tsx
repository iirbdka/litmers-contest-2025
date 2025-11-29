import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata = {
  title: "비밀번호 재설정 - JiraLite",
  description: "새 비밀번호를 설정하세요",
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
