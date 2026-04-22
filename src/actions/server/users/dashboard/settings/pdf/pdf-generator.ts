import { Objetivo } from "@prisma/client";

import type {
  BuildNutritionPdfPayloadInput,
  NutritionPdfSummary,
} from "./types";

type PdfMacroTotals = {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

type PdfMeal = {
  mealType: string;
  recipeName: string;
  foods: Array<string | { name: string }>;
  nutrition?: PdfMacroTotals;
};

function round(value: number) {
  return Number(value.toFixed(1));
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatSignedKg(value: number) {
  const absolute = Math.abs(value).toFixed(2);

  if (value === 0) {
    return "0.00 kg";
  }

  return `${value > 0 ? "+" : "-"}${absolute} kg`;
}

function formatLiters(value: number) {
  return `${value.toFixed(2)} L`;
}

function formatPercentBar(value: number) {
  const filled = Math.max(0, Math.min(10, Math.round(value / 10)));
  return `[${"#".repeat(filled)}${"-".repeat(10 - filled)}]`;
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getFoodName(food: string | { name: string }) {
  return typeof food === "string" ? food : food.name;
}

function getDayTotals(meals: PdfMeal[]): PdfMacroTotals | null {
  if (meals.length === 0 || !meals.every((meal) => meal.nutrition)) {
    return null;
  }

  return meals.reduce<PdfMacroTotals>(
    (acc, meal) => ({
      calories: round(acc.calories + (meal.nutrition?.calories ?? 0)),
      proteins: round(acc.proteins + (meal.nutrition?.proteins ?? 0)),
      carbs: round(acc.carbs + (meal.nutrition?.carbs ?? 0)),
      fats: round(acc.fats + (meal.nutrition?.fats ?? 0)),
    }),
    {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
    }
  );
}

function getObjectiveHeadline(summary: NutritionPdfSummary) {
  if (summary.objetivo === Objetivo.Bajar_grasa) {
    return "Este plan busca perder grasa manteniendo masa muscular.";
  }

  if (summary.objetivo === Objetivo.Ganar_musculo) {
    return "Este plan busca ganar masa con un superavit controlado.";
  }

  return "Este plan busca mantener el peso con energia estable.";
}

function getPracticalRules(summary: NutritionPdfSummary) {
  const rules = [
    "Si en 2 semanas no ves cambios, ajusta 100-200 kcal.",
    "Si tienes hambre, sube verduras y una porcion de proteina.",
    "Si tienes poca energia, revisa sueno y agua antes de bajar mas calorias.",
  ];

  if (summary.objetivo === Objetivo.Bajar_grasa) {
    rules.unshift("Evita azucar añadido y exceso de carbohidratos en deficit.");
  }

  if (summary.objetivo === Objetivo.Ganar_musculo) {
    rules.unshift("Reparte la proteina en todas las comidas para apoyar el musculo.");
  }

  return rules;
}

function getSwapSuggestions() {
  return [
    "Proteina: pechuga de pollo cocida, huevo cocido, pescado blanco cocido.",
    "Carbos: arroz basmati cocido, avena cocida, papa cocida, quinua cocida.",
    "Extras: queso fresco, yogur griego natural, pan integral.",
  ];
}

function getObjectiveWarnings(summary: NutritionPdfSummary) {
  const warnings = [
    "No hace falta contar cada detalle; concentra tu seguimiento en calorias y peso.",
    "Si la energia cae mucho, sube volumen de comida o revisa el deficit.",
  ];

  if (summary.objetivo === Objetivo.Bajar_grasa) {
    warnings.push("No recortes carbohidratos de forma extrema si ya estas en deficit.");
  }

  if (summary.aguaLitrosDiarios < 2) {
    warnings.push("Tu agua calculada es baja; revisa peso y actividad.");
  }

  return unique(warnings);
}

function buildWeeklyPlanLines(weeklyPlan: BuildNutritionPdfPayloadInput["weeklyPlan"], summary: NutritionPdfSummary) {
  const dailyTargetTotals: PdfMacroTotals = {
    calories: round(summary.caloriasObjetivoTotal),
    proteins: round(summary.proteinasG),
    carbs: round(summary.carbohidratosG),
    fats: round(summary.grasasG),
  };

  return weeklyPlan.flatMap((day) => {
    const typedDay = day as { dayLabel: string; dateIso: string; meals: PdfMeal[] };
    const dayTotals = getDayTotals(typedDay.meals) ?? dailyTargetTotals;

    return [
      `### ${typedDay.dayLabel}`,
      `Total diario: ${Math.round(dayTotals.calories)} kcal | Proteinas ${Math.round(dayTotals.proteins)} g | Grasas ${Math.round(dayTotals.fats)} g | Carbohidratos ${Math.round(dayTotals.carbs)} g`,
      ...typedDay.meals.flatMap((meal) => [
        `- ${meal.mealType}: ${meal.recipeName}`,
        `  Alimentos: ${meal.foods.map(getFoodName).join(", ")}`,
      ]),
      "",
    ];
  });
}

export function buildNutritionPdfPayload(input: BuildNutritionPdfPayloadInput) {
  const generatedAt = new Date().toISOString();
  const recommendations = unique([getObjectiveHeadline(input.summary), ...(input.summary.recomendaciones ?? []), ...getPracticalRules(input.summary)]);
  const warnings = getObjectiveWarnings(input.summary);
  const weeklyPlan = input.weeklyPlan.map((day) => {
    const typedDay = day as { dayLabel: string; dateIso: string; meals: PdfMeal[] };
    const dayTotals = getDayTotals(typedDay.meals);

    return {
      dia: typedDay.dayLabel,
      fechaIso: typedDay.dateIso,
      totales:
        dayTotals ?? {
          calories: round(input.summary.caloriasObjetivoTotal),
          proteins: round(input.summary.proteinasG),
          carbs: round(input.summary.carbohidratosG),
          fats: round(input.summary.grasasG),
        },
      comidas: typedDay.meals.map((meal) => ({
        tipo: meal.mealType,
        nombrePlatillo: meal.recipeName,
        alimentos: meal.foods.map(getFoodName),
      })),
    };
  });

  const serializedText = [
    "FITBALANCE - Plan nutricional",
    `Generado: ${generatedAt}`,
    `Usuario: ${input.userName}`,
    "",
    "## Resumen rapido",
    `- Objetivo: ${formatLabel(input.summary.objetivo)}`,
    `- Calorias diarias: ${Math.round(input.summary.caloriasObjetivoTotal)} kcal`,
    `- Cambio esperado: ${formatSignedKg(input.summary.variacionPesoSemanalKg)} por semana / ${formatSignedKg(input.summary.variacionPesoMensualKg)} por mes`,
    `- Proteinas ${formatPercentBar(input.summary.proteinasPct)} ${Math.round(input.summary.proteinasG)} g`,
    `- Grasas ${formatPercentBar(input.summary.grasasPct)} ${Math.round(input.summary.grasasG)} g`,
    `- Carbohidratos ${formatPercentBar(input.summary.carbohidratosPct)} ${Math.round(input.summary.carbohidratosG)} g`,
    `- Agua calculada: ${formatLiters(input.summary.aguaLitrosDiarios)} por dia`,
    "",
    "## Que significa",
    ...recommendations.map((item) => `- ${item}`),
    "",
    "## Intercambios utiles",
    ...getSwapSuggestions().map((item) => `- ${item}`),
    "",
    "## Advertencias",
    ...warnings.map((item) => `- ${item}`),
    "",
    "## Plan semanal",
    ...buildWeeklyPlanLines(input.weeklyPlan, input.summary),
  ].join("\n");

  return {
    version: "nutrition-pdf-v3",
    generatedAt,
    user: {
      nombre: input.userName,
      ...input.summary,
      recomendaciones: recommendations,
      advertencias: warnings,
    },
    weeklyPlan,
    serializedText,
  };
}