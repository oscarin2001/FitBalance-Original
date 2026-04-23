"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CalendarDays, ChevronDown, PencilLine } from "lucide-react";

import type { UserDashboardPlan } from "@/actions/server/users/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type DashboardSummaryCardProps = {
  dashboard: UserDashboardPlan;
  sessionUserId: number;
};

type CarbViewMode = "netos" | "totales";

type DashboardMealIngredient = UserDashboardPlan["meals"][number]["ingredients"][number];

type PieSlice = {
  name: string;
  value: number;
  color: string;
};

const MACRO_COLORS = {
  proteins: "#387EC6",
  fats: "#F0A12B",
  calories: "#7B7F87",
  carbs: "#F05353",
} as const;

function round(value: number) {
  return Number(value.toFixed(1));
}

function formatWhole(value: number) {
  return String(Math.round(value));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getInitialCarbView(carbLabel: string): CarbViewMode {
  return normalizeText(carbLabel).includes("net") ? "netos" : "totales";
}

function isFiberIngredient(ingredient: DashboardMealIngredient) {
  const role = normalizeText(ingredient.role ?? "");
  const category = normalizeText(ingredient.category ?? "");

  return role === "vegetable" || category === "fibras";
}

function getPercent(consumed: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return round(Math.min((consumed / target) * 100, 100));
}

function buildRemainingLabel(remaining: number, suffix: string) {
  return `Quedan ${formatWhole(Math.max(remaining, 0))}${suffix}`;
}

function buildPieBackground(slices: PieSlice[]) {
  const total = slices.reduce((accumulator, slice) => accumulator + Math.max(slice.value, 0), 0);

  if (total <= 0) {
    return `conic-gradient(from -90deg, #e2e8f0 0% 100%)`;
  }

  let currentPercent = 0;
  const stops = slices.map((slice) => {
    const nextPercent = currentPercent + (Math.max(slice.value, 0) / total) * 100;
    const stop = `${slice.color} ${currentPercent}% ${nextPercent}%`;
    currentPercent = nextPercent;
    return stop;
  });

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

function MacroProgressRow({
  label,
  consumed,
  target,
  suffix,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  suffix: string;
  color: string;
}) {
  const progress = getPercent(consumed, target);
  const remaining = Math.max(round(target - consumed), 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[15px] font-medium tracking-tight text-slate-900">{label}</span>
        </div>
        <span className="text-sm font-medium tabular-nums text-slate-700">
          {formatWhole(consumed)} / {formatWhole(target)}{suffix}
        </span>
      </div>

      <div className="relative h-8 overflow-hidden rounded-full bg-slate-100">
        <div
          className="absolute inset-y-1 left-1 flex items-center justify-center rounded-full px-3 text-[11px] font-semibold italic leading-none text-white shadow-[0_10px_18px_-14px_rgba(15,23,42,0.8)] transition-all"
          style={{ width: `${Math.max(progress, 18)}%`, backgroundColor: color }}
        >
          <span className="whitespace-nowrap">{buildRemainingLabel(remaining, suffix)}</span>
        </div>
      </div>
    </div>
  );
}

export function DashboardSummaryCard({ dashboard, sessionUserId }: DashboardSummaryCardProps) {
  const router = useRouter();
  const [carbView, setCarbView] = useState<CarbViewMode>(() => getInitialCarbView(dashboard.carbLabel));

  useEffect(() => {
    setCarbView(getInitialCarbView(dashboard.carbLabel));
  }, [dashboard.carbLabel]);

  const fiberTotal = useMemo(
    () =>
      dashboard.meals.reduce((accumulator, meal) => {
        return (
          accumulator +
          meal.ingredients.reduce((mealAccumulator, ingredient) => {
            if (!isFiberIngredient(ingredient)) {
              return mealAccumulator;
            }

            return mealAccumulator + Number(ingredient.nutrition?.carbs ?? 0);
          }, 0)
        );
      }, 0),
    [dashboard.meals]
  );

  const trackingMode = getInitialCarbView(dashboard.carbLabel);
  const baseCarbs = dashboard.dayTotals.carbs;
  const baseCarbTarget = dashboard.dayTargets.carbs;
  const totalCarbs = trackingMode === "netos" ? baseCarbs + fiberTotal : baseCarbs;
  const netCarbs = trackingMode === "totales" ? Math.max(baseCarbs - fiberTotal, 0) : baseCarbs;
  const displayCarbs = carbView === "netos" ? netCarbs : totalCarbs;
  const displayCarbLabel = carbView === "netos" ? "Carbos netos" : "Carbos totales";
  const alternateCarbLabel = carbView === "netos" ? "Carbos totales" : "Carbos netos";
  const alternateCarbs = carbView === "netos" ? totalCarbs : netCarbs;

  const pieData = useMemo(
    () => [
      {
        name: "Proteína",
        value: Math.max(dashboard.dayTotals.proteins * 4, 0),
        color: MACRO_COLORS.proteins,
      },
      {
        name: "Grasa",
        value: Math.max(dashboard.dayTotals.fats * 9, 0),
        color: MACRO_COLORS.fats,
      },
      {
        name: displayCarbLabel,
        value: Math.max(displayCarbs * 4, 0),
        color: MACRO_COLORS.carbs,
      },
    ],
    [dashboard.dayTotals.fats, dashboard.dayTotals.proteins, displayCarbLabel, displayCarbs]
  );
  const pieBackground = useMemo(() => buildPieBackground(pieData), [pieData]);

  return (
    <Card className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
      <CardContent className="grid gap-4 p-4 sm:p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Mis macros</h2>
            <PencilLine className="size-4 text-slate-400" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="Cambiar valores de carbohidratos"
            >
              <span>{carbView === "netos" ? "Valores netos" : "Valores totales"}</span>
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="min-w-44 rounded-[1.25rem] border border-slate-200/80 bg-white p-1.5 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.55)]"
            >
              <DropdownMenuItem
                onClick={() => setCarbView("netos")}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950",
                  carbView === "netos" && "bg-slate-100 text-slate-950"
                )}
              >
                Valores netos
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setCarbView("totales")}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950",
                  carbView === "totales" && "bg-slate-100 text-slate-950"
                )}
              >
                Valores totales
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)] items-center gap-4">
          <div className="flex items-center justify-center">
            <div className="aspect-square w-full max-w-[9.25rem] rounded-full bg-white p-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] ring-1 ring-slate-100">
              <div
                className="h-full w-full rounded-full"
                style={{
                  backgroundImage: pieBackground,
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <MacroProgressRow
              label="Proteína"
              consumed={dashboard.dayTotals.proteins}
              target={dashboard.dayTargets.proteins}
              suffix="g"
              color={MACRO_COLORS.proteins}
            />

            <MacroProgressRow
              label="Grasa"
              consumed={dashboard.dayTotals.fats}
              target={dashboard.dayTargets.fats}
              suffix="g"
              color={MACRO_COLORS.fats}
            />

            <MacroProgressRow
              label="Calorías"
              consumed={dashboard.dayTotals.calories}
              target={dashboard.dayTargets.calories}
              suffix=""
              color={MACRO_COLORS.calories}
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-100">
          <MacroProgressRow
            label={displayCarbLabel}
            consumed={displayCarbs}
            target={baseCarbTarget}
            suffix="g"
            color={MACRO_COLORS.carbs}
          />

          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 sm:gap-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
              <span>Fibra</span>
              <span className="font-medium text-slate-900">{formatWhole(fiberTotal)}g</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2">
              <span>{alternateCarbLabel}</span>
              <span className="font-medium text-slate-900">{formatWhole(alternateCarbs)}g</span>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-14 rounded-2xl border-emerald-300 bg-white text-base font-semibold text-emerald-600 shadow-sm hover:bg-emerald-50 hover:text-emerald-700"
          onClick={() => router.push(`/users/${sessionUserId}`)}
        >
          <CalendarDays className="size-4" />
          Resumen semanal
        </Button>
      </CardContent>
    </Card>
  );
}
