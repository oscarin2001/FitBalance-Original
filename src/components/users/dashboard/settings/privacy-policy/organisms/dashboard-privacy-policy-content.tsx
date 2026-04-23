"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { privacySections, privacySummaryLines } from "../data/privacy-policy-content";
import { PrivacySectionCard } from "../molecules/privacy-section-card";

export function DashboardPrivacyPolicyContent() {
  return (
    <div className="space-y-4 px-3 py-3">
      <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="p-4">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700/80">Fitbalance</p>
            <h3 className="mt-2 text-[1.4rem] font-semibold tracking-tight text-slate-950">
              Asi protegemos tus datos dentro de la app.
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Este aviso resume como recopilamos, usamos y protegemos tu informacion para que entiendas mejor el flujo de la plataforma.
            </p>

            <ul className="mt-4 space-y-2 rounded-[1.35rem] bg-white px-4 py-4 shadow-sm ring-1 ring-emerald-100">
              {privacySummaryLines.map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-6 text-slate-600">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {privacySections.map((section) => (
          <PrivacySectionCard key={section.id} section={section} />
        ))}
      </div>

      <Card className="rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <CardContent className="grid gap-3 p-4">
          <p className="text-sm leading-6 text-slate-600">
            Si quieres revisar algo puntual, puedes ir a soporte o ajustar tu cuenta desde el menu lateral.
          </p>

          <Button type="button" className="h-12 w-full rounded-full bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600">
            Entendido
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}