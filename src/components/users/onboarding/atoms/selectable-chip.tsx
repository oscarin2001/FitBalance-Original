import { cn } from "@/lib/utils";

type SelectableChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
};

export function SelectableChip({ label, selected, onClick, className }: SelectableChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5",
        selected
          ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-300/40"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
        className
      )}
    >
      {label}
    </button>
  );
}
