import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearData() {
  await prisma.alimento.deleteMany({
    where: {
      OR: [
        { categoria: "Carbohidratos" },
        { categoria: "Proteinas" },
        { categoria: "Grasos" },
        { categoria: "Frutos" },
        { categoria: "Verduras" },
        { categoria: "BebidasInfusiones" },
      ],
    },
  });
}

async function main() {
  await clearData();
  console.log("Limpieza lista. Ejecuta los archivos seed separados según necesites.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
