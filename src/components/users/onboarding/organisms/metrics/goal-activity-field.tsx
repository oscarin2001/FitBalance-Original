import type { UseFormReturn } from "react-hook-form";

import { activityOptions } from "@/actions/server/users/onboarding/constants";
import type {
  ActivityValue,
  MetricsDraft,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import type { MetricsFormValues } from "@/actions/server/users/onboarding/logic";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { MetricsStepFormFieldErrors } from "./metrics-step-types";

const activityDescriptions: Partial<Record<ActivityValue, string>> = {
  Sedentario: "Poco movimiento fuera de casa o del trabajo.",
  Ligero: "Te mueves algo, pero entrenas de forma esporadica.",
  Moderado: "Tienes actividad varios dias a la semana.",
  Activo: "Entrenas o te mantienes en movimiento casi todos los dias.",
  Extremo: "Tu rutina tiene mucha demanda fisica o entrenas con alta frecuencia.",
};

type GoalActivityFieldProps = {
  form: UseFormReturn<MetricsFormValues>;
  fieldErrors?: MetricsStepFormFieldErrors;
  onClearError: (field: keyof MetricsDraft) => void;
  onAdvance: () => void;
};

function getFieldErrorMessage(
  errors: MetricsStepFormFieldErrors | undefined,
  field: keyof MetricsDraft
) {
  return errors?.[field];
}

export function GoalActivityField({
  form,
  fieldErrors,
  onClearError,
  onAdvance,
}: GoalActivityFieldProps) {
  return (
    <FormField
      control={form.control}
      name="nivelActividad"
      render={({ field }) => (
        <FormItem className="grid gap-3">
          <FormLabel>Actividad diaria</FormLabel>
          <div role="radiogroup" aria-label="Actividad diaria" className="grid gap-3 sm:grid-cols-2">
            {activityOptions.map((option) => {
              const selected = field.value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    field.onChange(option.value);
                    onClearError("nivelActividad");
                    window.requestAnimationFrame(onAdvance);
                  }}
                  className={cn(
                    "grid gap-2 rounded-2xl border px-4 py-3 text-left transition-all",
                    selected
                      ? "border-cyan-300 bg-cyan-50 shadow-sm shadow-cyan-100"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-950">{option.label}</span>
                    {selected ? (
                      <Badge variant="outline" className="rounded-full border-cyan-300 bg-white text-cyan-700">
                        Elegido
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-700">
                    {activityDescriptions[option.value] ?? "Selecciona este nivel si encaja con tu rutina diaria."}
                  </p>
                </button>
              );
            })}
          </div>
          <FormMessage>{getFieldErrorMessage(fieldErrors, "nivelActividad")}</FormMessage>
        </FormItem>
      )}
    />
  );
}
