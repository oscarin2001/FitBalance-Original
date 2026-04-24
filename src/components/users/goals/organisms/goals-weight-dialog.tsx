"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Clock3, Scale, Target } from "lucide-react";

import type { UserWeightHistoryEntry } from "@/actions/server/users/types";
import { addGoalWeightEntryAction, updateGoalWeightEntryAction } from "@/actions/server/users/goals/weight-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { GoalsDatePickerField } from "./goals-date-picker";

import {
  convertWeightKgToUnit,
  convertWeightUnitToKg,
  formatGoalLabel,
  formatWeight,
  type GoalsWeightUnit,
} from "../sections";

type GoalsWeightDialogMode = "create" | "edit";

type GoalsWeightDialogProps = {
  open: boolean;
  mode: GoalsWeightDialogMode;
  entry: UserWeightHistoryEntry | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  objectiveLabel: string;
  onOpenChange: (open: boolean) => void;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function sanitizeWeightInput(value: string) {
  const cleanedValue = value.replace(/[^\d.]/g, "");
  const [integerPart, decimalPart] = cleanedValue.split(".");

  if (!decimalPart) {
    return integerPart;
  }

  return `${integerPart}.${decimalPart.slice(0, 1)}`;
}

function formatEntryDateTime(entry: UserWeightHistoryEntry | null) {
  if (!entry) {
    return new Date();
  }

  const parsedDate = new Date(entry.dateIso);
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

export function GoalsWeightDialog({
  open,
  mode,
  entry,
  currentWeightKg,
  targetWeightKg,
  objectiveLabel,
  onOpenChange,
}: GoalsWeightDialogProps) {
  const router = useRouter();
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [unit, setUnit] = useState<GoalsWeightUnit>("kg");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const defaultWeightKg = useMemo(() => currentWeightKg ?? targetWeightKg ?? null, [currentWeightKg, targetWeightKg]);
  const goalLabel = useMemo(
    () => formatGoalLabel(currentWeightKg ?? targetWeightKg ?? 0, targetWeightKg, unit),
    [currentWeightKg, targetWeightKg, unit]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const sourceDate = mode === "edit" ? formatEntryDateTime(entry) : new Date();
    setDateValue(toDateInputValue(sourceDate));
    setTimeValue(toTimeInputValue(sourceDate));
    setUnit("kg");
    setError("");

    const sourceWeightKg = mode === "edit" ? entry?.weightKg ?? defaultWeightKg : defaultWeightKg;

    if (sourceWeightKg !== null) {
      setWeightValue(String(Number(sourceWeightKg.toFixed(1))));
      return;
    }

    setWeightValue("");
  }, [defaultWeightKg, entry, mode, open]);

  function handleUnitChange(nextUnit: GoalsWeightUnit) {
    if (nextUnit === unit) {
      return;
    }

    const parsedWeight = Number(weightValue);
    if (Number.isFinite(parsedWeight)) {
      const nextWeightKg = convertWeightUnitToKg(parsedWeight, unit);
      const nextDisplayWeight = convertWeightKgToUnit(nextWeightKg, nextUnit);
      setWeightValue(String(Number(nextDisplayWeight.toFixed(1))));
    }

    setUnit(nextUnit);
  }

  async function handleSave() {
    const parsedWeight = Number(weightValue);
    const parsedDateTime = new Date(`${dateValue}T${timeValue}:00`);

    if (!dateValue || !timeValue || Number.isNaN(parsedDateTime.getTime())) {
      setError("Ingresa una fecha y hora validas.");
      return;
    }

    if (!Number.isFinite(parsedWeight)) {
      setError("Ingresa un peso valido.");
      return;
    }

    const weightKg = convertWeightUnitToKg(parsedWeight, unit);
    if (weightKg < 35 || weightKg > 250) {
      setError("Peso valido: 35 a 250 kg.");
      return;
    }

    if (mode === "edit" && !entry) {
      setError("No encontramos el peso a editar.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const actionResult =
        mode === "edit"
          ? await updateGoalWeightEntryAction({
              id: entry!.id,
              recordedAtIso: parsedDateTime.toISOString(),
              weightKg: Number(weightKg.toFixed(1)),
            })
          : await addGoalWeightEntryAction({
              recordedAtIso: parsedDateTime.toISOString(),
              weightKg: Number(weightKg.toFixed(1)),
            });

      if (!actionResult.ok) {
        setError(actionResult.error ?? "No se pudo guardar.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }


  const title = mode === "edit" ? "Editar peso" : "Añadir nuevo peso";
  const submitLabel = mode === "edit" ? "Actualizar" : "Guardar";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onOpenChange(false)}>
      <DialogContent
        showCloseButton={false}
        className="!fixed !inset-0 !z-[100] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-transparent !p-0 !shadow-none"
      >
        <div className="relative flex h-full w-full items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancelar"
            className="absolute inset-0 cursor-default bg-slate-950/88 backdrop-blur-md"
            onClick={() => onOpenChange(false)}
          />

          <div className="relative z-[110] w-[calc(100vw-1rem)] max-w-sm rounded-[1.5rem] border border-white/70 bg-white p-4 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </button>

            <DialogHeader className="pr-16 pt-1">
              <DialogTitle className="text-2xl text-slate-950">{title}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Registra o ajusta tu peso con fecha y hora exactas.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <GoalsDatePickerField
                  valueIso={`${dateValue}T00:00:00.000Z`}
                  onChange={(nextDateValue) => setDateValue(nextDateValue)}
                  label="Fecha"
                />

                <label className="grid gap-2 text-sm font-medium text-slate-900">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Clock3 className="size-4" />
                    Hora
                  </span>
                  <Input
                    type="time"
                    value={timeValue}
                    onChange={(event) => setTimeValue(event.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                  />
                </label>
              </div>

              <div className="grid gap-2">
                <label htmlFor="goals-weight-input" className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Scale className="size-4 text-slate-500" />
                  Peso valor
                </label>
                <div className="flex items-stretch gap-2">
                  <Input
                    id="goals-weight-input"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={weightValue}
                    onChange={(event) => setWeightValue(sanitizeWeightInput(event.target.value))}
                    placeholder={defaultWeightKg !== null ? String(Number(defaultWeightKg.toFixed(1))) : "0"}
                    className="h-12 flex-1 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-lg font-medium tracking-tight"
                  />

                  <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm font-semibold text-slate-500">
                    {(["kg", "lb"] as GoalsWeightUnit[]).map((nextUnit) => (
                      <button
                        key={nextUnit}
                        type="button"
                        onClick={() => handleUnitChange(nextUnit)}
                        className={cn(
                          "rounded-xl px-3 py-2 transition",
                          unit === nextUnit ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                        )}
                      >
                        {nextUnit}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-slate-500">Objetivo: {objectiveLabel}</p>
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <Target className="size-4 text-fuchsia-500" />
                  Metas de Peso: {formatWeight(targetWeightKg ?? currentWeightKg, "kg")}
                </p>
                <p className="text-sm text-slate-500">{goalLabel}</p>
                <p className="text-sm text-slate-500">Peso actual: {formatWeight(currentWeightKg, unit)}</p>
              </div>

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            </div>

            <div className="mt-5 border-t border-slate-200 bg-slate-50/90 pt-4">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
                disabled={isSaving}
                onClick={() => void handleSave()}
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
