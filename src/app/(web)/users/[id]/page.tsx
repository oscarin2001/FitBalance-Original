import Link from "next/link";

import { calculateAge } from "@/actions/server/users/onboarding/logic/onboarding-calculator";
import { loadUserDetailPageState } from "@/actions/server/users/pages";
import { UserWeeklyPlanCard } from "@/components/users/plans";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return value.toLocaleDateString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatTrainingLabel(value: string | null): string {
  if (!value) {
    return "Sin definir";
  }

  return value.replace(/_/g, " ");
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { user } = await loadUserDetailPageState(params);

  return (
    <main className="relative min-h-svh overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-14 size-56 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="absolute right-0 top-1/3 size-64 rounded-full bg-teal-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-md gap-4 p-4 pb-8 pt-8">
        <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {user.nombre} {user.apellido}
            </h1>
            <Link href="/users" className="text-sm font-medium text-primary">
              Volver
            </Link>
          </div>

          <dl className="mt-4 grid gap-2 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Pais</dt>
              <dd>{user.pais ?? "Sin pais"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Sexo</dt>
              <dd>{user.sexo}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Objetivo</dt>
              <dd>{user.objetivo ?? "Sin objetivo"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Nivel actividad</dt>
              <dd>{user.nivel_actividad ?? "Sin nivel"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Entrenamiento</dt>
              <dd>{formatTrainingLabel(user.tipo_entrenamiento)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Experiencia</dt>
              <dd>{formatTrainingLabel(user.nivel_experiencia)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Frecuencia</dt>
              <dd>{user.frecuencia_entreno ?? 0} dias/semana</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Anios entrenando</dt>
              <dd>{user.anos_entrenando ?? 0}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Peso actual</dt>
              <dd>{user.peso_kg ? `${user.peso_kg} kg` : "Sin dato"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Peso objetivo</dt>
              <dd>{user.peso_objetivo_kg ? `${user.peso_objetivo_kg} kg` : "Sin dato"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Registro</dt>
              <dd>{formatDate(user.fecha_creacion)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Actualizado</dt>
              <dd>{formatDate(user.updatedAt)}</dd>
            </div>
          </dl>
        </section>

        <UserWeeklyPlanCard
          plan={user.nutritionPlan}
          profile={{
            age: calculateAge(user.fecha_nacimiento),
            sex: user.sexo,
            heightCm: user.altura_cm,
            weightKg: user.peso_kg,
            targetWeightKg: user.peso_objetivo_kg,
            trainingType: user.tipo_entrenamiento,
            frequency: user.frecuencia_entreno,
            yearsTraining: user.anos_entrenando,
          }}
        />
      </div>
    </main>
  );
}
