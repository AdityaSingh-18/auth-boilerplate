import nodemailer from "nodemailer";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type EmailSender = (
  message: EmailMessage,
) => Promise<void>;

// Creates an SMTP-based email sender.
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
    !from ||
    !user ||
    !pass
  ) {
    throw new Error(
      "SMTP configuration is incomplete. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM are required.",
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return async (message: EmailMessage): Promise<void> => {
    await transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  };
}

// Default SMTP email sender.
const smtpEmailSender = createSmtpEmailSender;

// Sends an email using the supplied provider or the default SMTP provider.
export async function sendEmail(
  message: EmailMessage,
  sender: EmailSender = smtpEmailSender(),
): Promise<void> {
  await sender(message);
}

// Sends an authentication OTP email.
export async function sendOtpEmail(
  email: string,
  otp: string,
  sender?: EmailSender,
): Promise<void> {
  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Invalid OTP format.");
  }

  await sendEmail(
    {
      to: email,
      subject: "Your sign-in verification code",
      text: [
        `Your verification code is: ${otp}`,
        "",
        "This code expires in 5 minutes.",
        "If you did not request this code, you can ignore this email.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #18181b;">
          <h2 style="margin-bottom: 16px;">Your verification code</h2>
          <p>Use the following code to sign in:</p>
          <div style="margin: 24px 0; padding: 16px; background: #f4f4f5; border-radius: 8px; text-align: center;">
            <strong style="font-size: 32px; letter-spacing: 8px;">
              ${otp}
            </strong>
          </div>
          <p>This code expires in <strong>5 minutes</strong>.</p>
          <p style="color: #71717a; font-size: 13px;">
            If you did not request this code, you can ignore this email.
          </p>
        </div>
      `,
    },
    sender,
  );
}
