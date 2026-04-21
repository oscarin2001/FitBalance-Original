import { Info } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import {
  displayWeight,
  type MetricsFormValues,
  type WeightUnit,
} from "@/actions/server/users/onboarding/logic";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { MetricsStepFormFieldErrors } from "./metrics-step-types";

type HealthyStatus = "within" | "above" | "below" | "unknown";

type WeightStepSectionProps = {
  form: UseFormReturn<MetricsFormValues>;
  fieldErrors?: MetricsStepFormFieldErrors;
  weightUnit: WeightUnit;
  healthyRange: {
    minKg: number;
    maxKg: number;
  };
  healthyStatus: HealthyStatus;
  onWeightUnitChange: (nextUnit: WeightUnit) => void;
  onClearError: (field: keyof MetricsDraft) => void;
};

const statusCopy: Record<HealthyStatus, string> = {
  within: "Dentro del rango",
  above: "Por encima del rango",
  below: "Por debajo del rango",
  unknown: "Rango pendiente",
};

function getStatusBadgeClass(status: HealthyStatus) {
  if (status === "within") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "above") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "below") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getFieldErrorMessage(
  errors: MetricsStepFormFieldErrors | undefined,
  field: keyof MetricsDraft
) {
  return errors?.[field];
}

export function WeightStepSection({
  form,
  fieldErrors,
  weightUnit,
  healthyRange,
  healthyStatus,
  onWeightUnitChange,
  onClearError,
}: WeightStepSectionProps) {
  return (
    <section className="grid gap-5">
      <FormField
        control={form.control}
        name="pesoActual"
        render={({ field }) => (
          <FormItem className="grid gap-3">
            <FormLabel>Peso actual</FormLabel>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_132px]">
              <FormControl>
                <Input
                  {...field}
                  inputMode="decimal"
                  placeholder={weightUnit === "kg" ? "72.5" : "160"}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                  onChange={(event) => {
                    field.onChange(event.target.value.replace(/[^\d.]/g, ""));
                    onClearError("pesoKg");
                  }}
                />
              </FormControl>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-1">
                {(["kg", "lb"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className={cn(
                      "h-10 rounded-xl text-sm font-medium transition",
                      weightUnit === unit
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                    onClick={() => onWeightUnitChange(unit)}
                  >
                    {unit.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <FormMessage>{getFieldErrorMessage(fieldErrors, "pesoKg")}</FormMessage>
          </FormItem>
        )}
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <span>Rango estimado saludable:</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
                />
              }
            >
              <Info className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              Referencia orientativa basada en el rango BMI adulto 18.5-24.9.
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">
            {healthyRange.minKg > 0
              ? `${displayWeight(healthyRange.minKg, weightUnit)} - ${displayWeight(
                  healthyRange.maxKg,
                  weightUnit
                )} ${weightUnit}`
              : "Completa tu altura para calcularlo"}
          </span>
          <Badge variant="outline" className={cn("rounded-full", getStatusBadgeClass(healthyStatus))}>
            {statusCopy[healthyStatus]}
          </Badge>
        </div>
      </div>
    </section>
  );
}
