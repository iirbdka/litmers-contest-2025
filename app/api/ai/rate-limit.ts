import { SupabaseClient } from "@supabase/supabase-js"
import { LIMITS } from "@/src/schemas/validators"
import type { Database } from "@/types/supabase"

export async function checkAIRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const now = new Date()

  // Get or create rate limit record
  const { data: rateLimit, error } = await supabase
    .from("ai_rate_limits")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw error
  }

  if (!rateLimit) {
    // Create new rate limit record
    await supabase.from("ai_rate_limits").insert({
      user_id: userId,
      request_count: 1,
      window_start: now.toISOString(),
      daily_count: 1,
      daily_reset: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    })
    return { allowed: true }
  }

  const windowStart = new Date(rateLimit.window_start)
  const dailyReset = new Date(rateLimit.daily_reset)
  const minuteElapsed = (now.getTime() - windowStart.getTime()) / 1000 / 60

  // Reset daily counter if day has passed
  let dailyCount = rateLimit.daily_count
  let newDailyReset = dailyReset.toISOString()
  if (now >= dailyReset) {
    dailyCount = 0
    newDailyReset = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }

  // Check daily limit
  if (dailyCount >= LIMITS.AI_RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      reason: `Daily limit of ${LIMITS.AI_RATE_LIMIT_PER_DAY} AI requests reached. Resets at midnight.`,
    }
  }

  // Reset minute counter if minute has passed
  let requestCount = rateLimit.request_count
  let newWindowStart = windowStart.toISOString()
  if (minuteElapsed >= 1) {
    requestCount = 0
    newWindowStart = now.toISOString()
  }

  // Check per-minute limit
  if (requestCount >= LIMITS.AI_RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit of ${LIMITS.AI_RATE_LIMIT_PER_MINUTE} requests per minute exceeded. Please wait.`,
    }
  }

  // Update counters
  await supabase
    .from("ai_rate_limits")
    .update({
      request_count: requestCount + 1,
      window_start: newWindowStart,
      daily_count: dailyCount + 1,
      daily_reset: newDailyReset,
    })
    .eq("user_id", userId)

  return { allowed: true }
}

