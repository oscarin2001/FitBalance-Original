import { prisma } from "@/actions/server/users/prisma";

export type PlanFoodOverride = {
  name?: string;
  quantity?: number | null;
  unit?: string | null;
  quantityLabel?: string | null;
  gramsReference?: number | null;
  foodId?: number | null;
  isBeverage?: boolean | null;
  role?: string | null;
  carbMode?: "total" | "net" | null;
  sugarAlcohols?: number | null;
  fiber?: number | null;
  allulose?: number | null;
  glycemicLoad?: number | null;
  notes?: string | null;
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

export function formatQuantityLabel(quantity: number, unit: "g" | "ml") {
  const rounded = Number(quantity.toFixed(1));
  const displayQuantity = Number.isInteger(rounded) ? String(Math.round(rounded)) : rounded.toFixed(1);

  return `${displayQuantity} ${unit}`;
}

export function scaleNutrition(
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

export function calculateTotals(foods: PlanFoodOverride[]) {
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

export function resolveEditableFoods(
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

export async function loadEditablePlanMeal(mealId: number, userId: number) {
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
