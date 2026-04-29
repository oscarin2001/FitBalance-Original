import { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";
import { z } from "zod";

import {
  buildMissingFoodCategoriesMessage,
  getMissingFoodCategories,
  requiredFoodCategories,
} from "../constants";

export type ActionResult = {
  ok: boolean;
  message?: string;
  error?: string;
};

export const metricsSchema = z.object({
  nombre: z.string().trim().min(2).max(50).regex(/^[A-Za-z\u00C0-\u024F' -]+$/),
  apellido: z.string().trim().min(2).max(50).regex(/^[A-Za-z\u00C0-\u024F' -]+$/),
  fechaNacimiento: z.string().min(10),
  sexo: z.enum(["Masculino", "Femenino"]),
  alturaCm: z.number().min(120).max(230),
  pesoKg: z.number().min(35).max(250),
  pesoObjetivoKg: z.number().min(35).max(250),
  objetivo: z.nativeEnum(Objetivo),
  nivelActividad: z.nativeEnum(NivelActividad),
  velocidadCambio: z.nativeEnum(VelocidadCambio),
}).superRefine((value, ctx) => {
  if (value.objetivo === Objetivo.Bajar_grasa && value.pesoObjetivoKg >= value.pesoKg) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pesoObjetivoKg"],
      message: "Para bajar grasa, la meta debe ser menor al peso actual.",
    });
  }

  if (value.objetivo === Objetivo.Ganar_musculo && value.pesoObjetivoKg <= value.pesoKg) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["pesoObjetivoKg"],
      message: "Para ganar musculo, la meta debe ser mayor al peso actual.",
    });
  }
});

export const trainingSchema = z.object({
  nivelActividad: z.nativeEnum(NivelActividad),
  tipoEntrenamiento: z.enum(["Musculacion", "Cardio", "Mixto", "No_entrena"]),
  frecuenciaEntreno: z.number().int().min(0).max(7),
  anosEntrenando: z.number().min(0).max(60),
}).superRefine((value, ctx) => {
  if (value.tipoEntrenamiento === "No_entrena") {
    if (value.frecuenciaEntreno !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["frecuenciaEntreno"],
        message: "Si no entrenas, la frecuencia debe ser 0.",
      });
    }

    if (value.anosEntrenando !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anosEntrenando"],
        message: "Si no entrenas, los anos entrenando deben ser 0.",
      });
    }

    return;
  }

  if (value.frecuenciaEntreno < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["frecuenciaEntreno"],
      message: "Ingresa al menos 1 dia por semana.",
    });
  }
});

export const foodSchema = z.object({
  preferencias: z.record(z.string(), z.array(z.string())),
  diasDieta: z.array(z.string()).min(1).max(7),
}).superRefine((value, ctx) => {
  const missingCategories = getMissingFoodCategories(
    requiredFoodCategories.reduce<Record<string, string[]>>((acc, category) => {
      acc[category] = value.preferencias[category] ?? [];
      return acc;
    }, {})
  );

  if (missingCategories.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["preferencias"],
      message: buildMissingFoodCategoriesMessage(missingCategories),
    });
  }
});

export function buildActionError(message: string): ActionResult {
  return { ok: false, error: message };
}

export function getSpanishValidationMessage(error: z.ZodError, fallback = "Revisa los campos.") {
  const issue = error.issues[0];

  if (!issue) {
    return fallback;
  }

  switch (issue.code) {
    case "invalid_type":
      return "El formato del campo no es válido.";
    case "too_small":
      return "El valor es demasiado pequeño.";
    case "too_big":
      return "El valor excede el máximo permitido.";
    case "invalid_format":
      return "El formato del campo no es válido.";
    case "custom":
      return issue.message || fallback;
    default:
      return fallback;
  }
}
