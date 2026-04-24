import { requireCompletedOnboarding } from "@/actions/server/users/auth";
import type { SessionAppUser } from "@/actions/server/users/auth";

export type GoalsPageState = {
  sessionUser: SessionAppUser;
};

export async function loadGoalsPageState(): Promise<GoalsPageState> {
  const sessionUser = await requireCompletedOnboarding();

  return { sessionUser };
}