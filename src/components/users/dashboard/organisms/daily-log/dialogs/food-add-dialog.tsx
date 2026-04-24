"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, CalendarDays, ChevronRight, Loader2, Search, Sparkles } from "lucide-react";

import { loadMyRecipesAction } from "@/actions/server/users/dashboard/recipes/my-recipes-actions";
import { loadSharedRecipesAction, type SharedRecipeSummary } from "@/actions/server/users/dashboard/recipes/recipe-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toDateKey } from "@/lib/date-labels";

import { createDashboardFoodAction, loadDailyLogFoodCatalogAction } from "@/actions/server/users/dashboard/daily-log/food-actions";
import { addDashboardMealQuickEntryAction } from "@/actions/server/users/dashboard/daily-log/quick-entry-actions";
import { applyGeneratedMealAction } from "@/actions/server/users/dashboard/daily-log/daily-log-actions";
import type { DailyLogFoodOption } from "@/actions/server/users/dashboard/daily-log/types";
import type { UserDashboardMeal, UserDashboardWeeklyRecipeDay } from "@/actions/server/users/types";
import { SettingsScreenHeader } from "../../../settings/shared/settings-screen-header";
import { FoodAddDialogActionsMenu } from "./food-add-dialog-actions-menu";
import { FoodAddDialogCatalogTabs, type FoodAddDialogCatalogTab } from "./food-add-dialog-catalog-tabs";
import { AiGeneratedRecipesAccordion } from "./ai-generated-recipes-accordion";
import { GeneratedMealViewDialog } from "./generated-meal-view-dialog";
import { FoodCreateDialog, type FoodCreateResult, type FoodCreateValues } from "./food-create-dialog";
import { RecipeViewDialog } from "./recipe-view-dialog";
import { RecipeCreateDialog } from "./recipe-create-dialog";
import { FoodQuickEntryDialog, type FoodQuickEntryValues } from "./food-quick-entry-dialog";

import { MAX_INGREDIENT_QUANTITY } from "@/actions/server/users/dashboard/daily-log/constants";

type FoodAddDialogInitialAction = "quick-entry" | "recipe-create";

export type FoodAddValues = {
  food: DailyLogFoodOption;
  quantity: number;
  unit: "g" | "ml";
};

type FoodAddResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

type FoodAddDialogProps = {
  open: boolean;
  mealTitle: string;
  mealId: string | number;
  currentUserId?: number;
  initialFoods?: DailyLogFoodOption[];
  generatedRecipeDays?: UserDashboardWeeklyRecipeDay[];
  selectedDateIso: string;
  initialCatalogTab?: FoodAddDialogCatalogTab;
  initialAction?: FoodAddDialogInitialAction;
  generatedRecipeDateIso?: string | null;
  generatedRecipeMealType?: string | null;
  onOpenChange: (open: boolean) => void;
  onAddFood: (values: FoodAddValues) => Promise<FoodAddResult> | FoodAddResult;
};

const FOOD_DISPLAY_LIMIT = 20;
const RECIPE_DISPLAY_LIMIT = 12;
const REFRESH_EVENT = "fitbalance:shared-recipes-updated";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatQuantity(quantity: number) {
  const rounded = Number(quantity.toFixed(1));
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : rounded.toFixed(1);
}

function clampQuantity(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), MAX_INGREDIENT_QUANTITY);
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

  return String(Number(clampQuantity(parsedValue).toFixed(1)));
}

function isBeverageFood(food: DailyLogFoodOption) {
  return food.isBeverage || normalizeText(`${food.categoryEnum ?? ""} ${food.categoryLabel ?? ""}`).includes("bebid");
}

function isRecipeCatalogTab(tab: FoodAddDialogCatalogTab) {
  return tab === "my-recipes" || tab === "recipes";
}

function getCatalogTitle(tab: FoodAddDialogCatalogTab) {
  if (tab === "my-recipes") {
    return "Mis recetas";
  }

  if (tab === "recipes") {
    return "Recetas";
  }

  return "Añadir alimento";
}

function getCatalogEyebrow(tab: FoodAddDialogCatalogTab) {
  return isRecipeCatalogTab(tab) ? "Recetas de" : "Alimentos de";
}

function getCatalogDescription(tab: FoodAddDialogCatalogTab) {
  if (tab === "my-recipes") {
    return "Revisa las recetas que has creado y abre una tarjeta para ver el detalle.";
  }

  if (tab === "recipes") {
    return "Explora las recetas compartidas por la comunidad.";
  }

  return "Busca un alimento, filtra por categoría y abre la ficha de detalle.";
}

function getSearchPlaceholder(tab: FoodAddDialogCatalogTab) {
  return isRecipeCatalogTab(tab) ? "Buscar recetas..." : "Buscar alimentos y porciones...";
}

function getRecipeTabLabel(tab: FoodAddDialogCatalogTab) {
  if (tab === "my-recipes") {
    return "No has creado recetas todavía.";
  }

  return "No hay recetas compartidas.";
}

function scaleNutrition(food: DailyLogFoodOption, quantity: number) {
  const ratio = quantity > 0 ? quantity / 100 : 0;

  return {
    calories: Number(((food.calories * ratio).toFixed(1))),
    proteins: Number(((food.proteins * ratio).toFixed(1))),
    carbs: Number(((food.carbs * ratio).toFixed(1))),
    fats: Number(((food.fats * ratio).toFixed(1))),
  };
}

function macroLabel(value: number, unit: string) {
  return unit ? `${formatQuantity(value)}${unit}` : formatQuantity(value);
}

function shuffleFoods<T>(items: T[]) {
  if (items.length <= 1) {
    return items;
  }

  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = shuffled[index];
    shuffled[index] = shuffled[randomIndex] as T;
    shuffled[randomIndex] = current as T;
  }

  return shuffled;
}

function formatRecipeDateLabel(value: string | null) {
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

function formatRecipeMacroLine(recipe: SharedRecipeSummary) {
  return `Cal. ${formatQuantity(recipe.totals.calories)} · Prot. ${macroLabel(recipe.totals.proteins, "g")} · Carb. ${macroLabel(
    recipe.totals.carbs,
    "g"
  )} · Grasa ${macroLabel(recipe.totals.fats, "g")}`;
}

function matchesRecipeSearch(recipe: SharedRecipeSummary, query: string) {
  if (query.length === 0) {
    return true;
  }

  const ingredients = recipe.ingredients
    .map((ingredient) => `${ingredient.name} ${ingredient.category ?? ""} ${ingredient.portionLabel}`)
    .join(" ");

  return normalizeText(`${recipe.name} ${ingredients} ${recipe.instructions.join(" ")}`).includes(query);
}

function matchesCatalogTab(food: DailyLogFoodOption, tab: FoodAddDialogCatalogTab) {
  if (tab === "favorites") {
    return food.isFavorite === true;
  }

  if (tab === "mine") {
    return food.isMine === true;
  }

  return true;
}

export function FoodAddDialog({
  open,
  mealTitle,
  mealId,
  currentUserId,
  initialFoods,
  generatedRecipeDays,
  selectedDateIso,
  initialCatalogTab,
  initialAction,
  generatedRecipeDateIso,
  generatedRecipeMealType,
  onOpenChange,
  onAddFood,
}: FoodAddDialogProps) {
  const router = useRouter();
  const isMobileLayout = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);
  const [foods, setFoods] = useState<DailyLogFoodOption[]>(initialFoods ?? []);
  const [myRecipes, setMyRecipes] = useState<SharedRecipeSummary[]>([]);
  const [sharedRecipes, setSharedRecipes] = useState<SharedRecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recipeLoadError, setRecipeLoadError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [catalogTab, setCatalogTab] = useState<FoodAddDialogCatalogTab>("all");
  const [selectedFood, setSelectedFood] = useState<DailyLogFoodOption | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<SharedRecipeSummary | null>(null);
  const [selectedGeneratedMeal, setSelectedGeneratedMeal] = useState<UserDashboardMeal | null>(null);
  const [selectedGeneratedMealDayLabel, setSelectedGeneratedMealDayLabel] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<"g" | "ml">("g");
  const [addError, setAddError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [foodCreateOpen, setFoodCreateOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [recipeCreateOpen, setRecipeCreateOpen] = useState(false);
  const initialActionAppliedRef = useRef<FoodAddDialogInitialAction | null>(null);

  const isFullScreen = useMemo(() => isMobileLayout || isStandalone, [isMobileLayout, isStandalone]);
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());
  const isRecipeTab = isRecipeCatalogTab(catalogTab);
  const dialogTitle = selectedFood ? selectedFood.name : getCatalogTitle(catalogTab);
  const dialogEyebrow = getCatalogEyebrow(catalogTab);
  const dialogDescription = selectedFood
    ? "Ajusta la porción y confirma para sumarlo a la comida elegida."
    : getCatalogDescription(catalogTab);
  const searchPlaceholder = getSearchPlaceholder(catalogTab);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!open) {
      return;
    }

    setLoadError(null);
    setAddError(null);
    setSelectedFood(null);
    setSearchValue("");
    setCatalogTab(initialCatalogTab ?? "all");
    setQuantity("100");
    setUnit("g");
    setFoodCreateOpen(false);
    setQuickEntryOpen(false);
    setRecipeCreateOpen(false);
    setSelectedRecipe(null);
    setSelectedGeneratedMeal(null);
    setSelectedGeneratedMealDayLabel(null);

    const loadRecipes = async () => {
      setIsLoadingRecipes(true);
      setRecipeLoadError(null);

      const [myRecipesResult, sharedRecipesResult] = await Promise.allSettled([
        loadMyRecipesAction(),
        loadSharedRecipesAction(),
      ]);

      if (cancelled) {
        return;
      }

      const nextMyRecipes =
        myRecipesResult.status === "fulfilled" && myRecipesResult.value.ok ? myRecipesResult.value.recipes ?? [] : [];
      const nextSharedRecipes =
        sharedRecipesResult.status === "fulfilled" && sharedRecipesResult.value.ok ? sharedRecipesResult.value.recipes ?? [] : [];

      setMyRecipes(nextMyRecipes);
      setSharedRecipes(nextSharedRecipes);

      const myRecipesError =
        myRecipesResult.status === "fulfilled"
          ? myRecipesResult.value.ok
            ? null
            : myRecipesResult.value.error ?? "No pudimos cargar tus recetas."
          : "No pudimos cargar tus recetas.";
      const sharedRecipesError =
        sharedRecipesResult.status === "fulfilled"
          ? sharedRecipesResult.value.ok
            ? null
            : sharedRecipesResult.value.error ?? "No pudimos cargar las recetas compartidas."
          : "No pudimos cargar las recetas compartidas.";

      setRecipeLoadError(myRecipesError ?? sharedRecipesError);
      setIsLoadingRecipes(false);
    };

    const loadFoods = async () => {
      setIsLoading(true);

      const foodsResult = await loadDailyLogFoodCatalogAction(currentUserId);

      if (cancelled) {
        return;
      }

      if (foodsResult.ok) {
        setFoods(foodsResult.foods ?? []);
        setLoadError(null);
      } else {
        setFoods([]);
        setLoadError(foodsResult.error ?? "No pudimos cargar los alimentos.");
      }

      setIsLoading(false);
    };

    if (initialFoods && initialFoods.length > 0) {
      setFoods(initialFoods);
      setIsLoading(false);
    } else {
      void loadFoods();
    }

    void loadRecipes();

    const handleRefresh = () => {
      void loadRecipes();
    };

    window.addEventListener(REFRESH_EVENT, handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(REFRESH_EVENT, handleRefresh);
    };
  }, [currentUserId, initialCatalogTab, initialFoods, open]);

  useEffect(() => {
    if (!open) {
      initialActionAppliedRef.current = null;
      return;
    }

    if (!initialAction || initialActionAppliedRef.current === initialAction) {
      return;
    }

    initialActionAppliedRef.current = initialAction;

    if (initialAction === "quick-entry") {
      setQuickEntryOpen(true);
      return;
    }

    if (initialAction === "recipe-create") {
      setCatalogTab("my-recipes");
      setRecipeCreateOpen(true);
    }
  }, [initialAction, open]);

  const filteredFoods = useMemo(() => {
    if (isRecipeCatalogTab(catalogTab)) {
      return [];
    }

    return foods.filter((food) => {
      if (!matchesCatalogTab(food, catalogTab)) {
        return false;
      }

      const haystack = normalizeText(`${food.name} ${food.categoryLabel ?? ""} ${food.categoryEnum ?? ""} ${food.portion ?? ""}`);
      return deferredSearch.length === 0 || haystack.includes(deferredSearch);
    });
  }, [catalogTab, deferredSearch, foods]);

  const filteredRecipes = useMemo(() => {
    if (!isRecipeCatalogTab(catalogTab)) {
      return [];
    }

    const sourceRecipes = catalogTab === "my-recipes" ? myRecipes : sharedRecipes;

    return sourceRecipes.filter((recipe) => matchesRecipeSearch(recipe, deferredSearch));
  }, [catalogTab, deferredSearch, myRecipes, sharedRecipes]);

  const { visibleFoods, totalFilteredFoods } = useMemo(() => {
    const orderedFoods =
      deferredSearch.length > 0
        ? [...filteredFoods].sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" }))
        : shuffleFoods(filteredFoods);

    return {
      visibleFoods: orderedFoods.slice(0, FOOD_DISPLAY_LIMIT),
      totalFilteredFoods: filteredFoods.length,
    };
  }, [deferredSearch.length, filteredFoods]);

  const { visibleRecipes, totalFilteredRecipes } = useMemo(() => {
    const orderedRecipes =
      deferredSearch.length > 0
        ? [...filteredRecipes].sort((left, right) => left.name.localeCompare(right.name, "es", { sensitivity: "base" }))
        : filteredRecipes;

    return {
      visibleRecipes: orderedRecipes.slice(0, RECIPE_DISPLAY_LIMIT),
      totalFilteredRecipes: filteredRecipes.length,
    };
  }, [deferredSearch.length, filteredRecipes]);
  const hasGeneratedRecipeDays = (generatedRecipeDays?.length ?? 0) > 0;
  const showGeneratedRecipeSection = catalogTab === "my-recipes" && hasGeneratedRecipeDays;

  const resultCountLabel = isRecipeTab
    ? isLoadingRecipes
      ? "Cargando recetas..."
      : showGeneratedRecipeSection
        ? `${visibleRecipes.length} receta${visibleRecipes.length === 1 ? "" : "s"} propias · bloque IA debajo`
        : `${visibleRecipes.length} de ${totalFilteredRecipes} receta${totalFilteredRecipes === 1 ? "" : "s"}`
    : isLoading
      ? "Cargando alimentos..."
      : `${visibleFoods.length} de ${totalFilteredFoods} resultado${totalFilteredFoods === 1 ? "" : "s"}`;
  const showGeneratedRecipeSeparator = showGeneratedRecipeSection && (isLoadingRecipes || visibleRecipes.length > 0);

  const selectedNutrition = useMemo(() => {
    if (!selectedFood) {
      return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
    }

    return scaleNutrition(selectedFood, Number(quantity));
  }, [quantity, selectedFood]);

  const emptyCatalogMessage = useMemo(() => {
    if (isRecipeCatalogTab(catalogTab)) {
      if (deferredSearch.length > 0) {
        return "No encontramos recetas con ese criterio.";
      }

      return getRecipeTabLabel(catalogTab);
    }

    if (deferredSearch.length > 0) {
      return "No encontramos alimentos con ese criterio.";
    }

    if (catalogTab === "favorites") {
      return "No hay alimentos favoritos.";
    }

    if (catalogTab === "mine") {
      return "No hay alimentos creados por ti.";
    }

    return "No encontramos alimentos con ese criterio.";
  }, [catalogTab, deferredSearch]);

  function handleBack() {
    if (selectedFood) {
      setSelectedFood(null);
      setAddError(null);
      return;
    }

    if (selectedRecipe) {
      setSelectedRecipe(null);
      return;
    }

    if (selectedGeneratedMeal) {
      setSelectedGeneratedMeal(null);
      setSelectedGeneratedMealDayLabel(null);
      return;
    }

    onOpenChange(false);
  }

  function handleOpenQuickEntry() {
    setAddError(null);
    setQuickEntryOpen(true);
  }

  function handleOpenFoodCreate() {
    setAddError(null);
    setFoodCreateOpen(true);
  }

  function handleOpenRecipeCreate() {
    setAddError(null);
    setCatalogTab("my-recipes");
    setRecipeCreateOpen(true);
  }

  function handleQuickEntryOpenChange(nextOpen: boolean) {
    setQuickEntryOpen(nextOpen);

    if (!nextOpen) {
      onOpenChange(false);
    }
  }

  function handleRecipeCreateOpenChange(nextOpen: boolean) {
    setRecipeCreateOpen(nextOpen);

    if (!nextOpen) {
      onOpenChange(false);
    }
  }

  function handleViewRecommendedRecipe() {
    setAddError(null);
    setCatalogTab("my-recipes");

    const targetDateKey = selectedDateIso.trim();
    const normalizedMealTitle = normalizeText(mealTitle);
    const fallbackDayLabel = formatRecipeDateLabel(selectedDateIso) ?? mealTitle;

    const matchingDay = generatedRecipeDays?.find((day) => toDateKey(new Date(day.dateIso)) === targetDateKey) ?? null;
    const matchingMeal =
      matchingDay?.meals.find((meal) => normalizeText(meal.mealType) === normalizedMealTitle) ??
      matchingDay?.meals[0] ??
      generatedRecipeDays?.find((day) => day.meals.length > 0)?.meals[0] ??
      null;

    if (matchingMeal && matchingDay) {
      handleOpenGeneratedMeal({ dayLabel: matchingDay.dayLabel, meal: matchingMeal });
      return;
    }

    if (matchingMeal) {
      handleOpenGeneratedMeal({ dayLabel: matchingDay?.dayLabel ?? fallbackDayLabel, meal: matchingMeal });
    }
  }

  async function handleSaveFood(values: FoodCreateValues): Promise<FoodCreateResult> {
    const result = await Promise.resolve(
      createDashboardFoodAction({
        name: values.name,
        categoryEnum: values.categoryEnum,
        portion: values.portion,
        portionAmount: values.portionAmount,
        calories: values.calories,
        proteins: values.proteins,
        carbs: values.carbs,
        fats: values.fats,
        share: values.share,
      })
    );

    if (result.ok && result.food) {
      setFoods((currentFoods) => {
        const withoutDuplicate = currentFoods.filter((food) => food.id !== result.food?.id);
        return [result.food as DailyLogFoodOption, ...withoutDuplicate];
      });
      setCatalogTab("mine");
      setSearchValue("");
      router.refresh();
      onOpenChange(false);
    }

    return result;
  }

  async function handleSaveQuickEntry(values: FoodQuickEntryValues) {
    const result = await Promise.resolve(
      addDashboardMealQuickEntryAction({
        dateIso: selectedDateIso,
        mealId: Number(mealId),
        name: values.name,
        grams: values.grams,
        calories: values.calories,
        carbs: values.carbs,
        carbMode: values.carbMode,
        sugarAlcohols: values.sugarAlcohols,
        fiber: values.fiber,
        allulose: values.allulose,
        proteins: values.proteins,
        fats: values.fats,
        glycemicLoad: values.glycemicLoad ?? undefined,
        notes: values.notes.trim().length > 0 ? values.notes.trim() : undefined,
        share: values.share,
      })
    );

    if (result.ok) {
      if (values.share) {
        window.dispatchEvent(new Event("fitbalance:shared-recipes-updated"));
      }

      router.refresh();
      setQuickEntryOpen(false);
      onOpenChange(false);
    }

    return result;
  }

  function handleSelectFood(food: DailyLogFoodOption) {
    setSelectedFood(food);
    setAddError(null);
    setQuantity(String(Math.max(food.gramsReference, 1)));
    setUnit(isBeverageFood(food) ? "ml" : "g");
  }

  function handleSelectRecipe(recipe: SharedRecipeSummary) {
    setSelectedGeneratedMeal(null);
    setSelectedGeneratedMealDayLabel(null);
    setSelectedRecipe(recipe);
  }

  function handleOpenGeneratedMeal(input: { dayLabel: string; meal: UserDashboardMeal }) {
    setSelectedRecipe(null);
    setSelectedGeneratedMeal(input.meal);
    setSelectedGeneratedMealDayLabel(input.dayLabel);
  }

  async function handleApplyGeneratedMeal(meal: UserDashboardMeal) {
    const result = await applyGeneratedMealAction({
      dateIso: selectedDateIso,
      mealId: Number(meal.id),
    });

    if (result.ok) {
      router.refresh();
    }

    return result;
  }

  async function handleAdd() {
    if (!selectedFood) {
      return;
    }

    const numericQuantity = clampQuantity(Number(quantity));
    const roundedQuantity = Number(numericQuantity.toFixed(1));

    if (roundedQuantity <= 0) {
      setAddError("Ingresa una cantidad mayor a cero.");
      return;
    }

    setIsSaving(true);
    setAddError(null);

    try {
      const result = await Promise.resolve(
        onAddFood({
          food: selectedFood,
          quantity: roundedQuantity,
          unit,
        })
      );

      if (!result.ok) {
        setAddError(result.error ?? "No se pudo añadir el alimento.");
        return;
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      setAddError("No se pudo añadir el alimento.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onOpenChange(false)}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          isFullScreen
            ? "!fixed !inset-0 !z-[100] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-slate-50 !p-0 !shadow-none !overflow-hidden"
            : "h-[calc(100dvh-2rem)] w-[min(100vw-2rem,48rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
        )}
      >
        <div className={cn("flex h-full min-h-0 w-full flex-col", isFullScreen ? "bg-slate-50" : "bg-white")}>
          {isFullScreen ? (
            <SettingsScreenHeader
              title={dialogTitle}
              name={mealTitle}
              onBack={handleBack}
            />
          ) : (
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{dialogEyebrow} {mealTitle}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{dialogTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{dialogDescription}</p>
              </div>

              <div className="flex items-center gap-2">
                {selectedFood ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => onOpenChange(false)}
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {selectedFood ? (
              <div className="border-b border-slate-200/80 bg-white px-4 py-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{selectedFood.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {selectedFood.portion ? `Porción base: ${selectedFood.portion}` : `Base nutricional: ${selectedFood.gramsReference} g`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-400">Prot.</p>
                      <p className="mt-1 text-lg font-semibold text-blue-700">{macroLabel(selectedNutrition.proteins, "g")}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400">Carbs</p>
                      <p className="mt-1 text-lg font-semibold text-rose-700">{macroLabel(selectedNutrition.carbs, "g")}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Cal.</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{formatQuantity(selectedNutrition.calories)}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">Grasa</p>
                      <p className="mt-1 text-lg font-semibold text-amber-700">{macroLabel(selectedNutrition.fats, "g")}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-b border-slate-200/80 bg-white px-4 pb-4 pt-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <FoodAddDialogCatalogTabs value={catalogTab} onValueChange={setCatalogTab} className="min-w-0" />
                  <FoodAddDialogActionsMenu
                    onQuickEntry={handleOpenQuickEntry}
                    onCreateFood={handleOpenFoodCreate}
                    onCreateRecipe={handleOpenRecipeCreate}
                    onViewAiRecipe={handleViewRecommendedRecipe}
                    className="ml-1"
                  />
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="relative block">
                    <span className="sr-only">Buscar {isRecipeTab ? "receta" : "alimento"}</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchValue}
                      onChange={(event) => setSearchValue(event.target.value)}
                      placeholder={searchPlaceholder}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/80 pl-10 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-cyan-200"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                    <p>{resultCountLabel}</p>
                  </div>
                </div>
              </div>
            )}

            <div
              className={cn(
                "no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y",
                isFullScreen ? "p-4 pl-4" : "px-5 py-5 pl-5"
              )}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {selectedFood ? (
                <div className="grid gap-4 px-4 py-4">
                  <div className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-100">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Porción</p>
                        <p className="text-xs text-slate-500">Ajusta la cantidad antes de añadir.</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {isBeverageFood(selectedFood) ? "ml" : "g"}
                      </span>
                    </div>

                    <div className="grid gap-3">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">Cantidad</span>
                        <Input
                          type="number"
                          min="0"
                          max={MAX_INGREDIENT_QUANTITY}
                          step="0.1"
                          inputMode="decimal"
                          value={quantity}
                          onChange={(event) => setQuantity(normalizeQuantityInput(event.target.value))}
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {["g", "ml"].map((nextUnit) => (
                          <button
                            key={nextUnit}
                            type="button"
                            onClick={() => setUnit(nextUnit as "g" | "ml")}
                            className={cn(
                              "rounded-xl px-4 py-3 transition",
                              unit === nextUnit ? "bg-white text-teal-600 shadow-sm" : "text-slate-500"
                            )}
                          >
                            {nextUnit}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <Sparkles className="size-4 shrink-0 text-teal-500" />
                      <span>Este alimento se añadirá a {mealTitle} y recalculará los macros del día al guardar.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {isRecipeTab ? (
                    <>
                      {recipeLoadError ? (
                        <div className="border-b border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                          {recipeLoadError}
                        </div>
                      ) : null}

                      {showGeneratedRecipeSection ? (
                        <AiGeneratedRecipesAccordion
                          days={generatedRecipeDays ?? []}
                          onOpenMeal={handleOpenGeneratedMeal}
                          searchQuery={deferredSearch}
                          preferredDateIso={generatedRecipeDateIso}
                          preferredMealType={generatedRecipeMealType}
                          className="px-4 py-4"
                        />
                      ) : null}

                      {showGeneratedRecipeSeparator ? <Separator className="bg-slate-200/80" /> : null}

                      {isLoadingRecipes ? (
                        <div className="grid gap-0 border-y border-slate-200/80 bg-white">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index}>
                              <div className="grid gap-3 px-4 py-4">
                                <div className="h-4 w-40 rounded-full bg-slate-200/70" />
                                <div className="h-3 w-28 rounded-full bg-slate-100" />
                                <div className="h-4 w-56 rounded-full bg-slate-100" />
                              </div>
                              {index < 3 ? <Separator className="bg-slate-200/80" /> : null}
                            </div>
                          ))}
                        </div>
                      ) : visibleRecipes.length > 0 ? (
                        <div className="grid gap-0 border-y border-slate-200/80 bg-white">
                          {visibleRecipes.map((recipe, index) => (
                            <div key={recipe.id}>
                              <button
                                type="button"
                                onClick={() => handleSelectRecipe(recipe)}
                                className="grid gap-2 px-4 py-4 text-left transition hover:bg-slate-50"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="truncate text-[1.05rem] font-semibold tracking-tight text-slate-950">
                                      {recipe.name}
                                    </h3>
                                    <p className="text-sm leading-6 text-slate-500">
                                      {recipe.ingredientCount} ingredientes · {recipe.portions} porciones
                                    </p>
                                  </div>

                                  <Badge variant="outline" className="rounded-full">
                                    {selectedRecipe?.id === recipe.id ? "Abierta" : "Ver"}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    <CalendarDays className="size-3.5" />
                                    {formatRecipeDateLabel(recipe.sharedAtIso) ?? (catalogTab === "my-recipes" ? "Receta propia" : "Receta compartida")}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-emerald-600">
                                    Ver receta <ChevronRight className="size-4" />
                                  </span>
                                </div>

                                <p className="text-sm font-medium text-slate-700">{formatRecipeMacroLine(recipe)}</p>
                              </button>

                              {index < visibleRecipes.length - 1 ? <Separator className="bg-slate-200/80" /> : null}
                            </div>
                          ))}
                        </div>
                      ) : hasGeneratedRecipeDays ? null : (
                        <div className="px-4 py-8 text-center text-sm text-slate-600">{emptyCatalogMessage}</div>
                      )}
                    </>
                  ) : (
                    <>
                      {loadError ? (
                        <div className="border-b border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                          {loadError}
                        </div>
                      ) : null}

                      {isLoading ? (
                        <div className="divide-y divide-slate-100 border-b border-slate-200/80">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="grid gap-3 px-4 py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="grid gap-2">
                                  <div className="h-4 w-40 rounded-full bg-slate-200/70" />
                                  <div className="h-3 w-28 rounded-full bg-slate-100" />
                                </div>
                                <div className="grid gap-2 text-right">
                                  <div className="h-4 w-12 rounded-full bg-slate-100" />
                                  <div className="h-4 w-14 rounded-full bg-slate-100" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : visibleFoods.length > 0 ? (
                        <div className="divide-y divide-slate-100 border-b border-slate-200/80">
                          {visibleFoods.map((food) => (
                            <button
                              key={food.id}
                              type="button"
                              onClick={() => handleSelectFood(food)}
                              className="grid gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                            >
                              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                                <div className="min-w-0 space-y-1.5">
                                  <h3 className="truncate text-[1.05rem] font-semibold tracking-tight text-slate-950">{food.name}</h3>
                                  <p className="text-sm leading-6 text-slate-500">
                                    {food.portion ? `Porción: ${food.portion}` : `Base nutricional: ${food.gramsReference} g`}
                                  </p>
                                </div>

                                <div className="grid gap-1 text-right text-sm leading-5 tabular-nums">
                                  <div className="flex items-baseline justify-end gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">Prot.</span>
                                    <span className="font-semibold text-blue-700">{macroLabel(food.proteins, "g")}</span>
                                  </div>
                                  <div className="flex items-baseline justify-end gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-400">Carbs</span>
                                    <span className="font-semibold text-rose-700">{macroLabel(food.carbs, "g")}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-sm text-slate-600">
                          {foods.length === 0 ? "No pudimos cargar el catalogo de alimentos." : emptyCatalogMessage}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {selectedFood ? (
              <div className="border-t border-slate-200/80 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5">
                {addError ? <p className="mb-3 text-sm font-medium text-rose-600">{addError}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    <p className="font-semibold text-slate-950">{mealTitle}</p>
                    <p>Este alimento se sumará a la comida seleccionada.</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 rounded-2xl border-slate-200 bg-white px-5"
                      onClick={handleBack}
                      disabled={isSaving}
                    >
                      Volver
                    </Button>
                    <Button
                      type="button"
                      className="h-12 rounded-2xl bg-emerald-500 px-6 text-white hover:bg-emerald-600"
                      onClick={handleAdd}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
                      {isSaving ? "Añadiendo..." : "Añadir"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <RecipeViewDialog
      recipe={selectedRecipe}
      open={Boolean(selectedRecipe)}
      onOpenChange={(nextOpen) => !nextOpen && setSelectedRecipe(null)}
    />

    <GeneratedMealViewDialog
      meal={selectedGeneratedMeal}
      dayLabel={selectedGeneratedMealDayLabel}
      open={Boolean(selectedGeneratedMeal)}
      onApply={handleApplyGeneratedMeal}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelectedGeneratedMeal(null);
          setSelectedGeneratedMealDayLabel(null);
        }
      }}
    />

    <FoodQuickEntryDialog
      open={quickEntryOpen}
      mealTitle={mealTitle}
      onOpenChange={handleQuickEntryOpenChange}
      onSaveQuickEntry={handleSaveQuickEntry}
    />

    <FoodCreateDialog
      open={foodCreateOpen}
      onOpenChange={setFoodCreateOpen}
      onSaveFood={handleSaveFood}
    />

    <RecipeCreateDialog
      open={recipeCreateOpen}
      onOpenChange={handleRecipeCreateOpenChange}
      initialFoods={foods}
    />

    </>
  );
}
