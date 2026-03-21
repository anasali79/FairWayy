import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// NOTE: placeholders allow build to succeed. Runtime will still fail if env vars are missing.
const safeUrl = supabaseUrl ?? "https://example.supabase.co";
const safeServiceRoleKey = serviceRoleKey ?? "missing-service-role-key";

export const supabaseAdmin = createClient(safeUrl, safeServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

