import { redirect } from "next/navigation";

import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { OnboardingTrainingRouteStep } from "@/components/users/onboarding";

export const dynamic = "force-dynamic";

type OnboardingTrainingPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function OnboardingTrainingPage({ searchParams }: OnboardingTrainingPageProps) {
  const query = await searchParams;
  const state = await loadOnboardingPageState({
    allowEditingOnCompleted: query.edit === "training",
  });

  if (query.edit === "training") {
    return (
      <OnboardingTrainingRouteStep
        userName={state.userName}
        initialTraining={state.initialTraining}
      />
    );
  }

  if (state.initialStep === "metrics") {
    redirect("/users/onboarding/data");
  }

  if (state.initialStep === "foods") {
    redirect("/users/onboarding/foods");
  }

  if (state.initialStep === "summary") {
    redirect("/users/onboarding/summary");
  }

  return (
    <OnboardingTrainingRouteStep
      userName={state.userName}
      initialTraining={state.initialTraining}
    />
  );
}
