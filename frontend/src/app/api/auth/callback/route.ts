import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Same guard as the browser client: this route must use the publishable
  // key, never sb_secret_*. Misconfiguration would break OAuth code exchange.
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseAnonKey.startsWith("sb_secret_") ||
    supabaseAnonKey.includes("service_role")
  ) {
    console.error(
      "Supabase callback misconfigured: NEXT_PUBLIC_SUPABASE_ANON_KEY must be the publishable key (sb_publishable_...)."
    );
    return NextResponse.redirect(`${origin}/auth`);
  }

  if (code) {
    const pendingCookies: {
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }[] = [];

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              pendingCookies.push({ name, value, options })
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const response = NextResponse.redirect(`${origin}/dashboard`);
      pendingCookies.forEach(({ name, value, options }) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.cookies.set(name, value, options as any)
      );
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth`);
}
