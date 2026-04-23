"use client";

import { SettingsScreenHeader } from "../../shared/settings-screen-header";

type DashboardRemindersHeaderProps = {
  name?: string;
  onBack: () => void;
};

export function DashboardRemindersHeader({ name, onBack }: DashboardRemindersHeaderProps) {
  return <SettingsScreenHeader title="Recordatorios" name={name} onBack={onBack} />;
}
