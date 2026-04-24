"use client";

import { useEffect, useState } from "react";

import { CalendarDays, X } from "lucide-react";

import type { SharedRecipeSummary } from "@/actions/server/users/dashboard/recipes/recipe-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { formatIngredientAmount, formatIngredientMacroLine, formatMacroLine } from "../../../lib/meal-formatters";

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

type RecipeViewDialogProps = {
  recipe: SharedRecipeSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RecipeViewDialog({ recipe, open, onOpenChange }: RecipeViewDialogProps) {
  const isMobileLayout = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);

  const isFullScreen = isMobileLayout || isStandalone;

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  if (!recipe) {
    return null;
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
            {recipe.name}
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
                      Receta
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {recipe.sharedAtIso ? "Compartida" : "Privada"}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {recipe.ingredientCount} ingredientes
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {recipe.portions} porciones
                    </Badge>
                  </div>

                  <div className="grid gap-0">
                    <div className="py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Autor</p>
                      <p className="mt-1 text-base font-semibold text-slate-950">{recipe.createdByName ?? recipe.sharedByName}</p>
                      {recipe.sharedAtIso ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                          <CalendarDays className="size-3.5" />
                          Compartida el {formatDateLabel(recipe.sharedAtIso)}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-500">Aun no la has compartido.</p>
                      )}
                    </div>

                    <Separator className="bg-slate-200/80" />

                    <div className="py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Macros</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{formatMacroLine(recipe.totals)}</p>
                    </div>
                  </div>
                </section>

                <Separator className="bg-slate-200/80" />

                <section className="grid gap-3 px-4 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ingredientes</p>
                    <Badge variant="outline" className="rounded-full">
                      {recipe.ingredients.length} items
                    </Badge>
                  </div>

                  <div className="grid gap-0">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div key={`${recipe.id}-${index}`}>
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
                        {index < recipe.ingredients.length - 1 ? <Separator className="bg-slate-200/70" /> : null}
                      </div>
                    ))}
                  </div>
                </section>

                <Separator className="bg-slate-200/80" />

                <section className="grid gap-3 px-4 py-5 pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Preparacion</p>
                    <Badge variant="outline" className="rounded-full">
                      {recipe.instructions.length} pasos
                    </Badge>
                  </div>

                  {recipe.instructions.length > 0 ? (
                    <div className="grid gap-0">
                      {recipe.instructions.map((step, index) => (
                        <div key={`${recipe.id}-step-${index}`}>
                          <div className="flex gap-3 py-3">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                              {index + 1}
                            </span>
                                  <p className="text-sm leading-6 text-slate-700 whitespace-pre-wrap break-words">{step}</p>
                          </div>
                          {index < recipe.instructions.length - 1 ? <Separator className="bg-slate-200/70" /> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-slate-500">Esta receta aun no tiene pasos guardados.</p>
                  )}
                </section>
              </div>
            </div>

            <div className="border-t border-slate-200/80 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-2xl border-slate-200 bg-white text-slate-700"
                  onClick={() => onOpenChange(false)}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={() => onOpenChange(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
