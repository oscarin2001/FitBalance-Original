import type { UseFormReturn } from "react-hook-form";

import {
  sanitizeNameValue,
  type MetricsFormValues,
} from "@/actions/server/users/onboarding/logic";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { MetricsStepFormFieldErrors } from "./metrics-step-types";

type PersonalNameFieldsProps = {
  form: UseFormReturn<MetricsFormValues>;
  fieldErrors?: MetricsStepFormFieldErrors;
  onClearError: (field: keyof MetricsDraft) => void;
};

function getFieldErrorMessage(
  errors: MetricsStepFormFieldErrors | undefined,
  field: keyof MetricsDraft
) {
  return errors?.[field];
}

export function PersonalNameFields({
  form,
  fieldErrors,
  onClearError,
}: PersonalNameFieldsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <FormField
        control={form.control}
        name="nombre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="given-name"
                placeholder="Juan"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                onChange={(event) => {
                  field.onChange(sanitizeNameValue(event.target.value));
                  onClearError("nombre");
                }}
              />
            </FormControl>
            <FormMessage>{getFieldErrorMessage(fieldErrors, "nombre")}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="apellido"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Apellido</FormLabel>
            <FormControl>
              <Input
                {...field}
                autoComplete="family-name"
                placeholder="Perez"
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                onChange={(event) => {
                  field.onChange(sanitizeNameValue(event.target.value));
                  onClearError("apellido");
                }}
              />
            </FormControl>
            <FormMessage>{getFieldErrorMessage(fieldErrors, "apellido")}</FormMessage>
          </FormItem>
        )}
      />
    </div>
  );
}
