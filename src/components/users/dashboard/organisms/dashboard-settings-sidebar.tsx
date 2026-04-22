"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Beaker,
  Bell,
  Calculator,
  ChefHat,
  ChevronRight,
  CircleHelp,
  Clock3,
  Crown,
  FileText,
  Flame,
  Globe,
  HeartPulse,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import type { UserDashboardProfile } from "@/actions/server/users/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { DashboardProfileDialog } from "../settings/profile";

type SidebarEntry = {
  title: string;
  icon: LucideIcon;
  premium?: boolean;
  rightLabel?: string;
  action?: "profile";
};

const settingsItems: SidebarEntry[] = [
  { title: "Mi perfil", icon: UserRound, action: "profile" },
  { title: "Ajustes de cuenta", icon: ShieldCheck },
  { title: "Suscripción", icon: Crown },
  { title: "Ajustes de la aplicación", icon: Settings2 },
  { title: "Recordatorios", icon: Bell },
  { title: "Idioma", icon: Globe, rightLabel: "Español" },
];

const goalsItems: SidebarEntry[] = [
  { title: "Primeros pasos", icon: Sparkles },
  { title: "Calculadora de macros", icon: Calculator },
  { title: "Macronutrientes y energía", icon: Flame },
  { title: "Micronutriente", icon: Beaker, premium: true },
  { title: "Ayuno intermitente", icon: Clock3, premium: true },
  { title: "Comida", icon: ChefHat, premium: true },
  { title: "Salud", icon: HeartPulse },
];

const infoItems: SidebarEntry[] = [
  { title: "Ayuda y soporte", icon: CircleHelp },
  { title: "Términos de servicio", icon: FileText },
  { title: "Política de privacidad", icon: ShieldCheck },
];

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
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

function MenuEntry({ item, onClick }: { item: SidebarEntry; onClick?: () => void }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        onClick={onClick}
        className={cn(
          "h-11 justify-between rounded-2xl border border-slate-200/80 bg-white px-3 text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/80 hover:text-slate-950"
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <item.icon className="size-4 shrink-0 text-slate-400" />
          <span className="truncate text-sm font-medium">{item.title}</span>
        </span>

        <span className="flex items-center gap-2 pl-3 text-xs font-semibold">
          {item.rightLabel ? (
            <span className="text-emerald-600">{item.rightLabel}</span>
          ) : item.premium ? (
            <Crown className="size-3.5 text-emerald-600" />
          ) : (
            <ChevronRight className="size-4 text-slate-400" />
          )}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function DashboardSettingsSidebar({ profile }: { profile: UserDashboardProfile | null }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const safeProfile = profile ?? {
    nombre: "Usuario",
    apellido: "",
    birthDateIso: new Date().toISOString(),
    sexo: "No especificado",
    alturaCm: null,
    pesoKg: null,
    tipoEntrenamiento: null,
    frecuenciaEntreno: null,
    anosEntrenando: null,
  };
  const initials = getInitials(safeProfile.nombre || "FB");
  const genderLabel = formatGender(safeProfile.sexo);
  const birthYear = new Date(safeProfile.birthDateIso).getFullYear();

  return (
    <Sidebar side="left" variant="floating" collapsible="offcanvas">
      <SidebarHeader className="p-0">
        <div className="border-b border-white/20 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 px-4 pb-4 pt-[env(safe-area-inset-top)] text-white">
          <div className="mb-4 flex items-start justify-between gap-3 pt-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/80">Ajustes</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Configuraciones</h2>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full border-white/20 bg-white/15 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/25 hover:text-white"
            >
              <Crown className="size-3.5" />
              Hazte Premium
            </Button>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-white/12 p-3 shadow-lg shadow-teal-950/10 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <Avatar className="size-14 border border-white/25 bg-white/15 text-white shadow-sm">
                <AvatarFallback className="bg-transparent text-sm font-semibold tracking-[0.22em] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold leading-none">{safeProfile.nombre}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/80">{genderLabel}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-white/15 px-3 py-1">Nacido en {birthYear}</span>
                  {safeProfile.alturaCm ? (
                    <span className="rounded-full bg-white/15 px-3 py-1">{safeProfile.alturaCm} cm</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-slate-50/95 px-2 py-3">
        <SidebarGroup className="px-2 py-1">
          <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">
            Mis ajustes
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 gap-2">
              {settingsItems.map((item) => (
                <MenuEntry key={item.title} item={item} onClick={item.action === "profile" ? () => setProfileOpen(true) : undefined} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-3" />

        <SidebarGroup className="px-2 py-1">
          <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">
            Ajustes de metas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 gap-2">
              {goalsItems.map((item) => (
                <MenuEntry key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-4 my-3" />

        <SidebarGroup className="px-2 py-1">
          <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">
            Información
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="mt-2 gap-2">
              {infoItems.map((item) => (
                <MenuEntry key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <DashboardProfileDialog open={profileOpen} profile={safeProfile} onOpenChange={setProfileOpen} />
    </Sidebar>
  );
}