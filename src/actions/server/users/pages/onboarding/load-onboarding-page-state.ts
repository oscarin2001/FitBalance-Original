import { requireSessionAppUser } from "@/actions/server/users/auth";
import { redirectToLogin, redirectToUsers } from "@/actions/server/users/navigation";
import {
  createEmptyFoodsDraft,
  getAllowedFoodsByCategory,
  isFoodsDraftComplete,
  onboardingDays,
  requiredFoodCategories,
} from "@/actions/server/users/onboarding/constants";
import type {
  ActivityValue,
  FoodsDraft,
  GenderValue,
  MetricsDraft,
  WizardStep,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { prisma } from "@/actions/server/users/prisma";
import { getSuggestedTargetWeightKg } from "@/lib/nutrition/weight-guidance";

export type OnboardingPageState = {
  userName: string;
  initialStep: WizardStep;
  initialMetrics: MetricsDraft;
  initialFoods: FoodsDraft;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeFoodsDraft(preferenciasRaw: unknown, diasRaw: unknown): FoodsDraft {
  const defaults = createEmptyFoodsDraft();
  const preferencias = isRecord(preferenciasRaw) ? preferenciasRaw : {};

  const normalizedPreferences = requiredFoodCategories.reduce<Record<string, string[]>>(
    (acc, category) => {
      const selectedValues = preferencias[category];
      if (Array.isArray(selectedValues)) {
        const allowedFoods = getAllowedFoodsByCategory(category);
        acc[category] = selectedValues
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .filter((item) => allowedFoods.has(item))
          .slice(0, 10);
      } else {
        acc[category] = defaults.preferencias[category] ?? [];
      }

      return acc;
    },
    {}
  );

  const normalizedDays = Array.isArray(diasRaw)
    ? diasRaw
        .filter((item): item is string => typeof item === "string")
        .filter((day) => onboardingDays.includes(day as (typeof onboardingDays)[number]))
    : defaults.diasDieta;

  const resolvedDays = normalizedDays.length > 0 ? normalizedDays : defaults.diasDieta;

  return {
    preferencias: normalizedPreferences,
    diasDieta: resolvedDays,
  };
}

function normalizeActivity(
  value: MetricsDraft["nivelActividad"] | null | undefined
): ActivityValue {
  if (value === "Extremo") {
    return "Activo";
  }

  return value ?? "Moderado";
}

function normalizeGender(value: string | null | undefined): GenderValue {
  if (typeof value === "string" && value.trim().toLowerCase().startsWith("f")) {
    return "Femenino";
  }

  return "Masculino";
}

function isMetricsComplete(value: MetricsDraft): boolean {
  const birthDate = new Date(value.fechaNacimiento);

  return (
    value.nombre.trim().length >= 2 &&
    value.apellido.trim().length >= 2 &&
    !Number.isNaN(birthDate.getTime()) &&
    value.alturaCm >= 120 &&
    value.alturaCm <= 230 &&
    value.pesoKg >= 35 &&
    value.pesoKg <= 250 &&
    value.pesoObjetivoKg >= 35 &&
    value.pesoObjetivoKg <= 250
  );
}

function isFoodsComplete(value: FoodsDraft): boolean {
  return isFoodsDraftComplete(value);
}

function getInitialStep(metrics: MetricsDraft, foods: FoodsDraft, step: string | null): WizardStep {
  if (!isMetricsComplete(metrics)) {
    return "metrics";
  }

  if (!isFoodsComplete(foods)) {
    return "foods";
  }

  return step === "summary" ? "summary" : "foods";
}

export async function loadOnboardingPageState(): Promise<OnboardingPageState> {
  const sessionUser = await requireSessionAppUser();

  if (sessionUser.onboardingCompleted) {
    redirectToUsers();
  }

  const userRecord = await prisma.usuario.findUnique({
    where: { id: sessionUser.userId },
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
      onboarding_step: true,
      preferencias_alimentos: true,
      dias_dieta: true,
    },
  });

  if (!userRecord) {
    redirectToLogin();
  }

  const initialMetrics: MetricsDraft = {
    nombre: userRecord.nombre ?? "",
    apellido: userRecord.apellido ?? "",
    fechaNacimiento: userRecord.fecha_nacimiento.toISOString().slice(0, 10),
    sexo: normalizeGender(userRecord.sexo),
    alturaCm: userRecord.altura_cm ?? 170,
    pesoKg: userRecord.peso_kg ?? 70,
    pesoObjetivoKg:
      userRecord.peso_objetivo_kg ??
      getSuggestedTargetWeightKg({
        objective: userRecord.objetivo ?? "Bajar_grasa",
        currentWeightKg: userRecord.peso_kg ?? 70,
        heightCm: userRecord.altura_cm ?? 170,
        speed: userRecord.velocidad_cambio ?? "Moderado",
      }),
    objetivo: userRecord.objetivo ?? "Bajar_grasa",
    nivelActividad: normalizeActivity(userRecord.nivel_actividad),
    velocidadCambio: userRecord.velocidad_cambio ?? "Moderado",
  };

  const initialFoods = normalizeFoodsDraft(
    userRecord.preferencias_alimentos,
    userRecord.dias_dieta
  );

  return {
    userName: `${userRecord.nombre} ${userRecord.apellido}`,
    initialStep: getInitialStep(initialMetrics, initialFoods, userRecord.onboarding_step),
    initialMetrics,
    initialFoods,
  };
}
