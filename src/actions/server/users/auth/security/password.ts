import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PASSWORD_KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, storedDerivedKey] = storedHash.split(":");

  if (!salt || !storedDerivedKey) {
    return false;
  }

  const derivedKeyBuffer = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const storedBuffer = Buffer.from(storedDerivedKey, "hex");

  if (storedBuffer.length !== derivedKeyBuffer.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKeyBuffer);
}