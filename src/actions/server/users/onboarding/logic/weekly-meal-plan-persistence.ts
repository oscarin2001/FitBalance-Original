import { AlimentoCategoria, Objetivo, VelocidadCambio } from "@prisma/client";

import { prisma } from "@/actions/server/users/prisma";

import type {
  GeneratedWeeklyMealPlan,
  MealNutritionReference,
  WeeklyMealType,
  SeedFoodRecord,
  PersistedMealFood,
  PersistedWeeklyMealPlan,
} from "../types";

import { buildFallbackMealInstructions } from "@/components/users/dashboard/lib/meal-formatters";

import { loadSeedFoodCatalog } from "./food-seed-catalog";
import { syncSeedFoodsToDatabase } from "./food-seed-sync";

type PersistWeeklyMealPlanInput = {
  userId: number;
  objective: Objetivo;
  speed: VelocidadCambio;
  plan: GeneratedWeeklyMealPlan;
};

function getBasePortionGrams(
  role: PersistedMealFood["role"],
  mealType: WeeklyMealType
) {
  switch (role) {
    case "protein":
      return mealType === "Desayuno" || mealType === "Snack" ? 150 : 180;
    case "carb":
      if (mealType === "Desayuno") return 70;
      if (mealType === "Snack") return 50;
      return 80;
    case "fat":
      return mealType === "Snack" ? 10 : 15;
    case "vegetable":
      return mealType === "Desayuno" || mealType === "Snack" ? 80 : 120;
    case "fruit":
      return mealType === "Almuerzo" || mealType === "Cena" ? 80 : 90;
    case "infusion":
      return 250;
    default:
      return 100;
  }
}

function getPlannedPortion(
  role: PersistedMealFood["role"],
  mealType: WeeklyMealType
) {
  if (role === "infusion") {
    return { gramsReference: 250, portionLabel: "250 ml" };
  }

  const basePortion = getBasePortionGrams(role, mealType);
  const grams = basePortion;

  return {
    gramsReference: grams,
    portionLabel: `${grams} g`,
  };
}

function roundNutrition(value: number) {
  return Number(value.toFixed(1));
}

function normalizeFoodName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenizeFoodName(value: string): string[] {
  return normalizeFoodName(value).split(" ").filter(Boolean);
}

function scoreFoodMatch(targetName: string, candidateName: string): number {
  const normalizedTarget = normalizeFoodName(targetName);
  const normalizedCandidate = normalizeFoodName(candidateName);

  if (normalizedTarget === normalizedCandidate) {
    return 100;
  }

  if (normalizedTarget.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedTarget)) {
    return 80;
  }

  const targetTokens = new Set(tokenizeFoodName(targetName));
  const candidateTokens = tokenizeFoodName(candidateName);
  const overlap = candidateTokens.filter((token) => targetTokens.has(token)).length;

  return overlap * 10;
}

function toEnumValue(value: string | null) {
  if (!value) {
    return null;
  }

  return AlimentoCategoria[value as keyof typeof AlimentoCategoria] ?? null;
}

type FoodRecord = {
  id: number;
  nombre: string;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  porcion: string | null;
};

function buildSeedFoodCreateData(food: SeedFoodRecord) {
  return {
    nombre: food.name,
    categoria: food.categoryLabel,
    categoria_enum: toEnumValue(food.enumCategory),
    calorias: food.calories,
    proteinas: food.proteins,
    carbohidratos: food.carbs,
    grasas: food.fats,
    porcion: food.portion,
    region: "Bolivia",
  };
}

function buildFoodIndexes(foods: FoodRecord[]) {
  const byExactName = new Map<string, FoodRecord>();
  const byNormalizedName = new Map<string, FoodRecord>();

  for (const food of foods) {
    byExactName.set(food.nombre, food);
    byNormalizedName.set(normalizeFoodName(food.nombre), food);
  }

  return { byExactName, byNormalizedName };
}

function buildSeedFoodIndexes(seedFoods: SeedFoodRecord[]) {
  const byExactName = new Map<string, SeedFoodRecord>();
  const byNormalizedName = new Map<string, SeedFoodRecord>();

  for (const food of seedFoods) {
    byExactName.set(food.name, food);
    byNormalizedName.set(normalizeFoodName(food.name), food);
  }

  return { byExactName, byNormalizedName };
}

function resolveBestSeedFood(foodName: string, seedFoods: SeedFoodRecord[]): SeedFoodRecord | null {
  const normalizedTarget = normalizeFoodName(foodName);

  const exactMatch = seedFoods.find((food) => food.name === foodName);
  if (exactMatch) {
    return exactMatch;
  }

  const normalizedMatch = seedFoods.find((food) => normalizeFoodName(food.name) === normalizedTarget);
  if (normalizedMatch) {
    return normalizedMatch;
  }

  let bestMatch: { food: SeedFoodRecord; score: number } | null = null;

  for (const food of seedFoods) {
    const score = scoreFoodMatch(foodName, food.name);

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { food, score };
    }
  }

  return bestMatch?.food ?? null;
}

function sumMealNutrition(foods: PersistedMealFood[]): MealNutritionReference {
  return foods.reduce<MealNutritionReference>(
    (acc, food) => ({
      calories: roundNutrition(acc.calories + food.nutrition.calories),
      proteins: roundNutrition(acc.proteins + food.nutrition.proteins),
      carbs: roundNutrition(acc.carbs + food.nutrition.carbs),
      fats: roundNutrition(acc.fats + food.nutrition.fats),
    }),
    { calories: 0, proteins: 0, carbs: 0, fats: 0 }
  );
}

export async function persistWeeklyMealPlan(
  input: PersistWeeklyMealPlanInput
): Promise<PersistedWeeklyMealPlan> {
  await syncSeedFoodsToDatabase();

  const seedFoods = loadSeedFoodCatalog();
  const seedFoodIndexes = buildSeedFoodIndexes(seedFoods);

  const uniqueFoodNames = [...new Set(input.plan.days.flatMap((day) => day.meals.flatMap((meal) => meal.foods.map((food) => food.name))))];
  const dbFoods = await prisma.alimento.findMany({
    where: { nombre: { in: uniqueFoodNames } },
    select: {
      id: true,
      nombre: true,
      calorias: true,
      proteinas: true,
      carbohidratos: true,
      grasas: true,
      porcion: true,
    },
  });
  const foodIndexes = buildFoodIndexes(dbFoods);

  return prisma.$transaction(async (tx) => {
    await tx.planComida.deleteMany({
      where: { usuarioId: input.userId },
    });

    const persistedDays = [];

    for (const day of input.plan.days) {
      const persistedMeals = [];

      for (const meal of day.meals) {
        const persistedFoods = await Promise.all(
          meal.foods.map(async (food) => {
            const exactFood = foodIndexes.byExactName.get(food.name);
            const normalizedFood = foodIndexes.byNormalizedName.get(normalizeFoodName(food.name));
            const seedFood =
              seedFoodIndexes.byExactName.get(food.name) ??
              seedFoodIndexes.byNormalizedName.get(normalizeFoodName(food.name)) ??
              resolveBestSeedFood(food.name, seedFoods);

            if (!seedFood) {
              throw new Error(`No se pudo resolver el alimento ${food.name} en el catalogo seed.`);
            }

            const resolvedFood = exactFood ?? normalizedFood;

            if (resolvedFood) {
              return {
                ...food,
                foodId: resolvedFood.id,
                ...getPlannedPortion(food.role, meal.mealType),
                nutrition: {
                  calories: roundNutrition(resolvedFood.calorias ?? 0),
                  proteins: roundNutrition(resolvedFood.proteinas ?? 0),
                  carbs: roundNutrition(resolvedFood.carbohidratos ?? 0),
                  fats: roundNutrition(resolvedFood.grasas ?? 0),
                },
              };
            }

            const createdFood = await tx.alimento.create({
              data: buildSeedFoodCreateData(seedFood),
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

            foodIndexes.byExactName.set(createdFood.nombre, createdFood);
            foodIndexes.byNormalizedName.set(normalizeFoodName(createdFood.nombre), createdFood);

            return {
              ...food,
              foodId: createdFood.id,
              ...getPlannedPortion(food.role, meal.mealType),
              nutrition: {
                calories: roundNutrition(createdFood.calorias ?? 0),
                proteins: roundNutrition(createdFood.proteinas ?? 0),
                carbs: roundNutrition(createdFood.carbohidratos ?? 0),
                fats: roundNutrition(createdFood.grasas ?? 0),
              },
            };
          }
        )
        );
        const nutrition = sumMealNutrition(persistedFoods);
        const recipe = await tx.receta.create({
          data: {
            nombre: meal.recipeName,
            instrucciones: (meal.instructions?.length
              ? meal.instructions
              : buildFallbackMealInstructions({
                  mealType: meal.mealType,
                  recipeName: meal.recipeName,
                  ingredients: meal.foods,
                })
            ).join("\n"),
            tipo: meal.mealType,
            porciones: 1,
            alimentos: {
              create: persistedFoods
                .filter((food) => food.foodId !== null)
                .map((food) => ({
                  alimentoId: food.foodId as number,
                  gramos: food.gramsReference,
                })),
            },
          },
          select: { id: true },
        });
        const planMeal = await tx.planComida.create({
          data: {
            usuarioId: input.userId,
            fecha: new Date(day.dateIso),
            comida_tipo: meal.mealType,
            recetaId: recipe.id,
            porciones: 1,
            overrides: {
              dayLabel: day.dayLabel,
              mealNutrition: nutrition,
              source: input.plan.source,
              instructions: meal.instructions?.length
                ? meal.instructions
                : buildFallbackMealInstructions({
                    mealType: meal.mealType,
                    recipeName: meal.recipeName,
                    ingredients: meal.foods,
                  }),
              foods: persistedFoods,
            },
          },
          select: { id: true },
        });

        persistedMeals.push({
          ...meal,
          foods: persistedFoods,
          nutrition,
          recipeId: recipe.id,
          planMealId: planMeal.id,
        });
      }

      persistedDays.push({
        ...day,
        meals: persistedMeals,
      });
    }

    return {
      ...input.plan,
      days: persistedDays,
    };
  });
}
