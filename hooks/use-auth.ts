import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { api, fetcher } from "@/lib/api/client"
import { createSupabaseClient } from "@/lib/supabase/client"
import type { UserType, ProfileUpdateFormType } from "@/src/schemas"

// Current user
export function useCurrentUser() {
  return useSWR<UserType>("/auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
}

// Profile
export function useProfile() {
  return useSWR<UserType>("/profile", fetcher)
}

// Update profile
export function useUpdateProfile() {
  return useSWRMutation(
    "/profile",
    async (url: string, { arg }: { arg: ProfileUpdateFormType }) => {
      return api.patch<UserType>(url, arg)
    }
  )
}

// Logout
export function useLogout() {
  return useSWRMutation("/auth/logout", async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
  })
}

