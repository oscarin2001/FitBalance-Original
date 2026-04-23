export const FOOD_CREATE_CATEGORIES = [
  { value: "Proteinas", label: "Proteínas" },
  { value: "Carbohidratos", label: "Carbohidratos" },
  { value: "Fibras", label: "Fibras" },
  { value: "Snacks", label: "Snacks" },
  { value: "Grasos", label: "Grasas" },
  { value: "Frutos", label: "Frutas" },
  { value: "Verduras", label: "Verduras" },
  { value: "BebidasInfusiones", label: "Bebidas e infusiones" },
] as const;

export type FoodCreateCategoryValue = (typeof FOOD_CREATE_CATEGORIES)[number]["value"];

export const FOOD_CREATE_DEFAULT_CATEGORY: FoodCreateCategoryValue = "Proteinas";

export function getFoodCreateCategoryLabel(value: FoodCreateCategoryValue) {
  return FOOD_CREATE_CATEGORIES.find((category) => category.value === value)?.label ?? value;
}
