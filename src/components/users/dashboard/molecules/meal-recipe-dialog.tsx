"use client";

import { Target } from "lucide-react";

import type { UserDashboardMeal } from "@/actions/server/users/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import {
  formatIngredientAmount,
  formatIngredientMacroLine,
  formatMacroLine,
} from "../lib/meal-formatters";

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

type MealRecipeDialogProps = {
  meal: UserDashboardMeal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MealRecipeDialog({ meal, open, onOpenChange }: MealRecipeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/95 p-0 shadow-2xl">
        <DialogHeader className="px-6 pt-6 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              {meal.mealType}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              <Target className="size-3.5" />
              {meal.instructionsSource === "database" ? "Instruccion guardada" : "Preparacion sugerida"}
            </Badge>
            {meal.isShared && meal.sharedByName ? (
              <Badge variant="secondary" className="rounded-full">
                Compartida por {meal.sharedByName}
              </Badge>
            ) : null}
          </div>
          <DialogTitle className="text-2xl text-slate-950">{meal.recipeName}</DialogTitle>
          <DialogDescription>
            {meal.isShared && meal.sharedByName
              ? `Receta compartida por ${meal.sharedByName}${formatDateLabel(meal.sharedAtIso) ? ` el ${formatDateLabel(meal.sharedAtIso)}` : ""}.`
              : meal.instructionsSource === "database"
                ? "La receta ya tiene pasos de preparacion almacenados."
                : "Como aun no habia instrucciones guardadas, te mostramos una propuesta coherente con los ingredientes."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 px-6 pb-6 pt-2">
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Ingredientes y porciones
              </p>
              <Badge variant="outline" className="rounded-full">
                {meal.ingredients.length} items
              </Badge>
            </div>

            <div className="grid gap-3">
              {meal.ingredients.map((ingredient) => (
                <div
                  key={`${meal.id}-${ingredient.name}`}
                  className="rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{ingredient.name}</p>
                      <p className="text-sm text-slate-500">{ingredient.category ?? "Ingrediente"}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="text-sm font-semibold text-slate-900">
                        {formatIngredientAmount(ingredient)}
                      </span>
                      {ingredient.isBeverage ? (
                        <Badge variant="secondary" className="rounded-full text-[11px]">
                          Bebida
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {formatIngredientMacroLine(ingredient.nutrition)}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
              {formatMacroLine(meal.totals)}
            </div>
          </section>

          <Separator />

          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Preparacion
              </p>
              <Badge variant="outline" className="rounded-full">
                {meal.instructions.length} pasos
              </Badge>
            </div>

            <ol className="grid gap-3">
              {meal.instructions.map((step, index) => (
                <li key={`${meal.id}-step-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
