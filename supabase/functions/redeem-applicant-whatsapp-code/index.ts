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
    return response({ error: "This website is not allowed to redeem setup codes." }, 403, origin);
  }

  let body: { email?: string; code?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return response({ error: "Enter your application email, WhatsApp code, and password." }, 400, origin);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  const password = String(body.password || "");
  if (!email || !/^\d{8}$/.test(code) || new TextEncoder().encode(password).length < 8 || new TextEncoder().encode(password).length > 72) {
    return response({ error: "Enter your application email, the 8-digit code, and a password of 8 to 72 bytes." }, 400, origin);
  }

  const { data: possibleApplications, error: applicationLookupError } = await adminClient
    .from("applications")
    .select("id, email")
    .ilike("email", email)
    .eq("status", "approved")
    .is("auth_user_id", null)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);
  if (applicationLookupError) {
    return response({ error: "Code verification is temporarily unavailable. Contact the administrator." }, 500, origin);
  }
  const applicationForCode = possibleApplications?.find(
    (application) => application.email.toLowerCase() === email
  );

  const { data: applications, error: verifyError } = await adminClient.rpc("consume_applicant_setup_code", {
    p_application_id: applicationForCode?.id || "00000000-0000-0000-0000-000000000000",
    p_email: email,
    p_code_hash: await hashCode(applicationForCode?.id || "", code)
  });
  if (verifyError) {
    return response({ error: "Code verification is temporarily unavailable. Contact the administrator." }, 500, origin);
  }

  const application = applications?.[0];
  if (!application) {
    return response({ error: "The email or code is incorrect, expired, or already used. Ask the administrator for a new code." }, 400, origin);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: application.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: application.full_name,
      application_id: application.application_id
    }
  });
  if (createError || !created.user) {
    return response({
      error: `Account could not be activated. Ask the administrator to generate a new code and confirm the account does not already exist. ${createError?.message || ""}`.trim()
    }, 502, origin);
  }

  return response({
    message: "Your member account is active. You can now sign in."
  }, 200, origin);
});
