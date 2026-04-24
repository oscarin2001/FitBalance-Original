"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Scale, Target, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  buildMetricsDraftFromForm,
  createMetricsFormValues,
  metricsSubsteps,
  type HeightUnit,
  type MetricsFormValues,
  type WeightUnit,
} from "@/actions/server/users/onboarding/logic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { GoalStepSection } from "./metrics/goal-step-section";
import { metricsFormSchema } from "./metrics/metrics-form-schema";
import { type MetricsStepFormProps } from "./metrics/metrics-step-types";
import { PersonalStepSection } from "./metrics/personal-step-section";
import { TargetWeightDialogController } from "./metrics/target-weight-dialog-controller";
import { useMetricsStepController } from "./metrics/use-metrics-step-controller";
import { WeightStepSection } from "./metrics/weight-step-section";

export function MetricsStepForm({
  value,
  isPending,
  fieldErrors,
  errorMessage,
  submitLabel,
  onChange,
  onClearFieldError,
  onContinue,
}: MetricsStepFormProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [isTargetDialogOpen, setTargetDialogOpen] = useState(false);
  const [manualTargetInput, setManualTargetInput] = useState("");
  const form = useForm<MetricsFormValues>({
    resolver: zodResolver(metricsFormSchema),
    mode: "onTouched",
    defaultValues: createMetricsFormValues(value, { heightUnit, weightUnit }),
  });

  const {
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
  } = useMetricsStepController({
    form,
    value,
    fieldErrors,
    stepIndex,
    heightUnit,
    weightUnit,
    onChange,
  });
  function handleUnitChange(nextHeightUnit: HeightUnit, nextWeightUnit: WeightUnit) {
    const nextDraft = buildMetricsDraftFromForm(form.getValues(), { heightUnit, weightUnit });
    setHeightUnit(nextHeightUnit);
    setWeightUnit(nextWeightUnit);
    form.reset(
      createMetricsFormValues(nextDraft, {
        heightUnit: nextHeightUnit,
        weightUnit: nextWeightUnit,
      })
    );
  }

  function handlePrimaryAction() {
    if (activeStepIndex < metricsSubsteps.length - 1) {
      void validateAndRun(() =>
        setStepIndex(Math.min(activeStepIndex + 1, metricsSubsteps.length - 1))
      );
      return;
    }

    void validateAndRun(() => onContinue(previewMetrics));
  }

  return (
    <>
      <Card className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.4)] backdrop-blur">
            <CardHeader className="gap-2 border-b border-slate-200/70 pb-5">
          <CardTitle className="flex items-center gap-2 text-2xl tracking-tight text-slate-950">
            {currentStep.key === "personal" ? (
              <UserRound className="size-5 text-emerald-700" />
            ) : currentStep.key === "measurements" ? (
              <Scale className="size-5 text-emerald-700" />
            ) : (
              <Target className="size-5 text-emerald-700" />
            )}
            {currentStep.title}
          </CardTitle>
        </CardHeader>
        <Form {...form}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handlePrimaryAction();
            }}
          >
            <CardContent className="grid gap-6 py-6">
              {activeStepIndex === 0 ? (
                <PersonalStepSection
                  form={form}
                  fieldErrors={fieldErrors}
                  heightUnit={heightUnit}
                  onHeightUnitChange={(nextUnit) => handleUnitChange(nextUnit, weightUnit)}
                  onClearError={onClearFieldError}
                />
              ) : null}
              {activeStepIndex === 1 ? (
                <WeightStepSection
                  form={form}
                  fieldErrors={fieldErrors}
                  weightUnit={weightUnit}
                  healthyRange={healthyRange}
                  healthyStatus={healthyStatus}
                  onWeightUnitChange={(nextUnit) => handleUnitChange(heightUnit, nextUnit)}
                  onClearError={onClearFieldError}
                />
              ) : null}
              {activeStepIndex === 2 ? (
                <GoalStepSection
                  form={form}
                  fieldErrors={fieldErrors}
                  objective={objective}
                  helperCopy={helperCopy}
                  weightUnit={weightUnit}
                  resolvedTargetDisplay={resolvedTargetDisplay}
                  suggestedTargetDisplay={suggestedTargetDisplay}
                  isUsingSuggested={watchedValues.usarObjetivoSugerido}
                  targetError={targetError}
                  onOpenTargetEditor={() => {
                    setManualTargetInput(String(Math.max(1, Math.round(resolvedTargetDisplay))));
                    setTargetDialogOpen(true);
                  }}
                  onClearError={onClearFieldError}
                />
              ) : null}
              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
            </CardContent>
            <CardFooter className={activeStepIndex === 0 ? "grid gap-3" : "grid grid-cols-2 gap-3"}>
              {activeStepIndex > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                  disabled={isPending}
                  onClick={() => {
                    setStepIndex(Math.max(activeStepIndex - 1, 0));
                  }}
                >
                  <ArrowLeft className="size-4" />
                  Volver
                </Button>
              ) : null}
              <Button
                type="submit"
                className="h-12 rounded-2xl bg-emerald-500 text-white shadow-[0_18px_30px_-20px_rgba(16,185,129,0.95)] hover:bg-emerald-600"
                disabled={isPending}
              >
                {isPending ? "Continuando..." : submitLabel}
                <ArrowRight className="size-4" />
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <TargetWeightDialogController
        form={form}
        isOpen={isTargetDialogOpen}
        onOpenChange={setTargetDialogOpen}
        weightUnit={weightUnit}
        manualTargetInput={manualTargetInput}
        weightLimits={weightLimits}
        suggestedTargetDisplay={suggestedTargetDisplay}
        onManualTargetInputChange={setManualTargetInput}
        onClearFieldError={onClearFieldError}
      />
    </>
  );
}
