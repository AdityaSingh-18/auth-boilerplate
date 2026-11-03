const ITERATIONS = 310_000;
const KEY_LENGTH = 256;

function encode(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

async function deriveHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(password);
  const passwordBuffer = new Uint8Array(passwordBytes);
  const saltBuffer = new Uint8Array(salt);

  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer.buffer,
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBuffer.buffer,
      iterations,
    },
    key,
    KEY_LENGTH,
  );

  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt, ITERATIONS);

  return [
    "pbkdf2",
    "sha256",
    String(ITERATIONS),
    encode(salt),
    encode(hash),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [
    algorithm,
    hashAlgorithm,
    iterationsText,
    saltText,
    hashText,
  ] = storedHash.split("$");

  if (
    algorithm !== "pbkdf2" ||
    hashAlgorithm !== "sha256" ||
    !iterationsText ||
    !saltText ||
    !hashText
  ) {
    return false;
  }

  const iterations = Number(iterationsText);

  if (
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 2_000_000
  ) {
    return false;
  }

  try {
    const salt = decode(saltText);
    const expectedHash = decode(hashText);

    if (salt.length !== 16 || expectedHash.length !== KEY_LENGTH / 8) {
      return false;
    }

    const actualHash = await deriveHash(password, salt, iterations);

    let difference = 0;

    for (let i = 0; i < expectedHash.length; i += 1) {
      difference |= expectedHash[i] ^ actualHash[i];
    }

    return difference === 0;
  } catch {
    return false;
  }
}