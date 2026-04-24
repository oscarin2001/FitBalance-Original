import type { UseFormReturn } from "react-hook-form";

import type {
  MetricsFormValues,
  WeightUnit,
} from "@/actions/server/users/onboarding/logic/client";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";

import { TargetWeightDialog } from "./target-weight-dialog";

type TargetWeightDialogControllerProps = {
  form: UseFormReturn<MetricsFormValues>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  weightUnit: WeightUnit;
  manualTargetInput: string;
  weightLimits: { min: number; max: number; step: number };
  suggestedTargetDisplay: number;
  onManualTargetInputChange: (value: string) => void;
  onClearFieldError: (field: keyof MetricsDraft) => void;
};

export function TargetWeightDialogController({
  form,
  isOpen,
  onOpenChange,
  weightUnit,
  manualTargetInput,
  weightLimits,
  suggestedTargetDisplay,
  onManualTargetInputChange,
  onClearFieldError,
}: TargetWeightDialogControllerProps) {
  const targetWeightError = form.formState.errors.pesoObjetivoManual?.message;

  function formatTargetInput(value: number) {
    return String(Math.max(1, Math.round(value)));
  }

  return (
    <TargetWeightDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      weightUnit={weightUnit}
      manualTargetInput={manualTargetInput}
      weightLimits={weightLimits}
      suggestedTargetDisplay={suggestedTargetDisplay}
      errorMessage={targetWeightError}
      onManualTargetInputChange={onManualTargetInputChange}
      onUseSuggestedTarget={() => {
        form.setValue("usarObjetivoSugerido", true, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        form.setValue("pesoObjetivoManual", formatTargetInput(suggestedTargetDisplay), {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        form.clearErrors("pesoObjetivoManual");
        onClearFieldError("pesoObjetivoKg");
        onOpenChange(false);
      }}
      onSaveManualTarget={async () => {
        form.setValue("usarObjetivoSugerido", false, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: false,
        });
        form.setValue("pesoObjetivoManual", manualTargetInput, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: false,
        });
        const isValid = await form.trigger("pesoObjetivoManual", { shouldFocus: true });

        if (!isValid) {
          return;
        }

        form.clearErrors("pesoObjetivoManual");
        onClearFieldError("pesoObjetivoKg");
        onOpenChange(false);
      }}
    />
  );
}
