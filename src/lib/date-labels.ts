const DAY_IN_MS = 86_400_000;

const WEEKDAY_LABELS = ["DOM.", "LUN.", "MAR.", "MIÉ.", "JUE.", "VIE.", "SÁB."];
const MONTH_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const WEEKDAY_FULL_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const BOLIVIA_TIME_ZONE = "America/La_Paz";

function getDateParts(date: Date, timeZone = BOLIVIA_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});

  return {
    year: parts.year ?? "0000",
    month: parts.month ?? "01",
    day: parts.day ?? "01",
  };
}

export function toDateKey(date: Date, timeZone = BOLIVIA_TIME_ZONE) {
  const parts = getDateParts(date, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function shiftDateKey(dateKey: string, deltaDays: number) {
  const nextDate = parseDateKey(dateKey);
  nextDate.setUTCDate(nextDate.getUTCDate() + deltaDays);
  return toDateKey(nextDate);
}

export function getDateKeyDifference(leftDateKey: string, rightDateKey: string) {
  return Math.round((parseDateKey(leftDateKey).getTime() - parseDateKey(rightDateKey).getTime()) / DAY_IN_MS);
}

export function formatCompactDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${WEEKDAY_LABELS[date.getUTCDay()]} ${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatWeekdayLabel(date: Date, timeZone = BOLIVIA_TIME_ZONE) {
  const dateKey = toDateKey(date, timeZone);
  const weekdayIndex = parseDateKey(dateKey).getUTCDay();
  return WEEKDAY_FULL_LABELS[weekdayIndex] ?? WEEKDAY_FULL_LABELS[0];
}

export function formatRelativeDateLabel(dateKey: string, referenceDate = new Date()) {
  const diffDays = getDateKeyDifference(dateKey, toDateKey(referenceDate));

  if (diffDays === 0) return "Hoy";
  if (diffDays === -1) return "Ayer";
  if (diffDays === 1) return "Mañana";

  return formatCompactDate(dateKey);
}