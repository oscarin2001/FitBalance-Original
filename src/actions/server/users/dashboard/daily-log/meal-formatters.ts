export function formatQuantityLabel(quantity: number, unit: "g" | "ml") {
  const rounded = Number(quantity.toFixed(1));
  const displayQuantity = Number.isInteger(rounded) ? String(Math.round(rounded)) : rounded.toFixed(1);

  return `${displayQuantity} ${unit}`;
}

export function scaleNutrition(
  baseNutrition: {
    calories?: number;
    proteins?: number;
    carbs?: number;
    fats?: number;
  } | null | undefined,
  baseQuantity: number,
  nextQuantity: number
) {
  const safeBaseQuantity = baseQuantity > 0 ? baseQuantity : 1;
  const ratio = nextQuantity > 0 ? nextQuantity / safeBaseQuantity : 0;

  return {
    calories: Number((((baseNutrition?.calories ?? 0) * ratio).toFixed(1))),
    proteins: Number((((baseNutrition?.proteins ?? 0) * ratio).toFixed(1))),
    carbs: Number((((baseNutrition?.carbs ?? 0) * ratio).toFixed(1))),
    fats: Number((((baseNutrition?.fats ?? 0) * ratio).toFixed(1))),
  };
}