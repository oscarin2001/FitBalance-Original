import { loadOnboardingPageState } from "@/actions/server/users/pages";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const state = await loadOnboardingPageState();

  if (state.initialStep === "summary") {
    redirect("/users/onboarding/summary");
  }

  if (state.initialStep === "foods") {
    redirect("/users/onboarding/foods");
  }

  redirect("/users/onboarding/data");
}
