// Shared types between the Next.js client and the PartyKit server.
// Keep these in sync — both sides import from here.

// ----- Identity -----

export interface Identity { 
  name: string, 
  avatarId: string, 
  color: string 
}

export interface Player {
  id: string;          // assigned by server on connect
  name: string;
  avatarId: string;    // matches an id in lib/avatars.ts
  color: string;       // hex string for the ring around avatar
  teamId: string | null;
}

// ----- Teams -----

export interface Team {
  id: string;
  name: string;
  score: number;
  memberIds: string[];
}

// ----- Room -----

export type RoomPhase = "lobby" | "playing" | "ended";
export type GameMode = "trivia" | "jeopardy";

export interface RoomState {
  roomCode: string;
  hostId: string | null;
  phase: RoomPhase;
  gameMode: GameMode | null;
  packId: string | null;
  players: Player[];
  teams: Team[];
  // Game-mode-specific state goes in here when phase === "playing"
  gameState: TriviaState | JeopardyState | null;
}

// ----- Trivia gameplay state -----

export interface TriviaState {
  mode: "trivia";
  roundIndex: number;
  questionIndex: number;
  questionRevealed: boolean;
  answerRevealed: boolean;
}

// ----- Jeopardy gameplay state -----

export interface JeopardyState {
  mode: "jeopardy";
  usedClues: string[];               // "categoryIndex-clueIndex" strings
  activeClue: ActiveClue | null;
  activeTeamId: string | null;       // whose turn it is to pick
  phase: "board" | "clue" | "answering" | "final";
  lockedOutPlayerIds: string[];      // wrong-answer lockouts for current clue
}

export interface ActiveClue {
  categoryIndex: number;
  clueIndex: number;
  buzzedPlayerId: string | null;     // null while open for buzz
}

// ----- Question pack schemas (mirrors of the JSON files) -----

export interface TriviaPack {
  id: string;
  name: string;
  mode: "trivia";
  rounds: TriviaRound[];
}

export interface TriviaRound {
  name: string;
  pointValue: number;
  questions: TriviaQuestion[];
}

export interface TriviaQuestion {
  q: string;
  a: string;
  note?: string;
}

export interface JeopardyPack {
  id: string;
  name: string;
  mode: "jeopardy";
  board: JeopardyCategory[];
  finalJeopardy?: { category: string; clue: string; answer: string };
}

export interface JeopardyCategory {
  category: string;
  clues: JeopardyClue[];
}

export interface JeopardyClue {
  value: number;
  clue: string;
  answer: string;
  dailyDouble?: boolean;
}

export type Pack = TriviaPack | JeopardyPack;

// ----- Wire events (client <-> server messages) -----
// Add to this union as you build out features. Discriminated by `type`.

export type ClientMessage =
  | { type: "join"; isCreator: boolean, name: string; avatarId: string; color: string }
  | { type: "settings_update"; gameMode?: GameMode; packId?: string }
  | { type: "team_join"; teamId: string }
  | { type: "team_create"; name: string }
  | { type: "start_game" }
  | { type: "buzz_in" }
  | {
      type: "host_action";
      action: "reveal_question" | "reveal_answer" | "next" | "award" | "judge";
      payload?: unknown;
    }
  | { type: "kicked"; reason: "no_room_found" | "room_full" | "host_kicked" | "previously_kicked"};

export type ServerMessage =
  | { type: "room_state"; state: RoomState }
  | { type: "you_are"; playerId: string }
  | { type: "error"; message: string }
  | { type: "kicked"; reason: "no_room_found" | "room_full" | "host_kicked" | "previously_kicked"};
