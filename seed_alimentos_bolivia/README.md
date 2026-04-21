# Seeds de alimentos

Archivos incluidos:
- 01_carbohidratos.seed.ts
- 02_proteinas.seed.ts
- 03_grasas.seed.ts
- 04_frutos.seed.ts
- 05_bebidas_infusiones.seed.ts
- 06_verduras.seed.ts
- verduras.ts

Cada archivo inserta 100 registros en `Alimento` usando `createMany`.

Nota:
- `Frutos` y `Verduras` usan el enum `AlimentoCategoria`.
- `BebidasInfusiones` sí usa el enum.
- Los valores son estimados y sirven como base para tu app.
