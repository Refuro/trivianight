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
import type { RoomState, ClientMessage, Player, GameMode } from "../lib/types";

const MAX_PLAYERS = 16
const TEAM_NAMES = ['Trivia Troublemakers', 'Those People', 'Dubs Innit', 'Slay Queens', 'This is Smarta', 'Stephen Hawking Dance Team', 'Mighty Morphin Flower Arrangers', 'The Team Next to Us Is Cheating', 'We Hate the Trivia Host', 'Christopher Walken on Sunshine', 'Winnie the Shit', 'To Infinity and Beyonce', 'Dark Side of Uranus', 'Trivia Newton John', 'Tequila Mockingbird']

export default class TriviaParty implements Party.Server {
  // The full authoritative room state. Initialize on first connection.
  state: RoomState;

  constructor(readonly room: Party.Room) {
    this.state = {
      settings: {
        teamsEnabled: false,
        numTeams: 2
      },
      roomCode: room.id,
      hostId: null,
      phase: "lobby",
      gameMode: null,
      packId: null,
      players: [],
      teams: [],
      gameState: null,
      votes: {
        trivia: 0,
        jeopardy: 0
      }
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
        if (this.state.phase !== 'lobby') {
          sender.send(JSON.stringify({ type: 'kicked', reason: 'room_full' }))
          break
        }
        if (!msg.isCreator && this.state.players.length === 0) {
          sender.send(JSON.stringify({ type: 'kicked', reason: "no_room_found" }))
          break
        }
        if (this.state.players.length < MAX_PLAYERS) {
          const player: Player = {
            id: sender.id,
            name: msg.name,
            avatarId: msg.avatarId,
            color: msg.color,
            teamId: null,
            voted: null,
          }
          this.state.players.push(player)
          if (this.state.hostId === null) this.state.hostId = sender.id

          this.broadcastState()
        } else {
          sender.send(JSON.stringify({ type: 'kicked', reason: 'room_full' }))
        }
        break
      }
      case 'vote': {
        if (this.state.phase !== 'lobby') break
        const player = this.state.players.find(a => a.id === sender.id)
        if (!player) {
          sender.send(JSON.stringify({ type: 'error', message: 'Vote could not be cast' }))
          return
        }
        if (player.voted === null) {
          player.voted = msg.gameMode
          this.state.votes[msg.gameMode] += 1
        } else {
          const prevVote: GameMode = player.voted
          if (prevVote === msg.gameMode) return
          this.state.votes[msg.gameMode] += 1
          this.state.votes[prevVote] -= 1
          player.voted = msg.gameMode
        }
        this.broadcastState()
        break
      }
      case 'settings_update': {
        if (sender.id !== this.state.hostId) break
        this.state.settings.teamsEnabled = msg.teamsEnabled ?? this.state.settings.teamsEnabled
        this.state.settings.numTeams = msg.numTeams ?? this.state.settings.numTeams

        if (this.state.settings.teamsEnabled) {
          const shuffledNames = [...TEAM_NAMES]
          for (let i = shuffledNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]]
          }
          this.state.teams = Array.from({ length: this.state.settings.numTeams }, (_, i) => ({
            id: `team-${i}`,
            name: shuffledNames[i],
            score: 0,
            memberIds: []
          }))
        } else {
          this.state.teams = []
        }

        // Clear teamId on any player whose team no longer exists
        const validTeamIds = new Set(this.state.teams.map(t => t.id))
        for (const player of this.state.players) {
          if (player.teamId !== null && !validTeamIds.has(player.teamId)) {
            player.teamId = null
          }
        }

        this.broadcastState()
        break
      }
      case 'team_join': {
        if (this.state.phase !== 'lobby') break
        const player = this.state.players.find(a => a.id === sender.id)
        if (!player) break
        const newTeam = this.state.teams.find(a => a.id === msg.teamId)
        if (!newTeam) break
        if (player.teamId === null) {
          player.teamId = msg.teamId
          newTeam.memberIds.push(player.id)
        } else {
          const oldTeam = this.state.teams.find(a => a.id === player.teamId)
          if (oldTeam) oldTeam.memberIds = oldTeam.memberIds.filter(id => id !== player.id)
          player.teamId = msg.teamId
          newTeam.memberIds.push(player.id)
        }
        this.broadcastState()
        break
      }
      case 'start_game': {
        if (sender.id !== this.state.hostId) break
        if (this.state.phase !== 'lobby') break
        const leadingMode = this.state.votes.jeopardy > this.state.votes.trivia ? 'jeopardy' : this.state.votes.trivia > this.state.votes.jeopardy ? 'trivia' : 'tie'
        if (leadingMode === 'tie') {
          //its just going to default to trivia right now cause I'm not gonna be getting jeopardy done for a while prob
          this.state.gameMode = 'trivia'
        } else {
          this.state.gameMode = leadingMode
        }
        this.state.phase = 'playing'
        if (this.state.gameMode === 'jeopardy') {
          this.state.gameState = {
            mode: 'jeopardy',
            usedClues: [],
            activeClue: null,
            activeTeamId: null,
            phase: 'board',
            lockedOutPlayerIds: []
          }
        } else {
          this.state.gameState = {
            mode: 'trivia',
            roundIndex: 0,
            questionIndex: 0,
            questionRevealed: false,
            answerRevealed: false,
          }
        }
        this.broadcastState()
        break
      }
    }

    // Later you'll add cases for: buzz_in, host_action.
  }

  onClose(conn: Party.Connection) {
    const leaving = this.state.players.find(p => p.id === conn.id)
    if (leaving?.voted) {
      this.state.votes[leaving.voted] -= 1
    }

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
