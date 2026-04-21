import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "inline-flex w-fit items-center gap-1 text-sm leading-none font-medium text-foreground select-none group-data-[disabled=true]/field:opacity-50",
  {
    variants: {
      size: {
        default: "text-sm",
        sm: "text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

function Label({
  className,
  size,
  ...props
}: React.ComponentProps<"label"> & VariantProps<typeof labelVariants>) {
  return <label data-slot="label" className={cn(labelVariants({ size }), className)} {...props} />;
}

export { Label };
