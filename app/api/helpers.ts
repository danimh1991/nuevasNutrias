import { env } from "cloudflare:workers";

export class UnauthorizedError extends Error {}
export function ownerId(request: Request) {
  const chatGPTUser = request.headers.get("oai-authenticated-user-id");
  if (chatGPTUser) return chatGPTUser;
  if (!env.APP_SESSION_TOKEN) return "local_seedy";
  const token = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith("nn_access="))?.slice(10);
  if (token !== env.APP_SESSION_TOKEN) throw new UnauthorizedError("Sesión no válida");
  return "cloudflare_owner";
}
export function errorResponse(error: unknown) { if(error instanceof UnauthorizedError)return Response.json({ error: "Acceso protegido." }, { status: 401 }); console.error(error); return Response.json({ error: "No se han podido guardar los cambios. Inténtalo de nuevo." }, { status: 500 }); }
export function validDate(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)); }
