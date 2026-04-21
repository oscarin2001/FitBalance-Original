import type { UseFormReturn } from "react-hook-form";

import { objectiveOptions } from "@/actions/server/users/onboarding/constants";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import type { MetricsFormValues } from "@/actions/server/users/onboarding/logic";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

import { objectiveDescriptions } from "./metrics-form-schema";
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
          <FormLabel>Objetivo</FormLabel>
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
              className="grid gap-3"
            >
              {objectiveOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "grid gap-1 rounded-2xl border px-4 py-4 transition",
                    field.value === option.value
                      ? "border-cyan-300 bg-cyan-50/80 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={option.value}
                        className="size-5 border-cyan-300 data-checked:border-cyan-600 data-checked:bg-cyan-600"
                      />
                      <span className="font-medium text-slate-950">{option.label}</span>
                    </div>
                    {field.value === option.value ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-cyan-300 bg-white text-cyan-700"
                      >
                        Elegido
                      </Badge>
                    ) : null}
                  </div>
                  <span className="pl-7 text-sm text-slate-600">
                    {objectiveDescriptions[option.value]}
                  </span>
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
