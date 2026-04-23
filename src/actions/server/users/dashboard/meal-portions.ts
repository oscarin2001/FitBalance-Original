import type { AiTargets } from "@/actions/server/users/onboarding/types/onboarding-action-types";
import type { MealFoodRole } from "@/actions/server/users/onboarding/types/weekly-meal-plan-types";
import type { DashboardMacroTotals } from "@/actions/server/users/types";

type MealPeriod = "Desayuno" | "Almuerzo" | "Cena" | "Snack";

type MacroRole = Extract<MealFoodRole, "protein" | "carb" | "fat">;

export type MealPortionSource = {
  name: string;
  role: MealFoodRole;
  baseGramsReference: number;
  nutritionPer100: DashboardMacroTotals;
  foodId?: number | null;
  category?: string | null;
  isBeverage?: boolean | null;
};

export type MealPortionTargets = Pick<
  AiTargets,
  "kcalObjetivo" | "proteinasPct" | "grasasPct" | "carbohidratosPct" | "proteinasG" | "grasasG" | "carbohidratosG"
>;

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

const MACRO_ROLES: MacroRole[] = ["protein", "carb", "fat"];

const MIN_ROLE_GRAMS: Record<MacroRole, number> = {
  protein: 20,
  carb: 20,
  fat: 5,
};

const MAX_ROLE_GRAMS: Record<MacroRole, number> = {
  protein: 600,
  carb: 650,
  fat: 140,
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

function isMacroRole(role: MealFoodRole): role is MacroRole {
  return role === "protein" || role === "carb" || role === "fat";
}

function getMacroValue(nutrition: DashboardMacroTotals, role: MacroRole) {
  if (role === "protein") {
    return nutrition.proteins ?? 0;
  }

  if (role === "carb") {
    return nutrition.carbs ?? 0;
  }

  return nutrition.fats ?? 0;
}

function clampRolePortion(role: MacroRole, grams: number, hasPositiveTarget: boolean) {
  if (!Number.isFinite(grams) || grams <= 0) {
    return hasPositiveTarget ? MIN_ROLE_GRAMS[role] : 0;
  }

  return Math.min(
    MAX_ROLE_GRAMS[role],
    Math.max(hasPositiveTarget ? MIN_ROLE_GRAMS[role] : 0, grams)
  );
}

function resolveDailyMacroTargets(targets: MealPortionTargets) {
  const proteinFromGrams = Math.max(targets.proteinasG ?? 0, 0);
  const carbFromGrams = Math.max(targets.carbohidratosG ?? 0, 0);
  const fatFromGrams = Math.max(targets.grasasG ?? 0, 0);

  if (proteinFromGrams > 0 || carbFromGrams > 0 || fatFromGrams > 0) {
    return {
      protein: proteinFromGrams,
      carb: carbFromGrams,
      fat: fatFromGrams,
    };
  }

  return {
    protein: Math.max((targets.kcalObjetivo * (targets.proteinasPct ?? 0)) / 400, 0),
    carb: Math.max((targets.kcalObjetivo * (targets.carbohidratosPct ?? 0)) / 400, 0),
    fat: Math.max((targets.kcalObjetivo * (targets.grasasPct ?? 0)) / 900, 0),
  };
}

function solveLinearSystem3x3(matrix: number[][], vector: number[]) {
  const augmented = matrix.map((row, rowIndex) => [...row, vector[rowIndex] ?? 0]);

  for (let pivotIndex = 0; pivotIndex < 3; pivotIndex += 1) {
    let bestRow = pivotIndex;

    for (let candidate = pivotIndex + 1; candidate < 3; candidate += 1) {
      if (Math.abs(augmented[candidate][pivotIndex] ?? 0) > Math.abs(augmented[bestRow][pivotIndex] ?? 0)) {
        bestRow = candidate;
      }
    }

    if (bestRow !== pivotIndex) {
      const current = augmented[pivotIndex];
      augmented[pivotIndex] = augmented[bestRow] as number[];
      augmented[bestRow] = current as number[];
    }

    const pivotValue = augmented[pivotIndex][pivotIndex] ?? 0;

    if (Math.abs(pivotValue) < 1e-8) {
      return null;
    }

    for (let column = pivotIndex; column <= 3; column += 1) {
      augmented[pivotIndex][column] = (augmented[pivotIndex][column] ?? 0) / pivotValue;
    }

    for (let row = 0; row < 3; row += 1) {
      if (row === pivotIndex) {
        continue;
      }

      const factor = augmented[row][pivotIndex] ?? 0;

      if (factor === 0) {
        continue;
      }

      for (let column = pivotIndex; column <= 3; column += 1) {
        const updated = (augmented[row][column] ?? 0) - factor * (augmented[pivotIndex][column] ?? 0);
        augmented[row][column] = updated;
      }
    }
  }

  const solution = [augmented[0][3], augmented[1][3], augmented[2][3]].map((value) =>
    Number.isFinite(value) ? value : NaN
  );

  return solution.every((value) => Number.isFinite(value)) ? solution : null;
}

function solveMacroRolePortions(
  roleSources: Record<MacroRole, MealPortionSource & { role: MacroRole }>,
  remainingTargets: Record<MacroRole, number>
) {
  const matrix = MACRO_ROLES.map((macroRole) =>
    MACRO_ROLES.map((sourceRole) => getMacroValue(roleSources[sourceRole].nutritionPer100, macroRole) / 100)
  );
  const vector = MACRO_ROLES.map((role) => remainingTargets[role]);
  const solved = solveLinearSystem3x3(matrix, vector);

  if (!solved) {
    return null;
  }

  const entries = MACRO_ROLES.map((role, index) => {
    const target = remainingTargets[role] > 0;
    const grams = clampRolePortion(role, solved[index] ?? 0, target);

    if (!Number.isFinite(grams)) {
      return null;
    }

    return [role, grams] as const;
  });

  if (entries.some((entry) => entry === null)) {
    return null;
  }

  return new Map(entries as Array<readonly [MacroRole, number]>);
}

export function getMealShare(mealType: MealPeriod): number {
  return MEAL_SHARE[mealType] ?? 0.25;
}

export function buildTargetMealPortions(
  mealType: MealPeriod,
  targets: MealPortionTargets,
  sources: MealPortionSource[]
): MealPortionResult[] {
  const mealShare = getMealShare(mealType);
  const mealTargetCalories = round(targets.kcalObjetivo * mealShare);
  const dailyMacroTargets = resolveDailyMacroTargets(targets);
  const mealMacroTargets: Record<MacroRole, number> = {
    protein: dailyMacroTargets.protein * mealShare,
    carb: dailyMacroTargets.carb * mealShare,
    fat: dailyMacroTargets.fat * mealShare,
  };
  const fixedSources = sources.filter((source) => !isMacroRole(source.role));
  const fixedTotals = fixedSources.reduce<DashboardMacroTotals>((accumulator, source) => {
    const nutrition = calculateNutrition(source.nutritionPer100, source.baseGramsReference);

    return {
      calories: round(accumulator.calories + nutrition.calories),
      proteins: round(accumulator.proteins + nutrition.proteins),
      carbs: round(accumulator.carbs + nutrition.carbs),
      fats: round(accumulator.fats + nutrition.fats),
    };
  }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });

  const remainingMacroTargets: Record<MacroRole, number> = {
    protein: Math.max(mealMacroTargets.protein - fixedTotals.proteins, 0),
    carb: Math.max(mealMacroTargets.carb - fixedTotals.carbs, 0),
    fat: Math.max(mealMacroTargets.fat - fixedTotals.fats, 0),
  };

  const activeMacroSources = sources.filter(
    (source): source is MealPortionSource & { role: MacroRole } => isMacroRole(source.role)
  );

  const roleSourcesByRole = activeMacroSources.reduce<Partial<Record<MacroRole, MealPortionSource & { role: MacroRole }>>>(
    (accumulator, source) => {
      if (!accumulator[source.role]) {
        accumulator[source.role] = source;
      }

      return accumulator;
    },
    {}
  );

  const hasAllMacroRoles = MACRO_ROLES.every((role) => roleSourcesByRole[role]);
  const solvedRolePortions =
    hasAllMacroRoles
      ? solveMacroRolePortions(
          roleSourcesByRole as Record<MacroRole, MealPortionSource & { role: MacroRole }>,
          remainingMacroTargets
        )
      : null;
  const rolePortions = new Map<MacroRole, number>();

  if (solvedRolePortions) {
    for (const [role, grams] of solvedRolePortions.entries()) {
      rolePortions.set(role, grams);
    }
  }

  for (const source of activeMacroSources) {
    if (rolePortions.has(source.role)) {
      continue;
    }

    const targetMacroGrams = remainingMacroTargets[source.role];
    const per100ForRole = getMacroValue(source.nutritionPer100, source.role);
    const hasPositiveTarget = targetMacroGrams > 0;
    const computedGrams =
      per100ForRole > 0 && hasPositiveTarget
        ? (targetMacroGrams / per100ForRole) * 100
        : source.baseGramsReference;

    rolePortions.set(source.role, clampRolePortion(source.role, computedGrams, hasPositiveTarget));
  }

  const macroCalories = activeMacroSources.reduce((accumulator, source) => {
    const plannedGrams = rolePortions.get(source.role) ?? source.baseGramsReference;
    return accumulator + calculateNutrition(source.nutritionPer100, plannedGrams).calories;
  }, 0);
  const desiredMacroCalories = Math.max(mealTargetCalories - fixedTotals.calories, 0);

  if (macroCalories > 0 && desiredMacroCalories > 0) {
    const adjustmentFactor = desiredMacroCalories / macroCalories;

    if (Number.isFinite(adjustmentFactor) && adjustmentFactor > 0.9 && adjustmentFactor < 1.1) {
      for (const source of activeMacroSources) {
        const current = rolePortions.get(source.role);

        if (current === undefined) {
          continue;
        }

        const hasPositiveTarget = remainingMacroTargets[source.role] > 0;
        rolePortions.set(
          source.role,
          clampRolePortion(source.role, current * adjustmentFactor, hasPositiveTarget)
        );
      }
    }
  }

  return sources.map((source) => {
    const unit = source.isBeverage || source.role === "infusion" ? "ml" : "g";
    let gramsReference = source.baseGramsReference > 0 ? source.baseGramsReference : unit === "ml" ? 250 : 100;

    if (isMacroRole(source.role)) {
      gramsReference = rolePortions.get(source.role) ?? gramsReference;
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
