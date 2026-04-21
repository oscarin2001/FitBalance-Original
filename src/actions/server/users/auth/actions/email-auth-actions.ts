"use server";

import { registerWithEmail } from "../email-auth-service";

import type { EmailAuthResult } from "../types";

export async function registerWithEmailAction(input: unknown): Promise<EmailAuthResult> {
  return registerWithEmail(input);
}
