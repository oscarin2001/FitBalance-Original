"use client";

import {
  FileDown,
  Flame,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Trophy,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FoodAddDialogActionsMenuProps = {
  onQuickEntry?: () => void;
  onCreateFood?: () => void;
  onCreateRecipe?: () => void;
  onViewAiRecipe?: () => void;
  onCreateMeal?: () => void;
  onCreatePlan?: () => void;
  onImportRecipe?: () => void;
  className?: string;
};

const premiumIconClassName = "size-4 text-emerald-600";

function MenuItemIcon({ icon: Icon, className }: { icon: typeof Flame; className?: string }) {
  return (
    <span className="flex size-4 items-center justify-center text-slate-500">
      <Icon className={className ?? "size-4"} />
    </span>
  );
}

export function FoodAddDialogActionsMenu({
  onQuickEntry,
  onCreateFood,
  onCreateRecipe,
  onViewAiRecipe,
  onCreateMeal,
  onCreatePlan,
  onImportRecipe,
  className,
}: FoodAddDialogActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Más opciones del catálogo"
        className={cn(
          "inline-flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-200",
          className
        )}
      >
        <MoreHorizontal className="size-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[18rem] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_36px_-18px_rgba(15,23,42,0.45)]"
      >
        <DropdownMenuItem
          onClick={() => onQuickEntry?.()}
          className="gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950"
        >
          <MenuItemIcon icon={Flame} />
          Entrada rápida
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-slate-200" />

        <DropdownMenuItem
          onSelect={() => onCreateFood?.()}
          className="gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950"
        >
          <MenuItemIcon icon={Plus} />
          Crear alimento
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onCreateRecipe?.()}
          className="gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950"
        >
          <MenuItemIcon icon={NotebookPen} />
          Crear receta
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onViewAiRecipe?.()}
          className="gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950"
        >
          <MenuItemIcon icon={Sparkles} className="size-4 text-cyan-600" />
          Ver receta recomendada por IA
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-slate-200" />

        <DropdownMenuItem
          disabled
          onSelect={() => onCreateMeal?.()}
          className="gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950"
        >
          <MenuItemIcon icon={UtensilsCrossed} className="size-4 text-slate-400" />
          Crear comida
          <span className="ml-auto flex size-4 items-center justify-center text-emerald-600">
            <Trophy className={premiumIconClassName} />
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled
          onSelect={() => onCreatePlan?.()}
          className="gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950"
        >
          <MenuItemIcon icon={NotebookPen} className="size-4 text-slate-400" />
          Crear plan de comidas
          <span className="ml-auto flex size-4 items-center justify-center text-emerald-600">
            <Trophy className={premiumIconClassName} />
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled
          onSelect={() => onImportRecipe?.()}
          className="gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 outline-none transition-colors focus:!bg-slate-100 focus:!text-slate-950"
        >
          <MenuItemIcon icon={FileDown} className="size-4 text-slate-400" />
          Importar receta
          <span className="ml-auto flex size-4 items-center justify-center text-emerald-600">
            <Trophy className={premiumIconClassName} />
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
