import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

// Normalizes and validates a phone number using E.164 format.
export function normalizePhoneNumber(
  phone: string,
  defaultCountry?: CountryCode,
): string {
  const parsedPhone = parsePhoneNumberFromString(
    phone.trim(),
    defaultCountry,
  );

  if (!parsedPhone || !parsedPhone.isValid()) {
    throw new Error("INVALID_PHONE_NUMBER");
  }

  return parsedPhone.number;
}
