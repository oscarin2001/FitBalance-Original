"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";
import { buildActionError, getSpanishValidationMessage, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";
import { toDateKey } from "@/lib/date-labels";

import { MAX_INGREDIENT_QUANTITY } from "./constants";
import { loadEditablePlanMeal, resolveEditableFoods, calculateTotals, formatQuantityLabel, type PlanFoodOverride } from "./meal-helpers";

const quickEntrySchema = z.object({
  dateIso: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealId: z.number().int().positive(),
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del alimento.")
    .max(120, "El nombre del alimento no puede superar 120 caracteres.")
    .refine((value) => !/\d/.test(value), { message: "El nombre del alimento no debe incluir números." }),
  grams: z.number().min(1).max(MAX_INGREDIENT_QUANTITY),
  calories: z.number().min(0).max(100000),
  carbs: z.number().min(0).max(100000),
  carbMode: z.enum(["total", "net"]),
  sugarAlcohols: z.number().min(0).max(100000),
  fiber: z.number().min(0).max(100000),
  allulose: z.number().min(0).max(100000),
  proteins: z.number().min(0).max(100000),
  fats: z.number().min(0).max(100000),
  glycemicLoad: z.number().min(0).max(1000).optional(),
  notes: z.string().trim().max(500).optional(),
  share: z.boolean(),
});

type BuildNameInput = {
  nombre: string;
  apellido: string;
};

function buildDisplayName(user: BuildNameInput | null | undefined) {
  if (!user) {
    return "Comunidad Fitbalance";
  }

  const fullName = `${user.nombre} ${user.apellido}`.trim();
  return fullName.length > 0 ? fullName : "Comunidad Fitbalance";
}

function roundNutrition(value: number) {
  return Number(value.toFixed(1));
}

type SharedQuickEntryRow = {
  id: number;
  nombre: string;
  gramos: number;
  calorias: number;
  carbs: number;
  carbMode: string | null;
  sugarAlcohols: number;
  fiber: number;
  allulose: number;
  proteins: number;
  fats: number;
  glycemicLoad: number | null;
  notes: string | null;
  compartidaEn: Date | string;
  compartidaPorId: number;
  compartidaPorNombre: string | null;
  compartidaPorApellido: string | null;
  creadaPorNombre: string | null;
  creadaPorApellido: string | null;
};

function formatUserName(nombre: string | null, apellido: string | null) {
  const fullName = `${nombre ?? ""} ${apellido ?? ""}`.trim();
  return fullName.length > 0 ? fullName : null;
}

export type SharedQuickEntrySummary = {
  id: number;
  name: string;
  gramsReference: number;
  calories: number;
  carbs: number;
  carbMode: "total" | "net" | null;
  sugarAlcohols: number;
  fiber: number;
  allulose: number;
  proteins: number;
  fats: number;
  glycemicLoad: number | null;
  notes: string | null;
  sharedByName: string;
  sharedById: number | null;
  sharedAtIso: string | null;
  createdByName: string | null;
};

async function requireSessionUser() {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return { ok: false as const, error: buildActionError("Tu sesion expiro. Inicia sesion nuevamente.") };
  }

  return { ok: true as const, sessionUser };
}

function resolveQuickEntryRole(proteins: number, carbs: number, fats: number) {
  if (proteins >= carbs && proteins >= fats) {
    return "protein";
  }

  if (fats >= proteins && fats >= carbs) {
    return "fat";
  }

  return "carb";
}

export async function addDashboardMealQuickEntryAction(input: unknown): Promise<ActionResult> {
  const parsed = quickEntrySchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(getSpanishValidationMessage(parsed.error));
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

  const totalCarbs =
    parsed.data.carbMode === "net"
      ? parsed.data.carbs + parsed.data.sugarAlcohols + parsed.data.fiber + parsed.data.allulose
      : parsed.data.carbs;

  const currentFoods = resolveEditableFoods(meal.overrides, meal.receta.alimentos);
  const nextFood: PlanFoodOverride = {
    name: parsed.data.name,
    quantity: parsed.data.grams,
    unit: "g",
    quantityLabel: formatQuantityLabel(parsed.data.grams, "g"),
    gramsReference: parsed.data.grams,
    foodId: null,
    isBeverage: false,
    role: resolveQuickEntryRole(parsed.data.proteins, totalCarbs, parsed.data.fats),
    carbMode: parsed.data.carbMode,
    sugarAlcohols: parsed.data.sugarAlcohols,
    fiber: parsed.data.fiber,
    allulose: parsed.data.allulose,
    glycemicLoad: parsed.data.glycemicLoad ?? null,
    notes: parsed.data.notes ?? null,
    nutrition: {
      calories: Number(parsed.data.calories.toFixed(1)),
      proteins: Number(parsed.data.proteins.toFixed(1)),
      carbs: Number(totalCarbs.toFixed(1)),
      fats: Number(parsed.data.fats.toFixed(1)),
    },
  };

  const nextFoods = [...currentFoods, nextFood];
  const normalizedNotes = parsed.data.notes?.trim();

  await prisma.$transaction(async (tx) => {
    await tx.planComida.update({
      where: { id: meal.id },
      data: {
        overrides:
          typeof meal.overrides === "object" && meal.overrides !== null
            ? {
                ...(meal.overrides as Record<string, unknown>),
                applied: true,
                foods: nextFoods,
                mealNutrition: calculateTotals(nextFoods),
              }
            : {
                applied: true,
                foods: nextFoods,
                mealNutrition: calculateTotals(nextFoods),
              },
      },
    });

    if (parsed.data.share) {
      const sharedAt = new Date();

      await tx.$executeRaw`
        INSERT INTO "EntradaRapidaCompartida" (
          "nombre",
          "gramos",
          "calorias",
          "carbs",
          "carbMode",
          "sugarAlcohols",
          "fiber",
          "allulose",
          "proteins",
          "fats",
          "glycemicLoad",
          "notes",
          "esCompartida",
          "compartidaEn",
          "creadaPorId",
          "compartidaPorId"
        ) VALUES (
          ${parsed.data.name},
          ${parsed.data.grams},
          ${roundNutrition(parsed.data.calories)},
          ${roundNutrition(totalCarbs)},
          ${parsed.data.carbMode},
          ${roundNutrition(parsed.data.sugarAlcohols)},
          ${roundNutrition(parsed.data.fiber)},
          ${roundNutrition(parsed.data.allulose)},
          ${roundNutrition(parsed.data.proteins)},
          ${roundNutrition(parsed.data.fats)},
          ${parsed.data.glycemicLoad ?? null},
          ${normalizedNotes && normalizedNotes.length > 0 ? normalizedNotes : null},
          ${1},
          ${sharedAt},
          ${sessionResult.sessionUser.userId},
          ${sessionResult.sessionUser.userId}
        )
      `;
    }
  });

  revalidatePath("/users");

  return {
    ok: true,
    message: "Entrada rapida guardada.",
  };
}

export async function loadSharedQuickEntriesAction(): Promise<ActionResult & { quickEntries?: SharedQuickEntrySummary[] }> {
  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const quickEntries = await prisma.$queryRaw<SharedQuickEntryRow[]>`
    SELECT
      q."id" AS "id",
      q."nombre" AS "nombre",
      q."gramos" AS "gramos",
      q."calorias" AS "calorias",
      q."carbs" AS "carbs",
      q."carbMode" AS "carbMode",
      q."sugarAlcohols" AS "sugarAlcohols",
      q."fiber" AS "fiber",
      q."allulose" AS "allulose",
      q."proteins" AS "proteins",
      q."fats" AS "fats",
      q."glycemicLoad" AS "glycemicLoad",
      q."notes" AS "notes",
      q."compartidaEn" AS "compartidaEn",
      q."compartidaPorId" AS "compartidaPorId",
      compartidaPor."nombre" AS "compartidaPorNombre",
      compartidaPor."apellido" AS "compartidaPorApellido",
      creadaPor."nombre" AS "creadaPorNombre",
      creadaPor."apellido" AS "creadaPorApellido"
    FROM "EntradaRapidaCompartida" q
    LEFT JOIN "Usuario" compartidaPor ON compartidaPor."id" = q."compartidaPorId"
    LEFT JOIN "Usuario" creadaPor ON creadaPor."id" = q."creadaPorId"
    WHERE q."esCompartida" = 1
    ORDER BY q."compartidaEn" DESC, q."nombre" ASC
  `;

  return {
    ok: true,
    quickEntries: quickEntries.map((entry) => ({
      id: entry.id,
      name: entry.nombre,
      gramsReference: roundNutrition(entry.gramos),
      calories: roundNutrition(entry.calorias),
      carbs: roundNutrition(entry.carbs),
      carbMode: entry.carbMode === "net" || entry.carbMode === "total" ? entry.carbMode : null,
      sugarAlcohols: roundNutrition(entry.sugarAlcohols),
      fiber: roundNutrition(entry.fiber),
      allulose: roundNutrition(entry.allulose),
      proteins: roundNutrition(entry.proteins),
      fats: roundNutrition(entry.fats),
      glycemicLoad: entry.glycemicLoad ?? null,
      notes: entry.notes,
      sharedByName: formatUserName(entry.compartidaPorNombre, entry.compartidaPorApellido) ?? "Comunidad Fitbalance",
      sharedById: entry.compartidaPorId,
      sharedAtIso: new Date(entry.compartidaEn).toISOString(),
      createdByName: formatUserName(entry.creadaPorNombre, entry.creadaPorApellido),
    })),
  };
}
