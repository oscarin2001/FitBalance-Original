import type { ComidaTipo, Objetivo, Prisma } from "@prisma/client";

import type { SessionAppUser } from "@/actions/server/users/auth";
import { requireCompletedOnboarding } from "@/actions/server/users/auth";
import { syncSeedFoodsToDatabase } from "@/actions/server/users/onboarding/logic/food-seed-sync";
import {
  buildFallbackMealInstructions,
  normalizeInstructionSteps,
} from "@/components/users/dashboard/lib/meal-formatters";
import { prisma } from "@/actions/server/users/prisma";
import { buildTargetMealPortions } from "@/actions/server/users/dashboard/meal-portions";
import { formatRelativeDateLabel, getDateKeyDifference, shiftDateKey, toDateKey } from "@/lib/date-labels";
import type {
  DashboardMacroTotals,
  UserDashboardProfile,
  UserDashboardMealIngredient,
  UserDashboardMeal,
  UserDashboardPlan,
} from "@/actions/server/users/types";
import type { MealFoodRole } from "@/actions/server/users/onboarding/types/weekly-meal-plan-types";
import type { MealPortionSource, MealPortionTargets } from "@/actions/server/users/dashboard/meal-portions";

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

type PlanFoodOverride = {
  foodId?: number | null;
  name?: string;
  quantity?: number | null;
  unit?: string | null;
  quantityLabel?: string | null;
  gramsReference?: number | null;
  isBeverage?: boolean | null;
  role?: string | null;
  nutrition?: Partial<DashboardMacroTotals> | null;
};

function isPlanFoodOverride(value: unknown): value is PlanFoodOverride {
  return typeof value === "object" && value !== null && typeof (value as { name?: unknown }).name === "string";
}

function getOverrideFoods(overrides: unknown): PlanFoodOverride[] | null {
  if (typeof overrides !== "object" || overrides === null || !("foods" in overrides)) {
    return null;
  }

  const foods = (overrides as { foods?: unknown }).foods;
  if (!Array.isArray(foods)) {
    return [];
  }

  return foods.filter(isPlanFoodOverride);
}

function resolveMealFoodRole(role: string | null | undefined): MealFoodRole {
  if (role === "carb" || role === "fat" || role === "vegetable" || role === "fruit" || role === "infusion") {
    return role;
  }

  return "protein";
}

function buildPortionSourceFromOverride(item: PlanFoodOverride): MealPortionSource {
  const gramsReference = Number(item.quantity ?? item.gramsReference ?? 0);
  const safeGramsReference = Number.isFinite(gramsReference) && gramsReference > 0 ? gramsReference : 100;
  const nutrition = item.nutrition ?? { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  const ratio = safeGramsReference > 0 ? 100 / safeGramsReference : 1;
  const role = resolveMealFoodRole(item.role);

  return {
    name: item.name ?? "Alimento",
    role,
    foodId: item.foodId ?? null,
    baseGramsReference: safeGramsReference,
    nutritionPer100: {
      calories: Number((nutrition.calories ?? 0).toFixed(1)) * ratio,
      proteins: Number((nutrition.proteins ?? 0).toFixed(1)) * ratio,
      carbs: Number((nutrition.carbs ?? 0).toFixed(1)) * ratio,
      fats: Number((nutrition.fats ?? 0).toFixed(1)) * ratio,
    },
    category: null,
    isBeverage: Boolean(item.isBeverage) || item.unit === "ml" || role === "infusion",
  };
}

function buildMealPortionTargetsFromUser(user: {
  kcal_objetivo: number | null;
  proteinas_g_obj: number | null;
  grasas_g_obj: number | null;
  carbohidratos_g_obj: number | null;
}): MealPortionTargets {
  return {
    kcalObjetivo: round(user.kcal_objetivo ?? 0),
    proteinasG: round(user.proteinas_g_obj ?? 0),
    grasasG: round(user.grasas_g_obj ?? 0),
    carbohidratosG: round(user.carbohidratos_g_obj ?? 0),
    proteinasPct:
      (user.kcal_objetivo ?? 0) > 0 ? Number((((user.proteinas_g_obj ?? 0) * 4 * 100) / (user.kcal_objetivo ?? 1)).toFixed(1)) : 0,
    grasasPct:
      (user.kcal_objetivo ?? 0) > 0 ? Number((((user.grasas_g_obj ?? 0) * 9 * 100) / (user.kcal_objetivo ?? 1)).toFixed(1)) : 0,
    carbohidratosPct:
      (user.kcal_objetivo ?? 0) > 0 ? Number((((user.carbohidratos_g_obj ?? 0) * 4 * 100) / (user.kcal_objetivo ?? 1)).toFixed(1)) : 0,
  };
}

function sumOverrideFoodsNutrition(
  foods: Array<{ nutrition: Partial<DashboardMacroTotals> | null | undefined }>
): DashboardMacroTotals {
  return foods.reduce<DashboardMacroTotals>(
    (accumulator, food) => ({
      calories: round(accumulator.calories + Number(food.nutrition?.calories ?? 0)),
      proteins: round(accumulator.proteins + Number(food.nutrition?.proteins ?? 0)),
      carbs: round(accumulator.carbs + Number(food.nutrition?.carbs ?? 0)),
      fats: round(accumulator.fats + Number(food.nutrition?.fats ?? 0)),
    }),
    emptyTotals()
  );
}

function getFallbackFatBaseGrams(mealType: ComidaTipo): number {
  return mealType === "Snack" ? 10 : 15;
}

function buildGeneratedMealIngredients(
  mealType: ComidaTipo,
  targets: MealPortionTargets,
  items: PlanFoodOverride[]
): UserDashboardMealIngredient[] {
  const sources = items.map(buildPortionSourceFromOverride);

  return buildTargetMealPortions(mealType, targets, sources).map((item) => ({
    name: item.name,
    grams: item.gramsReference,
    portionLabel: item.portionLabel,
    nutrition: item.nutrition,
    category: item.category ?? null,
    isBeverage: item.isBeverage,
    role: item.role,
  }));
}

function buildOverrideMealIngredients(items: PlanFoodOverride[]): UserDashboardMealIngredient[] {
  return items.map((item) => {
    const grams = Number(item.quantity ?? item.gramsReference ?? 0);
    const safeGrams = Number.isFinite(grams) ? grams : 0;
    const unit = item.unit === "ml" ? "ml" : "g";
    const portionLabel = item.quantityLabel?.trim() || `${Math.round(safeGrams)} ${unit}`;

    return {
      name: item.name ?? "Alimento",
      grams: safeGrams,
      portionLabel,
      category: null,
      isBeverage: Boolean(item.isBeverage) || unit === "ml",
      role: item.role ?? null,
      nutrition: {
        calories: Number(item.nutrition?.calories ?? 0),
        proteins: Number(item.nutrition?.proteins ?? 0),
        carbs: Number(item.nutrition?.carbs ?? 0),
        fats: Number(item.nutrition?.fats ?? 0),
      },
    };
  });
}

function sumIngredientTotals(ingredients: UserDashboardMealIngredient[]): DashboardMacroTotals {
  return ingredients.reduce<DashboardMacroTotals>(
    (accumulator, ingredient) => ({
      calories: round(accumulator.calories + (ingredient.nutrition.calories ?? 0)),
      proteins: round(accumulator.proteins + (ingredient.nutrition.proteins ?? 0)),
      carbs: round(accumulator.carbs + (ingredient.nutrition.carbs ?? 0)),
      fats: round(accumulator.fats + (ingredient.nutrition.fats ?? 0)),
    }),
    emptyTotals()
  );
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

function normalizeFoodLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function resolveFallbackFatFood() {
  let fatFoods = await prisma.alimento.findMany({
    where: { categoria_enum: "Grasos" },
    select: {
      id: true,
      nombre: true,
      calorias: true,
      proteinas: true,
      carbohidratos: true,
      grasas: true,
      porcion: true,
      categoria_enum: true,
      categoria: true,
    },
    orderBy: [{ nombre: "asc" }],
  });

  if (fatFoods.length === 0) {
    await syncSeedFoodsToDatabase();
    fatFoods = await prisma.alimento.findMany({
      where: { categoria_enum: "Grasos" },
      select: {
        id: true,
        nombre: true,
        calorias: true,
        proteinas: true,
        carbohidratos: true,
        grasas: true,
        porcion: true,
        categoria_enum: true,
        categoria: true,
      },
      orderBy: [{ nombre: "asc" }],
    });
  }

  if (fatFoods.length === 0) {
    return null;
  }

  const preferredFatNames = ["aceite de oliva", "aguacate", "palta", "mantequilla", "mayonesa"];

  for (const preferredName of preferredFatNames) {
    const matched = fatFoods.find((food) => normalizeFoodLookup(food.nombre) === preferredName);

    if (matched) {
      return matched;
    }
  }

  return fatFoods[0] ?? null;
}

async function repairGeneratedMealPlansMissingFat(userId: number) {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      kcal_objetivo: true,
      proteinas_g_obj: true,
      grasas_g_obj: true,
      carbohidratos_g_obj: true,
      planes: {
        orderBy: [{ fecha: "asc" }, { comida_tipo: "asc" }],
        select: {
          id: true,
          recetaId: true,
          comida_tipo: true,
          overrides: true,
        },
      },
    },
  });

  if (!user) {
    return false;
  }

  const mealPortionTargets = buildMealPortionTargetsFromUser(user);

  if (mealPortionTargets.grasasG <= 0) {
    return false;
  }

  const fallbackFatFood = await resolveFallbackFatFood();

  if (!fallbackFatFood) {
    return false;
  }

  const repairs: Array<{
    planId: number;
    recipeId: number;
    foods: ReturnType<typeof buildTargetMealPortions>;
    overrides: Record<string, unknown>;
  }> = [];

  for (const plan of user.planes) {
    const overrideFoods = getOverrideFoods(plan.overrides);

    if (!overrideFoods || overrideFoods.length === 0) {
      continue;
    }

    if (!overrideFoods.every((food) => food.foodId != null)) {
      continue;
    }

    if (overrideFoods.some((food) => resolveMealFoodRole(food.role) === "fat")) {
      continue;
    }

    const sources = overrideFoods.map(buildPortionSourceFromOverride);

    sources.push({
      name: fallbackFatFood.nombre,
      role: "fat",
      foodId: fallbackFatFood.id,
      baseGramsReference: getFallbackFatBaseGrams(plan.comida_tipo),
      nutritionPer100: {
        calories: round(fallbackFatFood.calorias ?? 0),
        proteins: round(fallbackFatFood.proteinas ?? 0),
        carbs: round(fallbackFatFood.carbohidratos ?? 0),
        fats: round(fallbackFatFood.grasas ?? 0),
      },
      category: fallbackFatFood.categoria_enum ?? fallbackFatFood.categoria ?? null,
      isBeverage: (fallbackFatFood.porcion ?? "").toLowerCase().includes("ml"),
    });

    const rebuiltFoods = buildTargetMealPortions(plan.comida_tipo, mealPortionTargets, sources);
    const rebuiltMealNutrition = sumOverrideFoodsNutrition(
      rebuiltFoods.map((food) => ({ nutrition: food.nutrition }))
    );

    const nextOverrides =
      typeof plan.overrides === "object" && plan.overrides !== null
        ? {
            ...(plan.overrides as Record<string, unknown>),
            foods: rebuiltFoods,
            mealNutrition: rebuiltMealNutrition,
          }
        : {
            foods: rebuiltFoods,
            mealNutrition: rebuiltMealNutrition,
          };

    repairs.push({
      planId: plan.id,
      recipeId: plan.recetaId,
      foods: rebuiltFoods,
      overrides: nextOverrides,
    });
  }

  if (repairs.length === 0) {
    return false;
  }

  await prisma.$transaction(async (tx) => {
    for (const repair of repairs) {
      await tx.receta.update({
        where: { id: repair.recipeId },
        data: {
          alimentos: {
            deleteMany: {},
            create: repair.foods
              .filter((food) => food.foodId !== null)
              .map((food) => ({
                alimentoId: food.foodId as number,
                gramos: food.gramsReference,
              })),
          },
        },
      });

      await tx.planComida.update({
        where: { id: repair.planId },
        data: {
          overrides: repair.overrides as Prisma.InputJsonValue,
        },
      });
    }
  });

  return true;
}

function buildDashboardPlan(
  user: {
    nombre: string;
    apellido: string;
    fecha_nacimiento: Date;
    sexo: string;
    altura_cm: number | null;
    agua_litros_obj: number | null;
    objetivo: Objetivo | null;
    kcal_objetivo: number | null;
    proteinas_g_obj: number | null;
    grasas_g_obj: number | null;
    carbohidratos_g_obj: number | null;
    hidratacion: Array<{
      fecha: Date;
      litros: number;
      completado: boolean;
    }>;
    cumplimientos_dieta: Array<{
      fecha: Date;
      cumplido: boolean;
    }>;
    planes: Array<{
      id: number;
      fecha: Date;
      comida_tipo: ComidaTipo;
      overrides: unknown;
      receta: {
        nombre: string;
        instrucciones: string | null;
        esCompartida: boolean;
        compartidaEn: Date | null;
        compartidaPor: {
          nombre: string;
          apellido: string;
        } | null;
        creadaPor: {
          nombre: string;
          apellido: string;
        } | null;
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
  const mealPortionTargets = buildMealPortionTargetsFromUser(user);
  const mealsByDate = new Map<string, UserDashboardMeal[]>();
  const weekTotals = user.planes.reduce<DashboardMacroTotals>((acc, plan) => {
    const dateKey = toDateKey(plan.fecha);
    const currentMeals = mealsByDate.get(dateKey) ?? [];
    const overrideFoods = getOverrideFoods(plan.overrides);
    const hasGeneratedFoodIds = overrideFoods !== null && overrideFoods.length > 0 && overrideFoods.every((food) => food.foodId != null);
    const ingredients =
      overrideFoods === null
        ? buildMealIngredients(plan.receta.alimentos)
        : hasGeneratedFoodIds
          ? buildGeneratedMealIngredients(
              plan.comida_tipo,
              mealPortionTargets,
              overrideFoods
            )
          : buildOverrideMealIngredients(overrideFoods);
    const totals = sumIngredientTotals(ingredients);
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
      isShared: plan.receta.esCompartida,
      sharedByName: plan.receta.compartidaPor
        ? `${plan.receta.compartidaPor.nombre} ${plan.receta.compartidaPor.apellido}`.trim()
        : null,
      sharedAtIso: plan.receta.compartidaEn?.toISOString() ?? null,
      createdByName: plan.receta.creadaPor
        ? `${plan.receta.creadaPor.nombre} ${plan.receta.creadaPor.apellido}`.trim()
        : null,
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
  const dailyWaterLiters = Number((user.agua_litros_obj ?? 0).toFixed(2));
  const waterConsumedLiters = Number(
    user.hidratacion.reduce((accumulator, entry) => {
      const dateKey = toDateKey(entry.fecha);
      if (dateKey !== selectedDateIso) {
        return accumulator;
      }

      return accumulator + (entry.litros ?? 0);
    }, 0).toFixed(2)
  );
  const dayCompleted = user.cumplimientos_dieta.some((entry) => {
    return toDateKey(entry.fecha) === selectedDateIso && entry.cumplido;
  });

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
    dailyWaterLiters,
    waterConsumedLiters,
    dayCompleted,
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

function buildDashboardProfile(user: {
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  sexo: string;
  altura_cm: number | null;
  peso_kg: number | null;
  tipo_entrenamiento: string | null;
  frecuencia_entreno: number | null;
  anos_entrenando: number | null;
}): UserDashboardProfile {
  return {
    nombre: user.nombre,
    apellido: user.apellido,
    birthDateIso: user.fecha_nacimiento.toISOString(),
    sexo: user.sexo,
    alturaCm: user.altura_cm,
    pesoKg: user.peso_kg,
    tipoEntrenamiento: user.tipo_entrenamiento,
    frecuenciaEntreno: user.frecuencia_entreno,
    anosEntrenando: user.anos_entrenando,
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
      nombre: true,
      apellido: true,
      fecha_nacimiento: true,
      sexo: true,
      altura_cm: true,
      peso_kg: true,
      tipo_entrenamiento: true,
      frecuencia_entreno: true,
      anos_entrenando: true,
      agua_litros_obj: true,
      objetivo: true,
      kcal_objetivo: true,
      proteinas_g_obj: true,
      grasas_g_obj: true,
      carbohidratos_g_obj: true,
      hidratacion: {
        select: {
          fecha: true,
          litros: true,
          completado: true,
        },
      },
      cumplimientos_dieta: {
        select: {
          fecha: true,
          cumplido: true,
        },
      },
      planes: {
        orderBy: [{ fecha: "asc" }, { comida_tipo: "asc" }],
        select: {
          id: true,
          fecha: true,
          comida_tipo: true,
          overrides: true,
          receta: {
            select: {
              nombre: true,
              instrucciones: true,
              esCompartida: true,
              compartidaEn: true,
              compartidaPor: {
                select: {
                  nombre: true,
                  apellido: true,
                },
              },
              creadaPor: {
                select: {
                  nombre: true,
                  apellido: true,
                },
              },
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
  profile: UserDashboardProfile | null;
  dashboard: UserDashboardPlan | null;
  hasLoadError: boolean;
};

export async function loadUsersPageState(options?: { requestedDateIso?: string | null }): Promise<UsersPageState> {
  const sessionUser = await requireCompletedOnboarding();
  let profile: UserDashboardProfile | null = null;
  let dashboard: UserDashboardPlan | null = null;
  let hasLoadError = false;

  try {
    await repairGeneratedMealPlansMissingFat(sessionUser.userId);

    let user = await loadDashboardUser(sessionUser.userId);

    if (user) {
      profile = buildDashboardProfile(user);
      dashboard = buildDashboardPlan(user, options?.requestedDateIso ?? null);

      if (!hasMeaningfulPlan(dashboard) && user.planes.length > 0) {
        await syncSeedFoodsToDatabase();
        user = await loadDashboardUser(sessionUser.userId);
        profile = user ? buildDashboardProfile(user) : profile;
        dashboard = user ? buildDashboardPlan(user, options?.requestedDateIso ?? null) : null;
      }
    }
  } catch (error) {
    console.error("Error loading dashboard", error);
    hasLoadError = true;
  }

  return { sessionUser, profile, dashboard, hasLoadError };
}
