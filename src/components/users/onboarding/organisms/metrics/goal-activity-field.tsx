import { Check } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { activityOptions } from "@/actions/server/users/onboarding/constants";
import type {
  ActivityValue,
  MetricsDraft,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import type { MetricsFormValues } from "@/actions/server/users/onboarding/logic";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import type { MetricsStepFormFieldErrors } from "./metrics-step-types";

const activityDescriptions: Record<ActivityValue, string> = {
  Sedentario: "Casi todo el día sentado.",
  Ligero: "Caminas o te mueves poco.",
  Moderado: "Tienes movimiento frecuente.",
  Activo: "Tu día exige bastante movimiento.",
  Extremo: "Tu actividad física diaria es muy alta.",
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
          <FormLabel>Movimiento diario</FormLabel>
          <p className="text-sm leading-6 text-slate-500">
            Solo cuenta tu movimiento general. El ejercicio estructurado va aparte.
          </p>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={(nextValue) => {
                field.onChange(nextValue);
                onClearError("nivelActividad");
                window.requestAnimationFrame(onAdvance);
              }}
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            >
              {activityOptions.map((option) => {
                const selected = field.value === option.value;

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
                        <div className="grid gap-1">
                          <span className="font-semibold text-slate-950">{option.label}</span>
                          <p className="text-sm leading-5 text-slate-600">
                            {activityDescriptions[option.value]}
                          </p>
                        </div>
                      </div>
                      {selected ? <Check className="size-4 text-emerald-600" /> : null}
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </FormControl>
          <FormMessage>{getFieldErrorMessage(fieldErrors, "nivelActividad")}</FormMessage>
        </FormItem>
      )}
    />
  );
}
