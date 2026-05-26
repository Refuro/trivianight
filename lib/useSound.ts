import { useCallback, useRef, useState } from "react";

export interface SoundDef {
  freq: number;
  freq2?: number;        // optional glide-to frequency
  duration: number;     // seconds
  type?: OscillatorType; // default: "sine"
  gain?: number;         // default: 0.25
}

export type SoundMap = Record<string, SoundDef>;

function synth(ctx: AudioContext, def: SoundDef): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = def.type ?? "sine";
  osc.frequency.setValueAtTime(def.freq, ctx.currentTime);
  if (def.freq2 !== undefined) {
    osc.frequency.linearRampToValueAtTime(
      def.freq2,
      ctx.currentTime + def.duration,
    );
  }

  const g = def.gain ?? 0.25;
  gainNode.gain.setValueAtTime(g, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + def.duration,
  );

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + def.duration);
}

const STORAGE_KEY = "sound_muted";

/**
 * Generic sound hook — pass in a game-specific SoundMap and get back
 * a stable `play(name)` function plus mute controls.
 *
 * Uses the Web Audio API for synthesis, so no audio files are required.
 * Each game defines its own SoundMap in lib/sounds/<game>.ts.
 */
export function useSound(sounds: SoundMap) {
  const [muted, setMutedState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const ctxRef = useRef<AudioContext | null>(null);
  // Store sounds in a ref so play() never goes stale without re-creating
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (name: string) => {
      if (muted) return;
      const def = soundsRef.current[name];
      if (!def) return;
      try {
        const ctx = getCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") {
          ctx.resume().then(() => synth(ctx, def)).catch(() => {});
        } else {
          synth(ctx, def);
        }
      } catch {
        // AudioContext unavailable (e.g. SSR, blocked by browser policy)
      }
    },
    [muted, getCtx],
  );

  const setMuted = useCallback((val: boolean) => {
    setMutedState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(val));
    }
  }, []);

  return { play, muted, setMuted };
}
