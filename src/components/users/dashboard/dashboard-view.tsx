"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { UserDashboardPlan } from "@/actions/server/users/types";
import type { UserBodyMeasurementEntry, UserDashboardProfile, UserWeightHistoryEntry } from "@/actions/server/users/types";

import { BottomNavbar, type BottomNavbarTab } from "./bottom-navbar";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardSettingsSidebar } from "./organisms/dashboard-settings-sidebar";
import { DashboardSummaryCard } from "./organisms/dashboard-summary-card";
import {
  DailyLogView,
  type DailyLogMeal,
  type DailyLogProfile,
} from "./organisms/daily-log-view";
import type { DailyLogFoodOption } from "@/actions/server/users/dashboard/daily-log/types";
import { GoalsView } from "@/components/users/goals";
import { TopHeader } from "./top-header";
import { downloadCurrentNutritionPlanPdf } from "./settings/pdf";
import { DashboardProfileSidebarPanel } from "./settings/profile";
import { SidebarProvider } from "@/components/ui/sidebar";

function resolveDailyLogProfile(objective: UserDashboardPlan["objective"]): DailyLogProfile {
  if (objective === "Bajar_grasa") {
    return "deficit";
  }

  if (objective === "Ganar_musculo") {
    return "superavit";
  }

  return "mantenimiento";
}

function resolveDashboardTab(value: string | null): BottomNavbarTab {
  if (value === "metas" || value === "comidas" || value === "comunidad") {
    return value;
  }

  return "registro";
}

function mapDashboardMeals(meals: UserDashboardPlan["meals"]): DailyLogMeal[] {
  return meals.map((meal) => ({
    id: meal.id,
    title: meal.mealType,
    recipeName: meal.recipeName,
    instructionsSource: meal.instructionsSource,
    summaryLabel: meal.summaryLabel,
    ingredients: meal.ingredients.map((ingredient, index) => ({
      id: `${meal.id}-${index}`,
      name: ingredient.name,
      grams: ingredient.grams,
      quantityLabel: ingredient.portionLabel,
      nutrition: ingredient.nutrition,
    })),
  }))
}

function getGreetingLabel(hour: number) {
  if (hour < 12) {
    return "Buenos días";
  }

  if (hour < 19) {
    return "Buenas tardes";
  }

  return "Buenas noches";
}

type DashboardViewProps = {
  userName: string;
  sessionEmail: string;
  sessionUserId: number;
  initialFoods: DailyLogFoodOption[];
  profile: UserDashboardProfile | null;
  dashboard: UserDashboardPlan | null;
  weightHistory: UserWeightHistoryEntry[];
  bodyMeasurements: UserBodyMeasurementEntry[];
  isPlanPending: boolean;
};

export function DashboardView({
  userName,
  sessionEmail,
  sessionUserId,
  initialFoods,
  profile,
  dashboard,
  weightHistory,
  bodyMeasurements,
  isPlanPending,
}: DashboardViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = useMemo(() => resolveDashboardTab(searchParams.get("tab")), [searchParams]);
  const shouldDownloadPdf = searchParams.get("pdf") === "1";
  const didTriggerPdfDownload = useRef(false);
  const [activeTab, setActiveTab] = useState<BottomNavbarTab>(initialTab);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [desktopGreeting, setDesktopGreeting] = useState("Buenas tardes");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setDesktopGreeting(getGreetingLabel(new Date().getHours()));
  }, []);

  useEffect(() => {
    if (isPlanPending || !dashboard) {
      return;
    }

    const section = document.getElementById(activeTab);
    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeTab, dashboard, isPlanPending]);

  useEffect(() => {
    if (!shouldDownloadPdf || isPlanPending || !dashboard || didTriggerPdfDownload.current) {
      return;
    }

    didTriggerPdfDownload.current = true;

    const runPdfDownload = async () => {
      try {
        const result = await downloadCurrentNutritionPlanPdf(userName);

        if (!result.ok) {
          throw new Error(result.error);
        }

        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.delete("pdf");
        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
      } catch (error) {
        console.error("Error downloading nutrition PDF", error);
        didTriggerPdfDownload.current = false;
      }
    };

    void runPdfDownload();
  }, [dashboard, isPlanPending, pathname, router, searchParams, shouldDownloadPdf, userName]);

  function handleTabChange(tab: BottomNavbarTab) {
    setActiveTab(tab);

    if (tab === "metas") {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", tab);
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
      return;
    }

    const section = document.getElementById(tab);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", tab);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  function handleDateChange(dateIso: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("date", dateIso);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  const bottomNavbar = (
    <BottomNavbar
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onFabClick={() => router.push("/users/onboarding")}
      className="lg:hidden"
    />
  );

  if (isPlanPending || !dashboard) {
    return (
      <>
        <DashboardSkeleton />
        {bottomNavbar}
      </>
    );
  }

  const resolvedCurrentWeightKg = profile?.pesoKg ?? weightHistory.at(-1)?.weightKg ?? null;
  const resolvedTargetWeightKg = profile?.pesoObjetivoKg ?? resolvedCurrentWeightKg;

  return (
    <SidebarProvider defaultOpen={true}>
      <DashboardSettingsSidebar profile={profile} dashboard={dashboard} sessionEmail={sessionEmail} />
      <DashboardProfileSidebarPanel
        open={profilePanelOpen}
        profile={profile}
        onOpenChange={setProfilePanelOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {activeTab === "metas" ? (
          <main className="relative min-h-svh overflow-hidden bg-white pb-44 pt-0">
            <GoalsView
              userName={userName}
              objective={dashboard.objective}
              currentWeightKg={resolvedCurrentWeightKg}
              targetWeightKg={resolvedTargetWeightKg}
              weightHistory={weightHistory}
              bodyMeasurements={bodyMeasurements}
              onAvatarClick={() => setProfilePanelOpen(true)}
            />
          </main>
        ) : (
          <>
            <TopHeader
              userName={userName}
              selectedDateIso={dashboard.selectedDateIso}
              onDateChange={handleDateChange}
              onAvatarClick={() => setProfilePanelOpen(true)}
            />

            <main className="relative min-h-svh overflow-hidden bg-slate-50 pb-44 pt-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-14 top-12 size-56 rounded-full bg-cyan-200/30 blur-3xl" />
            <div className="absolute right-0 top-1/3 size-64 rounded-full bg-teal-200/25 blur-3xl" />
          </div>

          <div className="relative mx-auto grid w-full max-w-none gap-4 px-3 pb-10 pt-4 sm:px-4 md:px-6 lg:px-8">
            <section className="hidden lg:block">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 px-6 py-5 shadow-xl shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Vista de escritorio
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Hola, ¡{desktopGreeting}, {userName}!
                </h2>
                <p className="mt-2 text-sm font-medium text-teal-600">
                  🔥 Empieza tu racha hoy para tus macros
                </p>
              </div>
            </section>

            <section id="registro" className="scroll-mt-24">
              <DashboardSummaryCard
                dashboard={dashboard}
                sessionUserId={sessionUserId}
              />
            </section>

            <section id="metas" className="scroll-mt-24" aria-hidden="true" />

            <section id="comidas" className="scroll-mt-24">
              <DailyLogView
                sessionUserId={sessionUserId}
                initialFoods={initialFoods}
                meals={mapDashboardMeals(dashboard.meals)}
                weeklyRecipes={dashboard.weeklyRecipes}
                dietProfile={resolveDailyLogProfile(dashboard.objective)}
                targets={dashboard.dayTargets}
                selectedDateIso={dashboard.selectedDateIso}
                dailyWaterLiters={dashboard.dailyWaterLiters}
                waterConsumedLiters={dashboard.waterConsumedLiters}
                dayCompleted={dashboard.dayCompleted}
                showHeader={false}
              />
            </section>

            <section id="comunidad" className="scroll-mt-24" aria-hidden="true" />
          </div>
            </main>
          </>
        )}
        {bottomNavbar}
      </div>
    </SidebarProvider>
  );
}
