import { Objetivo } from "@prisma/client";

import { deriveExperienceLevelFromYears } from "./training-form-domain";
import type {
  ExperienceLevelValue,
  TrainingTypeValue,
} from "../types/onboarding-ui-types";

type TrainingMacroPlan = {
  proteinPerKg: number;
  fatPerKg: number;
};

type TrainingNutritionInput = {
  objective: Objetivo;
  trainingType?: TrainingTypeValue | null;
  frequencyPerWeek?: number | null;
  yearsTraining?: number | null;
};

const PROTEIN_BASE_BY_OBJECTIVE_AND_EXPERIENCE: Record<Objetivo, Record<ExperienceLevelValue, number>> = {
  Bajar_grasa: {
    Principiante: 1.8,
    Intermedio: 2.0,
    Avanzado: 2.2,
  },
  Ganar_musculo: {
    Principiante: 1.8,
    Intermedio: 2.0,
    Avanzado: 2.2,
  },
  Mantenimiento: {
    Principiante: 1.6,
    Intermedio: 1.8,
    Avanzado: 2.0,
  },
};

const FAT_BASE_BY_OBJECTIVE_AND_EXPERIENCE: Record<Objetivo, Record<ExperienceLevelValue, number>> = {
  Bajar_grasa: {
    Principiante: 0.7,
    Intermedio: 0.75,
    Avanzado: 0.8,
  },
  Ganar_musculo: {
    Principiante: 0.9,
    Intermedio: 1.0,
    Avanzado: 1.05,
  },
  Mantenimiento: {
    Principiante: 0.8,
    Intermedio: 0.9,
    Avanzado: 1.0,
  },
};

const EXPERIENCE_FACTORS: Record<ExperienceLevelValue, number> = {
  Principiante: 1,
  Intermedio: 1.1,
  Avanzado: 1.15,
};

const PROTEIN_TRAINING_FACTORS: Record<TrainingTypeValue, number> = {
  No_entrena: 0.9,
  Cardio: 1,
  Mixto: 1.05,
  Musculacion: 1.1,
};

const FAT_TRAINING_FACTORS: Record<TrainingTypeValue, number> = {
  No_entrena: 0.95,
  Cardio: 1,
  Mixto: 1.02,
  Musculacion: 1.05,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getFrequencyFactor(frequencyPerWeek?: number | null, trainingType?: TrainingTypeValue | null) {
  if (!frequencyPerWeek || trainingType === "No_entrena") {
    return 1;
  }

  const normalizedFrequency = clamp(frequencyPerWeek, 0, 7);
  return 1 + Math.min(normalizedFrequency, 6) * 0.01;
}

function getYearsFactor(yearsTraining?: number | null) {
  if (!yearsTraining || yearsTraining <= 0) {
    return 1;
  }

  return 1 + Math.min(yearsTraining, 10) * 0.005;
}

export function buildTrainingMacroPlan(input: TrainingNutritionInput): TrainingMacroPlan {
  const trainingType = input.trainingType ?? "No_entrena";
  const experienceLevel = deriveExperienceLevelFromYears(input.yearsTraining ?? 0);
  const experienceFactor = EXPERIENCE_FACTORS[experienceLevel];
  const proteinBase = PROTEIN_BASE_BY_OBJECTIVE_AND_EXPERIENCE[input.objective][experienceLevel];
  const fatBase = FAT_BASE_BY_OBJECTIVE_AND_EXPERIENCE[input.objective][experienceLevel];
  const trainingFactor = PROTEIN_TRAINING_FACTORS[trainingType];
  const fatTrainingFactor = FAT_TRAINING_FACTORS[trainingType];
  const frequencyFactor = getFrequencyFactor(input.frequencyPerWeek, trainingType);
  const yearsFactor = getYearsFactor(input.yearsTraining);

  const proteinPerKg = clamp(
    proteinBase * experienceFactor * trainingFactor * frequencyFactor * yearsFactor,
    1.6,
    2.6
  );

  const fatPerKg = clamp(
    fatBase * experienceFactor * fatTrainingFactor,
    0.6,
    1.2
  );

  return {
    proteinPerKg,
    fatPerKg,
  };
}