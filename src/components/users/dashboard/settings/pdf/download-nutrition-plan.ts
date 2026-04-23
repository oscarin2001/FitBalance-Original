"use client";

import { downloadNutritionPlanPdf } from "./pdf-generator";

type NutritionPlanPdfApiResponse = {
  ok: boolean;
  data?: {
    pdfPayload?: {
      serializedText: string;
    };
  };
  error?: string;
};

export type DownloadNutritionPlanPdfResult =
  | { ok: true }
  | { ok: false; error: string };

export async function downloadCurrentNutritionPlanPdf(userName: string): Promise<DownloadNutritionPlanPdfResult> {
  try {
    const response = await fetch("/api/users/diet", { method: "POST" });
    const payload = (await response.json()) as NutritionPlanPdfApiResponse;

    if (!response.ok || !payload.ok || !payload.data?.pdfPayload?.serializedText) {
      return {
        ok: false,
        error: payload.error ?? "No se pudo generar el PDF.",
      };
    }

    downloadNutritionPlanPdf({
      userName,
      serializedText: payload.data.pdfPayload.serializedText,
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo generar el PDF.",
    };
  }
}