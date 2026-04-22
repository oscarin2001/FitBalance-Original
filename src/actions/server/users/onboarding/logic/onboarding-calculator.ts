import { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";

import type { AiTargets } from "../types/onboarding-action-types";
import {
  buildObjectiveFallbackMacros,
  getCalorieAdjustmentKcal,
  getNutritionGuardrails,
} from "./nutrition-strategy";
import { buildTrainingMacroPlan } from "./training-nutrition";
import type { ExperienceLevelValue, TrainingTypeValue } from "../types/onboarding-ui-types";

type BuildAiTargetsInput = {
  edad: number;
  sexo: string;
  alturaCm: number;
  pesoKg: number;
  pesoObjetivoKg: number;
  objetivo: Objetivo;
  nivelActividad: NivelActividad;
  velocidadCambio: VelocidadCambio;
  tipoEntrenamiento?: TrainingTypeValue | null;
  nivelExperiencia?: ExperienceLevelValue | null;
  frecuenciaEntreno?: number | null;
  anosEntrenando?: number | null;
};

function getActivityFactor(nivelActividad: NivelActividad): number {
  const map: Record<NivelActividad, number> = {
    Sedentario: 1.15,
    Ligero: 1.28,
    Moderado: 1.42,
    Activo: 1.58,
    Extremo: 1.72,
  };

  return map[nivelActividad];
}

function calculateMifflinStJeorTmb(input: { sexo: string; edad: number; alturaCm: number; pesoKg: number }) {
  const sexValue = input.sexo.toLowerCase();
  const sexOffset = sexValue.includes("fem") || sexValue.includes("muj") || sexValue.includes("female")
    ? -161
    : 5;

  return 10 * input.pesoKg + 6.25 * input.alturaCm - 5 * input.edad + sexOffset;
}

function getTrainingFactor(input: BuildAiTargetsInput): number {
  const trainingType = input.tipoEntrenamiento ?? "No_entrena";

  if (trainingType === "No_entrena") {
    return 1;
  }

  const trainingTypeFactor: Record<NonNullable<BuildAiTargetsInput["tipoEntrenamiento"]>, number> = {
    No_entrena: 1,
    Cardio: 1.02,
    Mixto: 1.04,
    Musculacion: 1.06,
  };

  const frequency = input.frecuenciaEntreno ?? 0;
  const years = input.anosEntrenando ?? 0;

  const frequencyFactor = frequency >= 5 ? 1.04 : frequency >= 3 ? 1.02 : 1.01;
  const yearsFactor = years >= 5 ? 1.03 : years >= 2 ? 1.02 : 1.01;

  return clamp(trainingTypeFactor[trainingType], 1, 1.15) * frequencyFactor * yearsFactor;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getExtraHydrationLiters(nivelActividad: NivelActividad, objetivo: Objetivo): number {
  const activityExtraMap: Record<NivelActividad, number> = {
    Sedentario: 0,
    Ligero: 0.3,
    Moderado: 0.5,
    Activo: 0.75,
    Extremo: 0.75,
  };

  const satietyBoost = objetivo === Objetivo.Bajar_grasa ? 0.5 : 0;
  return activityExtraMap[nivelActividad] + satietyBoost;
}

function getChangeRateKgPerWeek(velocidadCambio: VelocidadCambio): number {
  const map: Record<VelocidadCambio, number> = {
    Lento: 0.25,
    Moderado: 0.5,
    Rapido: 0.75,
  };

  return map[velocidadCambio];
}

function calculateMacroPercents(kcalObjetivo: number, proteins: number, fats: number, carbs: number) {
  if (kcalObjetivo <= 0) {
    return { proteinasPct: 0, grasasPct: 0, carbohidratosPct: 0 };
  }

  return {
    proteinasPct: Number(((proteins * 4 * 100) / kcalObjetivo).toFixed(1)),
    grasasPct: Number(((fats * 9 * 100) / kcalObjetivo).toFixed(1)),
    carbohidratosPct: Number(((carbs * 4 * 100) / kcalObjetivo).toFixed(1)),
  };
}

function estimateWeightChangeKg(calorieAdjustmentKcal: number) {
  const weeklyKg = Number(((calorieAdjustmentKcal * 7) / 7700).toFixed(2));
  const monthlyKg = Number((weeklyKg * 4.33).toFixed(2));

  return {
    weeklyKg,
    monthlyKg,
  };
}

export function calculateAge(fechaNacimiento: Date): number {
  const today = new Date();
  const ageDiff = today.getTime() - fechaNacimiento.getTime();
  const ageDate = new Date(ageDiff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  return age > 0 ? age : 18;
}

export function buildAiTargets(input: BuildAiTargetsInput): AiTargets {
  const tmbKcal = calculateMifflinStJeorTmb({
    sexo: input.sexo,
    edad: input.edad,
    alturaCm: input.alturaCm,
    pesoKg: input.pesoKg,
  });
  const walkingFactor = getActivityFactor(input.nivelActividad);
  const trainingFactor = getTrainingFactor(input);
  const gastoTotalKcal = tmbKcal * walkingFactor * trainingFactor;
  const bmi = input.alturaCm > 0 ? input.pesoKg / ((input.alturaCm / 100) ** 2) : 0;
  const guardrails = getNutritionGuardrails({
    objective: input.objetivo,
    speed: input.velocidadCambio,
    bmi,
    tmbKcal,
    tdeeKcal: gastoTotalKcal,
    highActivity: input.nivelActividad === "Activo" || input.nivelActividad === "Extremo",
  });
  const rawAdjustmentKcal = getCalorieAdjustmentKcal(input.objetivo, input.velocidadCambio);
  const corrections: string[] = [];
  const maxAdjustmentKcal = Math.round(gastoTotalKcal * guardrails.maxAdjustmentPct);
  const ajusteCaloricoKcal = clamp(rawAdjustmentKcal, -maxAdjustmentKcal, maxAdjustmentKcal);
  if (ajusteCaloricoKcal !== rawAdjustmentKcal) {
    corrections.push("Se limito el ajuste calorico al rango de seguridad permitido.");
  }
  const ajusteCaloricoPct = gastoTotalKcal > 0 ? ajusteCaloricoKcal / gastoTotalKcal : 0;
  const rawKcalObjetivo = Math.round(gastoTotalKcal + ajusteCaloricoKcal);
  const kcalObjetivo = clamp(rawKcalObjetivo, guardrails.minimumCalories, guardrails.maximumCalories);
  if (kcalObjetivo !== rawKcalObjetivo) {
    corrections.push("Se ajustaron las calorias finales al rango de seguridad.");
  }
  const macroPlan = buildTrainingMacroPlan({
    objective: input.objetivo,
    trainingType: input.tipoEntrenamiento,
    frequencyPerWeek: input.frecuenciaEntreno,
    yearsTraining: input.anosEntrenando,
  });

  const proteinMin = Math.round(input.pesoKg * 1.6);
  const proteinMax = Math.round(input.pesoKg * 2.6);
  const fatMin = Math.round(input.pesoKg * 0.6);
  const fatMax = Math.round(input.pesoKg * 1.2);

  let proteinasG = clamp(Math.round(input.pesoKg * macroPlan.proteinPerKg), proteinMin, proteinMax);
  let grasasG = clamp(
    Math.max(Math.round(input.pesoKg * macroPlan.fatPerKg), Math.round(input.pesoKg * guardrails.minimumFatPerKg)),
    fatMin,
    fatMax
  );
  if (proteinasG === proteinMin || proteinasG === proteinMax) {
    corrections.push("La proteina fue ajustada al rango seguro del perfil.");
  }
  if (grasasG === fatMin || grasasG === fatMax) {
    corrections.push("La grasa fue ajustada al rango seguro del perfil.");
  }

  let carbohidratosG = Math.round((kcalObjetivo - proteinasG * 4 - grasasG * 9) / 4);
  const minimumCarbsG = Math.round(input.pesoKg * guardrails.minimumCarbPerKg);

  if (carbohidratosG <= 0 || carbohidratosG < minimumCarbsG) {
    const fallback = buildObjectiveFallbackMacros(kcalObjetivo, input.objetivo);
    proteinasG = clamp(fallback.proteinasG, proteinMin, proteinMax);
    grasasG = clamp(fallback.grasasG, fatMin, fatMax);
    carbohidratosG = Math.round((kcalObjetivo - proteinasG * 4 - grasasG * 9) / 4);

    if (carbohidratosG <= 0 || carbohidratosG < minimumCarbsG) {
      carbohidratosG = Math.max(fallback.carbohidratosG, minimumCarbsG);
    }

    corrections.push("Se aplico un fallback por objetivo para evitar carbohidratos negativos o demasiado bajos.");
  }

  carbohidratosG = Math.max(carbohidratosG, minimumCarbsG);

  const { proteinasPct, grasasPct, carbohidratosPct } = calculateMacroPercents(
    kcalObjetivo,
    proteinasG,
    grasasG,
    carbohidratosG
  );

  const aguaBaseLitros = Number((input.pesoKg * 0.035).toFixed(2));
  const aguaExtraLitros = Number(
    getExtraHydrationLiters(input.nivelActividad, input.objetivo).toFixed(2)
  );
  const aguaLitros = Number((aguaBaseLitros + aguaExtraLitros).toFixed(2));
  const estimatedWeightChange = estimateWeightChangeKg(ajusteCaloricoKcal);
  const deltaPeso = Math.abs(input.pesoObjetivoKg - input.pesoKg);
  const etaSemanas =
    deltaPeso === 0
      ? 0
      : Number((deltaPeso / getChangeRateKgPerWeek(input.velocidadCambio)).toFixed(1));
  const etaDate = new Date();

  if (etaSemanas > 0) {
    etaDate.setDate(etaDate.getDate() + Math.round(etaSemanas * 7));
  }

  return {
    formulaName: "Mifflin-St Jeor",
    tmbKcal: Math.round(tmbKcal),
    gastoTotalKcal: Math.round(gastoTotalKcal),
    walkingFactor: Number(walkingFactor.toFixed(2)),
    trainingFactor: Number(trainingFactor.toFixed(2)),
    ajusteCaloricoPct: Number((ajusteCaloricoPct * 100).toFixed(1)),
    ajusteCaloricoKcal,
    kcalObjetivo,
    proteinasG,
    grasasG,
    carbohidratosG,
    proteinasPct,
    grasasPct,
    carbohidratosPct,
    aguaBaseLitros,
    aguaExtraLitros,
    aguaLitros,
    variacionPesoSemanalKg: estimatedWeightChange.weeklyKg,
    variacionPesoMensualKg: estimatedWeightChange.monthlyKg,
    etaSemanas,
    etaFecha: etaDate.toISOString(),
    corrections: corrections.length > 0 ? corrections : undefined,
  };
}
