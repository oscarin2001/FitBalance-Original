import { redirect } from "next/navigation";

import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { OnboardingFoodsRouteStep } from "@/components/users/onboarding";

export const dynamic = "force-dynamic";

export default async function OnboardingFoodsPage() {
  const state = await loadOnboardingPageState();

  if (state.initialStep === "metrics") {
    redirect("/users/onboarding/data");
  }

  if (state.initialStep === "training") {
    redirect("/users/onboarding/training");
  }

  if (state.initialStep === "summary") {
    redirect("/users/onboarding/summary");
  }

  return (
    <OnboardingFoodsRouteStep
      userName={state.userName}
      initialFoods={state.initialFoods}
    />
  );
}
