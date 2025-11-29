import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@resend.dev"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface SendInviteEmailParams {
  to: string
  teamName: string
  inviterName: string
  inviteId: string
}

export async function sendTeamInviteEmail({
  to,
  teamName,
  inviterName,
  inviteId,
}: SendInviteEmailParams) {
  const inviteUrl = `${APP_URL}/invites/${inviteId}/accept`

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `[JiraLite] ${inviterName}님이 ${teamName} 팀에 초대했습니다`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>팀 초대</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">JiraLite</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">팀 초대</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              안녕하세요!<br><br>
              <strong>${inviterName}</strong>님이 <strong>${teamName}</strong> 팀에 참여하도록 초대했습니다.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                초대 수락하기
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              이 초대는 7일간 유효합니다.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
              이 이메일은 JiraLite에서 발송되었습니다.<br>
              초대를 요청하지 않았다면 이 이메일을 무시해주세요.
            </p>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error("Failed to send invite email:", error)
    throw error
  }

  return data
}

interface SendPasswordResetEmailParams {
  to: string
  resetToken: string
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "[JiraLite] 비밀번호 재설정",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>비밀번호 재설정</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">JiraLite</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">비밀번호 재설정</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              비밀번호 재설정을 요청하셨습니다.<br>
              아래 버튼을 클릭하여 새 비밀번호를 설정하세요.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                비밀번호 재설정
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              이 링크는 1시간 동안 유효합니다.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
              비밀번호 재설정을 요청하지 않았다면 이 이메일을 무시해주세요.
            </p>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error("Failed to send password reset email:", error)
    throw error
  }

  return data
}

