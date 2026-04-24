import { redirect } from "next/navigation";

import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { OnboardingFoodsRouteStep } from "@/components/users/onboarding";

export const dynamic = "force-dynamic";

type OnboardingFoodsPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function OnboardingFoodsPage({ searchParams }: OnboardingFoodsPageProps) {
  const query = await searchParams;
  const state = await loadOnboardingPageState({
    allowEditingOnCompleted: query.edit === "foods",
  });

  if (query.edit === "foods") {
    return (
      <OnboardingFoodsRouteStep
        userName={state.userName}
        initialFoods={state.initialFoods}
      />
    );
  }

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
