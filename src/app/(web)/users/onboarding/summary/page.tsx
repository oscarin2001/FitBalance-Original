import { redirect } from "next/navigation";

import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { OnboardingSummaryRouteStep } from "@/components/users/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingSummaryPage() {
  const state = await loadOnboardingPageState();

  if (state.initialStep === "metrics") {
    redirect("/users/onboarding/data");
  }

  if (state.initialStep === "foods") {
    redirect("/users/onboarding/foods");
  }

  return (
    <OnboardingSummaryRouteStep
      userName={state.userName}
      initialMetrics={state.initialMetrics}
    />
  );
}
