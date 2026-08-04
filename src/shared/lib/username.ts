const USERNAME_REGEX = /^[a-z0-9_.-]{3,20}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

// Supabase Auth precisa de um email — usamos um domínio sintético.
// Nota: ".local" e domínios de exemplo (example.com/.org/.net) são
// rejeitados pelo validador de email do Supabase Auth com
// "email_address_invalid"; ".invalid" (RFC 2606, reservado para
// endereços que sabidamente não existem) passa na validação.
export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@interno.invalid`;
}
