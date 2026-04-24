type Objetivo =
  | "Bajar_grasa"
  | "Ganar_musculo"
  | "Mantener";

type VelocidadCambio =
  | "Lento"
  | "Moderado"
  | "Rapido";

import { onboardingDays } from "../constants";
import { buildFallbackMealInstructions } from "@/components/users/dashboard/lib/meal-formatters";
import { formatWeekdayLabel, parseDateKey, toDateKey } from "@/lib/date-labels";
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

const proteinFallbackNames = [
  "Pechuga de pollo cocida",
  "Huevo cocido",
  "Pescado blanco cocido",
  "Carne de res magra cocida",
  "Tofu firme",
  "Yogur griego natural",
  "Queso fresco",
];

const carbFallbackNames = [
  "Arroz basmati cocido",
  "Avena cocida",
  "Amaranto cocido",
  "Papa cocida",
  "Quinua cocida",
  "Pan integral",
];

function expandPool(
  pool: string[],
  category: SeedFoodRecord["preferenceCategory"],
  fallbackNames: string[]
) {
  if (pool.length >= 4) {
    return pool;
  }

  return canonicalizePool([...pool, ...fallbackNames], category);
}

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
  void objective;
  void speed;
  void mealType;
  void dayIndex;

  return true;
}

function buildRecipeName(mealType: WeeklyMealType, foods: VisibleMealPlanFood[]) {
  const mealLabel =
    mealType === "Desayuno"
      ? "Desayuno"
      : mealType === "Snack"
        ? "Snack"
        : mealType === "Almuerzo"
          ? "Almuerzo"
          : "Cena";
  const protein = foods.find((food) => food.role === "protein")?.name ?? "proteina";
  const carb = foods.find((food) => food.role === "carb")?.name ?? "carbohidrato";
  const extras = foods
    .filter((food) => food.role !== "protein" && food.role !== "carb")
    .map((food) => food.name)
    .slice(0, 2)
    .join(" + ");

  return extras ? `${mealLabel} con ${protein}, ${carb} y ${extras}` : `${mealLabel} con ${protein} y ${carb}`;
}

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
      ? expandPool(
          canonicalizePool(preferFoods(preferences.proteins ?? [], breakfastProteinHints), "proteins"),
          "proteins",
          proteinFallbackNames
        )
      : expandPool(
          canonicalizePool(preferFoods(preferences.proteins ?? [], breakfastProteinHints, true), "proteins"),
          "proteins",
          proteinFallbackNames
        );
  const carbPool =
    mealType === "Desayuno"
      ? expandPool(
          canonicalizePool(preferFoods(preferences.carbs ?? [], breakfastCarbHints), "carbs"),
          "carbs",
          carbFallbackNames
        )
      : mealType === "Snack"
        ? expandPool(
            canonicalizePool(preferFoods(preferences.carbs ?? [], snackCarbHints), "carbs"),
            "carbs",
            carbFallbackNames
          )
        : expandPool(canonicalizePool(preferences.carbs ?? [], "carbs"), "carbs", carbFallbackNames);
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

  const mealOffset = mealType === "Desayuno" ? 0 : mealType === "Snack" ? 1 : mealType === "Almuerzo" ? 2 : 3;
  const protein = pickUniqueFood(proteinPool, dayIndex + mealOffset, usedNames, proteinFallback);
  const carb = pickUniqueFood(carbPool, dayIndex + mealOffset + 1, usedNames, carbFallback);
  const foods: VisibleMealPlanFood[] = [
    { name: protein, role: "protein" },
    { name: carb, role: "carb" },
  ];

  if (mealType === "Almuerzo" || mealType === "Cena") {
    const vegetablePoolForMeal =
      objective === "Bajar_grasa" ? vegetablePool : preferFoods(vegetablePool, lightProteinHints, true);
    foods.push({
      name: pickUniqueFood(vegetablePoolForMeal, dayIndex, usedNames, vegetableFallback),
      role: "vegetable",
    });
  }

  if (mealType === "Desayuno" || mealType === "Snack" || objective === "Ganar_musculo") {
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
        recipeName: buildRecipeName(mealType, foods),
        foods,
        instructions: buildFallbackMealInstructions({
          mealType,
          recipeName: buildRecipeName(mealType, foods),
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
