import { getServerSession } from "next-auth";

import { authOptions } from "@/actions/server/users/auth/config";
import { redirectToLogin, redirectToOnboarding } from "@/actions/server/users/navigation";
import { prisma } from "@/actions/server/users/prisma";

import type { ApiAuthResult, SessionAppUser, SessionGuardOptions } from "../types";

async function findSessionUserByEmail(email: string): Promise<SessionAppUser | null> {
  const authRecord = await prisma.auth.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      usuarioId: true,
      usuario: {
        select: {
          nombre: true,
          apellido: true,
          pais: true,
          onboarding_completed: true,
          onboarding_step: true,
        },
      },
    },
  });

  if (!authRecord?.usuario) {
    return null;
  }

  return {
    userId: authRecord.usuarioId,
    authId: authRecord.id,
    email: authRecord.email,
    nombre: authRecord.usuario.nombre,
    apellido: authRecord.usuario.apellido,
    pais: authRecord.usuario.pais,
    onboardingCompleted: authRecord.usuario.onboarding_completed,
    onboardingStep: authRecord.usuario.onboarding_step,
  };
}

export async function getSessionAppUser(): Promise<SessionAppUser | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  return findSessionUserByEmail(email);
}

export async function requireSessionAppUser(
  options: SessionGuardOptions = {}
): Promise<SessionAppUser> {
  const user = await getSessionAppUser();

  if (!user) {
    redirectToLogin(options.loginRedirectTo);
  }

  return user;
}

export async function requireCompletedOnboarding(
  options: SessionGuardOptions = {}
): Promise<SessionAppUser> {
  const user = await requireSessionAppUser(options);

  if (!user.onboardingCompleted) {
    redirectToOnboarding(options.onboardingRedirectTo);
  }

  return user;
}

export async function requireApiSessionUser(
  { requireOnboardingComplete = false }: { requireOnboardingComplete?: boolean } = {}
): Promise<ApiAuthResult> {
  const user = await getSessionAppUser();

  if (!user) {
    return {
      ok: false,
      response: Response.json(
        { error: "No autenticado. Inicia sesion para continuar." },
        { status: 401 }
      ),
    };
  }

  if (requireOnboardingComplete && !user.onboardingCompleted) {
    return {
      ok: false,
      response: Response.json(
        { error: "Completa onboarding antes de usar este recurso." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

