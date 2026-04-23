"use client";

import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type MacroInputRowProps = {
  label: string;
  description: string;
  value: number;
  unit: string;
  percent: number;
  progress: number;
  helperText: string;
  accentClassName?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
};

function toNumericValue(value: string) {
  if (value.trim().length === 0) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function MacroInputRow({
  label,
  description,
  value,
  unit,
  percent,
  progress,
  helperText,
  accentClassName,
  disabled,
  min = 0,
  max,
  step = 1,
  onValueChange,
}: MacroInputRowProps) {
  return (
    <div className={cn("grid gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3", disabled && "opacity-75")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Input
            type="number"
            value={value}
            onChange={(event) => onValueChange(toNumericValue(event.target.value))}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="h-9 w-20 border-0 bg-transparent p-0 text-right text-sm font-semibold text-slate-950 shadow-none focus-visible:ring-0"
          />
          <span className="text-sm font-medium text-slate-400">{unit}</span>
        </label>
      </div>

      <Progress value={progress} className="gap-0" />

      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
        <span>{helperText}</span>
        <span
          className={cn(
            "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
            accentClassName ?? "bg-white text-slate-600 ring-1 ring-slate-200"
          )}
        >
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}
