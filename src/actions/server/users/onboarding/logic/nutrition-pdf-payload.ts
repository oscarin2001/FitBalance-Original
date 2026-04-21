import type { NutritionPdfSummary, PersistedMealPlanDay, VisibleMealPlanDay } from "../types";

type BuildNutritionPdfPayloadInput = {
  userName: string;
  summary: NutritionPdfSummary;
  weeklyPlan: Array<VisibleMealPlanDay | PersistedMealPlanDay>;
};

function formatPrintableMealFoods(foodNames: string[]) {
  return foodNames.join(", ");
}

export function buildNutritionPdfPayload(input: BuildNutritionPdfPayloadInput) {
  const generatedAt = new Date().toISOString();
  const weeklyPlan = input.weeklyPlan.map((day) => ({
    dia: day.dayLabel,
    fechaIso: day.dateIso,
    comidas: day.meals.map((meal) => ({
      tipo: meal.mealType,
      nombrePlatillo: meal.recipeName,
      alimentos: meal.foods.map((food) => food.name),
    })),
  }));
  const serializedText = [
    "PLAN SEMANAL DE ALIMENTACION",
    `Generado: ${generatedAt}`,
    `Usuario: ${input.userName}`,
    `Objetivo: ${input.summary.objetivo}`,
    `IMC: ${input.summary.imc ?? "Pendiente"}`,
    `Nivel de actividad: ${input.summary.nivelActividad}`,
    `Velocidad: ${input.summary.velocidadCambio}`,
    `Agua diaria: ${input.summary.aguaLitrosDiarios} L`,
    `Calorias objetivo: ${input.summary.caloriasObjetivoTotal} kcal`,
    ...weeklyPlan.flatMap((day) => [
      `${day.dia} (${day.fechaIso.slice(0, 10)})`,
      ...day.comidas.map(
        (meal) =>
          `${meal.tipo}: ${meal.nombrePlatillo} - ${formatPrintableMealFoods(meal.alimentos)}`
      ),
    ]),
  ].join("\n");

  return {
    version: "nutrition-pdf-v2",
    generatedAt,
    user: {
      nombre: input.userName,
      objetivo: input.summary.objetivo,
      imc: input.summary.imc,
      nivelActividad: input.summary.nivelActividad,
      velocidadCambio: input.summary.velocidadCambio,
      aguaLitrosDiarios: input.summary.aguaLitrosDiarios,
      caloriasObjetivoTotal: input.summary.caloriasObjetivoTotal,
    },
    weeklyPlan,
    serializedText,
  };
}
