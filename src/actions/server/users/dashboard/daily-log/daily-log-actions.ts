"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";
import { buildActionError, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";
import { parseDateKey, toDateKey } from "@/lib/date-labels";

import { MAX_INGREDIENT_QUANTITY } from "./constants";

const WATER_GLASS_LITERS = 0.25;

const dailyComplianceSchema = z
  .object({
    dateIso: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    completed: z.boolean(),
  })
  .refine(
    ({ dateIso }) => {
      const parsedDate = parseDateKey(dateIso);
      return !Number.isNaN(parsedDate.getTime()) && toDateKey(parsedDate) === dateIso;
    },
    {
      message: "Fecha invalida.",
      path: ["dateIso"],
    }
  );

export type UpdateDailyComplianceInput = z.infer<typeof dailyComplianceSchema>;

async function requireSessionUser() {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return { ok: false as const, error: buildActionError("Tu sesion expiro. Inicia sesion nuevamente.") };
  }

  return { ok: true as const, sessionUser };
}

export async function updateDailyComplianceAction(input: UpdateDailyComplianceInput): Promise<ActionResult> {
  const parsed = dailyComplianceSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Fecha invalida.");
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const targetDate = parseDateKey(parsed.data.dateIso);
  const existingEntries = await prisma.cumplimientoDieta.findMany({
    where: { usuarioId: sessionResult.sessionUser.userId },
    select: { id: true, fecha: true },
  });

  const matchingIds = existingEntries
    .filter((entry) => toDateKey(entry.fecha) === parsed.data.dateIso)
    .map((entry) => entry.id);

  if (matchingIds.length > 0) {
    await prisma.cumplimientoDieta.updateMany({
      where: { id: { in: matchingIds } },
      data: { cumplido: parsed.data.completed },
    });

    revalidatePath("/users");

    return {
      ok: true,
      message: parsed.data.completed ? "Día marcado como completado." : "Día marcado como pendiente.",
    };
  }

  if (!parsed.data.completed) {
    return {
      ok: true,
      message: "Día marcado como pendiente.",
    };
  }

  await prisma.cumplimientoDieta.create({
    data: {
      usuarioId: sessionResult.sessionUser.userId,
      fecha: targetDate,
      cumplido: true,
    },
  });

  revalidatePath("/users");

  return {
    ok: true,
    message: "Día marcado como completado.",
  };
}

const dailyHydrationSchema = z
  .object({
    dateIso: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    glassCount: z.number().int().min(0).max(64),
    dailyWaterLiters: z.number().min(0).max(20),
  })
  .refine(
    ({ dateIso }) => {
      const parsedDate = parseDateKey(dateIso);
      return !Number.isNaN(parsedDate.getTime()) && toDateKey(parsedDate) === dateIso;
    },
    {
      message: "Fecha invalida.",
      path: ["dateIso"],
    }
  );

export type UpdateDailyHydrationInput = z.infer<typeof dailyHydrationSchema>;

export async function updateDailyHydrationAction(input: UpdateDailyHydrationInput): Promise<ActionResult> {
  const parsed = dailyHydrationSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Fecha invalida.");
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const targetDate = parseDateKey(parsed.data.dateIso);
  const waterLiters = Number((parsed.data.glassCount * WATER_GLASS_LITERS).toFixed(2));
  const hydrationCompleted = parsed.data.dailyWaterLiters > 0 ? waterLiters >= parsed.data.dailyWaterLiters : waterLiters > 0;

  const existingEntries = await prisma.hidratacionDia.findMany({
    where: { usuarioId: sessionResult.sessionUser.userId },
    select: { id: true, fecha: true },
  });

  const matchingIds = existingEntries
    .filter((entry) => toDateKey(entry.fecha) === parsed.data.dateIso)
    .map((entry) => entry.id);

  if (matchingIds.length > 0) {
    await prisma.hidratacionDia.updateMany({
      where: { id: { in: matchingIds } },
      data: {
        litros: waterLiters,
        completado: hydrationCompleted,
      },
    });

    revalidatePath("/users");

    return {
      ok: true,
      message: waterLiters > 0 ? "Agua guardada." : "Agua reiniciada.",
    };
  }

  if (waterLiters <= 0) {
    revalidatePath("/users");

    return {
      ok: true,
      message: "Agua reiniciada.",
    };
  }

  await prisma.hidratacionDia.create({
    data: {
      usuarioId: sessionResult.sessionUser.userId,
      fecha: targetDate,
      litros: waterLiters,
      completado: hydrationCompleted,
    },
  });

  revalidatePath("/users");

  return {
    ok: true,
    message: "Agua guardada.",
  };
}

const ingredientEditSchema = z.object({
  dateIso: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealId: z.number().int().positive(),
  ingredientId: z.string().trim().min(1),
  ingredient: z.object({
    name: z.string().trim().min(1).max(80),
    quantity: z.number().positive().max(MAX_INGREDIENT_QUANTITY),
    unit: z.enum(["g", "ml"]),
  }),
});

const ingredientDeleteSchema = z.object({
  dateIso: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealId: z.number().int().positive(),
  ingredientId: z.string().trim().min(1),
});

type PlanFoodOverride = {
  name?: string;
  quantity?: number | null;
  unit?: string | null;
  quantityLabel?: string | null;
  gramsReference?: number | null;
  isBeverage?: boolean | null;
  role?: string | null;
  nutrition?: {
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
  } | null;
};

function parseIngredientIndex(ingredientId: string) {
  const rawIndex = ingredientId.split("-").pop();
  const index = Number(rawIndex);

  return Number.isInteger(index) && index >= 0 ? index : null;
}

function formatQuantityLabel(quantity: number, unit: "g" | "ml") {
  const rounded = Number(quantity.toFixed(1));
  const displayQuantity = Number.isInteger(rounded) ? String(Math.round(rounded)) : rounded.toFixed(1);

  return `${displayQuantity} ${unit}`;
}

function scaleNutrition(
  baseNutrition: {
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
  } | null | undefined,
  baseQuantity: number,
  nextQuantity: number
) {
  const safeBaseQuantity = baseQuantity > 0 ? baseQuantity : 1;
  const ratio = nextQuantity > 0 ? nextQuantity / safeBaseQuantity : 0;

  return {
    calories: Number((((baseNutrition?.calories ?? 0) * ratio).toFixed(1))),
    proteins: Number((((baseNutrition?.proteins ?? 0) * ratio).toFixed(1))),
    carbs: Number((((baseNutrition?.carbs ?? 0) * ratio).toFixed(1))),
    fats: Number((((baseNutrition?.fats ?? 0) * ratio).toFixed(1))),
  };
}

function buildFallbackPlanFoods(planFoods: Array<{
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
}>): PlanFoodOverride[] {
  return planFoods.map((item) => {
    const grams = Number(item.gramos ?? 0);
    const safeGrams = Number.isFinite(grams) ? grams : 0;
    const lowerName = item.alimento.nombre.toLowerCase();
    const lowerPortion = (item.alimento.porcion ?? "").toLowerCase();
    const isBeverage = lowerName.includes("agua") || lowerName.includes("te") || lowerPortion.includes("ml");
    const ratio = safeGrams > 0 ? safeGrams / 100 : 1;

    return {
      name: item.alimento.nombre,
      quantity: safeGrams,
      unit: isBeverage ? "ml" : "g",
      quantityLabel: `${Math.round(safeGrams)} ${isBeverage ? "ml" : "g"}`,
      gramsReference: safeGrams,
      isBeverage,
      nutrition: {
        calories: Number(((item.alimento.calorias ?? 0) * ratio).toFixed(1)),
        proteins: Number(((item.alimento.proteinas ?? 0) * ratio).toFixed(1)),
        carbs: Number(((item.alimento.carbohidratos ?? 0) * ratio).toFixed(1)),
        fats: Number(((item.alimento.grasas ?? 0) * ratio).toFixed(1)),
      },
    };
  });
}

function calculateTotals(foods: PlanFoodOverride[]) {
  return foods.reduce(
    (accumulator, food) => ({
      calories: Number((accumulator.calories + Number(food.nutrition?.calories ?? 0)).toFixed(1)),
      proteins: Number((accumulator.proteins + Number(food.nutrition?.proteins ?? 0)).toFixed(1)),
      carbs: Number((accumulator.carbs + Number(food.nutrition?.carbs ?? 0)).toFixed(1)),
      fats: Number((accumulator.fats + Number(food.nutrition?.fats ?? 0)).toFixed(1)),
    }),
    { calories: 0, proteins: 0, carbs: 0, fats: 0 }
  );
}

function resolveEditableFoods(
  overrides: unknown,
  planFoods: Array<{
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
  }>
): PlanFoodOverride[] {
  if (typeof overrides !== "object" || overrides === null || !("foods" in overrides)) {
    return buildFallbackPlanFoods(planFoods);
  }

  const foods = (overrides as { foods?: unknown }).foods;
  if (!Array.isArray(foods)) {
    return [];
  }

  return foods.filter((food): food is PlanFoodOverride => typeof food === "object" && food !== null && typeof (food as { name?: unknown }).name === "string");
}

async function loadEditablePlanMeal(mealId: number, userId: number) {
  return prisma.planComida.findFirst({
    where: { id: mealId, usuarioId: userId },
    select: {
      id: true,
      fecha: true,
      overrides: true,
      receta: {
        select: {
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
  });
}

export async function updateDashboardMealIngredientAction(input: unknown): Promise<ActionResult> {
  const parsed = ingredientEditSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const meal = await loadEditablePlanMeal(parsed.data.mealId, sessionResult.sessionUser.userId);
  if (!meal) {
    return buildActionError("No encontramos la comida a editar.");
  }

  if (toDateKey(meal.fecha) !== parsed.data.dateIso) {
    return buildActionError("No encontramos la comida a editar.");
  }

  const currentFoods = resolveEditableFoods(meal.overrides, meal.receta.alimentos);
  const ingredientIndex = parseIngredientIndex(parsed.data.ingredientId);

  if (ingredientIndex === null || ingredientIndex >= currentFoods.length) {
    return buildActionError("No encontramos el alimento seleccionado.");
  }

  const currentFood = currentFoods[ingredientIndex];
  if (!currentFood) {
    return buildActionError("No encontramos el alimento seleccionado.");
  }

  const currentQuantity = Number(currentFood.quantity ?? currentFood.gramsReference ?? 1);
  const baseQuantity = Number.isFinite(currentQuantity) && currentQuantity > 0 ? currentQuantity : 1;
  const nextNutrition = scaleNutrition(currentFood.nutrition, baseQuantity, parsed.data.ingredient.quantity);

  const nextFoods = currentFoods.map((food, index) => {
    if (index !== ingredientIndex) {
      return food;
    }

    return {
      ...food,
      name: parsed.data.ingredient.name,
      quantity: parsed.data.ingredient.quantity,
      unit: parsed.data.ingredient.unit,
      quantityLabel: formatQuantityLabel(parsed.data.ingredient.quantity, parsed.data.ingredient.unit),
      gramsReference: parsed.data.ingredient.quantity,
      isBeverage: parsed.data.ingredient.unit === "ml" || food.isBeverage === true,
      nutrition: nextNutrition,
    };
  });

  await prisma.planComida.update({
    where: { id: meal.id },
    data: {
      overrides:
        typeof meal.overrides === "object" && meal.overrides !== null
          ? {
              ...(meal.overrides as Record<string, unknown>),
              foods: nextFoods,
              mealNutrition: calculateTotals(nextFoods),
            }
          : {
              foods: nextFoods,
              mealNutrition: calculateTotals(nextFoods),
            },
    },
  });

  revalidatePath("/users");

  return {
    ok: true,
    message: "Alimento actualizado.",
  };
}

export async function deleteDashboardMealIngredientAction(input: unknown): Promise<ActionResult> {
  const parsed = ingredientDeleteSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const meal = await loadEditablePlanMeal(parsed.data.mealId, sessionResult.sessionUser.userId);
  if (!meal) {
    return buildActionError("No encontramos la comida a editar.");
  }

  if (toDateKey(meal.fecha) !== parsed.data.dateIso) {
    return buildActionError("No encontramos la comida a editar.");
  }

  const currentFoods = resolveEditableFoods(meal.overrides, meal.receta.alimentos);
  const ingredientIndex = parseIngredientIndex(parsed.data.ingredientId);

  if (ingredientIndex === null || ingredientIndex >= currentFoods.length) {
    return buildActionError("No encontramos el alimento seleccionado.");
  }

  const nextFoods = currentFoods.filter((_, index) => index !== ingredientIndex);

  await prisma.planComida.update({
    where: { id: meal.id },
    data: {
      overrides:
        typeof meal.overrides === "object" && meal.overrides !== null
          ? {
              ...(meal.overrides as Record<string, unknown>),
              foods: nextFoods,
              mealNutrition: calculateTotals(nextFoods),
            }
          : {
              foods: nextFoods,
              mealNutrition: calculateTotals(nextFoods),
            },
    },
  });

  revalidatePath("/users");

  return {
    ok: true,
    message: "Alimento eliminado.",
  };
}