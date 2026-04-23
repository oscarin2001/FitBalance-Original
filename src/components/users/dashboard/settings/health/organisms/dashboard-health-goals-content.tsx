"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  createInitialHealthDirections,
  createInitialHealthValues,
  healthMetricRows,
  type HealthDirectionValue,
  type HealthMetricKey,
} from "../data/health-goals";
import { HealthGoalRow } from "../molecules/health-goal-row";

export function DashboardHealthGoalsContent() {
  const [values, setValues] = useState<Record<HealthMetricKey, number>>(() => createInitialHealthValues());
  const [directions, setDirections] = useState<Record<HealthMetricKey, HealthDirectionValue>>(() =>
    createInitialHealthDirections()
  );
  const [applied, setApplied] = useState(false);

  function updateValue(key: HealthMetricKey, nextValue: number) {
    setValues((previous) => ({ ...previous, [key]: Math.max(Math.round(nextValue * 10) / 10, 0) }));
  }

  function updateDirection(key: HealthMetricKey, nextDirection: HealthDirectionValue) {
    setDirections((previous) => ({ ...previous, [key]: nextDirection }));
  }

  return (
    <div className="space-y-4 px-3 py-3">
      <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500">
              <Plus className="size-5" />
            </div>

            <div className="min-w-0">
              <CardTitle className="mt-1 text-2xl tracking-tight text-slate-950">Zona media</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                Introduce tus metas generales.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 p-4">
          {healthMetricRows.map((row) => (
            <HealthGoalRow
              key={row.key}
              label={row.label}
              value={values[row.key]}
              unit={row.unit}
              direction={directions[row.key]}
              step={row.step}
              highlighted={row.key === "peso"}
              onValueChange={(nextValue) => updateValue(row.key, nextValue)}
              onDirectionChange={(nextDirection) => updateDirection(row.key, nextDirection)}
            />
          ))}
        </CardContent>
      </Card>

      {applied ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-700">
          Metas aplicadas a esta vista previa.
        </div>
      ) : null}

      <Button
        type="button"
        className="h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(16,185,129,0.9)] hover:bg-emerald-600"
        onClick={() => setApplied(true)}
      >
        {applied ? "Metas aplicadas" : "Aplicar metas de salud"}
      </Button>
    </div>
  );
}
