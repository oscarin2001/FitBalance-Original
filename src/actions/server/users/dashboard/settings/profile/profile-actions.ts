"use server";

import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { prisma } from "@/actions/server/users/prisma";
import { deriveExperienceLevelFromYears } from "@/actions/server/users/onboarding/logic/training-form-domain";
import { buildActionError, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";

import type { DashboardProfileUpdateInput } from "./types";

type TipoEntrenamiento = "Musculacion" | "Cardio" | "Mixto" | "No_entrena";

type DashboardProfileUpdateData = Parameters<typeof prisma.usuario.update>[0]["data"];

const nameSchema = z.string().trim().min(2).max(50).regex(/^[A-Za-zÀ-ÿ' -]+$/);

const updateSchema = z.discriminatedUnion("field", [
  z.object({ field: z.literal("nombre"), value: nameSchema }),
  z.object({ field: z.literal("apellido"), value: nameSchema }),
  z.object({ field: z.literal("sexo"), value: z.enum(["Masculino", "Femenino"]) }),
  z.object({
    field: z.literal("fechaNacimiento"),
    value: z.string().min(10).refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), "Fecha invalida."),
  }),
  z.object({ field: z.literal("alturaCm"), value: z.number().min(120).max(230) }),
  z.object({ field: z.literal("pesoKg"), value: z.number().min(35).max(250) }),
  z.object({ field: z.literal("tipoEntrenamiento"), value: z.enum(["Musculacion", "Cardio", "Mixto", "No_entrena"]) }),
  z.object({ field: z.literal("frecuenciaEntreno"), value: z.number().int().min(0).max(7) }),
  z.object({ field: z.literal("anosEntrenando"), value: z.number().min(0).max(60) }),
]);

function buildUpdateData(input: DashboardProfileUpdateInput): DashboardProfileUpdateData {
  switch (input.field) {
    case "nombre":
      return { nombre: input.value };
    case "apellido":
      return { apellido: input.value };
    case "sexo":
      return { sexo: input.value };
    case "fechaNacimiento":
      return { fecha_nacimiento: new Date(`${input.value}T00:00:00.000Z`) };
    case "alturaCm":
      return { altura_cm: input.value };
    case "pesoKg":
      return { peso_kg: input.value };
    case "tipoEntrenamiento":
      return input.value === "No_entrena"
        ? { tipo_entrenamiento: input.value, frecuencia_entreno: 0, anos_entrenando: 0, nivel_experiencia: deriveExperienceLevelFromYears(0) }
        : { tipo_entrenamiento: input.value };
    case "frecuenciaEntreno":
      return { frecuencia_entreno: input.value };
    case "anosEntrenando":
      return { anos_entrenando: input.value, nivel_experiencia: deriveExperienceLevelFromYears(input.value) };
  }
}

export async function updateDashboardProfileAction(input: DashboardProfileUpdateInput): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Perfil invalido.");
  }

  await prisma.usuario.update({
    where: { id: sessionUser.userId },
    data: buildUpdateData(parsed.data),
  });

  return { ok: true, message: "Perfil actualizado." };
}