"use client";

import { useEffect, useState } from "react";

import { CalendarDays, Loader2, X } from "lucide-react";

import type { UserDashboardMeal } from "@/actions/server/users/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { formatIngredientAmount, formatIngredientMacroLine, formatMacroLine } from "../../../lib/meal-formatters";

type GeneratedMealViewDialogProps = {
  meal: UserDashboardMeal | null;
  dayLabel?: string | null;
  open: boolean;
  onApply?: (meal: UserDashboardMeal) => Promise<{ ok: boolean; error?: string; message?: string } | void> | { ok: boolean; error?: string; message?: string } | void;
  onOpenChange: (open: boolean) => void;
};

export function GeneratedMealViewDialog({ meal, dayLabel, open, onApply, onOpenChange }: GeneratedMealViewDialogProps) {
  const isMobileLayout = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const isFullScreen = isMobileLayout || isStandalone;

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (!meal) {
    return null;
  }

  const activeMeal = meal;

  async function handleApply() {
    if (!onApply || activeMeal.applied) {
      return;
    }

    setIsApplying(true);
    setApplyError(null);

    try {
      const result = await onApply(activeMeal);

      if (result && typeof result === "object" && "ok" in result && result.ok === false) {
        setApplyError(result.error ?? "No se pudo aplicar la receta.");
        return;
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setApplyError("No se pudo aplicar la receta.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          isFullScreen
            ? "!fixed !inset-0 !z-[300] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-white !p-0 !shadow-none !overflow-hidden"
            : "z-[300] h-[calc(100dvh-2rem)] w-[min(100vw-2rem,44rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
        )}
      >
        <div className="flex h-full min-h-0 w-full flex-col bg-white">
          <header className="relative flex items-center justify-center border-b border-slate-200 bg-white px-4 py-3 pt-[env(safe-area-inset-top)]">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute left-3 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-5" />
            </Button>

            <h2 className="max-w-[calc(100%-6rem)] px-12 text-center text-[1.05rem] font-semibold leading-6 tracking-tight text-slate-950 whitespace-normal break-words">
              {meal.recipeName}
            </h2>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y",
                isFullScreen ? "p-4 pl-4" : "px-5 py-5 pl-5"
              )}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="grid gap-4 pb-4">
                <section className="grid gap-3 px-4 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full">
                      IA
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {meal.mealType}
                    </Badge>
                    {dayLabel ? (
                      <Badge variant="secondary" className="rounded-full">
                        <CalendarDays className="size-3.5" />
                        {dayLabel}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary" className="rounded-full">
                      {meal.instructionsSource === "generated" ? "Generada" : "Guardada"}
                    </Badge>
                    {meal.applied ? (
                      <Badge variant="secondary" className="rounded-full">
                        Aplicada
                      </Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-0">
                    <div className="py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Origen</p>
                      <p className="mt-1 text-base font-semibold text-slate-950">Generada por tu IA</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {dayLabel ? `La comida de ${dayLabel} se muestra aqui en formato de lectura.` : "La comida semanal se muestra aqui en formato de lectura."}
                      </p>
                    </div>

                    <Separator className="bg-slate-200/80" />

                    <div className="py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Macros</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{formatMacroLine(meal.totals)}</p>
                    </div>
                  </div>
                </section>

                <Separator className="bg-slate-200/80" />

                <section className="grid gap-3 px-4 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ingredientes</p>
                    <Badge variant="outline" className="rounded-full">
                      {meal.ingredients.length} items
                    </Badge>
                  </div>

                  <div className="grid gap-0">
                    {meal.ingredients.map((ingredient, index) => (
                      <div key={`${meal.id}-${ingredient.name}-${index}`}>
                        <div className="grid gap-2 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{ingredient.name}</p>
                              <p className="text-sm text-slate-500">{ingredient.category ?? "Ingrediente"}</p>
                            </div>

                            <div className="flex flex-col items-end gap-1 text-right">
                              <span className="text-sm font-semibold text-slate-900">{formatIngredientAmount(ingredient)}</span>
                              {ingredient.isBeverage ? (
                                <Badge variant="secondary" className="rounded-full text-[11px]">
                                  Bebida
                                </Badge>
                              ) : null}
                            </div>
                          </div>

                          <p className="text-xs text-slate-500">{formatIngredientMacroLine(ingredient.nutrition)}</p>
                        </div>
                        {index < meal.ingredients.length - 1 ? <Separator className="bg-slate-200/70" /> : null}
                      </div>
                    ))}
                  </div>
                </section>

                <Separator className="bg-slate-200/80" />

                <section className="grid gap-3 px-4 py-5 pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Preparacion</p>
                    <Badge variant="outline" className="rounded-full">
                      {meal.instructions.length} pasos
                    </Badge>
                  </div>

                  {meal.instructions.length > 0 ? (
                    <div className="grid gap-0">
                      {meal.instructions.map((step, index) => (
                        <div key={`${meal.id}-step-${index}`}>
                          <div className="flex gap-3 py-3">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                              {index + 1}
                            </span>
                            <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">{step}</p>
                          </div>
                          {index < meal.instructions.length - 1 ? <Separator className="bg-slate-200/70" /> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-slate-500">Esta comida aun no tiene pasos guardados.</p>
                  )}
                </section>
              </div>
            </div>

            <div className="border-t border-slate-200/80 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5">
              {applyError ? <p className="mb-3 text-sm font-medium text-rose-600">{applyError}</p> : null}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-2xl border-slate-200 bg-white text-slate-700"
                  onClick={() => onOpenChange(false)}
                >
                  Volver
                </Button>
                {onApply ? (
                  <Button
                    type="button"
                    className="h-12 flex-1 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                    onClick={handleApply}
                    disabled={isApplying || meal.applied}
                  >
                    {isApplying ? <Loader2 className="size-4 animate-spin" /> : null}
                    {meal.applied ? "Ya aplicada" : `Aplicar a ${meal.mealType}`}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-12 flex-1 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                    onClick={() => onOpenChange(false)}
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
