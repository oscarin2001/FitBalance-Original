import { Objetivo, VelocidadCambio } from "@prisma/client";

import { onboardingDays } from "../constants";
import { buildFallbackMealInstructions } from "@/components/users/dashboard/lib/meal-formatters";
import type {
  FoodPreferenceMap,
  GeneratedWeeklyMealPlan,
  SeedFoodRecord,
  VisibleMealPlanDay,
  VisibleMealPlanFood,
  WeeklyMealType,
} from "../types";

import { loadSeedFoodCatalog } from "./food-seed-catalog";

type BuildHeuristicWeeklyMealPlanInput = {
  objective: Objetivo;
  speed: VelocidadCambio;
  hydrationLiters: number;
  preferences: FoodPreferenceMap;
  model?: string;
};

const breakfastProteinHints = ["huevo", "yogur", "ques", "kefir", "leche", "tofu", "tempeh"];
const breakfastCarbHints = ["avena", "pan", "granola", "amaranto", "quinua", "arepa", "tortilla", "cereal"];
const snackCarbHints = ["granola", "galleta", "pan", "avena", "amaranto", "quinua", "cereal"];
const lightProteinHints = ["atun", "pollo", "pavo", "trucha", "pescado", "yogur", "ques", "tofu"];

function normalizeFoodName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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

  const targetTokens = new Set(normalizedTarget.split(" ").filter(Boolean));
  const candidateTokens = normalizedCandidate.split(" ").filter(Boolean);
  const overlap = candidateTokens.filter((token) => targetTokens.has(token)).length;

  return overlap * 10;
}

const seedFoodCatalog = loadSeedFoodCatalog();
const seedFoodsByNormalizedName = new Map(seedFoodCatalog.map((food) => [normalizeFoodName(food.name), food] as const));
const seedFoodsByPreferenceCategory = seedFoodCatalog.reduce<
  Record<SeedFoodRecord["preferenceCategory"], SeedFoodRecord[]>
>((acc, food) => {
  acc[food.preferenceCategory].push(food);
  return acc;
}, {
  carbs: [],
  proteins: [],
  fats: [],
  vegetables: [],
  fruits: [],
  infusions: [],
});

function resolveCanonicalFoodName(
  foodName: string,
  category: SeedFoodRecord["preferenceCategory"]
): string {
  const normalizedName = normalizeFoodName(foodName);
  const exactMatch = seedFoodsByNormalizedName.get(normalizedName);

  if (exactMatch) {
    return exactMatch.name;
  }

  const categoryFoods = seedFoodsByPreferenceCategory[category] ?? [];
  let bestMatch: { food: SeedFoodRecord; score: number } | null = null;

  for (const food of categoryFoods) {
    const score = scoreFoodMatch(foodName, food.name);

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { food, score };
    }
  }

  return bestMatch?.food.name ?? foodName;
}

function canonicalizePool(
  pool: string[],
  category: SeedFoodRecord["preferenceCategory"]
): string[] {
  return [...new Set(pool.map((food) => resolveCanonicalFoodName(food, category)))];
}

const objectiveDescriptors: Record<Objetivo, string[]> = {
  Bajar_grasa: ["ligero", "fresco", "magro", "verde", "limpio", "suave", "delicado"],
  Ganar_musculo: ["energetico", "potente", "fuerte", "completo", "activo", "andino", "robusto"],
  Mantenimiento: ["balanceado", "casero", "integral", "estable", "armado", "sereno", "natural"],
};

const recipeNameBuilders: Record<WeeklyMealType, Array<(parts: Record<string, string>) => string>> = {
  Desayuno: [
    ({ descriptor, carb, protein, extra }) => `Desayuno ${descriptor} de ${carb} con ${protein}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Bowl ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, carb, protein, extra }) => `Plato matinal ${descriptor} de ${carb} y ${protein}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Combinado ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, carb, protein, extra }) => `Desayuno balanceado ${descriptor} de ${carb} con ${protein}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Inicio ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, carb, protein, extra }) => `Plato de manana ${descriptor} de ${carb} con ${protein}${extra}`,
  ],
  Snack: [
    ({ descriptor, protein, carb, extra }) => `Snack ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, carb, protein, extra }) => `Merienda ${descriptor} de ${carb} y ${protein}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Colacion ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, carb, protein, extra }) => `Snack practico ${descriptor} de ${carb} con ${protein}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Snack balanceado ${descriptor} de ${protein} y ${carb}${extra}`,
    ({ descriptor, carb, protein, extra }) => `Pausa ${descriptor} de ${carb} con ${protein}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Merienda ligera ${descriptor} de ${protein} con ${carb}${extra}`,
  ],
  Almuerzo: [
    ({ descriptor, protein, carb, extra }) => `Almuerzo ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Bowl ${descriptor} de ${protein} y ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Plato fuerte ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Combinado casero ${descriptor} de ${protein} y ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Plato andino ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Salteado ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Almuerzo completo ${descriptor} de ${protein} y ${carb}${extra}`,
  ],
  Cena: [
    ({ descriptor, protein, carb, extra }) => `Cena ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Plato nocturno ${descriptor} de ${protein} y ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Cena casera ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Combinado suave ${descriptor} de ${protein} y ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Cena balanceada ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Plato ligero ${descriptor} de ${protein} con ${carb}${extra}`,
    ({ descriptor, protein, carb, extra }) => `Cena armada ${descriptor} de ${protein} y ${carb}${extra}`,
  ],
};

function matchesHints(foodName: string, hints: string[]) {
  const normalizedFoodName = foodName.toLowerCase();
  return hints.some((hint) => normalizedFoodName.includes(hint));
}

function preferFoods(pool: string[], hints: string[], invert = false) {
  const filtered = pool.filter((food) => (invert ? !matchesHints(food, hints) : matchesHints(food, hints)));
  return filtered.length > 0 ? filtered : pool;
}

function pickUniqueFood(pool: string[], index: number, usedNames: Set<string>, fallback: string) {
  if (pool.length === 0) {
    return fallback;
  }

  for (let offset = 0; offset < pool.length; offset += 1) {
    const candidate = pool[(index + offset) % pool.length];

    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }

  const candidate = pool[index % pool.length] ?? fallback;
  usedNames.add(candidate);
  return candidate;
}

function shouldIncludeFat(objective: Objetivo, speed: VelocidadCambio, mealType: WeeklyMealType, dayIndex: number) {
  if (objective === Objetivo.Bajar_grasa) {
    const cadence = speed === VelocidadCambio.Rapido ? 3 : 2;
    return mealType === "Snack" ? dayIndex % 4 === 0 : dayIndex % cadence === 0;
  }

  if (objective === Objetivo.Ganar_musculo) {
    return mealType === "Snack" ? true : dayIndex % 2 === 0;
  }

  return mealType === "Snack" ? dayIndex % 2 === 0 : dayIndex % 3 !== 1;
}

function buildExtraLabel(extraFoods: string[]) {
  return extraFoods.length > 0 ? ` y ${extraFoods[0]}` : "";
}

function buildPlanDates(): Array<{ dayLabel: string; dateIso: string }> {
  const startDate = new Date();
  const currentDay = startDate.getDay();
  const daysUntilMonday = currentDay === 1 ? 0 : (8 - currentDay) % 7;

  startDate.setDate(startDate.getDate() + daysUntilMonday);
  startDate.setHours(12, 0, 0, 0);

  return onboardingDays.map((dayLabel, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      dayLabel,
      dateIso: date.toISOString(),
    };
  });
}

function buildMealFoods(
  mealType: WeeklyMealType,
  dayIndex: number,
  objective: Objetivo,
  speed: VelocidadCambio,
  preferences: FoodPreferenceMap
): VisibleMealPlanFood[] {
  const usedNames = new Set<string>();
  const proteinPool =
    mealType === "Desayuno" || mealType === "Snack"
      ? canonicalizePool(preferFoods(preferences.proteins ?? [], breakfastProteinHints), "proteins")
      : canonicalizePool(preferFoods(preferences.proteins ?? [], breakfastProteinHints, true), "proteins");
  const carbPool =
    mealType === "Desayuno"
      ? canonicalizePool(preferFoods(preferences.carbs ?? [], breakfastCarbHints), "carbs")
      : mealType === "Snack"
        ? canonicalizePool(preferFoods(preferences.carbs ?? [], snackCarbHints), "carbs")
        : canonicalizePool(preferences.carbs ?? [], "carbs");
  const fatPool = canonicalizePool(preferences.fats ?? [], "fats");
  const vegetablePool = canonicalizePool(preferences.vegetables ?? [], "vegetables");
  const fruitPool = canonicalizePool(preferences.fruits ?? [], "fruits");
  const infusionPool = canonicalizePool(preferences.infusions ?? [], "infusions");

  const proteinFallback = resolveCanonicalFoodName(preferences.proteins?.[0] ?? "Proteina", "proteins");
  const carbFallback = resolveCanonicalFoodName(preferences.carbs?.[0] ?? "Carbohidrato", "carbs");
  const fatFallback = resolveCanonicalFoodName(preferences.fats?.[0] ?? "Grasa", "fats");
  const vegetableFallback = resolveCanonicalFoodName(preferences.vegetables?.[0] ?? "Verdura", "vegetables");
  const fruitFallback = resolveCanonicalFoodName(preferences.fruits?.[0] ?? "Fruta", "fruits");
  const infusionFallback = resolveCanonicalFoodName(preferences.infusions?.[0] ?? "Infusion", "infusions");

  const proteinIndex = mealType === "Cena" ? dayIndex + 1 : dayIndex;
  const protein = pickUniqueFood(proteinPool, proteinIndex, usedNames, proteinFallback);
  const carb = pickUniqueFood(carbPool, dayIndex + 2, usedNames, carbFallback);
  const foods: VisibleMealPlanFood[] = [
    { name: protein, role: "protein" },
    { name: carb, role: "carb" },
  ];

  if (mealType === "Almuerzo" || mealType === "Cena") {
    const vegetablePoolForMeal =
      objective === Objetivo.Bajar_grasa ? vegetablePool : preferFoods(vegetablePool, lightProteinHints, true);
    foods.push({
      name: pickUniqueFood(vegetablePoolForMeal, dayIndex, usedNames, vegetableFallback),
      role: "vegetable",
    });
  }

  if (mealType === "Desayuno" || mealType === "Snack" || objective === Objetivo.Ganar_musculo) {
    foods.push({
      name: pickUniqueFood(fruitPool, dayIndex + 3, usedNames, fruitFallback),
      role: "fruit",
    });
  }

  if (shouldIncludeFat(objective, speed, mealType, dayIndex)) {
    foods.push({
      name: pickUniqueFood(fatPool, dayIndex + 1, usedNames, fatFallback),
      role: "fat",
    });
  }

  if ((mealType === "Desayuno" || mealType === "Snack") && dayIndex % 2 === 0) {
    foods.push({
      name: pickUniqueFood(infusionPool, dayIndex, usedNames, infusionFallback),
      role: "infusion",
    });
  }

  return foods;
}

function buildRecipeName(
  mealType: WeeklyMealType,
  dayIndex: number,
  objective: Objetivo,
  foods: VisibleMealPlanFood[]
) {
  const descriptor = objectiveDescriptors[objective][dayIndex % objectiveDescriptors[objective].length];
  const protein = foods.find((food) => food.role === "protein")?.name ?? "proteina";
  const carb = foods.find((food) => food.role === "carb")?.name ?? "carbohidrato";
  const extra = buildExtraLabel(
    foods.filter((food) => food.role !== "protein" && food.role !== "carb").map((food) => food.name)
  );
  const builder = recipeNameBuilders[mealType][dayIndex % recipeNameBuilders[mealType].length];

  return builder({ descriptor, protein, carb, extra });
}

export function buildHeuristicWeeklyMealPlan(
  input: BuildHeuristicWeeklyMealPlanInput
): GeneratedWeeklyMealPlan {
  const planDates = buildPlanDates();
  const days: VisibleMealPlanDay[] = planDates.map(({ dayLabel, dateIso }, dayIndex) => {
    const meals = (["Desayuno", "Snack", "Almuerzo", "Cena"] as const).map((mealType) => {
      const foods = buildMealFoods(
        mealType,
        dayIndex,
        input.objective,
        input.speed,
        input.preferences
      );

      return {
        mealType,
        recipeName: buildRecipeName(mealType, dayIndex, input.objective, foods),
        foods,
        instructions: buildFallbackMealInstructions({
          mealType,
          recipeName: buildRecipeName(mealType, dayIndex, input.objective, foods),
          ingredients: foods,
        }),
      };
    });

    return {
      dayLabel,
      dateIso,
      meals,
    };
  });

  return {
    model: input.model ?? "heuristic-balanced-planner",
    source: "heuristic",
    hydrationLiters: input.hydrationLiters,
    days,
  };
}
