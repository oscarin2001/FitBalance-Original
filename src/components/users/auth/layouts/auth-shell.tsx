import type { ReactNode } from "react";
import Link from "next/link";
import { GalleryVerticalEndIcon } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid min-h-svh overflow-hidden lg:grid-cols-2">
      <section className="relative flex flex-col gap-4 overflow-hidden p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.12),transparent_34%),radial-gradient(circle_at_82%_24%,rgba(20,184,166,0.12),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.9))]" />
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-emerald-500 text-white">
              <GalleryVerticalEndIcon className="size-4" />
            </span>
            FitBalance
          </Link>
        </div>
        <div className="relative flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </section>

      <section className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_42%),radial-gradient(circle_at_80%_30%,rgba(20,184,166,0.18),transparent_38%),radial-gradient(circle_at_50%_85%,rgba(14,165,233,0.14),transparent_35%),linear-gradient(135deg,#ecfdf5,#f0fdfa_42%,#eff6ff)]" />
      </section>
    </main>
  );
}
