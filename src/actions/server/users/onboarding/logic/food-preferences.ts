import {
  createEmptyFoodPreferences,
  requiredFoodCategories,
  resolveCanonicalFoodName,
} from "../constants";
import type { FoodPreferenceMap } from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeSelectedFoods(raw: unknown): FoodPreferenceMap {
  const defaults = createEmptyFoodPreferences();
  const foodMap = isRecord(raw) ? raw : {};

  return requiredFoodCategories.reduce<FoodPreferenceMap>((acc, category) => {
    const selected = foodMap[category];

    if (!Array.isArray(selected)) {
      acc[category] = defaults[category] ?? [];
      return acc;
    }

    acc[category] = selected
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .map((item) => resolveCanonicalFoodName(category, item))
      .filter((item): item is string => item !== null)
      .slice(0, 10);

    return acc;
  }, {});
}
