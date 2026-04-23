"use client";

import { useEffect, useState, useTransition } from "react";
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
  LogOut,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

import type { UserDashboardProfile } from "@/actions/server/users/types";
import type { UserDashboardPlan } from "@/actions/server/users/types";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import { DashboardAccountDialog } from "../settings/account";
import { DashboardApplicationSettingsContent, DashboardApplicationSettingsHeader } from "../settings/application";
import { DashboardHealthGoalsContent, DashboardHealthGoalsHeader } from "../settings/health";
import { DashboardMacrosCalculatorContent, DashboardMacrosCalculatorHeader } from "../settings/macros";
import {
  DashboardMacronutrientsEnergyContent,
  DashboardMacronutrientsEnergyHeader,
} from "../settings/macronutrients-energy";
import { DashboardLanguageDialog } from "../settings/language";
import { DashboardRemindersContent, DashboardRemindersHeader } from "../settings/reminders";
import { DashboardSupportContent, DashboardSupportHeader } from "../settings/support";
import { DashboardTermsOfServiceContent, DashboardTermsOfServiceHeader } from "../settings/terms-of-service";
import { DashboardPrivacyPolicyContent, DashboardPrivacyPolicyHeader } from "../settings/privacy-policy";
import { DashboardProfileDialog } from "../settings/profile";

type SidebarEntry = {
  title: string;
  icon: LucideIcon;
  premium?: boolean;
  rightLabel?: string;
  action?:
    | "profile"
    | "account"
    | "application"
    | "reminders"
    | "language"
    | "macros"
    | "energy"
    | "health"
    | "support"
    | "terms"
    | "privacy";
};

type NestedSettingsScreen = NonNullable<SidebarEntry["action"]>;

const settingsItems: SidebarEntry[] = [
  { title: "Mi perfil", icon: UserRound, action: "profile" },
  { title: "Ajustes de cuenta", icon: ShieldCheck, action: "account" },
  { title: "Suscripción", icon: Crown },
  { title: "Ajustes de la aplicación", icon: Settings2, action: "application" },
  { title: "Recordatorios", icon: Bell, action: "reminders" },
  { title: "Idioma", icon: Globe, rightLabel: "Español", action: "language" },
];

const goalsItems: SidebarEntry[] = [
  { title: "Primeros pasos", icon: Sparkles },
  { title: "Calculadora de macros", icon: Calculator, action: "macros" },
  { title: "Macronutrientes y energía", icon: Flame, action: "energy" },
  { title: "Micronutriente", icon: Beaker, premium: true },
  { title: "Ayuno intermitente", icon: Clock3, premium: true },
  { title: "Comida", icon: ChefHat, premium: true },
  { title: "Salud", icon: HeartPulse, action: "health" },
];

const infoItems: SidebarEntry[] = [
  { title: "Ayuda y soporte", icon: CircleHelp, action: "support" },
  { title: "Términos de servicio", icon: FileText, action: "terms" },
  { title: "Política de privacidad", icon: ShieldCheck, action: "privacy" },
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

function getDisplayName(profile: UserDashboardProfile | null) {
  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(" ").trim();

  return fullName || profile?.nombre || "Usuario";
}

function MenuEntry({ item, onClick }: { item: SidebarEntry; onClick?: () => void }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        onClick={onClick}
        size="lg"
        className={cn(
          "!h-14 !justify-between !rounded-none !border-0 !bg-transparent !px-4 !text-slate-700 !shadow-none transition hover:!bg-slate-50 hover:!text-slate-950"
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

function SidebarSectionCard({
  title,
  items,
  onItemClick,
}: {
  title: string;
  items: SidebarEntry[];
  onItemClick: (action?: SidebarEntry["action"]) => (() => void) | undefined;
}) {
  return (
    <SidebarGroup className="px-2 py-1">
      <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-[0.24em] text-slate-400">
        {title}
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <SidebarMenu className="divide-y divide-slate-100">
            {items.map((item) => (
              <MenuEntry key={item.title} item={item} onClick={onItemClick(item.action)} />
            ))}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardSettingsSidebar({
  profile,
  dashboard,
  sessionEmail,
}: {
  profile: UserDashboardProfile | null;
  dashboard: UserDashboardPlan | null;
  sessionEmail: string;
}) {
  const { open, openMobile, isMobile, setOpen, setOpenMobile } = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [energyOpen, setEnergyOpen] = useState(false);
  const [macrosOpen, setMacrosOpen] = useState(false);
  const [isSigningOut, startSigningOut] = useTransition();

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
  const displayName = getDisplayName(safeProfile);
  const sidebarVisible = isMobile ? openMobile : open;
  const showNestedSettings = applicationOpen || remindersOpen || macrosOpen || energyOpen || healthOpen || supportOpen || termsOpen || privacyOpen;

  function openNestedScreen(screen: NestedSettingsScreen) {
    setProfileOpen(screen === "profile");
    setAccountOpen(screen === "account");
    setApplicationOpen(screen === "application");
    setRemindersOpen(screen === "reminders");
    setLanguageOpen(screen === "language");
    setHealthOpen(screen === "health");
    setSupportOpen(screen === "support");
    setTermsOpen(screen === "terms");
    setPrivacyOpen(screen === "privacy");
    setEnergyOpen(screen === "energy");
    setMacrosOpen(screen === "macros");
  }

  function getNestedScreenClick(action?: SidebarEntry["action"]) {
    if (!action) {
      return undefined;
    }

    return () => openNestedScreen(action);
  }

  function closeSidebar() {
    if (isMobile) {
      setOpenMobile(false);
      return;
    }

    setOpen(false);
  }

  function handleSignOut() {
    startSigningOut(async () => {
      await signOut({ callbackUrl: "/users/login" });
    });
  }

  useEffect(() => {
    if (!sidebarVisible) {
      setProfileOpen(false);
      setAccountOpen(false);
      setApplicationOpen(false);
      setRemindersOpen(false);
      setLanguageOpen(false);
      setHealthOpen(false);
      setSupportOpen(false);
      setTermsOpen(false);
      setPrivacyOpen(false);
      setEnergyOpen(false);
      setMacrosOpen(false);
    }
  }, [sidebarVisible]);

  return (
    <Sidebar side="left" variant="floating" collapsible="offcanvas">
      <SidebarHeader className="p-0">
        {healthOpen ? (
          <DashboardHealthGoalsHeader onBack={() => setHealthOpen(false)} />
        ) : supportOpen ? (
          <DashboardSupportHeader onBack={() => setSupportOpen(false)} />
        ) : termsOpen ? (
          <DashboardTermsOfServiceHeader onBack={() => setTermsOpen(false)} />
        ) : privacyOpen ? (
          <DashboardPrivacyPolicyHeader onBack={() => setPrivacyOpen(false)} />
        ) : energyOpen ? (
          <DashboardMacronutrientsEnergyHeader onBack={() => setEnergyOpen(false)} name={displayName} />
        ) : macrosOpen ? (
          <DashboardMacrosCalculatorHeader onBack={() => setMacrosOpen(false)} name={displayName} />
        ) : applicationOpen ? (
          <DashboardApplicationSettingsHeader onBack={() => setApplicationOpen(false)} name={displayName} />
        ) : remindersOpen ? (
          <DashboardRemindersHeader onBack={() => setRemindersOpen(false)} name={displayName} />
        ) : (
          isMobile ? (
            <div className="border-b border-white/20 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 px-4 pb-3 pt-[env(safe-area-inset-top)] text-white">
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeSidebar}
                  className="h-9 w-9 rounded-full border border-white/15 bg-white/12 p-0 text-white hover:bg-white/20 hover:text-white"
                >
                  <X className="size-4" />
                </Button>

              </div>

              <div className="mt-3 flex items-center gap-3 pb-1">
                <Avatar className="size-14 border border-white/25 bg-white/15 text-white shadow-sm">
                  <AvatarFallback className="bg-transparent text-sm font-semibold tracking-[0.22em] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[1.65rem] font-semibold leading-none">{displayName}</p>
                  <p className="mt-1 truncate text-[12px] font-medium text-white/88">
                    Nacido en {birthYear}
                    {safeProfile.alturaCm ? (
                      <>
                        <span className="mx-2 text-white/45">|</span>
                        {Math.round(safeProfile.alturaCm)} cm
                      </>
                    ) : null}
                    <span className="mx-2 text-white/45">|</span>
                    {genderLabel}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-b border-slate-200/80 bg-white px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-sm">
                  <Sparkles className="size-5" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    FitBalance
                  </p>
                  <p className="text-sm text-slate-500">Panel principal</p>
                </div>
              </div>
            </div>
          )
        )}
      </SidebarHeader>

      <SidebarContent className={showNestedSettings ? "bg-slate-50/95 px-0 py-0" : "bg-slate-50/95 px-2 py-3"}>
        {healthOpen ? (
          <DashboardHealthGoalsContent />
        ) : supportOpen ? (
          <DashboardSupportContent />
        ) : termsOpen ? (
          <DashboardTermsOfServiceContent />
        ) : privacyOpen ? (
          <DashboardPrivacyPolicyContent />
        ) : energyOpen ? (
          <DashboardMacronutrientsEnergyContent profile={safeProfile} />
        ) : macrosOpen ? (
          <DashboardMacrosCalculatorContent dashboard={dashboard} profile={safeProfile} />
        ) : applicationOpen ? (
          <DashboardApplicationSettingsContent />
        ) : remindersOpen ? (
          <DashboardRemindersContent />
        ) : (
          <div className="flex flex-col gap-3 px-1 py-1">
            <SidebarSectionCard title="Mis ajustes" items={settingsItems} onItemClick={getNestedScreenClick} />
            <SidebarSectionCard title="Ajustes de metas" items={goalsItems} onItemClick={getNestedScreenClick} />
            <SidebarSectionCard title="Información" items={infoItems} onItemClick={getNestedScreenClick} />

            <div className="px-2 pb-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="h-12 w-full justify-start rounded-2xl border border-slate-200/70 bg-slate-100 px-4 text-slate-500 shadow-none hover:bg-slate-200 hover:text-slate-700"
              >
                <LogOut className="size-4 shrink-0 text-slate-500" />
                <span className="flex-1 text-center text-sm font-medium">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>

      <DashboardProfileDialog open={profileOpen} profile={safeProfile} onOpenChange={setProfileOpen} />
      <DashboardAccountDialog open={accountOpen} profile={safeProfile} email={sessionEmail} onOpenChange={setAccountOpen} />
      <DashboardLanguageDialog open={languageOpen} profile={safeProfile} onOpenChange={setLanguageOpen} />
    </Sidebar>
  );
}
