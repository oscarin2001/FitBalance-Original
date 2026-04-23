"use client";

import { useMemo } from "react";

import { Flame } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import type { UserDashboardPlan } from "@/actions/server/users/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DashboardSummaryCardProps = {
  userName: string;
  dashboard: UserDashboardPlan;
  range: "today" | "week";
  onRangeChange: (value: "today" | "week") => void;
};

const donutRadius = 48;
const donutCircumference = 2 * Math.PI * donutRadius;

function round(value: number): number {
  return Number(value.toFixed(1));
}

function getPercent(consumed: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return round(Math.min((consumed / target) * 100, 100));
}

export function DashboardSummaryCard({ userName, dashboard, range, onRangeChange }: DashboardSummaryCardProps) {
  const totals = range === "today" ? dashboard.dayTotals : dashboard.weekTotals;
  const targets = range === "today" ? dashboard.dayTargets : dashboard.weekTargets;
  const caloriesConsumed = totals?.calories ?? 0;
  const caloriesTarget = targets?.calories ?? 0;
  const caloriesPercent = useMemo(
    () => getPercent(caloriesConsumed, caloriesTarget),
    [caloriesConsumed, caloriesTarget]
  );
  const caloriesDash = (caloriesPercent / 100) * donutCircumference;
  const donutData = [
    { name: "Completado", value: caloriesPercent, color: "#0f766e" },
    { name: "Restante", value: 100 - caloriesPercent, color: "#d1d5db" },
  ];

  return (
    <Card className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60">
      <CardContent className="grid gap-4 p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">Hola, {userName}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tu Dashboard</h1>
          </div>
        </header>

        <Tabs value={range} onValueChange={(value) => onRangeChange(value as "today" | "week")}>
          <TabsList className="w-full rounded-full bg-slate-100 p-1">
            <TabsTrigger value="today" className="rounded-full text-xs">
              Hoy
            </TabsTrigger>
            <TabsTrigger value="week" className="rounded-full text-xs">
              Semana
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
          <div className="relative h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={42}
                  outerRadius={58}
                  paddingAngle={0}
                  stroke="transparent"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <svg viewBox="0 0 120 120" className="pointer-events-none absolute inset-0 h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={donutRadius} fill="none" stroke="#dbe4ea" strokeWidth="12" />
              <circle
                cx="60"
                cy="60"
                r={donutRadius}
                fill="none"
                stroke="#0f766e"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${caloriesDash} ${donutCircumference - caloriesDash}`}
              />
              <text x="60" y="58" textAnchor="middle" className="fill-slate-900 text-[18px] font-semibold">
                {Math.round(caloriesPercent)}%
              </text>
              <text x="60" y="76" textAnchor="middle" className="fill-slate-500 text-[10px] uppercase tracking-[0.18em]">
                Meta
              </text>
            </svg>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mis Metas</p>
            <p className="text-3xl font-semibold text-slate-900">{Math.round(caloriesPercent)}%</p>
            <p className="text-sm text-slate-600">
              {Math.round(caloriesConsumed)} / {Math.round(caloriesTarget)} kcal
            </p>
            <Badge variant="secondary" className="rounded-full">
              <Flame className="size-3.5" />
              {range === "today" ? "Hoy" : "Semana"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
