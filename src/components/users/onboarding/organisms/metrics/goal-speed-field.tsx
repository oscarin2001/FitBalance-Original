import type { UseFormReturn } from "react-hook-form";

import {
  type MetricsFormValues,
} from "@/actions/server/users/onboarding/logic";
import {
  speedGuides,
  speedOptions,
} from "@/actions/server/users/onboarding/constants";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { Badge } from "@/components/ui/badge";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import type { MetricsStepFormFieldErrors } from "./metrics-step-types";

type GoalSpeedFieldProps = {
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

export function GoalSpeedField({
  form,
  fieldErrors,
  onClearError,
  onAdvance,
}: GoalSpeedFieldProps) {
  return (
    <FormField
      control={form.control}
      name="velocidadCambio"
      render={({ field }) => (
        <FormItem className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <FormLabel>Velocidad</FormLabel>
            <span className="text-sm font-medium text-slate-700">
              {speedGuides[field.value].title}
            </span>
          </div>
          <div
            role="radiogroup"
            aria-label="Velocidad de cambio"
            className="grid gap-3 sm:grid-cols-3"
          >
            {speedOptions.map((option) => {
              const selected = field.value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    field.onChange(option.value);
                    onClearError("velocidadCambio");
                    onClearError("pesoObjetivoKg");
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
                    {speedGuides[option.value].weeklyChange}
                  </p>
                  <p className="text-xs leading-5 text-slate-600">
                    {speedGuides[option.value].summary}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{speedGuides[field.value].recommendedFor}</p>
            <p className="mt-1 text-slate-700">
              Puedes ajustar esta velocidad cuando quieras. El cambio es inmediato.
            </p>
          </div>

          <FormMessage>{getFieldErrorMessage(fieldErrors, "velocidadCambio")}</FormMessage>
        </FormItem>
      )}
    />
  );
}
