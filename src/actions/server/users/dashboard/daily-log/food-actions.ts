"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";
import { syncSeedFoodsToDatabase } from "@/actions/server/users/onboarding/logic/food-seed-sync";
import { buildActionError, getSpanishValidationMessage, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";
import { toDateKey } from "@/lib/date-labels";

import { FOOD_CREATE_CATEGORIES, getFoodCreateCategoryLabel, type FoodCreateCategoryValue } from "./food-create-options";
import { MAX_INGREDIENT_QUANTITY } from "./constants";
import {
  calculateTotals,
  formatQuantityLabel,
  loadEditablePlanMeal,
  resolveEditableFoods,
  scaleNutrition,
  type PlanFoodOverride,
} from "./meal-helpers";
import type { DailyLogFoodOption } from "./types";

type LoadDailyLogFoodCatalogResult = ActionResult & {
  foods?: DailyLogFoodOption[];
};

type FoodOptionSource = {
  id: number;
  nombre: string;
  categoria: string | null;
  categoria_enum: string | null;
  esCompartido?: boolean | null;
  creadaPorId?: number | null;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  porcion: string | null;
  usuarios?: Array<{ prioridad: number | null }>;
  recetas?: Array<{ id: number }>;
};

const foodCreateCategoryValues = FOOD_CREATE_CATEGORIES.map((category) => category.value) as [
  FoodCreateCategoryValue,
  ...FoodCreateCategoryValue[]
];

const dailyLogAddFoodSchema = z.object({
  dateIso: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealId: z.number().int().positive(),
  foodId: z.number().int().positive(),
  quantity: z.number().positive().max(MAX_INGREDIENT_QUANTITY),
  unit: z.enum(["g", "ml"]),
});

const createFoodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa un nombre para el alimento.")
    .max(120, "El nombre del alimento no puede superar 120 caracteres.")
    .refine((value) => !/\d/.test(value), { message: "El nombre del alimento no debe incluir números." }),
  categoryEnum: z.enum(foodCreateCategoryValues),
  portion: z.string().trim().min(1, "Ingresa la porción base.").max(30),
  portionAmount: z.number().positive().max(MAX_INGREDIENT_QUANTITY),
  calories: z.number().min(0).max(100000),
  proteins: z.number().min(0).max(100000),
  carbs: z.number().min(0).max(100000),
  fats: z.number().min(0).max(100000),
  share: z.boolean(),
});

async function requireSessionUser() {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return { ok: false as const, error: buildActionError("Tu sesion expiro. Inicia sesion nuevamente.") };
  }

  return { ok: true as const, sessionUser };
}

type CatalogUserResolution =
  | { ok: true; userId: number }
  | { ok: false; error: string };

async function resolveCatalogUserId(currentUserId?: number): Promise<CatalogUserResolution> {
  if (typeof currentUserId === "number" && Number.isInteger(currentUserId) && currentUserId > 0) {
    return { ok: true, userId: currentUserId };
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return { ok: false, error: sessionResult.error.error ?? "Tu sesion expiro. Inicia sesion nuevamente." };
  }

  return { ok: true, userId: sessionResult.sessionUser.userId };
}

function parseCategoryLabel(categoryEnum: string | null | undefined) {
  if (!categoryEnum) {
    return null;
  }

  return getFoodCreateCategoryLabel(categoryEnum as FoodCreateCategoryValue);
}

function parsePortionGrams(portion: string | null | undefined) {
  if (!portion) {
    return 100;
  }

  const match = portion.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 100;
}

function isBeverageFood(food: {
  nombre: string;
  categoria: string | null;
  categoria_enum: string | null;
  porcion: string | null;
}) {
  const normalizedCategory = `${food.categoria_enum ?? ""} ${food.categoria ?? ""}`.toLowerCase();
  const normalizedName = food.nombre.toLowerCase();
  const normalizedPortion = (food.porcion ?? "").toLowerCase();

  return normalizedCategory.includes("bebid") || normalizedCategory.includes("infus") || normalizedName.includes("agua") || normalizedName.includes("te") || normalizedName.includes("té") || normalizedPortion.includes("ml");
}

function resolveFoodRole(categoryEnum: string | null) {
  const normalizedCategory = (categoryEnum ?? "").toLowerCase();

  if (normalizedCategory.includes("prote")) {
    return "protein";
  }

  if (normalizedCategory.includes("carbo")) {
    return "carb";
  }

  if (normalizedCategory.includes("grasa")) {
    return "fat";
  }

  if (normalizedCategory.includes("frut")) {
    return "fruit";
  }

  if (normalizedCategory.includes("bebid") || normalizedCategory.includes("infus")) {
    return "infusion";
  }

  if (normalizedCategory.includes("fibr")) {
    return "vegetable";
  }

  return "vegetable";
}

function hasUnknownPrismaArgumentError(error: unknown) {
  return error instanceof Error && /Unknown argument/i.test(error.message);
}

function mapFoodOption(food: FoodOptionSource, currentUserId: number): DailyLogFoodOption {
  const usersWithPriority = food.usuarios ?? [];
  const recipeLinks = food.recetas ?? [];
  const isMine = food.creadaPorId === currentUserId;
  const isFavorite = usersWithPriority.some((entry) => {
    const priority = Number(entry.prioridad ?? 0);
    return priority > 0 && priority <= 3;
  });

  return {
    id: food.id,
    name: food.nombre,
    categoryLabel: food.categoria,
    categoryEnum: food.categoria_enum,
    portion: food.porcion,
    gramsReference: parsePortionGrams(food.porcion),
    calories: Number((food.calorias ?? 0).toFixed(1)),
    proteins: Number((food.proteinas ?? 0).toFixed(1)),
    carbs: Number((food.carbohidratos ?? 0).toFixed(1)),
    fats: Number((food.grasas ?? 0).toFixed(1)),
    isBeverage: isBeverageFood(food),
    isMine,
    isFavorite,
    isRecipe: recipeLinks.length > 0,
    isShared: food.esCompartido === true,
  };
}

export async function createDashboardFoodAction(input: unknown): Promise<ActionResult & { food?: DailyLogFoodOption }> {
  const parsed = createFoodSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(getSpanishValidationMessage(parsed.error));
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const sharedSelect = {
    id: true,
    nombre: true,
    categoria: true,
    categoria_enum: true,
    esCompartido: true,
    creadaPorId: true,
    calorias: true,
    proteinas: true,
    carbohidratos: true,
    grasas: true,
    porcion: true,
    usuarios: {
      where: { usuarioId: sessionResult.sessionUser.userId },
      select: {
        prioridad: true,
      },
    },
    recetas: {
      select: {
        id: true,
      },
      take: 1,
    },
  } as const;

  const ownedSelect = {
    id: true,
    nombre: true,
    categoria: true,
    categoria_enum: true,
    creadaPorId: true,
    calorias: true,
    proteinas: true,
    carbohidratos: true,
    grasas: true,
    porcion: true,
    usuarios: {
      where: { usuarioId: sessionResult.sessionUser.userId },
      select: {
        prioridad: true,
      },
    },
    recetas: {
      select: {
        id: true,
      },
      take: 1,
    },
  } as const;

  const legacySelect = {
    id: true,
    nombre: true,
    categoria: true,
    categoria_enum: true,
    calorias: true,
    proteinas: true,
    carbohidratos: true,
    grasas: true,
    porcion: true,
  } as const;

  let createdFood: FoodOptionSource;

  try {
    createdFood = await prisma.alimento.create({
      data: {
        nombre: parsed.data.name,
        categoria: parseCategoryLabel(parsed.data.categoryEnum),
        categoria_enum: parsed.data.categoryEnum,
        porcion: parsed.data.portion,
        calorias: parsed.data.calories,
        proteinas: parsed.data.proteins,
        carbohidratos: parsed.data.carbs,
        grasas: parsed.data.fats,
        creadaPorId: sessionResult.sessionUser.userId,
        esCompartido: parsed.data.share,
      },
      select: sharedSelect,
    });
  } catch (error) {
    if (!hasUnknownPrismaArgumentError(error)) {
      throw error;
    }

    try {
      createdFood = await prisma.alimento.create({
        data: {
          nombre: parsed.data.name,
          categoria: parseCategoryLabel(parsed.data.categoryEnum),
          categoria_enum: parsed.data.categoryEnum,
          porcion: parsed.data.portion,
          calorias: parsed.data.calories,
          proteinas: parsed.data.proteins,
          carbohidratos: parsed.data.carbs,
          grasas: parsed.data.fats,
          creadaPorId: sessionResult.sessionUser.userId,
        },
        select: ownedSelect,
      });
    } catch (ownedError) {
      if (!hasUnknownPrismaArgumentError(ownedError)) {
        throw ownedError;
      }

      createdFood = await prisma.alimento.create({
        data: {
          nombre: parsed.data.name,
          categoria: parseCategoryLabel(parsed.data.categoryEnum),
          categoria_enum: parsed.data.categoryEnum,
          porcion: parsed.data.portion,
          calorias: parsed.data.calories,
          proteinas: parsed.data.proteins,
          carbohidratos: parsed.data.carbs,
          grasas: parsed.data.fats,
        },
        select: legacySelect,
      });
    }
  }

  revalidatePath("/users");

  return {
    ok: true,
    message: parsed.data.share ? "Alimento creado." : "Alimento creado.",
    food: mapFoodOption(createdFood, sessionResult.sessionUser.userId),
  };
}

export async function loadDailyLogFoodCatalogAction(currentUserId?: number): Promise<LoadDailyLogFoodCatalogResult> {
  const catalogUserResult = await resolveCatalogUserId(currentUserId);
  if (!catalogUserResult.ok) {
    return buildActionError(catalogUserResult.error);
  }
  const catalogUserId = catalogUserResult.userId;

  const sharedQuery = () =>
    prisma.alimento.findMany({
      where: {
        OR: [
          { esCompartido: true },
          { creadaPorId: catalogUserId },
          { creadaPorId: null },
        ],
      },
      orderBy: [{ nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        categoria: true,
        categoria_enum: true,
        esCompartido: true,
        creadaPorId: true,
        calorias: true,
        proteinas: true,
        carbohidratos: true,
        grasas: true,
        porcion: true,
        usuarios: {
          where: { usuarioId: catalogUserId },
          select: {
            prioridad: true,
          },
        },
        recetas: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

  const ownedQuery = () =>
    prisma.alimento.findMany({
      where: {
        OR: [{ creadaPorId: catalogUserId }, { creadaPorId: null }],
      },
      orderBy: [{ nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        categoria: true,
        categoria_enum: true,
        creadaPorId: true,
        calorias: true,
        proteinas: true,
        carbohidratos: true,
        grasas: true,
        porcion: true,
        usuarios: {
          where: { usuarioId: catalogUserId },
          select: {
            prioridad: true,
          },
        },
        recetas: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

  const legacyQuery = () =>
    prisma.alimento.findMany({
      orderBy: [{ nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        categoria: true,
        categoria_enum: true,
        calorias: true,
        proteinas: true,
        carbohidratos: true,
        grasas: true,
        porcion: true,
      },
    });

  let foods: FoodOptionSource[];

  try {
    foods = await sharedQuery();
  } catch (error) {
    if (!hasUnknownPrismaArgumentError(error)) {
      throw error;
    }

    try {
      foods = await ownedQuery();
    } catch (ownedError) {
      if (!hasUnknownPrismaArgumentError(ownedError)) {
        throw ownedError;
      }

      foods = await legacyQuery();
    }
  }

  if (foods.length === 0) {
    await syncSeedFoodsToDatabase();

    try {
      foods = await sharedQuery();
    } catch (error) {
      if (!hasUnknownPrismaArgumentError(error)) {
        throw error;
      }

      try {
        foods = await ownedQuery();
      } catch (ownedError) {
        if (!hasUnknownPrismaArgumentError(ownedError)) {
          throw ownedError;
        }

        foods = await legacyQuery();
      }
    }
  }

  return {
    ok: true,
    foods: foods.map((food) => mapFoodOption(food, catalogUserId)),
  };
}

export async function addDashboardMealFoodAction(input: unknown): Promise<ActionResult> {
  const parsed = dailyLogAddFoodSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  await syncSeedFoodsToDatabase();

  const meal = await loadEditablePlanMeal(parsed.data.mealId, sessionResult.sessionUser.userId);
  if (!meal) {
    return buildActionError("No encontramos la comida a editar.");
  }

  if (toDateKey(meal.fecha) !== parsed.data.dateIso) {
    return buildActionError("No encontramos la comida a editar.");
  }

  const food = await prisma.alimento.findFirst({
    where: { id: parsed.data.foodId },
    select: {
      id: true,
      nombre: true,
      categoria: true,
      categoria_enum: true,
      calorias: true,
      proteinas: true,
      carbohidratos: true,
      grasas: true,
      porcion: true,
    },
  });

  if (!food) {
    return buildActionError("No encontramos el alimento seleccionado.");
  }

  const currentFoods = resolveEditableFoods(meal.overrides, meal.receta.alimentos);
  const nextNutrition = scaleNutrition(
    {
      calories: food.calorias ?? 0,
      proteins: food.proteinas ?? 0,
      carbs: food.carbohidratos ?? 0,
      fats: food.grasas ?? 0,
    },
    100,
    parsed.data.quantity
  );

  const nextFood: PlanFoodOverride = {
    name: food.nombre,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    quantityLabel: formatQuantityLabel(parsed.data.quantity, parsed.data.unit),
    gramsReference: parsed.data.quantity,
    foodId: null,
    isBeverage: parsed.data.unit === "ml" || isBeverageFood(food),
    role: resolveFoodRole(food.categoria_enum),
    nutrition: nextNutrition,
  };

  const nextFoods = [...currentFoods, nextFood];

  await prisma.planComida.update({
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

  revalidatePath("/users");

  return {
    ok: true,
    message: "Alimento añadido.",
  };
}
