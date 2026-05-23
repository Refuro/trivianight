// PartyKit server stub. This file becomes the live game server — one instance
// per room (PartyKit calls these "parties"). All real-time logic lives here.
//
// See IMPLEMENTATION_GUIDE.md → Phase 1.5 and onward.
//
// Key concepts to understand before extending this:
//   - Each Party = one room = one in-memory instance on PartyKit's edge
//   - `onConnect` fires when a client opens a WebSocket to this room
//   - `onMessage` fires when a client sends a message
//   - You broadcast to everyone via `this.room.broadcast(...)`
//   - State lives on `this` — it's lost when the room idles out, which is fine
//     for ephemeral games (no DB needed).

import type * as Party from "partykit/server";
import type { RoomState, ClientMessage, Player } from "../lib/types";

const MAX_PLAYERS = 16

export default class TriviaParty implements Party.Server {
  // The full authoritative room state. Initialize on first connection.
  state: RoomState;

  constructor(readonly room: Party.Room) {
    this.state = {
      roomCode: room.id,
      hostId: null,
      phase: "lobby",
      gameMode: null,
      packId: null,
      players: [],
      teams: [],
      gameState: null,
    };
  }

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: 'room_state', state: this.state }))
    conn.send(JSON.stringify({ type: 'you_are', playerId: conn.id }))
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as ClientMessage

    switch (msg.type) {
      case 'join': {
        if (!msg.isCreator && this.state.players.length === 0) {
          sender.send(JSON.stringify({ type: 'kicked', reason: "no_room_found"}))
          break
        }
        if (this.state.players.length < MAX_PLAYERS) {
          const player: Player = {
            id: sender.id,
            name: msg.name,
            avatarId: msg.avatarId,
            color: msg.color,
            teamId: null
          }
          this.state.players.push(player)
          if (this.state.hostId === null) this.state.hostId = sender.id

          this.broadcastState()
        } else {
          sender.send(JSON.stringify({ type: 'kicked', reason: 'room_full' }))
        }
        break
      }
    }

    // Later you'll add cases for: settings_update, team_join, team_create,
    // start_game, buzz_in, host_action.
  }

  onClose(conn: Party.Connection) {
    this.state.players = this.state.players.filter(p => p.id !== conn.id)
    this.state.teams = this.state.teams.map(team => ({ ...team, memberIds: team.memberIds.filter(id => id !== conn.id) }))

    if (conn.id === this.state.hostId && this.state.players.length >= 1) {
      this.state.hostId = this.state.players[0].id
    }

    if (this.state.players.length === 0) {
      this.state.hostId = null
    }

    this.broadcastState()
  }

  // Helper you'll call after every state mutation.
  broadcastState() {
    this.room.broadcast(
      JSON.stringify({ type: "room_state", state: this.state }),
    );
  }
}

// Optional: type-check that we satisfy Party.Worker
TriviaParty satisfies Party.Worker;
