import Link from "next/link";
import { type Metadata } from "next";
import { Fraunces } from "next/font/google";
import {
  Activity,
  ArrowRight,
  ChefHat,
  Droplets,
  Flame,
  LineChart,
  Scale,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Target,
  TimerReset,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { loadHomePageState } from "@/actions/server/users/pages";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "FitBalance | Nutricion que se sigue",
  description: "Calcula macros, arma platos con alimentos bolivianos y monitorea tu progreso en un flujo mobile-first.",
};

type Highlight = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Step = {
  index: string;
  title: string;
  description: string;
};

type FormulaCard = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

type StatCard = {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
};

const highlights: Highlight[] = [
  {
    icon: UtensilsCrossed,
    title: "Bolivia first",
    description: "Un catalogo local que hace sentido con lo que realmente se come.",
  },
  {
    icon: Target,
    title: "Metas claras",
    description: "Calorias, macros, agua y objetivo de peso en un solo lugar.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first",
    description: "Pensada para usar rapido desde el telefono, sin friccion extra.",
  },
  {
    icon: Scale,
    title: "Seguimiento real",
    description: "Peso, medidas y cumplimiento para ver progreso, no solo intencion.",
  },
];

const heroStats: StatCard[] = [
  {
    icon: LineChart,
    label: "Calorias",
    value: "Personalizadas",
    description: "TMB + actividad + objetivo",
  },
  {
    icon: Droplets,
    label: "Agua",
    value: "Meta diaria",
    description: "Peso + actividad",
  },
  {
    icon: Scale,
    label: "Peso",
    value: "Seguimiento",
    description: "Registros y tendencia",
  },
  {
    icon: ChefHat,
    label: "Platos",
    value: "Plan semanal",
    description: "Comida real y local",
  },
];

const steps: Step[] = [
  {
    index: "01",
    title: "Completa tus datos",
    description: "Edad, peso, altura, objetivo y entrenamiento para arrancar con base real.",
  },
  {
    index: "02",
    title: "Elige tus alimentos",
    description: "Selecciona categorias y dias para que el plan encaje con tu rutina.",
  },
  {
    index: "03",
    title: "Sigue y ajusta",
    description: "Registra comidas, agua, peso y medidas para ver como responde tu cuerpo.",
  },
];

const formulas: FormulaCard[] = [
  {
    title: "TMB",
    value: "10 x peso + 6.25 x altura - 5 x edad + ajuste_sexo",
    description: "Base energetica para estimar tu metabolismo en reposo.",
    icon: LineChart,
  },
  {
    title: "TDEE",
    value: "TMB x factor_actividad x factor_entrenamiento",
    description: "Lo que realmente gastas al moverte y entrenar.",
    icon: Activity,
  },
  {
    title: "Ajuste",
    value: "Deficit, superavit o cero",
    description: "Bajar grasa, ganar musculo o mantener el peso.",
    icon: Flame,
  },
  {
    title: "Agua",
    value: "0.035 L x kg + extras",
    description: "Una meta diaria que sube con actividad y objetivo.",
    icon: Droplets,
  },
];

const mealPreview = [
  {
    label: "Desayuno",
    meal: "Huevo, quinua y palta",
    detail: "Energia y saciedad",
  },
  {
    label: "Almuerzo",
    meal: "Pollo, arroz y ensalada",
    detail: "Balance y control",
  },
  {
    label: "Cena",
    meal: "Trucha, papa y verduras",
    detail: "Ligero y funcional",
  },
];

function buildPrimaryCta(sessionUser: Awaited<ReturnType<typeof loadHomePageState>>["sessionUser"]) {
  return sessionUser ? "/users" : "/users/login";
}

function buildPrimaryLabel(sessionUser: Awaited<ReturnType<typeof loadHomePageState>>["sessionUser"]) {
  return sessionUser ? "Ir al dashboard" : "Entrar al sistema";
}

export default async function Home() {
  const { sessionUser } = await loadHomePageState();
  const primaryCtaHref = buildPrimaryCta(sessionUser);
  const primaryCtaLabel = buildPrimaryLabel(sessionUser);

  return (
    <main
      className={cn(
        fraunces.variable,
        "relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(180deg,_#f4fbf6_0%,_#ffffff_38%,_#eef8ef_100%)] text-slate-950"
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50" />
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute right-[-5rem] top-24 h-80 w-80 rounded-full bg-lime-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-emerald-700 uppercase">FitBalance</p>
              <p className="text-xs text-slate-600">Nutricion, progreso y comida real</p>
            </div>
          </div>

          <Link href={primaryCtaHref} className="hidden sm:block">
            <span className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-emerald-600">
              {primaryCtaLabel}
            </span>
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12 lg:py-16">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700 shadow-sm">
              Pensado para Bolivia, para el celular y para resultados reales
            </Badge>

            <h1
              className={cn(
                fraunces.className,
                "mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance text-slate-950 sm:text-5xl lg:text-7xl"
              )}
            >
              Nutricion que se entiende y se puede seguir.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              FitBalance calcula tus calorias, macros, agua y platos con alimentos bolivianos para que el progreso
              deje de depender de improvisar.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={primaryCtaHref} className="w-full sm:w-auto">
                <span className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-medium text-white transition hover:bg-emerald-600 sm:w-auto">
                  {primaryCtaLabel}
                  <ArrowRight className="size-4" />
                </span>
              </Link>

              <Link
                href="#como-funciona"
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-emerald-200 bg-white/80 px-6 text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-white sm:w-auto"
              >
                Ver como funciona
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <Card key={item.title} className="border-white/70 bg-white/82 shadow-sm backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-emerald-500/10 blur-3xl" />
            <Card className="relative overflow-hidden border-slate-200/80 bg-white/90 shadow-2xl shadow-emerald-900/10 backdrop-blur">
              <CardContent className="grid gap-4 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">Hoy</p>
                    <p className="text-xl font-semibold tracking-tight text-slate-950">Tu plan, claro y listo</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Bolivia-first
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {heroStats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div key={stat.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <Icon className="size-3.5" />
                          {stat.label}
                        </div>
                        <p className="mt-3 text-sm font-medium text-slate-900">{stat.value}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{stat.description}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-[1.5rem] border border-emerald-100 bg-[linear-gradient(135deg,_rgba(16,185,129,0.08),_rgba(255,255,255,0.9))] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    <ChefHat className="size-3.5" />
                    Plan semanal
                  </div>

                  <div className="mt-4 grid gap-3">
                    {mealPreview.map((meal) => (
                      <div key={meal.label} className="rounded-2xl bg-white/90 p-3 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{meal.label}</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">{meal.meal}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{meal.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Peso</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Registro simple</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cintura</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Medida clave</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cumplimiento</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Comidas y agua</p>
                  </div>
                </div>

                {sessionUser ? (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">
                      Ya tienes sesion iniciada como {sessionUser.nombre} {sessionUser.apellido}.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Sigue al dashboard para ver tu plan, registrar comida y revisar progreso.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">
                      Entra, completa tu perfil y empieza con un plan que si puedes seguir.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Sin ruido, sin pantallas eternas y con el siguiente paso siempre visible.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="por-que" className="grid gap-4 pb-2 md:grid-cols-3">
          <Card className="border-white/80 bg-white/75 shadow-sm backdrop-blur">
            <CardContent className="space-y-3 p-5">
              <div className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <TimerReset className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Menos improvisacion</h2>
              <p className="text-sm leading-6 text-slate-600">
                La app traduce tu objetivo en pasos concretos para que entrenar no quede desconectado de comer bien.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/75 shadow-sm backdrop-blur">
            <CardContent className="space-y-3 p-5">
              <div className="grid size-11 place-items-center rounded-2xl bg-slate-900 text-white">
                <ShieldCheck className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Resultados medibles</h2>
              <p className="text-sm leading-6 text-slate-600">
                Peso, cintura, agua y cumplimiento dejan de ser un asunto subjetivo y pasan a ser seguimiento real.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/75 shadow-sm backdrop-blur">
            <CardContent className="space-y-3 p-5">
              <div className="grid size-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Flame className="size-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950">Comida con contexto</h2>
              <p className="text-sm leading-6 text-slate-600">
                Alimentos bolivianos, porciones calculadas y platos que se pueden ejecutar en la vida real.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="como-funciona" className="py-14 lg:py-16">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-emerald-200 bg-white/80 text-emerald-700">
              Flujo simple
            </Badge>
            <h2 className={cn(fraunces.className, "mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl")}>
              Un recorrido corto, claro y con sentido.
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              FitBalance evita pantallas vacias y pasos innecesarios. Cada accion lleva a una decision util.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.index} className="border-slate-200/80 bg-white/85 shadow-sm">
                <CardContent className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">{step.index}</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 py-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200/80 bg-white/85 shadow-sm">
            <CardContent className="p-5">
              <Badge className="bg-slate-950 text-white hover:bg-slate-950">Base tecnica</Badge>
              <h2 className={cn(fraunces.className, "mt-4 text-3xl font-semibold tracking-tight text-slate-950")}>
                Lo importante se calcula, no se adivina.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                TMB, gasto total, ajuste calorico y agua salen de formulas internas. Eso hace que el plan no dependa
                de copiar una dieta generica.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {formulas.map((formula) => {
              const Icon = formula.icon;

              return (
                <Card key={formula.title} className="border-slate-200/80 bg-white/85 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formula.title}</p>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Formula interna</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-900">{formula.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{formula.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="py-8">
          <Card className="overflow-hidden border-emerald-200/80 bg-slate-950 text-white shadow-xl shadow-slate-950/10">
            <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Impacto real</Badge>
                <h2 className={cn(fraunces.className, "mt-4 text-3xl font-semibold tracking-tight sm:text-4xl")}>
                  Cuando la dieta se vuelve clara, el entrenamiento por fin tiene con que trabajar.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                  FitBalance toma lo que ya sabemos por evidencia, lo ordena en una experiencia simple y lo adapta al
                  contexto boliviano para que el usuario pueda sostenerlo.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Diferencia</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    No solo cuenta calorias: propone comida y monitorea progreso.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Uso</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    Onboarding corto, dashboard claro y seguimiento diario.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="py-8">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">Listo para usar</p>
              <h2 className={cn(fraunces.className, "mt-3 text-3xl font-semibold tracking-tight text-slate-950")}>
                Tu siguiente paso es simple: entrar y empezar.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ya sea que quieras bajar grasa, ganar musculo o mantenerte, FitBalance convierte el objetivo en un
                plan que se puede seguir.
              </p>
            </div>

            <Link href={primaryCtaHref} className="inline-flex w-full sm:w-auto">
              <span className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 text-sm font-medium text-white transition hover:bg-emerald-600 sm:w-auto">
                {primaryCtaLabel}
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
