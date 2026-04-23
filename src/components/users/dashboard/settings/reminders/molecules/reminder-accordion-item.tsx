"use client";

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import type { ReminderAccordionItem, ReminderTone } from "../data/reminders-settings";

function toneClasses(tone: ReminderTone) {
  if (tone === "emerald") {
    return "bg-emerald-50 text-emerald-600";
  }

  if (tone === "slate") {
    return "bg-slate-100 text-slate-500";
  }

  return "bg-teal-50 text-teal-600";
}

export function ReminderAccordionItemRow({ item }: { item: ReminderAccordionItem }) {
  return (
    <AccordionItem value={item.id} className="border-b border-slate-100 last:border-b-0">
      <AccordionTrigger
        className={cn(
          "w-full rounded-none px-4 py-4 text-left no-underline hover:no-underline",
          "[&_svg[data-slot=accordion-trigger-icon]]:size-4 [&_svg[data-slot=accordion-trigger-icon]]:text-slate-400"
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3 pr-3">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", toneClasses(item.tone))}>
            <item.icon className="size-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-slate-950">{item.title}</span>
            <span className="mt-1 block text-sm font-normal leading-6 text-slate-500">{item.description}</span>
          </span>
        </span>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <div className="grid gap-2 rounded-2xl bg-slate-50 p-3">
          {item.scheduleRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
              <span className="font-medium text-slate-950">{row.label}</span>
              <span className="text-slate-500">{row.value}</span>
            </div>
          ))}

          <p className="pt-1 text-xs leading-5 text-slate-500">
            Por ahora es solo estructura visual. Luego aqui conectamos horarios reales.
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
