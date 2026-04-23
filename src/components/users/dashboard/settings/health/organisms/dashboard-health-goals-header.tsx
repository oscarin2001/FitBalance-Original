"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardHealthGoalsHeaderProps = {
  onBack: () => void;
};

export function DashboardHealthGoalsHeader({ onBack }: DashboardHealthGoalsHeaderProps) {
  return <SettingsScreenHeader title="Metas de salud" onBack={onBack} />;
}
