"use server";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";
import { buildActionError, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";
import { splitInstructionText } from "@/components/users/dashboard/lib/meal-formatters";

import { formatQuantityLabel, scaleNutrition } from "@/actions/server/users/dashboard/daily-log/meal-helpers";

import type { SharedRecipeSummary } from "./types";

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

function emptyTotals() {
  return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
}

function addTotals(
  accumulator: { calories: number; proteins: number; carbs: number; fats: number },
  nutrition: { calories: number; proteins: number; carbs: number; fats: number }
) {
  return {
    calories: roundNutrition(accumulator.calories + nutrition.calories),
    proteins: roundNutrition(accumulator.proteins + nutrition.proteins),
    carbs: roundNutrition(accumulator.carbs + nutrition.carbs),
    fats: roundNutrition(accumulator.fats + nutrition.fats),
  };
}

async function requireSessionUser() {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return { ok: false as const, error: buildActionError("Tu sesion expiro. Inicia sesion nuevamente.") };
  }

  return { ok: true as const, sessionUser };
}

export async function loadMyRecipesAction(): Promise<ActionResult & { recipes?: SharedRecipeSummary[] }> {
  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const recipes = await prisma.receta.findMany({
    where: { creadaPorId: sessionResult.sessionUser.userId },
    orderBy: [{ esCompartida: "desc" }, { nombre: "asc" }],
    select: {
      id: true,
      nombre: true,
      instrucciones: true,
      porciones: true,
      compartidaEn: true,
      compartidaPorId: true,
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
              id: true,
              nombre: true,
              categoria: true,
              calorias: true,
              proteinas: true,
              carbohidratos: true,
              grasas: true,
              porcion: true,
            },
          },
        },
      },
    },
  });

  return {
    ok: true,
    recipes: recipes.map((recipe) => {
      const ingredients = recipe.alimentos.map((entry) => {
        const food = entry.alimento;
        const isBeverage = (food.porcion ?? "").toLowerCase().includes("ml");
        const portionLabel = formatQuantityLabel(entry.gramos, isBeverage ? "ml" : "g");
        const nutrition = scaleNutrition(
          {
            calories: food.calorias ?? 0,
            proteins: food.proteinas ?? 0,
            carbs: food.carbohidratos ?? 0,
            fats: food.grasas ?? 0,
          },
          100,
          entry.gramos
        );

        return {
          name: food.nombre,
          grams: entry.gramos,
          portionLabel,
          category: food.categoria,
          isBeverage,
          nutrition,
        };
      });

      const totals = ingredients.reduce((accumulator, ingredient) => addTotals(accumulator, ingredient.nutrition), emptyTotals());
      const sharedByName = buildDisplayName(recipe.compartidaPor ?? recipe.creadaPor);
      const createdByName = recipe.creadaPor ? buildDisplayName(recipe.creadaPor) : null;

      return {
        id: recipe.id,
        name: recipe.nombre,
        instructions: splitInstructionText(recipe.instrucciones),
        portions: recipe.porciones,
        ingredientCount: recipe.alimentos.length,
        sharedByName,
        sharedById: recipe.compartidaPorId,
        sharedAtIso: recipe.compartidaEn?.toISOString() ?? null,
        createdByName,
        ingredients,
        totals,
      } satisfies SharedRecipeSummary;
    }),
  };
}
