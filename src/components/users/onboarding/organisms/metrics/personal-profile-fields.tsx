import type { UseFormReturn } from "react-hook-form";

import {
  ageOptions,
  getHeightLimits,
  type HeightUnit,
  type MetricsFormValues,
} from "@/actions/server/users/onboarding/logic/client";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { MetricsStepFormFieldErrors } from "./metrics-step-types";

type PersonalProfileFieldsProps = {
  form: UseFormReturn<MetricsFormValues>;
  fieldErrors?: MetricsStepFormFieldErrors;
  heightUnit: HeightUnit;
  onHeightUnitChange: (nextUnit: HeightUnit) => void;
  onClearError: (field: keyof MetricsDraft) => void;
};

function getFieldErrorMessage(
  errors: MetricsStepFormFieldErrors | undefined,
  field: keyof MetricsDraft
) {
  return errors?.[field];
}

export function PersonalProfileFields({
  form,
  fieldErrors,
  heightUnit,
  onHeightUnitChange,
  onClearError,
}: PersonalProfileFieldsProps) {
  const heightLimits = getHeightLimits(heightUnit);

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
      <FormField
        control={form.control}
        name="edad"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Edad</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(nextValue) => {
                  field.onChange(nextValue);
                  onClearError("fechaNacimiento");
                }}
              >
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/70 px-4">
                  <SelectValue placeholder="Edad" />
                </SelectTrigger>
                <SelectContent>
                  {ageOptions.map((age) => (
                    <SelectItem key={age} value={age}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage>{getFieldErrorMessage(fieldErrors, "fechaNacimiento")}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="sexo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sexo</FormLabel>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={(nextValue) => {
                  field.onChange(nextValue);
                  onClearError("sexo");
                }}
              >
                <SelectTrigger className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/70 px-4">
                  <SelectValue placeholder="Selecciona una opcion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Femenino">Femenino</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage>{getFieldErrorMessage(fieldErrors, "sexo")}</FormMessage>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="alturaCm"
        render={({ field }) => (
          <FormItem className="grid gap-3">
            <FormLabel>Altura</FormLabel>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px]">
              <FormControl>
                <Input
                  {...field}
                  inputMode="decimal"
                  min={heightLimits.min}
                  max={heightLimits.max}
                  step={heightLimits.step}
                  placeholder={heightUnit === "cm" ? "170" : "5.58"}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                  onChange={(event) => {
                    field.onChange(event.target.value.replace(/[^\d.]/g, ""));
                    onClearError("alturaCm");
                  }}
                />
              </FormControl>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
                {(["cm", "ft"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className={cn(
                      "h-10 rounded-xl text-sm font-medium transition",
                      heightUnit === unit
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                    onClick={() => onHeightUnitChange(unit)}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <FormMessage>{getFieldErrorMessage(fieldErrors, "alturaCm")}</FormMessage>
          </FormItem>
        )}
      />
    </div>
  );
}
