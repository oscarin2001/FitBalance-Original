import Link from "next/link";

import { verifyEmailToken } from "@/actions/server/users/auth/email-auth-service";
import { AuthShell } from "@/components/users/auth";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  const result = token
    ? await verifyEmailToken(token)
    : { ok: false, error: "Token de verificacion faltante." };

  return (
    <AuthShell>
      <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
        <header className="grid gap-1">
          <h1 className="text-xl font-semibold">Verificacion de correo</h1>
          <p className="text-sm text-slate-600">
            {result.ok
              ? result.message
              : result.error ?? "No pudimos verificar tu correo en este momento."}
          </p>
        </header>

        <Link
          href="/users/login"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Ir a login
        </Link>
      </section>
    </AuthShell>
  );
}