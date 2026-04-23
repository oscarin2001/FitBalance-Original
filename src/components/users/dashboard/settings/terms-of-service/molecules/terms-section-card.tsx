"use client";

import type { TermsSection } from "../data/terms-of-service-content";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TermsSectionCardProps = {
  section: TermsSection;
};

function toneClasses(tone: TermsSection["tone"]) {
  if (tone === "teal") {
    return "bg-teal-50 text-teal-600";
  }

  if (tone === "amber") {
    return "bg-amber-50 text-amber-600";
  }

  if (tone === "emerald") {
    return "bg-emerald-50 text-emerald-600";
  }

  return "bg-slate-100 text-slate-500";
}

export function TermsSectionCard({ section }: TermsSectionCardProps) {
  return (
    <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", toneClasses(section.tone))}>
            <section.icon className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Seccion legal</p>
            <h3 className="mt-1 text-[1.35rem] font-semibold tracking-tight text-slate-950">{section.title}</h3>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {section.bullets ? (
            <ul className="space-y-2 rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-4">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-slate-600">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}