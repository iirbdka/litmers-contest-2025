import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata = {
  title: "비밀번호 찾기 - JiraLite",
  description: "비밀번호를 재설정하세요",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
