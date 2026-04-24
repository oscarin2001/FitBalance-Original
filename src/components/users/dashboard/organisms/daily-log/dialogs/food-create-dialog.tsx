"use client";

import { useEffect, useMemo, useState } from "react";

import { Camera, Loader2, Sparkles, X } from "lucide-react";

import { FOOD_CREATE_CATEGORIES, FOOD_CREATE_DEFAULT_CATEGORY, getFoodCreateCategoryLabel, type FoodCreateCategoryValue } from "@/actions/server/users/dashboard/daily-log/food-create-options";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { MAX_INGREDIENT_QUANTITY } from "@/actions/server/users/dashboard/daily-log/constants";
import { formatQuantityLabel, scaleNutrition } from "@/actions/server/users/dashboard/daily-log/meal-formatters";

type FoodCreateValues = {
  name: string;
  categoryEnum: FoodCreateCategoryValue;
  portion: string;
  portionAmount: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  share: boolean;
};

type FoodCreateResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

type FoodCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveFood: (values: FoodCreateValues) => Promise<FoodCreateResult> | FoodCreateResult;
};

function normalizeText(value: string) {
  return value.replace(/\d/g, "");
}

function normalizeNumberInput(value: string, maxValue: number) {
  const cleanedValue = value.replace(/[^\d.,]/g, "").replace(",", ".");

  if (cleanedValue.trim().length === 0) {
    return "";
  }

  const parsedValue = Number(cleanedValue);
  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  return String(Math.min(Math.max(parsedValue, 0), maxValue));
}

function parseNumber(value: string, maxValue: number) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return Math.min(Math.max(parsedValue, 0), maxValue);
}

function categoryIsBeverage(categoryEnum: FoodCreateCategoryValue) {
  return categoryEnum === "BebidasInfusiones";
}

export function FoodCreateDialog({ open, onOpenChange, onSaveFood }: FoodCreateDialogProps) {
  const isMobileLayout = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryEnum, setCategoryEnum] = useState<FoodCreateCategoryValue>(FOOD_CREATE_DEFAULT_CATEGORY);
  const [portionAmount, setPortionAmount] = useState("100");
  const [portionUnit, setPortionUnit] = useState<"g" | "ml">("g");
  const [calories, setCalories] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [share, setShare] = useState(true);

  const isFullScreen = isMobileLayout || isStandalone;

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

    setSaving(false);
    setError(null);
    setName("");
    setCategoryEnum(FOOD_CREATE_DEFAULT_CATEGORY);
    setPortionAmount("100");
    setPortionUnit("g");
    setCalories("");
    setProteins("");
    setCarbs("");
    setFats("");
    setShare(true);
  }, [open]);

  const previewNutrition = useMemo(() => {
    const parsedCalories = parseNumber(calories, 100000) ?? 0;
    const parsedProteins = parseNumber(proteins, 100000) ?? 0;
    const parsedCarbs = parseNumber(carbs, 100000) ?? 0;
    const parsedFats = parseNumber(fats, 100000) ?? 0;
    const parsedPortionAmount = parseNumber(portionAmount, MAX_INGREDIENT_QUANTITY) ?? 100;

    return scaleNutrition(
      {
        calories: parsedCalories,
        proteins: parsedProteins,
        carbs: parsedCarbs,
        fats: parsedFats,
      },
      Math.max(parsedPortionAmount, 1),
      Math.max(parsedPortionAmount, 1)
    );
  }, [calories, carbs, fats, portionAmount, proteins]);

  async function handleSave() {
    const normalizedName = name.trim();

    if (!normalizedName) {
      setError("Ingresa un nombre para el alimento.");
      return;
    }

    const parsedPortionAmount = parseNumber(portionAmount, MAX_INGREDIENT_QUANTITY);
    const parsedCalories = parseNumber(calories, 100000);
    const parsedProteins = parseNumber(proteins, 100000);
    const parsedCarbs = parseNumber(carbs, 100000);
    const parsedFats = parseNumber(fats, 100000);

    if (
      parsedPortionAmount === null ||
      parsedPortionAmount <= 0 ||
      parsedCalories === null ||
      parsedProteins === null ||
      parsedCarbs === null ||
      parsedFats === null
    ) {
      setError("Revisa los valores del alimento.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await Promise.resolve(
        onSaveFood({
          name: normalizedName,
          categoryEnum,
          portion: `${formatQuantityLabel(parsedPortionAmount, portionUnit)}`,
          portionAmount: parsedPortionAmount,
          calories: parsedCalories,
          proteins: parsedProteins,
          carbs: parsedCarbs,
          fats: parsedFats,
          share,
        })
      );

      if (!result.ok) {
        setError(result.error ?? "No pudimos guardar el alimento.");
        return;
      }

      onOpenChange(false);
    } catch (caughtError) {
      console.error(caughtError);
      setError("No pudimos guardar el alimento.");
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
            ? "!fixed !inset-0 !z-[275] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-white !p-0 !shadow-none !overflow-hidden"
            : "z-[275] h-[calc(100dvh-2rem)] w-[min(100vw-2rem,44rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
        )}
      >
        <div className="flex h-full min-h-0 w-full flex-col bg-white">
          <DialogHeader className="relative flex items-center justify-center border-b border-slate-200 px-4 py-3 pt-[env(safe-area-inset-top)]">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute left-3 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-5" />
            </Button>

            <DialogTitle className="text-[1.05rem] font-semibold tracking-tight text-slate-950">Crear alimento</DialogTitle>
            <DialogDescription className="sr-only">Crear un alimento personalizado</DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              className={cn(
                "no-scrollbar flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y",
                isFullScreen ? "p-4 pl-4" : "px-5 py-5 pl-5"
              )}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="grid gap-4 pb-4">
                <div className="grid gap-4 px-4 py-5">
                  <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center">
                    <div className="flex size-20 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-300 shadow-inner">
                      <Sparkles className="size-8" />
                    </div>

                    <div className="max-w-md text-left text-sm leading-6 text-slate-600">
                      <p className="font-semibold text-slate-900">Alta de alimento</p>
                      <p>Guarda un alimento personalizado. Si lo compartes, seguirá apareciendo en tu tab de Mis alimentos.</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200/80" />

                <div className="grid gap-4 px-4 py-5">
                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-slate-700">Nombre del alimento *</span>
                    <Input
                      autoFocus
                      value={name}
                      onChange={(event) => setName(normalizeText(event.target.value))}
                      placeholder="Ej. Yogur griego"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                    />
                  </label>

                  <div className="grid gap-3">
                    <span className="text-sm font-medium text-slate-700">Categoría</span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {FOOD_CREATE_CATEGORIES.map((category) => {
                        const isActive = category.value === categoryEnum;

                        return (
                          <button
                            key={category.value}
                            type="button"
                            onClick={() => setCategoryEnum(category.value)}
                            className={cn(
                              "rounded-2xl border px-3 py-3 text-left text-sm transition",
                              isActive
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <span className="block font-semibold">{category.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Porción base</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={portionAmount}
                        onChange={(event) => setPortionAmount(normalizeNumberInput(event.target.value, MAX_INGREDIENT_QUANTITY))}
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                      />
                    </label>

                    <div className="grid gap-2">
                      <span className="text-sm font-medium text-slate-700">Unidad</span>
                      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {[
                          { value: "g", label: "g" },
                          { value: "ml", label: "ml" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setPortionUnit(option.value as "g" | "ml")}
                            className={cn(
                              "rounded-xl px-4 py-3 transition",
                              portionUnit === option.value ? "bg-white text-teal-600 shadow-sm" : "text-slate-500"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Calorías</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={calories}
                        onChange={(event) => setCalories(normalizeNumberInput(event.target.value, 100000))}
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Proteínas</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={proteins}
                        onChange={(event) => setProteins(normalizeNumberInput(event.target.value, 100000))}
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Carbohidratos</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={carbs}
                        onChange={(event) => setCarbs(normalizeNumberInput(event.target.value, 100000))}
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Grasas</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={fats}
                        onChange={(event) => setFats(normalizeNumberInput(event.target.value, 100000))}
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                      />
                    </label>
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Vista previa</p>
                        <p className="text-xs text-slate-500">{formatQuantityLabel(Math.max(parseNumber(portionAmount, MAX_INGREDIENT_QUANTITY) ?? 100, 1), portionUnit)}</p>
                      </div>
                      {categoryIsBeverage(categoryEnum) ? (
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-600">
                          Bebida
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      {Math.round(previewNutrition.calories)} kcal | P {Math.round(previewNutrition.proteins)}g | G {Math.round(previewNutrition.fats)}g | C {Math.round(previewNutrition.carbs)}g
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Compartir con otros</p>
                      <p className="text-xs text-slate-500">Aparecerá para ti en Mis alimentos y también podrá usarse en el catálogo general.</p>
                    </div>
                    <Switch checked={share} onCheckedChange={setShare} />
                  </div>

                  {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                </div>
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
                  {saving ? "Guardando..." : "Guardar alimento"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { FoodCreateValues, FoodCreateResult };
