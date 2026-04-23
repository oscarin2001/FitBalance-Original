"use client";

import { Copy, MoreVertical, PencilLine, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { DailyLogIngredient, DailyLogMeal } from "../../daily-log-view";

async function copyTextToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.readOnly = true;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function buildIngredientCopyValue(ingredient: DailyLogIngredient) {
  const calories = Math.round(ingredient.nutrition?.calories ?? 0);
  const proteins = Math.round(ingredient.nutrition?.proteins ?? 0);

  return `${ingredient.name} · ${ingredient.quantityLabel} · ${calories} kcal · ${proteins}g proteína`;
}

export type IngredientActionsMenuProps = {
  meal: DailyLogMeal;
  ingredient: DailyLogIngredient;
  onEdit: () => void;
  onDelete: () => void;
  onCopy?: (value: string) => void;
  className?: string;
};

export function IngredientActionsMenu({ ingredient, onEdit, onDelete, onCopy, className }: IngredientActionsMenuProps) {
  const copyValue = buildIngredientCopyValue(ingredient);

  async function handleCopy() {
    await copyTextToClipboard(copyValue);
    onCopy?.(copyValue);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Acciones de ${ingredient.name}`}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 shadow-sm transition-colors hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300",
          className
        )}
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-40 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-[0_16px_32px_-16px_rgba(15,23,42,0.45)]"
      >
        <DropdownMenuItem
          onClick={onEdit}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <PencilLine className="size-4" />
          </span>
          Editar
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleCopy}
          className="gap-2 rounded-xl px-2.5 py-2 text-sm text-slate-700 outline-none transition-colors focus:!bg-slate-200 focus:!text-slate-900"
        >
          <span className="flex size-4 items-center justify-center text-slate-500">
            <Copy className="size-4" />
          </span>
          Copiar
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-slate-200" />

        <DropdownMenuItem
          onClick={onDelete}
          variant="destructive"
          className="gap-2 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors focus:!bg-rose-50 focus:!text-rose-700"
        >
          <span className="flex size-4 items-center justify-center text-rose-500">
            <Trash2 className="size-4" />
          </span>
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}