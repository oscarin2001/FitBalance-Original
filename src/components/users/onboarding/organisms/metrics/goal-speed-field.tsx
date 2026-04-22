import { Check } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import {
  type MetricsFormValues,
} from "@/actions/server/users/onboarding/logic";
import {
  speedGuides,
  speedOptions,
} from "@/actions/server/users/onboarding/constants";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
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
          <FormLabel>Velocidad de cambio</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={(nextValue) => {
                field.onChange(nextValue);
                onClearError("velocidadCambio");
                onClearError("pesoObjetivoKg");
                window.requestAnimationFrame(onAdvance);
              }}
              className="grid gap-3 sm:grid-cols-3"
            >
              {speedOptions.map((option) => {
                const selected = field.value === option.value;

                return (
                  <label
                    key={option.value}
                    className={cn(
                      "grid cursor-pointer gap-3 rounded-2xl border bg-white p-4 transition-all",
                      selected
                        ? "border-cyan-300 bg-cyan-50/80 shadow-sm shadow-cyan-100"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={option.value} className="sr-only" />
                        <div className="grid gap-1">
                          <span className="font-semibold text-slate-950">{option.label}</span>
                          <p className="text-sm text-slate-700">
                            {speedGuides[option.value].weeklyChange}
                          </p>
                          <p className="text-sm leading-5 text-slate-600">
                            {speedGuides[option.value].summary}
                          </p>
                        </div>
                      </div>
                      {selected ? <Check className="size-4 text-cyan-600" /> : null}
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </FormControl>

          <FormMessage>{getFieldErrorMessage(fieldErrors, "velocidadCambio")}</FormMessage>
        </FormItem>
      )}
    />
  );
}
