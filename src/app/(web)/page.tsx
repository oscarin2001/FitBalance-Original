import Link from "next/link";

import { loadHomePageState } from "@/actions/server/users/pages";
import { LogoutForm } from "@/components/users/login";

export default async function Home() {
  const { sessionUser } = await loadHomePageState();

  return (
    <main className="relative min-h-svh overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-14 size-72 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute right-0 top-1/3 size-72 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-md gap-4 p-4 pb-8 pt-10">
        <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">FitBalance</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Plataforma nutricional mobile-first con login Google, onboarding por metricas y plan inicial IA.
          </p>

          {sessionUser ? (
            <div className="mt-5 grid gap-3">
              <p className="text-sm text-slate-700">
                Sesion activa: {sessionUser.nombre} {sessionUser.apellido}
              </p>
              <Link
                href="/users"
                className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Ir a users
              </Link>
              <LogoutForm />
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              <Link
                href="/users/login"
                className="rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Iniciar sesion con Google
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

