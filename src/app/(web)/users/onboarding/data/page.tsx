import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { redirect } from "next/navigation";
import { OnboardingMetricsRouteStep } from "@/components/users/onboarding";

export const dynamic = "force-dynamic";

type OnboardingDataPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function OnboardingDataPage({ searchParams }: OnboardingDataPageProps) {
  const [state, query] = await Promise.all([loadOnboardingPageState(), searchParams]);
  const isEditingMetrics = query.edit === "metrics";

  if (!isEditingMetrics) {
    if (state.initialStep === "training") {
      redirect("/users/onboarding/training");
    }

    if (state.initialStep === "foods") {
      redirect("/users/onboarding/foods");
    }

    if (state.initialStep === "summary") {
      redirect("/users/onboarding/summary");
    }
  }

  return (
    <OnboardingMetricsRouteStep
      userName={state.userName}
      initialMetrics={state.initialMetrics}
    />
  );
}
