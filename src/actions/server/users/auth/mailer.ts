import nodemailer from "nodemailer";

type SendVerificationEmailInput = {
  email: string;
  firstName: string;
  token: string;
};

export type VerificationEmailResult = {
  delivered: boolean;
  previewUrl?: string;
};

function normalizeBoolean(value: string | undefined): boolean {
  return value === "true" || value === "1";
}

function getAppBaseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function buildVerificationUrl(token: string): string {
  const baseUrl = getAppBaseUrl().replace(/\/$/, "");
  const encodedToken = encodeURIComponent(token);

  return `${baseUrl}/users/verify-email?token=${encodedToken}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendVerificationEmail(
  input: SendVerificationEmailInput
): Promise<VerificationEmailResult> {
  const verificationUrl = buildVerificationUrl(input.token);
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT ?? "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = normalizeBoolean(process.env.SMTP_SECURE);
  const mailFrom = process.env.MAIL_FROM ?? "FitBalance <no-reply@fitbalance.local>";
  const safeFirstName = escapeHtml(input.firstName);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.info("[auth] SMTP not configured. Verification link:", verificationUrl);
    return {
      delivered: false,
      previewUrl: verificationUrl,
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number.isFinite(smtpPort) ? smtpPort : 587,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: mailFrom,
    to: input.email,
    subject: "Verifica tu correo en FitBalance",
    text: [
      `Hola ${input.firstName},`,
      "",
      "Gracias por registrarte en FitBalance.",
      "Para activar tu cuenta, verifica tu correo en este enlace:",
      verificationUrl,
      "",
      "Si no solicitaste esta cuenta, ignora este mensaje.",
    ].join("\n"),
    html: [
      `<p>Hola <strong>${safeFirstName}</strong>,</p>`,
      "<p>Gracias por registrarte en FitBalance.</p>",
      `<p>Para activar tu cuenta, verifica tu correo en este enlace:</p>`,
      `<p><a href=\"${verificationUrl}\">Verificar correo</a></p>`,
      "<p>Si no solicitaste esta cuenta, ignora este mensaje.</p>",
    ].join(""),
  });

  return {
    delivered: true,
  };
}