import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { children, leavePlans } from "../../../../db/schema";
import { errorResponse, ownerId, validDate } from "../../helpers";
import { pinGuard } from "../../../pin-auth";

type PeriodInput = { id?: unknown; label?: unknown; person?: unknown; days?: unknown; counting?: unknown };
type HolidayInput = { date?: unknown; label?: unknown };

function parsePlan(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const value = body as { periods?: unknown; holidays?: unknown };
  if (!Array.isArray(value.periods) || !Array.isArray(value.holidays) || value.periods.length < 1 || value.periods.length > 40 || value.holidays.length > 400) return null;
  const periods = value.periods.map(raw => {
    const item = raw as PeriodInput, label = typeof item.label === "string" ? item.label.trim() : "", person = typeof item.person === "string" ? item.person.trim() : "";
    const days = typeof item.days === "number" ? Math.trunc(item.days) : NaN, counting = item.counting;
    if (!label || label.length > 80 || !person || person.length > 60 || !Number.isFinite(days) || days < 1 || days > 730 || !["calendar", "workdays"].includes(String(counting))) return null;
    return { id: typeof item.id === "string" && item.id.length <= 80 ? item.id : crypto.randomUUID(), label, person, days, counting };
  });
  if (periods.some(item => item == null)) return null;
  const seen = new Set<string>();
  const holidays = value.holidays.map(raw => {
    const item = raw as HolidayInput, label = typeof item.label === "string" ? item.label.trim() : "", date = item.date;
    if (!validDate(date) || !label || label.length > 100 || seen.has(date)) return null;
    seen.add(date); return { date, label };
  });
  if (holidays.some(item => item == null)) return null;
  return { periods, holidays };
}

export async function PUT(request: Request, { params }: { params: Promise<{ childId: string }> }) {
  const denied = await pinGuard(request); if (denied) return denied;
  try {
    const { childId } = await params, owner = ownerId(request), parsed = parsePlan(await request.json());
    if (!parsed) return Response.json({ error: "Revisa los conceptos y los festivos." }, { status: 400 });
    const db = getDb(), [child] = await db.select({ id: children.id }).from(children).where(and(eq(children.id, childId), eq(children.ownerId, owner)));
    if (!child) return Response.json({ error: "Perfil no encontrado." }, { status: 404 });
    const values = { childId, ownerId: owner, periodsJson: JSON.stringify(parsed.periods), holidaysJson: JSON.stringify(parsed.holidays), updatedAt: new Date().toISOString() };
    await db.insert(leavePlans).values(values).onConflictDoUpdate({ target: leavePlans.childId, set: { periodsJson: values.periodsJson, holidaysJson: values.holidaysJson, updatedAt: values.updatedAt } });
    return Response.json({ plan: { childId, ...parsed, updatedAt: values.updatedAt } });
  } catch (error) { return errorResponse(error); }
}
