"use client";

import PlayerIcon from "@/components/PlayerIcon";
import TriviaHosted from "@/components/TriviaHosted";
import { AVATARS } from "@/lib/avatars";
import { ClientMessage, GameMode, Player, RoomState, Team } from "@/lib/types";
import { useIdentity } from "@/lib/useIdentity";
import { useRoom } from "@/lib/useRoom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const MIN_PLAYERS = 1;

function EndedScreen({ state, isHost, send }: { state: RoomState; isHost: boolean; send: (msg: ClientMessage) => void }) {
  const router = useRouter();

  const sortedTeams = [...state.teams].filter((t) => t.memberIds.length > 0).sort((a, b) => b.score - a.score);
  const sortedPlayers = [...state.players].filter((p) => p.id !== state.hostId).sort((a, b) => b.score - a.score);

  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <span className="text-6xl">🏆</span>
        <h1 className="text-3xl font-black text-text mt-3">Game Over</h1>
      </div>

      <div className="w-full max-w-md flex flex-col gap-2">
        {state.settings.teamsEnabled ? (
          sortedTeams.map((team: Team, i) => {
            const members = state.players.filter((p) => p.teamId === team.id);
            return (
              <div
                key={team.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border ${i === 0 ? "border-accent bg-surface" : "border-border bg-card"}`}
              >
                <span className="text-xl w-8 text-center">{medal(i)}</span>
                <div className="flex-1">
                  <p className="font-bold text-text">{team.name}</p>
                  <div className="flex gap-1 mt-1">
                    {members.map((p) => {
                      const emoji = AVATARS.find((a) => a.id === p.avatarId)?.emoji;
                      return (
                        <div
                          key={p.id}
                          title={p.name}
                          style={{ backgroundColor: p.color }}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                        >
                          {emoji}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <span className="font-mono font-black text-accent text-xl">{team.score}</span>
              </div>
            );
          })
        ) : (
          sortedPlayers.map((player: Player, i) => {
            const emoji = AVATARS.find((a) => a.id === player.avatarId)?.emoji;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-4 rounded-2xl border ${i === 0 ? "border-accent bg-surface" : "border-border bg-card"}`}
              >
                <span className="text-xl w-8 text-center">{medal(i)}</span>
                <div
                  style={{ backgroundColor: player.color }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                >
                  {emoji}
                </div>
                <p className="flex-1 font-bold text-text">{player.name}</p>
                <span className="font-mono font-black text-accent text-xl">{player.score}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex gap-3">
        {isHost && (
          <button
            type="button"
            onClick={() => send({ type: "reset_game" })}
            className="bg-accent hover:bg-accent-dim text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-md"
          >
            Play Again
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-surface hover:bg-border border border-border text-text font-bold px-6 py-2.5 rounded-xl transition-colors"
        >
          Back to Home
        </button>
      </div>

      {!isHost && (
        <p className="text-muted text-sm">Waiting for host to start a new game...</p>
      )}
    </main>
  );
}

function JeopardyJoke() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-5xl">No jeopardy for you</h1>
      <img
        src="https://media.giphy.com/media/Ju7l5y9osyymQ/giphy.gif"
        className="max-w-xl mx-auto"
      />
    </div>
  );
}

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const searchParams = useSearchParams();
  const isCreator = searchParams.get("host") === "true";

  const { identity, checked } = useIdentity();
  const { state, send, kickReason, myPlayerId } = useRoom(
    code,
    identity,
    isCreator,
  );

  useEffect(() => {
    if (!identity && checked) router.push("/");
  }, [identity, checked, router]);

  useEffect(() => {
    if (kickReason) router.push(`/?kicked=${kickReason}`);
  }, [kickReason, router]);

  function handleVote(gameMode: GameMode) {
    send({ type: "vote", gameMode });
  }

  function handleSettingsUpdate(patch: {
    teamsEnabled?: boolean;
    numTeams?: number;
  }) {
    send({ type: "settings_update", ...patch });
  }

  const leadingMode =
    (state?.votes.trivia ?? 0) > (state?.votes.jeopardy ?? 0)
      ? "Trivia"
      : (state?.votes.trivia ?? 0) < (state?.votes.jeopardy ?? 0)
        ? "Jeopardy"
        : "Tie";
  const isHost = myPlayerId === state?.hostId;
  const myTeamId =
    state?.players.find((p) => p.id === myPlayerId)?.teamId ?? null;

  // TODO: Branch on state.phase → lobby / playing / ended

  return (
    <>
      {" "}
      {state?.phase === "lobby" ? (
        <main className="min-h-screen p-6 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-text">
              Trivia <span className="text-accent">Night</span>
            </h1>
            <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-1.5">
              <span className="text-muted text-xs uppercase tracking-widest">
                Room
              </span>
              <span className="font-mono font-bold text-accent tracking-widest">
                {code}
              </span>
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
                      {leadingMode === "Tie" && state?.votes.jeopardy === 0
                        ? "Vote for a game!"
                        : leadingMode === "Tie"
                          ? "The vote is tied! The mode will be randomized"
                          : leadingMode}
                    </p>
                  </div>
                  <button
                    disabled={
                      (leadingMode === "Tie" && state?.votes.jeopardy === 0) ||
                      !isHost ||
                      (state.players.length ?? 0) < MIN_PLAYERS
                    }
                    className="bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl transition-colors shadow-md"
                    onClick={() => send({ type: "start_game" })}
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
                  {state?.players.map((player) => (
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
                  <p className="text-xs text-muted mt-0.5">
                    Vote for what you want to play
                  </p>
                </div>

                {/* Trivia */}
                <button
                  type="button"
                  onClick={() => handleVote("trivia")}
                  className="relative flex flex-col gap-1 bg-surface hover:bg-border border border-border rounded-xl p-4 text-left transition-colors"
                >
                  {(state?.votes.trivia ?? 0) > 0 && (
                    <span className="absolute -top-2 -left-2 bg-accent text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                      {state?.votes.trivia}
                    </span>
                  )}
                  <span className="text-2xl">🎯</span>
                  <span className="font-bold text-text text-sm">Trivia</span>
                  <span className="text-xs text-muted leading-snug">
                    Nothing but fat dubs in round-based trivia{" "}
                  </span>
                </button>

                {/* Jeopardy */}
                <button
                  type="button"
                  onClick={() => handleVote("jeopardy")}
                  className="relative flex flex-col gap-1 bg-surface hover:bg-border border border-border rounded-xl p-4 text-left transition-colors"
                >
                  {(state?.votes.jeopardy ?? 0) > 0 && (
                    <span className="absolute -top-2 -left-2 bg-accent text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                      {state?.votes.jeopardy}
                    </span>
                  )}
                  <span className="text-2xl">📺</span>
                  <span className="font-bold text-text text-sm">Jeopardy</span>
                  <span className="text-xs text-muted leading-snug">
                    No complaining about who buzzed in first
                  </span>
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
                        onClick={() =>
                          handleSettingsUpdate({
                            teamsEnabled: !state?.settings?.teamsEnabled,
                          })
                        }
                        className={`relative w-11 h-6 rounded-full transition-colors ${state?.settings?.teamsEnabled ? "bg-accent" : "bg-border"}`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${state?.settings?.teamsEnabled ? "translate-x-5" : "translate-x-0"}`}
                        />
                      </button>
                    </div>

                    {/* Number of teams */}
                    {state?.settings?.teamsEnabled && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-sm text-text">
                          Number of Teams
                        </span>
                        <div className="flex gap-1">
                          {[2, 3, 4].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                handleSettingsUpdate({ numTeams: n })
                              }
                              className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${state?.settings?.numTeams === n ? "bg-accent text-white" : "bg-surface text-muted hover:bg-border"}`}
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

            {/* Team selection row */}
            {state?.settings?.teamsEnabled && state.teams.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-text">
                    {isHost ? "Team Overview" : "Pick a Team"}
                  </h2>
                  {!isHost && (
                    <span className="text-xs text-muted">Click a team to join</span>
                  )}
                </div>
                <div className="flex gap-3">
                  {state.teams.map((team) => {
                    const members = state.players.filter((p) => p.teamId === team.id);
                    const isMyTeam = myTeamId === team.id;
                    const inner = (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text">{team.name}</span>
                          <span className="text-xs text-muted">
                            {members.length} player{members.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {members.map((p) => (
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
                      </>
                    );
                    return isHost ? (
                      <div
                        key={team.id}
                        className="flex-1 flex flex-col gap-2 p-4 rounded-2xl border border-border bg-card"
                      >
                        {inner}
                      </div>
                    ) : (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => send({ type: "team_join", teamId: team.id })}
                        className={`flex-1 flex flex-col gap-2 p-4 rounded-2xl border text-left transition-colors ${isMyTeam ? "border-accent bg-surface" : "border-border bg-card hover:bg-surface"}`}
                      >
                        {inner}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      ) : state?.phase === "ended" ? (
        <EndedScreen state={state} isHost={isHost} send={send} />
      ) : state?.phase === "playing" && state.gameMode === "trivia" ? (
        <TriviaHosted state={state} myPlayerId={myPlayerId ?? ""} send={send} />
      ) : state?.phase === "playing" && state.gameMode === "jeopardy" ? (
        <JeopardyJoke />
      ) : null}
    </>
  );
}
