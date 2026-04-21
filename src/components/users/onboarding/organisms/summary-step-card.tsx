"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Target } from "lucide-react";

import { speedGuides } from "@/actions/server/users/onboarding/constants";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { capitalizeWords, SummaryProfileCard, SummaryTermsDialog } from "./summary-step-card-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAgeFromBirthDate } from "@/actions/server/users/onboarding/logic";

const pendingStages = [
  "Validando tus datos y preferencias...",
  "Calculando tus objetivos calóricos y macros...",
  "Generando propuesta de comidas con IA...",
  "Guardando tu plan inicial en tu cuenta...",
];

type SummaryStepCardProps = {
  metrics: MetricsDraft;
  isPending: boolean;
  errorMessage?: string;
  onBack: () => void;
  onFinish: () => void;
};
export function SummaryStepCard({
  metrics,
  isPending,
  errorMessage,
  onBack,
  onFinish,
}: SummaryStepCardProps) {
  const [pendingStageIndex, setPendingStageIndex] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const selectedSpeedGuide = speedGuides[metrics.velocidadCambio];
  const fullName = capitalizeWords(`${metrics.nombre} ${metrics.apellido}`);
  const age = calculateAgeFromBirthDate(metrics.fechaNacimiento);

  useEffect(() => {
    if (!isPending) {
      return;
    }

    const timer = window.setInterval(() => {
      setPendingStageIndex((previous) =>
        previous >= pendingStages.length - 1 ? previous : previous + 1
      );
    }, 1600);

    return () => {
      window.clearInterval(timer);
    };
  }, [isPending]);

  const pendingStage = pendingStages[Math.min(pendingStageIndex, pendingStages.length - 1)];

  return (
    <Card className="mx-auto w-full max-w-2xl rounded-[2rem] border border-slate-200/70 bg-white/90 shadow-2xl shadow-slate-300/30 backdrop-blur">
      <CardHeader className="space-y-2 pb-2 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl tracking-tight text-slate-900">
          <Target className="size-5 text-primary" />
          Resumen final
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4">
        <SummaryProfileCard
          fullName={fullName}
          age={age}
          sex={metrics.sexo}
          heightCm={metrics.alturaCm}
          objective={metrics.objetivo.replace("_", " ")}
          activity={metrics.nivelActividad}
          speedTitle={selectedSpeedGuide.title}
          weightKg={metrics.pesoKg}
          targetWeightKg={metrics.pesoObjetivoKg}
        />

        {isPending ? (
          <div className="grid gap-2 border-t border-slate-200/70 pt-4 text-sm text-sky-900">
            <p className="flex items-center gap-2 font-semibold text-sky-950">
              <Loader2 className="size-4 animate-spin" />
              Estamos generando el plan por ti mientras carga
            </p>
            <p className="text-sky-900">{pendingStage}</p>
            <p className="text-xs text-sky-800">
              Este proceso puede tardar entre 10 y 30 segundos, según la carga del sistema.
            </p>
          </div>
        ) : null}

        {errorMessage ? <p className="text-center text-sm text-red-600">{errorMessage}</p> : null}

        <SummaryTermsDialog
          accepted={acceptedTerms}
          disabled={isPending}
          onAcceptedChange={setAcceptedTerms}
        />

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onBack} className="h-11 rounded-xl" disabled={isPending}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <Button onClick={onFinish} className="h-11 rounded-xl" disabled={isPending || !acceptedTerms}>
            <CheckCircle2 className="size-4" />
            {isPending ? "Generando plan..." : "Finalizar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
