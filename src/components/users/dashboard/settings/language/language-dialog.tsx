"use client";

import { useMemo } from "react";

import { Globe } from "lucide-react";

import type { UserDashboardProfile } from "@/actions/server/users/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { SettingsScreenHeader } from "../shared/settings-screen-header";

type DashboardLanguageDialogProps = {
  open: boolean;
  profile: UserDashboardProfile | null;
  onOpenChange: (open: boolean) => void;
};

type LanguageOption = {
  id: string;
  title: string;
  description: string;
  active: boolean;
};

const languageOptions: LanguageOption[] = [
  {
    id: "es",
    title: "Español",
    description: "Idioma disponible ahora mismo.",
    active: true,
  },
  {
    id: "en",
    title: "English",
    description: "Pronto tendremos inglés disponible.",
    active: false,
  },
];

function getDisplayName(profile: UserDashboardProfile | null) {
  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(" ").trim();

  return fullName || profile?.nombre || "Usuario";
}

function LanguageOptionCard({ option }: { option: LanguageOption }) {
  return (
    <button
      type="button"
      disabled={!option.active}
      className={cn(
        "flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition",
        option.active
          ? "border-teal-200 bg-teal-50/80 text-teal-700"
          : "cursor-default border-slate-200 bg-slate-50 text-slate-500 opacity-80"
      )}
    >
      <div>
        <p className="text-sm font-semibold">{option.title}</p>
        <p className="mt-1 text-xs leading-5 text-current/80">{option.description}</p>
      </div>

      <span
        className={cn(
          "ml-4 inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
          option.active ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
        )}
      >
        {option.active ? "Activo" : "Pronto"}
      </span>
    </button>
  );
}

export function DashboardLanguageDialog({ open, profile, onOpenChange }: DashboardLanguageDialogProps) {
  const displayName = useMemo(() => getDisplayName(profile), [profile]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="h-[100dvh] w-screen max-w-none rounded-none border-0 bg-slate-50 p-0 shadow-none sm:h-[calc(100dvh-2rem)] sm:w-[min(100vw-2rem,36rem)] sm:rounded-[2rem] sm:border sm:border-slate-200/80 sm:shadow-2xl"
      >
        <div className="flex h-full flex-col">
          <SettingsScreenHeader title="Idioma" name={displayName} onBack={() => onOpenChange(false)} />

          <div className="no-scrollbar flex-1 overflow-y-auto p-4">
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <Globe className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Idioma de la app</p>
                  <p className="text-sm text-slate-500">Por ahora mantenemos la interfaz en español.</p>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4">
                {languageOptions.map((option) => (
                  <LanguageOptionCard key={option.id} option={option} />
                ))}
              </div>
            </section>

            <div className="mt-4 rounded-[1.75rem] border border-dashed border-teal-200 bg-teal-50/60 px-4 py-3 text-sm leading-6 text-teal-700">
              Pronto tendremos inglés disponible dentro de la aplicación.
            </div>

            <div className="mt-4">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl bg-teal-500 text-white hover:bg-teal-600"
                onClick={() => onOpenChange(false)}
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
