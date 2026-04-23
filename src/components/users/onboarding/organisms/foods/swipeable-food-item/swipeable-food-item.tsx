"use client";

import { useState } from "react";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Copy, PencilLine, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACTION_WIDTH = 192;
const SWIPE_OPEN_THRESHOLD = 64;

async function copyTextToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export type SwipeableFoodItemProps = {
  title: string;
  subtitle?: string;
  copyValue?: string;
  onEdit?: () => void;
  onDelete: () => void;
  onCopy?: (value: string) => void;
  className?: string;
};

export function SwipeableFoodItem({
  title,
  subtitle,
  copyValue,
  onEdit,
  onDelete,
  onCopy,
  className,
}: SwipeableFoodItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const resolvedCopyValue = copyValue ?? title;

  function close() {
    setIsOpen(false);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const shouldOpen = info.offset.x > SWIPE_OPEN_THRESHOLD || info.velocity.x > 500;
    setIsOpen(shouldOpen);
  }

  async function handleCopy() {
    await copyTextToClipboard(resolvedCopyValue);
    onCopy?.(resolvedCopyValue);
    close();
  }

  function handleEdit() {
    onEdit?.();
    close();
  }

  function handleDelete() {
    close();
    onDelete();
  }

  return (
    <div className={cn("relative overflow-hidden rounded-3xl", className)}>
      <div className="absolute inset-y-0 left-0 flex w-[192px] items-stretch">
        <Button
          type="button"
          variant="ghost"
          className="h-full w-1/3 rounded-none bg-emerald-500 px-0 text-white hover:bg-emerald-600"
          onClick={handleEdit}
        >
          <span className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <PencilLine className="size-4" />
            Editar
          </span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-full w-1/3 rounded-none bg-amber-500 px-0 text-white hover:bg-amber-600"
          onClick={handleCopy}
        >
          <span className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <Copy className="size-4" />
            Copiar
          </span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-full w-1/3 rounded-none bg-rose-500 px-0 text-white hover:bg-rose-600"
          onClick={handleDelete}
        >
          <span className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <Trash2 className="size-4" />
            Eliminar
          </span>
        </Button>
      </div>

      <motion.button
        type="button"
        layout
        drag="x"
        dragConstraints={{ left: 0, right: ACTION_WIDTH }}
        dragElastic={0.08}
        dragMomentum={false}
        animate={{ x: isOpen ? ACTION_WIDTH : 0 }}
        transition={{ type: "spring", stiffness: 440, damping: 38 }}
        onClick={() => {
          if (isOpen) {
            close();
          }
        }}
        onDragEnd={handleDragEnd}
        className={cn(
          "touch-pan-y relative z-10 w-full rounded-3xl border border-slate-200/80 bg-white px-4 py-4 text-left shadow-sm outline-none transition-transform",
          "active:cursor-grabbing"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">{title}</p>
            {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
          </div>

          <AnimatePresence initial={false} mode="wait">
            {!isOpen ? (
              <motion.span
                key="hint"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400"
              >
                Desliza
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
}