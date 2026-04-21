import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";

import {
  buildFallbackMealInstructions,
  normalizeInstructionSteps,
} from "@/components/users/dashboard/lib/meal-formatters";
import { formatWeekdayLabel, parseDateKey, toDateKey } from "@/lib/date-labels";

import type {
  AiTargets,
  FoodPreferenceMap,
  GeneratedWeeklyMealPlan,
  MealFoodRole,
  VisibleMealPlanMeal,
} from "../types";

import { onboardingDays } from "../constants";

type DietPlanInput = {
  userName: string;
  objetivo: Objetivo;
  nivelActividad: NivelActividad;
  velocidadCambio: VelocidadCambio;
  targets: AiTargets;
  preferencias: FoodPreferenceMap;
  diasDieta: unknown;
};

const MODEL_ID = "gemini-2.0-flash";
const MEAL_ORDER: Array<VisibleMealPlanMeal["mealType"]> = [
  "Desayuno",
  "Snack",
  "Almuerzo",
  "Cena",
];
const WEEKDAY_ORDER = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"] as const;

function buildPlanDates(): Array<{ dayLabel: string; dateIso: string }> {
  const startDate = parseDateKey(toDateKey(new Date()));

  return onboardingDays.map((_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);

    return {
      dayLabel: formatWeekdayLabel(date),
      dateIso: date.toISOString(),
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJsonFromModel(text: string): Record<string, unknown> {
  const blockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = blockMatch?.[1] ?? text;
  return JSON.parse(payload.trim()) as Record<string, unknown>;
}

function resolveFoodRole(foodName: string, preferences: FoodPreferenceMap): MealFoodRole | null {
  if (preferences.proteins?.includes(foodName)) return "protein";
  if (preferences.carbs?.includes(foodName)) return "carb";
  if (preferences.fats?.includes(foodName)) return "fat";
  if (preferences.vegetables?.includes(foodName)) return "vegetable";
  if (preferences.fruits?.includes(foodName)) return "fruit";
  if (preferences.infusions?.includes(foodName)) return "infusion";
  return null;
}

function normalizeFoods(input: unknown, preferences: FoodPreferenceMap) {
  const roleMap = new Map<MealFoodRole, string>();
  const rawFoods = Array.isArray(input) ? input : [];

  for (const value of rawFoods) {
    if (typeof value !== "string") {
      continue;
    }

    const foodName = value.trim();
    const role = resolveFoodRole(foodName, preferences);

    if (role && !roleMap.has(role)) {
      roleMap.set(role, foodName);
    }
  }

  if (!roleMap.has("protein") || !roleMap.has("carb")) {
    return null;
  }

  return [...roleMap.entries()].map(([role, name]) => ({ role, name }));
}

function resolveMealType(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeMeal(
  meal: unknown,
  mealType: VisibleMealPlanMeal["mealType"],
  preferences: FoodPreferenceMap
): VisibleMealPlanMeal {
  if (!isRecord(meal)) {
    throw new Error(`La comida ${mealType} de la IA no es valida.`);
  }

  const recipeName =
    typeof meal.recipeName === "string"
      ? meal.recipeName.trim()
      : typeof meal.nombre === "string"
        ? meal.nombre.trim()
        : "";
  const foods = normalizeFoods(
    meal.foods ?? meal.alimentos ?? meal.ingredientes ?? meal.items,
    preferences
  );
  if (!recipeName || !foods) {
    throw new Error(`La comida ${mealType} de la IA debe incluir una receta y alimentos validos.`);
  }

  const instructions = normalizeInstructionSteps(
    meal.instructions ?? meal.preparation ?? meal.steps ?? meal.pasos,
    buildFallbackMealInstructions({
      mealType,
      recipeName,
      ingredients: foods,
    })
  );

  return {
    mealType,
    recipeName,
    foods,
    instructions,
  };
}

function normalizePlan(
  plan: Record<string, unknown>,
  preferences: FoodPreferenceMap,
  hydrationLiters: number
): GeneratedWeeklyMealPlan {
  const sourceDays = Array.isArray(plan.days) ? plan.days : Array.isArray(plan.dias) ? plan.dias : null;

  if (!sourceDays || sourceDays.length < WEEKDAY_ORDER.length) {
    throw new Error("La IA todavia no genero los 7 dias del plan.");
  }

  const planDates = buildPlanDates();
  const days = WEEKDAY_ORDER.map((dayLabel, dayIndex) => {
    const sourceDay = sourceDays[dayIndex];

    if (!isRecord(sourceDay)) {
      throw new Error(`La IA no genero un bloque valido para ${dayLabel}.`);
    }

    const sourceMeals = Array.isArray(sourceDay.meals)
      ? sourceDay.meals
      : Array.isArray(sourceDay.comidas)
        ? sourceDay.comidas
        : null;

    if (!sourceMeals || sourceMeals.length < MEAL_ORDER.length) {
      throw new Error(`La IA no genero las 4 comidas de ${dayLabel}.`);
    }

    const sourceMealsByType = new Map<string, unknown>();

    for (const sourceMeal of sourceMeals) {
      if (!isRecord(sourceMeal)) {
        continue;
      }

      const mealType = resolveMealType(sourceMeal.mealType ?? sourceMeal.tipo);

      if (mealType) {
        sourceMealsByType.set(mealType, sourceMeal);
      }
    }

    const meals = MEAL_ORDER.map((mealType, mealIndex) => {
      const sourceMeal = sourceMealsByType.get(mealType) ?? sourceMeals[mealIndex];
      return normalizeMeal(sourceMeal, mealType, preferences);
    });

    return {
      dayLabel: planDates[dayIndex].dayLabel,
      dateIso: planDates[dayIndex].dateIso,
      meals,
    };
  });

  return {
    model: MODEL_ID,
    source: "gemini",
    hydrationLiters,
    days,
  };
}

function buildPrompt(input: DietPlanInput) {
  const macroTolerance = 0.1;
  const proteinMin = Math.round(input.targets.proteinasG * (1 - macroTolerance));
  const proteinMax = Math.round(input.targets.proteinasG * (1 + macroTolerance));
  const fatMin = Math.round(input.targets.grasasG * (1 - macroTolerance));
  const fatMax = Math.round(input.targets.grasasG * (1 + macroTolerance));
  const carbMin = Math.round(input.targets.carbohidratosG * (1 - macroTolerance));
  const carbMax = Math.round(input.targets.carbohidratosG * (1 + macroTolerance));
  const dietDays =
    Array.isArray(input.diasDieta) && input.diasDieta.length > 0
      ? input.diasDieta.filter((value): value is string => typeof value === "string").join(", ")
      : onboardingDays.join(", ");

  return `Genera SOLO JSON para un plan semanal de alimentacion.
Usuario: ${input.userName}
Objetivo: ${input.objetivo}
Velocidad: ${input.velocidadCambio}
Nivel de actividad: ${input.nivelActividad}
No recalcules objetivos nutricionales: ya vienen calculados desde el algoritmo TS.
Objetivos diarios calculados por TS (usarlos como rango de ajuste):
- kcal: ${input.targets.kcalObjetivo}
- proteinas: ${input.targets.proteinasG} g (rango ${proteinMin}-${proteinMax})
- grasas: ${input.targets.grasasG} g (rango ${fatMin}-${fatMax})
- carbohidratos: ${input.targets.carbohidratosG} g (rango ${carbMin}-${carbMax})
- agua: ${input.targets.aguaLitros} L
Dias activos: ${dietDays}
Reglas estrictas:
- 7 dias
- 4 comidas por dia: Desayuno, Snack, Almuerzo, Cena
- Cada comida debe usar al menos 1 proteina y 1 carbohidrato
- Grasas, verduras, frutos e infusiones son opcionales
- Usa UNICAMENTE alimentos permitidos
- No repitas el nombre del platillo en toda la semana
- Mantener coherencia realista
- No incluir calorias ni macros
- Incluye tambien "instructions" con 3 a 5 pasos cortos para preparar cada comida
- Las instrucciones deben ser practicas, concretas y sin explicar macros
Alimentos permitidos: ${JSON.stringify(input.preferencias)}
Formato estricto:
{"days":[{"meals":[{"mealType":"Desayuno","recipeName":"...","foods":["...","..."],"instructions":["...","..."]},{"mealType":"Snack","recipeName":"...","foods":["...","..."],"instructions":["...","..."]},{"mealType":"Almuerzo","recipeName":"...","foods":["...","..."],"instructions":["...","..."]},{"mealType":"Cena","recipeName":"...","foods":["...","..."],"instructions":["...","..."]}]}]}`;
}

export async function generateDietPlan(input: DietPlanInput): Promise<GeneratedWeeklyMealPlan> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("Estamos generando el plan por ti mientras carga. Intenta nuevamente en unos segundos.");
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: MODEL_ID });
    const result = await model.generateContent(buildPrompt(input));
    const plan = parseJsonFromModel(result.response.text());
    return normalizePlan(plan, input.preferencias, input.targets.aguaLitros);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Estamos generando el plan por ti mientras carga. Intenta nuevamente en unos segundos.");
  }
}
