const PIN_REGEX = /^\d{6}$/;

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

/** Hash guardado em profiles.pin_hash — o PIN em si nunca é persistido. */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
