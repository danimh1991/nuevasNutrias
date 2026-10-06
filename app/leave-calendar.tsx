"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, CircleHelp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateLeaveSchedule, defaultLeavePeriods, madridHolidays, parseIsoDate, toIsoDate, type LeaveHoliday, type LeavePeriod, type LeavePlan } from "@/lib/leave-calendar";

type CalendarChild = { id: string; name: string; birthDate: string; lastPeriodDate?: string | null; expectedBirthDate?: string | null; actualBirthDate?: string | null };
const palette = ["#f3ad9f", "#8fd0c9", "#f7cf76", "#bca7df", "#9fc2df", "#efb4cb", "#b5d59d", "#f2b982"];
const API_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const api = (path: string) => `${API_BASE}${path}`;
const dateText = (date: string) => new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(parseIsoDate(date));

function monthRange(from: string, to: string) {
  const start = parseIsoDate(from), end = parseIsoDate(to), months: Date[] = [];
  start.setUTCDate(1); end.setUTCDate(1);
  while (start <= end && months.length < 18) { months.push(new Date(start)); start.setUTCMonth(start.getUTCMonth() + 1); }
  return months;
}

export default function LeaveCalendar({ child, plan, onSaved }: { child: CalendarChild; plan: LeavePlan | null; onSaved: (plan: LeavePlan) => void }) {
  const [periods, setPeriods] = useState<LeavePeriod[]>([]), [holidays, setHolidays] = useState<LeaveHoliday[]>([]), [saving, setSaving] = useState(false);
  const [holidayDate, setHolidayDate] = useState(""), [holidayLabel, setHolidayLabel] = useState("");
  const [periodsOpen, setPeriodsOpen] = useState(false), [holidaysOpen, setHolidaysOpen] = useState(false);
  useEffect(() => { setPeriods(plan?.periods?.length ? plan.periods : defaultLeavePeriods()); setHolidays(plan?.holidays ?? madridHolidays); }, [child.id, plan]);
  const anchor = child.actualBirthDate || child.expectedBirthDate || child.birthDate;
  const schedule = useMemo(() => calculateLeaveSchedule(anchor, periods, holidays), [anchor, periods, holidays]);
  const finalDate = schedule.at(-1)?.endDate ?? anchor;
  const months = useMemo(() => monthRange(anchor, finalDate), [anchor, finalDate]);
  const colorById = useMemo(() => new Map(periods.map((period, index) => [period.id, palette[index % palette.length]])), [periods]);
  const holidayMap = useMemo(() => new Map(holidays.map(holiday => [holiday.date, holiday.label])), [holidays]);

  function updatePeriod(id: string, patch: Partial<LeavePeriod>) { setPeriods(current => current.map(period => period.id === id ? { ...period, ...patch } : period)); }
  function movePeriod(index: number, direction: -1 | 1) { setPeriods(current => { const next = [...current], target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  function addHoliday() {
    if (!holidayDate || !holidayLabel.trim()) return;
    setHolidays(current => [...current.filter(item => item.date !== holidayDate), { date: holidayDate, label: holidayLabel.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    setHolidayDate(""); setHolidayLabel("");
  }
  async function save() {
    if (!periods.length || periods.some(period => !period.label.trim() || !period.person.trim() || period.days < 1)) { toast.error("Revisa los conceptos, las personas y los días."); return; }
    setSaving(true);
    try {
      const response = await fetch(api(`/api/leave-plans/${child.id}`), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ periods, holidays }) });
      const output = await response.json() as { error?: string; plan: LeavePlan };
      if (!response.ok) throw new Error(output.error);
      onSaved(output.plan); toast.success("Calendario guardado");
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se ha podido guardar el calendario."); }
    finally { setSaving(false); }
  }

  return <div className="mt-6 space-y-6">
    <section className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-3xl border border-[#dfe8ef] bg-white p-5 shadow-sm"><p className="text-xs font-bold tracking-wider text-[#708496]">FECHA DE REFERENCIA</p><strong className="font-display mt-2 block text-2xl">{dateText(anchor)}</strong><p className="mt-1 text-sm text-[#708496]">{child.actualBirthDate ? "Nacimiento real" : "FEP provisional"}</p></article>
      <article className="rounded-3xl border border-[#dfe8ef] bg-white p-5 shadow-sm"><p className="text-xs font-bold tracking-wider text-[#708496]">FIN DEL PLAN</p><strong className="font-display mt-2 block text-2xl">{dateText(finalDate)}</strong><p className="mt-1 text-sm text-[#708496]">Se recalcula al cambiar el nacimiento</p></article>
      <article className="rounded-3xl border border-[#dfe8ef] bg-white p-5 shadow-sm"><p className="text-xs font-bold tracking-wider text-[#708496]">CÓMPUTO LABORAL</p><strong className="font-display mt-2 block text-2xl">Lunes a viernes</strong><p className="mt-1 text-sm text-[#708496]">También excluye los festivos de la lista</p></article>
    </section>

    {!child.actualBirthDate && <div className="flex gap-3 rounded-2xl border border-[#f1d49b] bg-[#fff8e9] p-4 text-sm text-[#72531d]"><CircleHelp className="mt-0.5 shrink-0" size={18}/><p>Este plan usa la FEP. Cuando indiques el nacimiento real en el perfil, todas las fechas se desplazarán automáticamente manteniendo días, orden y personas.</p></div>}

    <section className="rounded-3xl border border-[#dfe8ef] bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" aria-expanded={periodsOpen} aria-controls="leave-periods-panel" className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17324d] focus-visible:ring-offset-4" onClick={() => setPeriodsOpen(value => !value)}><span className="min-w-0 flex-1"><span className="font-display block text-xl font-bold">Conceptos del plan</span><span className="mt-1 block text-sm text-[#708496]">{periods.length} {periods.length === 1 ? "concepto" : "conceptos"} · {periods.reduce((total, period) => total + period.days, 0)} días configurados</span></span><ChevronDown className={`shrink-0 text-[#708496] transition-transform ${periodsOpen ? "rotate-180" : ""}`} aria-hidden="true"/></button><Button onClick={save} disabled={saving} className="rounded-xl"><Save/> {saving ? "Guardando…" : "Guardar calendario"}</Button></div>
      {periodsOpen && <div id="leave-periods-panel"><p className="mt-4 text-sm text-[#708496]">El orden define la continuidad. Los días laborables saltan fines de semana y festivos.</p><div className="mt-4 space-y-3">{schedule.map((period, index) => <div key={period.id} className="grid gap-3 rounded-2xl border border-[#e2e9ee] p-3 lg:grid-cols-[minmax(180px,1.5fr)_minmax(120px,1fr)_100px_150px_190px_auto] lg:items-end">
        <div><Label className="text-xs text-[#708496]">Concepto</Label><Input className="mt-1" value={period.label} onChange={event => updatePeriod(period.id, { label: event.target.value })}/></div>
        <div><Label className="text-xs text-[#708496]">Persona</Label><Input className="mt-1" value={period.person} onChange={event => updatePeriod(period.id, { person: event.target.value })}/></div>
        <div><Label className="text-xs text-[#708496]">Días</Label><Input className="mt-1" type="number" min={1} max={730} value={period.days} onChange={event => updatePeriod(period.id, { days: Math.max(1, Number(event.target.value)) })}/></div>
        <div><Label className="text-xs text-[#708496]">Tipo de días</Label><Select value={period.counting} onValueChange={value => updatePeriod(period.id, { counting: value as LeavePeriod["counting"] })}><SelectTrigger className="mt-1 w-full"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="calendar">Naturales</SelectItem><SelectItem value="workdays">Laborables</SelectItem></SelectContent></Select></div>
        <div className="rounded-xl bg-[#f5f8fa] px-3 py-2 text-sm"><span className="block text-xs text-[#708496]">{dateText(period.startDate)}</span><strong>{dateText(period.endDate)}</strong></div>
        <div className="flex justify-end gap-1"><Button variant="ghost" size="icon" aria-label="Subir concepto" disabled={index === 0} onClick={() => movePeriod(index, -1)}><ArrowUp/></Button><Button variant="ghost" size="icon" aria-label="Bajar concepto" disabled={index === periods.length - 1} onClick={() => movePeriod(index, 1)}><ArrowDown/></Button><Button variant="ghost" size="icon" className="text-red-600" aria-label="Eliminar concepto" onClick={() => setPeriods(current => current.filter(item => item.id !== period.id))}><Trash2/></Button></div>
      </div>)}</div>
      <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setPeriods(current => [...current, { id: crypto.randomUUID(), label: "Nuevo concepto", person: "Persona 1", days: 1, counting: "calendar" }])}><Plus/> Añadir concepto</Button></div>}
    </section>

    <section className="rounded-3xl border border-[#dfe8ef] bg-white p-4 shadow-sm sm:p-6">
      <button type="button" aria-expanded={holidaysOpen} aria-controls="leave-holidays-panel" className="group flex w-full items-center gap-3 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17324d] focus-visible:ring-offset-4" onClick={() => setHolidaysOpen(value => !value)}><span className="min-w-0 flex-1"><span className="font-display block text-xl font-bold">Festivos no laborables</span><span className="mt-1 block text-sm text-[#708496]">{holidays.length} {holidays.length === 1 ? "festivo configurado" : "festivos configurados"} · Madrid capital 2026–2027</span></span><ChevronDown className={`shrink-0 text-[#708496] transition-transform ${holidaysOpen ? "rotate-180" : ""}`} aria-hidden="true"/></button>
      {holidaysOpen && <div id="leave-holidays-panel"><div className="mt-4 flex flex-wrap items-start justify-between gap-3"><p className="max-w-2xl text-sm text-[#708496]">Puedes añadir, corregir o quitar cualquier fecha para adaptarlo al centro de trabajo.</p><Button variant="outline" className="rounded-xl" onClick={() => setHolidays(madridHolidays)}>Restaurar Madrid 2026–2027</Button></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[170px_1fr_auto]"><Input aria-label="Fecha del festivo" type="date" value={holidayDate} onChange={event => setHolidayDate(event.target.value)}/><Input aria-label="Nombre del festivo" placeholder="Nombre del festivo" value={holidayLabel} onChange={event => setHolidayLabel(event.target.value)}/><Button variant="outline" onClick={addHoliday}><Plus/> Añadir</Button></div>
      <div className="mt-4 max-h-64 overflow-y-auto rounded-2xl border border-[#e2e9ee]">{holidays.map(holiday => <div key={holiday.date} className="flex items-center gap-3 border-b border-[#edf1f4] px-3 py-2 last:border-0"><time className="w-28 shrink-0 text-sm font-bold">{dateText(holiday.date)}</time><span className="min-w-0 flex-1 truncate text-sm text-[#526b7e]">{holiday.label}</span><Button variant="ghost" size="icon" className="shrink-0 text-red-600" aria-label={`Quitar ${holiday.label}`} onClick={() => setHolidays(current => current.filter(item => item.date !== holiday.date))}><Trash2/></Button></div>)}</div></div>}
    </section>

    <section>
      <div className="mb-3"><h2 className="font-display text-xl font-bold">Vista de calendario</h2><p className="mt-1 text-sm text-[#708496]">Los colores corresponden a cada concepto. La fecha marcada con un anillo es la FEP o el nacimiento real.</p></div>
      <div className="mb-4 flex flex-wrap gap-2">{periods.map((period, index) => <span key={period.id} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs shadow-sm"><i className="size-2.5 rounded-full" style={{ background: palette[index % palette.length] }}/>{period.label} · {period.person}</span>)}</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{months.map(month => <MonthCard key={month.toISOString()} month={month} anchor={anchor} schedule={schedule} holidayMap={holidayMap} colorById={colorById}/>)}</div>
      {months.length === 18 && parseIsoDate(finalDate) > months.at(-1)! && <p className="mt-3 text-sm text-[#708496]">La vista muestra los primeros 18 meses; la tabla conserva el plan completo hasta {dateText(finalDate)}.</p>}
    </section>
    <footer className="pb-3 text-xs leading-relaxed text-[#718596]">Plan orientativo y editable. Comprueba con la empresa, el convenio y la Seguridad Social qué periodos corresponden y cómo pueden disfrutarse.</footer>
  </div>;
}

function MonthCard({ month, anchor, schedule, holidayMap, colorById }: { month: Date; anchor: string; schedule: ReturnType<typeof calculateLeaveSchedule>; holidayMap: Map<string, string>; colorById: Map<string, string> }) {
  const year = month.getUTCFullYear(), monthIndex = month.getUTCMonth(), count = new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
  const leading = (new Date(Date.UTC(year, monthIndex, 1, 12)).getUTCDay() + 6) % 7;
  const rawTitle = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(month), title = rawTitle[0].toUpperCase() + rawTitle.slice(1);
  return <article className="rounded-3xl border border-[#dfe8ef] bg-white p-4 shadow-sm"><h3 className="font-display mb-3 text-center text-lg font-bold">{title}</h3><div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#8193a1]">{["L", "M", "X", "J", "V", "S", "D"].map(day => <span key={day}>{day}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{Array.from({ length: leading }).map((_, index) => <span key={`blank-${index}`}/>)}{Array.from({ length: count }, (_, index) => {
    const date = toIsoDate(new Date(Date.UTC(year, monthIndex, index + 1, 12))), period = schedule.find(item => date >= item.startDate && date <= item.endDate), holiday = holidayMap.get(date), weekend = [0, 6].includes(parseIsoDate(date).getUTCDay());
    return <span key={date} title={[period && `${period.label} · ${period.person}`, holiday].filter(Boolean).join(" · ")} className={`relative grid aspect-square place-items-center rounded-lg text-xs ${weekend && !period ? "text-[#a1adb7]" : "text-[#25445c]"} ${date === anchor ? "ring-2 ring-[#17324d] ring-offset-1" : ""}`} style={{ background: period ? colorById.get(period.id) : weekend ? "#f4f6f8" : "transparent" }}>{index + 1}{holiday && <i className="absolute bottom-1 size-1.5 rounded-full bg-[#d14d3f]"/>}</span>;
  })}</div></article>;
}
