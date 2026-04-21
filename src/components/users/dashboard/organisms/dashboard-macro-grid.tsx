import type { UserDashboardPlan } from "@/actions/server/users/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type DashboardMacroGridProps = {
  dashboard: UserDashboardPlan;
  range: "today" | "week";
};

type MacroCardItem = {
  key: "proteins" | "fats" | "carbs" | "calories";
  label: string;
  unit: string;
};

const macroConfig: MacroCardItem[] = [
  { key: "proteins", label: "Proteinas", unit: "g" },
  { key: "fats", label: "Grasas", unit: "g" },
  { key: "carbs", label: "Carbos", unit: "g" },
  { key: "calories", label: "Calorias", unit: "kcal" },
];

function round(value: number): number {
  return Number(value.toFixed(1));
}

function getPercent(consumed: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return round(Math.min((consumed / target) * 100, 100));
}

export function DashboardMacroGrid({ dashboard, range }: DashboardMacroGridProps) {
  const totals = range === "today" ? dashboard.dayTotals : dashboard.weekTotals;
  const targets = range === "today" ? dashboard.dayTargets : dashboard.weekTargets;

  return (
    <section className="grid gap-3">
      {macroConfig.map((macro) => {
        const label = macro.key === "carbs" ? dashboard.carbLabel : macro.label;
        const consumed = totals?.[macro.key] ?? 0;
        const target = targets?.[macro.key] ?? 0;
        const remaining = Math.max(round(target - consumed), 0);
        const progress = getPercent(consumed, target);

        return (
          <Card key={macro.key} className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
            <CardContent className="grid gap-2 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-500">
                  {Math.round(consumed)} / {Math.round(target)} {macro.unit}
                </p>
              </div>
              <Progress value={progress} className="gap-0" />
              <p className="text-3xl font-semibold leading-none text-slate-900">
                {Math.round(remaining)} {macro.unit}
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Cuanto queda</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
