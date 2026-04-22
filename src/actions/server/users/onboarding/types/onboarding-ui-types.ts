export type ObjectiveValue = "Bajar_grasa" | "Ganar_musculo" | "Mantenimiento";
export type ActivityValue = "Sedentario" | "Ligero" | "Moderado" | "Activo" | "Extremo";
export type SpeedValue = "Lento" | "Moderado" | "Rapido";
export type GenderValue = "Masculino" | "Femenino";
export type TrainingTypeValue = "Musculacion" | "Cardio" | "Mixto" | "No_entrena";
export type ExperienceLevelValue = "Principiante" | "Intermedio" | "Avanzado";

export type WizardStep = "metrics" | "training" | "foods" | "summary";

export type MetricsDraft = {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: GenderValue;
  alturaCm: number;
  pesoKg: number;
  pesoObjetivoKg: number;
  objetivo: ObjectiveValue;
  nivelActividad: ActivityValue;
  velocidadCambio: SpeedValue;
};

export type TrainingDraft = {
  nivelActividad: ActivityValue;
  tipoEntrenamiento: TrainingTypeValue;
  frecuenciaEntreno: number;
  anosEntrenando: number;
};

export type FoodsDraft = {
  preferencias: Record<string, string[]>;
  diasDieta: string[];
};
