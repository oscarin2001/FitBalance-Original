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
  dailyWaterLiters: number;
  targetCalories: number;
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
};

export type UserDashboardPlan = {
  objective: Objetivo | null;
  carbLabel: string;
  selectedDateIso: string;
  selectedDateLabel: string;
  hasPlanForToday: boolean;
  periodDays: number;
  dayTotals: DashboardMacroTotals;
  dayTargets: DashboardMacroTotals;
  weekTotals: DashboardMacroTotals;
  weekTargets: DashboardMacroTotals;
  meals: UserDashboardMeal[];
};
