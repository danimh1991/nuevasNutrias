import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  if (!env.APP_ACCESS_CODE || !env.APP_SESSION_TOKEN) return Response.json({ ok: true });
  const body = await request.json() as { code?: string };
  if (body.code !== env.APP_ACCESS_CODE) return Response.json({ error: "Código incorrecto." }, { status: 401 });
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `nn_access=${env.APP_SESSION_TOKEN}; Path=/nuevasnutrias; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`,
    },
  });
}
