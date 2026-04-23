"use client";

import { useEffect, useMemo, useState } from "react";

import { CalendarDays, ChevronRight, Sparkles, Users, X } from "lucide-react";

import { loadSharedRecipesAction, type SharedRecipeSummary } from "@/actions/server/users/dashboard/recipes";
import { loadSharedQuickEntriesAction, type SharedQuickEntrySummary } from "@/actions/server/users/dashboard/daily-log/quick-entry-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatIngredientAmount, formatIngredientMacroLine, formatMacroLine, splitInstructionText } from "../lib/meal-formatters";

type CommunityRecipesPanelState = {
  recipes: SharedRecipeSummary[];
  quickEntries: SharedQuickEntrySummary[];
  loading: boolean;
  error: string | null;
};

const REFRESH_EVENT = "fitbalance:shared-recipes-updated";

function formatDateLabel(value: string | null) {
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

function RecipeCardSkeleton() {
  return <div className="h-36 rounded-[1.5rem] border border-slate-200/80 bg-white/85 shadow-sm shadow-slate-100" />;
}

function QuickEntryCardSkeleton() {
  return <div className="h-32 rounded-[1.5rem] border border-slate-200/80 bg-white/85 shadow-sm shadow-slate-100" />;
}

function formatQuickEntryModeLabel(value: SharedQuickEntrySummary["carbMode"]) {
  return value === "net" ? "Carbos netos" : value === "total" ? "Carbos totales" : "Carbos";
}

export function CommunityRecipesPanel() {
  const [state, setState] = useState<CommunityRecipesPanelState>({
    recipes: [],
    quickEntries: [],
    loading: true,
    error: null,
  });
  const [selectedRecipe, setSelectedRecipe] = useState<SharedRecipeSummary | null>(null);
  const [selectedQuickEntry, setSelectedQuickEntry] = useState<SharedQuickEntrySummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRecipes = async () => {
      setState((current) => ({ ...current, loading: true, error: null }));
      const [recipesResult, quickEntriesResult] = await Promise.all([
        loadSharedRecipesAction(),
        loadSharedQuickEntriesAction(),
      ]);

      if (cancelled) {
        return;
      }

      const nextState: CommunityRecipesPanelState = {
        recipes: [],
        quickEntries: [],
        loading: false,
        error: null,
      };

      if (recipesResult.ok) {
        nextState.recipes = recipesResult.recipes ?? [];
      } else {
        nextState.error = recipesResult.error ?? "No pudimos cargar las recetas compartidas.";
      }

      if (quickEntriesResult.ok) {
        nextState.quickEntries = quickEntriesResult.quickEntries ?? [];
      } else {
        nextState.error = nextState.error ?? quickEntriesResult.error ?? "No pudimos cargar las entradas rápidas compartidas.";
      }

      setState(nextState);
    };

    void loadRecipes();

    const handleRefresh = () => {
      void loadRecipes();
    };

    window.addEventListener(REFRESH_EVENT, handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(REFRESH_EVENT, handleRefresh);
    };
  }, []);

  const recipeCountLabel = useMemo(() => {
    return state.recipes.length === 1 ? "1 receta compartida" : `${state.recipes.length} recetas compartidas`;
  }, [state.recipes.length]);

  const quickEntryCountLabel = useMemo(() => {
    return state.quickEntries.length === 1
      ? "1 entrada rápida compartida"
      : `${state.quickEntries.length} entradas rápidas compartidas`;
  }, [state.quickEntries.length]);

  return (
    <>
      <section className="grid gap-4 rounded-[2rem] border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-slate-200/40 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Comunidad</h2>
              <Users className="size-4 text-slate-400" />
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Recetas y entradas rápidas compartidas por la comunidad. Abre una tarjeta para ver el detalle y quién la compartió.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Badge variant="secondary" className="rounded-full">
              {state.loading ? "Cargando..." : recipeCountLabel}
            </Badge>
            <Badge variant="secondary" className="rounded-full">
              {state.loading ? "Cargando..." : quickEntryCountLabel}
            </Badge>
          </div>
        </div>

        {state.error ? <p className="text-sm font-medium text-rose-600">{state.error}</p> : null}

        {state.loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <RecipeCardSkeleton key={index} />
            ))}
            {Array.from({ length: 2 }).map((_, index) => (
              <QuickEntryCardSkeleton key={`quick-${index}`} />
            ))}
          </div>
        ) : state.recipes.length === 0 && state.quickEntries.length === 0 ? (
          <div className="grid gap-3 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-950">Todavia no hay contenido compartido</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Cuando compartas una receta o una entrada rápida, aparecera aqui para otros usuarios.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            {state.recipes.length > 0 ? (
              <section className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-950">Recetas compartidas</h3>
                    <p className="text-sm text-slate-500">Toca una tarjeta para abrir el detalle.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {state.recipes.length}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {state.recipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => setSelectedRecipe(recipe)}
                      className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-semibold text-slate-950">{recipe.name}</h4>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                              Receta
                            </Badge>
                            <Badge variant="secondary" className="rounded-full">
                              {recipe.ingredientCount} ingredientes
                            </Badge>
                          </div>
                        </div>

                        <Badge variant="outline" className="rounded-full">
                          {selectedRecipe?.id === recipe.id ? "Abierta" : "Ver"}
                        </Badge>
                      </div>

                      <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Macros</p>
                        <p className="text-sm font-medium text-slate-700">{formatMacroLine(recipe.totals)}</p>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <CalendarDays className="size-3.5" />
                          {formatDateLabel(recipe.sharedAtIso) ?? "Compartida recientemente"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          Ver receta <ChevronRight className="size-4" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {state.quickEntries.length > 0 ? (
              <section className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-950">Entradas rápidas compartidas</h3>
                    <p className="text-sm text-slate-500">Toca una tarjeta para ver quién la compartió.</p>
                  </div>
                  <Badge variant="outline" className="rounded-full">
                    {state.quickEntries.length}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {state.quickEntries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setSelectedQuickEntry(entry)}
                      className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-semibold text-slate-950">{entry.name}</h4>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-full">
                              Entrada rápida
                            </Badge>
                            <Badge variant="secondary" className="rounded-full">
                              {formatQuickEntryModeLabel(entry.carbMode)}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              Base {Math.round(entry.gramsReference)} g
                            </Badge>
                          </div>
                        </div>

                        <Badge variant="outline" className="rounded-full">
                          {selectedQuickEntry?.id === entry.id ? "Abierta" : "Ver"}
                        </Badge>
                      </div>

                      <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Macros</p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatMacroLine({
                            calories: entry.calories,
                            proteins: entry.proteins,
                            carbs: entry.carbs,
                            fats: entry.fats,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          <CalendarDays className="size-3.5" />
                          {formatDateLabel(entry.sharedAtIso) ?? "Compartida recientemente"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-cyan-600">
                          Ver detalle <ChevronRight className="size-4" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </section>

      <Dialog open={Boolean(selectedRecipe)} onOpenChange={(nextOpen) => !nextOpen && setSelectedRecipe(null)}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "z-[300] h-[calc(100dvh-1rem)] w-[min(100vw-1rem,44rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
          )}
        >
          <div className="flex h-full min-h-0 w-full flex-col bg-white">
            <DialogHeader className="relative flex items-center justify-center border-b border-slate-200 px-4 py-3 pt-[env(safe-area-inset-top)]">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute left-3 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setSelectedRecipe(null)}
              >
                <X className="size-5" />
              </Button>

              <DialogTitle className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
                {selectedRecipe?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">Detalle de receta compartida</DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y p-4">
                {selectedRecipe ? (
                  <div className="grid gap-4 pb-4">
                    <section className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50 px-4 py-4 shadow-sm shadow-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full">
                          Receta
                        </Badge>
                        <Badge variant="secondary" className="rounded-full">
                          {selectedRecipe.ingredientCount} ingredientes
                        </Badge>
                        <Badge variant="secondary" className="rounded-full">
                          {selectedRecipe.portions} porciones
                        </Badge>
                      </div>

                      <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Compartida por</p>
                        <p className="text-base font-semibold text-slate-950">{selectedRecipe.sharedByName}</p>
                        {selectedRecipe.createdByName && selectedRecipe.createdByName !== selectedRecipe.sharedByName ? (
                          <p className="text-sm text-slate-500">Creada por {selectedRecipe.createdByName}</p>
                        ) : null}
                        {formatDateLabel(selectedRecipe.sharedAtIso) ? (
                          <p className="text-sm text-slate-500">Compartida el {formatDateLabel(selectedRecipe.sharedAtIso)}</p>
                        ) : null}
                      </div>

                      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700">
                        {formatMacroLine(selectedRecipe.totals)}
                      </div>
                    </section>

                    <section className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ingredientes</p>
                        <Badge variant="outline" className="rounded-full">
                          {selectedRecipe.ingredients.length} items
                        </Badge>
                      </div>

                      <div className="grid gap-3">
                        {selectedRecipe.ingredients.map((ingredient, index) => (
                          <div key={`${selectedRecipe.id}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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

                            <p className="mt-2 text-xs text-slate-500">{formatIngredientMacroLine(ingredient.nutrition)}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <Separator />

                    <section className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Preparacion</p>
                        <Badge variant="outline" className="rounded-full">
                          {selectedRecipe.instructions.length} pasos
                        </Badge>
                      </div>

                      {selectedRecipe.instructions.length > 0 ? (
                        <ol className="grid gap-3">
                          {selectedRecipe.instructions.map((step, index) => (
                            <li key={`${selectedRecipe.id}-step-${index}`} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                                {index + 1}
                              </span>
                              <p className="text-sm leading-6 text-slate-700">{step}</p>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-sm leading-6 text-slate-500">Esta receta aun no tiene pasos guardados.</p>
                      )}
                    </section>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedQuickEntry)} onOpenChange={(nextOpen) => !nextOpen && setSelectedQuickEntry(null)}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "z-[300] h-[calc(100dvh-1rem)] w-[min(100vw-1rem,44rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
          )}
        >
          <div className="flex h-full min-h-0 w-full flex-col bg-white">
            <DialogHeader className="relative flex items-center justify-center border-b border-slate-200 px-4 py-3 pt-[env(safe-area-inset-top)]">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute left-3 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setSelectedQuickEntry(null)}
              >
                <X className="size-5" />
              </Button>

              <DialogTitle className="text-[1.05rem] font-semibold tracking-tight text-slate-950">
                {selectedQuickEntry?.name}
              </DialogTitle>
              <DialogDescription className="sr-only">Detalle de entrada rápida compartida</DialogDescription>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y p-4">
                {selectedQuickEntry ? (
                  <div className="grid gap-4 pb-4">
                    <section className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50 px-4 py-4 shadow-sm shadow-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="rounded-full">
                          Entrada rápida
                        </Badge>
                        <Badge variant="secondary" className="rounded-full">
                          {formatQuickEntryModeLabel(selectedQuickEntry.carbMode)}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full">
                          Compartida
                        </Badge>
                      </div>

                      <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Compartida por</p>
                        <p className="text-base font-semibold text-slate-950">{selectedQuickEntry.sharedByName}</p>
                        <p className="text-sm text-slate-500">Base nutricional: {Math.round(selectedQuickEntry.gramsReference)} g</p>
                        {selectedQuickEntry.createdByName && selectedQuickEntry.createdByName !== selectedQuickEntry.sharedByName ? (
                          <p className="text-sm text-slate-500">Creada por {selectedQuickEntry.createdByName}</p>
                        ) : null}
                        {formatDateLabel(selectedQuickEntry.sharedAtIso) ? (
                          <p className="text-sm text-slate-500">Compartida el {formatDateLabel(selectedQuickEntry.sharedAtIso)}</p>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Calorías</p>
                          <p className="mt-1 text-lg font-semibold text-slate-950">{Math.round(selectedQuickEntry.calories)}</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Proteína</p>
                          <p className="mt-1 text-lg font-semibold text-blue-700">{Math.round(selectedQuickEntry.proteins)}g</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-400">Carbos</p>
                          <p className="mt-1 text-lg font-semibold text-rose-700">{Math.round(selectedQuickEntry.carbs)}g</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">Grasa</p>
                          <p className="mt-1 text-lg font-semibold text-amber-700">{Math.round(selectedQuickEntry.fats)}g</p>
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Detalle nutricional</p>
                        <Badge variant="outline" className="rounded-full">
                          {selectedQuickEntry.carbMode === "net" ? "Neto" : "Total"}
                        </Badge>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">Alcoholes de azúcar: {Math.round(selectedQuickEntry.sugarAlcohols)}g</div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">Fibra: {Math.round(selectedQuickEntry.fiber)}g</div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">Allulosa: {Math.round(selectedQuickEntry.allulose)}g</div>
                        <div className="rounded-2xl bg-slate-50 px-3 py-2">
                          Carga glucémica: {selectedQuickEntry.glycemicLoad !== null ? Math.round(selectedQuickEntry.glycemicLoad) : "N/D"}
                        </div>
                      </div>

                      {selectedQuickEntry.notes ? (
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                          {selectedQuickEntry.notes}
                        </div>
                      ) : null}
                    </section>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
