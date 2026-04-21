import { notFound } from "next/navigation";

import { requireCompletedOnboarding } from "@/actions/server/users/auth";
import { getUserById } from "@/actions/server/users";
import type { UserDetail } from "@/actions/server/users";

export type UserDetailPageState = {
  user: UserDetail;
};

export async function loadUserDetailPageState(
  params: Promise<{ id: string }>
): Promise<UserDetailPageState> {
  await requireCompletedOnboarding();

  const { id } = await params;
  const userId = Number(id);

  if (!Number.isInteger(userId) || userId <= 0) {
    notFound();
  }

  const user = await getUserById(userId);
  if (!user) {
    notFound();
  }

  return { user };
}

