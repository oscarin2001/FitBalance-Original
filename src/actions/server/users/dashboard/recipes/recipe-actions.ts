"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";
import { buildActionError, getSpanishValidationMessage, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";
import { splitInstructionText } from "@/components/users/dashboard/lib/meal-formatters";
import { MAX_INGREDIENT_QUANTITY } from "@/actions/server/users/dashboard/daily-log/constants";
import { formatQuantityLabel, scaleNutrition } from "@/actions/server/users/dashboard/daily-log/meal-helpers";

const recipeIngredientSchema = z.object({
  foodId: z.number().int().positive(),
  quantity: z.number().positive().max(MAX_INGREDIENT_QUANTITY),
  unit: z.enum(["g", "ml"]),
});

const createRecipeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa un nombre para la receta.")
    .max(120, "El nombre de la receta no puede superar 120 caracteres.")
    .refine((value) => !/\d/.test(value), { message: "El nombre de la receta no debe incluir números." }),
  instructions: z.string().trim().max(8000).optional(),
  portions: z.number().int().min(1).max(100),
  share: z.boolean(),
  ingredients: z.array(recipeIngredientSchema).min(1),
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

export type RecipeCreateInput = z.infer<typeof createRecipeSchema>;

export type SharedRecipeSummary = {
  id: number;
  name: string;
  instructions: string[];
  portions: number;
  ingredientCount: number;
  sharedByName: string;
  sharedById: number | null;
  sharedAtIso: string | null;
  createdByName: string | null;
  ingredients: Array<{
    name: string;
    grams: number;
    portionLabel: string;
    category: string | null;
    isBeverage: boolean;
    nutrition: {
      calories: number;
      proteins: number;
      carbs: number;
      fats: number;
    };
  }>;
  totals: {
    calories: number;
    proteins: number;
    carbs: number;
    fats: number;
  };
};

export async function createRecipeAction(input: unknown): Promise<ActionResult> {
  const parsed = createRecipeSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(getSpanishValidationMessage(parsed.error));
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const foodIds = [...new Set(parsed.data.ingredients.map((ingredient) => ingredient.foodId))];
  const foods = await prisma.alimento.findMany({
    where: { id: { in: foodIds } },
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
  });

  const foodById = new Map(foods.map((food) => [food.id, food]));

  if (foods.length !== foodIds.length) {
    return buildActionError("Uno de los ingredientes ya no existe.");
  }

  const createdAt = new Date();
  const normalizedInstructions = parsed.data.instructions?.trim();

  await prisma.receta.create({
    data: {
      nombre: parsed.data.name,
      instrucciones: normalizedInstructions ? normalizedInstructions : null,
      porciones: parsed.data.portions,
      tipo: null,
      esCompartida: parsed.data.share,
      compartidaEn: parsed.data.share ? createdAt : null,
      compartidaPorId: parsed.data.share ? sessionResult.sessionUser.userId : null,
      creadaPorId: sessionResult.sessionUser.userId,
      alimentos: {
        create: parsed.data.ingredients.map((ingredient) => ({
          alimentoId: ingredient.foodId,
          gramos: ingredient.quantity,
        })),
      },
    },
  });

  revalidatePath("/users");

  return {
    ok: true,
    message: parsed.data.share ? "Receta compartida." : "Receta creada.",
  };
}

export async function loadSharedRecipesAction(): Promise<ActionResult & { recipes?: SharedRecipeSummary[] }> {
  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const recipes = await prisma.receta.findMany({
    where: { esCompartida: true },
    orderBy: [{ compartidaEn: "desc" }, { nombre: "asc" }],
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

      const totals = ingredients.reduce(
        (accumulator, ingredient) => addTotals(accumulator, ingredient.nutrition),
        emptyTotals()
      );
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

      const totals = ingredients.reduce(
        (accumulator, ingredient) => addTotals(accumulator, ingredient.nutrition),
        emptyTotals()
      );
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
