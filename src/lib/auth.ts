import { createClient } from "./supabase/server";

// Returns the current user (or null), their profile, and whether they are an
// admin. Admin status is stored on the profile row (profiles.is_admin) and is
// the single source of truth for both the UI gate and the database RLS policies.
export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, is_admin")
    .eq("id", user.id)
    .single();

  return { user, profile, isAdmin: Boolean(profile?.is_admin) };
}
