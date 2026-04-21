import type { ComidaTipo } from "@prisma/client";

import type {
  DashboardMacroTotals,
  UserDashboardMealIngredient,
} from "@/actions/server/users/types";

type MealInstructionIngredient = {
  name: string;
  role?: string | null;
  isBeverage?: boolean;
};

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeInstructionLine(value: string) {
  return cleanText(value).replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "");
}

export function splitInstructionText(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n+/)
    .map(normalizeInstructionLine)
    .filter(Boolean);
}

export function normalizeInstructionSteps(
  value: unknown,
  fallbackSteps: string[]
): string[] {
  if (Array.isArray(value)) {
    const steps = value
      .map((step) => (typeof step === "string" ? normalizeInstructionLine(step) : ""))
      .filter(Boolean);

    return steps.length > 0 ? steps : fallbackSteps;
  }

  if (typeof value === "string") {
    const steps = splitInstructionText(value);
    return steps.length > 0 ? steps : fallbackSteps;
  }

  return fallbackSteps;
}

function listIngredientNames(ingredients: MealInstructionIngredient[]) {
  return ingredients.map((ingredient) => ingredient.name).filter(Boolean);
}

function getIngredientNamesByRole(
  ingredients: MealInstructionIngredient[],
  role: string
) {
  return ingredients.filter((ingredient) => ingredient.role === role).map((ingredient) => ingredient.name);
}

function getBeverageIngredients(ingredients: MealInstructionIngredient[]) {
  return ingredients.filter((ingredient) => {
    if (ingredient.role === "infusion") {
      return true;
    }

    if (ingredient.isBeverage) {
      return true;
    }

    const lowerName = ingredient.name.toLowerCase();
    return (
      lowerName.includes("infusi") ||
      lowerName.includes("mate") ||
      lowerName.includes("té") ||
      lowerName.includes("te ") ||
      lowerName.startsWith("te") ||
      lowerName.includes("agua")
    );
  });
}

function buildMealLead(mealType: ComidaTipo) {
  switch (mealType) {
    case "Desayuno":
      return "Para arrancar el dia,";
    case "Snack":
      return "Para una colacion rapida,";
    case "Almuerzo":
      return "Para el almuerzo,";
    case "Cena":
      return "Para cerrar el dia,";
    default:
      return "Para preparar el plato,";
  }
}

export function buildFallbackMealInstructions(input: {
  mealType: ComidaTipo;
  recipeName: string;
  ingredients: MealInstructionIngredient[];
}): string[] {
  const ingredients = input.ingredients.filter((ingredient) => ingredient.name.trim().length > 0);
  const ingredientNames = listIngredientNames(ingredients);
  const proteins = getIngredientNamesByRole(ingredients, "protein");
  const carbs = getIngredientNamesByRole(ingredients, "carb");
  const extras = ingredients
    .filter((ingredient) => ingredient.role !== "protein" && ingredient.role !== "carb")
    .filter((ingredient) => ingredient.role !== "infusion")
    .filter((ingredient) => !ingredient.isBeverage)
    .map((ingredient) => ingredient.name);
  const beverages = getBeverageIngredients(ingredients).map((ingredient) => ingredient.name);

  if (ingredientNames.length === 0) {
    return [
      `${buildMealLead(input.mealType)} organiza los ingredientes de ${input.recipeName}.`,
      "Sigue una coccion simple y sirve la receta al momento.",
    ];
  }

  const firstStep = `${buildMealLead(input.mealType)} pesa ${ingredientNames.join(", ")}.`;
  const mainStep =
    proteins.length > 0 && carbs.length > 0
      ? `Cocina ${proteins[0]} junto con ${carbs[0]} hasta que tengan la textura adecuada.`
      : `Cocina la base de ${input.recipeName} cuidando que no se sobrecocine.`;

  const extraStep =
    extras.length > 0
      ? `Integra ${extras.join(", ")} al final para mantener el sabor y la frescura.`
      : `Ajusta con sal, especias o condimentos suaves, sin sumar azucar ni grasa extra.`;

  const beverageStep =
    beverages.length > 0
      ? `Sirve ${beverages.join(", ")} aparte, preferiblemente sin azucar adicional.`
      : `Sirve inmediatamente para conservar el sabor y la textura.`;

  return [firstStep, mainStep, extraStep, beverageStep];
}

export function formatIngredientAmount(
  ingredient: Pick<UserDashboardMealIngredient, "grams" | "portionLabel">
) {
  const label = ingredient.portionLabel.trim();

  if (label) {
    return label;
  }

  return `${Math.round(ingredient.grams)} g`;
}

export function formatMacroLine(totals: DashboardMacroTotals) {
  return `${Math.round(totals.calories)} kcal | P ${Math.round(totals.proteins)}g | G ${Math.round(totals.fats)}g | C ${Math.round(totals.carbs)}g`;
}

export function formatIngredientMacroLine(totals: DashboardMacroTotals) {
  return `${Math.round(totals.calories)} kcal | P ${Math.round(totals.proteins)}g | G ${Math.round(totals.fats)}g | C ${Math.round(totals.carbs)}g`;
}
