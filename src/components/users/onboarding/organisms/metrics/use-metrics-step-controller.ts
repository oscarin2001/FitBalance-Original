import { useEffect, useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  areMetricsDraftsEqual,
  buildMetricsDraftFromForm,
  displayWeight,
  getDraftFieldsForStep,
  getMetricsStepFields,
  getStepIndexFromFieldErrors,
  getWeightLimits,
  mapDraftFieldToFormField,
  metricsSubsteps,
  type HeightUnit,
  type MetricsFormValues,
  type WeightUnit,
} from "@/actions/server/users/onboarding/logic";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import {
  calculateHealthyWeightRangeKg,
  getHealthyWeightStatus,
  getSuggestedTargetCopy,
  getSuggestedTargetWeightKg,
} from "@/lib/nutrition/weight-guidance";

import { validateMetricsDraft } from "../../templates/steps/validators";
import type { MetricsStepFormFieldErrors } from "./metrics-step-types";

type UseMetricsStepControllerArgs = {
  form: UseFormReturn<MetricsFormValues>;
  value: MetricsDraft;
  fieldErrors?: MetricsStepFormFieldErrors;
  stepIndex: number;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  onChange: (value: MetricsDraft) => void;
};

export function useMetricsStepController({
  form,
  value,
  fieldErrors,
  stepIndex,
  heightUnit,
  weightUnit,
  onChange,
}: UseMetricsStepControllerArgs) {
  const watchedValues =
    (useWatch({ control: form.control }) as MetricsFormValues | undefined) ?? form.getValues();
  const objective = watchedValues.objetivo;
  const activeStepIndex = getStepIndexFromFieldErrors(fieldErrors) ?? stepIndex;
  const currentStep = metricsSubsteps[activeStepIndex] ?? metricsSubsteps[0];
  const previewMetrics = useMemo(
    () => buildMetricsDraftFromForm(watchedValues, { heightUnit, weightUnit }),
    [heightUnit, watchedValues, weightUnit]
  );

  const healthyRange = useMemo(
    () => calculateHealthyWeightRangeKg(previewMetrics.alturaCm),
    [previewMetrics.alturaCm]
  );
  const healthyStatus = getHealthyWeightStatus(previewMetrics.pesoKg, previewMetrics.alturaCm);
  const suggestedTargetKg = useMemo(
    () =>
      getSuggestedTargetWeightKg({
        objective,
        currentWeightKg: previewMetrics.pesoKg,
        heightCm: previewMetrics.alturaCm,
        speed: previewMetrics.velocidadCambio,
      }),
    [objective, previewMetrics.alturaCm, previewMetrics.pesoKg, previewMetrics.velocidadCambio]
  );

  const suggestedTargetDisplay = displayWeight(suggestedTargetKg, weightUnit);
  const resolvedTargetDisplay = displayWeight(previewMetrics.pesoObjetivoKg, weightUnit);
  const helperCopy = getSuggestedTargetCopy({
    objective,
    currentWeightKg: previewMetrics.pesoKg,
    heightCm: previewMetrics.alturaCm,
    speed: previewMetrics.velocidadCambio,
  });
  const targetError =
    form.formState.errors.pesoObjetivoManual?.message ?? fieldErrors?.pesoObjetivoKg;
  const weightLimits = getWeightLimits(weightUnit);

  useEffect(() => {
    if (areMetricsDraftsEqual(previewMetrics, value)) {
      return;
    }

    onChange(previewMetrics);
  }, [onChange, previewMetrics, value]);
  useEffect(() => {
    if (objective !== "Mantenimiento" || form.getValues("usarObjetivoSugerido")) {
      return;
    }

    form.setValue("usarObjetivoSugerido", true, { shouldValidate: true });
  }, [form, objective]);

  useEffect(() => {
    if (!watchedValues.usarObjetivoSugerido && objective !== "Mantenimiento") {
      return;
    }

    const nextValue = String(suggestedTargetDisplay);
    if (form.getValues("pesoObjetivoManual") === nextValue) {
      return;
    }

    form.setValue("pesoObjetivoManual", nextValue, { shouldValidate: false });
  }, [form, objective, suggestedTargetDisplay, watchedValues.usarObjetivoSugerido]);

  function applyStepDraftErrors(stepErrors: ReturnType<typeof validateMetricsDraft>) {
    let hasErrors = false;

    for (const field of getDraftFieldsForStep(activeStepIndex)) {
      const message = stepErrors[field];
      if (!message) {
        continue;
      }

      hasErrors = true;
      form.setError(mapDraftFieldToFormField(field), { type: "manual", message });
    }

    return hasErrors;
  }

  async function validateAndRun(onValid: () => void) {
    const isValid = await form.trigger(getMetricsStepFields(activeStepIndex, objective), {
      shouldFocus: true,
    });
    if (!isValid) {
      return;
    }

    const hasDraftErrors = applyStepDraftErrors(
      validateMetricsDraft(buildMetricsDraftFromForm(form.getValues(), { heightUnit, weightUnit }))
    );
    if (!hasDraftErrors) {
      onValid();
    }
  }

  return {
    watchedValues,
    objective,
    activeStepIndex,
    currentStep,
    previewMetrics,
    healthyRange,
    healthyStatus,
    helperCopy,
    targetError,
    weightLimits,
    suggestedTargetDisplay,
    resolvedTargetDisplay,
    validateAndRun,
  };
}
