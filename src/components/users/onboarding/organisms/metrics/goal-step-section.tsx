import type { UseFormReturn } from "react-hook-form";

import type {
  MetricsFormValues,
  WeightUnit,
} from "@/actions/server/users/onboarding/logic";
import type {
  MetricsDraft,
  ObjectiveValue,
} from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { Separator } from "@/components/ui/separator";

import { GoalActivityField } from "./goal-activity-field";
import { GoalObjectiveField } from "./goal-objective-field";
import { GoalSpeedField } from "./goal-speed-field";
import type { MetricsStepFormFieldErrors } from "./metrics-step-types";
import { TargetWeightCard } from "./target-weight-card";

function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);

  if (!section) {
    return;
  }

  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

type GoalStepSectionProps = {
  form: UseFormReturn<MetricsFormValues>;
  fieldErrors?: MetricsStepFormFieldErrors;
  objective: ObjectiveValue;
  helperCopy: string;
  weightUnit: WeightUnit;
  resolvedTargetDisplay: number;
  suggestedTargetDisplay: number;
  isUsingSuggested: boolean;
  targetError?: string;
  onOpenTargetEditor: () => void;
  onClearError: (field: keyof MetricsDraft) => void;
};

export function GoalStepSection({
  form,
  fieldErrors,
  objective,
  helperCopy,
  weightUnit,
  resolvedTargetDisplay,
  suggestedTargetDisplay,
  isUsingSuggested,
  targetError,
  onOpenTargetEditor,
  onClearError,
}: GoalStepSectionProps) {
  const nextSectionId = objective !== "Mantenimiento" ? "goal-speed-section" : "goal-target-section";

  return (
    <section className="grid gap-6">
      <div id="goal-objective-section" className="scroll-mt-24">
        <GoalObjectiveField
          form={form}
          fieldErrors={fieldErrors}
          onClearError={onClearError}
          onAdvance={() => scrollToSection("goal-activity-section")}
        />
      </div>

      <Separator />

      <div className="grid gap-5">
        <div id="goal-activity-section" className="scroll-mt-24">
          <GoalActivityField
            form={form}
            fieldErrors={fieldErrors}
            onClearError={onClearError}
            onAdvance={() => scrollToSection(nextSectionId)}
          />
        </div>

        {objective !== "Mantenimiento" ? (
          <div id="goal-speed-section" className="scroll-mt-24">
            <GoalSpeedField
              form={form}
              fieldErrors={fieldErrors}
              onClearError={onClearError}
              onAdvance={() => scrollToSection("goal-target-section")}
            />
          </div>
        ) : null}

        <div id="goal-target-section" className="scroll-mt-24">
          <TargetWeightCard
            objective={objective}
            helperCopy={helperCopy}
            weightUnit={weightUnit}
            resolvedTargetDisplay={resolvedTargetDisplay}
            suggestedTargetDisplay={suggestedTargetDisplay}
            isUsingSuggested={isUsingSuggested}
            targetError={targetError}
            onOpenTargetEditor={onOpenTargetEditor}
          />
        </div>
      </div>
    </section>
  );
}
