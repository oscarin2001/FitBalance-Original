import type { UserBodyMeasurementEntry } from "@/actions/server/users/types";

export const BODY_MEASUREMENT_MIN_CM = 10;
export const BODY_MEASUREMENT_MAX_CM = 250;

export type GoalsBodyMeasurementFieldKey =
  | "pechoCm"
  | "cinturaCm"
  | "caderaCm"
  | "brazoCm"
  | "musloCm"
  | "pantorrillaCm";

export type GoalsBodyMeasurementFieldDefinition = {
  key: GoalsBodyMeasurementFieldKey;
  label: string;
  shortLabel: string;
  instruction: string;
};

export type GoalsBodyMeasurementFieldValue = {
  key: GoalsBodyMeasurementFieldKey;
  label: string;
  value: string;
};

export const BODY_MEASUREMENT_FIELDS: GoalsBodyMeasurementFieldDefinition[] = [
  {
    key: "pechoCm",
    label: "Pecho / busto",
    shortLabel: "Pecho",
    instruction: "Se mide alrededor de la parte mas ancha del pecho. En mujeres, alrededor del busto sin apretar demasiado.",
  },
  {
    key: "cinturaCm",
    label: "Cintura",
    shortLabel: "Cintura",
    instruction: "Se mide a la altura del ombligo o la parte mas estrecha del abdomen.",
  },
  {
    key: "caderaCm",
    label: "Cadera",
    shortLabel: "Cadera",
    instruction: "Se mide en la parte mas ancha de los gluteos.",
  },
  {
    key: "brazoCm",
    label: "Brazos (biceps)",
    shortLabel: "Brazos",
    instruction: "Se mide en la parte media del brazo. Puede hacerse relajado o flexionado.",
  },
  {
    key: "musloCm",
    label: "Muslos (piernas)",
    shortLabel: "Muslos",
    instruction: "Se mide en la parte mas gruesa del muslo.",
  },
  {
    key: "pantorrillaCm",
    label: "Pantorrillas",
    shortLabel: "Pantorrilla",
    instruction: "Se mide en la parte mas ancha de la pantorrilla.",
  },
];

export function formatMeasurementValue(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "Sin dato";
  }

  return `${Number.isInteger(value) ? Math.round(value) : value.toFixed(1)} cm`;
}

export function formatBodyMeasurementDateTime(dateIso: string) {
  const parsedDate = new Date(dateIso);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Fecha invalida";
  }

  const datePart = new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
  const timePart = new Intl.DateTimeFormat("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);

  return `${datePart} ${timePart}`.replace(/\./g, "").trim();
}

export function hasBodyMeasurementValues(entry: UserBodyMeasurementEntry) {
  return BODY_MEASUREMENT_FIELDS.some((field) => entry[field.key] !== null);
}

export function buildBodyMeasurementValues(entry: UserBodyMeasurementEntry): GoalsBodyMeasurementFieldValue[] {
  return BODY_MEASUREMENT_FIELDS.map((field) => ({
    key: field.key,
    label: field.shortLabel,
    value: formatMeasurementValue(entry[field.key]),
  }));
}

export function getBodyMeasurementInstructionItems() {
  return BODY_MEASUREMENT_FIELDS;
}
