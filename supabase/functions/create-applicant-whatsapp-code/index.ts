import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/+$/, "");

if (!supabaseUrl || !serviceRoleKey || !siteUrl) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SITE_URL are required.");
}

const allowedOrigins = new Set([
  new URL(siteUrl).origin,
  "http://localhost:8080",
  "http://127.0.0.1:8080"
]);

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function response(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" }
  });
}

function generateCode() {
  const limit = Math.floor(0x100000000 / 100000000) * 100000000;
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return String(value[0] % 100000000).padStart(8, "0");
}

async function hashCode(applicationId: string, code: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(serviceRoleKey!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${applicationId}:${code}`)
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return response({ error: "Method not allowed." }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) {
    return response({ error: "This website is not allowed to create setup codes." }, 403, origin);
  }

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response({ error: "Sign in as an administrator to create setup codes." }, 401, origin);

  const { data: authResult, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authResult.user) {
    return response({ error: "Administrator session is invalid or expired. Sign in again." }, 401, origin);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("auth_user_id", authResult.user.id)
    .maybeSingle();
  if (profileError) return response({ error: "Administrator access could not be verified." }, 500, origin);
  if (profile?.role !== "admin") {
    return response({ error: "Administrator access is required to create setup codes." }, 403, origin);
  }

  let body: { applicationId?: string };
  try {
    body = await request.json();
  } catch {
    return response({ error: "A valid application ID is required." }, 400, origin);
  }
  if (!body.applicationId || !/^[0-9a-f-]{36}$/i.test(body.applicationId)) {
    return response({ error: "A valid application ID is required." }, 400, origin);
  }

  const { data: application, error: applicationError } = await adminClient
    .from("applications")
    .select("id, email, status, auth_user_id")
    .eq("id", body.applicationId)
    .maybeSingle();
  if (applicationError) return response({ error: "Application could not be checked." }, 500, origin);
  if (!application || application.status !== "approved") {
    return response({ error: "Only approved applications can receive setup codes." }, 400, origin);
  }
  if (application.auth_user_id) {
    return response({ error: "A member account has already been created for this application." }, 409, origin);
  }

  const { data: recentApplications, error: recentApplicationError } = await adminClient
    .from("applications")
    .select("id, email")
    .ilike("email", application.email)
    .eq("status", "approved")
    .is("auth_user_id", null)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);
  if (recentApplicationError) {
    return response({ error: "Related applications could not be checked." }, 500, origin);
  }
  const selectedApplication = recentApplications?.find(
    (candidate) => candidate.email.toLowerCase() === application.email.toLowerCase()
  );
  if (selectedApplication?.id !== application.id) {
    return response({
      error: "Another approved application uses this email. Generate the code from the most recently updated application."
    }, 409, origin);
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { error: saveError } = await adminClient
    .from("applicant_setup_codes")
    .upsert({
      application_id: application.id,
      code_hash: await hashCode(application.id, code),
      expires_at: expiresAt,
      failed_attempts: 0,
      consumed_at: null,
      created_at: new Date().toISOString()
    }, { onConflict: "application_id" });
  if (saveError) {
    return response({ error: "Setup code could not be saved. Apply the WhatsApp setup-code SQL in Supabase and try again." }, 500, origin);
  }

  return response({
    code,
    expiresAt,
    message: "Send this one-time code to the applicant using WhatsApp. It expires in 15 minutes."
  }, 200, origin);
});
