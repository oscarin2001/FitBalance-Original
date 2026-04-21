export type HeightUnit = "cm" | "ft";
export type WeightUnit = "kg" | "lb";

const CM_PER_FOOT = 30.48;
const KG_PER_LB = 0.45359237;

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function safeParseNumber(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function displayHeight(cm: number, unit: HeightUnit): number {
  if (unit === "cm") {
    return round(cm, 1);
  }

  return round(cm / CM_PER_FOOT, 2);
}

export function displayWeight(kg: number, unit: WeightUnit): number {
  if (unit === "kg") {
    return round(kg, 1);
  }

  return round(kg / KG_PER_LB, 1);
}

export function parseHeightToCm(raw: string, unit: HeightUnit): number {
  const value = safeParseNumber(raw);
  return unit === "cm" ? value : round(value * CM_PER_FOOT, 2);
}

export function parseWeightToKg(raw: string, unit: WeightUnit): number {
  const value = safeParseNumber(raw);
  return unit === "kg" ? value : round(value * KG_PER_LB, 2);
}

export function getHeightLimits(unit: HeightUnit): {
  min: number;
  max: number;
  step: number;
} {
  if (unit === "cm") {
    return { min: 120, max: 230, step: 0.1 };
  }

  return {
    min: round(120 / CM_PER_FOOT, 2),
    max: round(230 / CM_PER_FOOT, 2),
    step: 0.01,
  };
}

export function getWeightLimits(unit: WeightUnit): {
  min: number;
  max: number;
  step: number;
} {
  if (unit === "kg") {
    return { min: 35, max: 250, step: 0.1 };
  }

  return {
    min: round(35 / KG_PER_LB, 1),
    max: round(250 / KG_PER_LB, 1),
    step: 0.1,
  };
}
