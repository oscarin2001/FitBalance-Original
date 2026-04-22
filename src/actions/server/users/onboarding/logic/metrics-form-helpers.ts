import type {
  ActivityValue,
  GenderValue,
  MetricsDraft,
  ObjectiveValue,
  SpeedValue,
} from "../types/onboarding-ui-types";
import {
  displayHeight,
  displayWeight,
  parseHeightToCm,
  parseWeightToKg,
  type HeightUnit,
  type WeightUnit,
} from "./metrics-unit-conversions";
import { getSuggestedTargetWeightKg } from "@/lib/nutrition/weight-guidance";

export type MetricsFormValues = {
  nombre: string;
  apellido: string;
  edad: string;
  sexo: GenderValue;
  alturaCm: string;
  pesoActual: string;
  objetivo: ObjectiveValue;
  nivelActividad: ActivityValue;
  velocidadCambio: SpeedValue;
  usarObjetivoSugerido: boolean;
  pesoObjetivoManual: string;
};

export type MetricsSubstep = {
  key: "personal" | "measurements" | "goal";
  title: string;
};

export type MetricsUnitSelection = {
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
};

const AGE_MIN = 14;
const AGE_MAX = 90;
const NAME_SANITIZE_PATTERN = /[^A-Za-z\u00C0-\u024F' -]/g;

export const ageOptions = Array.from(
  { length: AGE_MAX - AGE_MIN + 1 },
  (_, index) => String(AGE_MIN + index)
);

export const metricsSubsteps: MetricsSubstep[] = [
  {
    key: "personal",
    title: "Perfil",
  },
  {
    key: "measurements",
    title: "Medidas",
  },
  {
    key: "goal",
    title: "Objetivo",
  },
];

export function sanitizeNameValue(input: string) {
  return input.replace(NAME_SANITIZE_PATTERN, "");
}

function normalizeAge(age: number) {
  const safeAge = Number.isFinite(age) ? age : 18;
  return Math.min(AGE_MAX, Math.max(AGE_MIN, Math.round(safeAge)));
}

export function calculateAgeFromBirthDate(value: string) {
  const birthDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return 18;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return normalizeAge(age);
}

export function buildBirthDateFromAge(age: number) {
  const today = new Date();
  const normalizedAge = normalizeAge(age);
  const birthDate = new Date(
    today.getFullYear() - normalizedAge,
    0,
    1
  );

  return birthDate.toISOString().slice(0, 10);
}

export function createMetricsFormValues(
  draft: MetricsDraft,
  units: MetricsUnitSelection
): MetricsFormValues {
  const { heightUnit, weightUnit } = units;
  const suggestedTargetKg = getSuggestedTargetWeightKg({
    objective: draft.objetivo,
    currentWeightKg: draft.pesoKg,
    heightCm: draft.alturaCm,
    speed: draft.objetivo === "Mantenimiento" ? "Moderado" : draft.velocidadCambio,
  });
  const targetDifference = Math.abs(draft.pesoObjetivoKg - suggestedTargetKg);
  const usarObjetivoSugerido = draft.objetivo === "Mantenimiento" || targetDifference <= 0.2;

  return {
    nombre: draft.nombre,
    apellido: draft.apellido,
    edad: String(calculateAgeFromBirthDate(draft.fechaNacimiento)),
    sexo: draft.sexo,
    alturaCm: String(displayHeight(draft.alturaCm, heightUnit)),
    pesoActual: String(displayWeight(draft.pesoKg, weightUnit)),
    objetivo: draft.objetivo,
    nivelActividad: draft.nivelActividad,
    velocidadCambio: draft.velocidadCambio,
    usarObjetivoSugerido,
    pesoObjetivoManual: String(
      displayWeight(usarObjetivoSugerido ? suggestedTargetKg : draft.pesoObjetivoKg, weightUnit)
    ),
  };
}

export function buildMetricsDraftFromForm(
  values: MetricsFormValues,
  units: MetricsUnitSelection
): MetricsDraft {
  const { heightUnit, weightUnit } = units;
  const edad = Number(values.edad);
  const alturaCm = parseHeightToCm(values.alturaCm, heightUnit);
  const pesoKg = parseWeightToKg(values.pesoActual, weightUnit);
  const velocidadCambio =
    values.objetivo === "Mantenimiento" ? "Moderado" : values.velocidadCambio;
  const suggestedTargetKg = getSuggestedTargetWeightKg({
    objective: values.objetivo,
    currentWeightKg: pesoKg,
    heightCm: alturaCm,
    speed: velocidadCambio,
  });
  const manualTargetKg = parseWeightToKg(values.pesoObjetivoManual, weightUnit);
  const pesoObjetivoKg =
    values.objetivo === "Mantenimiento" || values.usarObjetivoSugerido || manualTargetKg <= 0
      ? suggestedTargetKg
      : manualTargetKg;

  return {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    fechaNacimiento: buildBirthDateFromAge(edad),
    sexo: values.sexo,
    alturaCm,
    pesoKg,
    pesoObjetivoKg,
    objetivo: values.objetivo,
    nivelActividad: values.nivelActividad,
    velocidadCambio,
  };
}

export function getMetricsStepFields(
  stepIndex: number,
  objective: ObjectiveValue
): Array<keyof MetricsFormValues> {
  if (stepIndex === 0) {
    return ["nombre", "apellido", "edad", "sexo", "alturaCm"];
  }

  if (stepIndex === 1) {
    return ["pesoActual"];
  }

  return objective === "Mantenimiento"
    ? ["objetivo"]
    : ["objetivo", "velocidadCambio", "usarObjetivoSugerido", "pesoObjetivoManual"];
}

export function getSpeedIndex(speed: SpeedValue) {
  const map: Record<SpeedValue, number> = {
    Lento: 0,
    Moderado: 1,
    Rapido: 2,
  };

  return map[speed];
}

export function getSpeedFromIndex(value: number): SpeedValue {
  const map: Record<number, SpeedValue> = {
    0: "Lento",
    1: "Moderado",
    2: "Rapido",
  };

  return map[value] ?? "Lento";
}
