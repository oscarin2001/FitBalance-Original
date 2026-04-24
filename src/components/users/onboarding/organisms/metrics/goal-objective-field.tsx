import { Check } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { objectiveOptions } from "@/actions/server/users/onboarding/constants";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
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

type GoalObjectiveFieldProps = {
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

export function GoalObjectiveField({
  form,
  fieldErrors,
  onClearError,
  onAdvance,
}: GoalObjectiveFieldProps) {
  return (
    <FormField
      control={form.control}
      name="objetivo"
      render={({ field }) => (
        <FormItem className="grid gap-3">
          <FormLabel>Objetivo principal</FormLabel>
          <FormControl>
            <RadioGroup
              value={field.value}
              onValueChange={(nextValue) => {
                field.onChange(nextValue);
                onClearError("objetivo");
                onClearError("pesoObjetivoKg");
                form.clearErrors("pesoObjetivoManual");
                if (nextValue === "Mantenimiento") {
                  form.setValue("usarObjetivoSugerido", true, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }

                window.requestAnimationFrame(onAdvance);
              }}
              className="grid gap-3 sm:grid-cols-3"
            >
              {objectiveOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "grid cursor-pointer gap-3 rounded-2xl border bg-white p-4 transition-all",
                    field.value === option.value
                      ? "border-emerald-300 bg-emerald-50/80 shadow-sm shadow-emerald-100"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={option.value} className="sr-only" />
                      <span className="font-semibold text-slate-950">{option.label}</span>
                    </div>
                    {field.value === option.value ? <Check className="size-4 text-emerald-600" /> : null}
                  </div>
                </label>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage>{getFieldErrorMessage(fieldErrors, "objetivo")}</FormMessage>
        </FormItem>
      )}
    />
  );
}
