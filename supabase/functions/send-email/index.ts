// Supabase Edge Function for sending emails using SMTP
// Deploy with: supabase functions deploy send-email

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const SMTP_HOST = Deno.env.get("SMTP_HOST") || ""
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587")
const SMTP_USER = Deno.env.get("SMTP_USER") || ""
const SMTP_PASS = Deno.env.get("SMTP_PASS") || ""
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@yourdomain.com"
const FROM_NAME = Deno.env.get("FROM_NAME") || "JiraLite"

interface EmailRequest {
  type: "team_invite" | "password_reset" | "due_date_reminder"
  to: string
  data: Record<string, string>
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { type, to, data } = (await req.json()) as EmailRequest

    let subject: string
    let html: string

    switch (type) {
      case "team_invite":
        subject = `[JiraLite] ${data.teamName} 팀에 초대되었습니다`
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">팀 초대</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  안녕하세요!<br><br>
                  <strong>${data.inviterName}</strong>님이 <strong style="color: #667eea;">${data.teamName}</strong> 팀에 초대했습니다.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.inviteUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                            font-weight: 600; font-size: 16px;">
                    초대 수락하기
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  이 초대는 <strong>7일 후</strong>에 만료됩니다.<br>
                  초대를 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
                </p>
              </div>
              <div style="background: #f9f9f9; padding: 16px 32px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © JiraLite - 프로젝트 관리 도구
                </p>
              </div>
            </div>
          </body>
          </html>
        `
        break

      case "password_reset":
        subject = "[JiraLite] 비밀번호 재설정"
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">비밀번호 재설정</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  비밀번호 재설정을 요청하셨습니다.<br>
                  아래 버튼을 클릭하여 새 비밀번호를 설정하세요.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.resetUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                            font-weight: 600; font-size: 16px;">
                    비밀번호 재설정
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  이 링크는 <strong>1시간 후</strong>에 만료됩니다.<br>
                  비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.
                </p>
              </div>
              <div style="background: #f9f9f9; padding: 16px 32px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © JiraLite - 프로젝트 관리 도구
                </p>
              </div>
            </div>
          </body>
          </html>
        `
        break

      case "due_date_reminder":
        subject = `[JiraLite] 마감일 알림: ${data.issueTitle}`
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">⏰ 마감일 알림</h1>
              </div>
              <div style="padding: 32px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  다음 이슈의 마감일이 다가왔습니다:
                </p>
                <div style="background: #f9f9f9; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; font-weight: 600; color: #333;">${data.issueTitle}</p>
                  <p style="margin: 8px 0 0; color: #666; font-size: 14px;">마감일: ${data.dueDate}</p>
                </div>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${data.issueUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                            color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; 
                            font-weight: 600; font-size: 16px;">
                    이슈 확인하기
                  </a>
                </div>
              </div>
              <div style="background: #f9f9f9; padding: 16px 32px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © JiraLite - 프로젝트 관리 도구
                </p>
              </div>
            </div>
          </body>
          </html>
        `
        break

      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    // Check if SMTP is configured
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.log("SMTP not configured, skipping email send")
      console.log("Email would be sent to:", to)
      console.log("Subject:", subject)
      return new Response(
        JSON.stringify({ success: true, message: "SMTP not configured, email logged" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: {
          username: SMTP_USER,
          password: SMTP_PASS,
        },
      },
    })

    // Send email
    await client.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: to,
      subject: subject,
      content: "auto",
      html: html,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Email error:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
