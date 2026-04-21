import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/actions/server/users/prisma";
import { verifyPassword } from "@/actions/server/users/auth/security/password";

type GoogleNameParts = {
  firstName: string;
  lastName: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseGoogleName(displayName?: string | null): GoogleNameParts {
  const safeName = displayName?.trim() || "Usuario";
  const parts = safeName.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "Usuario",
      lastName: "FitBalance",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function buildInitialUserData(displayName?: string | null) {
  const { firstName, lastName } = parseGoogleName(displayName);

  return {
    nombre: firstName,
    apellido: lastName,
    fecha_nacimiento: new Date("2000-01-01T00:00:00.000Z"),
    sexo: "No especificado",
    pais: "Bolivia",
    terminos_aceptados: true,
    onboarding_completed: false,
    onboarding_step: "metrics",
  };
}

const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "missing-google-client-id";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "missing-google-client-secret";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/users/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailInput =
          typeof credentials?.email === "string" ? normalizeEmail(credentials.email) : "";
        const passwordInput =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!emailInput || !passwordInput) {
          return null;
        }

        const authRecord = await prisma.auth.findUnique({
          where: { email: emailInput },
          select: {
            id: true,
            email: true,
            usuarioId: true,
            verificado: true,
            password_hash: true,
            usuario: {
              select: {
                nombre: true,
                apellido: true,
              },
            },
          },
        });

        if (!authRecord || authRecord.password_hash === "google-oauth-only") {
          return null;
        }

        if (!authRecord.verificado) {
          return null;
        }

        const isValidPassword = verifyPassword(passwordInput, authRecord.password_hash);
        if (!isValidPassword) {
          return null;
        }

        await prisma.auth.update({
          where: { id: authRecord.id },
          data: {
            last_login: new Date(),
          },
        });

        return {
          id: String(authRecord.usuarioId),
          email: authRecord.email,
          name: `${authRecord.usuario?.nombre ?? ""} ${authRecord.usuario?.apellido ?? ""}`.trim(),
        };
      },
    }),
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") {
        return true;
      }

      if (account?.provider !== "google") {
        return false;
      }

      if (!user.email) {
        return false;
      }

      const normalizedEmail = normalizeEmail(user.email);

      try {
        const existing = await prisma.auth.findUnique({
          where: { email: normalizedEmail },
          select: { id: true },
        });

        if (!existing) {
          await prisma.usuario.create({
            data: {
              ...buildInitialUserData(user.name),
              auth: {
                create: {
                  email: normalizedEmail,
                  password_hash: "google-oauth-only",
                  verificado: true,
                  token_verificacion: null,
                  token_verificacion_expira: null,
                  last_login: new Date(),
                },
              },
            },
          });
        } else {
          const name = parseGoogleName(user.name);

          await prisma.auth.update({
            where: { id: existing.id },
            data: {
              last_login: new Date(),
              verificado: true,
              token_verificacion: null,
              token_verificacion_expira: null,
              usuario: {
                update: {
                  nombre: name.firstName,
                  apellido: name.lastName,
                },
              },
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Error en callback signIn Google", error);
        return false;
      }
    },
    async jwt({ token }) {
      if (!token.email || typeof token.email !== "string") {
        return token;
      }

      const normalizedEmail = normalizeEmail(token.email);

      const authRecord = await prisma.auth.findUnique({
        where: { email: normalizedEmail },
        select: {
          usuarioId: true,
          usuario: {
            select: {
              onboarding_completed: true,
              onboarding_step: true,
              nombre: true,
              apellido: true,
              pais: true,
            },
          },
        },
      });

      if (!authRecord?.usuario) {
        return token;
      }

      token.userId = authRecord.usuarioId;
      token.onboardingCompleted = authRecord.usuario.onboarding_completed;
      token.onboardingStep = authRecord.usuario.onboarding_step;
      token.nombre = authRecord.usuario.nombre;
      token.apellido = authRecord.usuario.apellido;
      token.pais = authRecord.usuario.pais;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId ? String(token.userId) : undefined;
        session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
        session.user.onboardingStep =
          typeof token.onboardingStep === "string" ? token.onboardingStep : null;
        session.user.nombre = typeof token.nombre === "string" ? token.nombre : "";
        session.user.apellido = typeof token.apellido === "string" ? token.apellido : "";
        session.user.pais = typeof token.pais === "string" ? token.pais : null;
      }

      return session;
    },
  },
};

