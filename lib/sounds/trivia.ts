import { SoundMap } from "@/lib/useSound";

/**
 * Sound definitions for Trivia Night.
 * Each value is a synthesized tone — no audio files needed.
 * Add or tweak entries here to change how trivia sounds.
 */
export const TRIVIA_SOUNDS: SoundMap = {
  // Blip when a new question is revealed
  question_open: { freq: 880, duration: 0.12, type: "sine", gain: 0.14 },

  // Punchy low thud when answers are locked
  answers_closed: { freq: 220, duration: 0.12, type: "sine", gain: 0.2 },

  // Blip on answer reveal, slightly higher to feel distinct
  answer_revealed: { freq: 1046, duration: 0.12, type: "sine", gain: 0.14 },

  // Happy high ping for a correct answer
  answer_accepted: { freq: 880, duration: 0.35, type: "sine", gain: 0.22 },

  // Short low buzz for a wrong answer
  answer_rejected: { freq: 220, duration: 0.25, type: "sawtooth", gain: 0.15 },
};
