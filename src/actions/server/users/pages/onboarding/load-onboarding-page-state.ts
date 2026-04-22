import { requireSessionAppUser } from "@/actions/server/users/auth";
import { redirectToLogin, redirectToUsers } from "@/actions/server/users/navigation";
import {
  createEmptyFoodsDraft,
  getAllowedFoodsByCategory,
  onboardingDays,
  requiredFoodCategories,
} from "@/actions/server/users/onboarding/constants";
import type {
  ActivityValue,
  FoodsDraft,
  GenderValue,
  MetricsDraft,
  TrainingDraft,
  WizardStep,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { prisma } from "@/actions/server/users/prisma";
import { getSuggestedTargetWeightKg } from "@/lib/nutrition/weight-guidance";
import { normalizeTrainingDraft } from "@/actions/server/users/onboarding/logic/training-form-domain";
import { isFoodsDraftComplete } from "@/actions/server/users/onboarding/constants/food-selection";

export type OnboardingPageState = {
  userName: string;
  initialStep: WizardStep;
  initialMetrics: MetricsDraft;
  initialTraining: TrainingDraft;
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
  return value ?? "Moderado";
}

function normalizeGender(value: string | null | undefined): GenderValue {
  if (typeof value === "string" && value.trim().toLowerCase().startsWith("f")) {
    return "Femenino";
  }

  return "Masculino";
}

type StoredMetricsSnapshot = {
  nombre: string | null;
  apellido: string | null;
  fecha_nacimiento: Date | null;
  sexo: string | null;
  altura_cm: number | null;
  peso_kg: number | null;
  peso_objetivo_kg: number | null;
  objetivo: MetricsDraft["objetivo"] | null;
  nivel_actividad: MetricsDraft["nivelActividad"] | null;
  velocidad_cambio: MetricsDraft["velocidadCambio"] | null;
};

type StoredTrainingSnapshot = {
  nivel_actividad: string | null;
  tipo_entrenamiento: string | null;
  frecuencia_entreno: number | null;
  anos_entrenando: number | null;
};

function isMetricsComplete(value: StoredMetricsSnapshot): boolean {
  if (
    !value.nombre ||
    !value.apellido ||
    !value.fecha_nacimiento ||
    !value.sexo ||
    !value.altura_cm ||
    !value.peso_kg ||
    !value.peso_objetivo_kg ||
    !value.objetivo ||
    !value.nivel_actividad ||
    !value.velocidad_cambio
  ) {
    return false;
  }

  const birthDate = new Date(value.fecha_nacimiento);

  return (
    value.nombre.trim().length >= 2 &&
    value.apellido.trim().length >= 2 &&
    !Number.isNaN(birthDate.getTime()) &&
    value.altura_cm >= 120 &&
    value.altura_cm <= 230 &&
    value.peso_kg >= 35 &&
    value.peso_kg <= 250 &&
    value.peso_objetivo_kg >= 35 &&
    value.peso_objetivo_kg <= 250 &&
    (value.objetivo !== "Bajar_grasa" || value.peso_objetivo_kg < value.peso_kg) &&
    (value.objetivo !== "Ganar_musculo" || value.peso_objetivo_kg > value.peso_kg)
  );
}

function isTrainingComplete(value: StoredTrainingSnapshot): boolean {
  if (
    !value.nivel_actividad ||
    !value.tipo_entrenamiento ||
    value.frecuencia_entreno === null ||
    value.anos_entrenando === null
  ) {
    return false;
  }

  if (value.tipo_entrenamiento === "No_entrena") {
    return value.frecuencia_entreno === 0 && value.anos_entrenando === 0;
  }

  return value.frecuencia_entreno >= 1 && value.frecuencia_entreno <= 7 && value.anos_entrenando >= 0;
}

function getInitialStep(
  metrics: StoredMetricsSnapshot,
  training: StoredTrainingSnapshot,
  foods: FoodsDraft,
  step: string | null
): WizardStep {
  if (!isMetricsComplete(metrics)) {
    return "metrics";
  }

  if (step === "training") {
    return "training";
  }

  if (step === "foods") {
    return isTrainingComplete(training) ? "foods" : "training";
  }

  if (step === "summary") {
    if (!isTrainingComplete(training)) {
      return "training";
    }

    return isFoodsDraftComplete(foods) ? "summary" : "foods";
  }

  if (!isTrainingComplete(training)) {
    return "training";
  }

  if (!isFoodsDraftComplete(foods)) {
    return "foods";
  }

  return "summary";
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
      tipo_entrenamiento: true,
      nivel_experiencia: true,
      frecuencia_entreno: true,
      anos_entrenando: true,
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

  const initialTraining = normalizeTrainingDraft({
    nivel_actividad: userRecord.nivel_actividad,
    tipo_entrenamiento: userRecord.tipo_entrenamiento,
    frecuencia_entreno: userRecord.frecuencia_entreno,
    anos_entrenando: userRecord.anos_entrenando,
  });

  const initialFoods = normalizeFoodsDraft(
    userRecord.preferencias_alimentos,
    userRecord.dias_dieta
  );

  return {
    userName: `${userRecord.nombre} ${userRecord.apellido}`,
    initialStep: getInitialStep(userRecord, userRecord, initialFoods, userRecord.onboarding_step),
    initialMetrics,
    initialTraining,
    initialFoods,
  };
}
