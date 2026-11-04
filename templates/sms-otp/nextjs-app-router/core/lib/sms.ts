export interface SmsMessage {
  to: string;
  text: string;
}

export type SmsSender = (
  message: SmsMessage,
) => Promise<void>;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `${name} is required for the selected SMS provider.`,
    );
  }

  return value;
}

// Console provider for local development.
export function createConsoleSmsSender(): SmsSender {
  return async (message) => {
    console.info(
      `[SMS console provider] To: ${message.to}\n${message.text}`,
    );
  };
}

// Twilio SMS provider.
export function createTwilioSmsSender(): SmsSender {
  return async (message) => {
    const accountSid = requiredEnv("TWILIO_ACCOUNT_SID");
    const authToken = requiredEnv("TWILIO_AUTH_TOKEN");
    const from = requiredEnv("TWILIO_PHONE_NUMBER");

    const credentials = Buffer.from(
      `${accountSid}:${authToken}`,
    ).toString("base64");

    const body = new URLSearchParams({
      To: message.to,
      From: from,
      Body: message.text,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!response.ok) {
      throw new Error(
        `Twilio SMS request failed (${response.status}).`,
      );
    }
  };
}

// Vonage SMS provider.
export function createVonageSmsSender(): SmsSender {
  return async (message) => {
    const apiKey = requiredEnv("VONAGE_API_KEY");
    const apiSecret = requiredEnv("VONAGE_API_SECRET");
    const from = requiredEnv("VONAGE_BRAND_NAME");

    const response = await fetch(
      "https://rest.nexmo.com/sms/json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          from,
          to: message.to.replace(/^\+/, ""),
          text: message.text,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Vonage SMS request failed (${response.status}).`,
      );
    }

    const result = await response.json() as {
      messages?: Array<{
        status?: string;
        "error-text"?: string;
      }>;
    };

    const firstMessage = result.messages?.[0];

    if (!firstMessage || firstMessage.status !== "0") {
      throw new Error(
        firstMessage?.["error-text"] ??
          "Vonage did not accept the SMS message.",
      );
    }
  };
}

// Selects the configured SMS provider.
export function createSmsSender(): SmsSender {
  const provider = process.env.SMS_PROVIDER
    ?.trim()
    .toLowerCase();

  switch (provider) {
    case "console":
      return createConsoleSmsSender();

    case "twilio":
      return createTwilioSmsSender();

    case "vonage":
      return createVonageSmsSender();

    default:
      throw new Error(
        'SMS_PROVIDER must be "console", "twilio", or "vonage".',
      );
  }
}

// Sends an SMS using the supplied or configured provider.
export async function sendSms(
  message: SmsMessage,
  sender: SmsSender = createSmsSender(),
): Promise<void> {
  await sender(message);
}

// Sends an authentication OTP.
export async function sendOtpSms(
  phone: string,
  otp: string,
  sender?: SmsSender,
): Promise<void> {
  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Invalid OTP format.");
  }

  await sendSms(
    {
      to: phone,
      text: [
        `Your verification code is ${otp}.`,
        "It expires in 5 minutes.",
        "If you did not request this code, you can ignore this message.",
      ].join(" "),
    },
    sender,
  );
}
