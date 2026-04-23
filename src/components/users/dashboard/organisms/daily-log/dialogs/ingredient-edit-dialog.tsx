"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MAX_INGREDIENT_QUANTITY } from "@/actions/server/users/dashboard/daily-log/constants";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

import { SettingsScreenHeader } from "../../../settings/shared/settings-screen-header";
import type { DailyLogIngredient } from "../../daily-log-view";

export type IngredientEditValues = {
  name: string;
  quantity: number;
  unit: "g" | "ml";
  quantityLabel: string;
};

type IngredientSaveResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

type IngredientEditDialogProps = {
  open: boolean;
  mealTitle: string;
  ingredient: DailyLogIngredient | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: IngredientEditValues) => Promise<IngredientSaveResult> | IngredientSaveResult;
};

function parseQuantityLabel(value: string) {
  const match = value.trim().match(/([0-9]+(?:[.,][0-9]+)?)\s*(ml|g)\b/i);

  if (!match) {
    return { quantity: "", unit: "g" as const };
  }

  return {
    quantity: match[1].replace(",", "."),
    unit: match[2].toLowerCase() === "ml" ? ("ml" as const) : ("g" as const),
  };
}

function formatQuantityLabel(quantity: string, unit: "g" | "ml") {
  const numericQuantity = Number(quantity);

  if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
    return unit === "ml" ? "0 ml" : "0 g";
  }

  const displayQuantity = Number.isInteger(numericQuantity) ? String(Math.round(numericQuantity)) : numericQuantity.toFixed(1);

  return `${displayQuantity} ${unit}`;
}

function formatNumberInput(value: number | undefined) {
  if (!Number.isFinite(value ?? Number.NaN)) {
    return "0";
  }

  const rounded = Number((value ?? 0).toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function scaleNutrition(ingredient: DailyLogIngredient, quantity: number) {
  const baseQuantity = ingredient.grams > 0 ? ingredient.grams : 1;
  const ratio = quantity > 0 ? quantity / baseQuantity : 0;

  return {
    calories: Number((((ingredient.nutrition?.calories ?? 0) * ratio).toFixed(1))),
    proteins: Number((((ingredient.nutrition?.proteins ?? 0) * ratio).toFixed(1))),
    carbs: Number((((ingredient.nutrition?.carbs ?? 0) * ratio).toFixed(1))),
    fats: Number((((ingredient.nutrition?.fats ?? 0) * ratio).toFixed(1))),
  };
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

export function IngredientEditDialog({ open, mealTitle, ingredient, onOpenChange, onSave }: IngredientEditDialogProps) {
  const isMobileLayout = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"g" | "ml">("g");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isFullScreen = useMemo(() => isMobileLayout || isStandalone, [isMobileLayout, isStandalone]);
  const previewNutrition = useMemo(() => {
    if (!ingredient) {
      return { calories: 0, proteins: 0, carbs: 0, fats: 0 };
    }

    return scaleNutrition(ingredient, Number(quantity));
  }, [ingredient, quantity]);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
  }, []);

  useEffect(() => {
    if (!open || !ingredient) {
      return;
    }

    const parsed = parseQuantityLabel(ingredient.quantityLabel);
    setName(ingredient.name);
    setQuantity(
      normalizeQuantityInput(
        parsed.quantity || String(ingredient.grams || ingredient.quantityLabel.replace(/\s*(ml|g)$/i, ""))
      )
    );
    setUnit(parsed.unit);
    setError("");
  }, [ingredient, open]);

  async function handleSave() {
    if (!ingredient) {
      return { ok: false, error: "No encontramos el alimento a editar." };
    }

    const numericQuantity = clampQuantity(Number(quantity));
    const roundedQuantity = Number(numericQuantity.toFixed(1));

    const values: IngredientEditValues = {
      name: name.trim(),
      quantity: roundedQuantity,
      unit,
      quantityLabel: formatQuantityLabel(String(numericQuantity), unit),
    };

    setError("");
    setIsSaving(true);

    try {
      const result = await Promise.resolve(onSave(values));

      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar el alimento.");
        return result;
      }

      onOpenChange(false);
      return result;
    } catch (saveError) {
      console.error(saveError);
      setError("No se pudo guardar el alimento.");
      return { ok: false, error: "No se pudo guardar el alimento." };
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open && Boolean(ingredient)} onOpenChange={(nextOpen) => !nextOpen && onOpenChange(false)}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          isFullScreen
            ? "!fixed !inset-0 !z-[100] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-transparent !p-0 !shadow-none !overflow-hidden"
            : "h-[calc(100dvh-2rem)] w-[min(100vw-2rem,42rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
        )}
      >
        <div className={cn("flex h-full w-full flex-col", isFullScreen ? "bg-slate-50" : "bg-white")}>
          {isFullScreen ? (
            <SettingsScreenHeader title="Editar alimento" name={mealTitle} onBack={() => onOpenChange(false)} />
          ) : (
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Alimento de {mealTitle}</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Editar alimento</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Ajusta los datos visibles del alimento sin perder el contexto de la comida.
                </p>
              </div>

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
          )}

          <div
            className={cn(
              "flex-1 min-h-0 overflow-y-scroll pr-3 [scrollbar-gutter:stable] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/70",
              isFullScreen ? "p-4 pl-4" : "px-5 py-5 pl-5"
            )}
          >
            <div className="grid gap-4 pb-2">
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Comida</p>
                <p className="mt-1 text-sm font-medium text-slate-950">{mealTitle}</p>
              </div>

              <div className="grid gap-2.5">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nombre del alimento</span>
                  <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
                    {(["g", "ml"] as const).map((nextUnit) => (
                      <button
                        key={nextUnit}
                        type="button"
                        onClick={() => setUnit(nextUnit)}
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
              </div>

              <div className="grid gap-3 rounded-[1.4rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-100 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Macros estimados</p>
                    <p className="text-xs text-slate-500">Se recalculan con la porción y se validan en servidor.</p>
                  </div>
                  <p className="text-xs font-medium text-teal-600">Base: {formatNumberInput(ingredient?.grams)}</p>
                </div>

                {[
                  { label: "Calorías", value: previewNutrition.calories, accent: "text-slate-950" },
                  { label: "Proteínas", value: previewNutrition.proteins, accent: "text-teal-600" },
                  { label: "Carbos", value: previewNutrition.carbs, accent: "text-rose-600" },
                  { label: "Grasas", value: previewNutrition.fats, accent: "text-amber-600" },
                ].map((field) => (
                  <div key={field.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{field.label}</p>
                    <p className={cn("mt-1 text-base font-semibold", field.accent)}>{formatNumberInput(field.value)}</p>
                  </div>
                ))}
              </div>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl border-slate-200 bg-white px-5"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="h-12 rounded-2xl bg-teal-500 px-6 text-white hover:bg-teal-600"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}