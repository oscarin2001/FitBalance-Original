"use server";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";

import {
  buildMissingFoodCategoriesMessage,
  getMissingFoodCategories,
  onboardingDays,
} from "../constants";
import { normalizeSelectedFoods } from "../logic/food-preferences";
import { finalizeOnboardingPlan } from "../logic/onboarding-plan-finalizer";
import { deriveExperienceLevelFromYears } from "../logic/training-form-domain";
import { buildActionError, foodSchema, metricsSchema, trainingSchema } from "../validation/onboarding-validation";
import type { ActionResult } from "../validation/onboarding-validation";
import type { OnboardingFoodsInput, OnboardingMetricsInput, OnboardingTrainingInput } from "../types/onboarding-action-types";

export async function saveOnboardingMetricsAction(
  payload: OnboardingMetricsInput
): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = metricsSchema.safeParse(payload);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos de metricas invalidos.");
  }

  const fechaNacimiento = new Date(parsed.data.fechaNacimiento);
  if (Number.isNaN(fechaNacimiento.getTime())) {
    return buildActionError("La fecha de nacimiento no es valida.");
  }

  await prisma.usuario.update({
    where: { id: sessionUser.userId },
    data: {
      nombre: parsed.data.nombre.trim(),
      apellido: parsed.data.apellido.trim(),
      fecha_nacimiento: fechaNacimiento,
      sexo: parsed.data.sexo,
      pais: "Bolivia",
      altura_cm: parsed.data.alturaCm,
      peso_kg: parsed.data.pesoKg,
      peso_objetivo_kg: parsed.data.pesoObjetivoKg,
      objetivo: parsed.data.objetivo,
      nivel_actividad: parsed.data.nivelActividad,
      velocidad_cambio: parsed.data.velocidadCambio,
      onboarding_step: "training",
      terminos_aceptados: true,
    },
  });

  return { ok: true, message: "Metricas guardadas." };
}

export async function saveOnboardingTrainingAction(
  payload: OnboardingTrainingInput
): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = trainingSchema.safeParse(payload);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos de entrenamiento invalidos.");
  }

  await prisma.usuario.update({
    where: { id: sessionUser.userId },
    data: {
      nivel_actividad: parsed.data.nivelActividad,
      tipo_entrenamiento: parsed.data.tipoEntrenamiento,
      nivel_experiencia: deriveExperienceLevelFromYears(parsed.data.anosEntrenando),
      frecuencia_entreno: parsed.data.frecuenciaEntreno,
      anos_entrenando: parsed.data.anosEntrenando,
      onboarding_step: "foods",
    },
  });

  return { ok: true, message: "Entrenamiento guardado." };
}

export async function saveOnboardingFoodPreferencesAction(
  payload: OnboardingFoodsInput
): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = foodSchema.safeParse(payload);
  if (!parsed.success) {
    return buildActionError("Seleccion de comidas invalida.");
  }

  const normalizedPreferences = normalizeSelectedFoods(parsed.data.preferencias);
  const missingCategories = getMissingFoodCategories(normalizedPreferences);

  if (missingCategories.length > 0) {
    return buildActionError(buildMissingFoodCategoriesMessage(missingCategories));
  }

  await prisma.usuario.update({
    where: { id: sessionUser.userId },
    data: {
      preferencias_alimentos: normalizedPreferences,
      dias_dieta: [...onboardingDays],
      onboarding_step: "summary",
    },
  });

  return { ok: true, message: "Preferencias guardadas." };
}

export async function finalizeOnboardingAction(): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  return finalizeOnboardingPlan(sessionUser);
}
