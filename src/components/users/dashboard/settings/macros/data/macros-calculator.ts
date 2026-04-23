import type { Objetivo } from "@prisma/client";

import type { DashboardMacroTotals } from "@/actions/server/users/types";

export type MacroPresetMode = "Personalizado" | "Balanceado" | "Definicion" | "Volumen";

export type MacroApplyScope = "hoy" | "proxima_semana" | "dias_futuros";

export type MacroCalculatorDraft = {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  smartMacros: boolean;
  gradualDiet: boolean;
  carbCycling: boolean;
  preset: MacroPresetMode;
  applyScope: MacroApplyScope;
};

export type MacroPresetOption = {
  value: MacroPresetMode;
  label: string;
  description: string;
};

export type MacroScopeOption = {
  value: MacroApplyScope;
  label: string;
  description: string;
};

export const macroPresetOptions: MacroPresetOption[] = [
  {
    value: "Personalizado",
    label: "Personalizado",
    description: "Mantiene tus cifras actuales y deja el ajuste manual activo.",
  },
  {
    value: "Balanceado",
    label: "Balanceado",
    description: "Un reparto estable para mantener energia y constancia.",
  },
  {
    value: "Definicion",
    label: "Definicion",
    description: "Prioriza proteina y un poco mas de control en carbohidratos.",
  },
  {
    value: "Volumen",
    label: "Volumen",
    description: "Suelta un poco mas de espacio para carbohidratos y rendimiento.",
  },
];

export const macroScopeOptions: MacroScopeOption[] = [
  {
    value: "hoy",
    label: "Hoy",
    description: "Aplica solo al dia actual.",
  },
  {
    value: "proxima_semana",
    label: "Siguiente semana",
    description: "Mueve la vista previa a un bloque semanal.",
  },
  {
    value: "dias_futuros",
    label: "Dias futuros",
    description: "Deja el ajuste preparado para siguientes dias.",
  },
];

function round(value: number): number {
  return Number(value.toFixed(1));
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getObjectiveLabel(objective: Objetivo | null) {
  if (objective === "Bajar_grasa") {
    return "Definicion";
  }

  if (objective === "Ganar_musculo") {
    return "Volumen";
  }

  if (objective === "Mantenimiento") {
    return "Mantenimiento";
  }

  return "Personalizado";
}

export function getDefaultPreset(objective: Objetivo | null): MacroPresetMode {
  if (objective === "Bajar_grasa") {
    return "Definicion";
  }

  if (objective === "Ganar_musculo") {
    return "Volumen";
  }

  if (objective === "Mantenimiento") {
    return "Balanceado";
  }

  return "Personalizado";
}

function getPresetProfile(preset: MacroPresetMode) {
  if (preset === "Definicion") {
    return { proteinPerKg: 2.2, fatPerKg: 0.7, minimumCarbPerKg: 1.8 };
  }

  if (preset === "Volumen") {
    return { proteinPerKg: 2.0, fatPerKg: 0.9, minimumCarbPerKg: 3.0 };
  }

  if (preset === "Balanceado") {
    return { proteinPerKg: 1.8, fatPerKg: 0.8, minimumCarbPerKg: 2.5 };
  }

  return { proteinPerKg: 1.8, fatPerKg: 0.8, minimumCarbPerKg: 2.2 };
}

export function buildInitialMacroCalculatorDraft(
  targets: DashboardMacroTotals,
  objective: Objetivo | null
): MacroCalculatorDraft {
  return {
    calories: Math.max(Math.round(targets.calories || 0), 1200),
    proteins: Math.max(Math.round(targets.proteins || 0), 0),
    carbs: Math.max(Math.round(targets.carbs || 0), 0),
    fats: Math.max(Math.round(targets.fats || 0), 0),
    smartMacros: true,
    gradualDiet: objective === "Bajar_grasa",
    carbCycling: false,
    preset: getDefaultPreset(objective),
    applyScope: "proxima_semana",
  };
}

export function buildSuggestedMacroTargets(input: {
  calories: number;
  weightKg: number | null;
  objective: Objetivo | null;
  preset: MacroPresetMode;
}) {
  const profile = getPresetProfile(
    input.preset === "Personalizado" ? getDefaultPreset(input.objective) : input.preset
  );
  const weightKg = Math.max(input.weightKg ?? 70, 1);
  const proteins = Math.max(Math.round(weightKg * profile.proteinPerKg), 0);
  const fats = Math.max(Math.round(weightKg * profile.fatPerKg), 0);
  const minimumCarbs = Math.max(Math.round(weightKg * profile.minimumCarbPerKg), 0);
  const remainingCalories = Math.max(input.calories - proteins * 4 - fats * 9, 0);
  const carbs = Math.max(Math.round(remainingCalories / 4), minimumCarbs);

  return {
    proteins,
    fats,
    carbs,
  };
}

export function calculateMacroPercent(grams: number, calories: number, calorieFactor: 4 | 9) {
  if (calories <= 0) {
    return 0;
  }

  return round(Math.min((grams * calorieFactor * 100) / calories, 100));
}

export function estimateMonthlyWeightChangeKg(baseCalories: number, adjustedCalories: number) {
  const calorieDelta = adjustedCalories - baseCalories;
  const weeklyKg = round((calorieDelta * 7) / 7700);
  const monthlyKg = round(weeklyKg * 4.33);

  return {
    calorieDelta,
    weeklyKg,
    monthlyKg,
  };
}

export function formatSignedNumber(value: number, unit: string) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${round(value)} ${unit}`;
}
