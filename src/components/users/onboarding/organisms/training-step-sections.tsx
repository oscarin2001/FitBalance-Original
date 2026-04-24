"use client";

import { Check, type LucideIcon } from "lucide-react";

import { activityOptions, trainingTypeOptions } from "@/actions/server/users/onboarding/constants";
import type {
  ActivityValue,
  TrainingDraft,
  TrainingTypeValue,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import type { TrainingErrors } from "../templates/steps/validators";
import { trainingTypeCopy } from "./training-step-copy";

const trainingFrequencyOptions: Array<{ value: number; label: string }> = [
  { value: 2, label: "1-2 días" },
  { value: 4, label: "3-4 días" },
  { value: 6, label: "5-7 días" },
];

type SectionProps = {
  value: TrainingDraft;
  fieldErrors?: TrainingErrors;
  onChange: (value: TrainingDraft) => void;
  onClearFieldError: (field: keyof TrainingDraft) => void;
};

function updateTrainingDraft(value: TrainingDraft, patch: Partial<TrainingDraft>): TrainingDraft {
  return { ...value, ...patch };
}

export function TrainingActivitySection({ value, fieldErrors, onChange, onClearFieldError }: SectionProps) {
  function setActivity(nextActivity: ActivityValue) {
    onChange(updateTrainingDraft(value, { nivelActividad: nextActivity }));
    onClearFieldError("nivelActividad");
  }

  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <Label className="text-sm font-semibold text-slate-950">Movimiento diario</Label>
      </div>
      <RadioGroup
        value={value.nivelActividad}
        onValueChange={(nextActivity) => setActivity(nextActivity as ActivityValue)}
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      >
        {activityOptions.map((option) => {
          const selected = value.nivelActividad === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "grid cursor-pointer gap-3 rounded-2xl border bg-white p-4 transition-all",
                selected
                  ? "border-emerald-300 bg-emerald-50/80 shadow-sm shadow-emerald-100"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <span className="font-semibold text-slate-950">{option.label}</span>
                </div>
                {selected ? <Check className="size-4 text-emerald-600" /> : null}
              </div>
            </label>
          );
        })}
      </RadioGroup>
      {fieldErrors?.nivelActividad ? <p className="text-sm text-red-600">{fieldErrors.nivelActividad}</p> : null}
    </section>
  );
}

export function TrainingTypeSection({ value, fieldErrors, onChange, onClearFieldError }: SectionProps) {
  function setTrainingType(nextType: TrainingTypeValue) {
    const nextValue =
      nextType === "No_entrena"
        ? updateTrainingDraft(value, { tipoEntrenamiento: nextType, frecuenciaEntreno: 0, anosEntrenando: 0 })
        : updateTrainingDraft(
            value,
            {
              tipoEntrenamiento: nextType,
              frecuenciaEntreno: value.frecuenciaEntreno === 0 ? 2 : value.frecuenciaEntreno,
            }
          );

    onChange(nextValue);
    onClearFieldError("tipoEntrenamiento");
    onClearFieldError("frecuenciaEntreno");
    onClearFieldError("anosEntrenando");
  }

  return (
    <section className="grid gap-3">
      <div className="grid gap-1">
        <Label className="text-sm font-semibold text-slate-950">Tipo de entrenamiento</Label>
      </div>
      <RadioGroup
        value={value.tipoEntrenamiento}
        onValueChange={(nextType) => setTrainingType(nextType as TrainingTypeValue)}
        className="grid gap-3 sm:grid-cols-2"
      >
        {trainingTypeOptions.map((option) => {
          const copy = trainingTypeCopy[option.value];
          const selected = value.tipoEntrenamiento === option.value;
          const Icon = copy.icon as LucideIcon;

          return (
            <label
              key={option.value}
              className={cn(
                "grid cursor-pointer gap-3 rounded-2xl border bg-white p-4 transition-all",
                selected
                  ? "border-emerald-300 bg-emerald-50/80 shadow-sm shadow-emerald-100"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={option.value} className="mt-1 shrink-0" />
                  <span className="flex items-center gap-2 font-semibold text-slate-950">
                    <Icon className="size-4 text-emerald-600" />
                    {option.label}
                  </span>
                </div>
                {selected ? <Check className="size-4 text-emerald-600" /> : null}
              </div>
            </label>
          );
        })}
      </RadioGroup>
      {fieldErrors?.tipoEntrenamiento ? <p className="text-sm text-red-600">{fieldErrors.tipoEntrenamiento}</p> : null}
    </section>
  );
}

export function TrainingNumbersSection({ value, fieldErrors, onChange, onClearFieldError }: SectionProps) {
  function setRangeField(field: "frecuenciaEntreno" | "anosEntrenando", nextValue: number) {
    onChange(updateTrainingDraft(value, { [field]: nextValue }));
    onClearFieldError(field);
  }

  function setYears(nextValue: string) {
    const parsed = Number(nextValue.replace(",", "."));
    onChange(updateTrainingDraft(value, { anosEntrenando: Number.isNaN(parsed) ? 0 : Math.max(0, parsed) }));
    onClearFieldError("anosEntrenando");
  }

  if (value.tipoEntrenamiento === "No_entrena") {
    return null;
  }

  return (
    <section className="grid gap-5 sm:grid-cols-2">
      <div className="grid gap-3">
        <Label className="text-sm font-semibold text-slate-950">Frecuencia semanal</Label>
        <RadioGroup
          value={String(value.frecuenciaEntreno || 0)}
          onValueChange={(nextValue) => setRangeField("frecuenciaEntreno", Number(nextValue))}
          className="grid gap-3 sm:grid-cols-3"
        >
          {trainingFrequencyOptions.map((option) => {
            const selected = value.frecuenciaEntreno === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  "grid cursor-pointer gap-3 rounded-2xl border bg-white p-4 transition-all",
                  selected
                  ? "border-emerald-300 bg-emerald-50/80 shadow-sm shadow-emerald-100"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={String(option.value)} className="sr-only" />
                    <span className="font-semibold text-slate-950">{option.label}</span>
                  </div>
                  {selected ? <Check className="size-4 text-emerald-600" /> : null}
                </div>
              </label>
            );
          })}
        </RadioGroup>
        {fieldErrors?.frecuenciaEntreno ? <p className="text-sm text-red-600">{fieldErrors.frecuenciaEntreno}</p> : null}
      </div>

      <div className="grid gap-3">
        <Label htmlFor="training-years" className="text-sm font-semibold text-slate-950">
          Años entrenando
        </Label>
        <Input
          id="training-years"
          type="number"
          min={0}
          max={60}
          step={0.5}
          inputMode="decimal"
          value={value.anosEntrenando}
          onChange={(event) => setYears(event.target.value)}
          className="h-12 rounded-2xl border-slate-200 bg-white px-4"
        />
        {fieldErrors?.anosEntrenando ? <p className="text-sm text-red-600">{fieldErrors.anosEntrenando}</p> : null}
      </div>
    </section>
  );
}
