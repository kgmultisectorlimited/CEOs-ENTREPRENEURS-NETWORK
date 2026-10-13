import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const siteUrl = Deno.env.get("SITE_URL")?.replace(/\/+$/, "");

if (!supabaseUrl || !anonKey || !serviceRoleKey || !siteUrl) {
  throw new Error("SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, and SITE_URL are required.");
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
  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function response(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" }
  });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return response({ error: "Method not allowed." }, 405, origin);
  }
  if (origin && !allowedOrigins.has(origin)) {
    return response({ error: "This website is not allowed to send invitations." }, 403, origin);
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response({ error: "Sign in as an administrator to send invitations." }, 401, origin);

  const { data: authResult, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authResult.user) {
    return response({ error: "Administrator session is invalid or expired. Sign in again." }, 401, origin);
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("auth_user_id", authResult.user.id)
    .maybeSingle();
  if (profileError) {
    return response({ error: `Administrator role could not be checked: ${profileError.message}` }, 500, origin);
  }
  if (profile?.role !== "admin") {
    return response({ error: "Administrator access is required to send applicant invitations." }, 403, origin);
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
    .select("id, full_name, email, status, auth_user_id")
    .eq("id", body.applicationId)
    .maybeSingle();
  if (applicationError) {
    return response({ error: `Application could not be checked: ${applicationError.message}` }, 500, origin);
  }
  if (!application || application.status !== "approved") {
    return response({ error: "Only approved applications can receive account invitations." }, 400, origin);
  }
  if (application.auth_user_id) {
    return response({ error: "An account has already been created or invited for this application." }, 409, origin);
  }

  const redirectTo = `${siteUrl}/login.html?account-setup=1`;
  const { data: invitation, error: invitationError } = await adminClient.auth.admin.inviteUserByEmail(
    application.email,
    {
      data: { full_name: application.full_name },
      redirectTo
    }
  );
  if (invitationError) {
    return response({ error: `Supabase Auth could not send the invitation: ${invitationError.message}` }, 502, origin);
  }
  if (!invitation.user) {
    return response({ error: "Supabase Auth did not return an invited account." }, 502, origin);
  }

  return response({
    message: `Account invitation sent to ${application.email}. The applicant must open the email link and set a password before signing in.`
  }, 200, origin);
});
