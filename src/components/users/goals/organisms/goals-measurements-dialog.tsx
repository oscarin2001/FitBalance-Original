"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { CircleHelp, Clock3, Scale, Trash2 } from "lucide-react";

import type { UserBodyMeasurementEntry } from "@/actions/server/users/types";
import {
  createBodyMeasurementAction,
  deleteBodyMeasurementAction,
  updateBodyMeasurementAction,
} from "@/actions/server/users/goals/measurement-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { GoalsDatePickerField } from "./goals-date-picker";
import {
  BODY_MEASUREMENT_MAX_CM,
  BODY_MEASUREMENT_MIN_CM,
  BODY_MEASUREMENT_FIELDS,
  formatMeasurementValue,
  type GoalsBodyMeasurementFieldKey,
} from "../sections/goals-measurements-utils";

type GoalsMeasurementsDialogMode = "create" | "edit";

type GoalsMeasurementsDialogProps = {
  open: boolean;
  mode: GoalsMeasurementsDialogMode;
  entry: UserBodyMeasurementEntry | null;
  onOpenChange: (open: boolean) => void;
};

type MeasurementFieldState = Record<GoalsBodyMeasurementFieldKey, string>;

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

function sanitizeMeasurementInput(value: string) {
  const cleanedValue = value.replace(/[^\d.]/g, "");
  const [integerPart, decimalPart] = cleanedValue.split(".");

  if (!integerPart && !decimalPart) {
    return "";
  }

  const normalizedIntegerPart = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const normalizedValue = decimalPart ? `${normalizedIntegerPart}.${decimalPart.slice(0, 1)}` : normalizedIntegerPart;
  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    return normalizedValue;
  }

  const clampedValue = Math.min(parsedValue, BODY_MEASUREMENT_MAX_CM);
  return Number.isInteger(clampedValue) ? String(Math.trunc(clampedValue)) : clampedValue.toFixed(1);
}

function parseMeasurementNumber(value: string) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Number(parsedValue.toFixed(1)) : null;
}

function buildInitialFieldState(entry: UserBodyMeasurementEntry | null): MeasurementFieldState {
  return {
    pechoCm: entry?.pechoCm?.toFixed(1) ?? "",
    cinturaCm: entry?.cinturaCm?.toFixed(1) ?? "",
    caderaCm: entry?.caderaCm?.toFixed(1) ?? "",
    brazoCm: entry?.brazoCm?.toFixed(1) ?? "",
    musloCm: entry?.musloCm?.toFixed(1) ?? "",
    pantorrillaCm: entry?.pantorrillaCm?.toFixed(1) ?? "",
  };
}

export function GoalsMeasurementsDialog({ open, mode, entry, onOpenChange }: GoalsMeasurementsDialogProps) {
  const router = useRouter();
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [fieldValues, setFieldValues] = useState<MeasurementFieldState>(buildInitialFieldState(null));
  const [error, setError] = useState("");
  const [isSaving, startSavingTransition] = useTransition();
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  const title = mode === "edit" ? "Editar medidas" : "Añadir medidas";
  const submitLabel = mode === "edit" ? "Actualizar" : "Guardar";

  useEffect(() => {
    if (!open) {
      return;
    }

    const sourceDate = entry ? new Date(entry.dateIso) : new Date();
    setDateValue(toDateInputValue(Number.isNaN(sourceDate.getTime()) ? new Date() : sourceDate));
    setTimeValue(toTimeInputValue(Number.isNaN(sourceDate.getTime()) ? new Date() : sourceDate));
    setFieldValues(buildInitialFieldState(entry));
    setError("");
  }, [entry, open]);

  const filledFieldCount = useMemo(
    () => BODY_MEASUREMENT_FIELDS.filter((field) => fieldValues[field.key].trim().length > 0).length,
    [fieldValues]
  );

  const rangeLabel = `${BODY_MEASUREMENT_MIN_CM} a ${BODY_MEASUREMENT_MAX_CM} cm`;

  function handleFieldChange(fieldKey: GoalsBodyMeasurementFieldKey, value: string) {
    setFieldValues((currentValues) => ({
      ...currentValues,
      [fieldKey]: sanitizeMeasurementInput(value),
    }));
  }

  async function handleSave() {
    const parsedDateTime = new Date(`${dateValue}T${timeValue}:00`);

    if (!dateValue || !timeValue || Number.isNaN(parsedDateTime.getTime())) {
      setError("Ingresa una fecha y hora validas.");
      return;
    }

    if (filledFieldCount === 0) {
      setError("Ingresa al menos una medida.");
      return;
    }

    const outOfRangeField = BODY_MEASUREMENT_FIELDS.find((field) => {
      const parsedValue = parseMeasurementNumber(fieldValues[field.key]);

      return (
        parsedValue !== null &&
        (parsedValue < BODY_MEASUREMENT_MIN_CM || parsedValue > BODY_MEASUREMENT_MAX_CM)
      );
    });

    if (outOfRangeField) {
      setError(`${outOfRangeField.label} debe estar entre ${BODY_MEASUREMENT_MIN_CM} y ${BODY_MEASUREMENT_MAX_CM} cm.`);
      return;
    }

    const payload = {
      id: entry?.id,
      recordedAtIso: parsedDateTime.toISOString(),
      pechoCm: parseMeasurementNumber(fieldValues.pechoCm),
      cinturaCm: parseMeasurementNumber(fieldValues.cinturaCm),
      caderaCm: parseMeasurementNumber(fieldValues.caderaCm),
      brazoCm: parseMeasurementNumber(fieldValues.brazoCm),
      musloCm: parseMeasurementNumber(fieldValues.musloCm),
      pantorrillaCm: parseMeasurementNumber(fieldValues.pantorrillaCm),
    };

    setError("");
    startSavingTransition(async () => {
      const result =
        mode === "edit"
          ? await updateBodyMeasurementAction(payload)
          : await createBodyMeasurementAction(payload);

      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!entry) {
      return;
    }

    setError("");
    startSavingTransition(async () => {
      const result = await deleteBodyMeasurementAction({ id: entry.id });

      if (!result.ok) {
        setError(result.error ?? "No se pudo eliminar.");
        return;
      }

      onOpenChange(false);
      router.refresh();
    });
  }

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

          <div className="relative z-[110] max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-md overflow-hidden rounded-[1.5rem] border border-white/70 bg-white p-4 shadow-2xl">
            <div className="absolute right-4 top-4 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setIsInstructionsOpen(true)}
                aria-label="Ver instrucciones de medición"
              >
                <CircleHelp className="size-4" />
              </Button>

              <button
                type="button"
                className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
            </div>

            <DialogHeader className="pr-16 pt-1">
              <DialogTitle className="text-2xl text-slate-950">{title}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Guarda tus medidas corporales con el mismo estilo limpio del progreso.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid max-h-[calc(100dvh-14rem)] gap-4 overflow-y-auto pr-1 pb-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <GoalsDatePickerField valueIso={`${dateValue}T00:00:00.000Z`} onChange={(value) => setDateValue(value)} label="Fecha" />

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

              <Separator />

              <div className="grid gap-3">
                {BODY_MEASUREMENT_FIELDS.map((field) => (
                  <label key={field.key} className="grid gap-2 text-sm font-medium text-slate-900">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Scale className="size-4" />
                      {field.label}
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.0"
                      maxLength={5}
                      value={fieldValues[field.key]}
                      onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 text-lg font-medium tracking-tight"
                    />
                    <p className="text-xs font-medium text-slate-400">Rango: {rangeLabel}</p>
                  </label>
                ))}
              </div>

              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

              <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vista previa</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  {BODY_MEASUREMENT_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm">
                      <span className="text-slate-500">{field.shortLabel}</span>
                      <span className="font-semibold text-slate-950">{formatMeasurementValue(parseMeasurementNumber(fieldValues[field.key]))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 bg-slate-50/90 pt-4">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
                disabled={isSaving}
                onClick={() => void handleSave()}
              >
                {submitLabel}
              </Button>

              {mode === "edit" ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 h-11 w-full rounded-2xl text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  disabled={isSaving}
                  onClick={() => void handleDelete()}
                >
                  <Trash2 className="size-4" />
                  Eliminar
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>

      <Dialog open={isInstructionsOpen} onOpenChange={setIsInstructionsOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md rounded-[1.5rem] border border-white/70 bg-white/95 p-0 shadow-2xl">
          <DialogHeader className="px-5 pt-5 pr-12">
            <DialogTitle className="text-lg uppercase tracking-[0.18em] text-slate-900">Cómo medirse</DialogTitle>
            <DialogDescription>
              Mantén la cinta recta, sin apretar demasiado, y repite la medición siempre en condiciones parecidas.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-5 pb-5 pt-3">
            {BODY_MEASUREMENT_FIELDS.map((field, index) => (
              <div key={field.key} className="grid gap-2 rounded-[1.25rem] bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">
                    {index + 1}. {field.label}
                  </p>
                </div>
                <p className="text-sm leading-6 text-slate-600">{field.instruction}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
