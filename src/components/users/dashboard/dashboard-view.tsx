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
  if (objective === "Bajar_grasa") return "deficit";
  if (objective === "Ganar_musculo") return "superavit";
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
  }));
}

function getGreetingLabel(hour: number) {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
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
    if (isPlanPending || !dashboard) return;

    const section = document.getElementById(activeTab);
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeTab, dashboard, isPlanPending]);

  // 🔥 FIX AQUI
  useEffect(() => {
    if (!shouldDownloadPdf || isPlanPending || !dashboard || didTriggerPdfDownload.current) {
      return;
    }

    didTriggerPdfDownload.current = true;

    const runPdfDownload = async () => {
      try {
        const result = await downloadCurrentNutritionPlanPdf(userName);

        if (!result.ok) {
          const err = result as any;
          throw new Error(err?.error ?? "Error al generar PDF");
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
        <TopHeader
          userName={userName}
          selectedDateIso={dashboard.selectedDateIso}
          onDateChange={handleDateChange}
          onAvatarClick={() => setProfilePanelOpen(true)}
        />

        <main className="relative min-h-svh overflow-hidden bg-slate-50 pb-44 pt-24">
          <DashboardSummaryCard dashboard={dashboard} sessionUserId={sessionUserId} />

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
        </main>

        {bottomNavbar}
      </div>
    </SidebarProvider>
  );
}