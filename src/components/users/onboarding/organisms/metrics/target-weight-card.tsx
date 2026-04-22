import { PencilLine, Target } from "lucide-react";

import type { ObjectiveValue } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
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
        <div className="flex items-center gap-2">
          <Target className="size-4 text-cyan-700" />
          <span className="font-medium text-slate-950">
            {objective === "Mantenimiento" ? "Peso de referencia" : "Peso objetivo"}
          </span>
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
            Editar
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {resolvedTargetDisplay} {weightUnit}
          </p>
        </div>
      </div>

      {targetError ? <p className="text-sm text-red-600">{targetError}</p> : null}
    </div>
  );
}
