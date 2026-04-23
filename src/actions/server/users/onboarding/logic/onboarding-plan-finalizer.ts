import { Prisma } from "@prisma/client";

import type { SessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";

import {
  buildMissingFoodCategoriesMessage,
  getMissingFoodCategories,
  onboardingDays,
} from "../constants";
import type { ActionResult } from "../validation";
import { buildActionError } from "../validation";

import { buildNutritionPdfPayload } from "@/actions/server/users/dashboard/settings/pdf";
import { calculateAge } from "./onboarding-calculator";
import { generateDietPlan } from "./diet-plan-generator";
import { normalizeSelectedFoods } from "./food-preferences";
import { persistWeeklyMealPlan } from "./weekly-meal-plan-persistence";
import { resolveMealPlanTargets } from "./meal-plan-targets";

export async function finalizeOnboardingPlan(sessionUser: SessionAppUser): Promise<ActionResult> {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: sessionUser.userId },
      select: {
        fecha_nacimiento: true,
        sexo: true,
        altura_cm: true,
        peso_kg: true,
        peso_objetivo_kg: true,
        objetivo: true,
        nivel_actividad: true,
        velocidad_cambio: true,
        tipo_entrenamiento: true,
        nivel_experiencia: true,
        frecuencia_entreno: true,
        anos_entrenando: true,
        preferencias_alimentos: true,
        dias_dieta: true,
        kcal_objetivo: true,
        proteinas_g_obj: true,
        grasas_g_obj: true,
        carbohidratos_g_obj: true,
        agua_litros_obj: true,
        objetivo_eta_semanas: true,
        objetivo_eta_fecha: true,
        progreso: {
          select: { imc: true },
          orderBy: { fecha: "desc" },
          take: 1,
        },
      },
    });

    if (
      !usuario?.fecha_nacimiento ||
      !usuario.altura_cm ||
      !usuario.peso_kg ||
      !usuario.peso_objetivo_kg ||
      !usuario.objetivo ||
      !usuario.nivel_actividad ||
      !usuario.velocidad_cambio ||
      !usuario.tipo_entrenamiento ||
      !usuario.nivel_experiencia ||
      usuario.frecuencia_entreno === null ||
      usuario.anos_entrenando === null
    ) {
      return buildActionError("Completa metricas, entrenamiento y objetivo antes de finalizar.");
    }

    const selectedFoodPreferences = normalizeSelectedFoods(usuario.preferencias_alimentos);
    const missingCategories = getMissingFoodCategories(selectedFoodPreferences);

    if (missingCategories.length > 0) {
      return buildActionError(buildMissingFoodCategoriesMessage(missingCategories));
    }

    const selectedDays = [...onboardingDays];
    const targets = resolveMealPlanTargets({
      fechaNacimiento: usuario.fecha_nacimiento,
      sexo: usuario.sexo,
      alturaCm: usuario.altura_cm,
      pesoKg: usuario.peso_kg,
      pesoObjetivoKg: usuario.peso_objetivo_kg,
      objetivo: usuario.objetivo,
      nivelActividad: usuario.nivel_actividad,
      velocidadCambio: usuario.velocidad_cambio,
      tipoEntrenamiento: usuario.tipo_entrenamiento,
      nivelExperiencia: usuario.nivel_experiencia,
      frecuenciaEntreno: usuario.frecuencia_entreno,
      anosEntrenando: usuario.anos_entrenando,
      kcalObjetivo: usuario.kcal_objetivo,
      proteinasG: usuario.proteinas_g_obj,
      grasasG: usuario.grasas_g_obj,
      carbohidratosG: usuario.carbohidratos_g_obj,
      aguaLitros: usuario.agua_litros_obj,
      etaSemanas: usuario.objetivo_eta_semanas,
      etaFecha: usuario.objetivo_eta_fecha,
    });
    const userName = `${sessionUser.nombre} ${sessionUser.apellido}`;
    const generatedDiet = await generateDietPlan({
      userName,
      objetivo: usuario.objetivo,
      nivelActividad: usuario.nivel_actividad,
      velocidadCambio: usuario.velocidad_cambio,
      tipoEntrenamiento: usuario.tipo_entrenamiento,
      nivelExperiencia: usuario.nivel_experiencia,
      frecuenciaEntreno: usuario.frecuencia_entreno,
      anosEntrenando: usuario.anos_entrenando,
      targets,
      preferencias: selectedFoodPreferences,
      diasDieta: selectedDays,
    });
    const persistedDiet = await persistWeeklyMealPlan({
      userId: sessionUser.userId,
      objective: usuario.objetivo,
      speed: usuario.velocidad_cambio,
      targets,
      plan: generatedDiet,
    });
    const nutritionPdfPayload = buildNutritionPdfPayload({
      userName,
      summary: {
        objetivo: usuario.objetivo,
        imc: usuario.progreso[0]?.imc ?? null,
        edad: calculateAge(usuario.fecha_nacimiento),
        sexo: usuario.sexo,
        alturaCm: usuario.altura_cm,
        pesoKg: usuario.peso_kg,
        pesoObjetivoKg: usuario.peso_objetivo_kg,
        nivelActividad: usuario.nivel_actividad,
        velocidadCambio: usuario.velocidad_cambio,
        tipoEntrenamiento: usuario.tipo_entrenamiento,
        nivelExperiencia: usuario.nivel_experiencia,
        frecuenciaEntreno: usuario.frecuencia_entreno,
        anosEntrenando: usuario.anos_entrenando,
        formulaName: targets.formulaName,
        tmbKcal: targets.tmbKcal,
        gastoTotalKcal: targets.gastoTotalKcal,
        walkingFactor: targets.walkingFactor,
        trainingFactor: targets.trainingFactor,
        ajusteCaloricoPct: targets.ajusteCaloricoPct,
        ajusteCaloricoKcal: targets.ajusteCaloricoKcal,
        proteinasG: targets.proteinasG,
        grasasG: targets.grasasG,
        carbohidratosG: targets.carbohidratosG,
        proteinasPct: targets.proteinasPct,
        grasasPct: targets.grasasPct,
        carbohidratosPct: targets.carbohidratosPct,
        aguaBaseLitros: targets.aguaBaseLitros,
        aguaExtraLitros: targets.aguaExtraLitros,
        aguaLitrosDiarios: targets.aguaLitros,
        variacionPesoSemanalKg: targets.variacionPesoSemanalKg,
        variacionPesoMensualKg: targets.variacionPesoMensualKg,
        correcciones: targets.corrections,
        advertencias: persistedDiet.warning ? [persistedDiet.warning] : [],
        caloriasObjetivoTotal: targets.kcalObjetivo,
      },
      weeklyPlan: persistedDiet.days,
    });
    const generatedAt = new Date().toISOString();
    const planAiPayload: Prisma.InputJsonValue = {
      version: `weekly-plan-v3-${persistedDiet.source}`,
      generatedAt,
      foodPreferences: selectedFoodPreferences as Prisma.InputJsonValue,
      trainingDays: selectedDays as Prisma.InputJsonValue,
      targets: targets as Prisma.InputJsonValue,
      nutritionPdfPayload: nutritionPdfPayload as Prisma.InputJsonValue,
      weeklyPlan: persistedDiet as Prisma.InputJsonValue,
      model: persistedDiet.model,
      warning: persistedDiet.warning ?? "",
    };

    await prisma.usuario.update({
      where: { id: sessionUser.userId },
      data: {
        kcal_objetivo: targets.kcalObjetivo,
        proteinas_g_obj: targets.proteinasG,
        grasas_g_obj: targets.grasasG,
        carbohidratos_g_obj: targets.carbohidratosG,
        agua_litros_obj: targets.aguaLitros,
        objetivo_eta_semanas: targets.etaSemanas,
        objetivo_eta_fecha: new Date(targets.etaFecha),
        plan_ai: planAiPayload,
        preferencias_alimentos: selectedFoodPreferences as Prisma.InputJsonValue,
        dias_dieta: selectedDays as Prisma.InputJsonValue,
        onboarding_completed: true,
        onboarding_step: "done",
      },
    });

    return { ok: true, message: "Onboarding finalizado." };
  } catch (error) {
    console.error("Error finalizing onboarding", error);
    return buildActionError("Estamos generando el plan por ti mientras carga. Intenta nuevamente en unos segundos.");
  }
}
