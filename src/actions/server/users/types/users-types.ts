import { NivelActividad, Objetivo, VelocidadCambio, type ComidaTipo } from "@prisma/client";

export type UserNutritionPlanMeal = {
  mealType: ComidaTipo;
  recipeName: string;
  foods: string[];
};

export type UserNutritionPlanDay = {
  dayLabel: string;
  dateIso: string;
  meals: UserNutritionPlanMeal[];
};

export type UserNutritionPlan = {
  generatedAt: string;
  objective: Objetivo;
  imc: number | null;
  activityLevel: NivelActividad;
  speed: VelocidadCambio;
  formulaName: string;
  tmbKcal: number;
  gastoTotalKcal: number;
  walkingFactor: number;
  trainingFactor: number;
  ajusteCaloricoPct: number;
  ajusteCaloricoKcal: number;
  dailyWaterLiters: number;
  targetCalories: number;
  corrections?: string[];
  warning: string | null;
  days: UserNutritionPlanDay[];
};

export type UserListItem = {
  id: number;
  nombre: string;
  apellido: string;
  pais: string | null;
  objetivo: Objetivo | null;
  fecha_creacion: Date;
};

export type UserDetail = {
  id: number;
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  sexo: string;
  altura_cm: number | null;
  peso_kg: number | null;
  objetivo: Objetivo | null;
  nivel_actividad: NivelActividad | null;
  tipo_entrenamiento: string | null;
  nivel_experiencia: string | null;
  frecuencia_entreno: number | null;
  anos_entrenando: number | null;
  pais: string | null;
  peso_objetivo_kg: number | null;
  velocidad_cambio: VelocidadCambio | null;
  terminos_aceptados: boolean;
  fecha_creacion: Date;
  updatedAt: Date;
  nutritionPlan: UserNutritionPlan | null;
};

export type CreateUserInput = {
  nombre: string;
  apellido: string;
  fecha_nacimiento: Date;
  sexo: string;
  terminos_aceptados: boolean;
  altura_cm?: number;
  peso_kg?: number;
  objetivo?: Objetivo;
  nivel_actividad?: NivelActividad;
  pais?: string;
  peso_objetivo_kg?: number;
  velocidad_cambio?: VelocidadCambio;
};

export type UpdateUserInput = Partial<CreateUserInput>;

export type DashboardMacroTotals = {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
};

export type UserDashboardMealIngredient = {
  name: string;
  grams: number;
  portionLabel: string;
  category: string | null;
  isBeverage: boolean;
  role?: string | null;
  nutrition: DashboardMacroTotals;
};

export type UserDashboardMeal = {
  id: number;
  mealType: ComidaTipo;
  recipeName: string;
  foods: string[];
  ingredients: UserDashboardMealIngredient[];
  instructions: string[];
  instructionsSource: "database" | "generated";
  totals: DashboardMacroTotals;
  summaryLabel?: string;
  applied?: boolean;
  isShared?: boolean;
  sharedByName?: string | null;
  sharedAtIso?: string | null;
  createdByName?: string | null;
};

export type UserDashboardWeeklyRecipeDay = {
  dayLabel: string;
  dateIso: string;
  meals: UserDashboardMeal[];
};

export type UserDashboardPlan = {
  objective: Objetivo | null;
  carbLabel: string;
  selectedDateIso: string;
  selectedDateLabel: string;
  hasPlanForToday: boolean;
  periodDays: number;
  dailyWaterLiters: number;
  waterConsumedLiters: number;
  dayCompleted: boolean;
  dayTotals: DashboardMacroTotals;
  dayTargets: DashboardMacroTotals;
  weekTotals: DashboardMacroTotals;
  weekTargets: DashboardMacroTotals;
  meals: UserDashboardMeal[];
  weeklyRecipes: UserDashboardWeeklyRecipeDay[];
};

export type UserDashboardProfile = {
  nombre: string;
  apellido: string;
  birthDateIso: string;
  sexo: string;
  alturaCm: number | null;
  pesoKg: number | null;
  pesoObjetivoKg: number | null;
  tipoEntrenamiento: string | null;
  frecuenciaEntreno: number | null;
  anosEntrenando: number | null;
};

export type UserWeightHistoryEntry = {
  id: number;
  dateIso: string;
  weightKg: number;
};

export type UserBodyMeasurementEntry = {
  id: number;
  dateIso: string;
  pechoCm: number | null;
  cinturaCm: number | null;
  caderaCm: number | null;
  brazoCm: number | null;
  musloCm: number | null;
  pantorrillaCm: number | null;
};
