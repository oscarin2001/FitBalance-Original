"use client";

import { useState } from "react";

import type { UserDashboardMeal } from "@/actions/server/users/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { formatIngredientAmount, formatMacroLine } from "../lib/meal-formatters";
import { MealRecipeDialog } from "../molecules/meal-recipe-dialog";

type DashboardMealCardProps = {
  meal: UserDashboardMeal;
};

export function DashboardMealCard({ meal }: DashboardMealCardProps) {
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);

  return (
    <>
      <Card className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-2">
              <Badge variant="outline" className="w-fit rounded-full">
                {meal.mealType}
              </Badge>
              <CardTitle className="text-base text-slate-900">{meal.recipeName}</CardTitle>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {meal.ingredients.length} ingredientes
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 pt-0">
          <div className="grid gap-2 rounded-2xl bg-slate-50/80 p-3">
            {meal.ingredients.map((ingredient) => (
              <div key={`${meal.id}-${ingredient.name}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{ingredient.name}</p>
                  <p className="text-xs text-slate-500">{ingredient.category ?? "Ingrediente"}</p>
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
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{formatMacroLine(meal.totals)}</p>
            <Button variant="outline" size="sm" onClick={() => setIsRecipeOpen(true)}>
              Ver receta
            </Button>
          </div>
        </CardContent>
      </Card>

      <MealRecipeDialog meal={meal} open={isRecipeOpen} onOpenChange={setIsRecipeOpen} />
    </>
  );
}
