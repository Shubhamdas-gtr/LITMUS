import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Never allow a secret/service-role key in the browser bundle. Supabase
// rejects sb_secret_* keys from browsers (User-Agent check) with 401
// "forbidden use of secret api key". Fail fast with an actionable message
// instead of a cryptic auth failure on sign-in.
if (
  supabaseAnonKey.startsWith("sb_secret_") ||
  supabaseAnonKey.includes("service_role")
) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY must be the publishable key (sb_publishable_...), not a secret key. " +
      "Check the Vercel env vars for litmus-chi-ecru — the secret key belongs only on the Render backend as SUPABASE_SECRET_KEY."
  );
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
);