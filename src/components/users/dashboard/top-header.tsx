"use client";

import { useMemo, useState } from "react";

import { Crown, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  formatRelativeDateLabel,
  parseDateKey,
  shiftDateKey,
  toDateKey,
} from "@/lib/date-labels";
import { cn } from "@/lib/utils";

type TopHeaderProps = {
  userName: string;
  selectedDateIso: string;
  onDateChange: (dateIso: string) => void;
  className?: string;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopHeader({ userName, selectedDateIso, onDateChange, className }: TopHeaderProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDate = useMemo(() => parseDateKey(selectedDateIso), [selectedDateIso]);
  const initials = useMemo(() => getInitials(userName), [userName]);
  const dateLabel = useMemo(() => formatRelativeDateLabel(selectedDateIso), [selectedDateIso]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
          className
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex w-full items-center gap-3 px-4 py-3">
          <button type="button" className="relative shrink-0" aria-label="Perfil">
            <Avatar className="size-11 border border-emerald-200/70 bg-emerald-50 text-emerald-700 shadow-sm">
              <AvatarFallback className="bg-emerald-50 text-[11px] font-semibold tracking-[0.18em] text-emerald-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border border-white bg-slate-100 text-slate-500 shadow-sm">
              <Settings2 className="size-2.5" />
            </span>
          </button>

          <div className="flex flex-1 justify-center">
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50/90 p-1 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onDateChange(shiftDateKey(selectedDateIso, -1))}
                className="rounded-full text-slate-500 hover:text-slate-900"
                aria-label="Ir a la fecha anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setCalendarOpen(true)}
                className="min-w-28 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700 hover:bg-white hover:text-slate-950"
              >
                {dateLabel}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onDateChange(shiftDateKey(selectedDateIso, 1))}
                className="rounded-full text-slate-500 hover:text-slate-900"
                aria-label="Ir a la fecha siguiente"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-full border-emerald-200 bg-emerald-50/70 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 shadow-sm hover:bg-emerald-100 hover:text-emerald-800"
          >
            <Crown className="size-3.5" />
            Hazte Premium
          </Button>
        </div>
      </header>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-sm rounded-[1.5rem] border border-white/70 bg-white/95 p-0 shadow-2xl">
          <DialogHeader className="px-5 pt-5 pr-12">
            <DialogTitle className="text-lg uppercase tracking-[0.18em] text-slate-900">
              Elegir fecha
            </DialogTitle>
            <DialogDescription>
              Selecciona un dia para revisar tu registro y plan.
            </DialogDescription>
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

                onDateChange(toDateKey(date));
                setCalendarOpen(false);
              }}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TopHeaderSkeleton() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex w-full items-center gap-3 px-4 py-3">
        <div className="size-11 animate-pulse rounded-full bg-slate-200" />
        <div className="flex flex-1 justify-center">
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            <div className="size-7 animate-pulse rounded-full bg-slate-200" />
            <div className="h-7 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="size-7 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
      </div>
    </header>
  );
}