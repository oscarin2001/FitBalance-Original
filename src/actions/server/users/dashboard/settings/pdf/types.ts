export type NivelActividad =
  | "Sedentario"
  | "Ligero"
  | "Moderado"
  | "Activo"
  | "Extremo"
  | "Muy_activo";

export type Objetivo =
  | "Bajar_grasa"
  | "Ganar_musculo"
  | "Mantenimiento"
  | "Mantener";

export type VelocidadCambio =
  | "Lento"
  | "Moderado"
  | "Rapido";

import type {
  PersistedMealPlanDay,
  VisibleMealPlanDay,
} from "../../../onboarding/types/weekly-meal-plan-types";

export type NutritionPdfSummary = {
  objetivo: Objetivo;
  imc: number | null;
  edad: number;
  sexo: string;
  alturaCm: number;
  pesoKg: number;
  pesoObjetivoKg: number;
  nivelActividad: NivelActividad;
  tipoEntrenamiento?: string | null;
  nivelExperiencia?: string | null;
  frecuenciaEntreno?: number | null;
  anosEntrenando?: number | null;
  formulaName: string;
  tmbKcal: number;
  gastoTotalKcal: number;
  walkingFactor: number;
  trainingFactor: number;
  velocidadCambio: VelocidadCambio;
  ajusteCaloricoPct: number;
  ajusteCaloricoKcal: number;
  proteinasG: number;
  grasasG: number;
  carbohidratosG: number;
  proteinasPct: number;
  grasasPct: number;
  carbohidratosPct: number;
  aguaBaseLitros: number;
  aguaExtraLitros: number;
  aguaLitrosDiarios: number;
  variacionPesoSemanalKg: number;
  variacionPesoMensualKg: number;
  correcciones?: string[];
  advertencias?: string[];
  recomendaciones?: string[];
  caloriasObjetivoTotal: number;
};

export type BuildNutritionPdfPayloadInput = {
  userName: string;
  summary: NutritionPdfSummary;
  weeklyPlan: Array<VisibleMealPlanDay | PersistedMealPlanDay>;
};