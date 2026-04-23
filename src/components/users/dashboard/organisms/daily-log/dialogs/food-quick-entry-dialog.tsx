"use client";

import { useEffect, useState } from "react";

import { Camera, Smile, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MAX_INGREDIENT_QUANTITY } from "@/actions/server/users/dashboard/daily-log/constants";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const QUICK_ENTRY_LIMITS = {
  grams: MAX_INGREDIENT_QUANTITY,
  calories: 100000,
  carbs: 100000,
  sugarAlcohols: 100000,
  fiber: 100000,
  allulose: 100000,
  proteins: 100000,
  fats: 100000,
  glycemicLoad: 1000,
} as const;

export type FoodQuickEntryValues = {
  name: string;
  grams: number;
  calories: number;
  carbs: number;
  carbMode: "total" | "net";
  sugarAlcohols: number;
  fiber: number;
  allulose: number;
  proteins: number;
  fats: number;
  glycemicLoad: number | null;
  notes: string;
  share: boolean;
};

type FoodQuickEntryResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

type FoodQuickEntryDialogProps = {
  open: boolean;
  mealTitle: string;
  onOpenChange: (open: boolean) => void;
  onSaveQuickEntry: (values: FoodQuickEntryValues) => Promise<FoodQuickEntryResult> | FoodQuickEntryResult;
};

function normalizeNumberInput(value: string, maxValue?: number) {
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");

  if (cleaned.trim().length === 0) {
    return "";
  }

  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    return "";
  }

  const clamped = Math.max(parsed, 0);
  return String(typeof maxValue === "number" ? Math.min(clamped, maxValue) : clamped);
}

function parsePositiveNumber(value: string, maxValue?: number) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  const clamped = Math.max(parsedValue, 0);
  return typeof maxValue === "number" ? Math.min(clamped, maxValue) : clamped;
}

function parseOptionalNumber(value: string, maxValue?: number) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return 0;
  }

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  const clamped = Math.max(parsedValue, 0);
  return typeof maxValue === "number" ? Math.min(clamped, maxValue) : clamped;
}

function QuickField({
  label,
  unit,
  mode = "numeric",
  value,
  onChange,
  placeholder,
  disabled,
  maxValue,
  stripDigits = false,
}: {
  label: string;
  unit?: string;
  mode?: "numeric" | "text";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxValue?: number;
  stripDigits?: boolean;
}) {
  const isNumeric = mode === "numeric";
  const maxLength = typeof maxValue === "number" ? String(maxValue).length + 2 : undefined;

  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <Input
          disabled={disabled}
          value={value}
          onChange={(event) => {
            const nextValue = isNumeric
              ? normalizeNumberInput(event.target.value, maxValue)
              : stripDigits
                ? event.target.value.replace(/\d/g, "")
                : event.target.value;

            onChange(nextValue);
          }}
          inputMode={isNumeric ? "decimal" : "text"}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn(
            "h-12 rounded-2xl border-slate-200 bg-slate-50/70 px-4",
            unit ? "pr-12" : "",
            disabled && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 placeholder:text-slate-400"
          )}
        />
        {unit ? <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">{unit}</span> : null}
      </div>
    </label>
  );
}

export function FoodQuickEntryDialog({
  open,
  mealTitle,
  onOpenChange,
  onSaveQuickEntry,
}: FoodQuickEntryDialogProps) {
  const isMobileLayout = useIsMobile();
  const [isStandalone, setIsStandalone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("100");
  const [calories, setCalories] = useState("");
  const [carbs, setCarbs] = useState("");
  const [carbMode, setCarbMode] = useState<"total" | "net">("total");
  const [sugarAlcohols, setSugarAlcohols] = useState("");
  const [fiber, setFiber] = useState("");
  const [allulose, setAllulose] = useState("");
  const [proteins, setProteins] = useState("");
  const [fats, setFats] = useState("");
  const [glycemicLoad, setGlycemicLoad] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
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
    setShowAdvanced(false);
    setName("");
    setGrams("100");
    setCalories("");
    setCarbs("");
    setCarbMode("total");
    setSugarAlcohols("");
    setFiber("");
    setAllulose("");
    setProteins("");
    setFats("");
    setGlycemicLoad("");
    setBrand("");
    setCategory("");
    setNotes("");
    setShare(true);
  }, [open]);

  async function handleSave() {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setError("Ingresa el nombre del alimento.");
      return;
    }

    const parsedGrams = parsePositiveNumber(grams, QUICK_ENTRY_LIMITS.grams);
    if (parsedGrams === null || parsedGrams <= 0) {
      setError("Ingresa los gramos base del alimento.");
      return;
    }

    const parsedCalories = parseOptionalNumber(calories, QUICK_ENTRY_LIMITS.calories);
    const parsedCarbs = parseOptionalNumber(carbs, QUICK_ENTRY_LIMITS.carbs);
    const parsedSugarAlcohols = parseOptionalNumber(sugarAlcohols, QUICK_ENTRY_LIMITS.sugarAlcohols);
    const parsedFiber = parseOptionalNumber(fiber, QUICK_ENTRY_LIMITS.fiber);
    const parsedAllulose = parseOptionalNumber(allulose, QUICK_ENTRY_LIMITS.allulose);
    const parsedProteins = parseOptionalNumber(proteins, QUICK_ENTRY_LIMITS.proteins);
    const parsedFats = parseOptionalNumber(fats, QUICK_ENTRY_LIMITS.fats);
    const parsedGlycemicLoad = parseOptionalNumber(glycemicLoad, QUICK_ENTRY_LIMITS.glycemicLoad);

    if (
      parsedCalories === null ||
      parsedCarbs === null ||
      parsedSugarAlcohols === null ||
      parsedFiber === null ||
      parsedAllulose === null ||
      parsedProteins === null ||
      parsedFats === null ||
      parsedGlycemicLoad === null
    ) {
      setError("Revisa los valores numéricos.");
      return;
    }

    if (parsedGrams > MAX_INGREDIENT_QUANTITY) {
      setError(`Los gramos base no pueden superar ${MAX_INGREDIENT_QUANTITY}.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await Promise.resolve(
        onSaveQuickEntry({
          name: normalizedName,
          grams: parsedGrams,
          calories: parsedCalories,
          carbs: parsedCarbs,
          carbMode,
          sugarAlcohols: parsedSugarAlcohols,
          fiber: parsedFiber,
          allulose: parsedAllulose,
          proteins: parsedProteins,
          fats: parsedFats,
          glycemicLoad: glycemicLoad.trim().length > 0 ? parsedGlycemicLoad : null,
          notes: [brand.trim(), category.trim(), notes.trim()].filter(Boolean).join(" · "),
          share,
        })
      );

      if (!result.ok) {
        setError(result.error ?? "No pudimos guardar la entrada rápida.");
        return;
      }

      onOpenChange(false);
    } catch (caughtError) {
      console.error(caughtError);
      setError("No pudimos guardar la entrada rápida.");
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
            ? "!fixed !inset-0 !z-[260] !h-[100dvh] !w-screen !max-w-none !translate-x-0 !translate-y-0 !rounded-none !border-0 !bg-white !p-0 !shadow-none !overflow-hidden"
            : "z-[260] h-[calc(100dvh-2rem)] w-[min(100vw-2rem,42rem)] max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white p-0 shadow-2xl"
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

            <h2 className="text-[1.05rem] font-semibold tracking-tight text-slate-950">Entrada rápida</h2>
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
                <div className="grid gap-4 px-4 py-5">
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
                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Información nutricional</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Añade rápidamente un alimento completando el siguiente formulario.
                    </p>
                  </div>

                  <QuickField
                    label="Nombre del alimento"
                    mode="text"
                    value={name}
                    onChange={setName}
                    placeholder="Ej. Yogur griego"
                    stripDigits
                  />
                  <QuickField label="Gramos base" unit="g" value={grams} onChange={setGrams} placeholder="100" maxValue={QUICK_ENTRY_LIMITS.grams} />
                  <p className="-mt-1 text-xs leading-5 text-slate-500">
                    Los macros se guardan para esta base y luego se escalan cuando cambies los gramos en la comida.
                  </p>
                  <QuickField label="Calorías" unit="calorías" value={calories} onChange={setCalories} placeholder="0" maxValue={QUICK_ENTRY_LIMITS.calories} />

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">Carbos {carbMode === "net" ? "netos" : "totales"}</span>
                      <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-500">
                        <button
                          type="button"
                          onClick={() => setCarbMode("total")}
                          className={cn(
                            "rounded-full px-3 py-1.5 transition",
                            carbMode === "total" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500"
                          )}
                        >
                          Total
                        </button>
                        <button
                          type="button"
                          onClick={() => setCarbMode("net")}
                          className={cn(
                            "rounded-full px-3 py-1.5 transition",
                            carbMode === "net" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500"
                          )}
                        >
                          Neto
                        </button>
                      </div>
                    </div>

                    <QuickField
                      label={carbMode === "net" ? "Carbos netos" : "Carbos totales"}
                      unit="g"
                      value={carbs}
                      onChange={setCarbs}
                      placeholder="0"
                      maxValue={QUICK_ENTRY_LIMITS.carbs}
                    />
                    <QuickField label="Alcoholes de azúcar" unit="g" value={sugarAlcohols} onChange={setSugarAlcohols} placeholder="0" disabled maxValue={QUICK_ENTRY_LIMITS.sugarAlcohols} />
                    <QuickField label="Fibra" unit="g" value={fiber} onChange={setFiber} placeholder="0" maxValue={QUICK_ENTRY_LIMITS.fiber} />
                    <QuickField label="Allulosa" unit="g" value={allulose} onChange={setAllulose} placeholder="0" disabled maxValue={QUICK_ENTRY_LIMITS.allulose} />
                    <QuickField label="Proteína" unit="g" value={proteins} onChange={setProteins} placeholder="0" maxValue={QUICK_ENTRY_LIMITS.proteins} />
                    <QuickField label="Grasa" unit="g" value={fats} onChange={setFats} placeholder="0" maxValue={QUICK_ENTRY_LIMITS.fats} />
                    <QuickField label="Carga glucémica" value={glycemicLoad} onChange={setGlycemicLoad} placeholder="0" disabled maxValue={QUICK_ENTRY_LIMITS.glycemicLoad} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced((current) => !current)}
                    className="text-left text-sm font-medium text-slate-400 transition hover:text-slate-600"
                  >
                    {showAdvanced ? "Ocultar campos avanzados" : "Mostrar campos avanzados"}
                  </button>

                  {showAdvanced ? (
                    <>
                      <Separator className="bg-slate-200/80" />
                      <div className="grid gap-3">
                        <QuickField label="Marca o fuente" mode="text" value={brand} onChange={setBrand} placeholder="Opcional" />
                        <QuickField label="Categoría" mode="text" value={category} onChange={setCategory} placeholder="Opcional" />
                        <label className="grid gap-2">
                          <span className="text-sm font-medium text-slate-700">Notas</span>
                          <Textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Detalles adicionales"
                            className="min-h-28 rounded-2xl border-slate-200 bg-slate-50/70 px-4 py-3"
                          />
                        </label>
                      </div>
                    </>
                  ) : null}

                  <Separator className="bg-slate-200/80" />

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Compartir con otros</p>
                      <p className="text-xs text-slate-500">Aparecerá en la comunidad para que otros la vean.</p>
                    </div>
                    <Switch checked={share} onCheckedChange={setShare} disabled title="En trabajo" className="!opacity-100" />
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
                  Volver
                </Button>
                <Button
                  type="button"
                  className="h-12 flex-1 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{mealTitle ? `Se agregará a ${mealTitle}` : ""}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
