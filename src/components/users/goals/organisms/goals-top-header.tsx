"use client";

import { useMemo } from "react";

import { MoreVertical, Settings2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type GoalsTopHeaderProps = {
  userName: string;
  onAvatarClick?: () => void;
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

export function GoalsTopHeader({ userName, onAvatarClick, className }: GoalsTopHeaderProps) {
  const initials = useMemo(() => getInitials(userName), [userName]);
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        className
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="relative shrink-0"
          aria-label="Abrir perfil o configuraciones"
          onClick={() => {
            if (isMobile || !onAvatarClick) {
              toggleSidebar();
              return;
            }

            onAvatarClick();
          }}
        >
          <Avatar className="size-11 border border-emerald-200/70 bg-emerald-50 text-emerald-700 shadow-sm">
            <AvatarFallback className="bg-emerald-50 text-[11px] font-semibold tracking-[0.18em] text-emerald-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full border border-white bg-slate-100 text-slate-500 shadow-sm">
            <Settings2 className="size-2.5" />
          </span>
        </button>

        <div className="justify-self-center text-center">
          <h1 className="text-[1.05rem] font-semibold tracking-tight text-slate-900">Metas</h1>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Más opciones de metas"
          className="rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          <MoreVertical className="size-5" />
        </Button>
      </div>
    </header>
  );
}