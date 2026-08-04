import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/shared/lib/supabase";
import { hashPin, isValidPin } from "@/shared/lib/pin";
import { isValidUsername, normalizeUsername, usernameToEmail } from "@/shared/lib/username";
import { clearAttempts, getLockoutState, recordFailedAttempt } from "@/shared/lib/loginAttempts";

interface Profile {
  id: string;
  username: string;
  created_at: string;
}

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (username: string, pin: string) => Promise<AuthResult>;
  register: (username: string, pin: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function minutesUntil(timestamp: number): number {
  return Math.max(1, Math.ceil((timestamp - Date.now()) / 60_000));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      setProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("id, username, created_at")
      .eq("id", userId)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session?.user.id]);

  async function register(rawUsername: string, pin: string): Promise<AuthResult> {
    const username = normalizeUsername(rawUsername);

    if (!isValidUsername(username)) {
      return { error: "Nome de utilizador inválido (3-20 caracteres: letras, números, '.', '_' ou '-')." };
    }
    if (!isValidPin(pin)) {
      return { error: "O PIN deve ter exatamente 6 dígitos." };
    }

    const { data: available, error: availabilityError } = await supabase.rpc(
      "is_username_available",
      { check_username: username },
    );
    if (availabilityError) {
      return { error: "Não foi possível validar o nome de utilizador. Tenta novamente." };
    }
    if (!available) {
      return { error: "Esse nome de utilizador já está em uso." };
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password: pin,
    });
    if (signUpError || !signUpData.user) {
      return { error: signUpError?.message ?? "Não foi possível criar a conta." };
    }

    const pinHash = await hashPin(pin);
    const { error: profileError } = await supabase.from("profiles").insert({
      id: signUpData.user.id,
      username,
      pin_hash: pinHash,
    });
    if (profileError) {
      return { error: "Conta criada, mas houve um erro a guardar o perfil." };
    }

    return { error: null };
  }

  async function login(rawUsername: string, pin: string): Promise<AuthResult> {
    const username = normalizeUsername(rawUsername);

    const lockout = getLockoutState(username);
    if (lockout.lockedUntil) {
      return {
        error: `Demasiadas tentativas falhadas. Tenta novamente daqui a ${minutesUntil(lockout.lockedUntil)} min.`,
      };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password: pin,
    });

    if (signInError) {
      const attempt = recordFailedAttempt(username);
      if (attempt.lockedUntil) {
        return {
          error: `Demasiadas tentativas falhadas. Conta bloqueada por ${minutesUntil(attempt.lockedUntil)} min.`,
        };
      }
      return { error: `Utilizador ou PIN incorretos. Tentativas restantes: ${attempt.attemptsLeft}.` };
    }

    clearAttempts(username);
    return { error: null };
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      login,
      register,
      logout,
    }),
    [session, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return ctx;
}
