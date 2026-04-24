"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { saveOnboardingMetricsAction } from "@/actions/server/users/onboarding/actions/onboarding-actions";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { MetricsStepForm } from "@/components/users/onboarding/organisms/metrics-step-form";

import { OnboardingStepShell } from "../onboarding-step-shell";
import { useOnboardingDraft } from "../use-onboarding-draft";
import { validateMetricsDraft, type MetricsErrors } from "./validators";

type OnboardingMetricsRouteStepProps = {
  userName: string;
  initialMetrics: MetricsDraft;
};

const METRICS_DRAFT_KEY = "fitbalance:onboarding:metrics:v2";
const mergeMetricsDraft = (base: MetricsDraft, draft: MetricsDraft) => ({ ...base, ...draft });

export function OnboardingMetricsRouteStep({
  userName,
  initialMetrics,
}: OnboardingMetricsRouteStepProps) {
  const router = useRouter();
  const draftKey = useMemo(
    () => `${METRICS_DRAFT_KEY}:${userName.toLowerCase().replace(/\s+/g, "-")}`,
    [userName]
  );
  const [metricsErrors, setMetricsErrors] = useState<MetricsErrors>({});
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { value: metrics, setValue: setMetrics, clearDraft } = useOnboardingDraft({
    storageKey: draftKey,
    initialValue: initialMetrics,
    merge: mergeMetricsDraft,
  });

  async function saveMetricsWithTimeout(nextMetrics: MetricsDraft) {
    const timeoutMessage = "La operacion esta tardando demasiado. Intenta nuevamente.";

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<{ ok: false; error: string }>((resolve) => {
      timeoutHandle = setTimeout(() => {
        resolve({ ok: false, error: timeoutMessage });
      }, 15000);
    });

    try {
      const result = await Promise.race([saveOnboardingMetricsAction(nextMetrics), timeoutPromise]);

      if (!result.ok) {
        if (result.error?.toLowerCase().includes("sesion")) {
          router.push("/users/login");
          return;
        }

        setMessage(result.error ?? "No se pudo guardar metricas.");
        return;
      }

      clearDraft();
      router.push("/users/onboarding/training");
    } catch {
      setMessage("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      setIsPending(false);
    }
  }

  function handleContinue(nextMetrics: MetricsDraft) {
    setMetrics(nextMetrics);
    const errors = validateMetricsDraft(nextMetrics);

    if (Object.keys(errors).length > 0) {
      setMetricsErrors(errors);
      setMessage("Corrige los campos marcados para continuar.");
      return;
    }

    setMetricsErrors({});
    setMessage("");
    setIsPending(true);
    void saveMetricsWithTimeout(nextMetrics);
  }

  return (
    <OnboardingStepShell
      step="metrics"
      userName={userName}
      title="Define tu objetivo"
      subtitle="Primero elegimos tu objetivo. El contexto físico va en el siguiente paso."
    >
      <MetricsStepForm
        value={metrics}
        isPending={isPending}
        fieldErrors={metricsErrors}
        errorMessage={message}
        submitLabel="Continuar"
        backLabel="Volver al inicio"
        onChange={setMetrics}
        onClearFieldError={(field) =>
          setMetricsErrors((prev) => ({ ...prev, [field]: undefined }))
        }
        onBack={() => router.push("/users")}
        onContinue={handleContinue}
      />
    </OnboardingStepShell>
  );
}
