import type { AiTargets } from "@/actions/server/users/onboarding/types/onboarding-action-types";
import type { MealFoodRole } from "@/actions/server/users/onboarding/types/weekly-meal-plan-types";
import type { DashboardMacroTotals } from "@/actions/server/users/types";

type MealPeriod = "Desayuno" | "Almuerzo" | "Cena" | "Snack";

type MealRoleTargetKey = "proteinasPct" | "carbohidratosPct" | "grasasPct";

export type MealPortionSource = {
  name: string;
  role: MealFoodRole;
  baseGramsReference: number;
  nutritionPer100: DashboardMacroTotals;
  foodId?: number | null;
  category?: string | null;
  isBeverage?: boolean | null;
};

export type MealPortionTargets = Pick<AiTargets, "kcalObjetivo" | "proteinasPct" | "grasasPct" | "carbohidratosPct">;

export type MealPortionResult = {
  name: string;
  role: MealFoodRole;
  foodId: number | null;
  gramsReference: number;
  portionLabel: string;
  nutrition: DashboardMacroTotals;
  isBeverage: boolean;
  category: string | null;
};

const MEAL_SHARE: Record<MealPeriod, number> = {
  Desayuno: 0.25,
  Snack: 0.15,
  Almuerzo: 0.35,
  Cena: 0.25,
};

const ROLE_TARGET_KEY: Record<Extract<MealFoodRole, "protein" | "carb" | "fat">, MealRoleTargetKey> = {
  protein: "proteinasPct",
  carb: "carbohidratosPct",
  fat: "grasasPct",
};

function round(value: number): number {
  return Number(value.toFixed(1));
}

function formatQuantityLabel(quantity: number, unit: "g" | "ml") {
  const rounded = round(quantity);
  const displayQuantity = Number.isInteger(rounded) ? String(Math.round(rounded)) : rounded.toFixed(1);

  return `${displayQuantity} ${unit}`;
}

function calculateNutrition(nutritionPer100: DashboardMacroTotals, grams: number): DashboardMacroTotals {
  const ratio = grams > 0 ? grams / 100 : 0;

  return {
    calories: round((nutritionPer100.calories ?? 0) * ratio),
    proteins: round((nutritionPer100.proteins ?? 0) * ratio),
    carbs: round((nutritionPer100.carbs ?? 0) * ratio),
    fats: round((nutritionPer100.fats ?? 0) * ratio),
  };
}

function isMacroRole(role: MealFoodRole): role is Extract<MealFoodRole, "protein" | "carb" | "fat"> {
  return role === "protein" || role === "carb" || role === "fat";
}

export function getMealShare(mealType: MealPeriod): number {
  return MEAL_SHARE[mealType] ?? 0.25;
}

export function buildTargetMealPortions(
  mealType: MealPeriod,
  targets: MealPortionTargets,
  sources: MealPortionSource[]
): MealPortionResult[] {
  const mealTargetCalories = round(targets.kcalObjetivo * getMealShare(mealType));
  const fixedSources = sources.filter((source) => !isMacroRole(source.role));
  const fixedCalories = fixedSources.reduce((accumulator, source) => {
    return accumulator + calculateNutrition(source.nutritionPer100, source.baseGramsReference).calories;
  }, 0);
  const availableCalories = Math.max(mealTargetCalories - fixedCalories, 0);

  const activeMacroRoles = sources.filter((source): source is MealPortionSource & { role: Extract<MealFoodRole, "protein" | "carb" | "fat"> } => {
    return isMacroRole(source.role);
  });

  const totalWeight = activeMacroRoles.reduce((accumulator, source) => {
    return accumulator + (targets[ROLE_TARGET_KEY[source.role]] ?? 0);
  }, 0);

  const roleCalories = new Map<Extract<MealFoodRole, "protein" | "carb" | "fat">, number>();

  if (activeMacroRoles.length > 0) {
    for (const source of activeMacroRoles) {
      const weight = targets[ROLE_TARGET_KEY[source.role]] ?? 0;
      const share = totalWeight > 0 ? weight / totalWeight : 1 / activeMacroRoles.length;
      roleCalories.set(source.role, availableCalories * share);
    }
  }

  return sources.map((source) => {
    const unit = source.isBeverage || source.role === "infusion" ? "ml" : "g";
    let gramsReference = source.baseGramsReference > 0 ? source.baseGramsReference : unit === "ml" ? 250 : 100;

    if (isMacroRole(source.role)) {
      const sourceCalories = source.nutritionPer100.calories ?? 0;
      const targetCalories = roleCalories.get(source.role) ?? 0;

      if (sourceCalories > 0 && targetCalories > 0) {
        gramsReference = (targetCalories / sourceCalories) * 100;
      }
    }

    const quantity = round(gramsReference);
    const nutrition = calculateNutrition(source.nutritionPer100, quantity);

    return {
      name: source.name,
      role: source.role,
      foodId: source.foodId ?? null,
      gramsReference: quantity,
      portionLabel: formatQuantityLabel(quantity, unit),
      nutrition,
      isBeverage: unit === "ml",
      category: source.category ?? null,
    };
  });
}