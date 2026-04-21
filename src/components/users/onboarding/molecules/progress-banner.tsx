import { Progress } from "@/components/ui/progress";
import type { WizardStep } from "@/actions/server/users/onboarding/types/onboarding-ui-types";

const orderedSteps: WizardStep[] = ["metrics", "foods", "summary"];

export function ProgressBanner({ step }: { step: WizardStep }) {
  const activeIndex = orderedSteps.findIndex((item) => item === step);
  const percentage = ((activeIndex + 1) / orderedSteps.length) * 100;

  return (
    <section className="rounded-full border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <Progress value={percentage} className="h-2 flex-1" />
        <span className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
          {Math.round(percentage)}%
        </span>
      </div>
    </section>
  );
}

