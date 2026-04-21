import { Plus, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CategoryStepSectionProps = {
  categoryKey: string;
  title: string;
  description: string;
  currentStepError?: string;
  searchValue: string;
  searchPlaceholder?: string;
  selectedFoods: string[];
  currentFoods: string[];
  emptyState?: string;
  onSearchChange: (value: string) => void;
  onToggleFood: (food: string) => void;
};

export function CategoryStepSection({
  categoryKey,
  title,
  description,
  currentStepError,
  searchValue,
  searchPlaceholder,
  selectedFoods,
  currentFoods,
  emptyState,
  onSearchChange,
  onToggleFood,
}: CategoryStepSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="text-xl font-semibold text-slate-950">{title}</h4>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
          {selectedFoods.length} seleccionado{selectedFoods.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <FieldError>{currentStepError}</FieldError>

      <label className="grid gap-2">
        <span className="sr-only">Buscar alimento</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-12 rounded-2xl border-slate-300 bg-slate-50/80 pl-10 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-cyan-200"
          />
        </div>
      </label>

      {selectedFoods.length > 0 ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            {selectedFoods.map((food) => (
              <button
                type="button"
                key={`${categoryKey}-${food}-selected`}
                onClick={() => onToggleFood(food)}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-cyan-300/50 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-cyan-700"
              >
                <span className="max-w-[14rem] truncate">{food}</span>
                <X className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-900">Opciones disponibles</p>
          <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
            {currentFoods.length} opcion{currentFoods.length === 1 ? "" : "es"}
          </Badge>
        </div>

        <div className="max-h-72 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/60 [&::-webkit-scrollbar-track]:bg-transparent">
          {currentFoods.length > 0 ? (
            <ul className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
              {currentFoods.map((food) => (
                <li key={`${categoryKey}-${food}`} className="border-b border-slate-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onToggleFood(food)}
                    className={cn(
                      "group flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors duration-150",
                      selectedFoods.includes(food)
                        ? "bg-cyan-50 text-cyan-950"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{food}</span>
                      <div
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-full border transition-colors duration-150",
                          selectedFoods.includes(food)
                            ? "border-cyan-300 bg-cyan-100 text-cyan-700"
                            : "border-cyan-200 bg-cyan-50 text-cyan-600 group-hover:border-cyan-300 group-hover:bg-cyan-100"
                        )}
                        aria-hidden="true"
                      >
                      <Plus
                        className={cn(
                            "size-4 transition-transform duration-200",
                          selectedFoods.includes(food)
                              ? "rotate-45"
                              : ""
                        )}
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              {emptyState}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
