import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };

  let suscripciones = null;
  let errorSupabase = null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase.from("push_subscriptions").select("id, created_at");
    if (error) errorSupabase = error.message;
    suscripciones = data;
  } catch (e) {
    errorSupabase = e.message;
  }

  return Response.json({
    variables_de_entorno: env,
    total_suscripciones: suscripciones?.length ?? null,
    suscripciones,
    error_supabase: errorSupabase,
  });
}
