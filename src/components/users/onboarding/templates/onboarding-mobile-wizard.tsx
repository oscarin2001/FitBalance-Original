"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { FoodsDraft, MetricsDraft, TrainingDraft, WizardStep } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { onboardingDays } from "@/actions/server/users/onboarding/constants";
import {
  finalizeOnboardingAction,
  saveOnboardingFoodPreferencesAction,
  saveOnboardingTrainingAction,
  saveOnboardingMetricsAction,
} from "@/actions/server/users/onboarding";
import { FoodsStepForm } from "@/components/users/onboarding/organisms/foods-step-form";
import { ProgressBanner } from "@/components/users/onboarding/molecules/progress-banner";
import { MetricsStepForm } from "@/components/users/onboarding/organisms/metrics-step-form";
import { TrainingStepForm } from "@/components/users/onboarding/organisms/training-step-form";
import { SummaryStepCard } from "@/components/users/onboarding/organisms/summary-step-card";
import {
  validateFoodsDraft,
  validateMetricsDraft,
  validateTrainingDraft,
  type FoodsErrors,
  type MetricsErrors,
  type TrainingErrors,
} from "./steps/validators";

type OnboardingMobileWizardProps = {
  initialStep: WizardStep;
  initialMetrics: MetricsDraft;
  initialTraining: TrainingDraft;
  initialFoods: FoodsDraft;
};
export function OnboardingMobileWizard({
  initialStep,
  initialMetrics,
  initialTraining,
  initialFoods,
}: OnboardingMobileWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [metrics, setMetrics] = useState<MetricsDraft>(initialMetrics);
  const [training, setTraining] = useState<TrainingDraft>(initialTraining);
  const [foods, setFoods] = useState<FoodsDraft>(initialFoods);
  const [metricsErrors, setMetricsErrors] = useState<MetricsErrors>({});
  const [trainingErrors, setTrainingErrors] = useState<TrainingErrors>({});
  const [foodsErrors, setFoodsErrors] = useState<FoodsErrors>({});
  const [message, setMessage] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  function handleMetricsSubmit(nextMetrics: MetricsDraft) {
    setMetrics(nextMetrics);
    const errors = validateMetricsDraft(nextMetrics);
    if (Object.keys(errors).length > 0) {
      setMetricsErrors(errors);
      setMessage("Corrige los campos marcados para continuar.");
      return;
    }

    setMetricsErrors({});
    setMessage("");

    startTransition(async () => {
      const result = await saveOnboardingMetricsAction(nextMetrics);
      if (!result.ok) {
        setMessage(result.error ?? "No se pudo guardar metricas.");
        return;
      }

      setMessage("");
      setStep("training");
    });
  }
  function handleTrainingSubmit(nextTraining: TrainingDraft) {
    setTraining(nextTraining);
    const errors = validateTrainingDraft(nextTraining);
    if (Object.keys(errors).length > 0) {
      setTrainingErrors(errors);
      setMessage("Corrige los campos marcados para continuar.");
      return;
    }

    setTrainingErrors({});
    setMessage("");

    startTransition(async () => {
      const result = await saveOnboardingTrainingAction(nextTraining);
      if (!result.ok) {
        setMessage(result.error ?? "No se pudo guardar entrenamiento.");
        return;
      }

      setMessage("");
      setStep("foods");
    });
  }
  function handleToggleFood(category: string, food: string) {
    setFoods((prev) => {
      const selectedFoods = prev.preferencias[category] ?? [];
      const nextFoods = selectedFoods.includes(food)
        ? selectedFoods.filter((item) => item !== food)
        : [...selectedFoods, food];

      return {
        ...prev,
        preferencias: {
          ...prev.preferencias,
          [category]: nextFoods,
        },
      };
    });

    setFoodsErrors((prev) => ({ ...prev, preferencias: undefined }));
  }
  function handleFoodsSubmit() {
    const errors = validateFoodsDraft(foods);
    if (errors.preferencias) {
      setFoodsErrors(errors);
      setMessage("Completa las preferencias de comida para continuar.");
      return;
    }

    setFoodsErrors({});
    setMessage("");

    startTransition(async () => {
      const result = await saveOnboardingFoodPreferencesAction({
        ...foods,
        diasDieta: [...onboardingDays],
      });
      if (!result.ok) {
        setMessage(result.error ?? "No se pudo guardar preferencias.");
        return;
      }

      setMessage("");
      setStep("summary");
    });
  }
  function handleFinish() {
    startTransition(async () => {
      const result = await finalizeOnboardingAction();
      if (!result.ok) {
        setMessage(result.error ?? "No se pudo completar el paso final.");
        return;
      }

      router.replace("/users?pdf=1");
    });
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-16 size-52 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute right-0 top-1/2 size-64 rounded-full bg-teal-200/35 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-md gap-4 p-4 pb-8 pt-8">
        <ProgressBanner step={step} />

        {step === "metrics" ? (
          <MetricsStepForm
            value={metrics}
            isPending={isPending}
            fieldErrors={metricsErrors}
            errorMessage={message}
            submitLabel="Continuar"
            backLabel="Volver"
            onChange={setMetrics}
            onClearFieldError={(field) =>
              setMetricsErrors((prev) => ({ ...prev, [field]: undefined }))
            }
            onBack={() => router.push("/users")}
            onContinue={handleMetricsSubmit}
          />
        ) : null}

        {step === "training" ? (
          <TrainingStepForm
            value={training}
            isPending={isPending}
            fieldErrors={trainingErrors}
            errorMessage={message}
            submitLabel="Continuar"
            backLabel="Volver"
            onChange={setTraining}
            onClearFieldError={(field) =>
              setTrainingErrors((prev) => ({ ...prev, [field]: undefined }))
            }
            onBack={() => setStep("metrics")}
            onContinue={handleTrainingSubmit}
          />
        ) : null}

        {step === "foods" ? (
          <FoodsStepForm
            value={foods}
            isPending={isPending}
            fieldErrors={foodsErrors}
            errorMessage={message}
            onBack={() => setStep("training")}
            onContinue={handleFoodsSubmit}
            onToggleFood={handleToggleFood}
          />
        ) : null}

        {step === "summary" ? (
          <SummaryStepCard
            metrics={metrics}
            training={training}
            isPending={isPending}
            errorMessage={message}
            onBack={() => setStep("foods")}
            onFinish={handleFinish}
          />
        ) : null}
      </div>
    </main>
  );
}
