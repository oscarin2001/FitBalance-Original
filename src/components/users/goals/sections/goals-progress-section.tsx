"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Loader2, MoreVertical, PencilLine, Plus, Scale, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";

import { deleteGoalWeightEntryAction } from "@/actions/server/users/goals/weight-actions";
import type { UserWeightHistoryEntry } from "@/actions/server/users/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  buildProjectionSeries,
  formatChartWeight,
  formatGoalLabel,
  formatHistoryDateTime,
  formatRangeLabel,
  formatWeight,
  formatWeightDifference,
  getWeightHistoryWindow,
  type GoalsRangeKey,
  type GoalsWeightUnit,
} from "./goals-utils";

type GoalsProgressSectionProps = {
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  weightHistory: UserWeightHistoryEntry[];
  unit: GoalsWeightUnit;
  range: GoalsRangeKey;
  onToggleUnit: () => void;
  onRangeChange: (range: GoalsRangeKey) => void;
  onAddWeightClick: () => void;
  onEditWeightEntry: (entry: UserWeightHistoryEntry) => void;
};

const chartConfig: ChartConfig = {
  weight: {
    label: "Peso",
    color: "#6B7CFF",
  },
};

export function GoalsProgressSection({
  currentWeightKg,
  targetWeightKg,
  weightHistory,
  unit,
  range,
  onToggleUnit,
  onRangeChange,
  onAddWeightClick,
  onEditWeightEntry,
}: GoalsProgressSectionProps) {
  const router = useRouter();
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const historyWindow = useMemo(() => getWeightHistoryWindow(weightHistory, range), [range, weightHistory]);
  const historyItems = useMemo(() => [...historyWindow].reverse(), [historyWindow]);
  const journeyInitialWeightKg = weightHistory[0]?.weightKg ?? currentWeightKg ?? targetWeightKg ?? 0;
  const journeyCurrentWeightKg = weightHistory.at(-1)?.weightKg ?? currentWeightKg ?? targetWeightKg ?? journeyInitialWeightKg;
  const resolvedTargetWeightKg = targetWeightKg ?? journeyCurrentWeightKg;

  const projectionData = useMemo(
    () =>
      buildProjectionSeries({
        historyEntries: weightHistory,
        currentWeightKg: journeyCurrentWeightKg,
        targetWeightKg: resolvedTargetWeightKg,
        unit,
        rangeKey: range,
      }),
    [range, resolvedTargetWeightKg, unit, journeyCurrentWeightKg, weightHistory]
  );

  const chartDomain = useMemo(() => {
    const weights = projectionData.map((item) => item.weight);
    const targetChartWeight = formatChartWeight(resolvedTargetWeightKg, unit);
    const currentChartWeight = formatChartWeight(journeyCurrentWeightKg, unit);
    const minimum = Math.min(...weights, currentChartWeight, targetChartWeight);
    const maximum = Math.max(...weights, currentChartWeight, targetChartWeight);

    return [Math.max(minimum - 5, 0), maximum + 5] as const;
  }, [projectionData, resolvedTargetWeightKg, unit, journeyCurrentWeightKg]);

  const goalLabel = formatGoalLabel(journeyCurrentWeightKg, targetWeightKg, unit);
  const differenceKg = journeyCurrentWeightKg - journeyInitialWeightKg;
  const differenceLabel = formatWeightDifference(differenceKg, unit);
  const changeAmountLabel = formatWeight(Math.abs(differenceKg), unit);
  const progressDenominator = Math.abs(journeyInitialWeightKg - resolvedTargetWeightKg);
  const progressNumerator = Math.abs(journeyInitialWeightKg - journeyCurrentWeightKg);
  const progressRatio =
    historyWindow.length === 0
      ? 0
      : progressDenominator === 0
        ? 1
        : Math.min(progressNumerator / progressDenominator, 1);

  const progressMessage =
    historyWindow.length === 0
      ? "Aun no registraste peso en este periodo."
      : differenceKg < 0
        ? `Has perdido ${changeAmountLabel} desde tu primer registro.`
        : differenceKg > 0
          ? `Has ganado ${changeAmountLabel} desde tu primer registro.`
          : "Tu peso se mantiene estable desde tu primer registro.";
  const ProgressIcon = differenceKg < 0 ? TrendingDown : differenceKg > 0 ? TrendingUp : Scale;

  async function handleDeleteEntry(entry: UserWeightHistoryEntry) {
    setDeleteError(null);
    setDeletingEntryId(entry.id);

    try {
      const result = await deleteGoalWeightEntryAction({ id: entry.id });

      if (!result.ok) {
        setDeleteError(result.error ?? "No se pudo eliminar el peso.");
        return;
      }

      router.refresh();
    } finally {
      setDeletingEntryId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <CardContent className="grid gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                  <Scale className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[1.05rem] font-semibold tracking-tight text-slate-950">
                    Peso ({unit})
                  </p>
                  <p className="text-xs text-slate-500">{goalLabel}</p>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={onToggleUnit}
                className="h-9 rounded-full px-3 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Cambiar
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(["1m", "3m", "6m", "1y"] as GoalsRangeKey[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onRangeChange(option)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                  range === option
                    ? "bg-indigo-500 text-white shadow-[0_10px_20px_-12px_rgba(99,102,241,0.8)]"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {formatRangeLabel(option)}
              </button>
            ))}
          </div>

          <div className="h-[320px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={projectionData} margin={{ left: 0, right: 8, top: 10, bottom: 8 }}>
                <defs>
                  <linearGradient id="goalWeightFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-weight)" stopOpacity={0.36} />
                    <stop offset="95%" stopColor="var(--color-weight)" stopOpacity={0.06} />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} strokeDasharray="4 10" stroke="#E2E8F0" />
                <XAxis
                  dataKey="dateLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={18}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                />
                <YAxis
                  domain={chartDomain}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  width={52}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <ReferenceLine
                  y={formatChartWeight(resolvedTargetWeightKg, unit)}
                  stroke="#A5B4FC"
                  strokeDasharray="6 6"
                  ifOverflow="extendDomain"
                  label={{
                    value: goalLabel,
                    position: "insideBottomRight",
                    fill: "#A5B4FC",
                    fontSize: 12,
                  }}
                />
                <Area
                  dataKey="weight"
                  type="monotone"
                  stroke="var(--color-weight)"
                  fill="url(#goalWeightFill)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "var(--color-weight)", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center gap-2 px-4 pt-4 text-sm font-medium text-slate-900">
                <span className="size-2 rounded-full bg-indigo-500" />
                Peso
              </div>

              <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200 px-3 pb-4">
                <SummaryCell label="Inicial" value={formatWeight(journeyInitialWeightKg, unit)} />
                <SummaryCell label="Actual" value={formatWeight(journeyCurrentWeightKg, unit)} />
                <SummaryCell label="Meta" value={goalLabel.replace(/^Meta:\s*/, "")} accent />
              </div>

              <div className="px-3 pb-4">
                <Button
                  type="button"
                  onClick={onAddWeightClick}
                  className="h-12 w-full rounded-2xl bg-emerald-500 px-5 text-base font-semibold text-white shadow-[0_12px_30px_-14px_rgba(16,185,129,0.65)] hover:bg-emerald-600"
                >
                  <Plus className="size-4" />
                  Añadir nuevo peso
                </Button>
              </div>
            </div>

            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                  <ProgressIcon className="size-4" />
                </span>
                <p className="text-sm font-medium text-slate-700">{progressMessage}</p>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round(progressRatio * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">Cambio: {differenceLabel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
        <CardContent className="grid gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Historial</p>
            <p className="text-xs font-medium text-slate-400">{historyItems.length} registros</p>
          </div>

          <div className="grid gap-0 divide-y divide-slate-100">
            {historyItems.length > 0 ? (
              historyItems.map((entry, index) => (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  unit={unit}
                  isLatest={index === 0}
                  isDeleting={deletingEntryId === entry.id}
                  onEdit={() => onEditWeightEntry(entry)}
                  onDelete={() => void handleDeleteEntry(entry)}
                />
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Todavia no tienes registros de peso guardados.
              </div>
            )}
          </div>

          {deleteError ? <p className="text-sm font-medium text-rose-600">{deleteError}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="grid gap-1 px-2 py-1 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={cn("text-lg font-semibold tracking-tight text-slate-950", accent && "text-emerald-600")}>{value}</p>
    </div>
  );
}

function HistoryRow({
  entry,
  unit,
  isLatest,
  isDeleting,
  onEdit,
  onDelete,
}: {
  entry: UserWeightHistoryEntry;
  unit: GoalsWeightUnit;
  isLatest: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-4 first:pt-1 last:pb-1">
      <div className="min-w-0">
        <p className={cn("text-lg font-semibold tracking-tight", isLatest ? "text-emerald-500" : "text-slate-700")}>{formatWeight(entry.weightKg, unit)}</p>
        <p className={cn("mt-1 text-sm", isLatest ? "font-medium text-emerald-500" : "text-slate-500")}>{formatHistoryDateTime(entry.dateIso)}</p>
      </div>

      <GoalsWeightHistoryMenu onEdit={onEdit} onDelete={onDelete} isDeleting={isDeleting} />
    </div>
  );
}

function GoalsWeightHistoryMenu({
  onEdit,
  onDelete,
  isDeleting,
}: {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Más opciones"
        className="inline-flex size-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-40 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-[0_16px_32px_-16px_rgba(15,23,42,0.45)]"
      >
        <DropdownMenuItem
          onClick={onEdit}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <PencilLine className="size-4" />
          </span>
          Editar
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-slate-200" />

        <DropdownMenuItem
          onClick={onDelete}
          disabled={isDeleting}
          variant="destructive"
          className="gap-2 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors focus:!bg-rose-50 focus:!text-rose-700"
        >
          <span className="flex size-4 items-center justify-center text-rose-500">
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </span>
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
