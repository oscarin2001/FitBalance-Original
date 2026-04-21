import { getSessionAppUser } from "@/actions/server/users/auth";
import { redirectToOnboarding, redirectToUsers } from "@/actions/server/users/navigation";

export async function ensureLoginPageAccess(): Promise<void> {
  const sessionUser = await getSessionAppUser();

  if (!sessionUser) {
    return;
  }

  if (!sessionUser.onboardingCompleted) {
    redirectToOnboarding();
  }

  redirectToUsers();
}
