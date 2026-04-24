"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Loader2, MoreVertical, PencilLine, Plus, Scale, Trash2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { deleteBodyMeasurementAction } from "@/actions/server/users/goals/measurement-actions";
import type { UserBodyMeasurementEntry, UserDashboardPlan } from "@/actions/server/users/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { GoalsMeasurementsDialog } from "../organisms/goals-measurements-dialog";
import {
  BODY_MEASUREMENT_FIELDS,
  buildBodyMeasurementValues,
  formatBodyMeasurementDateTime,
  formatMeasurementValue,
  type GoalsBodyMeasurementFieldKey,
} from "./goals-measurements-utils";

type GoalsDataSectionProps = {
  bodyMeasurements: UserBodyMeasurementEntry[];
  objective: UserDashboardPlan["objective"];
};

type MeasurementDialogState =
  | { mode: "create" }
  | { mode: "edit"; entry: UserBodyMeasurementEntry }
  | null;

type MeasurementChartPoint = {
  dateIso: string;
  dateLabel: string;
  measurement: number;
};

type ObjectiveGraphMeta = {
  label: string;
  description: string;
  accentColor: string;
  softColor: string;
  defaultFieldKey: GoalsBodyMeasurementFieldKey;
};

function resolveObjectiveGraphMeta(objective: UserDashboardPlan["objective"]): ObjectiveGraphMeta {
  if (objective === "Bajar_grasa") {
    return {
      label: "Bajar grasa",
      description: "Seguimiento centrado en cintura y abdomen para ver reducción real.",
      accentColor: "#0f766e",
      softColor: "#99f6e4",
      defaultFieldKey: "cinturaCm",
    };
  }

  if (objective === "Ganar_musculo") {
    return {
      label: "Subir de peso",
      description: "Seguimiento enfocado en brazos y torso para ver crecimiento.",
      accentColor: "#d97706",
      softColor: "#fdba74",
      defaultFieldKey: "brazoCm",
    };
  }

  return {
    label: "Mantenimiento",
    description: "Seguimiento equilibrado para detectar cambios sutiles sin ruido visual.",
    accentColor: "#2563eb",
    softColor: "#93c5fd",
    defaultFieldKey: "cinturaCm",
  };
}

function formatChartDate(dateIso: string) {
  const parsedDate = new Date(dateIso);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Fecha invalida";
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
  })
    .format(parsedDate)
    .replace(/\./g, "")
    .trim()
    .toUpperCase();
}

function formatMeasurementDelta(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "Sin dato";
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1)} cm`;
}

function buildMeasurementChartPoints(entries: UserBodyMeasurementEntry[], fieldKey: GoalsBodyMeasurementFieldKey): MeasurementChartPoint[] {
  return entries
    .map((entry) => {
      const measurement = entry[fieldKey];

      if (measurement === null) {
        return null;
      }

      return {
        dateIso: entry.dateIso,
        dateLabel: formatChartDate(entry.dateIso),
        measurement,
      };
    })
    .filter((entry): entry is MeasurementChartPoint => entry !== null)
    .sort((left, right) => new Date(left.dateIso).getTime() - new Date(right.dateIso).getTime());
}

export function GoalsDataSection({ bodyMeasurements, objective }: GoalsDataSectionProps) {
  const router = useRouter();
  const [dialogState, setDialogState] = useState<MeasurementDialogState>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const latestEntry = bodyMeasurements.at(-1) ?? null;
  const historyItems = useMemo(() => [...bodyMeasurements].reverse(), [bodyMeasurements]);
  const latestValues = useMemo(() => (latestEntry ? buildBodyMeasurementValues(latestEntry) : []), [latestEntry]);
  const objectiveGraphMeta = useMemo(() => resolveObjectiveGraphMeta(objective), [objective]);
  const [selectedFieldKey, setSelectedFieldKey] = useState<GoalsBodyMeasurementFieldKey>(objectiveGraphMeta.defaultFieldKey);

  useEffect(() => {
    setSelectedFieldKey(objectiveGraphMeta.defaultFieldKey);
  }, [objectiveGraphMeta.defaultFieldKey]);

  const selectedField = useMemo(
    () => BODY_MEASUREMENT_FIELDS.find((field) => field.key === selectedFieldKey) ?? BODY_MEASUREMENT_FIELDS[0],
    [selectedFieldKey]
  );
  const chartConfig = useMemo<ChartConfig>(
    () => ({
      measurement: {
        label: selectedField.shortLabel,
        color: objectiveGraphMeta.accentColor,
      },
    }),
    [objectiveGraphMeta.accentColor, selectedField.shortLabel]
  );
  const chartPoints = useMemo(
    () => buildMeasurementChartPoints(bodyMeasurements, selectedFieldKey),
    [bodyMeasurements, selectedFieldKey]
  );
  const latestChartPoint = chartPoints.at(-1) ?? null;
  const firstChartPoint = chartPoints[0] ?? null;
  const chartDelta = latestChartPoint && firstChartPoint ? latestChartPoint.measurement - firstChartPoint.measurement : null;
  const chartDomain = useMemo(() => {
    if (chartPoints.length === 0) {
      return [0, 10] as const;
    }

    const values = chartPoints.map((point) => point.measurement);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const padding = Math.max((maximum - minimum) * 0.2, 2);

    return [Math.max(minimum - padding, 0), maximum + padding] as const;
  }, [chartPoints]);

  const chartHasData = chartPoints.length > 0;

  async function handleDeleteEntry(entry: UserBodyMeasurementEntry) {
    setDeletingEntryId(entry.id);
    setDeleteError(null);

    try {
      const result = await deleteBodyMeasurementAction({ id: entry.id });

      if (!result.ok) {
        setDeleteError(result.error ?? "No se pudieron eliminar las medidas.");
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
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Datos</p>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Medidas con cinta métrica</h2>
              <p className="text-sm leading-6 text-slate-500">Registra pecho, cintura, cadera, brazos, muslos y pantorrillas.</p>
            </div>

            <Button
              type="button"
              onClick={() => setDialogState({ mode: "create" })}
              className="h-10 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <Plus className="size-4" />
              Crear
            </Button>
          </div>

          <Separator />

          <div className="grid gap-3 rounded-[1.35rem] border border-slate-200/80 bg-slate-50/70 p-4 shadow-sm">
            <div className="grid gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tendencia</p>
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">{selectedField.label}</h3>
                  <p className="text-sm leading-6 text-slate-500">{objectiveGraphMeta.description}</p>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
                  style={{ backgroundColor: objectiveGraphMeta.accentColor }}
                >
                  {objectiveGraphMeta.label}
                </span>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {BODY_MEASUREMENT_FIELDS.map((field) => {
                const isSelected = field.key === selectedFieldKey;

                return (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => setSelectedFieldKey(field.key)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                      isSelected
                        ? "bg-indigo-500 text-white shadow-[0_10px_20px_-12px_rgba(99,102,241,0.8)]"
                        : "bg-white text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {field.shortLabel}
                  </button>
                );
              })}
            </div>

            <div className="rounded-[1.25rem] bg-white p-3 shadow-sm">
              {chartHasData ? (
                <div className="h-[280px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <AreaChart data={chartPoints} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="measurementTrendFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-measurement)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--color-measurement)" stopOpacity={0.06} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid vertical={false} strokeDasharray="4 8" stroke="#E2E8F0" />
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
                      <Area
                        dataKey="measurement"
                        type="monotone"
                        stroke="var(--color-measurement)"
                        fill="url(#measurementTrendFill)"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "var(--color-measurement)", strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="grid min-h-[280px] place-items-center rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 text-center">
                  <div className="max-w-sm px-4 py-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Sin tendencia</p>
                    <p className="mt-2 text-base font-medium text-slate-600">
                      Aun no hay registros para {selectedField.label.toLowerCase()}.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Crea una sesión para ver la curva de ese punto corporal.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MetricStat label="Último dato" value={latestChartPoint ? formatMeasurementValue(latestChartPoint.measurement) : "Sin dato"} />
              <MetricStat label="Cambio" value={formatMeasurementDelta(chartDelta)} accent={chartDelta !== null && chartDelta > 0} />
              <MetricStat label="Puntos" value={`${chartPoints.length}`} />
            </div>
          </div>

          {latestEntry ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Scale className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Última medición</p>
                    <p className="mt-1 text-sm font-medium text-slate-500">{formatBodyMeasurementDateTime(latestEntry.dateIso)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {latestValues.map((fieldValue) => (
                  <div key={fieldValue.key} className="rounded-2xl bg-slate-50 px-3 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{fieldValue.label}</p>
                    <p className="mt-1 text-base font-semibold tracking-tight text-slate-950">{fieldValue.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              <p>No hay medidas guardadas todavía.</p>
              <Button
                type="button"
                onClick={() => setDialogState({ mode: "create" })}
                className="h-10 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <Plus className="size-4" />
                Crear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Historial</p>
            <p className="mt-1 text-sm font-medium text-slate-500">Sesiones guardadas</p>
          </div>
        </div>

        {historyItems.length > 0 ? (
          historyItems.map((entry, index) => (
            <MeasurementHistoryCard
              key={entry.id}
              entry={entry}
              isLatest={index === 0}
              isDeleting={deletingEntryId === entry.id}
              onEdit={() => setDialogState({ mode: "edit", entry })}
              onDelete={() => void handleDeleteEntry(entry)}
            />
          ))
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
            Aun no tienes sesiones de medidas guardadas.
          </div>
        )}

        {deleteError ? <p className="px-1 text-sm font-medium text-red-600">{deleteError}</p> : null}
      </div>

      <GoalsMeasurementsDialog
        open={dialogState !== null}
        mode={dialogState?.mode ?? "create"}
        entry={dialogState && "entry" in dialogState ? dialogState.entry : null}
        onOpenChange={(open) => {
          if (!open) {
            setDialogState(null);
          }
        }}
      />
    </div>
  );
}

function MetricStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={cn("mt-1 text-base font-semibold tracking-tight text-slate-950", accent && "text-emerald-600")}>{value}</p>
    </div>
  );
}

function MeasurementHistoryCard({
  entry,
  isLatest,
  isDeleting,
  onEdit,
  onDelete,
}: {
  entry: UserBodyMeasurementEntry;
  isLatest: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const values = buildBodyMeasurementValues(entry);

  return (
    <Card className={cn("overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.04)]", isLatest && "border-emerald-200")}>
      <CardContent className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{isLatest ? "Última sesión" : "Sesión"}</p>
            <p className={cn("mt-1 text-sm font-medium", isLatest ? "text-emerald-600" : "text-slate-500")}>{formatBodyMeasurementDateTime(entry.dateIso)}</p>
          </div>

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
                className="gap-2 rounded-xl px-2.5 py-2 text-sm text-rose-600 outline-none transition-colors focus:!bg-rose-50 focus:!text-rose-700"
              >
                <span className="flex size-4 items-center justify-center text-rose-500">
                  {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                </span>
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {values.map((fieldValue) => (
            <div key={fieldValue.key} className="rounded-2xl bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{fieldValue.label}</p>
              <p className="mt-1 text-base font-semibold tracking-tight text-slate-950">{fieldValue.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
