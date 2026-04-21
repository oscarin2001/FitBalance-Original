import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id?: string;
      onboardingCompleted?: boolean;
      onboardingStep?: string | null;
      nombre?: string;
      apellido?: string;
      pais?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId?: number;
    onboardingCompleted?: boolean;
    onboardingStep?: string | null;
    nombre?: string;
    apellido?: string;
    pais?: string | null;
  }
}

export {};
