'use client'

import PlayerIcon from "@/components/PlayerIcon";
import { GameMode } from "@/lib/types";
import { useIdentity } from "@/lib/useIdentity";
import { useRoom } from "@/lib/useRoom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MIN_PLAYERS = 2

export default function RoomPage() {
  const router = useRouter()
  const params = useParams();
  const code = params.code as string
  const searchParams = useSearchParams();
  const isCreator = searchParams.get("host") === "true";

  const { identity, checked } = useIdentity()
  const { state, send, kickReason, myPlayerId } = useRoom(code, identity, isCreator)

  useEffect(() => {
    if (!identity && checked) router.push('/')
  }, [identity, checked, router])

  useEffect(() => {
    if (kickReason) router.push(`/?kicked=${kickReason}`)
  }, [kickReason, router])

  function handleVote(gameMode: GameMode) {
    send({ type: 'vote', gameMode })
  }

  function handleSettingsUpdate(patch: { teamsEnabled?: boolean; numTeams?: number }) {
    send({ type: 'settings_update', ...patch })
  }
  
  function checkAllJoinedTeam() {
    if (!state) return false
    if (!state.settings.teamsEnabled) return true
    return state.players.every(p => p.teamId !== null)
  }

  const allJoined = checkAllJoinedTeam() 
  const leadingMode = (state?.votes.trivia ?? 0) > (state?.votes.jeopardy ?? 0) ? 'Trivia' : (state?.votes.trivia ?? 0) < (state?.votes.jeopardy ?? 0) ? 'Jeopardy' : 'Tie'
  const isHost = myPlayerId === state?.hostId
  const myTeamId = state?.players.find(p => p.id === myPlayerId)?.teamId ?? null

  // TODO: Branch on state.phase → lobby / playing / ended

  return (
    <main className="min-h-screen p-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-text">
          Trivia <span className="text-accent">Night</span>
        </h1>
        <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5">
          <span className="text-muted text-xs uppercase tracking-widest">Room</span>
          <span className="font-mono font-bold text-accent tracking-widest">{code}</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col gap-4 flex-1">
        <div className="flex gap-4">

          {/* Players panel */}
          <div className="flex flex-col gap-4 flex-1 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between bg-surface p-4 rounded-xl">
              <div>
                <h2 className="font-bold text-text">Selected Game</h2>
                <p className="text-sm text-muted mt-0.5">
                  {(leadingMode === 'Tie') && (state?.votes.jeopardy === 0)
                    ? 'Vote for a game!'
                    : leadingMode === 'Tie'
                    ? 'The vote is tied! The mode will be randomized'
                    : leadingMode}
                </p>
              </div>
              <button
                disabled={((leadingMode === 'Tie') && (state?.votes.jeopardy === 0)) || !isHost || !allJoined || (state.players.length ?? 0) < MIN_PLAYERS}
                className="bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-md"
                    onClick={() => send({type: 'start_game'})}
              >
                Start Game
              </button>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-text">Players</h2>
              <span className="text-xs text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
                {state?.players.length ?? 0} / 16
              </span>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {state?.players.map(player => (
                <PlayerIcon
                  key={player.id}
                  host={state.hostId === player.id}
                  avatarId={player.avatarId}
                  color={player.color}
                  name={player.name}
                />
              ))}
              {!state && (
                <p className="text-muted text-sm">Connecting...</p>
              )}
            </div>
          </div>

          {/* Right panel: voting + host settings */}
          <div className="flex flex-col gap-3 w-56 bg-card border border-border rounded-2xl p-5">
            <div>
              <h2 className="font-bold text-text">Pick a Game</h2>
              <p className="text-xs text-muted mt-0.5">Vote for what you want to play</p>
            </div>

            {/* Trivia */}
            <button
              type="button"
              onClick={() => handleVote('trivia')}
              className="relative flex flex-col gap-1 bg-surface hover:bg-border border border-border rounded-xl p-4 text-left transition-colors"
            >
              {(state?.votes.trivia ?? 0) > 0 && (
                <span className="absolute -top-2 -left-2 bg-accent text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {state?.votes.trivia}
                </span>
              )}
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-text text-sm">Trivia</span>
              <span className="text-xs text-muted leading-snug">Nothing but fat dubs in round-based trivia </span>
            </button>

            {/* Jeopardy */}
            <button
              type="button"
              onClick={() => handleVote('jeopardy')}
              className="relative flex flex-col gap-1 bg-surface hover:bg-border border border-border rounded-xl p-4 text-left transition-colors"
            >
              {(state?.votes.jeopardy ?? 0) > 0 && (
                <span className="absolute -top-2 -left-2 bg-accent text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {state?.votes.jeopardy}
                </span>
              )}
              <span className="text-2xl">📺</span>
              <span className="font-bold text-text text-sm">Jeopardy</span>
              <span className="text-xs text-muted leading-snug">No complaining about who buzzed in first</span>
            </button>

            {/* Host-only settings */}
            {isHost && (
              <div className="flex flex-col gap-3 pt-3 mt-auto border-t border-border">
                <h2 className="font-bold text-text">Settings</h2>

                {/* Teams toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text">Teams</span>
                  <button
                    type="button"
                    onClick={() => handleSettingsUpdate({ teamsEnabled: !state?.settings?.teamsEnabled })}
                    className={`relative w-11 h-6 rounded-full transition-colors ${state?.settings?.teamsEnabled ? 'bg-accent' : 'bg-border'}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${state?.settings?.teamsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Number of teams */}
                {state?.settings?.teamsEnabled && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm text-text">Number of Teams</span>
                    <div className="flex gap-1">
                      {[2, 3, 4].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => handleSettingsUpdate({ numTeams: n })}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${state?.settings?.numTeams === n ? 'bg-accent text-white' : 'bg-surface text-muted hover:bg-border'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Team selection row — visible to all when teams are enabled */}
        {state?.settings?.teamsEnabled && state.teams.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-text">Pick a Team</h2>
              <span className="text-xs text-muted">Click a team to join</span>
            </div>
          <div className="flex gap-3">
            {state.teams.map(team => {
              const members = state.players.filter(p => p.teamId === team.id)
              const isMyTeam = myTeamId === team.id
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => send({ type: 'team_join', teamId: team.id })}
                  className={`flex-1 flex flex-col gap-2 p-4 rounded-2xl border text-left transition-colors ${isMyTeam ? 'border-accent bg-surface' : 'border-border bg-card hover:bg-surface'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text">{team.name}</span>
                    <span className="text-xs text-muted">{members.length} player{members.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(p => (
                      <span key={p.id} className="text-xs bg-card border border-border text-text px-2 py-0.5 rounded-full">
                        {p.name}
                      </span>
                    ))}
                    {members.length === 0 && (
                      <span className="text-xs text-muted">No players yet</span>
                    )}
                  </div>
                  {isMyTeam && (
                    <span className="text-xs font-semibold text-accent">✓ Your team</span>
                  )}
                </button>
              )
            })}
          </div>
          </div>
        )}
      </div>
    </main>
  )
}
