# Implementation Guide

This guide walks you through building the trivia app **yourself**, step by step.
It teaches the concepts you'll need, gives you code **patterns** (not full solutions),
and points to docs/resources when you need to learn something new.

Treat each section as a stage. Read the whole section before you start coding it.
When you get stuck, the "What you'll need to learn" callouts list the exact concept
to go research.

---

## How to Read This Guide

- **Patterns** show the *shape* of code, not the answer. You fill in the details.
- **Concepts** are new ideas you'll need to understand. Links to docs included.
- **Checkpoints** are "when this section is done, X should work." Use them to know you can move on.
- **Gotchas** are the bugs you'd hit if I didn't warn you.

If something feels too abstract, build a tiny isolated example of the concept
first (in a scratch file), then go back to the real code.

---

## What You Already Have

The scaffold gave you:

```
trivia-app/
├── app/                    Next.js App Router pages (page.tsx files = routes)
│   ├── page.tsx            Landing page              → /
│   ├── games/page.tsx      (unused — see note below)
│   ├── room/[code]/page.tsx Dynamic room route       → /room/ABCD
│   ├── layout.tsx          Wraps every page
│   └── globals.css         Tailwind base
├── components/             (empty — your components go here)
├── lib/
│   ├── types.ts            Shared types (client + server)
│   ├── avatars.ts          Avatar list + colors
│   └── useIdentity.ts      Reads identity from sessionStorage
├── party/
│   └── index.ts            PartyKit server (stub)
├── packs/
│   ├── sample-trivia.json  Example trivia pack
│   └── sample-jeopardy.json Example jeopardy pack
├── partykit.json           PartyKit config
└── package.json            Scripts: dev, dev:party
```

**Note on `/games`:** the original plan had a separate game list page. We're
skipping it for v1 — Join and Create buttons live directly on the landing page,
and the only two real routes are `/` and `/room/[code]`. The stub file is
harmless; delete it later or repurpose it if you ever build a public room
browser.

**Run the app:**
```bash
# Terminal 1 — Next.js
npm run dev          # http://localhost:3000

# Terminal 2 — PartyKit
npm run dev:party    # http://localhost:1999
```

You need both running together. Next.js serves the UI; PartyKit handles
real-time game rooms.

---

## Concepts You'll Need (Read This First)

You said your skill level is React basics + useState/useEffect + TypeScript +
Tailwind. Here's a quick map of what's new in this project and what you'll learn
as you build.

### 1. Next.js App Router

You're using Next 16 with the App Router. Key differences from plain React:

- **File-based routing**: `app/games/page.tsx` becomes the route `/games`. No router config needed.
- **Server components by default**: every component is a "server component" unless you put `"use client"` at the top. Server components render once on the server, can't use hooks like `useState`. Anything interactive needs `"use client"`.
- **Dynamic routes**: `[code]` in a folder name is a URL parameter. `app/room/[code]/page.tsx` gets `params.code` from the URL.

📚 [Next.js App Router docs](https://nextjs.org/docs/app)
📚 [Server vs client components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

**Practical rule for this project**: anything that uses state, effects, event
handlers, or WebSockets → put `"use client"` at the top of the file.

### 2. WebSockets and PartyKit

Skribbl.io–style games need a persistent two-way connection between every player
and the server. That's a **WebSocket**.

- An HTTP request: client asks, server answers, connection closes.
- A WebSocket: client and server keep a connection open, either side can send messages anytime.

**PartyKit** is a service that gives you a stateful WebSocket server, one
**room** per game. Each room is an instance of a class (your `TriviaParty` in
`party/index.ts`) that lives in memory. When players connect to room `WOLF4`,
they all hit the same instance, which holds the game state.

Your client connects with the `partysocket` package:
```ts
import PartySocket from "partysocket";
const socket = new PartySocket({
  host: "localhost:1999",  // or your prod host
  room: "WOLF4",
});
socket.addEventListener("message", (e) => { /* ... */ });
socket.send(JSON.stringify({ type: "join", ... }));
```

📚 [PartyKit docs](https://docs.partykit.io/)
📚 [WebSocket basics on MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

### 3. State on Two Sides

This is the hardest concept in real-time apps. Both the client and the server
hold state, and you have to keep them in sync.

**The pattern this project uses (server-authoritative):**

1. Server holds the *truth* (the `RoomState` object).
2. Clients send *intents* (`{ type: "buzz_in" }`).
3. Server validates, mutates its state, broadcasts the new state.
4. Clients receive the new state, replace their local copy, re-render.

**Critical rule**: never let the client mutate game state directly. The client
sends a message saying what it wants to happen; the server decides whether it
happens. If you skip this, players will see different scores, double-buzz, etc.

### 4. Discriminated Unions (TypeScript)

You'll see this pattern everywhere in `lib/types.ts`:

```ts
type ClientMessage =
  | { type: "join"; name: string; ... }
  | { type: "buzz_in" }
  | { type: "team_join"; teamId: string };
```

This is a **discriminated union**. The `type` field tells TS which shape the
object has. Inside a `switch (msg.type)`, TS narrows the type automatically:

```ts
switch (msg.type) {
  case "join":
    // here TS knows msg has .name and .avatarId
    break;
  case "buzz_in":
    // here TS knows there are no other fields
    break;
}
```

This is how you model "events of different kinds" type-safely. Use it for every
message format and every game state.

📚 [TS discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

### 5. Custom Hooks

You'll wrap the WebSocket connection in a custom hook (`useRoom`) so any
component in the room route can read room state. A custom hook is just a
function whose name starts with `use` and that calls other hooks inside.

📚 [React custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## Phase 1 — Identity & Lobby

Goal: a player can enter a name + avatar, create or join a room directly from
the landing page, and see the lobby update in real-time as others join.

### 1.1 — Landing Page (`app/page.tsx`)

What it does: collects name + avatar, then either **creates** a new room or
**joins** an existing one by code. Saves identity to `sessionStorage` and
routes to `/room/[code]` either way.

**Make it a client component.** Add `"use client"` at the top — you need useState.

**State you'll need:**
```ts
const [name, setName] = useState("");
const [roomCode, setRoomCode] = useState("");
// + state for the avatar picker (grid index or selected ID)
```

**Avatar picker — pick a style:**
- **Grid**: show all avatars at once, click to select. Best for ~6–16 avatars.
- **Carousel**: show one at a time with prev/next arrows. Better visual focus, scales better with many options.

Both work. The grid pattern looks like:
```tsx
<div className="grid grid-cols-4 gap-2">
  {AVATARS.map((a) => (
    <button
      key={a.id}
      onClick={() => setAvatarId(a.id)}
      className={`p-3 text-4xl rounded-lg border-2 ${
        avatarId === a.id ? "border-blue-500" : "border-transparent"
      }`}
    >
      {a.emoji}
    </button>
  ))}
</div>
```

**Two action buttons — Create Room / Join Room:**

Both flows save identity to `sessionStorage` first, then navigate to a room URL.

```ts
import { customAlphabet } from "nanoid";

// Define ONCE, outside the component (otherwise recreated every render):
const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ", 6);
// 6 chars, no ambiguous I/O/0/1

function saveIdentity() {
  sessionStorage.setItem(
    "identity",
    JSON.stringify({ name: name.trim(), avatarId, color }),
  );
}

function handleCreate() {
  saveIdentity();
  router.push(`/room/${makeCode()}?host=true`);
}

function handleJoin() {
  saveIdentity();
  router.push(`/room/${roomCode.toUpperCase().trim()}`);
}
```

Use `useRouter` from `next/navigation`.

**Disabling buttons** — derive from state, no `useEffect` needed:
```tsx
<button disabled={name.trim() === ''} ...>Create Room</button>
<button disabled={name.trim() === '' || roomCode.trim() === ''} ...>Join</button>
```

Add `disabled:opacity-50 disabled:cursor-not-allowed` for visual feedback.

**What's `?host=true`?**
A hint to the room page that *you* created this room. It's used for UX (showing
a "Room not found" error if you tried to join a code that doesn't exist) — NOT
for security. Host permissions are decided server-side. See Phase 1.4 for
details.

**Concepts to learn:**
- `useRouter` — navigation in App Router (import from `next/navigation`, NOT `next/router`)
- `sessionStorage` vs `localStorage` — both store strings, session clears on tab close (right for ephemeral identity)
- Why constants like `makeCode` belong outside the component (referential stability, no re-creation)

**Checkpoint**: Entering a name, picking an avatar, then clicking Create Room takes you to `/room/XXXXXX?host=true`. Pasting a code and clicking Join takes you to `/room/THATCODE`. In dev tools → Application → Session Storage, you should see the `identity` key with `{ name, avatarId, color }`.

**Gotcha**: `sessionStorage` doesn't exist on the server (it's a browser API).
If you try to read it during render, you'll get `ReferenceError`. Either read
it inside `useEffect` or check `typeof window !== "undefined"` first.

**Naming gotcha**: don't name helper functions with capital letters (e.g.
`SaveIdentity`). React treats `PascalCase` functions as components. Use
`camelCase` for helpers and `PascalCase` only for actual components.

### 1.2 — A Shared Identity Hook

You'll need name + avatar in multiple places. Make a hook:

```
lib/useIdentity.ts
```

Pattern:
```ts
"use client";
import { useEffect, useState } from "react";

interface Identity { name: string; avatarId: string; color: string; }

export function useIdentity(): Identity | null {
  const [identity, setIdentity] = useState<Identity | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("identity");
      if (raw) setIdentity(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem("identity");
    }
  }, []);
  return identity;
}
```

**Why the try/catch?** `JSON.parse` *throws* on malformed JSON — it doesn't
return null. If you don't guard it, a bad value in sessionStorage crashes the
hook. The catch block clears the bad data so the hook just returns `null` and
your page can redirect back to landing.

**First-render gotcha**: this hook always returns `null` on the *first* render
(useEffect hasn't run yet), then re-renders with the real value. Any page that
uses it must handle the `null` case — usually a redirect or a loading state:

```tsx
const identity = useIdentity();
if (!identity) return null; // or a spinner, or redirect
```

### 1.3 — Room URL Routing & "Room Not Found" UX

You don't need a backend to "create" a room — PartyKit rooms are **lazy**.
The first time a connection hits `/room/WOLF42`, the server spins up a fresh
instance for that code. No registration call.

This is convenient but creates a UX problem: if someone mistypes a code, they
silently get dropped into an empty room and think they joined successfully.
You need a way to distinguish "I created this" from "I'm joining an existing
one that may or may not exist."

**The pattern: a URL flag.**

- Create flow: `router.push(`/room/${code}?host=true`)`
- Join flow: `router.push(`/room/${code}`)` (no flag)

On the room page, read the flag:
```ts
import { useSearchParams } from "next/navigation";
const searchParams = useSearchParams();
const isCreator = searchParams.get("host") === "true";
```

If `isCreator` is false AND the room state comes back with zero players after
~1 second, show a "Room not found" error and offer a link back to landing.

**Critical security note**: this flag is for UX only — never use it to grant
host permissions. URL params are user-controlled and trivially faked. The
server decides who's host (first connection to a room becomes host, full stop).
A user faking `?host=true` just joins an empty room and becomes host
legitimately anyway because they're first there.

**Code length tradeoff**: 4 chars (~330k combinations) is fine for a friend
group. 6 chars (~191M) is functionally unguessable. Use 6 for safety — the
code is only a couple keystrokes longer to type.

### 1.4 — Room Page Shell (`app/room/[code]/page.tsx`)

Make this a client component. It needs to:
1. Read the `code` from URL params
2. Read identity from sessionStorage (use your `useIdentity` hook)
3. Check the `?host=true` flag for "room not found" detection
4. Connect to PartyKit
5. Render UI based on `phase` (lobby / playing / ended)

**Pattern for the connection:**

Create a custom hook `lib/useRoom.ts`:
```ts
"use client";
import { useEffect, useState } from "react";
import PartySocket from "partysocket";
import type { RoomState, ClientMessage } from "./types";

export function useRoom(roomCode: string, identity: Identity | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [socket, setSocket] = useState<PartySocket | null>(null);

  useEffect(() => {
    if (!identity) return;
    const ps = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
      room: roomCode,
    });

    ps.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "room_state") setState(msg.state);
    });

    ps.addEventListener("open", () => {
      ps.send(JSON.stringify({
        type: "join",
        name: identity.name,
        avatarId: identity.avatarId,
        color: identity.color,
      } satisfies ClientMessage));
    });

    setSocket(ps);
    return () => ps.close();
  }, [roomCode, identity]);

  function send(msg: ClientMessage) {
    socket?.send(JSON.stringify(msg));
  }

  return { state, send };
}
```

**Concepts to learn:**
- `useEffect` cleanup function — returning a function from useEffect runs on unmount; you MUST close sockets here or you'll leak connections on every re-render.
- `satisfies` keyword — like a type assertion but doesn't widen the type. Good for "make sure this matches the shape but keep the literal type."
- Environment variables in Next.js — only vars prefixed `NEXT_PUBLIC_` are exposed to the browser.

**Gotcha**: the dependency array on that useEffect matters. If you put `socket` in there, you'll create an infinite loop. Identity and roomCode are the dependencies.

**Checkpoint**: Opening the room page connects to PartyKit. Check the browser dev tools → Network tab → WS filter. You should see an open WebSocket connection.

### 1.5 — PartyKit Server: Join + Broadcast

Now make the server actually respond. Open `party/index.ts`.

**Implement `onConnect`:**
- Generate a player ID (use `nanoid()` directly, no alphabet)
- Send `{ type: "you_are", playerId }` to that connection so the client knows its own ID
- Send the current room state to that connection

**Implement `onMessage` for the `join` type:**
- Parse the message
- Add a `Player` to `state.players`
- If `state.hostId === null`, this player becomes host
- Broadcast the new state to everyone

**Pattern:**
```ts
onMessage(message: string, sender: Party.Connection) {
  const msg = JSON.parse(message) as ClientMessage;
  switch (msg.type) {
    case "join": {
      const player: Player = {
        id: sender.id,           // PartyKit gives each connection an id
        name: msg.name,
        avatarId: msg.avatarId,
        color: msg.color,
        teamId: null,
      };
      this.state.players.push(player);
      if (!this.state.hostId) this.state.hostId = player.id;
      this.broadcastState();
      break;
    }
  }
}
```

**Implement `onClose`:**
- Remove the player from `state.players`
- If they were the host, promote the first remaining player to host
- Broadcast

**Concepts to learn:**
- `Party.Connection` has a stable `.id` per connection. Use it as the player ID.
- The server's `this.state` lives across all messages in a room — that's PartyKit's whole point.

**Checkpoint**: Open two browser tabs to the same `/room/XYZW`. When the second tab joins, both should see two players in their state. Add a `console.log` of `state.players` to verify.

### 1.6 — Lobby UI

Now render the players in the lobby. Make a `Lobby` component:

```
components/Lobby.tsx
```

It receives `state: RoomState` and `send: (msg: ClientMessage) => void` as props.

**What to render:**
- Room code prominently (so people can share it)
- List of players with avatar + name
- Host badge on the host
- If you're the host: a panel with game mode picker, pack picker, team toggle, Start button
- If you're not the host: read-only view of those settings

**Identifying yourself**: you stored your player ID from the `you_are` message earlier. Pass it down or stash it in a context.

**Tailwind tip**: for the avatar with colored ring:
```tsx
<div
  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
  style={{ boxShadow: `0 0 0 3px ${player.color}` }}
>
  {AVATARS.find((a) => a.id === player.avatarId)?.emoji}
</div>
```

**Checkpoint**: Two tabs see the same lobby. Player list updates in real-time as people join/leave. The host has a star icon (or some visual marker).

### 1.7 — Settings Sync

When the host changes the game mode or pack, send a `settings_update` message.
Server validates the host ID matches and applies. Broadcasts.

**Pattern on the server:**
```ts
case "settings_update": {
  if (sender.id !== this.state.hostId) return;  // ignore non-host
  if (msg.gameMode !== undefined) this.state.gameMode = msg.gameMode;
  if (msg.packId !== undefined) this.state.packId = msg.packId;
  this.broadcastState();
  break;
}
```

**Concept**: server-side authorization. Never trust the client to say "I'm the host." Always check against your own state.

### 1.8 — Loading Packs

Packs are JSON files in `/packs`. You need them on both the client (to render
questions) and the server (to drive game state). The cheapest approach:

- Bundle them with the app via direct import:
  ```ts
  import samplePack from "../../packs/sample-trivia.json";
  ```
- Make a `lib/packs.ts` that exports a map:
  ```ts
  export const PACKS: Pack[] = [samplePack as TriviaPack, ...];
  export const PACKS_BY_ID = Object.fromEntries(PACKS.map(p => [p.id, p]));
  ```

You'll need to enable `resolveJsonModule` in `tsconfig.json` if it isn't already (it usually is by default in Next).

**Concept**: bundling vs fetching. By importing, the JSON gets compiled into
your JS bundle. Fine for small content; if you grow to dozens of huge packs,
switch to fetching from `/public/packs/` over HTTP.

---

**Phase 1 Checkpoint**: Two players can join the same room, see each other, the host can change settings and everyone sees the update, and pressing Start transitions to a (still empty) "playing" phase.

---

## Phase 2 — Standard Trivia Mode

Goal: host controls a question-by-question flow, manually awards points to teams, scoreboard updates live.

### 2.1 — Teams

Before any questions, players need to be on teams.

**Team formation pattern**: free-form. Anyone can create a team with a name; anyone can join an existing team. The host can lock teams once everyone's settled.

**Server messages:**
```ts
case "team_create": {
  this.state.teams.push({
    id: nanoid(),
    name: msg.name,
    score: 0,
    memberIds: [],
  });
  this.broadcastState();
  break;
}
case "team_join": {
  // Remove from any previous team, add to new team
  this.state.teams.forEach((t) => {
    t.memberIds = t.memberIds.filter((id) => id !== sender.id);
  });
  const team = this.state.teams.find((t) => t.id === msg.teamId);
  if (team) team.memberIds.push(sender.id);
  const player = this.state.players.find((p) => p.id === sender.id);
  if (player) player.teamId = msg.teamId;
  this.broadcastState();
  break;
}
```

**Concept**: keeping derived data consistent. A player belongs to a team via
two paths (`player.teamId` and `team.memberIds`). Pick one as the source of
truth or always update both atomically. (For now, just keep both in sync —
it's small enough.)

### 2.2 — Starting the Game

When host clicks Start:
- Server sets `phase: "playing"`
- Server initializes `gameState` based on `gameMode`
- For trivia:
  ```ts
  this.state.gameState = {
    mode: "trivia",
    roundIndex: 0,
    questionIndex: 0,
    questionRevealed: false,
    answerRevealed: false,
  };
  ```
- Broadcast

Client re-renders based on `phase === "playing" && gameMode === "trivia"` → render `<TriviaGame />`.

### 2.3 — Trivia Game Component

```
components/TriviaGame.tsx
```

Reads from `state.gameState` (cast as `TriviaState`) and the pack.

**What it renders:**
- Current round name + question number
- Question text (only if `questionRevealed`)
- Answer text (only if `answerRevealed`, host-only or once revealed to all — your call)
- Scoreboard (each team and their score)
- Host control bar at bottom (only if you're host)

**Pattern for "show only to host":**
```tsx
{state.hostId === myPlayerId && <HostControls send={send} state={state} />}
```

**Host controls**: Reveal Question, Reveal Answer, Award Points (per team), Skip, Next.

**Awarding points pattern (server):**
```ts
case "host_action": {
  if (sender.id !== this.state.hostId) return;
  if (msg.action === "award") {
    const { teamId, points } = msg.payload as { teamId: string; points: number };
    const team = this.state.teams.find((t) => t.id === teamId);
    if (team) team.score += points;
    this.broadcastState();
  }
  // ... other actions
}
```

The host UI shows team buttons; clicking one awards the current round's
`pointValue` to that team. Multiple teams can get the same question right
(host taps each).

### 2.4 — Advancing Questions

`next` action increments `questionIndex`. If past end of round, increment
`roundIndex` and reset `questionIndex`. If past end of pack, set `phase: "ended"`.

**Concept**: state machines. The trivia flow is a small state machine:
```
not-revealed → question-revealed → answer-revealed → next-question
```
Buttons should be enabled only in the right state. Disable "Reveal Answer"
until the question is revealed, etc.

**Phase 2 Checkpoint**: Host runs a full pack from start to end. Two players on different teams. Scores update for everyone in real-time. The host can correctly award, skip, navigate. Refreshing your tab mid-game rejoins you to the same state (you don't lose your seat).

---

## Phase 3 — Jeopardy Mode

This is the hard one. Buzz-in is the centerpiece.

### 3.1 — Initial Game State

When host starts jeopardy:
```ts
this.state.gameState = {
  mode: "jeopardy",
  usedClues: [],
  activeClue: null,
  activeTeamId: this.state.teams[0]?.id ?? null,
  phase: "board",
  lockedOutPlayerIds: [],
};
```

### 3.2 — Board Component

Renders 6 columns × 5 rows. Each cell is a value tile that, when clicked by the active team's host (or just the host, your call), sends a `select_clue` message.

**Pattern:**
```tsx
<div className="grid grid-cols-6 gap-1">
  {pack.board.map((cat, ci) => (
    <Fragment key={ci}>
      <div className="font-bold p-4 bg-blue-900 text-white">{cat.category}</div>
    </Fragment>
  ))}
  {[0, 1, 2, 3, 4].map((row) =>
    pack.board.map((cat, ci) => {
      const clue = cat.clues[row];
      const used = usedClues.includes(`${ci}-${row}`);
      return (
        <button
          key={`${ci}-${row}`}
          disabled={used}
          onClick={() => send({ type: "host_action", action: "select_clue", payload: { ci, row } })}
          className={used ? "bg-zinc-800" : "bg-blue-700"}
        >
          {used ? "" : `$${clue.value}`}
        </button>
      );
    })
  )}
</div>
```

Wait that's two separate grids stacked, not what you want. You'll want **one** grid where the first row is headers and the rest are tiles. Sort that out — it's a CSS exercise. Look up CSS Grid template areas or `grid-template-rows` if you get stuck.

### 3.3 — Buzz-In Mechanic (the centerpiece)

**Client side**:
- When `activeClue !== null && activeClue.buzzedPlayerId === null`, show a big BUZZ button to everyone whose `playerId` isn't in `lockedOutPlayerIds`
- On click: `send({ type: "buzz_in" })` and immediately set a local "buzzing" state so the button visually responds (don't wait for the server round-trip — that's 50ms+ of feeling laggy)

**Server side**:
```ts
case "buzz_in": {
  const gs = this.state.gameState;
  if (gs?.mode !== "jeopardy") return;
  if (!gs.activeClue || gs.activeClue.buzzedPlayerId) return; // already buzzed
  if (gs.lockedOutPlayerIds.includes(sender.id)) return;
  gs.activeClue.buzzedPlayerId = sender.id;
  this.broadcastState();
  break;
}
```

The first message to hit the server wins because JavaScript is single-threaded.
There's no race condition inside the handler. The race is purely network latency,
which for a friend group is acceptable.

**Concept**: server authority + idempotent guards. The `if (gs.activeClue.buzzedPlayerId) return` ensures the second buzz is silently ignored. Always write your handlers as "if state allows, do this; otherwise ignore."

### 3.4 — Judging

After someone buzzes, host sees "Correct" / "Wrong" buttons.

**Correct**: add value to buzzing player's team. Clear active clue, mark used, advance turn.

**Wrong**: subtract value from buzzing player's team. Add them to `lockedOutPlayerIds`. Reset `activeClue.buzzedPlayerId = null` so others can buzz.

If everyone's locked out: host sees "Reveal Answer" → clue marked used → board returns.

### 3.5 — Daily Doubles

When the selected clue has `dailyDouble: true`:
- Server transitions to a "wager" sub-phase
- Active team's captain (or anyone on the team — your call) types a wager
- Server validates: `0 < wager <= max(teamScore, clueValue)`
- After wager submitted, clue is shown. Only the wagering team answers (no buzz-in).

**Concept**: nested state machines. The jeopardy game has a `phase` field; inside that, a daily double introduces sub-states (wager-entry → answering). Model it explicitly so your UI knows what to render at each step.

### 3.6 — Final Jeopardy

End of board → final jeopardy phase:
1. All teams enter a wager (without seeing the clue)
2. Category revealed
3. Clue revealed
4. Each team types their answer in a text input
5. Host reveals one by one, marks each correct/wrong, wagers apply
6. Final scores shown

This is the most complex flow. Build it last. Skip it for v1 if you want — the game still works without it.

**Phase 3 Checkpoint**: A full game of jeopardy plays out. Two teams on two devices. Buzz-in feels responsive. Wrong answers lock out. Daily double works. (Final Jeopardy optional.)

---

## Phase 4 — Polish

Once both modes work end-to-end:

### 4.1 — Animations

Use CSS transitions for simple cases. For score reveals, use [Framer Motion](https://www.framer.com/motion/) (`npm install motion`). It's a great lib to learn.

Quick wins:
- Score number counts up on change (Framer Motion's `animate` does this in 3 lines)
- Buzz-in flash: when `buzzedPlayerId` changes, the winning player's name pulses
- Board tile flip: when a clue is selected, the tile flips to reveal it

### 4.2 — Sound

Add to `public/sounds/`:
- `buzz.mp3` — when someone buzzes in
- `correct.mp3` — host marks correct
- `wrong.mp3` — host marks wrong

Play with:
```ts
const audio = new Audio("/sounds/buzz.mp3");
audio.play();
```

Trigger from `useEffect` that watches the relevant state field.

**Gotcha**: browsers block autoplay until user interacts with the page. After
the first click anywhere, sounds work. Don't try to play sounds in the lobby
before anyone clicks.

### 4.3 — Mobile Layout

Players are on phones, host probably on laptop. Test on a real phone (or
narrow your browser window to 375px wide). Tailwind's responsive prefixes
(`sm:`, `md:`) are your friend.

Specific things to fix:
- Avatar grid is too wide on mobile → make it `grid-cols-4 sm:grid-cols-6`
- Buzz button needs to be HUGE on mobile — full width, 80px+ tall
- Scoreboard on jeopardy needs to be compact and always visible

### 4.4 — Pack Validator

Write a script `scripts/validate-packs.ts` that uses Zod to parse every pack
file and throw if any are malformed. Run it before deploying.

This is great Zod practice. Pattern:

```ts
import { z } from "zod";

const TriviaQuestionSchema = z.object({
  q: z.string(),
  a: z.string(),
  note: z.string().optional(),
});

const TriviaPackSchema = z.object({
  id: z.string(),
  name: z.string(),
  mode: z.literal("trivia"),
  rounds: z.array(z.object({
    name: z.string(),
    pointValue: z.number(),
    questions: z.array(TriviaQuestionSchema),
  })),
});

// Then in your script: TriviaPackSchema.parse(JSON.parse(fileContents))
```

**Concept**: runtime validation vs compile-time types. TypeScript types disappear at runtime — a JSON file could be anything. Zod parses unknown data and gives you typed data back, or throws. Always parse at the boundary (loading files, receiving network messages).

---

## Deployment

When you're ready to ship:

**PartyKit** — deploys to PartyKit's edge network:
```bash
npm run deploy:party
```
First time, it'll prompt you to log in via GitHub. You get a URL like
`https://trivia-app.YOUR-USERNAME.partykit.dev`. Note this URL.

**Next.js on Vercel**:
- Push the code to a GitHub repo
- Import the repo on Vercel
- Add environment variable: `NEXT_PUBLIC_PARTYKIT_HOST=trivia-app.YOUR-USERNAME.partykit.dev`
- Connect your custom domain in Vercel's domain settings

**Gotcha**: when deployed, the partykit host is just the domain (no `wss://`, no port). `partysocket` builds the URL for you.

---

## Resources to Bookmark

- [Next.js docs](https://nextjs.org/docs)
- [React docs (the new ones at react.dev)](https://react.dev)
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/)
- [PartyKit docs](https://docs.partykit.io)
- [Tailwind docs](https://tailwindcss.com/docs)
- [Zod docs](https://zod.dev)
- [Framer Motion docs](https://www.framer.com/motion/)

---

## How to Approach Debugging

You will get stuck. Here's the order to try things:

1. **Console.log everything.** Server-side, client-side. Especially: what messages are you sending? What state does the server have when it breaks? Two-side bugs are 10x easier with both logs in front of you.

2. **Check the Network tab → WS filter** in browser dev tools. You can see every message frame going back and forth. If a message isn't arriving, it never sent.

3. **Read the error message slowly.** TypeScript errors look scary but usually tell you exactly what's wrong. The first line of the error is the answer 80% of the time.

4. **Reproduce in isolation.** If a hook misbehaves, build a minimal page that uses just that hook with hardcoded data. Strip away everything not directly involved.

5. **Ask a focused question.** "It doesn't work" gets nothing. "When player B joins, player A's tab doesn't update — here's the server state, here's the client state, here's the message I sent" gets an answer.

---

## What to Build First (Order of Operations)

1. Phase 1.1 — Landing page (identity + Create/Join buttons, no networking yet)
2. Phase 1.2 — Identity hook
3. Phase 1.3 — Understand URL routing & host-flag UX (mostly conceptual)
4. Phase 1.4 — Room page connects to PartyKit (verify in dev tools, even if UI is empty)
5. Phase 1.5 — Server handles join + broadcast (verify with two tabs)
6. Phase 1.6 — Lobby UI (now you can see the magic)
7. Phase 1.7 — Settings sync (host-only authority)
8. Phase 1.8 — Pack loading
9. Phase 2 — Trivia mode end to end
10. Phase 3 — Jeopardy mode (start with board + selection, then buzz-in, then judging, then DDs)
11. Phase 4 — Polish

Don't skip ahead. Phase 1 is the longest because it sets up all the patterns
you'll reuse. Once Phase 1 is done, Phase 2 takes a fraction of the time.

Good luck. The first time you see another tab's score update in real-time is
going to feel magical.
