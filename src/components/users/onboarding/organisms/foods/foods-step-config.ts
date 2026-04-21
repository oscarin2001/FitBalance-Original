import {
  foodCatalog,
  requiredFoodCategories,
  type FoodCategoryKey,
} from "@/actions/server/users/onboarding/constants";

export type FoodsStepFormFieldErrors = {
  preferencias?: string;
};

export type FoodSubstepKey = FoodCategoryKey;

export const foodSubsteps: Array<{ key: FoodSubstepKey; label: string }> = [
  ...requiredFoodCategories.map((category) => ({
    key: category,
    label: foodCatalog[category].label,
  })),
];
