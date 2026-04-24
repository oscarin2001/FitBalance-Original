import type { UseFormReturn } from "react-hook-form";

import {
  type HeightUnit,
  type MetricsFormValues,
} from "@/actions/server/users/onboarding/logic/client";
import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";

import type { MetricsStepFormFieldErrors } from "./metrics-step-types";
import { PersonalNameFields } from "./personal-name-fields";
import { PersonalProfileFields } from "./personal-profile-fields";

type PersonalStepSectionProps = {
  form: UseFormReturn<MetricsFormValues>;
  fieldErrors?: MetricsStepFormFieldErrors;
  heightUnit: HeightUnit;
  onHeightUnitChange: (nextUnit: HeightUnit) => void;
  onClearError: (field: keyof MetricsDraft) => void;
};

export function PersonalStepSection({
  form,
  fieldErrors,
  heightUnit,
  onHeightUnitChange,
  onClearError,
}: PersonalStepSectionProps) {
  return (
    <section className="grid gap-5">
      <PersonalNameFields
        form={form}
        fieldErrors={fieldErrors}
        onClearError={onClearError}
      />
      <PersonalProfileFields
        form={form}
        fieldErrors={fieldErrors}
        heightUnit={heightUnit}
        onHeightUnitChange={onHeightUnitChange}
        onClearError={onClearError}
      />
    </section>
  );
}
