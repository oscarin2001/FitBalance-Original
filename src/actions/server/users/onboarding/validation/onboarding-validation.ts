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

export const foodSchema = z.object({
  preferencias: z.record(z.string(), z.array(z.string()).max(10)),
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
