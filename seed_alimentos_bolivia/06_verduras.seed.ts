import { AlimentoCategoria, PrismaClient } from "@prisma/client";

import { verduras } from "./verduras";

const prisma = new PrismaClient();

async function main() {
  await prisma.alimento.createMany({
    data: verduras.map((item) => ({
      nombre: item.nombre,
      categoria: item.categoria,
      categoria_enum: AlimentoCategoria[item.categoria_enum],
      calorias: item.calorias,
      proteinas: item.proteinas,
      carbohidratos: item.carbohidratos,
      grasas: item.grasas,
      porcion: item.porcion,
    })),
  });

  console.log(`Insertados ${verduras.length} registros en 06_verduras.seed.ts`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });