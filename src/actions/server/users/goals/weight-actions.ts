"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSessionAppUser } from "@/actions/server/users/auth/guards/session-guards";
import { prisma } from "@/actions/server/users/prisma";
import { buildActionError, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";

const addWeightEntrySchema = z.object({
  recordedAtIso: z
    .string()
    .trim()
    .min(10)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Fecha invalida."),
  weightKg: z.number().min(35).max(250),
});

const updateWeightEntrySchema = z.object({
  id: z.number().int().positive(),
  recordedAtIso: z
    .string()
    .trim()
    .min(10)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), "Fecha invalida."),
  weightKg: z.number().min(35).max(250),
});

const deleteWeightEntrySchema = z.object({
  id: z.number().int().positive(),
});

export type AddGoalWeightEntryInput = z.infer<typeof addWeightEntrySchema>;
export type UpdateGoalWeightEntryInput = z.infer<typeof updateWeightEntrySchema>;
export type DeleteGoalWeightEntryInput = z.infer<typeof deleteWeightEntrySchema>;

async function syncLatestWeightToProfile(userId: number) {
  const latestProgress = await prisma.progresoCorporal.findFirst({
    where: {
      usuarioId: userId,
      peso_kg: {
        not: null,
      },
    },
    orderBy: {
      fecha: "desc",
    },
    select: {
      peso_kg: true,
    },
  });

  await prisma.usuario.update({
    where: { id: userId },
    data: {
      peso_kg: latestProgress?.peso_kg ?? null,
    },
  });
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

export async function addGoalWeightEntryAction(input: AddGoalWeightEntryInput): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = addWeightEntrySchema.safeParse(input);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
  }

  const recordedAt = new Date(parsed.data.recordedAtIso);
  if (Number.isNaN(recordedAt.getTime())) {
    return buildActionError("Fecha invalida.");
  }

  const existingRecord = await prisma.progresoCorporal.findFirst({
    where: {
      usuarioId: sessionUser.userId,
      fecha: recordedAt,
    },
    select: {
      id: true,
    },
  });

  if (existingRecord) {
    await prisma.progresoCorporal.update({
      where: { id: existingRecord.id },
      data: {
        fecha: recordedAt,
        peso_kg: parsed.data.weightKg,
        fuente: "manual",
      },
    });
  } else {
    await prisma.progresoCorporal.create({
      data: {
        usuarioId: sessionUser.userId,
        fecha: recordedAt,
        peso_kg: parsed.data.weightKg,
        fuente: "manual",
      },
    });
  }

  await syncLatestWeightToProfile(sessionUser.userId);

  revalidatePath("/users");

  return {
    ok: true,
    message: "Peso guardado.",
  };
}

export async function updateGoalWeightEntryAction(input: UpdateGoalWeightEntryInput): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = updateWeightEntrySchema.safeParse(input);
  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Datos invalidos.");
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
    select: {
      id: true,
    },
  });

  if (!entry) {
    return buildActionError("No encontramos el peso a editar.");
  }

  const conflictingEntry = await prisma.progresoCorporal.findFirst({
    where: {
      usuarioId: sessionUser.userId,
      fecha: recordedAt,
      NOT: {
        id: parsed.data.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (conflictingEntry) {
    return buildActionError("Ya existe un peso registrado en esa fecha y hora.");
  }

  await prisma.progresoCorporal.update({
    where: { id: parsed.data.id },
    data: {
      fecha: recordedAt,
      peso_kg: parsed.data.weightKg,
      fuente: "manual",
    },
  });

  await syncLatestWeightToProfile(sessionUser.userId);

  revalidatePath("/users");

  return {
    ok: true,
    message: "Peso actualizado.",
  };
}

export async function deleteGoalWeightEntryAction(input: DeleteGoalWeightEntryInput): Promise<ActionResult> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return buildActionError("Tu sesion expiro. Inicia sesion nuevamente.");
  }

  const parsed = deleteWeightEntrySchema.safeParse(input);
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
    },
  });

  if (!entry) {
    return buildActionError("No encontramos el peso a eliminar.");
  }

  await prisma.progresoCorporal.update({
    where: { id: parsed.data.id },
    data: {
      peso_kg: null,
    },
  });

  await pruneEmptyProgressRow(parsed.data.id);

  await syncLatestWeightToProfile(sessionUser.userId);

  revalidatePath("/users");

  return {
    ok: true,
    message: "Peso eliminado.",
  };
}
