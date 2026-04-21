import { PencilLine, Target } from "lucide-react";

import type { ObjectiveValue } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TargetWeightCardProps = {
  objective: ObjectiveValue;
  helperCopy: string;
  weightUnit: string;
  resolvedTargetDisplay: number;
  suggestedTargetDisplay: number;
  isUsingSuggested: boolean;
  targetError?: string;
  onOpenTargetEditor: () => void;
};

export function TargetWeightCard({
  objective,
  helperCopy,
  weightUnit,
  resolvedTargetDisplay,
  suggestedTargetDisplay,
  isUsingSuggested,
  targetError,
  onOpenTargetEditor,
}: TargetWeightCardProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-cyan-700" />
            <span className="font-medium text-slate-950">
              {objective === "Mantenimiento" ? "Peso de referencia" : "Peso objetivo"}
            </span>
            <Badge variant="outline" className="rounded-full">
              {objective === "Mantenimiento"
                ? "Automatico"
                : isUsingSuggested
                  ? "Sugerido"
                  : "Manual"}
            </Badge>
          </div>
          <p className="text-sm text-slate-700">{helperCopy}</p>
        </div>

        {objective !== "Mantenimiento" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-2xl border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50"
            onClick={onOpenTargetEditor}
          >
            <PencilLine className="size-4" />
            Editar objetivo
          </Button>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {resolvedTargetDisplay} {weightUnit}
          </p>
          {objective !== "Mantenimiento" ? (
            <p className="text-sm font-medium text-slate-700">
              Sugerencia actual: {suggestedTargetDisplay} {weightUnit}
            </p>
          ) : null}
        </div>
      </div>

      {targetError ? <p className="text-sm text-red-600">{targetError}</p> : null}
    </div>
  );
}
