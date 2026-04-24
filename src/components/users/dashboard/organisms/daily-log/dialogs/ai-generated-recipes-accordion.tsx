"use client";

import { useMemo } from "react";

import { CalendarDays, Shield, Sparkles } from "lucide-react";

import type { UserDashboardMeal, UserDashboardWeeklyRecipeDay } from "@/actions/server/users/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BOLIVIA_TIME_ZONE, toDateKey } from "@/lib/date-labels";
import { cn } from "@/lib/utils";
import { formatMacroLine } from "@/components/users/dashboard/lib/meal-formatters";

type AiGeneratedRecipesAccordionProps = {
  days: UserDashboardWeeklyRecipeDay[];
  onOpenMeal: (input: { dayLabel: string; meal: UserDashboardMeal }) => void;
  searchQuery?: string;
  preferredDateIso?: string | null;
  preferredMealType?: string | null;
  className?: string;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-BO", {
    timeZone: BOLIVIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function sumTotals(day: UserDashboardWeeklyRecipeDay) {
  return day.meals.reduce(
    (accumulator, meal) => ({
      calories: accumulator.calories + meal.totals.calories,
      proteins: accumulator.proteins + meal.totals.proteins,
      carbs: accumulator.carbs + meal.totals.carbs,
      fats: accumulator.fats + meal.totals.fats,
    }),
    {
      calories: 0,
      proteins: 0,
      carbs: 0,
      fats: 0,
    }
  );
}

function getMondayFirstOrder(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 7;
  }

  return (date.getUTCDay() + 6) % 7;
}

export function AiGeneratedRecipesAccordion({
  days,
  onOpenMeal,
  searchQuery = "",
  preferredDateIso,
  preferredMealType,
  className,
}: AiGeneratedRecipesAccordionProps) {
  const normalizedQuery = normalizeText(searchQuery);
  const preferredDateKey = preferredDateIso?.trim() ?? null;
  const normalizedPreferredMealType = preferredMealType ? normalizeText(preferredMealType) : null;
  const visibleDays = useMemo(() => {
    return [...days]
      .filter((day) => {
        if (!preferredDateKey) {
          return true;
        }

        return toDateKey(new Date(day.dateIso)) === preferredDateKey;
      })
      .sort((left, right) => getMondayFirstOrder(left.dateIso) - getMondayFirstOrder(right.dateIso) || left.dateIso.localeCompare(right.dateIso))
      .map((day) => ({
        ...day,
        meals: day.meals.filter((meal) => {
          if (normalizedPreferredMealType && normalizeText(meal.mealType) !== normalizedPreferredMealType) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          const ingredients = meal.ingredients.map((ingredient) => ingredient.name).join(" ");
          const haystack = normalizeText(
            [day.dayLabel, meal.mealType, meal.recipeName, ingredients, meal.instructions.join(" ")].join(" ")
          );

          return haystack.includes(normalizedQuery);
        }),
      }))
      .filter((day) => day.meals.length > 0 || !normalizedQuery);
  }, [days, normalizedPreferredMealType, normalizedQuery, preferredDateKey]);

  const totalRecipes = useMemo(() => {
    return visibleDays.reduce((accumulator, day) => accumulator + day.meals.length, 0);
  }, [visibleDays]);

  if (days.length === 0) {
    return null;
  }

  return (
    <section className={cn("grid gap-4", className)}>
      <Separator className="bg-slate-200/80" />

      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight text-slate-950">Recetas generadas por mi IA</h3>
              <Sparkles className="size-4 text-emerald-500" />
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-500">Bloque de solo lectura con tu plan semanal.</p>
          </div>

          <Badge variant="secondary" className="rounded-full">
            <Shield className="size-3.5" />
            {totalRecipes} receta{totalRecipes === 1 ? "" : "s"}
          </Badge>
        </div>

        {visibleDays.length > 0 ? (
          <Accordion multiple className="grid gap-0">
            {visibleDays.map((day, dayIndex) => {
              const dayTotals = sumTotals(day);

              return (
                <div key={day.dateIso} className="grid gap-0">
                  {dayIndex > 0 ? <Separator className="bg-slate-200/80" /> : null}

                  <AccordionItem value={day.dateIso} className="border-0">
                    <AccordionTrigger
                      className={cn(
                        "w-full rounded-none px-4 py-4 text-left no-underline hover:no-underline",
                        "[&_svg[data-slot=accordion-trigger-icon]]:size-4 [&_svg[data-slot=accordion-trigger-icon]]:text-slate-400"
                      )}
                    >
                      <span className="flex min-w-0 flex-1 items-start gap-3 pr-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                          <CalendarDays className="size-4" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {day.dayLabel}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 ring-1 ring-slate-200">
                              {day.meals.length} recetas
                            </span>
                          </span>
                          <span className="mt-1 block text-sm font-normal leading-6 text-slate-500">
                            {formatDateLabel(day.dateIso) ?? day.dateIso} · {formatMacroLine(dayTotals)}
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>

                    <AccordionContent className="px-4 pb-4">
                      <div className="grid gap-0">
                        <div className="grid gap-0">
                          {day.meals.map((meal, mealIndex) => (
                            <div key={meal.id}>
                              <button
                                type="button"
                                onClick={() => onOpenMeal({ dayLabel: day.dayLabel, meal })}
                                className="flex w-full items-center justify-between gap-3 py-4 text-left transition hover:bg-slate-50/70"
                              >
                                <span className="text-base font-semibold text-slate-950">{meal.mealType}</span>
                              </button>

                              {mealIndex < day.meals.length - 1 ? <Separator className="bg-slate-200/70" /> : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              );
            })}
          </Accordion>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            No encontramos recetas generadas con ese criterio.
          </div>
        )}
      </div>
    </section>
  );
}
