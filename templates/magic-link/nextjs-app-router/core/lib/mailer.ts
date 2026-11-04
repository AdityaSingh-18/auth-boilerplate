import nodemailer from "nodemailer";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type EmailSender = (message: EmailMessage) => Promise<void>;

export function createSmtpEmailSender(): EmailSender {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM;

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !pass ||
    !from
  ) {
    throw new Error(
      "SMTP configuration is incomplete. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM are required.",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return async (message) => {
    await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  };
}

export async function sendEmail(
  message: EmailMessage,
  sender: EmailSender = createSmtpEmailSender(),
): Promise<void> {
  await sender(message);
}

export async function sendMagicLinkEmail(
  email: string,
  url: string,
  sender?: EmailSender,
): Promise<void> {
  await sendEmail(
    {
      to: email,
      subject: "Your sign-in link",
      text: [
        "Use the link below to sign in:",
        url,
        "",
        "This link expires in 15 minutes and can only be used once.",
        "If you did not request this link, you can ignore this email.",
      ].join("\n"),
      html: `
        <p>Use the link below to sign in:</p>
        <p><a href="${url}">Sign in to your account</a></p>
        <p>This link expires in 15 minutes and can only be used once.</p>
        <p>If you did not request this link, you can ignore this email.</p>
      `,
    },
    sender,
  );
}
