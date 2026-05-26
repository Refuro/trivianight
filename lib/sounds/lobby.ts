import { SoundMap } from "@/lib/useSound";

/**
 * Sound definitions for the lobby — shared across all game modes.
 * Future games don't need to redefine these.
 */
export const LOBBY_SOUNDS: SoundMap = {
  // Soft blip when a new player joins the room
  player_joined: { freq: 660, duration: 0.12, type: "sine", gain: 0.14 },

  // Blip when the host starts the game
  game_started: { freq: 880, duration: 0.12, type: "sine", gain: 0.14 },
};
