import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { loadHomePageState } from "@/actions/server/users/pages";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogoutForm } from "@/components/users/login";

export default async function Home() {
  const { sessionUser } = await loadHomePageState();

  return (
    <main className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_35%),linear-gradient(180deg,_#f8fff9_0%,_#effaf2_42%,_#ffffff_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-emerald-300/25 blur-3xl" />
        <div className="absolute right-[-5rem] top-24 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-emerald-700 uppercase">FitBalance</p>
              <p className="text-xs text-slate-600">Simple, claro y listo para usar</p>
            </div>
          </div>

          <Link href="/users/login" className="hidden sm:block">
            <span className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-500">
              Entrar
            </span>
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12 lg:py-12">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700 shadow-sm">
              Tu espacio para comer mejor sin complicarte
            </Badge>

            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-balance text-slate-950 sm:text-5xl lg:text-6xl">
              Un inicio bonito, fácil y pensado para tu rutina.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Entra, completa lo básico y recibe una experiencia limpia, rápida y amigable en el celular.
              Todo se ve mejor, se entiende mejor y se usa sin vueltas.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/users/login" className="w-full sm:w-auto">
                <span className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-medium text-white transition hover:bg-emerald-500 sm:w-auto">
                  Ir al acceso
                  <ArrowRight className="size-4" />
                </span>
              </Link>

              <a
                href="https://fitbalance.vercel.app/users/login"
                className="w-full rounded-full border border-emerald-200 bg-white/80 px-5 py-3 text-center text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-white sm:w-auto"
              >
                https://fitbalance.vercel.app/users/login
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-900">Rápido</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Todo se entiende de inmediato.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-900">Bonito</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Diseño limpio y cuidado.</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-slate-900">Móvil primero</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Se ve bien en cualquier pantalla.</p>
              </div>
            </div>
          </div>

          <Card className="border-emerald-100/80 bg-white/85 shadow-2xl shadow-emerald-900/5 backdrop-blur">
            <CardHeader className="space-y-3">
              <Badge className="w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Lo que vas a sentir</Badge>
              <CardTitle className="text-2xl text-slate-950">Una entrada tranquila y agradable</CardTitle>
              <CardDescription className="text-base leading-7">
                Menos ruido visual, más claridad y un camino directo para empezar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-emerald-600 p-1.5 text-white">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Inicio claro</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Un acceso simple para llegar a tu cuenta sin dar rodeos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-slate-900 p-1.5 text-white">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Pensado para usar en el celular</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Espacios amplios, botones grandes y lectura cómoda.
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="my-2 bg-emerald-100" />

              {sessionUser ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Ya estás dentro: {sessionUser.nombre} {sessionUser.apellido}
                  </p>
                  <Link href="/users" className="block">
                    <span className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-medium text-white transition hover:bg-emerald-500">
                      Seguir
                    </span>
                  </Link>
                  <LogoutForm />
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    El acceso está listo en un solo toque.
                  </p>
                  <Link href="/users/login" className="block">
                    <span className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-medium text-white transition hover:bg-emerald-500">
                      Entrar ahora
                    </span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-white/80 bg-white/70 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Una sola entrada</CardTitle>
              <CardDescription>Todo empieza en el acceso de login.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-white/80 bg-white/70 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Visual limpio</CardTitle>
              <CardDescription>Sin ruido, sin pasos innecesarios.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-white/80 bg-white/70 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Botón verde</CardTitle>
              <CardDescription>El acceso principal queda claro y visible.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-white/80 bg-white/70 shadow-sm backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Listo para móvil</CardTitle>
              <CardDescription>Se adapta bien a pantallas pequeñas y grandes.</CardDescription>
            </CardHeader>
          </Card>
        </section>
      </div>
    </main>
  );
}

