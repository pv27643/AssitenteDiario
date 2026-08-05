import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, Square } from "lucide-react";
import { formatClock } from "../utils";

interface CountdownTimerProps {
  mode: "countdown";
  initialSeconds: number;
  onComplete?: () => void;
}

interface StopwatchTimerProps {
  mode: "stopwatch";
  onStop?: (elapsedSeconds: number) => void;
}

type TimerProps = CountdownTimerProps | StopwatchTimerProps;

/** Toca um beep curto e vibra (se o dispositivo suportar) para assinalar o fim do descanso. */
function notifyEnd() {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);

  try {
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => ctx.close();
  } catch {
    // Web Audio indisponível — a vibração já dá o aviso.
  }
}

const primaryButtonClass =
  "flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-500";
const iconButtonClass =
  "flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white";
const pillButtonClass =
  "flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white";
const inputClass =
  "min-h-11 w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-center text-sm text-white focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";

/** Temporizador reutilizável: descanso (contagem decrescente) ou sessão (cronómetro simples). */
export default function Timer(props: TimerProps) {
  const isCountdown = props.mode === "countdown";
  const [seconds, setSeconds] = useState(isCountdown ? props.initialSeconds : 0);
  const [running, setRunning] = useState(false);
  const [customSeconds, setCustomSeconds] = useState(isCountdown ? String(props.initialSeconds) : "");
  const startRef = useRef<number | null>(null);
  const baseRef = useRef(seconds);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!running) return;

    startRef.current = Date.now();
    baseRef.current = seconds;
    notifiedRef.current = false;

    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - (startRef.current ?? Date.now())) / 1000;

      if (isCountdown) {
        const next = Math.max(0, baseRef.current - elapsed);
        setSeconds(next);
        if (next <= 0 && !notifiedRef.current) {
          notifiedRef.current = true;
          setRunning(false);
          notifyEnd();
          if (props.mode === "countdown") props.onComplete?.();
        }
      } else {
        setSeconds(baseRef.current + elapsed);
      }
    }, 250);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function handleToggleRunning() {
    setRunning((prev) => !prev);
  }

  function handleSkip() {
    setRunning(false);
    setSeconds(0);
    if (props.mode === "countdown") props.onComplete?.();
  }

  function handleAdd15() {
    setSeconds((prev) => prev + 15);
  }

  function handleStop() {
    setRunning(false);
    if (props.mode === "stopwatch") props.onStop?.(Math.round(seconds));
  }

  function handleCustomSecondsChange(value: string) {
    setCustomSeconds(value);
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed >= 0) setSeconds(parsed);
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {isCountdown && !running && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <label htmlFor="restSeconds">Descanso (s)</label>
          <input
            id="restSeconds"
            type="number"
            min="0"
            inputMode="numeric"
            value={customSeconds}
            onChange={(event) => handleCustomSecondsChange(event.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <span className="font-mono text-4xl font-semibold text-white">{formatClock(seconds)}</span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleRunning}
          className={primaryButtonClass}
          aria-label={running ? "Pausar" : "Iniciar"}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>

        {isCountdown ? (
          <>
            <button type="button" onClick={handleAdd15} className={pillButtonClass}>
              +15s
            </button>
            <button type="button" onClick={handleSkip} className={iconButtonClass} aria-label="Saltar descanso">
              <SkipForward className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button type="button" onClick={handleStop} className={iconButtonClass} aria-label="Terminar">
            <Square className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
