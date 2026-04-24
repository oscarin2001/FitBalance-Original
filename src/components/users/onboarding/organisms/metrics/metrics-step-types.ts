import type { MetricsDraft } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import type { MetricsDraftFieldErrors } from "@/actions/server/users/onboarding/logic/client";

export type MetricsStepFormFieldErrors = MetricsDraftFieldErrors;

export type MetricsStepFormProps = {
  value: MetricsDraft;
  isPending: boolean;
  fieldErrors?: MetricsStepFormFieldErrors;
  errorMessage?: string;
  submitLabel: string;
  backLabel: string;
  onChange: (value: MetricsDraft) => void;
  onClearFieldError: (field: keyof MetricsDraft) => void;
  onBack: () => void;
  onContinue: (value: MetricsDraft) => void;
};
