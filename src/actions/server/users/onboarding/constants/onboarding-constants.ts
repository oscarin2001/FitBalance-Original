import type { ActivityValue, ObjectiveValue, SpeedValue } from "../types/onboarding-ui-types";

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
  { value: "Bajar_grasa", label: "Bajar peso" },
  { value: "Mantenimiento", label: "Mantener" },
  { value: "Ganar_musculo", label: "Subir peso" },
];

export const activityOptions: Array<{ value: ActivityValue; label: string }> = [
  { value: "Sedentario", label: "Sedentario" },
  { value: "Ligero", label: "Ligero" },
  { value: "Moderado", label: "Moderado" },
  { value: "Activo", label: "Activo" },
];

export const speedOptions: Array<{ value: SpeedValue; label: string }> = [
  { value: "Lento", label: "Lento" },
  { value: "Moderado", label: "Medio" },
  { value: "Rapido", label: "Rapido" },
];

export const speedGuides: Record<SpeedValue, SpeedGuide> = {
  Lento: {
    title: "Lento",
    weeklyChange: "0.2 a 0.4 kg por semana",
    summary: "Avance gradual, mayor adherencia y menor estres fisico.",
    recommendedFor: "Ideal si priorizas constancia y mantener energia estable.",
  },
  Moderado: {
    title: "Medio",
    weeklyChange: "0.4 a 0.7 kg por semana",
    summary: "Balance entre resultados visibles y sostenibilidad.",
    recommendedFor: "Recomendado para la mayoria de usuarios que inician.",
  },
  Rapido: {
    title: "Rapido",
    weeklyChange: "0.7 a 1.0 kg por semana",
    summary: "Resultados antes, con mayor exigencia en habitos y seguimiento.",
    recommendedFor: "Util si tienes fecha objetivo y puedes cumplir el plan con disciplina.",
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
