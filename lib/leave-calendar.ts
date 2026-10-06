export type LeaveCounting = "calendar" | "workdays";
export type LeavePeriod = { id: string; label: string; person: string; days: number; counting: LeaveCounting };
export type LeaveHoliday = { date: string; label: string };
export type LeavePlan = { childId: string; periods: LeavePeriod[]; holidays: LeaveHoliday[]; updatedAt?: string };
export type ScheduledLeavePeriod = LeavePeriod & { startDate: string; endDate: string };

export const defaultLeavePeriods = (): LeavePeriod[] => [
  { id: crypto.randomUUID(), label: "Permiso común", days: 42, counting: "calendar", person: "Ambos" },
  { id: crypto.randomUUID(), label: "Permiso progenitor 1", days: 91, counting: "calendar", person: "Persona 1" },
  { id: crypto.randomUUID(), label: "Lactancia progenitor 1", days: 15, counting: "workdays", person: "Persona 1" },
  { id: crypto.randomUUID(), label: "Vacaciones progenitor 1", days: 19, counting: "workdays", person: "Persona 1" },
  { id: crypto.randomUUID(), label: "Vacaciones comunes", days: 5, counting: "workdays", person: "Ambos" },
  { id: crypto.randomUUID(), label: "Vacaciones progenitor 2", days: 8, counting: "workdays", person: "Persona 2" },
  { id: crypto.randomUUID(), label: "Permiso progenitor 2", days: 140, counting: "calendar", person: "Persona 2" },
];

export const madridHolidays: LeaveHoliday[] = [
  { date: "2026-01-01", label: "Año Nuevo" }, { date: "2026-01-06", label: "Reyes" },
  { date: "2026-04-02", label: "Jueves Santo" }, { date: "2026-04-03", label: "Viernes Santo" },
  { date: "2026-05-01", label: "Fiesta del Trabajo" }, { date: "2026-05-02", label: "Comunidad de Madrid" },
  { date: "2026-05-15", label: "San Isidro" }, { date: "2026-08-15", label: "Asunción" },
  { date: "2026-10-12", label: "Fiesta Nacional" }, { date: "2026-11-02", label: "Todos los Santos (traslado)" },
  { date: "2026-11-09", label: "La Almudena" }, { date: "2026-12-07", label: "Constitución (traslado)" },
  { date: "2026-12-08", label: "Inmaculada Concepción" }, { date: "2026-12-25", label: "Navidad" },
  { date: "2027-01-01", label: "Año Nuevo" }, { date: "2027-01-06", label: "Reyes" },
  { date: "2027-03-19", label: "San José" }, { date: "2027-03-25", label: "Jueves Santo" },
  { date: "2027-03-26", label: "Viernes Santo" }, { date: "2027-05-01", label: "Fiesta del Trabajo" },
  { date: "2027-05-15", label: "San Isidro" }, { date: "2027-08-16", label: "Asunción (traslado)" },
  { date: "2027-10-12", label: "Fiesta Nacional" }, { date: "2027-11-01", label: "Todos los Santos" },
  { date: "2027-11-09", label: "La Almudena" }, { date: "2027-12-06", label: "Constitución" },
  { date: "2027-12-08", label: "Inmaculada Concepción" }, { date: "2027-12-25", label: "Navidad" },
];

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}
export function toIsoDate(date: Date) { return date.toISOString().slice(0, 10); }
export function addDays(value: string, amount: number) { const date = parseIsoDate(value); date.setUTCDate(date.getUTCDate() + amount); return toIsoDate(date); }
export function isWorkday(value: string, holidayDates: Set<string>) { const day = parseIsoDate(value).getUTCDay(); return day !== 0 && day !== 6 && !holidayDates.has(value); }
export function addWorkdaysInclusive(start: string, days: number, holidayDates: Set<string>) {
  let cursor = start, remaining = Math.max(1, Math.trunc(days));
  while (true) { if (isWorkday(cursor, holidayDates) && --remaining === 0) return cursor; cursor = addDays(cursor, 1); }
}
export function calculateLeaveSchedule(anchor: string, periods: LeavePeriod[], holidays: LeaveHoliday[]): ScheduledLeavePeriod[] {
  if (!anchor) return [];
  const holidayDates = new Set(holidays.map(holiday => holiday.date));
  let nextStart = anchor;
  return periods.map(period => {
    const days = Math.max(1, Math.trunc(period.days));
    const endDate = period.counting === "workdays" ? addWorkdaysInclusive(nextStart, days, holidayDates) : addDays(nextStart, days - 1);
    const result = { ...period, days, startDate: nextStart, endDate };
    nextStart = addDays(endDate, 1);
    return result;
  });
}

export function dueDateFromLastPeriod(lastPeriodDate: string) { return lastPeriodDate ? addDays(lastPeriodDate, 280) : ""; }
