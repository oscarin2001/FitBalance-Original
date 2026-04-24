"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { onboardingDays } from "@/actions/server/users/onboarding/constants";
import { saveOnboardingFoodPreferencesAction } from "@/actions/server/users/onboarding/actions";
import type { FoodsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { FoodsStepForm } from "@/components/users/onboarding/organisms/foods-step-form";

import { OnboardingStepShell } from "../onboarding-step-shell";
import { useOnboardingDraft } from "../use-onboarding-draft";
import { validateFoodsDraft, type FoodsErrors } from "./validators";

type OnboardingFoodsRouteStepProps = {
  userName: string;
  initialFoods: FoodsDraft;
};

const FOODS_DRAFT_KEY = "fitbalance:onboarding:foods:v2";
const mergeFoodsDraft = (base: FoodsDraft, draft: FoodsDraft) => ({
  ...base,
  ...draft,
  preferencias: {
    ...base.preferencias,
    ...draft.preferencias,
  },
});

export function OnboardingFoodsRouteStep({
  userName,
  initialFoods,
}: OnboardingFoodsRouteStepProps) {
  const router = useRouter();
  const draftKey = useMemo(
    () => `${FOODS_DRAFT_KEY}:${userName.toLowerCase().replace(/\s+/g, "-")}`,
    [userName]
  );
  const [foodsErrors, setFoodsErrors] = useState<FoodsErrors>({});
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const { value: foods, setValue: setFoods, clearDraft } = useOnboardingDraft({
    storageKey: draftKey,
    initialValue: initialFoods,
    merge: mergeFoodsDraft,
  });

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
    setMessage("");
  }

  function handleContinue() {
    const errors = validateFoodsDraft(foods);

    if (errors.preferencias) {
      setFoodsErrors(errors);
      setMessage("");
      return;
    }

    setFoodsErrors({});
    setMessage("");

    startTransition(async () => {
      try {
        const result = await saveOnboardingFoodPreferencesAction({
          ...foods,
          diasDieta: [...onboardingDays],
        });

        if (!result.ok) {
          if (result.error?.toLowerCase().includes("sesion")) {
            router.push("/users/login");
            return;
          }

          setMessage(result.error ?? "No se pudo guardar preferencias.");
          return;
        }

        clearDraft();
        router.push("/users/onboarding/summary");
      } catch {
        setMessage("No se pudo conectar con el servidor. Intenta nuevamente.");
      }
    });
  }

  return (
    <OnboardingStepShell
      step="foods"
      userName={userName}
      title="Cuida el sabor de tu plan"
      subtitle="Selecciona tus comidas frecuentes para construir tu dieta diaria personalizada."
    >
      <FoodsStepForm
        value={foods}
        isPending={isPending}
        fieldErrors={foodsErrors}
        errorMessage={message}
        onBack={() => router.push("/users/onboarding/training?edit=training")}
        onContinue={handleContinue}
        onToggleFood={handleToggleFood}
      />
    </OnboardingStepShell>
  );
}
