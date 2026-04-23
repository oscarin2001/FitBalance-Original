"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";

import { getSessionAppUser } from "@/actions/server/users/auth";
import { sendVerificationEmail } from "@/actions/server/users/auth/mailer";
import { hashPassword, verifyPassword } from "@/actions/server/users/auth/security/password";
import { generateRawToken, hashToken } from "@/actions/server/users/auth/security/token";
import { prisma } from "@/actions/server/users/prisma";
import { buildActionError, type ActionResult } from "@/actions/server/users/onboarding/validation/onboarding-validation";

import type {
  DeleteAccountInput,
  ResetAccountInput,
  UpdateAccountEmailInput,
  UpdateAccountPasswordInput,
} from "./types";

const verificationTokenTtlMs = 1000 * 60 * 60 * 24;

const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "La password debe incluir mayuscula, minuscula y numero.",
  });

const updateEmailSchema = z.object({
  email: z.string().trim().email().max(120),
  currentPassword: passwordSchema,
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().trim().max(72).optional().default(""),
    newPassword: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    message: "Las contrasenas no coinciden.",
    path: ["confirmPassword"],
  });

const resetAccountSchema = z.object({
  confirmation: z.string().trim().transform((value) => value.toUpperCase()),
});

const deleteAccountSchema = z.object({
  currentPassword: z.string().trim().max(72).optional().default(""),
  confirmation: z.string().trim().transform((value) => value.toUpperCase()),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function loadCurrentAuthRecord(sessionUserId: number) {
  return prisma.auth.findUnique({
    where: { usuarioId: sessionUserId },
    select: {
      id: true,
      email: true,
      password_hash: true,
      verificado: true,
      token_verificacion: true,
      token_verificacion_expira: true,
    },
  });
}

async function requireSessionUser() {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return { ok: false as const, error: buildActionError("Tu sesion expiro. Inicia sesion nuevamente.") };
  }

  return { ok: true as const, sessionUser };
}

export async function updateAccountEmailAction(input: UpdateAccountEmailInput): Promise<ActionResult> {
  const parsed = updateEmailSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Correo invalido.");
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const authRecord = await loadCurrentAuthRecord(sessionResult.sessionUser.userId);

  if (!authRecord) {
    return buildActionError("No encontramos tu cuenta.");
  }

  if (authRecord.password_hash === "google-oauth-only") {
    return buildActionError("Esta cuenta usa Google. Cambia el correo desde Google o crea una contrasena primero.");
  }

  if (!verifyPassword(parsed.data.currentPassword, authRecord.password_hash)) {
    return buildActionError("La contrasena actual no es correcta.");
  }

  const nextEmail = normalizeEmail(parsed.data.email);

  if (nextEmail === authRecord.email) {
    return buildActionError("Ese ya es tu correo actual.");
  }

  const emailInUse = await prisma.auth.findUnique({
    where: { email: nextEmail },
    select: { id: true },
  });

  if (emailInUse) {
    return buildActionError("Ese correo ya esta en uso.");
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const tokenExpiresAt = new Date(Date.now() + verificationTokenTtlMs);

  await prisma.auth.update({
    where: { id: authRecord.id },
    data: {
      email: nextEmail,
      verificado: false,
      token_verificacion: tokenHash,
      token_verificacion_expira: tokenExpiresAt,
      reset_token: null,
    },
  });

  try {
    const mailResult = await sendVerificationEmail({
      email: nextEmail,
      firstName: sessionResult.sessionUser.nombre,
      token: rawToken,
    });

    return {
      ok: true,
      message: mailResult.delivered
        ? "Correo actualizado. Revisa el nuevo email para verificar el cambio y vuelve a iniciar sesion."
        : "Correo actualizado. Revisa el enlace temporal de verificacion en consola y vuelve a iniciar sesion.",
    };
  } catch (error) {
    console.error("Error enviando verificacion de cambio de correo", error);

    await prisma.auth.update({
      where: { id: authRecord.id },
      data: {
        email: authRecord.email,
        verificado: authRecord.verificado,
        token_verificacion: authRecord.token_verificacion,
        token_verificacion_expira: authRecord.token_verificacion_expira,
      },
    });

    return buildActionError("No se pudo enviar la verificacion. El correo no se actualizo.");
  }
}

export async function updateAccountPasswordAction(
  input: UpdateAccountPasswordInput
): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Contrasena invalida.");
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const authRecord = await loadCurrentAuthRecord(sessionResult.sessionUser.userId);

  if (!authRecord) {
    return buildActionError("No encontramos tu cuenta.");
  }

  if (authRecord.password_hash !== "google-oauth-only" && !verifyPassword(parsed.data.currentPassword, authRecord.password_hash)) {
    return buildActionError("La contrasena actual no es correcta.");
  }

  await prisma.auth.update({
    where: { id: authRecord.id },
    data: {
      password_hash: hashPassword(parsed.data.newPassword),
      reset_token: null,
    },
  });

  return {
    ok: true,
    message: "Contrasena actualizada.",
  };
}

export async function resetAccountAction(input: ResetAccountInput): Promise<ActionResult> {
  const parsed = resetAccountSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Confirmacion invalida.");
  }

  if (parsed.data.confirmation !== "RESTABLECER") {
    return buildActionError('Escribe "RESTABLECER" para continuar.');
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.comida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.planComida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.cumplimientoComida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.cumplimientoDieta.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.hidratacionDia.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.progresoCorporal.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.usuarioAlimento.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.usuarioBebida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });

    await transaction.usuario.update({
      where: { id: sessionResult.sessionUser.userId },
      data: {
        objetivo: null,
        nivel_actividad: null,
        peso_objetivo_kg: null,
        velocidad_cambio: null,
        tipo_entrenamiento: null,
        nivel_experiencia: null,
        frecuencia_entreno: null,
        anos_entrenando: null,
        kcal_objetivo: null,
        proteinas_g_obj: null,
        grasas_g_obj: null,
        carbohidratos_g_obj: null,
        agua_litros_obj: null,
        objetivo_eta_semanas: null,
        objetivo_eta_fecha: null,
        plan_ai: Prisma.DbNull,
        preferencias_alimentos: Prisma.DbNull,
        measurement_interval_weeks: null,
        dias_dieta: Prisma.DbNull,
        onboarding_completed: false,
        onboarding_step: "metrics",
      },
    });
  });

  return {
    ok: true,
    message: "Cuenta restablecida. Vuelve a completar el onboarding.",
  };
}

export async function deleteAccountAction(input: DeleteAccountInput): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);

  if (!parsed.success) {
    return buildActionError(parsed.error.issues[0]?.message ?? "Confirmacion invalida.");
  }

  if (parsed.data.confirmation !== "ELIMINAR") {
    return buildActionError('Escribe "ELIMINAR" para continuar.');
  }

  const sessionResult = await requireSessionUser();
  if (!sessionResult.ok) {
    return sessionResult.error;
  }

  const authRecord = await loadCurrentAuthRecord(sessionResult.sessionUser.userId);

  if (!authRecord) {
    return buildActionError("No encontramos tu cuenta.");
  }

  if (authRecord.password_hash !== "google-oauth-only" && !verifyPassword(parsed.data.currentPassword, authRecord.password_hash)) {
    return buildActionError("La contrasena actual no es correcta.");
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.comida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.planComida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.cumplimientoComida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.cumplimientoDieta.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.hidratacionDia.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.progresoCorporal.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.usuarioAlimento.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });
    await transaction.usuarioBebida.deleteMany({ where: { usuarioId: sessionResult.sessionUser.userId } });

    await transaction.auth.delete({ where: { id: authRecord.id } });
    await transaction.usuario.delete({ where: { id: sessionResult.sessionUser.userId } });
  });

  return {
    ok: true,
    message: "Cuenta eliminada.",
  };
}