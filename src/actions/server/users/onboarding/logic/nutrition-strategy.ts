import { Objetivo, VelocidadCambio } from "@prisma/client";

type MacroPlan = {
  proteinPerKg: number;
  fatPerKg: number;
};

type BodyClass = "very_thin" | "healthy" | "overweight" | "obesity";

export type NutritionGuardrails = {
  bodyClass: BodyClass;
  maxAdjustmentPct: number;
  minimumCalories: number;
  maximumCalories: number;
  minimumFatPerKg: number;
  minimumCarbPerKg: number;
};

const KCAL_PER_KG = 7700;
const DAYS_PER_WEEK = 7;

function byDifficulty(
  velocidadCambio: VelocidadCambio,
  values: { low: number; medium: number; high: number }
): number {
  const map: Record<VelocidadCambio, number> = {
    Lento: values.low,
    Moderado: values.medium,
    Rapido: values.high,
  };

  return map[velocidadCambio];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getBodyClass(bmi: number): BodyClass {
  if (bmi < 18.5) {
    return "very_thin";
  }

  if (bmi < 25) {
    return "healthy";
  }

  if (bmi < 30) {
    return "overweight";
  }

  return "obesity";
}

export function getNutritionGuardrails(input: {
  objective: Objetivo;
  speed: VelocidadCambio;
  bmi: number;
  tmbKcal: number;
  tdeeKcal: number;
  highActivity: boolean;
}): NutritionGuardrails {
  const bodyClass = getBodyClass(input.bmi);

  if (input.objective === Objetivo.Bajar_grasa) {
    const speedCap = byDifficulty(input.speed, { low: 0.15, medium: 0.2, high: 0.25 });
    const bodyCap: Record<BodyClass, number> = {
      very_thin: 0,
      healthy: 0.18,
      overweight: 0.22,
      obesity: 0.25,
    };

    const maxAdjustmentPct = clamp(
      Math.min(speedCap, bodyCap[bodyClass], input.highActivity ? 0.2 : 0.25),
      0,
      0.25
    );

    return {
      bodyClass,
      maxAdjustmentPct,
      minimumCalories:
        bodyClass === "very_thin"
          ? Math.max(Math.round(input.tmbKcal * 1.05), Math.round(input.tdeeKcal))
          : Math.max(
              Math.round(input.tmbKcal * 1.1),
              Math.round(input.tdeeKcal * (bodyClass === "obesity" ? 0.75 : 0.8))
            ),
      maximumCalories: Math.round(input.tdeeKcal * (input.highActivity ? 1.05 : 1.02)),
      minimumFatPerKg: bodyClass === "obesity" ? 0.65 : 0.7,
      minimumCarbPerKg: input.highActivity ? 1.5 : bodyClass === "obesity" ? 1.0 : 1.25,
    };
  }

  if (input.objective === Objetivo.Ganar_musculo) {
    const speedCap = byDifficulty(input.speed, { low: 0.05, medium: 0.1, high: 0.15 });
    const bodyCap: Record<BodyClass, number> = {
      very_thin: 0.15,
      healthy: 0.12,
      overweight: 0.08,
      obesity: 0.06,
    };

    const maxAdjustmentPct = clamp(
      Math.min(speedCap, bodyCap[bodyClass], input.highActivity ? 0.12 : 0.15),
      0,
      0.15
    );

    return {
      bodyClass,
      maxAdjustmentPct,
      minimumCalories: Math.max(
        Math.round(input.tmbKcal * 1.08),
        Math.round(input.tdeeKcal * 1.03)
      ),
      maximumCalories: Math.round(input.tdeeKcal * (input.highActivity ? 1.22 : 1.18)),
      minimumFatPerKg: bodyClass === "obesity" ? 0.8 : 0.95,
      minimumCarbPerKg: input.highActivity ? 3 : bodyClass === "obesity" ? 2.0 : 2.4,
    };
  }

  return {
    bodyClass,
    maxAdjustmentPct: 0,
    minimumCalories: Math.max(Math.round(input.tmbKcal * 1.05), Math.round(input.tdeeKcal)),
    maximumCalories: Math.round(input.tdeeKcal * 1.08),
    minimumFatPerKg: 0.8,
    minimumCarbPerKg: input.highActivity ? 2.5 : 1.8,
  };
}

function getWeeklyWeightDeltaKg(
  objetivo: Objetivo,
  velocidadCambio: VelocidadCambio
): number {
  if (objetivo === Objetivo.Bajar_grasa) {
    return byDifficulty(velocidadCambio, {
      low: 0.25,
      medium: 0.5,
      high: 0.75,
    });
  }

  if (objetivo === Objetivo.Ganar_musculo) {
    return byDifficulty(velocidadCambio, {
      low: 0.15,
      medium: 0.3,
      high: 0.45,
    });
  }

  return 0;
}

export function getCalorieAdjustmentKcal(
  objetivo: Objetivo,
  velocidadCambio: VelocidadCambio
): number {
  const weeklyDeltaKg = getWeeklyWeightDeltaKg(objetivo, velocidadCambio);
  const dailyDeltaKcal = Math.round((weeklyDeltaKg * KCAL_PER_KG) / DAYS_PER_WEEK);

  if (objetivo === Objetivo.Bajar_grasa) {
    return -dailyDeltaKcal;
  }

  if (objetivo === Objetivo.Ganar_musculo) {
    return dailyDeltaKcal;
  }

  return 0;
}

export function getMacroPlan(objetivo: Objetivo, velocidadCambio: VelocidadCambio): MacroPlan {
  if (objetivo === Objetivo.Bajar_grasa) {
    return {
      proteinPerKg: byDifficulty(velocidadCambio, { low: 2.0, medium: 2.1, high: 2.2 }),
      fatPerKg: byDifficulty(velocidadCambio, { low: 0.7, medium: 0.75, high: 0.8 }),
    };
  }

  if (objetivo === Objetivo.Ganar_musculo) {
    return {
      proteinPerKg: byDifficulty(velocidadCambio, { low: 2.0, medium: 2.1, high: 2.2 }),
      fatPerKg: byDifficulty(velocidadCambio, { low: 0.95, medium: 1.0, high: 1.05 }),
    };
  }

  return {
    proteinPerKg: byDifficulty(velocidadCambio, { low: 1.8, medium: 1.9, high: 2.0 }),
    fatPerKg: byDifficulty(velocidadCambio, { low: 0.85, medium: 0.9, high: 0.95 }),
  };
}

export function buildObjectiveFallbackMacros(
  kcalObjetivo: number,
  objetivo: Objetivo
): {
  proteinasG: number;
  grasasG: number;
  carbohidratosG: number;
} {
  const ratios =
    objetivo === Objetivo.Bajar_grasa
      ? { protein: 0.35, fat: 0.3, carbs: 0.35 }
      : objetivo === Objetivo.Ganar_musculo
        ? { protein: 0.3, fat: 0.25, carbs: 0.45 }
        : { protein: 0.3, fat: 0.3, carbs: 0.4 };

  return {
    proteinasG: Math.round((kcalObjetivo * ratios.protein) / 4),
    grasasG: Math.round((kcalObjetivo * ratios.fat) / 9),
    carbohidratosG: Math.round((kcalObjetivo * ratios.carbs) / 4),
  };
}

export function buildBalancedFallbackMacros(kcalObjetivo: number) {
  return buildObjectiveFallbackMacros(kcalObjetivo, Objetivo.Mantenimiento);
}
