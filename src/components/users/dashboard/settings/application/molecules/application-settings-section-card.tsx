import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ApplicationSettingsSectionCardProps = {
  title: string;
  className?: string;
  children: ReactNode;
};

export function ApplicationSettingsSectionCard({ title, className, children }: ApplicationSettingsSectionCardProps) {
  return (
    <section className={cn("grid gap-2", className)} aria-label={title}>
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{title}</p>

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        {children}
      </div>
    </section>
  );
}
