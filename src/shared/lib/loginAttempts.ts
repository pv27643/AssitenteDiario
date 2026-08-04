// Bloqueio de tentativas falhadas de login, guardado no localStorage
// (uso pessoal, sem necessidade de estado no servidor — ver secção 7 do
// ESTRUTURA_PROJETO.md).

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const STORAGE_PREFIX = "auth_attempts:";

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

interface LockoutState {
  lockedUntil: number | null;
  attemptsLeft: number;
}

function readRecord(username: string): AttemptRecord {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + username);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeRecord(username: string, record: AttemptRecord): void {
  localStorage.setItem(STORAGE_PREFIX + username, JSON.stringify(record));
}

export function getLockoutState(username: string): LockoutState {
  const record = readRecord(username);
  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    writeRecord(username, { count: 0, lockedUntil: null });
    return { lockedUntil: null, attemptsLeft: MAX_ATTEMPTS };
  }
  return { lockedUntil: record.lockedUntil, attemptsLeft: MAX_ATTEMPTS - record.count };
}

export function recordFailedAttempt(username: string): LockoutState {
  const record = readRecord(username);
  const count = record.count + 1;

  if (count >= MAX_ATTEMPTS) {
    const lockedUntil = Date.now() + LOCKOUT_MS;
    writeRecord(username, { count: 0, lockedUntil });
    return { lockedUntil, attemptsLeft: 0 };
  }

  writeRecord(username, { count, lockedUntil: null });
  return { lockedUntil: null, attemptsLeft: MAX_ATTEMPTS - count };
}

export function clearAttempts(username: string): void {
  localStorage.removeItem(STORAGE_PREFIX + username);
}

export const LOGIN_MAX_ATTEMPTS = MAX_ATTEMPTS;
