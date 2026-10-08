// index.ts — entrypoint Edge Function "api" (Supabase).
// Функция смонтирована на .../functions/v1/api, поэтому чистим префикс /api:
// .../functions/v1/api/v1/health -> обработчик видит /v1/health.
import handler from "./handler.js";

function getEnv() {
  const g = (k, d) => {
    try {
      return Deno.env.get(k) ?? d;
    } catch {
      return d;
    }
  };
  return {
    SUPABASE_URL: g("SUPABASE_URL", ""),
    SUPABASE_SERVICE_ROLE_KEY: g("SUPABASE_SERVICE_ROLE_KEY", ""),
    JWT_SECRET: g("JWT_SECRET", "dev-change-me-in-dashboard"),
    CHEAT_API_SECRET: g("CHEAT_API_SECRET", "dev-cheat-secret"),
    CHEAT_CRYPTO_KEY_B64: g("CHEAT_CRYPTO_KEY_B64", ""),
    ADMIN_EMAIL: g("ADMIN_EMAIL", "admin@cheat.com"),
    ADMIN_PASSWORD: g("ADMIN_PASSWORD", "123098"),
    APP_ID: g("APP_ID", "cheat-ios-01"),
  };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api(?=\/|$)/, "") || "/";
  const fixed = new URL(url);
  fixed.pathname = path;
  return handler.fetch(new Request(fixed, req), getEnv(), {});
});
