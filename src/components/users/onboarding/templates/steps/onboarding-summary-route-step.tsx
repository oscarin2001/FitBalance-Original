"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { finalizeOnboardingAction } from "@/actions/server/users/onboarding/actions/onboarding-actions";
import type { MetricsDraft, TrainingDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { SummaryStepCard } from "@/components/users/onboarding/organisms/summary-step-card";

import { OnboardingStepShell } from "../onboarding-step-shell";

type OnboardingSummaryRouteStepProps = {
  userName: string;
  initialMetrics: MetricsDraft;
  initialTraining: TrainingDraft;
};

export function OnboardingSummaryRouteStep({
  userName,
  initialMetrics,
  initialTraining,
}: OnboardingSummaryRouteStepProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFinish() {
    startTransition(async () => {
      try {
        const result = await finalizeOnboardingAction();

        if (!result.ok) {
          if (result.error?.toLowerCase().includes("sesion")) {
            router.push("/users/login");
            return;
          }

          setMessage(result.error ?? "No se pudo completar el paso final.");
          return;
        }

        router.push("/users?pdf=1");
      } catch {
        setMessage("No se pudo conectar con el servidor. Intenta nuevamente.");
      }
    });
  }

  return (
    <OnboardingStepShell
      step="summary"
      userName={userName}
      title="Confirma y genera tu plan"
      subtitle="Revisa tus datos para generar tu estrategia inicial."
    >
      <SummaryStepCard
        metrics={initialMetrics}
        training={initialTraining}
        isPending={isPending}
        errorMessage={message}
        onBack={() => router.push("/users/onboarding/foods")}
        onFinish={handleFinish}
      />
    </OnboardingStepShell>
  );
}
