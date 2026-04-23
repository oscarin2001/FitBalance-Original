"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

type SettingsScreenHeaderProps = {
  title: string;
  name?: string;
  onBack: () => void;
};

export function SettingsScreenHeader({ title, name, onBack }: SettingsScreenHeaderProps) {
  return (
    <div className="border-b border-white/20 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 px-4 pb-4 pt-[env(safe-area-inset-top)] text-white">
      <div className="flex items-start gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-9 w-9 rounded-full border-white/20 bg-white/15 p-0 text-white hover:bg-white/25 hover:text-white"
        >
          <ArrowLeft className="size-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[1.9rem] font-semibold leading-none tracking-tight">{title}</h2>
          {name ? <p className="mt-1 text-sm font-medium text-white/85">{name}</p> : null}
        </div>
      </div>
    </div>
  );
}