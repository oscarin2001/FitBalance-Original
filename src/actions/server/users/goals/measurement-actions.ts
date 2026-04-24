"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionAppUser } from "@/actions/server/users/auth/guards/session-guards";
import { prisma } from "@/actions/server/users/prisma";
import { buildActionError, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";
import { BODY_MEASUREMENT_MAX_CM, BODY_MEASUREMENT_MIN_CM } from "@/components/users/goals/sections/goals-measurements-utils";

const bodyMeasurementSchema = z.object({
  id: z.number().int().positive().optional(),
  recordedAtIso: z
    .string()
    .trim()
    .min(10)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Fecha invalida."),
  pechoCm: z.number().min(BODY_MEASUREMENT_MIN_CM).max(BODY_MEASUREMENT_MAX_CM).nullable(),
  cinturaCm: z.number().min(BODY_MEASUREMENT_MIN_CM).max(BODY_MEASUREMENT_MAX_CM).nullable(),
  caderaCm: z.number().min(BODY_MEASUREMENT_MIN_CM).max(BODY_MEASUREMENT_MAX_CM).nullable(),
  brazoCm: z.number().min(BODY_MEASUREMENT_MIN_CM).max(BODY_MEASUREMENT_MAX_CM).nullable(),
  musloCm: z.number().min(BODY_MEASUREMENT_MIN_CM).max(BODY_MEASUREMENT_MAX_CM).nullable(),
  pantorrillaCm: z.number().min(BODY_MEASUREMENT_MIN_CM).max(BODY_MEASUREMENT_MAX_CM).nullable(),
});

const deleteBodyMeasurementSchema = z.object({
  id: z.number().int().positive(),
});

export type BodyMeasurementInput = z.infer<typeof bodyMeasurementSchema>;
export type DeleteBodyMeasurementInput = z.infer<typeof deleteBodyMeasurementSchema>;

function hasMeasurementValue(input: BodyMeasurementInput) {
  return (
    input.pechoCm !== null ||
    input.cinturaCm !== null ||
    input.caderaCm !== null ||
    input.brazoCm !== null ||
    input.musloCm !== null ||
    input.pantorrillaCm !== null
  );
}

function buildMeasurementUpdateData(input: BodyMeasurementInput) {
  return {
    fecha: new Date(input.recordedAtIso),
    pecho_cm: input.pechoCm,
    cintura_cm: input.cinturaCm,
    cadera_cm: input.caderaCm,
    brazo_cm: input.brazoCm,
    muslo_cm: input.musloCm,
    pantorrilla_cm: input.pantorrillaCm,
    fuente: "manual",
  };
}

async function pruneEmptyProgressRow(id: number) {
  const entry = await prisma.progresoCorporal.findUnique({
    where: { id },
    select: {
      peso_kg: true,
      pecho_cm: true,
      cintura_cm: true,
      cadera_cm: true,
      brazo_cm: true,
      muslo_cm: true,
      pantorrilla_cm: true,
    },
  });

  if (!entry) {
    return;
  }

  const hasRemainingData =
    entry.peso_kg !== null ||
    entry.pecho_cm !== null ||
    entry.cintura_cm !== null ||
    entry.cadera_cm !== null ||
    entry.brazo_cm !== null ||
    entry.muslo_cm !== null ||
    entry.pantorrilla_cm !== null;

  if (!hasRemainingData) {
    await prisma.progresoCorporal.delete({ where: { id } });
  }
}

export async function createBodyMeasurementAction(input: BodyMeasurementInput): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = bodyMeasurementSchema.safeParse(input);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  if (!hasMeasurementValue(parsed.data)) {
    return buildActionError("Ingresa al menos una medida.");
  }

  const recordedAt = new Date(parsed.data.recordedAtIso);
  if (Number.isNaN(recordedAt.getTime())) {
    return buildActionError("Fecha invalida.");
  }

  const existingEntry = await prisma.progresoCorporal.findFirst({
    where: {
      usuarioId: sessionUser.userId,
      fecha: recordedAt,
    },
    select: {
      id: true,
    },
  });

  if (existingEntry) {
    await prisma.progresoCorporal.update({
      where: { id: existingEntry.id },
      data: buildMeasurementUpdateData(parsed.data),
    });
  } else {
    await prisma.progresoCorporal.create({
      data: {
        usuarioId: sessionUser.userId,
        ...buildMeasurementUpdateData(parsed.data),
      },
    });
  }

  revalidatePath("/users");

  return {
    ok: true,
    message: "Medidas guardadas.",
  };
}

export async function updateBodyMeasurementAction(input: BodyMeasurementInput): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = bodyMeasurementSchema.safeParse(input);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  if (!parsed.data.id) {
    return buildActionError("Datos invalidos.");
  }

  if (!hasMeasurementValue(parsed.data)) {
    return buildActionError("Ingresa al menos una medida.");
  }

  const recordedAt = new Date(parsed.data.recordedAtIso);
  if (Number.isNaN(recordedAt.getTime())) {
    return buildActionError("Fecha invalida.");
  }

  const entry = await prisma.progresoCorporal.findFirst({
    where: {
      id: parsed.data.id,
      usuarioId: sessionUser.userId,
    },
    select: { id: true },
  });

  if (!entry) {
    return buildActionError("No encontramos las medidas a editar.");
  }

  await prisma.progresoCorporal.update({
    where: { id: parsed.data.id },
    data: buildMeasurementUpdateData(parsed.data),
  });

  revalidatePath("/users");

  return {
    ok: true,
    message: "Medidas actualizadas.",
  };
}

export async function deleteBodyMeasurementAction(input: DeleteBodyMeasurementInput): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = deleteBodyMeasurementSchema.safeParse(input);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const entry = await prisma.progresoCorporal.findFirst({
    where: {
      id: parsed.data.id,
      usuarioId: sessionUser.userId,
    },
    select: {
      id: true,
      peso_kg: true,
    },
  });

  if (!entry) {
    return buildActionError("No encontramos las medidas a eliminar.");
  }

  await prisma.progresoCorporal.update({
    where: { id: parsed.data.id },
    data: {
      pecho_cm: null,
      cintura_cm: null,
      cadera_cm: null,
      brazo_cm: null,
      muslo_cm: null,
      pantorrilla_cm: null,
    },
  });

  await pruneEmptyProgressRow(parsed.data.id);
  revalidatePath("/users");

  return {
    ok: true,
    message: "Medidas eliminadas.",
  };
}
