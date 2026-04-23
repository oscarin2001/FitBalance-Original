"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  checked,
  defaultChecked,
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  const isControlled = typeof checked === "boolean"
  const thumbTranslateClass = isControlled
    ? checked
      ? size === "sm"
        ? "translate-x-[10px]"
        : "translate-x-[14px]"
      : "translate-x-0"
    : size === "sm"
      ? "data-checked:translate-x-[10px] data-unchecked:translate-x-0"
      : "data-checked:translate-x-[14px] data-unchecked:translate-x-0"

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center overflow-hidden rounded-full border border-slate-300/80 bg-slate-300/80 shadow-[inset_0_1px_1px_rgba(15,23,42,0.08)] transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-emerald-500/20 focus-visible:ring-3 focus-visible:ring-emerald-500/25 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[18.4px] data-[size=default]:w-[32px] data-[size=sm]:h-[14px] data-[size=sm]:w-[24px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-emerald-500 data-unchecked:bg-slate-300/80 dark:data-unchecked:bg-slate-700/70 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      checked={checked}
      defaultChecked={defaultChecked}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none absolute left-[1px] top-1/2 block -translate-y-1/2 rounded-full bg-background ring-0 shadow-sm transition-transform duration-200 will-change-transform dark:data-checked:bg-background dark:data-unchecked:bg-foreground",
          size === "sm" ? "size-3" : "size-4",
          thumbTranslateClass
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
