import type { MetricsDraft } from "../types/onboarding-ui-types";
import type { MetricsFormValues } from "./metrics-form-helpers";

export type MetricsDraftFieldErrors = Partial<Record<keyof MetricsDraft, string>>;

const METRICS_DRAFT_NUMBER_FIELDS: Array<keyof MetricsDraft> = [
  "alturaCm",
  "pesoKg",
  "pesoObjetivoKg",
];

export function areMetricsDraftsEqual(left: MetricsDraft, right: MetricsDraft) {
  const keys: Array<keyof MetricsDraft> = [
    "nombre",
    "apellido",
    "fechaNacimiento",
    "sexo",
    "alturaCm",
    "pesoKg",
    "pesoObjetivoKg",
    "objetivo",
    "velocidadCambio",
  ];

  return keys.every((key) => {
    if (METRICS_DRAFT_NUMBER_FIELDS.includes(key)) {
      const leftNumber = left[key] as number;
      const rightNumber = right[key] as number;
      return Math.abs(leftNumber - rightNumber) < 0.001;
    }

    return left[key] === right[key];
  });
}

export function areMetricsFormValuesEqual(left: MetricsFormValues, right: MetricsFormValues) {
  return (
    left.nombre === right.nombre &&
    left.apellido === right.apellido &&
    left.edad === right.edad &&
    left.sexo === right.sexo &&
    left.alturaCm === right.alturaCm &&
    left.pesoActual === right.pesoActual &&
    left.objetivo === right.objetivo &&
    left.nivelActividad === right.nivelActividad &&
    left.velocidadCambio === right.velocidadCambio &&
    left.usarObjetivoSugerido === right.usarObjetivoSugerido &&
    left.pesoObjetivoManual === right.pesoObjetivoManual
  );
}

export function getStepIndexFromFieldErrors(errors?: MetricsDraftFieldErrors) {
  if (!errors) {
    return null;
  }

  const orderedFields: Array<keyof MetricsDraft> = [
    "nombre",
    "apellido",
    "fechaNacimiento",
    "sexo",
    "alturaCm",
    "pesoKg",
    "pesoObjetivoKg",
    "objetivo",
    "velocidadCambio",
  ];

  const firstErrorField = orderedFields.find((field) => typeof errors[field] === "string");

  if (!firstErrorField) {
    return null;
  }

  if (["nombre", "apellido", "fechaNacimiento", "sexo", "alturaCm"].includes(firstErrorField)) {
    return 0;
  }

  if (firstErrorField === "pesoKg") {
    return 1;
  }

  return 2;
}

export function getDraftFieldsForStep(stepIndex: number): Array<keyof MetricsDraft> {
  if (stepIndex === 0) {
    return ["nombre", "apellido", "fechaNacimiento", "sexo", "alturaCm"];
  }

  if (stepIndex === 1) {
    return ["pesoKg"];
  }

  return ["objetivo", "velocidadCambio", "pesoObjetivoKg"];
}

export function mapDraftFieldToFormField(field: keyof MetricsDraft): keyof MetricsFormValues {
  if (field === "fechaNacimiento") {
    return "edad";
  }

  if (field === "pesoKg") {
    return "pesoActual";
  }

  if (field === "pesoObjetivoKg") {
    return "pesoObjetivoManual";
  }

  return field;
}
