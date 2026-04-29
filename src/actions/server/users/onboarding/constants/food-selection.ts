import type { FoodsDraft } from "../types/onboarding-ui-types";

import {
  foodCategoryLabels,
  foodDataset,
  requiredFoodCategories,
  type FoodCategoryKey,
} from "./food-catalog";

const LEGACY_FOOD_ALIASES: Partial<Record<FoodCategoryKey, Record<string, string>>> = {
  infusions: {
    te: "Té verde",
    "te blanco": "Té blanco",
    "te negro": "Té negro",
    "te rojo": "Té rojo",
    manzanilla: "Infusión de manzanilla",
    cedron: "Infusión de cedrón",
    coca: "Infusión de coca",
    muna: "Mate de muña",
    muña: "Mate de muña",
    "mate coca": "Mate de coca",
    "mate de coca": "Mate de coca",
  },
};

export function normalizeFoodToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

export function resolveCanonicalFoodName(category: FoodCategoryKey, value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const foods = foodDataset[category] ?? [];
  const exactMatch = foods.find((food) => food === trimmedValue);

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedValue = normalizeFoodToken(trimmedValue);
  const normalizedMatch = foods.find((food) => normalizeFoodToken(food) === normalizedValue);

  if (normalizedMatch) {
    return normalizedMatch;
  }

  return LEGACY_FOOD_ALIASES[category]?.[normalizedValue] ?? null;
}

export function normalizeFoodSelectionList(category: FoodCategoryKey, foods: unknown): string[] {
  if (!Array.isArray(foods)) {
    return [];
  }

  const seenFoods = new Set<string>();

  return foods.reduce<string[]>((acc, item) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      return acc;
    }

    const canonicalName = resolveCanonicalFoodName(category, item);
    if (!canonicalName || seenFoods.has(canonicalName)) {
      return acc;
    }

    seenFoods.add(canonicalName);
    acc.push(canonicalName);
    return acc;
  }, []);
}

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
  const categoryKey = category as FoodCategoryKey;
  const foods = foodDataset[categoryKey] ?? [];

  return new Set([
    ...foods,
    ...foods.map((food) => normalizeFoodToken(food)),
  ]);
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
