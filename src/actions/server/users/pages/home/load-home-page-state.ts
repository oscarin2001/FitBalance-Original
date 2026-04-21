import { getSessionAppUser } from "@/actions/server/users/auth";
import type { SessionAppUser } from "@/actions/server/users/auth";

export type HomePageState = {
  sessionUser: SessionAppUser | null;
};

export async function loadHomePageState(): Promise<HomePageState> {
  const sessionUser = await getSessionAppUser();
  return { sessionUser };
}
