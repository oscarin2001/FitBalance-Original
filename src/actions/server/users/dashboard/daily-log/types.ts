export type DailyLogFoodOption = {
  id: number;
  name: string;
  categoryLabel: string | null;
  categoryEnum: string | null;
  portion: string | null;
  gramsReference: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  isBeverage: boolean;
  isMine?: boolean;
  isFavorite?: boolean;
  isRecipe?: boolean;
  isShared?: boolean;
};
