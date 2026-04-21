"use client";

import { useState } from "react";

import type { UserDashboardPlan } from "@/actions/server/users/types";

import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardMacroGrid } from "./organisms/dashboard-macro-grid";
import { DashboardSummaryCard } from "./organisms/dashboard-summary-card";
import {
  DailyLogView,
  type DailyLogMeal,
  type DailyLogProfile,
} from "./organisms/daily-log-view";

function resolveDailyLogProfile(objective: UserDashboardPlan["objective"]): DailyLogProfile {
  if (objective === "Bajar_grasa") {
    return "deficit";
  }

  if (objective === "Ganar_musculo") {
    return "superavit";
  }

  return "mantenimiento";
}

function mapDashboardMeals(meals: UserDashboardPlan["meals"]): DailyLogMeal[] {
  return meals.map((meal) => ({
    id: meal.id,
    title: meal.mealType,
    ingredients: meal.ingredients.map((ingredient, index) => ({
      id: `${meal.id}-${index}`,
      name: ingredient.name,
      quantityLabel: ingredient.portionLabel,
      nutrition: ingredient.nutrition,
    })),
  }))
}

type DashboardViewProps = {
  userName: string;
  dashboard: UserDashboardPlan | null;
  isPlanPending: boolean;
};

export function DashboardView({ userName, dashboard, isPlanPending }: DashboardViewProps) {
  const [range, setRange] = useState<"today" | "week">("today");

  if (isPlanPending || !dashboard) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-12 size-56 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 size-64 rounded-full bg-teal-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-md gap-4 p-4 pb-10 pt-8">
        <DashboardSummaryCard
          userName={userName}
          dashboard={dashboard}
          range={range}
          onRangeChange={setRange}
        />

        <DashboardMacroGrid dashboard={dashboard} range={range} />

        <DailyLogView
          meals={mapDashboardMeals(dashboard.meals)}
          dietProfile={resolveDailyLogProfile(dashboard.objective)}
          targets={dashboard.dayTargets}
        />
      </div>
    </main>
  );
}
