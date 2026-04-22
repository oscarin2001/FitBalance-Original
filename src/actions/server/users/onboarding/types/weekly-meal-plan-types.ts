import type { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";

export const weeklyMealTypes = ["Desayuno", "Snack", "Almuerzo", "Cena"] as const;

export type WeeklyMealType = (typeof weeklyMealTypes)[number];
export type MealFoodRole = "protein" | "carb" | "fat" | "vegetable" | "fruit" | "infusion";

export type FoodPreferenceMap = Record<string, string[]>;

export type MealNutritionReference = {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

export type VisibleMealPlanFood = {
  name: string;
  role: MealFoodRole;
};

export type VisibleMealPlanMeal = {
  mealType: WeeklyMealType;
  recipeName: string;
  foods: VisibleMealPlanFood[];
  instructions?: string[];
};

export type VisibleMealPlanDay = {
  dayLabel: string;
  dateIso: string;
  meals: VisibleMealPlanMeal[];
};

export type WeeklyMealPlanSource = "gemini" | "heuristic";

export type GeneratedWeeklyMealPlan = {
  model: string;
  source: WeeklyMealPlanSource;
  warning?: string;
  hydrationLiters: number;
  days: VisibleMealPlanDay[];
};

export type PersistedMealFood = VisibleMealPlanFood & {
  foodId: number | null;
  gramsReference: number;
  portionLabel: string;
  nutrition: MealNutritionReference;
};

export type PersistedMealPlanMeal = Omit<VisibleMealPlanMeal, "foods"> & {
  foods: PersistedMealFood[];
  nutrition: MealNutritionReference;
  planMealId?: number;
  recipeId?: number;
};

export type PersistedMealPlanDay = Omit<VisibleMealPlanDay, "meals"> & {
  meals: PersistedMealPlanMeal[];
};

export type PersistedWeeklyMealPlan = Omit<GeneratedWeeklyMealPlan, "days"> & {
  days: PersistedMealPlanDay[];
};

export type SeedFoodRecord = {
  name: string;
  categoryLabel: string;
  preferenceCategory: "carbs" | "proteins" | "fats" | "vegetables" | "fruits" | "infusions";
  enumCategory: string | null;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  portion: string;
  gramsReference: number;
};
