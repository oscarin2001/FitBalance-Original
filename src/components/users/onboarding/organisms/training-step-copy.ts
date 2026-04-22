import type { LucideIcon } from "lucide-react";
import { Dumbbell, Flame, TimerReset, Wand2 } from "lucide-react";

import type { TrainingTypeValue } from "@/actions/server/users/onboarding/types/onboarding-ui-types";

type TrainingCopy = {
  icon: LucideIcon;
};

export const trainingTypeCopy: Record<TrainingTypeValue, TrainingCopy> = {
  No_entrena: {
    icon: TimerReset,
  },
  Cardio: {
    icon: Flame,
  },
  Mixto: {
    icon: Wand2,
  },
  Musculacion: {
    icon: Dumbbell,
  },
};
