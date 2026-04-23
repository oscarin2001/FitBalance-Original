"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Tone = "teal" | "emerald" | "amber" | "slate";

const toneClasses: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-500",
};

type MacroAccordionItemProps = {
  itemId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  eyebrow?: string;
  badge?: string;
  badgeTone?: Tone;
  tone?: Tone;
  children: ReactNode;
};

export function MacroAccordionItem({
  itemId,
  title,
  description,
  icon: Icon,
  eyebrow,
  badge,
  badgeTone = "emerald",
  tone = "teal",
  children,
}: MacroAccordionItemProps) {
  return (
    <AccordionItem value={itemId} className="border-b border-slate-100 last:border-b-0">
      <AccordionTrigger
        className={cn(
          "w-full rounded-none px-4 py-4 text-left no-underline hover:no-underline",
          "[&_svg[data-slot=accordion-trigger-icon]]:size-4 [&_svg[data-slot=accordion-trigger-icon]]:text-slate-400"
        )}
      >
        <span className="flex min-w-0 flex-1 items-start gap-3 pr-3">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", toneClasses[tone])}>
            <Icon className="size-4" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              {eyebrow ? <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</span> : null}
              {badge ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                    badgeTone === "amber"
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : badgeTone === "slate"
                        ? "bg-slate-100 text-slate-600 ring-slate-200"
                        : badgeTone === "teal"
                          ? "bg-teal-50 text-teal-700 ring-teal-200"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </span>
            <span className="block text-base font-semibold text-slate-950">{title}</span>
            <span className="mt-1 block text-sm font-normal leading-6 text-slate-500">{description}</span>
          </span>
        </span>
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4">
        <div className="grid gap-3 rounded-2xl bg-slate-50 p-3">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
