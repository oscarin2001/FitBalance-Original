"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type MacroSwitchRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  badge?: string;
  badgeClassName?: string;
  disabled?: boolean;
};

export function MacroSwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  badge,
  badgeClassName,
  disabled,
}: MacroSwitchRowProps) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm", disabled && "opacity-75")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">{title}</p>
            {badge ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1",
                  badgeClassName ?? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                )}
              >
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <Switch checked={checked} onCheckedChange={onCheckedChange} size="sm" disabled={disabled} />
      </div>
    </div>
  );
}
