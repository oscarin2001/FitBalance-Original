export type EmailAuthResult = {
  ok: boolean;
  message?: string;
  error?: string;
  devVerificationUrl?: string;
};
