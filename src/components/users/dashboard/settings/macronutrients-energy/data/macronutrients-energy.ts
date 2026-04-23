export type EnergyFrequencyValue = "Diario" | "Dias_especificos" | "Personalizado";

export type EnergyDirectionValue = "encima" | "debajo";

export type EnergyMetricKey =
  | "calorias"
  | "caloriasQuemadas"
  | "carbosTotales"
  | "carbosNetos"
  | "grasa"
  | "proteina"
  | "fibra"
  | "azucar"
  | "azucarAnadido"
  | "alcoholesDeAzucar"
  | "alulosa"
  | "almidon"
  | "grasasSaturadas"
  | "grasasMonoinsaturadas"
  | "grasasPoliinsaturadas"
  | "grasasOmega3"
  | "acidosGrasosOmega6"
  | "colesterol"
  | "cargaGlucemica";

export type EnergyMetricRow = {
  key: EnergyMetricKey;
  label: string;
  unit: string;
  defaultValue: number;
  defaultDirection: EnergyDirectionValue;
  advanced?: boolean;
};

export type EnergyFrequencyOption = {
  value: EnergyFrequencyValue;
  label: string;
  description: string;
};

export const energyFrequencyOptions: EnergyFrequencyOption[] = [
  {
    value: "Diario",
    label: "Diario",
    description: "Aplica estos objetivos todos los días.",
  },
  {
    value: "Dias_especificos",
    label: "Días específicos",
    description: "Ajusta solo días concretos de la semana.",
  },
  {
    value: "Personalizado",
    label: "Personalizado",
    description: "Deja una vista previa flexible mientras pruebas cambios.",
  },
];

export const energyMetricRows: EnergyMetricRow[] = [
  { key: "calorias", label: "Calorías", unit: "kCal", defaultValue: 1900, defaultDirection: "debajo" },
  { key: "caloriasQuemadas", label: "Calorías quemadas", unit: "kCal", defaultValue: 0, defaultDirection: "encima" },
  { key: "carbosTotales", label: "Carbos totales", unit: "g", defaultValue: 15, defaultDirection: "debajo" },
  { key: "carbosNetos", label: "Carbos netos", unit: "g", defaultValue: 15, defaultDirection: "debajo" },
  { key: "grasa", label: "Grasa", unit: "g", defaultValue: 127, defaultDirection: "debajo" },
  { key: "proteina", label: "Proteína", unit: "g", defaultValue: 170, defaultDirection: "debajo" },
  { key: "fibra", label: "Fibra", unit: "g", defaultValue: 0, defaultDirection: "encima", advanced: true },
  { key: "azucar", label: "Azúcar", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "azucarAnadido", label: "Azúcar añadido", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "alcoholesDeAzucar", label: "Alcoholes de azúcar", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "alulosa", label: "Alulosa", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "almidon", label: "Almidón", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "grasasSaturadas", label: "Grasas saturadas", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "grasasMonoinsaturadas", label: "Grasas monoinsaturadas", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "grasasPoliinsaturadas", label: "Grasas poliinsaturadas", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "grasasOmega3", label: "Grasas omega-3", unit: "g", defaultValue: 0, defaultDirection: "encima", advanced: true },
  { key: "acidosGrasosOmega6", label: "Ácidos grasos omega-6", unit: "g", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "colesterol", label: "Colesterol", unit: "mg", defaultValue: 0, defaultDirection: "debajo", advanced: true },
  { key: "cargaGlucemica", label: "Carga glucémica", unit: "", defaultValue: 0, defaultDirection: "debajo", advanced: true },
];

export function createInitialEnergyValues() {
  return Object.fromEntries(energyMetricRows.map((row) => [row.key, row.defaultValue])) as Record<
    EnergyMetricKey,
    number
  >;
}

export function createInitialEnergyDirections() {
  return Object.fromEntries(energyMetricRows.map((row) => [row.key, row.defaultDirection])) as Record<
    EnergyMetricKey,
    EnergyDirectionValue
  >;
}
