"use client";

import type { EnergyDirectionValue } from "../data/macronutrients-energy";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MacronutrientEnergyRowProps = {
  label: string;
  value: number;
  unit: string;
  direction: EnergyDirectionValue;
  onValueChange: (value: number) => void;
  onDirectionChange: (direction: EnergyDirectionValue) => void;
  highlighted?: boolean;
};

function toNumericValue(value: string) {
  if (value.trim().length === 0) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function MacronutrientEnergyRow({
  label,
  value,
  unit,
  direction,
  onValueChange,
  onDirectionChange,
  highlighted,
}: MacronutrientEnergyRowProps) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-2xl border px-3 py-3 shadow-sm transition",
        highlighted ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200/80 bg-slate-50/70"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-1 flex items-end gap-2">
            <Input
              type="number"
              value={value}
              onChange={(event) => onValueChange(toNumericValue(event.target.value))}
              className="h-8 w-20 border-0 bg-transparent p-0 text-base font-medium text-slate-950 shadow-none focus-visible:ring-0"
            />
            <span className="pb-1 text-sm text-slate-400">{unit || " "}</span>
          </div>
        </div>

        <div className="inline-flex rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
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
