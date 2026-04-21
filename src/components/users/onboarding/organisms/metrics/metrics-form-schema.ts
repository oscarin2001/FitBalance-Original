import { z } from "zod";

import type { ObjectiveValue } from "@/actions/server/users/onboarding/types/onboarding-ui-types";

export const metricsFormSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(2, "Ingresa un nombre valido.")
      .max(50, "Ingresa un nombre valido.")
      .regex(/^[A-Za-z\u00C0-\u024F' -]+$/, "Ingresa un nombre valido."),
    apellido: z
      .string()
      .trim()
      .min(2, "Ingresa un apellido valido.")
      .max(50, "Ingresa un apellido valido.")
      .regex(/^[A-Za-z\u00C0-\u024F' -]+$/, "Ingresa un apellido valido."),
    edad: z.string().refine((value) => Number(value) >= 14 && Number(value) <= 90, {
      message: "La edad permitida es entre 14 y 90 anos.",
    }),
    sexo: z.enum(["Masculino", "Femenino"] as const),
    alturaCm: z.string().refine((value) => Number(value) > 0, {
      message: "Ingresa una altura valida.",
    }),
    pesoActual: z.string().refine((value) => Number(value) > 0, {
      message: "Ingresa un peso actual valido.",
    }),
    objetivo: z.enum(["Bajar_grasa", "Mantenimiento", "Ganar_musculo"] as const),
    nivelActividad: z.enum(["Sedentario", "Ligero", "Moderado", "Activo"] as const),
    velocidadCambio: z.enum(["Lento", "Moderado", "Rapido"] as const),
    usarObjetivoSugerido: z.boolean(),
    pesoObjetivoManual: z.string(),
  })
  .superRefine((value, ctx) => {
    const currentWeight = Number(value.pesoActual);
    const manualTarget = Number(value.pesoObjetivoManual);

    if (!Number.isFinite(currentWeight) || currentWeight <= 0) {
      return;
    }

    if (value.objetivo === "Mantenimiento" || value.usarObjetivoSugerido) {
      return;
    }

    if (!Number.isFinite(manualTarget) || manualTarget <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesoObjetivoManual"],
        message: "Ingresa un peso objetivo valido.",
      });
      return;
    }

    if (value.objetivo === "Bajar_grasa" && manualTarget >= currentWeight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesoObjetivoManual"],
        message: "Para bajar peso, la meta debe ser menor al peso actual.",
      });
    }

    if (value.objetivo === "Ganar_musculo" && manualTarget <= currentWeight) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pesoObjetivoManual"],
        message: "Para subir peso, la meta debe ser mayor al peso actual.",
      });
    }
  });

export const objectiveDescriptions: Record<ObjectiveValue, string> = {
  Bajar_grasa: "Reducir grasa sin perder el foco en adherencia y energia.",
  Mantenimiento: "Mantener tu peso actual como referencia saludable.",
  Ganar_musculo: "Subir de peso de forma progresiva, priorizando masa magra.",
};
