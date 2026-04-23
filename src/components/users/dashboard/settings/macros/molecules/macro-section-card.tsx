"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "teal" | "emerald" | "amber" | "slate";

const toneClasses: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-500",
};

type MacroSectionCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

export function MacroSectionCard({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "teal",
  className,
  children,
}: MacroSectionCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]",
        className
      )}
    >
      <CardContent className="grid gap-4 p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", toneClasses[tone])}>
            <Icon className="size-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600/80">
              {eyebrow}
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
