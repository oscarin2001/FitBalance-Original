export type HealthDirectionValue = "encima" | "debajo";

export type HealthMetricKey =
  | "peso"
  | "agua"
  | "dormir"
  | "pasos"
  | "minutosEjercicio"
  | "imc"
  | "grasaCorporal"
  | "masaMagraCorporal";

export type HealthMetricRow = {
  key: HealthMetricKey;
  label: string;
  unit: string;
  defaultValue: number;
  defaultDirection: HealthDirectionValue;
  step?: number;
};

export const healthMetricRows: HealthMetricRow[] = [
  { key: "peso", label: "Peso", unit: "lb", defaultValue: 165.4, defaultDirection: "debajo", step: 0.1 },
  { key: "agua", label: "Agua", unit: "glass", defaultValue: 12, defaultDirection: "encima", step: 1 },
  { key: "dormir", label: "Dormir", unit: "h", defaultValue: 8, defaultDirection: "encima", step: 0.1 },
  { key: "pasos", label: "Pasos", unit: "", defaultValue: 10000, defaultDirection: "debajo", step: 100 },
  { key: "minutosEjercicio", label: "Minutos de ejercicio", unit: "", defaultValue: 120, defaultDirection: "debajo", step: 5 },
  { key: "imc", label: "IMC", unit: "", defaultValue: 32, defaultDirection: "debajo", step: 0.1 },
  { key: "grasaCorporal", label: "Grasa corporal", unit: "%", defaultValue: 25, defaultDirection: "debajo", step: 0.1 },
  { key: "masaMagraCorporal", label: "Masa magra corporal", unit: "lb", defaultValue: 158.8, defaultDirection: "debajo", step: 0.1 },
];

export function createInitialHealthValues() {
  return Object.fromEntries(healthMetricRows.map((row) => [row.key, row.defaultValue])) as Record<
    HealthMetricKey,
    number
  >;
}

export function createInitialHealthDirections() {
  return Object.fromEntries(healthMetricRows.map((row) => [row.key, row.defaultDirection])) as Record<
    HealthMetricKey,
    HealthDirectionValue
  >;
}
