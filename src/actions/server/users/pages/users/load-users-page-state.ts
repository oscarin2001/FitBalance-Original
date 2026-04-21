import type { ComidaTipo, Objetivo } from "@prisma/client";

import type { SessionAppUser } from "@/actions/server/users/auth";
import { requireCompletedOnboarding } from "@/actions/server/users/auth";
import { syncSeedFoodsToDatabase } from "@/actions/server/users/onboarding/logic/food-seed-sync";
import {
  buildFallbackMealInstructions,
  normalizeInstructionSteps,
} from "@/components/users/dashboard/lib/meal-formatters";
import { prisma } from "@/actions/server/users/prisma";
import { formatRelativeDateLabel, getDateKeyDifference, shiftDateKey, toDateKey } from "@/lib/date-labels";
import type {
  DashboardMacroTotals,
  UserDashboardMealIngredient,
  UserDashboardMeal,
  UserDashboardPlan,
} from "@/actions/server/users/types";

const mealOrder: ComidaTipo[] = ["Desayuno", "Almuerzo", "Snack", "Cena"];

function emptyTotals(): DashboardMacroTotals {
  return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
}

function round(value: number): number {
  return Number(value.toFixed(1));
}

function getCarbLabel(objective: Objetivo | null): string {
  return objective === "Bajar_grasa" ? "Carbos Netos" : "Carbos Totales";
}

function addTotals(base: DashboardMacroTotals, extra: DashboardMacroTotals): DashboardMacroTotals {
  return {
    calories: round(base.calories + extra.calories),
    proteins: round(base.proteins + extra.proteins),
    carbs: round(base.carbs + extra.carbs),
    fats: round(base.fats + extra.fats),
  };
}

function buildMealTotals(
  items: Array<{
    gramos: number;
    alimento: {
      calorias: number | null;
      proteinas: number | null;
      carbohidratos: number | null;
      grasas: number | null;
    };
  }>
): DashboardMacroTotals {
  return items.reduce<DashboardMacroTotals>((acc, item) => {
    const ratio = item.gramos > 0 ? item.gramos / 100 : 1;

    return {
      calories: round(acc.calories + (item.alimento.calorias ?? 0) * ratio),
      proteins: round(acc.proteins + (item.alimento.proteinas ?? 0) * ratio),
      carbs: round(acc.carbs + (item.alimento.carbohidratos ?? 0) * ratio),
      fats: round(acc.fats + (item.alimento.grasas ?? 0) * ratio),
    };
  }, emptyTotals());
}

function isBeverageIngredient(name: string, portionLabel: string, category: string | null) {
  const lowerName = name.toLowerCase();
  const lowerPortion = portionLabel.toLowerCase();

  if (category === "BebidasInfusiones") {
    return true;
  }

  return (
    lowerPortion.includes("ml") ||
    lowerName.includes("infusi") ||
    lowerName.includes("mate") ||
    lowerName.includes("agua") ||
    lowerName.includes("té") ||
    lowerName.includes("te")
  );
}

function buildMealIngredients(items: Array<{
  gramos: number;
  alimento: {
    nombre: string;
    calorias: number | null;
    proteinas: number | null;
    carbohidratos: number | null;
    grasas: number | null;
    porcion: string | null;
    categoria_enum: string | null;
    categoria: string | null;
  };
}>): UserDashboardMealIngredient[] {
  return items.map((item) => {
    const ratio = item.gramos > 0 ? item.gramos / 100 : 1;
    const grams = round(item.gramos);
    const nutrition: DashboardMacroTotals = {
      calories: round((item.alimento.calorias ?? 0) * ratio),
      proteins: round((item.alimento.proteinas ?? 0) * ratio),
      carbs: round((item.alimento.carbohidratos ?? 0) * ratio),
      fats: round((item.alimento.grasas ?? 0) * ratio),
    };
    const category = item.alimento.categoria_enum ?? item.alimento.categoria ?? null;
    const isBeverage = isBeverageIngredient(item.alimento.nombre, item.alimento.porcion ?? "", category);
    const portionLabel = isBeverage ? `${Math.round(grams)} ml` : `${Math.round(grams)} g`;

    return {
      name: item.alimento.nombre,
      grams,
      portionLabel,
      category,
      isBeverage,
      nutrition,
    };
  });
}

function buildIngredientNames(ingredients: UserDashboardMealIngredient[]) {
  return ingredients.map((ingredient) => ingredient.name);
}

function normalizeDateKey(value: string | null | undefined): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateKey(parsed);
}

function buildDashboardPlan(
  user: {
    objetivo: Objetivo | null;
    kcal_objetivo: number | null;
    proteinas_g_obj: number | null;
    grasas_g_obj: number | null;
    carbohidratos_g_obj: number | null;
    planes: Array<{
      id: number;
      fecha: Date;
      comida_tipo: ComidaTipo;
      receta: {
        nombre: string;
        instrucciones: string | null;
        alimentos: Array<{
          gramos: number;
          alimento: {
            nombre: string;
            calorias: number | null;
            proteinas: number | null;
            carbohidratos: number | null;
            grasas: number | null;
            porcion: string | null;
            categoria_enum: string | null;
            categoria: string | null;
          };
        }>;
      };
    }>;
  },
  requestedDateIso?: string | null
): UserDashboardPlan | null {
  const mealsByDate = new Map<string, UserDashboardMeal[]>();
  const weekTotals = user.planes.reduce<DashboardMacroTotals>((acc, plan) => {
    const totals = buildMealTotals(plan.receta.alimentos);
    const dateKey = toDateKey(plan.fecha);
    const currentMeals = mealsByDate.get(dateKey) ?? [];
    const ingredients = buildMealIngredients(plan.receta.alimentos);
    const instructions = normalizeInstructionSteps(
      plan.receta.instrucciones,
      buildFallbackMealInstructions({
        mealType: plan.comida_tipo,
        recipeName: plan.receta.nombre,
        ingredients,
      })
    );

    currentMeals.push({
      id: plan.id,
      mealType: plan.comida_tipo,
      recipeName: plan.receta.nombre,
      foods: buildIngredientNames(ingredients),
      ingredients,
      instructions,
      instructionsSource: plan.receta.instrucciones ? "database" : "generated",
      totals,
    });

    mealsByDate.set(dateKey, currentMeals);

    return addTotals(acc, totals);
  }, emptyTotals());

  const todayKey = toDateKey(new Date());
  const orderedDateKeys = [...mealsByDate.keys()].sort();
  const firstDateKey = orderedDateKeys[0] ?? null;
  const dateShiftDays = firstDateKey ? Math.max(getDateKeyDifference(firstDateKey, todayKey), 0) : 0;
  const normalizedMealsByDate =
    dateShiftDays > 0
      ? new Map(
          [...mealsByDate.entries()].map(([dateKey, meals]) => [shiftDateKey(dateKey, -dateShiftDays), meals] as const)
        )
      : mealsByDate;
  const selectedDateIso = normalizeDateKey(requestedDateIso) ?? todayKey;

  const selectedMeals = (normalizedMealsByDate.get(selectedDateIso) ?? []).sort(
    (a, b) => mealOrder.indexOf(a.mealType) - mealOrder.indexOf(b.mealType)
  );
  const dayTotals = selectedMeals.reduce<DashboardMacroTotals>(
    (acc, meal) => addTotals(acc, meal.totals),
    emptyTotals()
  );
  const dayTargets: DashboardMacroTotals = {
    calories: round(user.kcal_objetivo ?? 0),
    proteins: round(user.proteinas_g_obj ?? 0),
    carbs: round(user.carbohidratos_g_obj ?? 0),
    fats: round(user.grasas_g_obj ?? 0),
  };
  const periodDays = [...normalizedMealsByDate.keys()].length;

  return {
    objective: user.objetivo,
    carbLabel: getCarbLabel(user.objetivo),
    selectedDateIso,
    selectedDateLabel: formatRelativeDateLabel(selectedDateIso),
    hasPlanForToday: normalizedMealsByDate.has(todayKey),
    periodDays,
    dayTotals,
    dayTargets,
    weekTotals,
    weekTargets: {
      calories: round(dayTargets.calories * periodDays),
      proteins: round(dayTargets.proteins * periodDays),
      carbs: round(dayTargets.carbs * periodDays),
      fats: round(dayTargets.fats * periodDays),
    },
    meals: selectedMeals,
  };
}

function hasMeaningfulPlan(dashboard: UserDashboardPlan | null): boolean {
  if (!dashboard) {
    return false;
  }

  const hasMealNutrition = dashboard.meals.some(
    (meal) =>
      meal.totals.calories > 0 ||
      meal.totals.proteins > 0 ||
      meal.totals.carbs > 0 ||
      meal.totals.fats > 0
  );

  return hasMealNutrition || dashboard.dayTotals.calories > 0 || dashboard.weekTotals.calories > 0;
}

async function loadDashboardUser(userId: number) {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      objetivo: true,
      kcal_objetivo: true,
      proteinas_g_obj: true,
      grasas_g_obj: true,
      carbohidratos_g_obj: true,
      planes: {
        orderBy: [{ fecha: "asc" }, { comida_tipo: "asc" }],
        select: {
          id: true,
          fecha: true,
          comida_tipo: true,
          receta: {
            select: {
              nombre: true,
              instrucciones: true,
              alimentos: {
                select: {
                  gramos: true,
                  alimento: {
                    select: {
                      nombre: true,
                      calorias: true,
                      proteinas: true,
                      carbohidratos: true,
                      grasas: true,
                      porcion: true,
                      categoria_enum: true,
                      categoria: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export type UsersPageState = {
  sessionUser: SessionAppUser;
  dashboard: UserDashboardPlan | null;
  hasLoadError: boolean;
};

export async function loadUsersPageState(options?: { requestedDateIso?: string | null }): Promise<UsersPageState> {
  const sessionUser = await requireCompletedOnboarding();
  let dashboard: UserDashboardPlan | null = null;
  let hasLoadError = false;

  try {
    let user = await loadDashboardUser(sessionUser.userId);

    if (user) {
      dashboard = buildDashboardPlan(user, options?.requestedDateIso ?? null);

      if (!hasMeaningfulPlan(dashboard) && user.planes.length > 0) {
        await syncSeedFoodsToDatabase();
        user = await loadDashboardUser(sessionUser.userId);
        dashboard = user ? buildDashboardPlan(user, options?.requestedDateIso ?? null) : null;
      }
    }
  } catch (error) {
    console.error("Error loading dashboard", error);
    hasLoadError = true;
  }

  return { sessionUser, dashboard, hasLoadError };
}

