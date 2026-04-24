"use client";

import { BarChart3, LayoutGrid, Plus, Users, Utensils, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BottomNavbarTab = "registro" | "metas" | "comidas" | "comunidad";

type NavItemConfig = {
  key: BottomNavbarTab;
  label: string;
  icon: LucideIcon;
  beta?: boolean;
};

const NAV_ITEMS: NavItemConfig[] = [
  { key: "registro", label: "Registro", icon: LayoutGrid },
  { key: "metas", label: "Metas", icon: BarChart3 },
  { key: "comidas", label: "Comidas", icon: Utensils, beta: true },
  { key: "comunidad", label: "Comunidad", icon: Users, beta: true },
] ;

type BottomNavbarProps = {
  activeTab: BottomNavbarTab;
  onTabChange: (tab: BottomNavbarTab) => void;
  onFabClick: () => void;
  className?: string;
};

export function BottomNavbar({ activeTab, onTabChange, onFabClick, className }: BottomNavbarProps) {
  return (
    <nav
      aria-label="Navegaci\u00f3n inferior"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_-12px_40px_rgba(15,23,42,0.08)]",
        className
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative mx-auto flex w-full items-center justify-around px-4 pt-3">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItem
            key={item.key}
            active={activeTab === item.key}
            label={item.label}
            icon={item.icon}
            beta={item.beta}
            onClick={() => onTabChange(item.key)}
          />
        ))}

        <div className="w-16" aria-hidden="true" />

        {NAV_ITEMS.slice(2).map((item) => (
          <NavItem
            key={item.key}
            active={activeTab === item.key}
            label={item.label}
            icon={item.icon}
            beta={item.beta}
            onClick={() => onTabChange(item.key)}
          />
        ))}

        <Button
          type="button"
          onClick={onFabClick}
          aria-label="Ajustar plan nutricional"
          className="absolute left-1/2 -top-7 size-16 -translate-x-1/2 rounded-full border-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-[0_18px_36px_rgba(16,185,129,0.34)] ring-4 ring-white transition-transform hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-95"
        >
          <Plus className="size-7" strokeWidth={3.25} />
        </Button>
      </div>
    </nav>
  );
}

function NavItem({
  active,
  label,
  icon: Icon,
  beta,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: LucideIcon;
  beta?: boolean;
  onClick: () => void;
}) {
  const toneClassName = beta
    ? "text-slate-400"
    : active
      ? "text-teal-600"
      : "text-slate-400 hover:text-slate-700";

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex w-16 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-medium transition duration-200 active:scale-95",
        toneClassName
      )}
    >
      <Icon className={cn("size-6 transition-transform duration-200", beta ? "text-slate-400" : active && "-translate-y-0.5")} />
      <span className="leading-none">{label}</span>
      {beta ? <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-300">BETA</span> : null}
    </button>
  );
}