import { AlimentoCategoria } from "@prisma/client";

import { prisma } from "@/actions/server/users/prisma";

import type { SeedFoodRecord } from "../types";
import { loadSeedFoodCatalog } from "./food-seed-catalog";

function toEnumValue(value: string | null) {
  if (!value) {
    return null;
  }

  return AlimentoCategoria[value as keyof typeof AlimentoCategoria] ?? null;
}

type ExistingFoodRecord = {
  id: number;
  nombre: string;
  categoria: string | null;
  categoria_enum: AlimentoCategoria | null;
  calorias: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  porcion: string | null;
};

function buildFoodKey(name: string, category: string | null) {
  return `${name}::${category ?? ""}`;
}

function hasMeaningfulNutrition(food: Pick<ExistingFoodRecord, "calorias" | "proteinas" | "carbohidratos" | "grasas">) {
  return (food.calorias ?? 0) > 0 || (food.proteinas ?? 0) > 0 || (food.carbohidratos ?? 0) > 0 || (food.grasas ?? 0) > 0;
}

function buildSeedIndexes(seedFoods: SeedFoodRecord[]) {
  const byKey = new Map<string, SeedFoodRecord>();
  const byUniqueName = new Map<string, SeedFoodRecord | null>();

  for (const food of seedFoods) {
    byKey.set(buildFoodKey(food.name, food.categoryLabel), food);

    if (!byUniqueName.has(food.name)) {
      byUniqueName.set(food.name, food);
      continue;
    }

    byUniqueName.set(food.name, null);
  }

  return { byKey, byUniqueName };
}

function resolveSeedMatch(
  food: ExistingFoodRecord,
  seedIndexes: ReturnType<typeof buildSeedIndexes>
): SeedFoodRecord | null {
  const byKey = seedIndexes.byKey.get(buildFoodKey(food.nombre, food.categoria));
  if (byKey) {
    return byKey;
  }

  return seedIndexes.byUniqueName.get(food.nombre) ?? null;
}

export async function syncSeedFoodsToDatabase() {
  const seedFoods = loadSeedFoodCatalog();
  const seedIndexes = buildSeedIndexes(seedFoods);
  const existingFoods = await prisma.alimento.findMany({
    select: {
      id: true,
      nombre: true,
      categoria: true,
      categoria_enum: true,
      calorias: true,
      proteinas: true,
      carbohidratos: true,
      grasas: true,
      porcion: true,
    },
  });
  const existingKeys = new Set(
    existingFoods.map((food) => buildFoodKey(food.nombre, food.categoria))
  );
  const missingFoods = seedFoods.filter(
    (food) => !existingKeys.has(buildFoodKey(food.name, food.categoryLabel))
  );
  const foodsToRepair: Array<{
    id: number;
    data: {
      categoria: string;
      categoria_enum: AlimentoCategoria | null;
      calorias: number;
      proteinas: number;
      carbohidratos: number;
      grasas: number;
      porcion: string;
      region: string;
    };
  }> = [];

  for (const food of existingFoods) {
    const seedFood = resolveSeedMatch(food, seedIndexes);
    if (!seedFood) {
      continue;
    }

    const needsNutritionRepair = !hasMeaningfulNutrition(food);
    const needsMetadataRepair =
      !food.categoria ||
      !food.categoria_enum ||
      !food.porcion ||
      food.categoria !== seedFood.categoryLabel;

    if (!needsNutritionRepair && !needsMetadataRepair) {
      continue;
    }

    foodsToRepair.push({
      id: food.id,
      data: {
        categoria: seedFood.categoryLabel,
        categoria_enum: toEnumValue(seedFood.enumCategory),
        calorias: seedFood.calories,
        proteinas: seedFood.proteins,
        carbohidratos: seedFood.carbs,
        grasas: seedFood.fats,
        porcion: seedFood.portion,
        region: "Bolivia",
      },
    });
  }

  if (missingFoods.length === 0 && foodsToRepair.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (missingFoods.length > 0) {
      await tx.alimento.createMany({
        data: missingFoods.map((food) => ({
          nombre: food.name,
          categoria: food.categoryLabel,
          categoria_enum: toEnumValue(food.enumCategory),
          calorias: food.calories,
          proteinas: food.proteins,
          carbohidratos: food.carbs,
          grasas: food.fats,
          porcion: food.portion,
          region: "Bolivia",
        })),
      });
    }

    for (const food of foodsToRepair) {
      await tx.alimento.update({
        where: { id: food.id },
        data: food.data,
      });
    }
  });
}
