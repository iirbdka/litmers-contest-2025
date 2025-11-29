import { z } from "zod"
import { Id, SoftDelete } from "./common"

// 사용자 (FR-001, FR-005)
export const User = z
  .object({
    id: Id,
    email: z.string().email().max(255),
    name: z.string().min(1).max(50),
    profileImage: z.string().url().nullable(),
    provider: z.enum(["email", "google"]).default("email"),
    createdAt: z.string().datetime({ offset: true }),
  })
  .merge(SoftDelete)

export type UserType = z.infer<typeof User>

// 로그인 폼 (FR-002)
export const LoginForm = z.object({
  email: z.string().email("유효한 이메일을 입력하세요").max(255),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").max(100),
})

export type LoginFormType = z.infer<typeof LoginForm>

// 회원가입 폼 (FR-001)
export const SignUpForm = z.object({
  email: z.string().email("유효한 이메일을 입력하세요").max(255),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").max(100),
  name: z.string().min(1, "이름을 입력하세요").max(50),
})

export type SignUpFormType = z.infer<typeof SignUpForm>

// 비밀번호 찾기 폼 (FR-003)
export const ForgotPasswordForm = z.object({
  email: z.string().email("유효한 이메일을 입력하세요").max(255),
})

export type ForgotPasswordFormType = z.infer<typeof ForgotPasswordForm>

// 비밀번호 재설정 폼 (FR-003)
export const ResetPasswordForm = z
  .object({
    password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormType = z.infer<typeof ResetPasswordForm>

// 비밀번호 변경 폼 (FR-006)
export const ChangePasswordForm = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요"),
    newPassword: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다").max(100),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  })

export type ChangePasswordFormType = z.infer<typeof ChangePasswordForm>

// 프로필 수정 폼 (FR-005)
export const ProfileUpdateForm = z.object({
  name: z.string().min(1, "이름을 입력하세요").max(50),
  profileImage: z.string().url().nullable().optional(),
})

export type ProfileUpdateFormType = z.infer<typeof ProfileUpdateForm>
