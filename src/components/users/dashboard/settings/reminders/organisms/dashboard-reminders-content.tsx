"use client";

import { Accordion } from "@/components/ui/accordion";

import { reminderAccordionItems } from "../data/reminders-settings";
import { ReminderAccordionItemRow } from "../molecules/reminder-accordion-item";

export function DashboardRemindersContent() {
  return (
    <div className="space-y-4 px-3 py-3">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Recordatorios</p>

      <Accordion multiple className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        {reminderAccordionItems.map((item) => (
          <ReminderAccordionItemRow key={item.id} item={item} />
        ))}
      </Accordion>

      <div className="rounded-[1.5rem] border border-dashed border-teal-200 bg-teal-50/60 px-4 py-3 text-sm leading-6 text-teal-700">
        De momento esta pantalla es solo visual. No guarda cambios del usuario.
      </div>
    </div>
  );
}
