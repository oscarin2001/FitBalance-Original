import type { FoodsDraft } from "../types/onboarding-ui-types";

import {
  foodCategoryLabels,
  foodDataset,
  requiredFoodCategories,
  type FoodCategoryKey,
} from "./food-catalog";

const fullOnboardingDays = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

export function createEmptyFoodPreferences(): Record<string, string[]> {
  return requiredFoodCategories.reduce<Record<string, string[]>>((acc, category) => {
    acc[category] = [];
    return acc;
  }, {});
}

export function createEmptyFoodsDraft(): FoodsDraft {
  return {
    preferencias: createEmptyFoodPreferences(),
    diasDieta: [...fullOnboardingDays],
  };
}

export function getAllowedFoodsByCategory(category: string): Set<string> {
  return new Set(foodDataset[category as keyof typeof foodDataset] ?? []);
}

export function getMissingFoodCategories(preferencias: Record<string, string[]>): FoodCategoryKey[] {
  return requiredFoodCategories.filter((category) => {
    const selectedFoods = preferencias[category] ?? [];
    return selectedFoods.length === 0;
  });
}

export function getSelectedFoodsCount(preferencias: Record<string, string[]>): number {
  return Object.values(preferencias).reduce((acc, foods) => acc + foods.length, 0);
}

export function isFoodsDraftComplete(value: FoodsDraft): boolean {
  return getMissingFoodCategories(value.preferencias).length === 0;
}

export function buildMissingFoodCategoriesMessage(categories: FoodCategoryKey[]): string {
  const labels = categories.map((category) => foodCategoryLabels[category] ?? category.toLowerCase());

  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return `Selecciona al menos un alimento en ${labels[0]}.`;
  }

  const visibleLabels = [...labels];
  const lastLabel = visibleLabels.pop();
  return `Selecciona al menos un alimento en ${visibleLabels.join(", ")} y ${lastLabel}.`;
}
