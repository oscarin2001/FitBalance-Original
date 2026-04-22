import { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";
import type {
  ActivityValue,
  GenderValue,
  TrainingTypeValue,
} from "./onboarding-ui-types";

export type OnboardingMetricsInput = {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: GenderValue;
  alturaCm: number;
  pesoKg: number;
  pesoObjetivoKg: number;
  objetivo: Objetivo;
  nivelActividad: NivelActividad;
  velocidadCambio: VelocidadCambio;
};

export type OnboardingTrainingInput = {
  nivelActividad: ActivityValue;
  tipoEntrenamiento: TrainingTypeValue;
  frecuenciaEntreno: number;
  anosEntrenando: number;
};

export type OnboardingFoodsInput = {
  preferencias: Record<string, string[]>;
  diasDieta: string[];
};

export type AiTargets = {
  formulaName: string;
  tmbKcal: number;
  gastoTotalKcal: number;
  walkingFactor: number;
  trainingFactor: number;
  ajusteCaloricoPct: number;
  ajusteCaloricoKcal: number;
  kcalObjetivo: number;
  proteinasG: number;
  grasasG: number;
  carbohidratosG: number;
  proteinasPct: number;
  grasasPct: number;
  carbohidratosPct: number;
  aguaBaseLitros: number;
  aguaExtraLitros: number;
  aguaLitros: number;
  variacionPesoSemanalKg: number;
  variacionPesoMensualKg: number;
  etaSemanas: number;
  etaFecha: string;
  corrections?: string[];
};
