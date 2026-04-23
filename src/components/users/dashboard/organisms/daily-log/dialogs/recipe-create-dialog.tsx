"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { Camera, Loader2, Plus, Search, Smile, Sparkles, Trash2, X } from "lucide-react";

import { createRecipeAction } from "@/actions/server/users/dashboard/recipes";
import { loadDailyLogFoodCatalogAction } from "@/actions/server/users/dashboard/daily-log/food-actions";
import type { DailyLogFoodOption } from "@/actions/server/users/dashboard/daily-log/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MAX_INGREDIENT_QUANTITY } from "@/actions/server/users/dashboard/daily-log/constants";
import { formatQuantityLabel, scaleNutrition } from "@/actions/server/users/dashboard/daily-log/meal-helpers";

type RecipeCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFoods?: DailyLogFoodOption[];
};

type RecipeIngredientDraft = {
  food: DailyLogFoodOption;
  quantity: string;
  unit: "g" | "ml";
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeQuantityInput(value: string) {
  const cleanedValue = value.replace(/[^\d.,]/g, "").replace(",", ".");

  if (cleanedValue.trim().length === 0) {
    return "";
  }

  const parsedValue = Number(cleanedValue);

  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  return String(Math.min(Math.max(parsedValue, 0), MAX_INGREDIENT_QUANTITY));
}

function normalizeIntegerInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeRecipeNameInput(value: string) {
  return value.replace(/\d/g, "");
}

function parseQuantity(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(Math.max(parsed, 0), MAX_INGREDIENT_QUANTITY);
}

function parsePositiveInteger(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isInteger(parsedValue) ? parsedValue : null;
}

function isBeverageFood(food: DailyLogFoodOption) {
  return food.isBeverage || normalizeText(`${food.categoryEnum ?? ""} ${food.categoryLabel ?? ""}`).includes("bebid");
}

function buildRecipeTotalLabel(totals: { calories: number; proteins: number; carbs: number; fats: number }) {
  return `${Math.round(totals.calories)} kcal | P ${Math.round(totals.proteins)}g | G ${Math.round(totals.fats)}g | C ${Math.round(totals.carbs)}g`;
}

export function RecipeCreateDialog({ open, onOpenChange, initialFoods }: RecipeCreateDialogProps) {
  const isMobileLayout = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);
  const [catalog, setCatalog] = useState<DailyLogFoodOption[]>(initialFoods ?? []);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [portions, setPortions] = useState("4");
  const [shareRecipe, setShareRecipe] = useState(true);
  const [ingredients, setIngredients] = useState<RecipeIngredientDraft[]>([]);

  const isFullScreen = isMobileLayout || isStandalone;
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());
  const instructionSteps = useMemo(
    () =>
      instructions
        .replace(/\r\n/g, "\n")
        .split(/\n+/)
        .map((step) => step.trim())
        .filter(Boolean),
    [instructions]
  );

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setIsLoadingCatalog(true);
    setCatalogError(null);
    setError(null);
    setSearchValue("");
    setRecipeName("");
    setInstructions("");
    setPortions("4");
    setShareRecipe(true);
    setIngredients([]);

    if (initialFoods && initialFoods.length > 0) {
      setCatalog(initialFoods);
      setIsLoadingCatalog(false);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      const result = await loadDailyLogFoodCatalogAction();

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setCatalog([]);
        setCatalogError(result.error ?? "No pudimos cargar el catalogo de alimentos.");
        setIsLoadingCatalog(false);
        return;
      }

      setCatalog(result.foods ?? []);
      setIsLoadingCatalog(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialFoods, open]);

  const filteredFoods = useMemo(() => {
    return catalog.filter((food) => {
      const haystack = normalizeText(`${food.name} ${food.categoryLabel ?? ""} ${food.categoryEnum ?? ""} ${food.portion ?? ""}`);
      return deferredSearch.length === 0 || haystack.includes(deferredSearch);
    });
  }, [catalog, deferredSearch]);

  const visibleFoods = useMemo(() => {
    return filteredFoods.filter((food) => !ingredients.some((ingredient) => ingredient.food.id === food.id)).slice(0, 3);
  }, [filteredFoods, ingredients]);

  const totals = useMemo(() => {
    return ingredients.reduce(
      (accumulator, ingredient) => {
        const nutrition = scaleNutrition(
          {
            calories: ingredient.food.calories,
            proteins: ingredient.food.proteins,
            carbs: ingredient.food.carbs,
            fats: ingredient.food.fats,
          },
          100,
          parseQuantity(ingredient.quantity)
        );

        return {
          calories: Number((accumulator.calories + nutrition.calories).toFixed(1)),
          proteins: Number((accumulator.proteins + nutrition.proteins).toFixed(1)),
          carbs: Number((accumulator.carbs + nutrition.carbs).toFixed(1)),
          fats: Number((accumulator.fats + nutrition.fats).toFixed(1)),
        };
      },
      { calories: 0, proteins: 0, carbs: 0, fats: 0 }
    );
  }, [ingredients]);

  function addIngredient(food: DailyLogFoodOption) {
    setIngredients((current) => {
      if (current.some((ingredient) => ingredient.food.id === food.id)) {
        return current;
      }

      return [
        ...current,
        {
          food,
          quantity: String(Math.max(food.gramsReference, 1)),
          unit: isBeverageFood(food) ? "ml" : "g",
        },
      ];
    });
    setError(null);
  }

  function removeIngredient(foodId: number) {
    setIngredients((current) => current.filter((ingredient) => ingredient.food.id !== foodId));
  }

  function updateIngredientQuantity(foodId: number, quantity: string) {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.food.id === foodId ? { ...ingredient, quantity: normalizeQuantityInput(quantity) } : ingredient
      )
    );
  }

  function toggleIngredientUnit(foodId: number, unit: "g" | "ml") {
    setIngredients((current) =>
      current.map((ingredient) => (ingredient.food.id === foodId ? { ...ingredient, unit } : ingredient))
    );
  }

  async function handleSave() {
    const normalizedName = recipeName.trim();

    if (!normalizedName) {
      setError("Ingresa un nombre para la receta.");
      return;
    }

    if (ingredients.length === 0) {
      setError("Agrega al menos un ingrediente.");
      return;
    }

    const parsedPortions = parsePositiveInteger(portions);
    if (parsedPortions === null || parsedPortions < 1 || parsedPortions > 100) {
      setError("Ingresa porciones válidas entre 1 y 100.");
      return;
    }

    const invalidIngredient = ingredients.find((ingredient) => parseQuantity(ingredient.quantity) <= 0);
    if (invalidIngredient) {
      setError(`Ingresa una cantidad válida para ${invalidIngredient.food.name}.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await Promise.resolve(
        createRecipeAction({
          name: normalizedName,
          instructions: instructions.replace(/\r\n/g, "\n").trim(),
          portions: parsedPortions,
          share: shareRecipe,
          ingredients: ingredients.map((ingredient) => ({
            foodId: ingredient.food.id,
            quantity: parseQuantity(ingredient.quantity),
            unit: ingredient.unit,
          })),
        })
      );

      if (!result.ok) {
        setError(result.error ?? "No pudimos guardar la receta.");
        return;
      }

      window.dispatchEvent(new Event("fitbalance:shared-recipes-updated"));
      onOpenChange(false);
    } catch (caughtError) {
      console.error(caughtError);
      setError("No pudimos guardar la receta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onOpenChange(false)}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          isFullScreen
            ? "!fixed !inset-0 !z-[280] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-white !p-0 !shadow-none !overflow-hidden"
            : "z-[280] h-[calc(100dvh-2rem)] w-[min(100vw-2rem,46rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
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

            <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">Crear receta</h2>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "no-scrollbar flex-1 min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y",
                isFullScreen ? "p-4 pl-4" : "px-5 py-5 pl-5"
              )}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="grid gap-4 pb-4">
                <div className="grid min-w-0 gap-4 px-4 py-5">
                  <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
                    <div className="flex size-20 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-300 shadow-inner">
                      <Sparkles className="size-8" />
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled
                        title="En trabajo"
                        className="rounded-full border-slate-200 bg-white px-4 text-slate-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <Smile className="size-4" />
                        Elegir emoji
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled
                        title="En trabajo"
                        className="rounded-full border-slate-200 bg-white px-4 text-slate-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <Camera className="size-4" />
                        Añadir foto
                      </Button>
                    </div>

                    <div className="max-w-md text-left text-sm leading-6 text-amber-900">
                      <p className="font-semibold">En trabajo</p>
                      <p>Pronto habilitaremos fotos y emoticonos. Todavía no tenemos almacenamiento para imágenes.</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200/80" />

                <div className="grid gap-4 px-4 py-5">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Detalles de receta</h3>
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Nombre de receta *</span>
                    <Input
                      autoFocus
                      value={recipeName}
                      onChange={(event) => setRecipeName(normalizeRecipeNameInput(event.target.value))}
                      placeholder="Ej. Ensalada de pollo"
                      className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-700">Compartir con otros</span>
                    <Switch checked={shareRecipe} onCheckedChange={setShareRecipe} />
                  </div>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Porciones</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      step="1"
                      value={portions}
                      onChange={(event) => setPortions(normalizeIntegerInput(event.target.value))}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Instrucciones por pasos</span>
                    <Textarea
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                      placeholder="Escribe un paso por línea"
                      className="min-h-28 rounded-2xl border-slate-200 bg-slate-50/70 px-4 py-3"
                    />
                    <p className="text-xs leading-5 text-slate-500">Pulsa Enter para crear un nuevo paso. Cada línea se guardará como un paso.</p>
                  </label>

                  {instructionSteps.length > 0 ? (
                    <div className="grid gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vista previa de pasos</p>
                      <ol className="grid gap-2">
                        {instructionSteps.slice(0, 6).map((step, index) => (
                          <li key={`${index}-${step}`} className="flex gap-3 rounded-2xl bg-white px-3 py-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-semibold text-white">
                              {index + 1}
                            </span>
                            <p className="text-sm leading-6 text-slate-700">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>Macros de la receta</span>
                      <span className="font-medium text-slate-900">{buildRecipeTotalLabel(totals)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                      <span>Ingredientes añadidos</span>
                      <span className="font-medium text-slate-900">{ingredients.length}</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200/80" />

                <div className="grid min-w-0 gap-4 px-4 py-5">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">Añadir ingredientes *</h3>
                  </div>

                  <label className="relative block w-full min-w-0">
                    <span className="sr-only">Buscar alimento para la receta</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder="Buscar ingrediente..."
                      className="h-12 w-full rounded-2xl border-slate-200 bg-slate-50/80 pl-10 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-cyan-200"
                    />
                  </label>

                  {catalogError ? <p className="text-sm font-medium text-rose-600">{catalogError}</p> : null}

                  {ingredients.length > 0 ? (
                    <div className="grid gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ingredientes seleccionados</p>

                      <div className="divide-y divide-slate-100 border-y border-slate-100">
                        {ingredients.map((ingredient) => (
                          <div key={ingredient.food.id} className="grid gap-3 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-950">{ingredient.food.name}</p>
                                <p className="text-xs text-slate-500">
                                  {ingredient.food.portion ? `Porción base: ${ingredient.food.portion}` : `Base nutricional: ${ingredient.food.gramsReference} g`}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeIngredient(ingredient.food.id)}
                                className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                              <label className="relative block">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={ingredient.quantity}
                                  onChange={(event) => updateIngredientQuantity(ingredient.food.id, event.target.value)}
                                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4 pr-12"
                                />
                                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                  {ingredient.unit}
                                </span>
                              </label>

                              <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-500">
                                <button
                                  type="button"
                                  onClick={() => toggleIngredientUnit(ingredient.food.id, "g")}
                                  className={cn(
                                    "rounded-full px-3 py-1.5 transition",
                                    ingredient.unit === "g" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500"
                                  )}
                                >
                                  g
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleIngredientUnit(ingredient.food.id, "ml")}
                                  className={cn(
                                    "rounded-full px-3 py-1.5 transition",
                                    ingredient.unit === "ml" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500"
                                  )}
                                >
                                  ml
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-medium text-slate-500">
                              {formatRecipeTotalLabel(ingredient.food, parseQuantity(ingredient.quantity), ingredient.unit)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    {isLoadingCatalog ? (
                      <div className="divide-y divide-slate-100 border-y border-slate-100">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="grid gap-2 px-0 py-4">
                            <div className="h-4 w-40 rounded-full bg-slate-200/70" />
                            <div className="h-3 w-28 rounded-full bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    ) : visibleFoods.length > 0 ? (
                      <div className="divide-y divide-slate-100 border-y border-slate-100">
                        {visibleFoods.map((food) => (
                          <button
                            key={food.id}
                            type="button"
                            onClick={() => addIngredient(food)}
                            className="grid w-full min-w-0 gap-3 px-0 py-4 text-left transition hover:bg-slate-50/40"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 space-y-1">
                                <h4 className="truncate text-[1rem] font-semibold text-slate-950">{food.name}</h4>
                                <p className="text-sm text-slate-500">
                                  {food.portion ? `Base: ${food.portion}` : `Referencia: ${food.gramsReference} g`}
                                </p>
                              </div>

                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                                <Plus className="size-3.5" />
                                Agregar
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                        {catalog.length === 0
                          ? "No pudimos cargar el catalogo de alimentos."
                          : "No encontramos alimentos con ese criterio."}
                      </div>
                    )}
                  </div>
                </div>

                {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
              </div>
            </div>

            <div className="border-t border-slate-200/80 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-2xl border-slate-200 bg-white text-slate-700"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  {saving ? "Guardando..." : "Guardar receta"}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {shareRecipe ? "Se compartirá con otros usuarios y aparecerá en Comunidad." : "Quedará como receta privada."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatRecipeTotalLabel(food: DailyLogFoodOption, quantity: number, unit: "g" | "ml") {
  const nutrition = scaleNutrition(
    {
      calories: food.calories,
      proteins: food.proteins,
      carbs: food.carbs,
      fats: food.fats,
    },
    100,
    quantity
  );

  return `${formatQuantityLabel(quantity, unit)} | ${Math.round(nutrition.calories)} kcal | P ${Math.round(nutrition.proteins)}g | G ${Math.round(nutrition.fats)}g | C ${Math.round(nutrition.carbs)}g`;
}
