// Supabase Edge Function for sending emails
// Deploy with: supabase functions deploy send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@yourdomain.com"

interface EmailRequest {
  type: "team_invite" | "password_reset"
  to: string
  data: Record<string, string>
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    })
  }

  try {
    const { type, to, data } = (await req.json()) as EmailRequest

    let subject: string
    let html: string

    switch (type) {
      case "team_invite":
        subject = `${data.teamName} 팀에 초대되었습니다`
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">팀 초대</h1>
            <p>${data.inviterName}님이 <strong>${data.teamName}</strong> 팀에 초대했습니다.</p>
            <p>아래 버튼을 클릭하여 초대를 수락하세요:</p>
            <a href="${data.inviteUrl}" 
               style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 16px 0;">
              초대 수락하기
            </a>
            <p style="color: #666; font-size: 14px;">
              이 초대는 7일 후에 만료됩니다.
            </p>
          </div>
        `
        break

      case "password_reset":
        subject = "비밀번호 재설정"
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">비밀번호 재설정</h1>
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 버튼을 클릭하여 새 비밀번호를 설정하세요:</p>
            <a href="${data.resetUrl}" 
               style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin: 16px 0;">
              비밀번호 재설정
            </a>
            <p style="color: #666; font-size: 14px;">
              이 링크는 1시간 후에 만료됩니다.<br>
              비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
            </p>
          </div>
        `
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Email error:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  }
})

