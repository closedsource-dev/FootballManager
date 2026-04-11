import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";
  const type = searchParams.get("type");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session) {
      // If this is an email confirmation (signup verification)
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${origin}/confirm-email`);
      }
      
      // If this is a password recovery session
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
