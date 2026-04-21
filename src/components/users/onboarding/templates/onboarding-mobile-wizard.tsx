"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type {
  FoodsDraft,
  MetricsDraft,
  WizardStep,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { onboardingDays } from "@/actions/server/users/onboarding/constants";
import {
  finalizeOnboardingAction,
  saveOnboardingFoodPreferencesAction,
  saveOnboardingMetricsAction,
} from "@/actions/server/users/onboarding";
import { FoodsStepForm } from "@/components/users/onboarding/organisms/foods-step-form";
import { ProgressBanner } from "@/components/users/onboarding/molecules/progress-banner";
import { MetricsStepForm } from "@/components/users/onboarding/organisms/metrics-step-form";
import { SummaryStepCard } from "@/components/users/onboarding/organisms/summary-step-card";

type OnboardingMobileWizardProps = {
  userName: string;
  initialStep: WizardStep;
  initialMetrics: MetricsDraft;
  initialFoods: FoodsDraft;
};

type MetricsErrors = Partial<Record<keyof MetricsDraft, string>>;
type FoodsErrors = {
  preferencias?: string;
};

const NAME_PATTERN = /^[A-Za-z\u00C0-\u024F' -]+$/;

function validateMetricsDraft(value: MetricsDraft): MetricsErrors {
  const errors: MetricsErrors = {};
  const birthDate = new Date(value.fechaNacimiento);

  if (!value.nombre.trim()) {
    errors.nombre = "Ingresa tu nombre.";
  } else if (value.nombre.trim().length < 2 || !NAME_PATTERN.test(value.nombre.trim())) {
    errors.nombre = "Nombre invalido.";
  }

  if (!value.apellido.trim()) {
    errors.apellido = "Ingresa tu apellido.";
  } else if (value.apellido.trim().length < 2 || !NAME_PATTERN.test(value.apellido.trim())) {
    errors.apellido = "Apellido invalido.";
  }

  if (!value.fechaNacimiento || Number.isNaN(birthDate.getTime())) {
    errors.fechaNacimiento = "Selecciona una fecha de nacimiento valida.";
  } else {
    const age = Math.max(0, new Date().getFullYear() - birthDate.getFullYear());
    if (age < 14 || age > 90) {
      errors.fechaNacimiento = "La edad permitida es entre 14 y 90 anos.";
    }
  }

  if (!value.sexo.trim()) {
    errors.sexo = "Ingresa tu sexo.";
  }

  if (value.alturaCm < 120 || value.alturaCm > 230) {
    errors.alturaCm = "Altura valida: 120 a 230 cm.";
  }

  if (value.pesoKg < 35 || value.pesoKg > 250) {
    errors.pesoKg = "Peso valido: 35 a 250 kg.";
  }

  if (value.pesoObjetivoKg < 35 || value.pesoObjetivoKg > 250) {
    errors.pesoObjetivoKg = "Meta valida: 35 a 250 kg.";
  }

  if (value.objetivo === "Bajar_grasa" && value.pesoObjetivoKg >= value.pesoKg) {
    errors.pesoObjetivoKg = "Para bajar grasa, la meta debe ser menor al peso actual.";
  }

  if (value.objetivo === "Ganar_musculo" && value.pesoObjetivoKg <= value.pesoKg) {
    errors.pesoObjetivoKg = "Para ganar musculo, la meta debe ser mayor al peso actual.";
  }

  return errors;
}

function validateFoodsDraft(value: FoodsDraft): FoodsErrors {
  const errors: FoodsErrors = {};

  const selectedFoodsCount = Object.values(value.preferencias).reduce(
    (acc, foods) => acc + foods.length,
    0
  );

  if (selectedFoodsCount < 6) {
    errors.preferencias = "Selecciona al menos 6 alimentos para continuar.";
  }

  return errors;
}

export function OnboardingMobileWizard({
  userName,
  initialStep,
  initialMetrics,
  initialFoods,
}: OnboardingMobileWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [metrics, setMetrics] = useState<MetricsDraft>(initialMetrics);
  const [foods, setFoods] = useState<FoodsDraft>(initialFoods);
  const [metricsErrors, setMetricsErrors] = useState<MetricsErrors>({});
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

      router.replace("/users");
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
            submitLabel="Guardar y continuar"
            backLabel="Volver"
            onChange={setMetrics}
            onClearFieldError={(field) =>
              setMetricsErrors((prev) => ({ ...prev, [field]: undefined }))
            }
            onBack={() => router.push("/users")}
            onContinue={handleMetricsSubmit}
          />
        ) : null}

        {step === "foods" ? (
          <FoodsStepForm
            value={foods}
            isPending={isPending}
            fieldErrors={foodsErrors}
            errorMessage={message}
            onBack={() => setStep("metrics")}
            onContinue={handleFoodsSubmit}
            onToggleFood={handleToggleFood}
          />
        ) : null}

        {step === "summary" ? (
          <SummaryStepCard
            metrics={metrics}
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
