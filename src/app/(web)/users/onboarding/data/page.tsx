import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { OnboardingMetricsRouteStep } from "@/components/users/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingDataPage() {
  const state = await loadOnboardingPageState();

  return (
    <OnboardingMetricsRouteStep
      userName={state.userName}
      initialMetrics={state.initialMetrics}
    />
  );
}
