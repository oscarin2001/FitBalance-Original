"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { saveOnboardingTrainingAction } from "@/actions/server/users/onboarding/actions";
import type { TrainingDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { TrainingStepForm } from "@/components/users/onboarding/organisms/training-step-form";

import { OnboardingStepShell } from "../onboarding-step-shell";
import { useOnboardingDraft } from "../use-onboarding-draft";
import { validateTrainingDraft, type TrainingErrors } from "./validators";

type OnboardingTrainingRouteStepProps = {
  userName: string;
  initialTraining: TrainingDraft;
};

const TRAINING_DRAFT_KEY = "fitbalance:onboarding:training:v1";
const mergeTrainingDraft = (base: TrainingDraft, draft: TrainingDraft) => ({ ...base, ...draft });

export function OnboardingTrainingRouteStep({ userName, initialTraining }: OnboardingTrainingRouteStepProps) {
  const router = useRouter();
  const draftKey = useMemo(
    () => `${TRAINING_DRAFT_KEY}:${userName.toLowerCase().replace(/\s+/g, "-")}`,
    [userName]
  );
  const [trainingErrors, setTrainingErrors] = useState<TrainingErrors>({});
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const { value: training, setValue: setTraining, clearDraft } = useOnboardingDraft({
    storageKey: draftKey,
    initialValue: initialTraining,
    merge: mergeTrainingDraft,
  });

  async function saveTrainingWithTimeout(nextTraining: TrainingDraft) {
    const timeoutMessage = "La operacion esta tardando demasiado. Intenta nuevamente.";

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<{ ok: false; error: string }>((resolve) => {
      timeoutHandle = setTimeout(() => {
        resolve({ ok: false, error: timeoutMessage });
      }, 15000);
    });

    try {
      const result = await Promise.race([saveOnboardingTrainingAction(nextTraining), timeoutPromise]);

      if (!result.ok) {
        if (result.error?.toLowerCase().includes("sesion")) {
          router.push("/users/login");
          return;
        }

        setMessage(result.error ?? "No se pudo guardar entrenamiento.");
        return;
      }

      clearDraft();
      router.push("/users/onboarding/foods");
    } catch {
      setMessage("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      setIsPending(false);
    }
  }

  function handleContinue(nextTraining: TrainingDraft) {
    setTraining(nextTraining);
    const errors = validateTrainingDraft(nextTraining);

    if (Object.keys(errors).length > 0) {
      setTrainingErrors(errors);
      setMessage("Corrige los campos marcados para continuar.");
      return;
    }

    setTrainingErrors({});
    setMessage("");
    setIsPending(true);
    void saveTrainingWithTimeout(nextTraining);
  }

  return (
    <OnboardingStepShell
      step="training"
      userName={userName}
      title="Actividad y entrenamiento"
      subtitle=""
    >
      <TrainingStepForm
        value={training}
        isPending={isPending}
        fieldErrors={trainingErrors}
        errorMessage={message}
        submitLabel="Continuar"
        backLabel="Volver"
        onChange={setTraining}
        onClearFieldError={(field) => setTrainingErrors((prev) => ({ ...prev, [field]: undefined }))}
        onBack={() => router.push("/users/onboarding/data?edit=metrics")}
        onContinue={handleContinue}
      />
    </OnboardingStepShell>
  );
}