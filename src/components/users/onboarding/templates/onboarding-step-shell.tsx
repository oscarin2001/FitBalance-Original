import type { ReactNode } from "react";

import type { WizardStep } from "@/actions/server/users/onboarding/types/onboarding-ui-types";
import { ProgressBanner } from "@/components/users/onboarding/molecules/progress-banner";

type OnboardingStepShellProps = {
  step: WizardStep;
  userName: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function OnboardingStepShell({
  step,
  title,
  subtitle,
  children,
}: OnboardingStepShellProps) {
  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 size-80 rounded-full bg-emerald-300/22 blur-3xl" />
        <div className="absolute right-[-4rem] top-1/4 size-96 rounded-full bg-teal-300/18 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-1/3 size-72 rounded-full bg-emerald-200/16 blur-3xl" />
      </div>

      <section className="relative grid w-full max-w-3xl gap-5">
        <header className="mx-auto grid w-full max-w-2xl justify-items-center gap-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {subtitle ? (
            <p className="mx-auto max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className="mx-auto w-full max-w-2xl">
          <ProgressBanner step={step} />
        </div>

        {children}
      </section>
    </main>
  );
}
