"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { HealthDirectionValue } from "../data/health-goals";

type HealthGoalRowProps = {
  label: string;
  value: number;
  unit: string;
  direction: HealthDirectionValue;
  step?: number;
  highlighted?: boolean;
  onValueChange: (value: number) => void;
  onDirectionChange: (direction: HealthDirectionValue) => void;
};

function formatDisplayValue(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function parseNumericValue(value: string) {
  const normalized = value.replace(/\s/g, "").replace(",", ".");

  if (normalized.length === 0) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function HealthGoalRow({
  label,
  value,
  unit,
  direction,
  step = 1,
  highlighted,
  onValueChange,
  onDirectionChange,
}: HealthGoalRowProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-3 py-3 shadow-sm transition",
        highlighted ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200/80 bg-slate-50/70"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-0.5 flex items-end gap-2">
            <Input
              type="text"
              inputMode="decimal"
              value={formatDisplayValue(value)}
              onChange={(event) => onValueChange(parseNumericValue(event.target.value))}
              step={step}
              className="h-8 w-24 border-0 bg-transparent p-0 text-base font-medium text-slate-950 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <span className="shrink-0 text-sm text-slate-400">{unit || " "}</span>

        <div className="inline-flex shrink-0 overflow-hidden rounded-full bg-white p-0.5 ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => onDirectionChange("encima")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition",
              direction === "encima" ? "bg-emerald-500 text-white" : "text-slate-400"
            )}
          >
            encima
          </button>
          <button
            type="button"
            onClick={() => onDirectionChange("debajo")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition",
              direction === "debajo" ? "bg-emerald-500 text-white" : "text-slate-400"
            )}
          >
            debajo
          </button>
        </div>
      </div>
    </div>
  );
}
