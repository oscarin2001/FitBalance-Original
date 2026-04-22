"use client";

import { ArrowLeft, Dumbbell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { TrainingDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import type { TrainingErrors } from "../templates/steps/validators";
import {
  TrainingActivitySection,
  TrainingNumbersSection,
  TrainingTypeSection,
} from "./training-step-sections";

type TrainingStepFormProps = {
  value: TrainingDraft;
  isPending: boolean;
  fieldErrors?: TrainingErrors;
  errorMessage?: string;
  submitLabel: string;
  backLabel: string;
  onChange: (value: TrainingDraft) => void;
  onClearFieldError: (field: keyof TrainingDraft) => void;
  onBack: () => void;
  onContinue: (value: TrainingDraft) => void;
};

export function TrainingStepForm({
  value,
  isPending,
  fieldErrors,
  errorMessage,
  submitLabel,
  backLabel,
  onChange,
  onClearFieldError,
  onBack,
  onContinue,
}: TrainingStepFormProps) {
  return (
    <Card className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.4)] backdrop-blur">
      <CardHeader className="gap-2 border-b border-slate-200/70 pb-5">
        <CardTitle className="flex items-center gap-2 text-2xl tracking-tight text-slate-950">
          <Dumbbell className="size-5 text-cyan-700" />
          Entrenamiento
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-6 py-6">
        <TrainingActivitySection value={value} fieldErrors={fieldErrors} onChange={onChange} onClearFieldError={onClearFieldError} />
        <Separator />
        <TrainingTypeSection value={value} fieldErrors={fieldErrors} onChange={onChange} onClearFieldError={onClearFieldError} />
        {value.tipoEntrenamiento !== "No_entrena" ? <Separator /> : null}
        <TrainingNumbersSection value={value} fieldErrors={fieldErrors} onChange={onChange} onClearFieldError={onClearFieldError} />

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="h-12 rounded-2xl" disabled={isPending} onClick={onBack}>
          <ArrowLeft className="size-4" />
          {backLabel}
        </Button>
        <Button type="button" className="h-12 rounded-2xl" disabled={isPending} onClick={() => onContinue(value)}>
          {isPending ? "Continuando..." : submitLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}