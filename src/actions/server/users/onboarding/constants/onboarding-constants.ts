import type {
  ActivityValue,
  ExperienceLevelValue,
  ObjectiveValue,
  SpeedValue,
  TrainingTypeValue,
} from "../types/onboarding-ui-types";

export {
  foodCatalog,
  foodCategoryLabels,
  foodDataset,
  requiredFoodCategories,
  type FoodCategoryKey,
  type FoodCategoryMeta,
} from "./food-catalog";

export type SpeedGuide = {
  title: string;
  weeklyChange: string;
  summary: string;
  recommendedFor: string;
};

export const objectiveOptions: Array<{ value: ObjectiveValue; label: string }> = [
  { value: "Bajar_grasa", label: "Perder grasa" },
  { value: "Mantenimiento", label: "Mantener peso" },
  { value: "Ganar_musculo", label: "Ganar masa" },
];

export const activityOptions: Array<{ value: ActivityValue; label: string }> = [
  { value: "Sedentario", label: "Sedentario" },
  { value: "Ligero", label: "Ligero" },
  { value: "Moderado", label: "Moderado" },
  { value: "Activo", label: "Activo" },
  { value: "Extremo", label: "Extremo" },
];

export const speedOptions: Array<{ value: SpeedValue; label: string }> = [
  { value: "Lento", label: "Lento" },
  { value: "Moderado", label: "Medio" },
  { value: "Rapido", label: "Rapido" },
];

export const trainingTypeOptions: Array<{ value: TrainingTypeValue; label: string }> = [
  { value: "No_entrena", label: "Sin entrenamiento" },
  { value: "Cardio", label: "Cardio" },
  { value: "Mixto", label: "Mixto" },
  { value: "Musculacion", label: "Musculación" },
];

export const experienceLevelOptions: Array<{ value: ExperienceLevelValue; label: string }> = [
  { value: "Principiante", label: "Principiante" },
  { value: "Intermedio", label: "Intermedio" },
  { value: "Avanzado", label: "Avanzado" },
];

export const speedGuides: Record<SpeedValue, SpeedGuide> = {
  Lento: {
    title: "Lento",
    weeklyChange: "0.2 a 0.4 kg por semana",
    summary: "Ritmo suave y fácil de sostener.",
    recommendedFor: "Ideal si priorizas adherencia.",
  },
  Moderado: {
    title: "Medio",
    weeklyChange: "0.4 a 0.7 kg por semana",
    summary: "Balance entre avance y sostenibilidad.",
    recommendedFor: "La opción más equilibrada.",
  },
  Rapido: {
    title: "Rapido",
    weeklyChange: "0.7 a 1.0 kg por semana",
    summary: "Más agresivo y exige seguimiento.",
    recommendedFor: "Útil si puedes sostener un control más estricto.",
  },
};

export const onboardingDays = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
] as const;
