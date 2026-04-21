import type { UserNutritionPlan } from "@/actions/server/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UserWeeklyPlanCardProps = {
  plan: UserNutritionPlan | null;
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

export function UserWeeklyPlanCard({ plan }: UserWeeklyPlanCardProps) {
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
