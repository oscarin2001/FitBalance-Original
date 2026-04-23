import type { LucideIcon } from "lucide-react";
import { ChefHat, Dumbbell, Scale } from "lucide-react";

export type ReminderTone = "teal" | "emerald" | "slate";

export type ReminderScheduleRow = {
  label: string;
  value: string;
};

export type ReminderAccordionItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: ReminderTone;
  scheduleRows: ReminderScheduleRow[];
};

export const reminderAccordionItems: ReminderAccordionItem[] = [
  {
    id: "meal-reminders",
    title: "Recordatorios de Comidas",
    description: "Avisos para desayuno, almuerzo, cena y colaciones.",
    icon: ChefHat,
    tone: "teal",
    scheduleRows: [
      { label: "Desayuno", value: "08:30" },
      { label: "Almuerzo", value: "13:30" },
      { label: "Cena", value: "20:30" },
    ],
  },
  {
    id: "exercise-reminders",
    title: "Recordatorios de Ejercicio",
    description: "Te recordará mover el cuerpo antes o después del entrenamiento.",
    icon: Dumbbell,
    tone: "emerald",
    scheduleRows: [
      { label: "Antes de entrenar", value: "45 min" },
      { label: "Después de entrenar", value: "15 min" },
    ],
  },
  {
    id: "weight-reminders",
    title: "Recordatorios de peso",
    description: "Seguimiento semanal del peso corporal sin saturar el día.",
    icon: Scale,
    tone: "slate",
    scheduleRows: [
      { label: "Frecuencia", value: "1 vez por semana" },
      { label: "Momento", value: "Lunes al despertar" },
    ],
  },
];
