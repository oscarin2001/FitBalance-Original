"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert } from "lucide-react";

import {
  foodCatalog,
  requiredFoodCategories,
} from "@/actions/server/users/onboarding/constants";
import type { FoodsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  foodSubsteps,
  type FoodSubstepKey,
  type FoodsStepFormFieldErrors,
} from "./foods/foods-step-config";
import { CategoryStepSection } from "./foods/category-step-section";

type FoodsStepFormProps = {
  value: FoodsDraft;
  isPending: boolean;
  fieldErrors?: FoodsStepFormFieldErrors;
  errorMessage?: string;
  onBack: () => void;
  onContinue: () => void;
  onToggleFood: (category: string, food: string) => void;
};

export function FoodsStepForm({
  value,
  isPending,
  fieldErrors,
  errorMessage,
  onBack,
  onContinue,
  onToggleFood,
}: FoodsStepFormProps) {
  const [activeSubstep, setActiveSubstep] = useState<FoodSubstepKey>(
    foodSubsteps[0]?.key ?? requiredFoodCategories[0]
  );
  const [searchValue, setSearchValue] = useState("");
  const [stepError, setStepError] = useState("");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  const activeStepIndex = Math.max(
    0,
    foodSubsteps.findIndex((step) => step.key === activeSubstep)
  );
  const stepProgress = ((activeStepIndex + 1) / foodSubsteps.length) * 100;

  const currentCategory = activeSubstep;
  const currentCategoryMeta = currentCategory ? foodCatalog[currentCategory] : null;
  const selectedFoods = currentCategory ? value.preferencias[currentCategory] ?? [] : [];
  const currentFoods = useMemo(() => {
    if (!currentCategoryMeta) {
      return [];
    }

    return currentCategoryMeta.foods.filter((food) =>
      deferredSearch ? food.toLowerCase().includes(deferredSearch) : true
    );
  }, [currentCategoryMeta, deferredSearch]);

  const currentStepError = fieldErrors?.preferencias;
  const currentStepTitle = currentCategoryMeta?.label ?? "Selecciona alimentos";
  const currentStepDescription = currentCategoryMeta?.description ?? "";

  function moveToSubstep(index: number) {
    setActiveSubstep(
      foodSubsteps[index]?.key ?? (foodSubsteps[0]?.key ?? requiredFoodCategories[0])
    );
    setSearchValue("");
    setStepError("");
  }

  function handlePrevious() {
    if (activeStepIndex <= 0) {
      onBack();
      return;
    }

    moveToSubstep(activeStepIndex - 1);
  }

  function handleNext() {
    if (currentCategory && selectedFoods.length === 0) {
      setStepError("Elige un alimento para continuar.");
      return;
    }

    if (activeStepIndex === foodSubsteps.length - 1) {
      onContinue();
      return;
    }

    moveToSubstep(activeStepIndex + 1);
  }

  return (
    <Card className="mx-auto w-full max-w-3xl rounded-[1.75rem] border-0 bg-white shadow-[0_24px_64px_-30px_rgba(15,23,42,0.45)]">
      <CardHeader className="space-y-4 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Paso {activeStepIndex + 1} de {foodSubsteps.length}
        </p>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-primary transition-all" style={{ width: `${stepProgress}%` }} />
        </div>

        <CardTitle className="text-2xl tracking-tight text-slate-900">
          Preferencias de alimentos
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {errorMessage ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <CategoryStepSection
          categoryKey={currentCategory ?? ""}
          title={currentStepTitle}
          description={currentStepDescription}
          currentStepError={currentStepError}
          searchValue={searchValue}
          searchPlaceholder={currentCategoryMeta?.searchPlaceholder}
          selectedFoods={selectedFoods}
          currentFoods={currentFoods}
          emptyState={currentCategoryMeta?.emptyState}
          onSearchChange={setSearchValue}
          onToggleFood={(food) => {
            onToggleFood(currentCategory ?? "", food);
            setStepError("");
          }}
        />

        {stepError ? <p className="text-sm text-amber-700">{stepError}</p> : null}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handlePrevious} className="h-11 rounded-xl" disabled={isPending}>
            <ArrowLeft className="size-4" />
            {activeStepIndex === 0 ? "Volver a datos" : "Anterior"}
          </Button>
          <Button onClick={handleNext} className="h-11 rounded-xl" disabled={isPending}>
            {activeStepIndex === foodSubsteps.length - 1
              ? isPending
                ? "Guardando..."
                : "Continuar"
              : "Siguiente"}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
