import { redirect } from "next/navigation";

import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { OnboardingSummaryRouteStep } from "@/components/users/onboarding";

export const dynamic = "force-dynamic";

type OnboardingSummaryPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function OnboardingSummaryPage({ searchParams }: OnboardingSummaryPageProps) {
  const query = await searchParams;
  const state = await loadOnboardingPageState({
    allowEditingOnCompleted: query.edit === "summary",
  });

  if (query.edit === "summary") {
    return (
      <OnboardingSummaryRouteStep
        userName={state.userName}
        initialMetrics={state.initialMetrics}
        initialTraining={state.initialTraining}
      />
    );
  }

  if (state.initialStep === "metrics") {
    redirect("/users/onboarding/data");
  }

  if (state.initialStep === "training") {
    redirect("/users/onboarding/training");
  }

  if (state.initialStep === "foods") {
    redirect("/users/onboarding/foods");
  }

  return (
    <OnboardingSummaryRouteStep
      userName={state.userName}
      initialMetrics={state.initialMetrics}
      initialTraining={state.initialTraining}
    />
  );
}
