"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock3, Crown, Download, Flame, Repeat2, Sparkles, Target, TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

import type { UserDashboardPlan, UserDashboardProfile } from "@/actions/server/users/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  buildInitialMacroCalculatorDraft,
  buildSuggestedMacroTargets,
  calculateMacroPercent,
  estimateMonthlyWeightChangeKg,
  formatSignedNumber,
  getDefaultPreset,
  getObjectiveLabel,
  macroPresetOptions,
  macroScopeOptions,
  type MacroCalculatorDraft,
  type MacroPresetMode,
} from "../data/macros-calculator";
import { MacroAccordionItem } from "../molecules/macro-accordion-item";
import { MacroInputRow } from "../molecules/macro-input-row";
import { MacroSectionCard } from "../molecules/macro-section-card";
import { MacroSwitchRow } from "../molecules/macro-switch-row";
import { downloadCurrentNutritionPlanPdf } from "../../pdf";

type DashboardMacrosCalculatorContentProps = {
  dashboard: UserDashboardPlan | null;
  profile: UserDashboardProfile | null;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function parseNumericInput(value: string) {
  if (value.trim().length === 0) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWeightKg(value: number | null) {
  return value ? `${Math.round(value)} kg` : "Sin dato";
}

function formatHeightCm(value: number | null) {
  return value ? `${Math.round(value)} cm` : "Sin dato";
}

function formatTraining(value: string | null) {
  return value ? value.replace(/_/g, " ") : "Sin definir";
}

function formatMonthLabel(date: Date, isFirst: boolean) {
  if (isFirst) {
    return "Ahora";
  }

  return new Intl.DateTimeFormat("es-ES", { month: "short" }).format(date).replace(".", "").toUpperCase();
}

function formatWeightValue(value: number) {
  return `${value.toFixed(1)} kg`;
}

function getPresetButtonClass(isActive: boolean) {
  return cn(
    "rounded-2xl border px-3 py-3 text-left transition",
    isActive
      ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/70"
  );
}

export function DashboardMacrosCalculatorContent({ dashboard, profile }: DashboardMacrosCalculatorContentProps) {
  const baseTargets = dashboard?.dayTargets ?? { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  const objective = dashboard?.objective ?? null;
  const initialDraft = useMemo(
    () => buildInitialMacroCalculatorDraft(baseTargets, objective),
    [baseTargets.calories, baseTargets.carbs, baseTargets.fats, baseTargets.proteins, objective]
  );
  const [draft, setDraft] = useState<MacroCalculatorDraft>(initialDraft);
  const [hasApplied, setHasApplied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null);

  const currentWeightKg = profile?.pesoKg ?? null;
  const currentHeightCm = profile?.alturaCm ?? null;
  const objectiveLabel = getObjectiveLabel(objective);
  const profileName = [profile?.nombre, profile?.apellido].filter(Boolean).join(" ").trim() || "Usuario";

  useEffect(() => {
    setDraft(initialDraft);
    setHasApplied(false);
  }, [initialDraft]);

  const suggestedMacros = useMemo(
    () =>
      buildSuggestedMacroTargets({
        calories: draft.calories,
        weightKg: currentWeightKg,
        objective,
        preset: draft.preset,
      }),
    [currentWeightKg, draft.calories, draft.preset, objective]
  );

  useEffect(() => {
    if (!draft.smartMacros || draft.preset === "Personalizado") {
      return;
    }

    setDraft((previous) => {
      const nextProteins = suggestedMacros.proteins;
      const nextFats = suggestedMacros.fats;
      const nextCarbs = suggestedMacros.carbs;

      if (
        previous.proteins === nextProteins &&
        previous.fats === nextFats &&
        previous.carbs === nextCarbs
      ) {
        return previous;
      }

      return {
        ...previous,
        proteins: nextProteins,
        fats: nextFats,
        carbs: nextCarbs,
      };
    });
  }, [draft.preset, draft.smartMacros, suggestedMacros]);

  const macroCalories = draft.proteins * 4 + draft.carbs * 4 + draft.fats * 9;
  const calorieProgress = baseTargets.calories > 0 ? clamp((draft.calories / baseTargets.calories) * 100, 0, 100) : 0;
  const proteinPercent = calculateMacroPercent(draft.proteins, draft.calories, 4);
  const carbPercent = calculateMacroPercent(draft.carbs, draft.calories, 4);
  const fatPercent = calculateMacroPercent(draft.fats, draft.calories, 9);
  const calorieChange = estimateMonthlyWeightChangeKg(baseTargets.calories, draft.calories);
  const weightProjectionData = useMemo(() => {
    const projectionStartWeight = currentWeightKg ?? 70;

    return Array.from({ length: 6 }, (_, index) => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + index);

      return {
        month: formatMonthLabel(futureDate, index === 0),
        weight: clamp(projectionStartWeight + calorieChange.monthlyKg * index, 35, 250),
      };
    });
  }, [calorieChange.monthlyKg, currentWeightKg]);
  const chartConfig = {
    weight: {
      label: "Peso estimado",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;
  const projectedWeightKg = weightProjectionData.at(-1)?.weight ?? (currentWeightKg ?? 70);
  const trendCopy =
    Math.abs(calorieChange.monthlyKg) < 0.1
      ? "Mantienes el mismo punto de partida con este ajuste."
      : calorieChange.monthlyKg < 0
        ? `A este ritmo estimamos que pierdes ${Math.abs(calorieChange.monthlyKg).toFixed(1)} kg por mes.`
        : `A este ritmo estimamos que ganas ${Math.abs(calorieChange.monthlyKg).toFixed(1)} kg por mes.`;

  function updateCalories(nextCalories: number) {
    const normalizedCalories = Math.max(Math.round(nextCalories), 1200);

    setDraft((previous) => {
      if (!previous.smartMacros || previous.preset === "Personalizado") {
        return {
          ...previous,
          calories: normalizedCalories,
        };
      }

      const nextSuggested = buildSuggestedMacroTargets({
        calories: normalizedCalories,
        weightKg: currentWeightKg,
        objective,
        preset: previous.preset,
      });

      return {
        ...previous,
        calories: normalizedCalories,
        proteins: nextSuggested.proteins,
        fats: nextSuggested.fats,
        carbs: nextSuggested.carbs,
      };
    });
  }

  function updateMacroField(field: "proteins" | "carbs" | "fats", nextValue: number) {
    setDraft((previous) => ({
      ...previous,
      [field]: Math.max(Math.round(nextValue), 0),
      smartMacros: false,
      preset: "Personalizado",
    }));
  }

  function handlePresetChange(nextPreset: MacroPresetMode) {
    if (nextPreset === "Personalizado") {
      setDraft((previous) => ({
        ...previous,
        preset: nextPreset,
        smartMacros: false,
      }));
      return;
    }

    const nextSuggested = buildSuggestedMacroTargets({
      calories: draft.calories,
      weightKg: currentWeightKg,
      objective,
      preset: nextPreset,
    });

    setDraft((previous) => ({
      ...previous,
      preset: nextPreset,
      smartMacros: true,
      proteins: nextSuggested.proteins,
      fats: nextSuggested.fats,
      carbs: nextSuggested.carbs,
    }));
  }

  function handleSmartMacrosChange(checked: boolean) {
    if (!checked) {
      setDraft((previous) => ({
        ...previous,
        smartMacros: false,
        preset: "Personalizado",
      }));
      return;
    }

    const nextPreset = draft.preset === "Personalizado" ? getDefaultPreset(objective) : draft.preset;
    const nextSuggested = buildSuggestedMacroTargets({
      calories: draft.calories,
      weightKg: currentWeightKg,
      objective,
      preset: nextPreset,
    });

    setDraft((previous) => ({
      ...previous,
      smartMacros: true,
      preset: nextPreset,
      proteins: nextSuggested.proteins,
      fats: nextSuggested.fats,
      carbs: nextSuggested.carbs,
    }));
  }

  function handleApplyDraft() {
    setHasApplied(true);
  }

  async function handleDownloadPdf() {
    setPdfDownloadError(null);
    setIsDownloadingPdf(true);

    try {
      const result = await downloadCurrentNutritionPlanPdf(profileName);

      if (result.ok === false) {
        setPdfDownloadError(result.error);
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return (
    <div className="space-y-4 px-3 py-3">
      <div className="rounded-[1.75rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <Sparkles className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700/80">
                Tu punto de partida
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                Tomamos tus metricas como base
              </h3>
            </div>
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-200">
            Prototipo
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-white/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Objetivo</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{objectiveLabel}</p>
            <p className="text-xs text-slate-500">{profileName}</p>
          </div>

          <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-white/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Peso actual</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatWeightKg(currentWeightKg)}</p>
            <p className="text-xs text-slate-500">{formatHeightCm(currentHeightCm)}</p>
          </div>

          <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-white/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Entrenamiento</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{formatTraining(profile?.tipoEntrenamiento ?? null)}</p>
            <p className="text-xs text-slate-500">
              {profile?.frecuenciaEntreno !== null && profile?.frecuenciaEntreno !== undefined
                ? `${profile.frecuenciaEntreno} dias por semana`
                : "Sin frecuencia"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/80 px-3 py-3 shadow-sm ring-1 ring-white/80">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Base diaria</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{Math.round(baseTargets.calories)} kcal</p>
            <p className="text-xs text-slate-500">Meta actual de calorias</p>
          </div>
        </div>
      </div>

      <MacroSectionCard
        eyebrow="Paso 1"
        title="Mis metas de Caloria"
        description="Arrancamos desde la meta que ya elegiste y la afinamos aqui mismo."
        icon={Flame}
        tone="teal"
      >
        <div className="grid gap-3 rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                meta calorias diaria de
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-slate-950">
                  {Math.round(draft.calories)}
                </span>
                <span className="pb-1 text-sm font-medium text-slate-500">kcal</span>
              </div>
            </div>

            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ajustar</span>
              <input
                type="number"
                value={draft.calories}
                min={1200}
                max={4000}
                step={10}
                onChange={(event) => updateCalories(parseNumericInput(event.target.value))}
                className="w-20 border-0 bg-transparent p-0 text-right text-sm font-semibold text-slate-950 outline-none ring-0 focus:ring-0"
              />
            </label>
          </div>

          <Progress value={calorieProgress} className="gap-0" />

          <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
            <span>Base actual: {Math.round(baseTargets.calories)} kcal</span>
            <span
              className={cn(
                "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                calorieChange.calorieDelta === 0
                  ? "bg-slate-100 text-slate-600"
                  : calorieChange.calorieDelta < 0
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
              )}
            >
              {formatSignedNumber(calorieChange.calorieDelta, "kcal")}
            </span>
          </div>
        </div>

        <Card className="overflow-hidden rounded-[1.5rem] border border-rose-100 bg-white shadow-sm">
          <CardHeader className="gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Target className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm font-semibold text-slate-950">{trendCopy}</CardTitle>
                <CardDescription className="mt-1 text-sm leading-6 text-slate-500">
                  Tus objetivos de macros se recalculan sobre esta base y luego puedes afinar a mano.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 pt-4">
            <div className="h-[240px] w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart
                  accessibilityLayer
                  data={weightProjectionData}
                  margin={{ left: 6, right: 6, top: 8 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="4 10" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => (value === "Ahora" ? value : String(value).slice(0, 3))}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Line
                    dataKey="weight"
                    type="natural"
                    stroke="var(--color-weight)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-weight)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ahora</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {currentWeightKg !== null ? formatWeightValue(currentWeightKg) : "Sin dato"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">6 meses</p>
                <p className="mt-1 font-semibold text-slate-950">{formatWeightValue(projectedWeightKg)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Mensual</p>
                <p className="mt-1 font-semibold text-slate-950">{formatSignedNumber(calorieChange.monthlyKg, "kg")}</p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-2 border-t border-slate-100 bg-slate-50/60 text-sm">
            <div className="flex items-center gap-2 font-medium text-slate-950">
              <TrendingUp className="size-4 text-emerald-600" />
              {trendCopy}
            </div>
            <div className="leading-none text-slate-500">
              Proyección estimada según tus calorías diarias y el ajuste mensual.
            </div>
          </CardFooter>
        </Card>
      </MacroSectionCard>

      <MacroSectionCard
        eyebrow="Paso 2"
        title="Mis metas de macronutrientes"
        description="Tomamos la dieta elegida y la volvemos editable para que ajustes el reparto real."
        icon={BarChart3}
        tone="emerald"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {macroPresetOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handlePresetChange(option.value)}
              className={getPresetButtonClass(draft.preset === option.value)}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
            </button>
          ))}
        </div>

        <MacroSwitchRow
          title="Smart Macros"
          description="Ajusta automaticamente las metas a medida que cambias calorias o preset."
          checked={draft.smartMacros}
          onCheckedChange={handleSmartMacrosChange}
          badge="Premium"
          badgeClassName="bg-emerald-50 text-emerald-700 ring-emerald-200"
        />

        <div className="grid gap-3">
          <MacroInputRow
            label={dashboard?.carbLabel ?? "Carbos"}
            description="Basado en tu dieta actual. Desliza para modificar."
            value={draft.carbs}
            unit="g"
            percent={carbPercent}
            progress={carbPercent}
            helperText={`≈ ${Math.round(draft.carbs * 4)} kcal`}
            accentClassName="bg-emerald-50 text-emerald-700 ring-emerald-200"
            disabled={draft.smartMacros}
            max={500}
            onValueChange={(nextValue) => updateMacroField("carbs", nextValue)}
          />

          <MacroInputRow
            label="Proteina"
            description="Basado en tu dieta actual. Desliza para modificar."
            value={draft.proteins}
            unit="g"
            percent={proteinPercent}
            progress={proteinPercent}
            helperText={`≈ ${Math.round(draft.proteins * 4)} kcal`}
            accentClassName="bg-cyan-50 text-cyan-700 ring-cyan-200"
            disabled={draft.smartMacros}
            max={400}
            onValueChange={(nextValue) => updateMacroField("proteins", nextValue)}
          />

          <MacroInputRow
            label="Grasa"
            description="Basado en tu dieta actual. Desliza para modificar."
            value={draft.fats}
            unit="g"
            percent={fatPercent}
            progress={fatPercent}
            helperText={`≈ ${Math.round(draft.fats * 9)} kcal`}
            accentClassName="bg-amber-50 text-amber-700 ring-amber-200"
            disabled={draft.smartMacros}
            max={300}
            onValueChange={(nextValue) => updateMacroField("fats", nextValue)}
          />
        </div>

        <div className="grid gap-2 rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Proteina</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{Math.round(proteinPercent)}%</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Carbos</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{Math.round(carbPercent)}%</p>
          </div>
          <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Grasa</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{Math.round(fatPercent)}%</p>
          </div>
        </div>
      </MacroSectionCard>

      <MacroSectionCard
        eyebrow="Paso 3"
        title="Empezar dieta gradualmente"
        description="Selecciona si quieres entrar a tu nueva dieta de forma suave durante algunos dias."
        icon={Clock3}
        tone="slate"
      >
        <MacroSwitchRow
          title="Empezar dieta gradualmente"
          description="La opcion ajusta tus macros y calorias de forma progresiva para que el cambio sea mas llevadero."
          checked={draft.gradualDiet}
          onCheckedChange={(checked) => setDraft((previous) => ({ ...previous, gradualDiet: checked }))}
          badge="Opcional"
          badgeClassName="bg-slate-100 text-slate-600 ring-slate-200"
        />

        {draft.gradualDiet ? (
          <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm leading-6 text-teal-800">
            Si dejas esta opcion activa, bajamos o subimos el ajuste con menos brusquedad para que la
            transicion se sienta mas natural.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-500">
            Al apagarlo, tu base queda directa y la vista previa se mantiene mas simple.
          </div>
        )}
      </MacroSectionCard>

      <MacroSectionCard
        eyebrow="Paso 4"
        title="Ciclo de carbos y macros"
        description="Elige si prefieres aplicar estas metas todos los dias o en bloques de la semana."
        icon={Repeat2}
        tone="amber"
      >
        <Accordion multiple className="grid gap-3">
          <MacroAccordionItem
            itemId="carb-cycling"
            title="Ciclo de carbos y macros"
            description="Solo disponible para usuarios Premium. Aqui conectaremos el reparto por dias y dias altos o bajos."
            icon={Crown}
            eyebrow="Premium"
            badge="Premium"
            badgeTone="amber"
            tone="amber"
          >
            <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
              <p className="text-base font-semibold text-slate-950">Solo disponible para usuarios Premium</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Cuando habilites Premium podremos repartir carbos altos y bajos por dia o por bloques
                semanales.
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="h-11 rounded-full bg-emerald-500 px-5 text-white shadow-sm hover:bg-emerald-600">
                  Hazte Premium
                </Button>
                <Button variant="outline" className="h-11 rounded-full border-slate-200 bg-white px-5 text-slate-700">
                  Ver beneficios Premium
                </Button>
              </div>
            </div>
          </MacroAccordionItem>

          <MacroAccordionItem
            itemId="advanced-fields"
            title="Campos avanzados"
            description="De momento solo sirven para ordenar la vista previa y no guardan nada aun."
            icon={Sparkles}
            eyebrow="Opcional"
            badge="Visual"
            badgeTone="slate"
            tone="teal"
          >
            <div className="grid gap-3 rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-950">Aplicar a dias futuros</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Escoge donde quieres ver aplicado el ajuste mientras seguimos en modo prototipo.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {macroScopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDraft((previous) => ({ ...previous, applyScope: option.value }))}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      draft.applyScope === option.value
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/70"
                    )}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </MacroAccordionItem>
        </Accordion>
      </MacroSectionCard>

      <Card className="rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/60 shadow-sm">
        <CardContent className="grid gap-3 p-4 text-sm leading-6 text-emerald-700">
          <p className="font-semibold text-emerald-800">De momento esta calculadora es solo visual.</p>
          <p>
            Los cambios no se guardan todavia. La idea es que pruebes distintos repartos antes de que
            conectemos la persistencia real.
          </p>
        </CardContent>
      </Card>

      {hasApplied ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-white px-4 py-3 text-sm leading-6 text-emerald-700 shadow-sm">
          Listo. Dejamos esta version aplicada solo en esta vista previa por ahora.
        </div>
      ) : null}

      {pdfDownloadError ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700 shadow-sm">
          {pdfDownloadError}
        </div>
      ) : null}

      <div className="grid gap-3">
        <Button
          type="button"
          onClick={handleApplyDraft}
          className="h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white shadow-[0_16px_36px_-18px_rgba(16,185,129,0.9)] hover:bg-emerald-600"
        >
          {hasApplied ? (
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="size-4" />
              Metas aplicadas
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Flame className="size-4" />
              Aplicar metas de macros
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => void handleDownloadPdf()}
          disabled={isDownloadingPdf}
          className="h-12 w-full rounded-full border-slate-200 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50"
        >
          {isDownloadingPdf ? (
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 animate-pulse" />
              Descargando PDF...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Download className="size-4" />
              Descargar PDF del plan
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
