import type {
  FoodsDraft,
  MetricsDraft,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import {
  buildMissingFoodCategoriesMessage,
  getMissingFoodCategories,
} from "@/actions/server/users/onboarding/constants";

export type MetricsErrors = Partial<Record<keyof MetricsDraft, string>>;
export type FoodsErrors = {
  preferencias?: string;
};

const NAME_PATTERN = /^[A-Za-z\u00C0-\u024F' -]+$/;

export function validateMetricsDraft(value: MetricsDraft): MetricsErrors {
  const errors: MetricsErrors = {};
  const birthDate = new Date(value.fechaNacimiento);

  if (!value.nombre.trim()) {
    errors.nombre = "Ingresa tu nombre.";
  } else if (value.nombre.trim().length < 2 || !NAME_PATTERN.test(value.nombre.trim())) {
    errors.nombre = "Nombre invalido.";
  }

  if (!value.apellido.trim()) {
    errors.apellido = "Ingresa tu apellido.";
  } else if (value.apellido.trim().length < 2 || !NAME_PATTERN.test(value.apellido.trim())) {
    errors.apellido = "Apellido invalido.";
  }

  if (!value.fechaNacimiento || Number.isNaN(birthDate.getTime())) {
    errors.fechaNacimiento = "Selecciona una fecha de nacimiento valida.";
  } else {
    const age = Math.max(0, new Date().getFullYear() - birthDate.getFullYear());
    if (age < 14 || age > 90) {
      errors.fechaNacimiento = "La edad permitida es entre 14 y 90 anos.";
    }
  }

  if (!["Masculino", "Femenino"].includes(value.sexo)) {
    errors.sexo = "Selecciona un genero valido.";
  }

  if (value.alturaCm < 120 || value.alturaCm > 230) {
    errors.alturaCm = "Altura valida: 120 a 230 cm.";
  }

  if (value.pesoKg < 35 || value.pesoKg > 250) {
    errors.pesoKg = "Peso valido: 35 a 250 kg.";
  }

  if (value.pesoObjetivoKg < 35 || value.pesoObjetivoKg > 250) {
    errors.pesoObjetivoKg = "Meta valida: 35 a 250 kg.";
  }

  if (value.objetivo === "Bajar_grasa" && value.pesoObjetivoKg >= value.pesoKg) {
    errors.pesoObjetivoKg = "Para bajar grasa, la meta debe ser menor al peso actual.";
  }

  if (value.objetivo === "Ganar_musculo" && value.pesoObjetivoKg <= value.pesoKg) {
    errors.pesoObjetivoKg = "Para ganar musculo, la meta debe ser mayor al peso actual.";
  }

  return errors;
}

export function validateFoodsDraft(value: FoodsDraft): FoodsErrors {
  const errors: FoodsErrors = {};

  const missingCategories = getMissingFoodCategories(value.preferencias);

  if (missingCategories.length > 0) {
    errors.preferencias = buildMissingFoodCategoriesMessage(missingCategories);
  }

  return errors;
}
