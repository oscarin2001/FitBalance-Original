import type {
  DashboardMacroTotals,
  UserDashboardMealIngredient,
} from "@/actions/server/users/types";

export type ComidaTipo = "Desayuno" | "Almuerzo" | "Snack" | "Cena";

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

function normalizeIngredientName(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function formatTimeRange(minMinutes: number, maxMinutes: number) {
  if (minMinutes === maxMinutes) {
    return `${minMinutes} min`;
  }

  return `${minMinutes}-${maxMinutes} min`;
}

type CookingHint = {
  action: string;
  time: string;
  note: string;
};

function resolveCookingHint(name: string): CookingHint | null {
  const normalizedName = normalizeIngredientName(name);

  if (includesAny(normalizedName, ["huevo"])) {
    return {
      action: `hierve ${name}`,
      time: "9-10 min",
      note: "y pasalo a agua fria 1 min para cortar la coccion",
    };
  }

  if (includesAny(normalizedName, ["pollo", "pavo"])) {
    return {
      action: `cocina ${name} en sarten o plancha a fuego medio`,
      time: "10-12 min",
      note: "hasta que el centro quede bien cocido",
    };
  }

  if (includesAny(normalizedName, ["pescado", "trucha", "atun", "salmon"])) {
    return {
      action: `cocina ${name} a fuego medio-bajo`,
      time: "6-8 min",
      note: "sin sobrecocer para que no se seque",
    };
  }

  if (includesAny(normalizedName, ["res", "carne", "lomito"])) {
    return {
      action: `sella ${name} en sarten caliente`,
      time: "8-10 min",
      note: "ajustando segun grosor y punto deseado",
    };
  }

  if (includesAny(normalizedName, ["tofu", "tempeh"])) {
    return {
      action: `dora ${name} a fuego medio`,
      time: "4-6 min",
      note: "hasta que quede firme por fuera",
    };
  }

  if (includesAny(normalizedName, ["avena"])) {
    return {
      action: `cuece ${name}`,
      time: "5-7 min",
      note: "a fuego medio-bajo y moviendo para que no se pegue",
    };
  }

  if (includesAny(normalizedName, ["arroz"])) {
    return {
      action: `cuece ${name}`,
      time: "15-18 min",
      note: "tapado hasta que absorba el agua",
    };
  }

  if (includesAny(normalizedName, ["quinua", "quinoa"])) {
    return {
      action: `cuece ${name}`,
      time: "12-15 min",
      note: "hasta que abra y quede esponjosa",
    };
  }

  if (includesAny(normalizedName, ["amaranto"])) {
    return {
      action: `cuece ${name}`,
      time: "10-12 min",
      note: "a fuego bajo para que espese",
    };
  }

  if (includesAny(normalizedName, ["papa", "camote", "yuca"])) {
    return {
      action: `cuece ${name}`,
      time: "12-15 min",
      note: "hasta que quede tierno al pincharlo",
    };
  }

  if (includesAny(normalizedName, ["verdura", "vegetal", "brocoli", "zanahoria", "espinaca", "lechuga", "tomate", "cebolla"])) {
    return {
      action: `saltea ${name}`,
      time: "3-5 min",
      note: "solo hasta que quede tierno pero firme",
    };
  }

  if (includesAny(normalizedName, ["mate", "te", "infusion", "agua"])) {
    return {
      action: `calienta ${name}`,
      time: "5 min",
      note: "y deja infusionar 3-5 min segun intensidad",
    };
  }

  return null;
}

export function hasCookingTimingHints(steps: string[]) {
  return steps.some((step) => /\b\d+\s?(?:-\s?\d+)?\s?(?:min|mins|minutos?)\b/i.test(step));
}

export function buildDetailedMealInstructions(input: {
  mealType: ComidaTipo;
  recipeName: string;
  ingredients: MealInstructionIngredient[];
}): string[] {
  const ingredients = input.ingredients.filter((ingredient) => ingredient.name.trim().length > 0);
  const ingredientNames = listIngredientNames(ingredients);
  const proteins = getIngredientNamesByRole(ingredients, "protein");
  const carbs = getIngredientNamesByRole(ingredients, "carb");
  const vegetables = getIngredientNamesByRole(ingredients, "vegetable");
  const fats = getIngredientNamesByRole(ingredients, "fat");
  const fruits = getIngredientNamesByRole(ingredients, "fruit");
  const beverages = getBeverageIngredients(ingredients).map((ingredient) => ingredient.name);

  if (ingredientNames.length === 0) {
    return [
      `${buildMealLead(input.mealType)} organiza los ingredientes de ${input.recipeName}.`,
      "Precalienta la coccion 1-2 min y sirvela apenas termine de tomar forma.",
      "Ajusta sal, especias o acidez al final para no secar la preparacion.",
    ];
  }

  const proteinName = proteins[0] ?? ingredientNames[0];
  const carbName = carbs[0] ?? ingredientNames[Math.min(1, ingredientNames.length - 1)] ?? ingredientNames[0];
  const proteinHint = resolveCookingHint(proteinName);
  const carbHint = resolveCookingHint(carbName);
  const vegetableName = vegetables[0] ?? null;
  const fruitName = fruits[0] ?? null;
  const fatName = fats[0] ?? null;
  const beverageName = beverages[0] ?? null;

  const prepStep = `${buildMealLead(input.mealType)} lava, pesa y deja listos ${ingredientNames.join(", ")}. Organiza la coccion en orden para que todo salga en su punto.`;
  const proteinStep = proteinHint
    ? `${proteinHint.action} durante ${proteinHint.time}; ${proteinHint.note}.`
    : `Cocina ${proteinName} a fuego medio durante 8-12 min, revisando que quede bien hecho y jugoso.`;
  const carbStep = carbHint
    ? `${carbHint.action} durante ${carbHint.time}; ${carbHint.note}.`
    : `Prepara ${carbName} durante 10-15 min o hasta que quede tierno y listo para servir.`;

  const vegetableStep = vegetableName
    ? `Agrega ${vegetableName}${vegetables.length > 1 ? ` y ${vegetables.slice(1).join(", ")}` : ""} al final y saltea 3-5 min hasta que queden tiernas pero firmes.`
    : fruitName
      ? `Si hay fruta, agregala al final para mantener frescura y textura; no la cocines mas de 1-2 min.`
      : `Ajusta con sal, pimienta, limon o especias suaves para equilibrar el sabor.`;

  const finishStep = fatName
    ? `Termina con ${fatName}${fats.length > 1 ? ` y ${fats.slice(1).join(", ")}` : ""} fuera del fuego para conservar textura. Deja reposar 1-2 min y sirve.`
    : beverageName
      ? `Sirve ${beverageName} aparte y deja infusionar 3-5 min antes de tomar o acompanar. Luego reposa 1 min y sirve.`
      : `Apaga el fuego, deja reposar 1-2 min y sirve inmediatamente.`;

  return [prepStep, proteinStep, carbStep, vegetableStep, finishStep];
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
  return buildDetailedMealInstructions(input);
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
