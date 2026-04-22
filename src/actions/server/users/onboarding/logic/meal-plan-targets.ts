import type { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";

import type { AiTargets } from "../types/onboarding-action-types";
import type { ExperienceLevelValue, TrainingTypeValue } from "../types/onboarding-ui-types";

import { buildAiTargets, calculateAge } from "./onboarding-calculator";

type ResolveMealPlanTargetsInput = {
  fechaNacimiento: Date;
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
  kcalObjetivo?: number | null;
  proteinasG?: number | null;
  grasasG?: number | null;
  carbohidratosG?: number | null;
  aguaLitros?: number | null;
  etaSemanas?: number | null;
  etaFecha?: Date | null;
};

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

export function resolveMealPlanTargets(input: ResolveMealPlanTargetsInput): AiTargets {
  const fallbackTargets = buildAiTargets({
    edad: calculateAge(input.fechaNacimiento),
    sexo: input.sexo,
    alturaCm: input.alturaCm,
    pesoKg: input.pesoKg,
    pesoObjetivoKg: input.pesoObjetivoKg,
    objetivo: input.objetivo,
    nivelActividad: input.nivelActividad,
    velocidadCambio: input.velocidadCambio,
    tipoEntrenamiento: input.tipoEntrenamiento,
    nivelExperiencia: input.nivelExperiencia,
    frecuenciaEntreno: input.frecuenciaEntreno,
    anosEntrenando: input.anosEntrenando,
  });

  if (
    !input.kcalObjetivo ||
    !input.proteinasG ||
    !input.grasasG ||
    !input.carbohidratosG ||
    !input.aguaLitros
  ) {
    return fallbackTargets;
  }

  return {
    ...fallbackTargets,
    kcalObjetivo: input.kcalObjetivo,
    proteinasG: input.proteinasG,
    grasasG: input.grasasG,
    carbohidratosG: input.carbohidratosG,
    ...calculateMacroPercents(
      input.kcalObjetivo,
      input.proteinasG,
      input.grasasG,
      input.carbohidratosG
    ),
    aguaLitros: input.aguaLitros,
    etaSemanas: input.etaSemanas ?? fallbackTargets.etaSemanas,
    etaFecha: input.etaFecha?.toISOString() ?? fallbackTargets.etaFecha,
  };
}
