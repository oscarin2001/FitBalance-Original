import { Prisma } from "@prisma/client";

import { prisma } from "@/actions/server/users/prisma";
import {
  formatWeekdayLabel,
  getDateKeyDifference,
  parseDateKey,
  shiftDateKey,
  toDateKey,
} from "@/lib/date-labels";

import type {
  CreateUserInput,
  UpdateUserInput,
  UserNutritionPlan,
  UserNutritionPlanDay,
  UserNutritionPlanMeal,
} from "../types/users-types";

const userListSelect = Prisma.validator<Prisma.UsuarioSelect>()({
  id: true,
  nombre: true,
  apellido: true,
  pais: true,
  objetivo: true,
  fecha_creacion: true,
});

const userDetailSelect = Prisma.validator<Prisma.UsuarioSelect>()({
  id: true,
  nombre: true,
  apellido: true,
  fecha_nacimiento: true,
  sexo: true,
  altura_cm: true,
  peso_kg: true,
  objetivo: true,
  nivel_actividad: true,
  tipo_entrenamiento: true,
  nivel_experiencia: true,
  frecuencia_entreno: true,
  anos_entrenando: true,
  pais: true,
  peso_objetivo_kg: true,
  velocidad_cambio: true,
  terminos_aceptados: true,
  fecha_creacion: true,
  updatedAt: true,
  plan_ai: true,
});

function isRecord(value: Prisma.JsonValue | Record<string, unknown> | null | undefined): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseNutritionPlanMeal(meal: Record<string, unknown>): UserNutritionPlanMeal | null {
  const mealType = getString(meal.tipo);
  const recipeName = getString(meal.nombrePlatillo);
  const foods = Array.isArray(meal.alimentos)
    ? meal.alimentos.filter((food): food is string => typeof food === "string")
    : [];

  if (!mealType || !recipeName) {
    return null;
  }

  return {
    mealType: mealType as UserNutritionPlanMeal["mealType"],
    recipeName,
    foods,
  };
}

function parseNutritionPlanDay(day: Record<string, unknown>): UserNutritionPlanDay | null {
  const dayLabel = getString(day.dia);
  const dateIso = getString(day.fechaIso);
  const meals = Array.isArray(day.comidas)
    ? day.comidas
        .filter(isRecord)
        .map(parseNutritionPlanMeal)
        .filter((meal): meal is UserNutritionPlanMeal => meal !== null)
    : [];

  if (!dayLabel || !dateIso || meals.length === 0) {
    return null;
  }

  return {
    dayLabel,
    dateIso,
    meals,
  };
}

function normalizeNutritionPlanDays(days: UserNutritionPlanDay[]): UserNutritionPlanDay[] {
  if (days.length === 0) {
    return days;
  }

  const todayKey = toDateKey(new Date());
  const dateKeys = days
    .map((day) => {
      const parsedDate = new Date(day.dateIso);
      return Number.isNaN(parsedDate.getTime()) ? null : toDateKey(parsedDate);
    })
    .filter((dateKey): dateKey is string => Boolean(dateKey))
    .sort();
  const firstDateKey = dateKeys[0];

  if (!firstDateKey) {
    return days;
  }

  const shiftDays = Math.max(getDateKeyDifference(firstDateKey, todayKey), 0);

  if (shiftDays === 0) {
    return days;
  }

  return days.map((day) => {
    const parsedDate = new Date(day.dateIso);
    const currentDateKey = Number.isNaN(parsedDate.getTime()) ? todayKey : toDateKey(parsedDate);
    const shiftedDateKey = shiftDateKey(currentDateKey, -shiftDays);
    const shiftedDate = parseDateKey(shiftedDateKey);

    return {
      ...day,
      dayLabel: formatWeekdayLabel(shiftedDate),
      dateIso: shiftedDate.toISOString(),
    };
  });
}

function parseNutritionPlan(planAi: Prisma.JsonValue | null): UserNutritionPlan | null {
  if (!isRecord(planAi)) {
    return null;
  }

  const targets = isRecord(planAi.targets) ? planAi.targets : null;
  const pdfPayload = isRecord(planAi.nutritionPdfPayload) ? planAi.nutritionPdfPayload : null;
  const user = pdfPayload && isRecord(pdfPayload.user) ? pdfPayload.user : null;
  const weeklyPlan = pdfPayload && Array.isArray(pdfPayload.weeklyPlan) ? pdfPayload.weeklyPlan : [];

  if (!pdfPayload || !user || weeklyPlan.length === 0) {
    return null;
  }

  const safePdfPayload = pdfPayload;
  const objective = getString(user.objetivo);
  const activityLevel = getString(user.nivelActividad);
  const speed = getString(user.velocidadCambio);
  const days = weeklyPlan.reduce<UserNutritionPlanDay[]>((acc, day) => {
    if (!isRecord(day)) {
      return acc;
    }

    const parsedDay = parseNutritionPlanDay(day);

    if (parsedDay) {
      acc.push(parsedDay);
    }

    return acc;
  }, []);

  if (!objective || !activityLevel || !speed || days.length === 0) {
    return null;
  }

  return {
    generatedAt: getString(safePdfPayload.generatedAt) || getString(planAi.generatedAt),
    objective: objective as UserNutritionPlan["objective"],
    imc: getNumber(user.imc),
    activityLevel: activityLevel as UserNutritionPlan["activityLevel"],
    speed: speed as UserNutritionPlan["speed"],
    formulaName: getString(targets?.formulaName) || "Mifflin-St Jeor",
    tmbKcal: getNumber(targets?.tmbKcal) ?? 0,
    gastoTotalKcal: getNumber(targets?.gastoTotalKcal) ?? 0,
    walkingFactor: getNumber(targets?.walkingFactor) ?? 1,
    trainingFactor: getNumber(targets?.trainingFactor) ?? 1,
    ajusteCaloricoPct: getNumber(targets?.ajusteCaloricoPct) ?? 0,
    ajusteCaloricoKcal: getNumber(targets?.ajusteCaloricoKcal) ?? 0,
    dailyWaterLiters: getNumber(user.aguaLitrosDiarios) ?? 0,
    targetCalories: getNumber(user.caloriasObjetivoTotal) ?? 0,
    warning: getString(planAi.warning) || null,
    days: normalizeNutritionPlanDays(days),
  };
}

export async function listUsers() {
  return prisma.usuario.findMany({
    orderBy: { fecha_creacion: "desc" },
    select: userListSelect,
  });
}

export async function getUserById(id: number) {
  const user = await prisma.usuario.findUnique({
    where: { id },
    select: userDetailSelect,
  });

  if (!user) {
    return null;
  }

  const { plan_ai, ...userDetail } = user;

  return {
    ...userDetail,
    nutritionPlan: parseNutritionPlan(plan_ai),
  };
}

export async function createUser(data: CreateUserInput) {
  return prisma.usuario.create({
    data,
    select: userDetailSelect,
  });
}

export async function updateUser(id: number, data: UpdateUserInput) {
  return prisma.usuario.update({
    where: { id },
    data,
    select: userDetailSelect,
  });
}

export async function deleteUser(id: number) {
  return prisma.usuario.delete({
    where: { id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
    },
  });
}
