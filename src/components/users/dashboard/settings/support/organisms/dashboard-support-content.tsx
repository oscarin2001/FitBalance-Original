"use client";

import { supportContentCards } from "../data/support-content";
import { SupportActionCard } from "../molecules/support-action-card";

export function DashboardSupportContent() {
  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col justify-between gap-14 px-3 py-3">
      <SupportActionCard item={supportContentCards[0]} />

      <div className="mt-auto">
        <SupportActionCard item={supportContentCards[1]} />
      </div>
    </div>
  );
}