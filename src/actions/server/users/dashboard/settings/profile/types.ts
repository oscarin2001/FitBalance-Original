export type DashboardProfileField =
  | "nombre"
  | "apellido"
  | "sexo"
  | "fechaNacimiento"
  | "alturaCm"
  | "pesoKg"
  | "tipoEntrenamiento"
  | "frecuenciaEntreno"
  | "anosEntrenando";

export type DashboardProfileUpdateInput =
  | { field: "nombre"; value: string }
  | { field: "apellido"; value: string }
  | { field: "sexo"; value: "Masculino" | "Femenino" }
  | { field: "fechaNacimiento"; value: string }
  | { field: "alturaCm"; value: number }
  | { field: "pesoKg"; value: number }
  | { field: "tipoEntrenamiento"; value: "Musculacion" | "Cardio" | "Mixto" | "No_entrena" }
  | { field: "frecuenciaEntreno"; value: number }
  | { field: "anosEntrenando"; value: number };