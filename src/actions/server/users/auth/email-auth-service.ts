import { z } from "zod";

import { sendVerificationEmail } from "@/actions/server/users/auth/mailer";
import { prisma } from "@/actions/server/users/prisma";
import { hashPassword } from "@/actions/server/users/auth/security/password";
import { generateRawToken, hashToken } from "@/actions/server/users/auth/security/token";

import type { EmailAuthResult } from "./types";

const verificationTokenTtlMs = 1000 * 60 * 60 * 24;

const registerSchema = z.object({
  nombre: z.string().trim().min(2).max(60),
  apellido: z.string().trim().min(2).max(60),
  email: z.string().trim().email().max(120),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
      message: "La password debe incluir mayuscula, minuscula y numero.",
    }),
});

const verifyTokenSchema = z.string().trim().min(32).max(256);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildInitialUserData(nombre: string, apellido: string) {
  return {
    nombre,
    apellido,
    fecha_nacimiento: new Date("2000-01-01T00:00:00.000Z"),
    sexo: "No especificado",
    pais: "Bolivia",
    terminos_aceptados: true,
    onboarding_completed: false,
    onboarding_step: "metrics",
  };
}

export async function registerWithEmail(input: unknown): Promise<EmailAuthResult> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message;
    return {
      ok: false,
      error: firstIssue ?? "Datos de registro invalidos.",
    };
  }

  const normalizedEmail = normalizeEmail(parsed.data.email);
  const passwordHash = hashPassword(parsed.data.password);
  const rawVerificationToken = generateRawToken();
  const verificationTokenHash = hashToken(rawVerificationToken);
  const verificationExpiresAt = new Date(Date.now() + verificationTokenTtlMs);

  const existingAuth = await prisma.auth.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      verificado: true,
      password_hash: true,
    },
  });

  if (existingAuth?.verificado && existingAuth.password_hash === "google-oauth-only") {
    return {
      ok: false,
      error: "Este correo ya usa acceso con Google. Continua con Google.",
    };
  }

  if (existingAuth?.verificado) {
    return {
      ok: false,
      error: "Este correo ya tiene cuenta activa. Inicia sesion.",
    };
  }

  if (!existingAuth) {
    await prisma.usuario.create({
      data: {
        ...buildInitialUserData(parsed.data.nombre, parsed.data.apellido),
        auth: {
          create: {
            email: normalizedEmail,
            password_hash: passwordHash,
            verificado: false,
            token_verificacion: verificationTokenHash,
            token_verificacion_expira: verificationExpiresAt,
            reset_token: null,
            last_login: null,
          },
        },
      },
    });
  } else {
    await prisma.auth.update({
      where: { id: existingAuth.id },
      data: {
        password_hash: passwordHash,
        verificado: false,
        token_verificacion: verificationTokenHash,
        token_verificacion_expira: verificationExpiresAt,
        reset_token: null,
        usuario: {
          update: {
            nombre: parsed.data.nombre,
            apellido: parsed.data.apellido,
          },
        },
      },
    });
  }

  try {
    const mailResult = await sendVerificationEmail({
      email: normalizedEmail,
      firstName: parsed.data.nombre,
      token: rawVerificationToken,
    });

    return {
      ok: true,
      message: mailResult.delivered
        ? "Cuenta creada. Revisa tu correo para verificar tu acceso."
        : "Cuenta creada. SMTP no configurado, usa el enlace temporal de verificacion.",
      devVerificationUrl: mailResult.previewUrl,
    };
  } catch (error) {
    console.error("Error enviando correo de verificacion", error);
    return {
      ok: false,
      error:
        "La cuenta se creo, pero no se pudo enviar el correo de verificacion. Intenta registrarte otra vez.",
    };
  }
}

export async function verifyEmailToken(token: string): Promise<EmailAuthResult> {
  const parsedToken = verifyTokenSchema.safeParse(token);

  if (!parsedToken.success) {
    return {
      ok: false,
      error: "Token de verificacion invalido.",
    };
  }

  const tokenHash = hashToken(parsedToken.data);

  const authRecord = await prisma.auth.findFirst({
    where: {
      token_verificacion: tokenHash,
    },
    select: {
      id: true,
      verificado: true,
      token_verificacion_expira: true,
    },
  });

  if (!authRecord) {
    return {
      ok: false,
      error: "Token no encontrado o ya utilizado.",
    };
  }

  if (
    authRecord.token_verificacion_expira &&
    authRecord.token_verificacion_expira.getTime() < Date.now()
  ) {
    return {
      ok: false,
      error: "El enlace expiro. Registra de nuevo para generar otro.",
    };
  }

  if (authRecord.verificado) {
    return {
      ok: true,
      message: "Tu correo ya estaba verificado. Puedes iniciar sesion.",
    };
  }

  await prisma.auth.update({
    where: { id: authRecord.id },
    data: {
      verificado: true,
      token_verificacion: null,
      token_verificacion_expira: null,
    },
  });

  return {
    ok: true,
    message: "Correo verificado. Ya puedes iniciar sesion con email y password.",
  };
}
