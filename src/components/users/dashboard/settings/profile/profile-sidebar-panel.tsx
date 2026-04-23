"use client";

import { useMemo, useState } from "react";

import { UserRound } from "lucide-react";

import type { UserDashboardProfile } from "@/actions/server/users/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { DashboardProfileField } from "@/actions/server/users/dashboard/settings/profile";
import { SettingsScreenHeader } from "../shared/settings-screen-header";
import { ProfileFieldDialog } from "./profile-field-dialog";

type DashboardProfileSidebarPanelProps = {
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

function formatGender(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("fem") || lower.includes("muj") || lower.includes("woman")) {
    return "Mujer";
  }

  if (lower.includes("masc") || lower.includes("hom") || lower.includes("man")) {
    return "Hombre";
  }

  return value;
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 text-left last:border-b-0",
        onClick && "hover:bg-slate-50"
      )}
    >
      <span className="text-sm font-medium text-slate-950">{label}</span>
      <span className="text-sm font-medium text-teal-500">{value}</span>
    </button>
  );
}

export function DashboardProfileSidebarPanel({ open, profile, onOpenChange }: DashboardProfileSidebarPanelProps) {
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
  const birthYear = useMemo(() => new Date(safeProfile.birthDateIso).getFullYear(), [safeProfile.birthDateIso]);
  const initials = useMemo(
    () =>
      displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join(""),
    [displayName]
  );

  const rows = [
    { label: "Nombre", value: safeProfile.nombre, field: "nombre" as const },
    { label: "Apellido(s)", value: safeProfile.apellido || "Sin definir", field: "apellido" as const },
    { label: "Sexo", value: formatGender(safeProfile.sexo), field: "sexo" as const },
    { label: "Cumpleaños", value: formatDate(safeProfile.birthDateIso), field: "fechaNacimiento" as const },
    { label: "Altura", value: formatHeight(safeProfile.alturaCm), field: "alturaCm" as const },
    { label: "Peso", value: formatWeight(safeProfile.pesoKg), field: "pesoKg" as const },
    { label: "Tipo de entrenamiento", value: formatTraining(safeProfile.tipoEntrenamiento), field: "tipoEntrenamiento" as const },
    {
      label: "Frecuencia",
      value: safeProfile.frecuenciaEntreno !== null ? `${safeProfile.frecuenciaEntreno} dias/semana` : "Sin definir",
      field: "frecuenciaEntreno" as const,
    },
    {
      label: "Años entrenando",
      value: safeProfile.anosEntrenando ? String(safeProfile.anosEntrenando) : "0",
      field: "anosEntrenando" as const,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="right"
        className="!w-[min(100vw-1rem,34rem)] !max-w-none border-slate-200/80 bg-slate-50 p-0 shadow-2xl"
      >
        <div className="flex h-full flex-col">
          <SettingsScreenHeader title="Mi perfil" name={displayName} onBack={() => onOpenChange(false)} />

          <div className="no-scrollbar flex-1 overflow-y-auto p-4">
            <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
                <Avatar className="size-12 border border-teal-100 bg-teal-50 text-teal-700 shadow-sm">
                  <AvatarFallback className="bg-transparent text-sm font-semibold tracking-[0.22em] text-teal-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-950">{displayName}</p>
                  <p className="text-sm text-slate-500">
                    Nacido en {birthYear}
                    {safeProfile.alturaCm ? <span className="mx-2 text-slate-300">|</span> : null}
                    {safeProfile.alturaCm ? `${Math.round(safeProfile.alturaCm)} cm` : null}
                  </p>
                </div>
              </div>

              {rows.map((row) => (
                <ProfileRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  onClick={() => setEditingField(row.field)}
                />
              ))}
            </section>

            <div className="mt-4 rounded-[1.75rem] border border-dashed border-teal-200 bg-teal-50/60 px-4 py-3 text-sm text-teal-700">
              Cuando quieras ampliar el perfil, lo siguiente que podemos sumar es objetivo, peso objetivo y pais.
            </div>
          </div>
        </div>

        <ProfileFieldDialog
          profile={safeProfile}
          field={editingField}
          open={Boolean(editingField)}
          onOpenChange={(nextOpen) => !nextOpen && setEditingField(null)}
        />
      </SheetContent>
    </Sheet>
  );
}