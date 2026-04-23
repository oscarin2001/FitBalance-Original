"use client";

import { useMemo, useState } from "react";

import { UserRound } from "lucide-react";

import type { UserDashboardProfile } from "@/actions/server/users/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { ProfileFieldDialog } from "./profile-field-dialog";
import type { DashboardProfileField } from "@/actions/server/users/dashboard/settings/profile";
import { SettingsScreenHeader } from "../shared/settings-screen-header";

type DashboardProfileDialogProps = {
  open: boolean;
  profile: UserDashboardProfile | null;
  onOpenChange: (open: boolean) => void;
};

function getDisplayName(profile: UserDashboardProfile) {
  return [profile.nombre, profile.apellido].filter(Boolean).join(" ").trim() || profile.nombre || "Usuario";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatTraining(value: string | null) {
  return value ? value.replace(/_/g, " ") : "Sin definir";
}

function formatWeight(value: number | null) {
  return value ? `${(value * 2.20462).toFixed(1)} lb` : "Sin dato";
}

function formatHeight(value: number | null) {
  return value ? `${Math.round(value)} cm` : "Sin dato";
}

function ProfileRow({ label, value, onClick }: { label: string; value: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left last:border-b-0", onClick && "hover:bg-slate-50") }>
      <span className="text-sm font-medium text-slate-950">{label}</span>
      <span className="text-sm font-medium text-teal-500">{value}</span>
    </button>
  );
}

export function DashboardProfileDialog({ open, profile, onOpenChange }: DashboardProfileDialogProps) {
  const [editingField, setEditingField] = useState<DashboardProfileField | null>(null);
  const safeProfile = profile ?? {
    nombre: "Oscar",
    apellido: "",
    birthDateIso: new Date("2001-06-29T00:00:00.000Z").toISOString(),
    sexo: "Masculino",
    alturaCm: 169,
    pesoKg: null,
    tipoEntrenamiento: null,
    frecuenciaEntreno: null,
    anosEntrenando: null,
  };
  const displayName = useMemo(() => getDisplayName(safeProfile), [safeProfile]);

  const rows = [
    { label: "Nombre", value: safeProfile.nombre, field: "nombre" as const },
    { label: "Apellido(s)", value: safeProfile.apellido || "Sin definir", field: "apellido" as const },
    { label: "Sexo", value: safeProfile.sexo, field: "sexo" as const },
    { label: "Cumpleaños", value: formatDate(safeProfile.birthDateIso), field: "fechaNacimiento" as const },
    { label: "Altura", value: formatHeight(safeProfile.alturaCm), field: "alturaCm" as const },
    { label: "Peso", value: formatWeight(safeProfile.pesoKg), field: "pesoKg" as const },
    { label: "Tipo de entrenamiento", value: formatTraining(safeProfile.tipoEntrenamiento), field: "tipoEntrenamiento" as const },
    { label: "Frecuencia", value: safeProfile.frecuenciaEntreno !== null ? `${safeProfile.frecuenciaEntreno} dias/semana` : "Sin definir", field: "frecuenciaEntreno" as const },
    { label: "Años entrenando", value: safeProfile.anosEntrenando ? String(safeProfile.anosEntrenando) : "0", field: "anosEntrenando" as const },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="h-[100dvh] w-screen max-w-none rounded-none border-0 bg-slate-50 p-0 shadow-none sm:h-[calc(100dvh-2rem)] sm:max-w-none sm:w-[min(100vw-2rem,34rem)] sm:rounded-[2rem] sm:border sm:border-slate-200/80 sm:shadow-2xl">
        <div className="flex h-full flex-col">
          <SettingsScreenHeader title="Mi perfil" name={displayName} onBack={() => onOpenChange(false)} />

          <div className="no-scrollbar flex-1 overflow-y-auto p-4">
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Foto de perfil</p>
                  <p className="text-sm text-slate-500">Pronto tendremos foto de perfil.</p>
                </div>
              </div>

              {rows.map((row) => (
                <ProfileRow key={row.label} label={row.label} value={row.value} onClick={() => setEditingField(row.field)} />
              ))}
            </section>

            <div className="mt-4 rounded-[1.75rem] border border-dashed border-teal-200 bg-teal-50/60 px-4 py-3 text-sm text-teal-700">
              Cuando quieras ampliar el perfil, lo siguiente que podemos sumar es objetivo, peso objetivo y pais.
            </div>
          </div>
        </div>

        <ProfileFieldDialog profile={safeProfile} field={editingField} open={Boolean(editingField)} onOpenChange={(nextOpen) => !nextOpen && setEditingField(null)} />
      </DialogContent>
    </Dialog>
  );
}