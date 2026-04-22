"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { UserDashboardPlan } from "@/actions/server/users/types";

import { BottomNavbar, type BottomNavbarTab } from "./bottom-navbar";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardSummaryCard } from "./organisms/dashboard-summary-card";
import {
  DailyLogView,
  type DailyLogMeal,
  type DailyLogProfile,
} from "./organisms/daily-log-view";
import { TopHeader } from "./top-header";
import { downloadNutritionPlanPdf } from "./settings/pdf";

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
    ingredients: meal.ingredients.map((ingredient, index) => ({
      id: `${meal.id}-${index}`,
      name: ingredient.name,
      quantityLabel: ingredient.portionLabel,
      nutrition: ingredient.nutrition,
    })),
  }))
}

type DashboardViewProps = {
  userName: string;
  dashboard: UserDashboardPlan | null;
  isPlanPending: boolean;
};

export function DashboardView({ userName, dashboard, isPlanPending }: DashboardViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTab = useMemo(() => resolveDashboardTab(searchParams.get("tab")), [searchParams]);
  const shouldDownloadPdf = searchParams.get("pdf") === "1";
  const didTriggerPdfDownload = useRef(false);
  const [range, setRange] = useState<"today" | "week">("today");
  const [activeTab, setActiveTab] = useState<BottomNavbarTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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
        const response = await fetch("/api/users/diet", { method: "POST" });
        const payload = (await response.json()) as {
          ok: boolean;
          data?: {
            pdfPayload?: {
              serializedText: string;
              user: { nombre: string };
            };
          };
          error?: string;
        };

        if (!response.ok || !payload.ok || !payload.data?.pdfPayload?.serializedText) {
          throw new Error(payload.error ?? "No se pudo generar el PDF.");
        }

        downloadNutritionPlanPdf({
          userName,
          serializedText: payload.data.pdfPayload.serializedText,
        });

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

  return (
    <>
      <TopHeader
        userName={userName}
        selectedDateIso={dashboard.selectedDateIso}
        onDateChange={handleDateChange}
      />

      <main className="relative min-h-svh overflow-hidden bg-slate-50 pb-44 pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-14 top-12 size-56 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="absolute right-0 top-1/3 size-64 rounded-full bg-teal-200/25 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-md gap-4 p-4 pb-10">
          <section id="registro" className="scroll-mt-24">
            <DashboardSummaryCard
              userName={userName}
              dashboard={dashboard}
              range={range}
              onRangeChange={setRange}
            />
          </section>

          <section id="metas" className="scroll-mt-24" aria-hidden="true" />

          <section id="comidas" className="scroll-mt-24">
            <DailyLogView
              meals={mapDashboardMeals(dashboard.meals)}
              dietProfile={resolveDailyLogProfile(dashboard.objective)}
              targets={dashboard.dayTargets}
              showHeader={false}
            />
          </section>
        </div>
      </main>
      {bottomNavbar}
    </>
  );
}
