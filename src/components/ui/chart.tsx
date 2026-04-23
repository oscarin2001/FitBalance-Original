"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip as RechartsTooltip, type TooltipProps } from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChartContext() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("Chart components must be used within <ChartContainer>.");
  }

  return context;
}

type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
};

function ChartContainer({ className, config, children, style, ...props }: ChartContainerProps) {
  const cssVariables = React.useMemo(() => {
    const entries = Object.entries(config).map(([key, entry], index) => {
      const color = entry.color ?? `var(--chart-${Math.min(index + 1, 5)})`;

      return [`--color-${key}`, color] as const;
    });

    return Object.fromEntries(entries) as React.CSSProperties;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart-container"
        className={cn("relative w-full", className)}
        style={{ ...cssVariables, ...style }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartTooltip(props: TooltipProps<any, any>) {
  return <RechartsTooltip {...props} />;
}

function ChartTooltipContent({ active, payload, label, hideLabel = false }: any) {
  const { config } = useChartContext();

  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];
  const dataKey = String(item.dataKey ?? "");
  const entry = config[dataKey];
  const resolvedLabel =
    typeof label === "string" || typeof label === "number"
      ? label
      : typeof item.name === "string"
        ? item.name
        : dataKey;

  return (
    <div className="grid min-w-[8rem] gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs shadow-xl shadow-slate-200/70">
      {hideLabel ? null : <p className="font-medium text-slate-500">{resolvedLabel}</p>}

      <div className="flex items-center gap-2">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: `var(--color-${dataKey})` }}
        />
        <span className="font-medium text-slate-950">{entry?.label ?? dataKey}</span>
        <span className="ml-auto tabular-nums text-slate-700">
          {typeof item.value === "number" ? item.value.toFixed(1) : String(item.value ?? "")}
        </span>
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
