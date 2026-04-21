import { Utensils } from "lucide-react";

import type { UserDashboardMeal } from "@/actions/server/users/types";
import { Badge } from "@/components/ui/badge";

import { DashboardMealCard } from "./dashboard-meal-card";

type DashboardMealsSectionProps = {
  meals: UserDashboardMeal[];
  selectedDateLabel: string;
};

export function DashboardMealsSection({ meals, selectedDateLabel }: DashboardMealsSectionProps) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Comidas del dia</h2>
        <Badge variant="outline" className="rounded-full">
          <Utensils className="size-3.5" />
          {selectedDateLabel}
        </Badge>
      </div>

      {meals.length > 0 ? (
        <div className="grid gap-3">
          {meals.map((meal) => (
            <DashboardMealCard key={meal.id} meal={meal} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-600">
          No hay comidas disponibles para la fecha seleccionada.
        </div>
      )}
    </section>
  );
}
