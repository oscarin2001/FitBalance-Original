import { requireApiSessionUser } from "@/actions/server/users/auth";
import { buildNutritionPdfPayload } from "@/actions/server/users/dashboard/settings/pdf";
import { onboardingDays } from "@/actions/server/users/onboarding/constants";
import { calculateAge } from "@/actions/server/users/onboarding/logic/onboarding-calculator";
import { generateDietPlan } from "@/actions/server/users/onboarding/logic/diet-plan-generator";
import { normalizeSelectedFoods } from "@/actions/server/users/onboarding/logic/food-preferences";
import { resolveMealPlanTargets } from "@/actions/server/users/onboarding/logic/meal-plan-targets";
import { prisma } from "@/actions/server/users/prisma";

export const runtime = "nodejs";

export async function POST() {
  try {
    const auth = await requireApiSessionUser();
    if (!auth.ok) {
      return auth.response;
    }

    const user = await prisma.usuario.findUnique({
      where: { id: auth.user.userId },
      select: {
        nombre: true,
        apellido: true,
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
      !user?.fecha_nacimiento ||
      !user.altura_cm ||
      !user.peso_kg ||
      !user.peso_objetivo_kg ||
      !user.objetivo ||
      !user.nivel_actividad ||
      !user.velocidad_cambio ||
      !user.tipo_entrenamiento ||
      !user.nivel_experiencia ||
      user.frecuencia_entreno === null ||
      user.anos_entrenando === null
    ) {
      return Response.json(
        { ok: false, error: "Completa metricas y entrenamiento antes de generar dieta." },
        { status: 400 }
      );
    }

    const targets = resolveMealPlanTargets({
      fechaNacimiento: user.fecha_nacimiento,
      sexo: user.sexo,
      alturaCm: user.altura_cm,
      pesoKg: user.peso_kg,
      pesoObjetivoKg: user.peso_objetivo_kg,
      objetivo: user.objetivo,
      nivelActividad: user.nivel_actividad,
      velocidadCambio: user.velocidad_cambio,
      tipoEntrenamiento: user.tipo_entrenamiento,
      nivelExperiencia: user.nivel_experiencia,
      frecuenciaEntreno: user.frecuencia_entreno,
      anosEntrenando: user.anos_entrenando,
      kcalObjetivo: user.kcal_objetivo,
      proteinasG: user.proteinas_g_obj,
      grasasG: user.grasas_g_obj,
      carbohidratosG: user.carbohidratos_g_obj,
      aguaLitros: user.agua_litros_obj,
      etaSemanas: user.objetivo_eta_semanas,
      etaFecha: user.objetivo_eta_fecha,
    });
    const selectedPreferences = normalizeSelectedFoods(user.preferencias_alimentos);

    const generation = await generateDietPlan({
      userName: `${user.nombre} ${user.apellido}`,
      objetivo: user.objetivo,
      nivelActividad: user.nivel_actividad,
      velocidadCambio: user.velocidad_cambio,
      targets,
      preferencias: selectedPreferences,
      diasDieta: [...onboardingDays],
    });
    const pdfPayload = buildNutritionPdfPayload({
      userName: `${user.nombre} ${user.apellido}`,
      summary: {
        objetivo: user.objetivo,
        imc: user.progreso[0]?.imc ?? null,
        edad: calculateAge(user.fecha_nacimiento),
        sexo: user.sexo,
        alturaCm: user.altura_cm,
        pesoKg: user.peso_kg,
        pesoObjetivoKg: user.peso_objetivo_kg,
        nivelActividad: user.nivel_actividad,
        velocidadCambio: user.velocidad_cambio,
        tipoEntrenamiento: user.tipo_entrenamiento,
        nivelExperiencia: user.nivel_experiencia,
        frecuenciaEntreno: user.frecuencia_entreno,
        anosEntrenando: user.anos_entrenando,
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
        advertencias: generation.warning ? [generation.warning] : [],
        caloriasObjetivoTotal: targets.kcalObjetivo,
      },
      weeklyPlan: generation.days,
    });

    return Response.json({
      ok: true,
      data: {
        targets,
        plan: generation.days,
        pdfPayload,
        model: generation.model,
        source: generation.source,
        warning: generation.warning ?? null,
      },
    });
  } catch (error) {
    console.error("Error al generar dieta IA", error);
    return Response.json(
      { ok: false, error: "No se pudo generar la dieta en este momento." },
      { status: 500 }
    );
  }
}
