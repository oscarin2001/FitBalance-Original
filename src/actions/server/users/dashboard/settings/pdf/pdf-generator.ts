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

function getObjectiveRecommendations(summary: NutritionPdfSummary) {
  if (summary.objetivo === Objetivo.Bajar_grasa) {
    return [
      "Evita el azúcar añadido y las bebidas azucaradas.",
      "No abuses de los carbohidratos en los días de déficit.",
      "Prioriza proteína magra, verduras y agua suficiente.",
    ];
  }

  if (summary.objetivo === Objetivo.Ganar_musculo) {
    return [
      "Reparte la proteína en todas las comidas.",
      "Usa carbohidratos alrededor del entrenamiento.",
      "Mantén las porciones constantes y no saltes comidas.",
    ];
  }

  return [
    "Mantén porciones estables y prioriza comidas completas.",
    "Cuida tu hidratación y no recortes comidas sin necesidad.",
    "Ajusta el plan solo si tu energía o peso cambian de forma sostenida.",
  ];
}

function getObjectiveWarnings(summary: NutritionPdfSummary) {
  const baseWarnings = summary.correcciones ?? [];

  if (summary.objetivo === Objetivo.Bajar_grasa) {
    baseWarnings.push("Si bajas de peso, no recortes carbohidratos de forma agresiva.");
  }

  if (summary.objetivo === Objetivo.Ganar_musculo) {
    baseWarnings.push("Evita comer muy poco, porque puede frenar el progreso.");
  }

  if (summary.aguaLitrosDiarios < 2) {
    baseWarnings.push("La hidratación calculada es baja; revisa tu peso y actividad.");
  }

  return unique([...(summary.advertencias ?? []), ...baseWarnings]);
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
      `Fecha: ${typedDay.dateIso.slice(0, 10)}`,
      `Meta diaria: ${Math.round(dayTotals.calories)} kcal | Proteínas ${Math.round(dayTotals.proteins)} g | Grasas ${Math.round(dayTotals.fats)} g | Carbohidratos ${Math.round(dayTotals.carbs)} g`,
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
  const recommendations = unique([...(input.summary.recomendaciones ?? []), ...getObjectiveRecommendations(input.summary)]);
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
    "## Resumen general",
    `- Objetivo: ${formatLabel(input.summary.objetivo)}`,
    `- Peso inicial: ${input.summary.pesoKg.toFixed(1)} kg`,
    `- Peso objetivo: ${input.summary.pesoObjetivoKg.toFixed(1)} kg`,
    `- IMC: ${input.summary.imc?.toFixed(1) ?? "Pendiente"}`,
    `- Sexo: ${input.summary.sexo}`,
    `- Edad: ${input.summary.edad} años`,
    `- Altura: ${input.summary.alturaCm.toFixed(0)} cm`,
    `- Nivel de actividad: ${formatLabel(input.summary.nivelActividad)}`,
    `- Tipo de entrenamiento: ${formatLabel(input.summary.tipoEntrenamiento ?? "Sin definir")}`,
    `- Nivel de experiencia: ${formatLabel(input.summary.nivelExperiencia ?? "Sin definir")}`,
    `- Frecuencia: ${input.summary.frecuenciaEntreno ?? 0} días por semana`,
    `- Años entrenando: ${input.summary.anosEntrenando ?? 0}`,
    `- Fórmula usada: ${input.summary.formulaName}`,
    `- TMB: ${Math.round(input.summary.tmbKcal)} kcal`,
    `- Gasto total: ${Math.round(input.summary.gastoTotalKcal)} kcal`,
    `- Movimiento diario: ${input.summary.walkingFactor.toFixed(2)}x`,
    `- Entrenamiento: ${input.summary.trainingFactor.toFixed(2)}x`,
    `- Ajuste calórico: ${input.summary.ajusteCaloricoKcal >= 0 ? "+" : ""}${Math.round(input.summary.ajusteCaloricoKcal)} kcal/día (${input.summary.ajusteCaloricoPct.toFixed(1)}%)`,
    `- Proteínas: ${Math.round(input.summary.proteinasG)} g (${input.summary.proteinasPct.toFixed(1)}%)`,
    `- Grasas: ${Math.round(input.summary.grasasG)} g (${input.summary.grasasPct.toFixed(1)}%)`,
    `- Carbohidratos: ${Math.round(input.summary.carbohidratosG)} g (${input.summary.carbohidratosPct.toFixed(1)}%)`,
    `- Agua base: ${formatLiters(input.summary.aguaBaseLitros)}`,
    `- Agua extra del programa: ${formatLiters(input.summary.aguaExtraLitros)}`,
    `- Agua calculada: ${formatLiters(input.summary.aguaLitrosDiarios)} al día`,
    `- Cambio estimado: ${formatSignedKg(input.summary.variacionPesoSemanalKg)} por semana / ${formatSignedKg(input.summary.variacionPesoMensualKg)} por mes`,
    "",
    "## Recomendaciones",
    ...recommendations.map((item) => `- ${item}`),
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