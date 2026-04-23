import type { UserNutritionPlan } from "@/actions/server/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserWeeklyPlanCardProps = {
  plan: UserNutritionPlan | null;
  profile: {
    age: number;
    sex: string;
    heightCm: number | null;
    weightKg: number | null;
    targetWeightKg: number | null;
    trainingType: string | null;
    frequency: number | null;
    yearsTraining: number | null;
  };
};

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function UserWeeklyPlanCard({ plan, profile }: UserWeeklyPlanCardProps) {
  if (!plan) {
    return (
      <Card className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
        <CardHeader>
          <CardTitle className="text-xl text-slate-900">Plan semanal</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Aun no hay un plan semanal generado para este usuario.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-4">
      <Card className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-slate-900">Resumen nutricional</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-medium text-slate-500">Objetivo:</span> {plan.objective}</p>
          <p><span className="font-medium text-slate-500">IMC:</span> {plan.imc ?? "Pendiente"}</p>
          <p><span className="font-medium text-slate-500">Actividad:</span> {plan.activityLevel}</p>
          <p><span className="font-medium text-slate-500">Velocidad:</span> {plan.speed}</p>
          <p><span className="font-medium text-slate-500">Agua diaria:</span> {plan.dailyWaterLiters} L</p>
          <p><span className="font-medium text-slate-500">Calorias objetivo:</span> {plan.targetCalories} kcal</p>
          {plan.warning ? (
            <p className="md:col-span-2 text-amber-700">
              <span className="font-medium text-amber-800">Nota:</span> {plan.warning}
            </p>
          ) : null}
          {plan.corrections?.length ? (
            <div className="md:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 text-emerald-800">
              <p className="font-medium text-emerald-900">Correcciones aplicadas</p>
              <ul className="mt-2 space-y-1 text-sm leading-6">
                {plan.corrections.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-cyan-200/80 bg-cyan-50/70 shadow-lg shadow-cyan-100/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-slate-900">Cálculo energético</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-medium text-slate-500">Fórmula basal:</span> {plan.formulaName}</p>
          <p><span className="font-medium text-slate-500">Edad:</span> {profile.age} años</p>
          <p><span className="font-medium text-slate-500">Sexo:</span> {profile.sex}</p>
          <p><span className="font-medium text-slate-500">Altura:</span> {profile.heightCm ?? "Sin dato"} cm</p>
          <p><span className="font-medium text-slate-500">Peso actual:</span> {profile.weightKg ?? "Sin dato"} kg</p>
          <p><span className="font-medium text-slate-500">Peso objetivo:</span> {profile.targetWeightKg ?? "Sin dato"} kg</p>
          <p><span className="font-medium text-slate-500">TMB:</span> {Math.round(plan.tmbKcal)} kcal</p>
          <p><span className="font-medium text-slate-500">Gasto total (TDEE):</span> {Math.round(plan.gastoTotalKcal)} kcal</p>
          <p><span className="font-medium text-slate-500">Movimiento diario:</span> {plan.activityLevel} ({plan.walkingFactor.toFixed(2)}x)</p>
          <p><span className="font-medium text-slate-500">Entrenamiento:</span> {profile.trainingType ?? "Sin dato"} ({plan.trainingFactor.toFixed(2)}x)</p>
          <p><span className="font-medium text-slate-500">Frecuencia:</span> {profile.frequency ?? 0} días/semana</p>
          <p><span className="font-medium text-slate-500">Años entrenando:</span> {profile.yearsTraining ?? 0}</p>
          <p className="md:col-span-2"><span className="font-medium text-slate-500">Ajuste por objetivo:</span> {plan.ajusteCaloricoKcal >= 0 ? "+" : ""}{Math.round(plan.ajusteCaloricoKcal)} kcal/día ({plan.ajusteCaloricoPct.toFixed(1)}%)</p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {plan.days.map((day) => (
          <Card
            key={`${day.dayLabel}-${day.dateIso}`}
            className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-200/50"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-900">
                {day.dayLabel} <span className="text-sm font-normal text-slate-500">{formatDate(day.dateIso)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {day.meals.map((meal) => (
                <section
                  key={`${day.dayLabel}-${meal.mealType}`}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {meal.mealType}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{meal.recipeName}</h3>
                  <p className="mt-2 text-sm text-slate-600">{meal.foods.join(", ")}</p>
                </section>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
