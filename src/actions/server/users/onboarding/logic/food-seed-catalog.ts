import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SeedFoodRecord } from "../types";

type SeedSource = {
  fileName: string;
  arrayName: string;
  preferenceCategory: SeedFoodRecord["preferenceCategory"];
};

type RawSeedFoodRecord = {
  nombre: string;
  categoria: string;
  categoria_enum: string | null;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  porcion: string;
};

const seedSources: SeedSource[] = [
  { fileName: "01_carbohidratos.seed.ts", arrayName: "data", preferenceCategory: "carbs" },
  { fileName: "02_proteinas.seed.ts", arrayName: "data", preferenceCategory: "proteins" },
  { fileName: "03_grasas.seed.ts", arrayName: "data", preferenceCategory: "fats" },
  { fileName: "04_frutos.seed.ts", arrayName: "data", preferenceCategory: "fruits" },
  { fileName: "05_bebidas_infusiones.seed.ts", arrayName: "data", preferenceCategory: "infusions" },
  { fileName: "verduras.ts", arrayName: "baseVerduras", preferenceCategory: "vegetables" },
];

let seedFoodCatalogCache: SeedFoodRecord[] | null = null;

function extractArrayLiteral(source: string, arrayName: string): string {
  const declarationIndex = source.indexOf(`const ${arrayName}`);
  const assignmentIndex = source.indexOf("=", declarationIndex);
  const startIndex = source.indexOf("[", assignmentIndex);

  if (declarationIndex < 0 || assignmentIndex < 0 || startIndex < 0) {
    throw new Error(`No se encontro el arreglo ${arrayName}.`);
  }

  let depth = 0;

  for (let index = startIndex; index < source.length; index += 1) {
    const character = source[index];

    if (character === "[") {
      depth += 1;
      continue;
    }

    if (character === "]") {
      depth -= 1;

      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error(`No se pudo extraer el arreglo ${arrayName}.`);
}

function evaluateSeedArray(source: string, arrayName: string): RawSeedFoodRecord[] {
  const arrayLiteral = extractArrayLiteral(source, arrayName);
  const evaluator = new Function(`return ${arrayLiteral};`);
  return evaluator() as RawSeedFoodRecord[];
}

function parsePortionGrams(portion: string): number {
  const match = portion.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : 100;
}

function normalizeSeedFood(
  rawFood: RawSeedFoodRecord,
  preferenceCategory: SeedFoodRecord["preferenceCategory"]
): SeedFoodRecord {
  return {
    name: rawFood.nombre,
    categoryLabel: rawFood.categoria,
    preferenceCategory,
    enumCategory: rawFood.categoria_enum,
    calories: rawFood.calorias,
    proteins: rawFood.proteinas,
    carbs: rawFood.carbohidratos,
    fats: rawFood.grasas,
    portion: rawFood.porcion,
    gramsReference: parsePortionGrams(rawFood.porcion),
  };
}

export function loadSeedFoodCatalog(): SeedFoodRecord[] {
  if (seedFoodCatalogCache) {
    return seedFoodCatalogCache;
  }

  const seedDirectory = join(process.cwd(), "seed_alimentos_bolivia");
  const dedupedFoods = new Map<string, SeedFoodRecord>();

  for (const seedSource of seedSources) {
    const filePath = join(seedDirectory, seedSource.fileName);
    const fileSource = readFileSync(filePath, "utf8");
    const records = evaluateSeedArray(fileSource, seedSource.arrayName);

    for (const record of records) {
      const normalizedRecord = normalizeSeedFood(record, seedSource.preferenceCategory);
      const recordKey = `${normalizedRecord.name}::${normalizedRecord.categoryLabel}`;

      if (!dedupedFoods.has(recordKey)) {
        dedupedFoods.set(recordKey, normalizedRecord);
      }
    }
  }

  seedFoodCatalogCache = [...dedupedFoods.values()];
  return seedFoodCatalogCache;
}
