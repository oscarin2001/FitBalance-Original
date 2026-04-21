import type {
  ObjectiveValue,
  SpeedValue,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";

const HEALTHY_BMI_MIN = 18.5;
const HEALTHY_BMI_MAX = 24.9;

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getSpeedDeltaKg(speed: SpeedValue) {
  const map: Record<SpeedValue, number> = {
    Lento: 1.5,
    Moderado: 2.5,
    Rapido: 3.5,
  };

  return map[speed];
}

export function calculateHealthyWeightRangeKg(heightCm: number) {
  const heightM = heightCm / 100;

  if (!Number.isFinite(heightM) || heightM <= 0) {
    return {
      minKg: 0,
      maxKg: 0,
      midpointKg: 0,
    };
  }

  const minKg = round(HEALTHY_BMI_MIN * heightM * heightM);
  const maxKg = round(HEALTHY_BMI_MAX * heightM * heightM);

  return {
    minKg,
    maxKg,
    midpointKg: round((minKg + maxKg) / 2),
  };
}

export function getHealthyWeightStatus(weightKg: number, heightCm: number) {
  const range = calculateHealthyWeightRangeKg(heightCm);

  if (range.minKg === 0 && range.maxKg === 0) {
    return "unknown" as const;
  }

  if (weightKg < range.minKg) {
    return "below" as const;
  }

  if (weightKg > range.maxKg) {
    return "above" as const;
  }

  return "within" as const;
}

export function getSuggestedTargetWeightKg(input: {
  objective: ObjectiveValue;
  currentWeightKg: number;
  heightCm: number;
  speed: SpeedValue;
}) {
  const { objective, currentWeightKg, heightCm, speed } = input;
  const range = calculateHealthyWeightRangeKg(heightCm);
  const deltaKg = getSpeedDeltaKg(speed);

  if (objective === "Mantenimiento") {
    return round(currentWeightKg);
  }

  if (objective === "Bajar_grasa") {
    if (currentWeightKg > range.maxKg) {
      return round(range.maxKg);
    }

    return round(Math.max(range.minKg, currentWeightKg - deltaKg));
  }

  if (currentWeightKg < range.minKg) {
    return round(range.minKg);
  }

  return round(Math.min(range.maxKg, currentWeightKg + deltaKg));
}

export function getSuggestedTargetCopy(input: {
  objective: ObjectiveValue;
  currentWeightKg: number;
  heightCm: number;
  speed: SpeedValue;
}) {
  const status = getHealthyWeightStatus(input.currentWeightKg, input.heightCm);

  if (input.objective === "Mantenimiento") {
    return "Usaremos tu peso actual como referencia de mantenimiento.";
  }

  if (input.objective === "Bajar_grasa") {
    return status === "above"
      ? "La sugerencia se acerca al limite superior del rango saludable."
      : "La sugerencia plantea un recorte conservador para preservar adherencia.";
  }

  return status === "below"
    ? "La sugerencia se acerca al limite inferior del rango saludable."
    : "La sugerencia plantea una subida progresiva sin ser agresiva.";
}

