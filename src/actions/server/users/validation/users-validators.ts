import { NivelActividad, Objetivo, VelocidadCambio } from "@prisma/client";

import type { CreateUserInput, UpdateUserInput } from "../types/users-types";

type ParseResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

const objetivos = new Set<Objetivo>([
  "Bajar_grasa",
  "Ganar_musculo",
  "Mantenimiento",
]);

const nivelesActividad = new Set<NivelActividad>([
  "Sedentario",
  "Ligero",
  "Moderado",
  "Activo",
  "Extremo",
]);

const velocidadesCambio = new Set<VelocidadCambio>([
  "Rapido",
  "Moderado",
  "Lento",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRequiredString(
  value: unknown,
  fieldName: string
): ParseResult<string> {
  if (typeof value !== "string" || !value.trim()) {
    return { ok: false, error: `El campo ${fieldName} es obligatorio.` };
  }

  return { ok: true, data: value.trim() };
}

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const clean = value.trim();
  return clean ? clean : undefined;
}

function parseRequiredDate(value: unknown): ParseResult<Date> {
  if (typeof value !== "string") {
    return { ok: false, error: "fecha_nacimiento debe ser string ISO." };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "fecha_nacimiento no es una fecha valida." };
  }

  return { ok: true, data: date };
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function parseOptionalObjetivo(value: unknown): Objetivo | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && objetivos.has(value as Objetivo)) {
    return value as Objetivo;
  }

  return undefined;
}

function parseOptionalNivelActividad(value: unknown): NivelActividad | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && nivelesActividad.has(value as NivelActividad)) {
    return value as NivelActividad;
  }

  return undefined;
}

function parseOptionalVelocidadCambio(value: unknown): VelocidadCambio | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && velocidadesCambio.has(value as VelocidadCambio)) {
    return value as VelocidadCambio;
  }

  return undefined;
}

export function parseCreateUserInput(body: unknown): ParseResult<CreateUserInput> {
  if (!isRecord(body)) {
    return { ok: false, error: "Body invalido." };
  }

  const nombre = parseRequiredString(body.nombre, "nombre");
  if (nombre.ok === false) {
    return { ok: false, error: nombre.error };
  }

  const apellido = parseRequiredString(body.apellido, "apellido");
  if (apellido.ok === false) {
    return { ok: false, error: apellido.error };
  }

  const fechaNacimiento = parseRequiredDate(body.fecha_nacimiento);
  if (fechaNacimiento.ok === false) {
    return { ok: false, error: fechaNacimiento.error };
  }

  const sexo = parseRequiredString(body.sexo, "sexo");
  if (sexo.ok === false) {
    return { ok: false, error: sexo.error };
  }

  if (typeof body.terminos_aceptados !== "boolean") {
    return {
      ok: false,
      error: "terminos_aceptados es obligatorio y debe ser boolean.",
    };
  }

  return {
    ok: true,
    data: {
      nombre: nombre.data,
      apellido: apellido.data,
      fecha_nacimiento: fechaNacimiento.data,
      sexo: sexo.data,
      terminos_aceptados: body.terminos_aceptados,
      altura_cm: parseOptionalNumber(body.altura_cm),
      peso_kg: parseOptionalNumber(body.peso_kg),
      objetivo: parseOptionalObjetivo(body.objetivo),
      nivel_actividad: parseOptionalNivelActividad(body.nivel_actividad),
      pais: parseOptionalString(body.pais),
      peso_objetivo_kg: parseOptionalNumber(body.peso_objetivo_kg),
      velocidad_cambio: parseOptionalVelocidadCambio(body.velocidad_cambio),
    },
  };
}

export function parseUpdateUserInput(body: unknown): ParseResult<UpdateUserInput> {
  if (!isRecord(body)) {
    return { ok: false, error: "Body invalido." };
  }

  const data: UpdateUserInput = {};

  if (body.nombre !== undefined) {
    const parsed = parseRequiredString(body.nombre, "nombre");
    if (parsed.ok === false) {
      return { ok: false, error: parsed.error };
    }
    data.nombre = parsed.data;
  }

  if (body.apellido !== undefined) {
    const parsed = parseRequiredString(body.apellido, "apellido");
    if (parsed.ok === false) {
      return { ok: false, error: parsed.error };
    }
    data.apellido = parsed.data;
  }

  if (body.fecha_nacimiento !== undefined) {
    const parsed = parseRequiredDate(body.fecha_nacimiento);
    if (parsed.ok === false) {
      return { ok: false, error: parsed.error };
    }
    data.fecha_nacimiento = parsed.data;
  }

  if (body.sexo !== undefined) {
    const parsed = parseRequiredString(body.sexo, "sexo");
    if (parsed.ok === false) {
      return { ok: false, error: parsed.error };
    }
    data.sexo = parsed.data;
  }

  if (body.terminos_aceptados !== undefined) {
    if (typeof body.terminos_aceptados !== "boolean") {
      return {
        ok: false,
        error: "terminos_aceptados debe ser boolean cuando se envia.",
      };
    }
    data.terminos_aceptados = body.terminos_aceptados;
  }

  if (body.altura_cm !== undefined) {
    data.altura_cm = parseOptionalNumber(body.altura_cm);
  }

  if (body.peso_kg !== undefined) {
    data.peso_kg = parseOptionalNumber(body.peso_kg);
  }

  if (body.objetivo !== undefined) {
    data.objetivo = parseOptionalObjetivo(body.objetivo);
  }

  if (body.nivel_actividad !== undefined) {
    data.nivel_actividad = parseOptionalNivelActividad(body.nivel_actividad);
  }

  if (body.pais !== undefined) {
    data.pais = parseOptionalString(body.pais);
  }

  if (body.peso_objetivo_kg !== undefined) {
    data.peso_objetivo_kg = parseOptionalNumber(body.peso_objetivo_kg);
  }

  if (body.velocidad_cambio !== undefined) {
    data.velocidad_cambio = parseOptionalVelocidadCambio(body.velocidad_cambio);
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No hay campos validos para actualizar." };
  }

  return { ok: true, data };
}
