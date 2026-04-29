"use client";

import { useMemo, useState } from "react";

import type { UserBodyMeasurementEntry, UserDashboardPlan, UserWeightHistoryEntry } from "@/actions/server/users/types";
import { cn } from "@/lib/utils";

import { GoalsTopHeader } from "./goals-top-header";
import { GoalsWeightDialog } from "./goals-weight-dialog";
import { GoalsDataSection, GoalsProgressSection, type GoalsRangeKey, type GoalsWeightUnit } from "../sections";

type GoalsViewProps = {
  userName: string;
  objective: UserDashboardPlan["objective"];
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  weightHistory: UserWeightHistoryEntry[];
  bodyMeasurements: UserBodyMeasurementEntry[];
  onAvatarClick?: () => void;
  className?: string;
};

type WeightDialogState =
  | { mode: "create" }
  | { mode: "edit"; entry: UserWeightHistoryEntry }
  | null;

function resolveObjectiveLabel(objective: UserDashboardPlan["objective"]) {
  if (objective === "Bajar_grasa") {
    return "Bajar grasa";
  }

  if (objective === "Ganar_musculo") {
    return "Ganar musculo";
  }

  return "Mantenimiento";
}

export function GoalsView({
  userName,
  objective,
  currentWeightKg,
  targetWeightKg,
  weightHistory,
  bodyMeasurements,
  onAvatarClick,
  className,
}: GoalsViewProps) {
  const [activeTab, setActiveTab] = useState<"progreso" | "datos">("progreso");
  const [unit, setUnit] = useState<GoalsWeightUnit>("kg");
  const [range, setRange] = useState<GoalsRangeKey>("3m");
  const [weightDialogState, setWeightDialogState] = useState<WeightDialogState>(null);

  const objectiveLabel = useMemo(() => resolveObjectiveLabel(objective), [objective]);
  const resolvedCurrentWeightKg = currentWeightKg ?? weightHistory.at(-1)?.weightKg ?? targetWeightKg ?? null;
  const resolvedTargetWeightKg = targetWeightKg ?? resolvedCurrentWeightKg;

  return (
    <section className={cn("min-h-svh bg-white", className)}>
      <GoalsTopHeader userName={userName} onAvatarClick={onAvatarClick} />

      <div className="mx-auto w-full max-w-md px-3 pb-44 pt-16 sm:px-4 sm:pt-20">
        <div className="grid grid-cols-2 border-b border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("progreso")}
            className={cn(
              "relative py-3 text-base font-semibold transition",
              activeTab === "progreso" ? "text-emerald-600" : "text-slate-400"
            )}
          >
            Progreso
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-0.5 rounded-full transition",
                activeTab === "progreso" ? "bg-emerald-500" : "bg-transparent"
              )}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("datos")}
            className={cn(
              "relative py-3 text-base font-semibold transition",
              activeTab === "datos" ? "text-emerald-600" : "text-slate-400"
            )}
          >
            Datos
            <span
              className={cn(
                "absolute inset-x-0 bottom-0 h-0.5 rounded-full transition",
                activeTab === "datos" ? "bg-emerald-500" : "bg-transparent"
              )}
            />
          </button>
        </div>

        <div className="pt-3">
          {activeTab === "progreso" ? (
            <GoalsProgressSection
              currentWeightKg={resolvedCurrentWeightKg}
              targetWeightKg={resolvedTargetWeightKg}
              weightHistory={weightHistory}
              unit={unit}
              range={range}
              onToggleUnit={() => setUnit(unit === "kg" ? "lb" : "kg")}
              onRangeChange={setRange}
              onAddWeightClick={() => setWeightDialogState({ mode: "create" })}
              onEditWeightEntry={(entry) => setWeightDialogState({ mode: "edit", entry })}
            />
          ) : (
            <GoalsDataSection
              bodyMeasurements={bodyMeasurements}
              objective={objective}
            />
          )}
        </div>
      </div>

      <GoalsWeightDialog
        open={weightDialogState !== null}
        mode={weightDialogState?.mode ?? "create"}
        entry={weightDialogState && "entry" in weightDialogState ? weightDialogState.entry : null}
        currentWeightKg={resolvedCurrentWeightKg}
        targetWeightKg={resolvedTargetWeightKg}
        objectiveLabel={objectiveLabel}
        onOpenChange={(open) => {
          if (!open) {
            setWeightDialogState(null);
          }
        }}
      />
    </section>
  );
}
