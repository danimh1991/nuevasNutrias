export function ownerId(request: Request) {
  return request.headers.get("oai-authenticated-user-id") ?? "cloudflare_owner";
}
export function errorResponse(error: unknown) { console.error(error); return Response.json({ error: "No se han podido guardar los cambios. Inténtalo de nuevo." }, { status: 500 }); }
export function validDate(value: unknown): value is string { return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)); }
