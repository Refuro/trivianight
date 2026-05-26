import type * as Party from "partykit/server";
import type { RoomState, ClientMessage, Player, GameMode, TriviaState } from "../lib/types";

const MAX_PLAYERS = 16
const TEAM_NAMES = ['Joes Hoes', 'Trivia Troublemakers', 'Those People', 'Dubs Innit', 'Slay Queens', 'This is Smarta', 'Stephen Hawking Dance Team', 'Mighty Morphin Flower Arrangers', 'The Team Next to Us Is Cheating', 'We Hate the Trivia Host', 'Christopher Walken on Sunshine', 'Winnie the Shit', 'To Infinity and Beyonce', 'Dark Side of Uranus', 'Trivia Newton John', 'Tequila Mockingbird']

export default class TriviaParty implements Party.Server {
  state: RoomState;
  // Per-connection ID → stable clientId. Lives in-memory on the party instance.
  connToClient: Map<string, string> = new Map();

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

  // Resolve a connection to its stable clientId (set during join)
  clientIdOf(conn: Party.Connection): string | null {
    return this.connToClient.get(conn.id) ?? null
  }

  onConnect(conn: Party.Connection) {
    // Send current state immediately; client will identify itself via the join message
    conn.send(JSON.stringify({ type: 'room_state', state: this.state }))
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as ClientMessage

    switch (msg.type) {
      case 'join': {
        const clientId = msg.clientId
        this.connToClient.set(sender.id, clientId)

        // Reconnect path: clientId already in state — restore online status only,
        // ignore any name/avatar changes so players can't rejoin as someone else
        const existing = this.state.players.find(p => p.id === clientId)
        if (existing) {
          existing.online = true
          existing.lastSeen = Date.now()
          this.broadcastState()
          break
        }

        // New player — only allowed during lobby
        if (this.state.phase !== 'lobby') {
          sender.send(JSON.stringify({ type: 'kicked', reason: 'game_in_progress' }))
          break
        }
        if (!msg.isCreator && this.state.players.length === 0) {
          sender.send(JSON.stringify({ type: 'kicked', reason: "no_room_found" }))
          break
        }
        if (this.state.players.length < MAX_PLAYERS) {
          const player: Player = {
            id: clientId,
            name: msg.name,
            avatarId: msg.avatarId,
            color: msg.color,
            teamId: null,
            voted: null,
            score: 0,
            online: true,
            lastSeen: Date.now(),
          }
          this.state.players.push(player)
          if (this.state.hostId === null) this.state.hostId = clientId
          this.broadcastState()
        } else {
          sender.send(JSON.stringify({ type: 'kicked', reason: 'room_full' }))
        }
        break
      }
      case 'vote': {
        if (this.state.phase !== 'lobby') break
        const clientId = this.clientIdOf(sender)
        if (!clientId) break
        const player = this.state.players.find(p => p.id === clientId)
        if (!player) {
          sender.send(JSON.stringify({ type: 'error', message: 'Vote could not be cast' }))
          break
        }
        if (player.voted === null) {
          player.voted = msg.gameMode
          this.state.votes[msg.gameMode] += 1
        } else {
          const prevVote: GameMode = player.voted
          if (prevVote === msg.gameMode) break
          this.state.votes[msg.gameMode] += 1
          this.state.votes[prevVote] -= 1
          player.voted = msg.gameMode
        }
        this.broadcastState()
        break
      }
      case 'settings_update': {
        const clientId = this.clientIdOf(sender)
        if (clientId !== this.state.hostId) break
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
        const clientId = this.clientIdOf(sender)
        if (!clientId) break
        if (clientId === this.state.hostId) break
        const player = this.state.players.find(p => p.id === clientId)
        if (!player) break
        const newTeam = this.state.teams.find(t => t.id === msg.teamId)
        if (!newTeam) break
        if (player.teamId === null) {
          player.teamId = msg.teamId
          newTeam.memberIds.push(player.id)
        } else {
          const oldTeam = this.state.teams.find(t => t.id === player.teamId)
          if (oldTeam) oldTeam.memberIds = oldTeam.memberIds.filter(id => id !== player.id)
          player.teamId = msg.teamId
          newTeam.memberIds.push(player.id)
        }
        this.broadcastState()
        break
      }
      case 'claim_host': {
        const clientId = this.clientIdOf(sender)
        if (!clientId) break
        const claimant = this.state.players.find(p => p.id === clientId)
        if (!claimant) break
        const currentHost = this.state.players.find(p => p.id === this.state.hostId)
        // Only allow claim if current host is missing or offline
        if (currentHost && currentHost.online) break
        this.state.hostId = clientId
        this.broadcastState()
        break
      }
      case 'start_game': {
        const clientId = this.clientIdOf(sender)
        if (clientId !== this.state.hostId) break
        if (this.state.phase !== 'lobby') break
        const leadingMode = this.state.votes.jeopardy > this.state.votes.trivia ? 'jeopardy' : this.state.votes.trivia > this.state.votes.jeopardy ? 'trivia' : 'tie'
        this.state.gameMode = leadingMode === 'tie' ? 'trivia' : leadingMode
        // Auto-assign unassigned players (excluding host) to teams evenly
        if (this.state.settings.teamsEnabled && this.state.teams.length > 0) {
          const unassigned = this.state.players.filter(p => p.teamId === null && p.id !== this.state.hostId)
          unassigned.forEach((player, i) => {
            const team = this.state.teams[i % this.state.teams.length]
            player.teamId = team.id
            team.memberIds.push(player.id)
          })
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
            triviaPhase: 'idle',
            roundIndex: 0,
            questionIndex: -1,
            activeQuestion: null,
            answers: [],
            teamDrafts: [],
          }
        }
        this.broadcastState()
        break
      }
      case 'submit_answer': {
        if (this.state.phase !== 'playing') break
        const gs = this.state.gameState as TriviaState | null
        if (!gs || gs.mode !== 'trivia') break
        if (gs.triviaPhase !== 'question_open') break
        const clientId = this.clientIdOf(sender)
        if (!clientId) break
        const player = this.state.players.find(p => p.id === clientId)
        if (!player) break
        const groupId = this.state.settings.teamsEnabled ? player.teamId : player.id
        if (!groupId) break
        const existing = gs.answers.find(a => a.groupId === groupId)
        if (existing) {
          // If this answer was previously accepted, deduct those points before resetting
          if (existing.judgment === 'accepted' && gs.activeQuestion) {
            const pts = gs.activeQuestion.points
            const team = this.state.teams.find(t => t.id === groupId)
            if (team) {
              team.score -= pts
            } else {
              const p = this.state.players.find(pl => pl.id === groupId)
              if (p) p.score -= pts
            }
          }
          existing.text = msg.text
          existing.submittedBy = clientId
          existing.judgment = null
        } else {
          gs.answers.push({ groupId, text: msg.text, submittedBy: clientId, judgment: null })
        }
        this.broadcastState()
        break
      }
      case 'update_draft': {
        if (this.state.phase !== 'playing') break
        const gs = this.state.gameState as TriviaState | null
        if (!gs || gs.mode !== 'trivia') break
        if (gs.triviaPhase !== 'question_open') break
        const clientId = this.clientIdOf(sender)
        if (!clientId) break
        const player = this.state.players.find(p => p.id === clientId)
        if (!player || !player.teamId) break
        const existing = gs.teamDrafts.find(d => d.teamId === player.teamId)
        if (existing) {
          existing.text = msg.text
          existing.lockedPlayerIds = []
        } else {
          gs.teamDrafts.push({ teamId: player.teamId, text: msg.text, lockedPlayerIds: [] })
        }
        this.broadcastState()
        break
      }
      case 'lock_in': {
        if (this.state.phase !== 'playing') break
        const gs = this.state.gameState as TriviaState | null
        if (!gs || gs.mode !== 'trivia') break
        if (gs.triviaPhase !== 'question_open') break
        const clientId = this.clientIdOf(sender)
        if (!clientId) break
        const player = this.state.players.find(p => p.id === clientId)
        if (!player || !player.teamId) break
        const draft = gs.teamDrafts.find(d => d.teamId === player.teamId)
        if (!draft || !draft.text.trim()) break
        if (!draft.lockedPlayerIds.includes(clientId)) {
          draft.lockedPlayerIds.push(clientId)
        }
        const team = this.state.teams.find(t => t.id === player.teamId)
        const teamMemberCount = team?.memberIds.length ?? 1
        if (draft.lockedPlayerIds.length >= teamMemberCount) {
          const existingAnswer = gs.answers.find(a => a.groupId === player.teamId)
          if (existingAnswer) {
            existingAnswer.text = draft.text
            existingAnswer.submittedBy = clientId
            existingAnswer.judgment = null
          } else {
            gs.answers.push({ groupId: player.teamId, text: draft.text, submittedBy: clientId, judgment: null })
          }
          gs.teamDrafts = gs.teamDrafts.filter(d => d.teamId !== player.teamId)
        }
        this.broadcastState()
        break
      }
      case 'host_action': {
        const clientId = this.clientIdOf(sender)
        if (clientId !== this.state.hostId) break
        if (this.state.phase !== 'playing') break
        const gs = this.state.gameState as TriviaState | null
        if (!gs || gs.mode !== 'trivia') break

        switch (msg.action) {
          case 'reveal_question': {
            gs.activeQuestion = msg.question
            gs.triviaPhase = 'question_open'
            gs.answers = []
            gs.teamDrafts = []
            gs.questionIndex += 1
            break
          }
          case 'close_answers': {
            gs.triviaPhase = 'answers_closed'
            break
          }
          case 'reveal_answer': {
            gs.triviaPhase = 'answer_revealed'
            break
          }
          case 'award_points': {
            const team = this.state.teams.find(t => t.id === msg.groupId)
            if (team) {
              team.score += msg.points
            } else {
              const player = this.state.players.find(p => p.id === msg.groupId)
              if (player) player.score += msg.points
            }
            break
          }
          case 'judge_answer': {
            const answer = gs.answers.find(a => a.groupId === msg.groupId)
            if (!answer) break
            const points = gs.activeQuestion?.points ?? 1
            const adjustScore = (delta: number) => {
              const team = this.state.teams.find(t => t.id === msg.groupId)
              if (team) {
                team.score += delta
              } else {
                const player = this.state.players.find(p => p.id === msg.groupId)
                if (player) player.score += delta
              }
            }
            if (msg.verdict === 'accept') {
              if (answer.judgment !== 'accepted') adjustScore(points)
              answer.judgment = 'accepted'
            } else {
              if (answer.judgment === 'accepted') adjustScore(-points)
              answer.judgment = 'rejected'
            }
            break
          }
          case 'next_question': {
            gs.activeQuestion = null
            gs.triviaPhase = 'idle'
            gs.answers = []
            gs.teamDrafts = []
            break
          }
          case 'submit_draft': {
            const team = this.state.teams.find(t => t.id === msg.teamId)
            if (!team) break
            const draft = gs.teamDrafts.find(d => d.teamId === msg.teamId)
            if (!draft || !draft.text.trim()) break
            const existing = gs.answers.find(a => a.groupId === msg.teamId)
            if (existing) {
              existing.text = draft.text
              existing.submittedBy = null
              existing.judgment = null
            } else {
              gs.answers.push({ groupId: msg.teamId, text: draft.text, submittedBy: null, judgment: null })
            }
            gs.teamDrafts = gs.teamDrafts.filter(d => d.teamId !== msg.teamId)
            break
          }
          case 'trigger_effect': {
            break
          }
          case 'end_game': {
            this.state.phase = 'ended'
            break
          }
        }

        this.broadcastState()
        break
      }
      case 'reset_game': {
        const clientId = this.clientIdOf(sender)
        if (clientId !== this.state.hostId) break
        this.state.phase = 'lobby'
        this.state.gameMode = null
        this.state.gameState = null
        this.state.votes = { trivia: 0, jeopardy: 0 }
        for (const player of this.state.players) {
          player.voted = null
          player.score = 0
        }
        for (const team of this.state.teams) {
          team.score = 0
        }
        this.broadcastState()
        break
      }
    }
  }

  onClose(conn: Party.Connection) {
    const clientId = this.connToClient.get(conn.id)
    this.connToClient.delete(conn.id)
    if (!clientId) {
      this.broadcastState()
      return
    }

    // If this client has another live connection (e.g. duplicate tab), don't mark offline yet
    const stillConnected = Array.from(this.connToClient.values()).includes(clientId)

    const player = this.state.players.find(p => p.id === clientId)
    if (!player) {
      this.broadcastState()
      return
    }

    if (this.state.phase === 'playing' || this.state.phase === 'ended') {
      // Soft offline — keep player slot intact so they can rejoin
      if (!stillConnected) {
        player.online = false
        player.lastSeen = Date.now()
      }
      // Don't auto-transfer host during play — host reclaims on reconnect,
      // or another player can claim via the 'claim_host' message
    } else {
      // Lobby — full removal on disconnect
      if (stillConnected) {
        // Other tab still here, do nothing
        this.broadcastState()
        return
      }
      if (player.voted) {
        this.state.votes[player.voted] -= 1
      }
      this.state.players = this.state.players.filter(p => p.id !== clientId)
      this.state.teams = this.state.teams.map(team => ({
        ...team,
        memberIds: team.memberIds.filter(id => id !== clientId),
      }))
      if (clientId === this.state.hostId && this.state.players.length >= 1) {
        this.state.hostId = this.state.players[0].id
      }
      if (this.state.players.length === 0) {
        this.state.hostId = null
      }
    }

    // Clean up draft lock-ins for the leaving player; auto-submit if team threshold now met
    // (only relevant during playing; harmless otherwise)
    if (this.state.phase === 'playing' && !stillConnected) {
      const gs = this.state.gameState as TriviaState | null
      if (gs?.mode === 'trivia') {
        const teamsToAutoSubmit: string[] = []
        for (const draft of gs.teamDrafts) {
          if (!draft.lockedPlayerIds.includes(clientId)) continue
          draft.lockedPlayerIds = draft.lockedPlayerIds.filter(id => id !== clientId)
          const team = this.state.teams.find(t => t.id === draft.teamId)
          // Count only online members for threshold; otherwise an offline holdout never submits
          const onlineMemberCount = team
            ? team.memberIds.filter(id => this.state.players.find(p => p.id === id)?.online).length
            : 0
          if (onlineMemberCount > 0 && draft.lockedPlayerIds.length >= onlineMemberCount) {
            teamsToAutoSubmit.push(draft.teamId)
          }
        }
        for (const teamId of teamsToAutoSubmit) {
          const draft = gs.teamDrafts.find(d => d.teamId === teamId)
          if (!draft) continue
          const existing = gs.answers.find(a => a.groupId === teamId)
          if (existing) {
            existing.text = draft.text
            existing.submittedBy = null
            existing.judgment = null
          } else {
            gs.answers.push({ groupId: teamId, text: draft.text, submittedBy: null, judgment: null })
          }
        }
        gs.teamDrafts = gs.teamDrafts.filter(d => !teamsToAutoSubmit.includes(d.teamId))
      }
    }

    this.broadcastState()
  }

  broadcastState() {
    this.room.broadcast(
      JSON.stringify({ type: "room_state", state: this.state }),
    );
  }
}

TriviaParty satisfies Party.Worker;
