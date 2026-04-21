import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: ComponentPropsWithoutRef<"img">) {
  return (
    <img
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }