import type { SupabaseClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  if (!user.email_confirmed_at) {
    throw {
      code: "EMAIL_NOT_VERIFIED",
      message: "Email address not verified",
    };
  }

  return user;
}

export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
