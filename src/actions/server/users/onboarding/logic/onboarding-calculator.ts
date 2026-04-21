import { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";

import type { AiTargets } from "../types/onboarding-action-types";
import {
  getCalorieAdjustmentKcal,
  getMacroPlan,
  buildObjectiveFallbackMacros,
  getNutritionGuardrails,
} from "./nutrition-strategy";

type BuildAiTargetsInput = {
  edad: number;
  sexo: string;
  alturaCm: number;
  pesoKg: number;
  pesoObjetivoKg: number;
  objetivo: Objetivo;
  nivelActividad: NivelActividad;
  velocidadCambio: VelocidadCambio;
};

function getActivityFactor(nivelActividad: NivelActividad): number {
  const map: Record<NivelActividad, number> = {
    Sedentario: 1.2,
    Ligero: 1.375,
    Moderado: 1.55,
    Activo: 1.725,
    Extremo: 1.725,
  };

  return map[nivelActividad];
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

export function calculateAge(fechaNacimiento: Date): number {
  const today = new Date();
  const ageDiff = today.getTime() - fechaNacimiento.getTime();
  const ageDate = new Date(ageDiff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);

  return age > 0 ? age : 18;
}

export function buildAiTargets(input: BuildAiTargetsInput): AiTargets {
  const isFemale = input.sexo.toLowerCase().includes("fem");
  const tmbKcal = isFemale
    ? 10 * input.pesoKg + 6.25 * input.alturaCm - 5 * input.edad - 161
    : 10 * input.pesoKg + 6.25 * input.alturaCm - 5 * input.edad + 5;
  const gastoTotalKcal = tmbKcal * getActivityFactor(input.nivelActividad);
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
  const maxAdjustmentKcal = Math.round(gastoTotalKcal * guardrails.maxAdjustmentPct);
  const ajusteCaloricoKcal = clamp(rawAdjustmentKcal, -maxAdjustmentKcal, maxAdjustmentKcal);
  const ajusteCaloricoPct = gastoTotalKcal > 0 ? ajusteCaloricoKcal / gastoTotalKcal : 0;
  const kcalObjetivo = Math.max(
    guardrails.minimumCalories,
    Math.round(gastoTotalKcal + ajusteCaloricoKcal)
  );
  const macroPlan = getMacroPlan(input.objetivo, input.velocidadCambio);

  let proteinasG = Math.round(input.pesoKg * macroPlan.proteinPerKg);
  let grasasG = Math.max(
    Math.round(input.pesoKg * macroPlan.fatPerKg),
    Math.round(input.pesoKg * guardrails.minimumFatPerKg)
  );
  let carbohidratosG = Math.round((kcalObjetivo - proteinasG * 4 - grasasG * 9) / 4);
  const minimumCarbsG = Math.round(input.pesoKg * guardrails.minimumCarbPerKg);

  if (carbohidratosG <= 0 || carbohidratosG < minimumCarbsG) {
    const fallback = buildObjectiveFallbackMacros(kcalObjetivo, input.objetivo);
    proteinasG = Math.max(proteinasG, fallback.proteinasG);
    grasasG = Math.max(grasasG, fallback.grasasG);
    carbohidratosG = Math.round((kcalObjetivo - proteinasG * 4 - grasasG * 9) / 4);

    if (carbohidratosG <= 0 || carbohidratosG < minimumCarbsG) {
      proteinasG = fallback.proteinasG;
      grasasG = fallback.grasasG;
      carbohidratosG = fallback.carbohidratosG;
    }
  }

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
    tmbKcal: Math.round(tmbKcal),
    gastoTotalKcal: Math.round(gastoTotalKcal),
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
    etaSemanas,
    etaFecha: etaDate.toISOString(),
  };
}
