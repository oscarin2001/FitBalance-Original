export type SessionAppUser = {
  userId: number;
  authId: number;
  email: string;
  nombre: string;
  apellido: string;
  pais: string | null;
  onboardingCompleted: boolean;
  onboardingStep: string | null;
};

export type SessionGuardOptions = {
  loginRedirectTo?: string;
  onboardingRedirectTo?: string;
};

export type ApiAuthResult =
  | {
      ok: true;
      user: SessionAppUser;
    }
  | {
      ok: false;
      response: Response;
    };
