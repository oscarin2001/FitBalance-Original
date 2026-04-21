import type { ReactNode } from "react";
import Link from "next/link";
import { GalleryVerticalEndIcon } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <section className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </span>
            FitBalance
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </section>

      <section className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_45%),radial-gradient(circle_at_80%_30%,hsl(var(--accent)/0.22),transparent_40%),linear-gradient(135deg,hsl(210_40%_96%),hsl(200_45%_88%))]" />
      </section>
    </main>
  );
}
