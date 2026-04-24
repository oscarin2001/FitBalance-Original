export type GoalsWeightUnit = "kg" | "lb";

export type GoalsRangeKey = "1m" | "3m" | "6m" | "1y";

export type GoalsRangeOption = {
  key: GoalsRangeKey;
  label: string;
  days: number;
};

export type GoalsProjectionPoint = {
  dateIso: string;
  dateLabel: string;
  weight: number;
  target: number;
};

export type GoalsWeightHistoryEntry = {
  dateIso: string;
  weightKg: number;
};

export const GOALS_RANGE_OPTIONS: GoalsRangeOption[] = [
  { key: "1m", label: "1 mes", days: 30 },
  { key: "3m", label: "3 meses", days: 90 },
  { key: "6m", label: "6 meses", days: 180 },
  { key: "1y", label: "1 año", days: 365 },
];

const KG_TO_LB = 2.2046226218;

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
  })
    .format(date)
    .replace(/\./g, "")
    .trim()
    .toUpperCase();
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortHistoryEntries<T extends GoalsWeightHistoryEntry>(entries: T[]) {
  return entries
    .map((entry) => ({ ...entry, date: parseDate(entry.dateIso) }))
    .filter((entry): entry is T & { date: Date } => Boolean(entry.date))
    .sort((left, right) => left.date.getTime() - right.date.getTime());
}

export function getWeightHistoryWindow<T extends GoalsWeightHistoryEntry>(entries: T[], rangeKey: GoalsRangeKey, startDate = new Date()) {
  const rangeStart = addDays(startDate, -getRangeDays(rangeKey));

  return sortHistoryEntries(entries).filter((entry) => entry.date >= rangeStart && entry.date <= startDate);
}

export function convertWeightKgToUnit(valueKg: number, unit: GoalsWeightUnit) {
  return unit === "lb" ? valueKg * KG_TO_LB : valueKg;
}

export function convertWeightUnitToKg(value: number, unit: GoalsWeightUnit) {
  return unit === "lb" ? value / KG_TO_LB : value;
}

export function formatWeight(valueKg: number | null, unit: GoalsWeightUnit) {
  if (valueKg === null || Number.isNaN(valueKg)) {
    return "Sin dato";
  }

  const convertedValue = convertWeightKgToUnit(valueKg, unit);

  if (unit === "kg") {
    return `${Math.round(convertedValue)} kg`;
  }

  return `${convertedValue.toFixed(1)} lb`;
}

export function formatChartWeight(valueKg: number, unit: GoalsWeightUnit) {
  const convertedValue = convertWeightKgToUnit(valueKg, unit);
  return unit === "kg" ? Math.round(convertedValue) : Number(convertedValue.toFixed(1));
}

export function formatWeightDifference(valueKg: number | null, unit: GoalsWeightUnit) {
  if (valueKg === null || Number.isNaN(valueKg)) {
    return "Sin dato";
  }

  const convertedValue = Math.abs(convertWeightKgToUnit(valueKg, unit));
  const roundedValue = unit === "kg" ? Math.round(convertedValue) : Number(convertedValue.toFixed(1));
  const sign = valueKg > 0 ? "+" : valueKg < 0 ? "-" : "";

  return `${sign}${roundedValue} ${unit}`;
}

export function formatRangeLabel(rangeKey: GoalsRangeKey) {
  return GOALS_RANGE_OPTIONS.find((option) => option.key === rangeKey)?.label ?? "3 meses";
}

export function formatGoalDate(date: Date) {
  return formatShortDate(date);
}

export function formatHistoryDateTime(dateIso: string) {
  const parsedDate = new Date(dateIso);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Fecha invalida";
  }

  const dateParts = new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(parsedDate);
  const timeParts = new Intl.DateTimeFormat("es-BO", {
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(parsedDate);

  const day = dateParts.find((part) => part.type === "day")?.value ?? "";
  const month = (dateParts.find((part) => part.type === "month")?.value ?? "").replace(/\./g, "");
  const year = dateParts.find((part) => part.type === "year")?.value ?? "";
  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "00";

  return `${day} de ${month} de ${year} ${hour}:${minute}`.trim();
}

export function getRangeDays(rangeKey: GoalsRangeKey) {
  return GOALS_RANGE_OPTIONS.find((option) => option.key === rangeKey)?.days ?? 90;
}

export function getGoalDirectionLabel(currentWeightKg: number, targetWeightKg: number) {
  if (targetWeightKg < currentWeightKg) {
    return "por debajo de";
  }

  if (targetWeightKg > currentWeightKg) {
    return "por encima de";
  }

  return "en";
}

export function formatGoalLabel(currentWeightKg: number, targetWeightKg: number | null, unit: GoalsWeightUnit) {
  if (targetWeightKg === null) {
    return "Meta: sin dato";
  }

  const targetLabel = formatWeight(targetWeightKg, unit);
  const direction = getGoalDirectionLabel(currentWeightKg, targetWeightKg);

  if (direction === "en") {
    return `Meta: ${targetLabel}`;
  }

  return `Meta: ${direction} ${targetLabel}`;
}

export function buildProjectionSeries(options: {
  historyEntries: GoalsWeightHistoryEntry[];
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  unit: GoalsWeightUnit;
  rangeKey: GoalsRangeKey;
  pointsCount?: number;
  startDate?: Date;
}): GoalsProjectionPoint[] {
  const startDate = options.startDate ? new Date(options.startDate) : new Date();
  const rangeDays = getRangeDays(options.rangeKey);
  const pointsCount = options.pointsCount ?? (options.rangeKey === "1y" ? 13 : options.rangeKey === "6m" ? 9 : 7);
  const resolvedTargetWeightKg = options.targetWeightKg ?? options.currentWeightKg ?? 0;
  const { unit } = options;
  const historyInRange = getWeightHistoryWindow(options.historyEntries, options.rangeKey, startDate);
  const rangeStart = addDays(startDate, -rangeDays);

  if (historyInRange.length >= 2) {
    return historyInRange.map((entry) => ({
      dateIso: entry.date.toISOString(),
      dateLabel: formatShortDate(entry.date),
      weight: formatChartWeight(entry.weightKg, unit),
      target: formatChartWeight(resolvedTargetWeightKg, unit),
    }));
  }

  const fallbackWeightKg = historyInRange.at(-1)?.weightKg ?? options.currentWeightKg ?? resolvedTargetWeightKg;
  const safeWeightKg = fallbackWeightKg ?? 0;
  const stepDays = pointsCount > 1 ? rangeDays / (pointsCount - 1) : 0;

  return Array.from({ length: Math.max(pointsCount, 2) }, (_, index) => {
    const date = addDays(rangeStart, Math.round(stepDays * index));

    return {
      dateIso: date.toISOString(),
      dateLabel: formatShortDate(date),
      weight: formatChartWeight(safeWeightKg, unit),
      target: formatChartWeight(resolvedTargetWeightKg, unit),
    };
  });
}
