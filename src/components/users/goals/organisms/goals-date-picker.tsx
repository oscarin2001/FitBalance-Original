"use client";

import { useMemo, useState } from "react";

import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function parseDateValue(valueIso: string) {
  const date = new Date(valueIso);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

type GoalsDatePickerFieldProps = {
  valueIso: string;
  onChange: (valueIso: string) => void;
  label?: string;
  description?: string;
  buttonClassName?: string;
};

export function GoalsDatePickerField({ valueIso, onChange, label = "Fecha", description, buttonClassName }: GoalsDatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateValue(valueIso), [valueIso]);
  const displayDate = useMemo(() => formatDisplayDate(selectedDate), [selectedDate]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-left transition hover:border-slate-300 hover:bg-slate-50",
          buttonClassName
        )}
      >
        <span className="grid min-w-0 gap-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
          <span className="truncate text-sm font-medium text-slate-900">{displayDate}</span>
        </span>
        <CalendarDays className="size-4 shrink-0 text-slate-500" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-sm rounded-[1.5rem] border border-white/70 bg-white/95 p-0 shadow-2xl">
          <DialogHeader className="px-5 pt-5 pr-12">
            <DialogTitle className="text-lg uppercase tracking-[0.18em] text-slate-900">{label}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <div className="px-3 pb-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={(date) => {
                if (!date) {
                  return;
                }

                onChange(toDateInputValue(date));
                setOpen(false);
              }}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
