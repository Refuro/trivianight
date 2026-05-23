# Trivia Night App — Planning Doc

## Overview

A real-time multiplayer trivia platform for private friend groups. No accounts —
players pick a name and avatar, join or create a game room, and play together.
Hosted on Vercel with real-time via PartyKit. All question content is hand-authored
by the host as JSON packs stored in the repo.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) | Vercel-native, good ecosystem |
| Real-time | PartyKit | Built for multiplayer rooms, pairs perfectly with Vercel |
| Content | JSON files in `/packs` | No DB needed, easy to author and version |
| Auth | None | Ephemeral identity — name + avatar per session |
| Database | None | All game state lives in PartyKit room memory |

---

## User Flow

### 1. Landing Page
- Enter display name
- Pick avatar from pre-made grid (20–30 illustrated icons, auto-assigned color ring)
- Two CTAs: **Create Game** or **Join Game**

### 2. Game List
- Shows open rooms: room name, host name, player count, game mode (if set)
- Join by clicking a room from the list
- Or enter a room code directly (for sharing via Discord/text)
- "Create Game" opens a new room and makes you the host

### 3. Lobby
- **Host sees:** game type selector, question pack selector, team toggle, Start button
- **Players see:** current settings (read-only), player list, team join UI if teams enabled
- Room code displayed prominently for sharing
- Everyone can see who has joined and which team they're on in real-time

### 4. In-Game
- Mode-specific UI loads based on pack type
- Host has a control panel (overlay or sidebar)
- Live scoreboard visible to all at all times
- When game ends, final scores shown with a "Play Again / Back to Lobby" option

---

## Content Structure

All question packs are JSON files in a `/packs` directory in the repo.
The `mode` field tells the app which game engine and UI to use.

### Standard Trivia Pack

```json
{
  "id": "pub-night-vol1",
  "name": "Pub Night Vol. 1",
  "mode": "trivia",
  "rounds": [
    {
      "name": "Round 1 — Pop Culture",
      "pointValue": 1,
      "questions": [
        {
          "q": "What year did Jurassic Park release?",
          "a": "1993",
          "note": "Acceptable: '93"
        }
      ]
    },
    {
      "name": "Round 2 — Double Points",
      "pointValue": 2,
      "questions": []
    }
  ]
}
```

- `pointValue` per round enables double-point rounds, final-round multipliers, etc.
- `note` field is for host-only guidance (acceptable alternate answers, hints to read aloud)

### Jeopardy Pack

```json
{
  "id": "jeopardy-001",
  "name": "Game Night Jeopardy",
  "mode": "jeopardy",
  "board": [
    {
      "category": "Pop Culture",
      "clues": [
        { "value": 200, "clue": "This artist wore a meat dress to the 2010 VMAs", "answer": "Lady Gaga" },
        { "value": 400, "clue": "...", "answer": "...", "dailyDouble": true },
        { "value": 600, "clue": "...", "answer": "..." },
        { "value": 800, "clue": "...", "answer": "..." },
        { "value": 1000, "clue": "...", "answer": "..." }
      ]
    }
  ],
  "finalJeopardy": {
    "category": "History",
    "clue": "...",
    "answer": "..."
  }
}
```

- Exactly 6 categories, 5 clues each
- Daily Doubles flagged inline with `"dailyDouble": true` — place these manually in the pack
- `finalJeopardy` is optional; if omitted, game ends when board is cleared

---

## Game Modes

### Mode 1: Standard Trivia

**Team support:** Optional — host toggles on/off before starting

**Flow:**
1. Host reveals question to all screens
2. Teams discuss (no enforced timer — host controls pace)
3. Host reveals answer
4. Host taps team name(s) to award points
5. Scoreboard updates live for everyone
6. Repeat through all rounds

**Scoring:**
- Point value is set per round in the pack
- Host manually awards points — no auto-scoring
- This supports open-ended answers, partial credit, "close enough" judgment calls

**Host Controls:**
- Reveal question
- Reveal answer
- Award points to one or multiple teams
- Skip question
- Previous / next navigation

---

### Mode 2: Jeopardy

**Team support:** Always on (2–4 teams)

**Flow:**
1. Full board shown to all players (6 categories × 5 values)
2. Active team selects a clue (host can override selection if needed)
3. Clue revealed on all screens
4. **Buzz-in:** First player to tap wins the right to answer
   - Server-authoritative: server timestamps first `buzz` event received, broadcasts winner
   - All other players' buttons lock out immediately
   - Wrong answer: that player is locked out for the remainder of that clue; others can steal
   - Correct answer: value added to team score
5. Selected clue is greyed out on the board
6. Next team's turn to pick
7. Repeat until board is cleared (or host ends early)

**Daily Double:**
- Triggered automatically when a flagged clue is selected
- Wagering team sets their wager before clue is revealed (min: $5, max: their current score or the clue value, whichever is higher)
- No buzz-in — only the wagering team answers
- Host judges correct/incorrect, wager applied

**Final Jeopardy:**
- All teams submit a wager before the category is revealed
- Category shown first, then clue revealed
- Teams type their answer into a text field; submissions lock after host triggers the timer end
- Host reveals all answers one by one, judges each, wagers applied
- Final scores shown

**Host Controls:**
- Override which team is selecting
- Judge answer correct / incorrect
- Manually adjust any team's score (edge cases)
- Reveal / hide clue
- Trigger Final Jeopardy sequence

---

## Avatar System

- 20–30 pre-made illustrated avatars (mix of animals, objects, faces)
- Each player gets a colored ring around their avatar (auto-assigned from a palette, or player picks)
- Displayed next to player name throughout: lobby, in-game, scoreboard
- Grid picker on the landing page — tap to select, no upload, no customization beyond choice + color

---

## Real-Time Architecture (PartyKit)

Each game room is a PartyKit Durable Object, identified by a short room code (e.g. `WOLF4`).

### Room State Shape

```ts
interface RoomState {
  roomCode: string
  hostId: string
  phase: "lobby" | "playing" | "ended"
  gameMode: "trivia" | "jeopardy" | null
  packId: string | null
  players: Player[]
  teams: Team[]
  gameState: TriviaState | JeopardyState | null
}

interface Player {
  id: string
  name: string
  avatarId: string
  color: string
  teamId: string | null
}

interface Team {
  id: string
  name: string
  score: number
  memberIds: string[]
}
```

### Key Events

| Event | Direction | Description |
|---|---|---|
| `player_join` | client → server → all | New player enters lobby |
| `player_leave` | server → all | Player disconnected |
| `settings_update` | host → server → all | Game mode / pack / team toggle changed |
| `team_join` | client → server → all | Player joins a team |
| `game_start` | host → server → all | Lobby closes, game begins |
| `buzz_in` | client → server → all | Jeopardy buzz; server picks first, broadcasts winner |
| `host_action` | host → server → all | Reveal, award, judge, next, skip |
| `score_update` | server → all | Authoritative score state broadcast |
| `game_end` | server → all | Final scores, triggers end screen |

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Landing — name + avatar picker, stored in session |
| `/games` | Game list + create/join UI |
| `/room/[code]` | Lobby and in-game — same route, phase-aware rendering |

The `/room/[code]` route handles everything post-join. The UI shifts based on
`phase: lobby → playing → ended` so there's no disruptive navigation mid-game.

---

## Build Order

### Phase 1 — Shell & Identity
- Landing page (name + avatar picker, persist to session)
- Game list page (create room, browse open rooms, join by code)
- PartyKit connection + room creation
- Lobby UI (player list, room code, host settings panel)

### Phase 2 — Standard Trivia
- Pack loading and question/answer display
- Host control panel (reveal, award, next)
- Team formation in lobby
- Live scoreboard component

### Phase 3 — Jeopardy
- Board rendering (6×5 grid, category headers, value tiles)
- Buzz-in mechanic (server-authoritative, lockout on wrong answer)
- Daily Double wager flow
- Final Jeopardy sequence (wager → category → clue → answers → reveal)

### Phase 4 — Polish
- Animations: score reveal, buzz-in flash, board tile flip
- Sound effects: buzz, correct chime, wrong buzz (optional but high value)
- Mobile-responsive layout (players are on phones, host likely on laptop)
- Pack validator script (lint JSON packs before deploying — catch missing fields)

---

## Out of Scope (v1)

- User accounts or persistent stats
- Admin panel for writing questions (edit JSON directly)
- Spectator mode
- Public matchmaking (game list is effectively private — needs the site URL to find rooms)
- Timed auto-scoring for standard trivia (host judges manually)
