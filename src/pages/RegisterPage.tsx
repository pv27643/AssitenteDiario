import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { isValidUsername, normalizeUsername } from "@/shared/lib/username";
import { isValidPin } from "@/shared/lib/pin";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const USERNAME_HINTS: Record<UsernameStatus, string | null> = {
  idle: null,
  checking: "A verificar disponibilidade...",
  available: "Disponível.",
  taken: "Esse nome já está em uso.",
  invalid: "3-20 caracteres: letras, números, '.', '_' ou '-'.",
};

export default function RegisterPage() {
  const { session, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      setUsernameStatus("idle");
      return;
    }
    if (!isValidUsername(normalized)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(async () => {
      const { data, error: rpcError } = await supabase.rpc("is_username_available", {
        check_username: normalized,
      });
      if (rpcError) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus(data ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
  }, [username]);

  if (session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (usernameStatus !== "available") {
      setError("Escolhe um nome de utilizador válido e disponível.");
      return;
    }
    if (!isValidPin(pin)) {
      setError("O PIN deve ter exatamente 6 dígitos.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("Os PINs não coincidem.");
      return;
    }

    setSubmitting(true);
    const { error: registerError } = await register(username, pin);
    setSubmitting(false);

    if (registerError) {
      setError(registerError);
      return;
    }
    navigate("/", { replace: true });
  }

  const usernameHintColor =
    usernameStatus === "taken" || usernameStatus === "invalid" ? "text-red-500" : "text-zinc-400";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold text-white">Criar conta</h1>
        <p className="mb-6 text-sm text-zinc-400">Assistente Diário</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-zinc-300">
              Nome de utilizador
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              required
            />
            {USERNAME_HINTS[usernameStatus] && (
              <p className={`mt-1 text-xs ${usernameHintColor}`}>{USERNAME_HINTS[usernameStatus]}</p>
            )}
          </div>

          <div>
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-zinc-300">
              PIN (6 dígitos)
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              pattern="\d{6}"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm tracking-[0.5em] text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              required
            />
          </div>

          <div>
            <label htmlFor="pinConfirm" className="mb-1 block text-sm font-medium text-zinc-300">
              Confirmar PIN
            </label>
            <input
              id="pinConfirm"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              pattern="\d{6}"
              value={pinConfirm}
              onChange={(event) => setPinConfirm(event.target.value.replace(/\D/g, ""))}
              className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm tracking-[0.5em] text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 min-h-11 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {submitting ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já tens conta?{" "}
          <Link to="/login" className="font-medium text-red-500 hover:text-red-400">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
