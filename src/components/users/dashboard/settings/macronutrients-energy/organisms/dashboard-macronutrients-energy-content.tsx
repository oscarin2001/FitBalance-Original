"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Flame, Sparkles } from "lucide-react";

import type { UserDashboardProfile } from "@/actions/server/users/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  createInitialEnergyDirections,
  createInitialEnergyValues,
  energyFrequencyOptions,
  energyMetricRows,
  type EnergyDirectionValue,
  type EnergyFrequencyValue,
  type EnergyMetricKey,
} from "../data/macronutrients-energy";
import { MacronutrientEnergyRow } from "../molecules/macronutrient-energy-row";

type DashboardMacronutrientsEnergyContentProps = {
  profile: UserDashboardProfile | null;
};

function getDisplayName(profile: UserDashboardProfile | null) {
  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(" ").trim();

  return fullName || profile?.nombre || "Usuario";
}

function buildAdvancedRowsVisible(showAdvanced: boolean) {
  return showAdvanced ? energyMetricRows.filter((row) => row.advanced) : [];
}

function buildPrimaryRowsVisible() {
  return energyMetricRows.filter((row) => !row.advanced);
}

export function DashboardMacronutrientsEnergyContent({ profile }: DashboardMacronutrientsEnergyContentProps) {
  const displayName = useMemo(() => getDisplayName(profile), [profile]);
  const [frequency, setFrequency] = useState<EnergyFrequencyValue>("Diario");
  const [values, setValues] = useState<Record<EnergyMetricKey, number>>(() => createInitialEnergyValues());
  const [directions, setDirections] = useState<Record<EnergyMetricKey, EnergyDirectionValue>>(() =>
    createInitialEnergyDirections()
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [applied, setApplied] = useState(false);

  const primaryRows = useMemo(() => buildPrimaryRowsVisible(), []);
  const advancedRows = useMemo(() => buildAdvancedRowsVisible(showAdvanced), [showAdvanced]);

  function updateValue(key: EnergyMetricKey, nextValue: number) {
    setValues((previous) => ({ ...previous, [key]: Math.max(Math.round(nextValue), 0) }));
  }

  function updateDirection(key: EnergyMetricKey, nextDirection: EnergyDirectionValue) {
    setDirections((previous) => ({ ...previous, [key]: nextDirection }));
  }

  function handleApply() {
    setShowConfirm(true);
  }

  function confirmApply() {
    setApplied(true);
    setShowConfirm(false);
  }

  return (
    <div className="space-y-4 px-3 py-3">
      <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Sparkles className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600/80">Paso 1</p>
              <CardTitle className="mt-1 text-2xl tracking-tight text-slate-950">Seleccionar frecuencia</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                Elige si deseas aplicar estas metas todos los días o solo días específicos de la semana.
              </CardDescription>
              <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Vista previa para {displayName}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 p-4">
          <Select value={frequency} onValueChange={(value) => setFrequency(value as EnergyFrequencyValue)}>
            <SelectTrigger className="h-14 w-full rounded-2xl border-slate-200 bg-slate-50 px-4 text-base text-slate-500 shadow-none">
              <SelectValue placeholder="Selecciona una frecuencia" />
            </SelectTrigger>
            <SelectContent>
              {energyFrequencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <CardHeader className="gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <Flame className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-600/80">Metas base</p>
              <CardTitle className="mt-1 text-2xl tracking-tight text-slate-950">Macronutrientes y energía</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                Ajusta los objetivos principales y deja los avanzados ocultos hasta que los necesites.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 p-4">
          {primaryRows.map((row) => (
            <MacronutrientEnergyRow
              key={row.key}
              label={row.label}
              value={values[row.key]}
              unit={row.unit}
              direction={directions[row.key]}
              highlighted={row.key === "calorias" || row.key === "carbosTotales" || row.key === "proteina"}
              onValueChange={(nextValue) => updateValue(row.key, nextValue)}
              onDirectionChange={(nextDirection) => updateDirection(row.key, nextDirection)}
            />
          ))}

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((previous) => !previous)}
              className="mx-auto flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              {showAdvanced ? "Ocultar campos avanzados" : "Mostrar campos avanzados"}
              <ChevronDown className={cn("size-4 transition-transform", showAdvanced && "rotate-180")} />
            </button>
          </div>

          {showAdvanced ? (
            <div className="grid gap-3 pt-1">
              {advancedRows.map((row) => (
                <MacronutrientEnergyRow
                  key={row.key}
                  label={row.label}
                  value={values[row.key]}
                  unit={row.unit}
                  direction={directions[row.key]}
                  onValueChange={(nextValue) => updateValue(row.key, nextValue)}
                  onDirectionChange={(nextDirection) => updateDirection(row.key, nextDirection)}
                />
              ))}
            </div>
          ) : null}

          {applied ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm leading-6 text-emerald-700">
              Metas aplicadas a esta vista previa.
            </div>
          ) : null}

          <Button
            type="button"
            className="h-12 rounded-full bg-emerald-500 text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(16,185,129,0.9)] hover:bg-emerald-600"
            onClick={handleApply}
          >
            Aplicar a días pasados y futuros
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent
          showCloseButton={false}
          className="w-[min(100vw-2rem,24rem)] rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tight text-slate-950">
              ¿Aplicar metas al pasado y al futuro?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-slate-500">
              Esto actualizará las metas visibles en esta pantalla y mantendrá tu vista previa alineada.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-full border-slate-200"
              onClick={() => setShowConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-12 flex-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={confirmApply}
            >
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
