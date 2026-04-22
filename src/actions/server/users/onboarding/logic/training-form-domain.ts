import type { ActivityValue, ExperienceLevelValue, TrainingDraft, TrainingTypeValue } from "../types/onboarding-ui-types";

const DEFAULT_TRAINING_DRAFT: TrainingDraft = {
  nivelActividad: "Moderado",
  tipoEntrenamiento: "No_entrena",
  frecuenciaEntreno: 0,
  anosEntrenando: 0,
};

const trainingTypes: TrainingTypeValue[] = ["No_entrena", "Cardio", "Mixto", "Musculacion"];
const activityLevels: ActivityValue[] = ["Sedentario", "Ligero", "Moderado", "Activo", "Extremo"];

function toSafeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function createDefaultTrainingDraft(): TrainingDraft {
  return { ...DEFAULT_TRAINING_DRAFT };
}

export function deriveExperienceLevelFromYears(years: number): ExperienceLevelValue {
  if (years <= 1) {
    return "Principiante";
  }

  if (years <= 3) {
    return "Intermedio";
  }

  return "Avanzado";
}

export function normalizeTrainingDraft(value: {
  nivel_actividad?: unknown;
  tipo_entrenamiento?: unknown;
  frecuencia_entreno?: unknown;
  anos_entrenando?: unknown;
} | null | undefined): TrainingDraft {
  const nivelActividad =
    typeof value?.nivel_actividad === "string" && activityLevels.includes(value.nivel_actividad as ActivityValue)
      ? (value.nivel_actividad as TrainingDraft["nivelActividad"])
      : DEFAULT_TRAINING_DRAFT.nivelActividad;
  const tipoEntrenamiento =
    typeof value?.tipo_entrenamiento === "string" && trainingTypes.includes(value.tipo_entrenamiento as TrainingTypeValue)
      ? (value.tipo_entrenamiento as TrainingTypeValue)
      : DEFAULT_TRAINING_DRAFT.tipoEntrenamiento;
  const frecuenciaEntreno = toSafeNumber(value?.frecuencia_entreno);
  const anosEntrenando = toSafeNumber(value?.anos_entrenando);

  return {
    nivelActividad,
    tipoEntrenamiento,
    frecuenciaEntreno: tipoEntrenamiento === "No_entrena" ? 0 : frecuenciaEntreno,
    anosEntrenando: tipoEntrenamiento === "No_entrena" ? 0 : anosEntrenando,
  };
}

export function isTrainingDraftComplete(value: {
  nivel_actividad?: unknown;
  tipo_entrenamiento?: unknown;
  frecuencia_entreno?: unknown;
  anos_entrenando?: unknown;
} | null | undefined) {
  if (!value) {
    return false;
  }

  const nivelActividad =
    typeof value.nivel_actividad === "string" && activityLevels.includes(value.nivel_actividad as ActivityValue)
      ? value.nivel_actividad
      : null;
  const tipoEntrenamiento =
    typeof value.tipo_entrenamiento === "string" ? (value.tipo_entrenamiento as TrainingTypeValue) : null;
  const frecuencia = toSafeNumber(value.frecuencia_entreno);
  const anos = toSafeNumber(value.anos_entrenando);

  if (!nivelActividad || !tipoEntrenamiento) {
    return false;
  }

  if (tipoEntrenamiento === "No_entrena") {
    return frecuencia === 0 && anos === 0;
  }

  return frecuencia >= 1 && anos >= 0;
}