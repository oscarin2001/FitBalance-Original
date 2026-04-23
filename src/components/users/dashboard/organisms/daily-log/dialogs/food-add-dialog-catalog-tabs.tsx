"use client";

import { cn } from "@/lib/utils";

export type FoodAddDialogCatalogTab = "all" | "favorites" | "mine" | "my-recipes" | "recipes";

type FoodAddDialogCatalogTabsProps = {
  value: FoodAddDialogCatalogTab;
  onValueChange: (value: FoodAddDialogCatalogTab) => void;
  className?: string;
};

const catalogTabs: Array<{
  value: FoodAddDialogCatalogTab;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "favorites", label: "Favoritos" },
  { value: "mine", label: "Mis alimentos" },
  { value: "my-recipes", label: "Mis recetas" },
  { value: "recipes", label: "Recetas" },
];

export function FoodAddDialogCatalogTabs({ value, onValueChange, className }: FoodAddDialogCatalogTabsProps) {
  return (
    <div className={cn("flex min-w-0 items-end gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}>
      {catalogTabs.map((tab) => {
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-2 pt-1 text-sm font-semibold transition-colors",
              isActive
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
