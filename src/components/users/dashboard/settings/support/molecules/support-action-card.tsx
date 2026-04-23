"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { SupportContentCard } from "../data/support-content";

type SupportActionCardProps = {
  item: SupportContentCard;
};

export function SupportActionCard({ item }: SupportActionCardProps) {
  return (
    <Card className="rounded-[1.75rem] border border-slate-200/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-slate-50 text-slate-500 ring-8 ring-slate-50">
            <item.icon className="size-7" />
          </div>

          <h3 className="mt-4 text-[1.35rem] font-semibold tracking-tight text-slate-950">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>

          <Button
            type="button"
            className={cn(
              "mt-4 h-12 w-full rounded-full text-base font-semibold",
              item.ctaTone === "emerald"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50"
            )}
            variant={item.ctaTone === "emerald" ? "default" : "outline"}
          >
            {item.ctaLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}