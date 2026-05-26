"use client";

import { ClientMessage, RoomState, TriviaState, AnswerEntry } from "@/lib/types";
import { AVATARS } from "@/lib/avatars";
import { CATEGORIES, Category } from "@/lib/questions";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Shuffle } from "lucide-react";
import { useSound } from "@/lib/useSound";
import { TRIVIA_SOUNDS } from "@/lib/sounds/trivia";
import { MuteButton } from "@/components/MuteButton";

export default function TriviaHosted({
  state,
  myPlayerId,
  send,
}: {
  send: (msg: ClientMessage) => void;
  state: RoomState;
  myPlayerId: string;
}) {
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [draftInput, setDraftInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pointsInput, setPointsInput] = useState(1);
  const [randomSpin, setRandomSpin] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Derived state — needed early so the sound effects below can depend on them
  const isHost = state.hostId === myPlayerId;
  const gs = state.gameState as TriviaState | null;

  const eligibleGroups = state.settings.teamsEnabled
    ? state.teams.filter((t) =>
        t.memberIds.some((id) => state.players.find((p) => p.id === id)?.online)
      )
    : state.players.filter((p) => p.id !== state.hostId && p.online);
  const answeredCount = eligibleGroups.filter((entity) =>
    gs?.answers.some((a) => a.groupId === entity.id),
  ).length;
  const allAnswered = eligibleGroups.length > 0 && answeredCount >= eligibleGroups.length;

  const { play, muted, setMuted } = useSound(TRIVIA_SOUNDS);

  // Clear answer inputs when a new question is revealed
  useEffect(() => {
    setAnswerInput("");
    setDraftInput("");
  }, [gs?.questionIndex]);

  // Fire a sound when the trivia phase changes (skip on initial mount)
  const prevPhaseRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const phase = gs?.triviaPhase ?? null;
    if (prevPhaseRef.current === undefined) {
      prevPhaseRef.current = phase;
      return;
    }
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;
    if (phase === "question_open") play("question_open");
    else if (phase === "answers_closed") play("answers_closed");
    else if (phase === "answer_revealed") play("answer_revealed");
  }, [gs?.triviaPhase, play]);

  // Fire a sound when an answer gets accepted or rejected
  const prevAnswersRef = useRef<AnswerEntry[]>([]);
  useEffect(() => {
    const answers = gs?.answers ?? [];
    for (const answer of answers) {
      const prev = prevAnswersRef.current.find((a) => a.groupId === answer.groupId);
      if (answer.judgment === "accepted" && prev?.judgment !== "accepted") {
        play("answer_accepted");
      } else if (answer.judgment === "rejected" && prev?.judgment !== "rejected") {
        play("answer_rejected");
      }
    }
    prevAnswersRef.current = answers;
  }, [gs?.answers, play]);

  function copyCode() {
    navigator.clipboard.writeText(state.roomCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryRef.current &&
        !categoryRef.current.contains(e.target as Node)
      ) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleRandomQuestion() {
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const q = cat.questions[Math.floor(Math.random() * cat.questions.length)];
    setQuestionText(q.q);
    setAnswerText(q.a);
    setSelectedCategory(cat);
    setRandomSpin(true);
    setTimeout(() => setRandomSpin(false), 600);
  }

  // Player (non-host) view
  if (!isHost) {
    const myPlayer = state.players.find((p) => p.id === myPlayerId);
    const myTeamId = myPlayer?.teamId ?? null;
    const myTeam = state.settings.teamsEnabled
      ? state.teams.find((t) => t.id === myTeamId)
      : null;
    const myDraft = gs?.teamDrafts.find((d) => d.teamId === myTeamId);
    const myTeamSubmitted = gs?.answers.find((a) => a.groupId === myTeamId);
    const teamMembers = myTeamId
      ? state.players.filter((p) => p.teamId === myTeamId)
      : [];
    const alreadyLocked =
      myDraft?.lockedPlayerIds.includes(myPlayerId) ?? false;
    const hostPlayer = state.players.find((p) => p.id === state.hostId);
    const hostOffline = !!hostPlayer && !hostPlayer.online;

    return (
      <main className="min-h-screen flex flex-col p-6 gap-4">
        <div className="flex justify-end -mb-2">
          <MuteButton muted={muted} onToggle={() => setMuted(!muted)} />
        </div>
        {hostOffline && (
          <div className="flex items-center justify-between gap-3 bg-yellow-400/10 border border-yellow-400/40 text-yellow-300 text-sm px-4 py-2.5 rounded-xl">
            <span>The host is offline.</span>
            <button
              type="button"
              onClick={() => send({ type: "claim_host" })}
              className="bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/60 text-yellow-200 font-semibold text-xs px-3 py-1 rounded-full transition-colors"
            >
              Claim Host
            </button>
          </div>
        )}
        {/* Main content - centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 w-full max-w-lg">
            {!gs || gs.triviaPhase === "idle" ? (
              <>
                <span className="text-6xl animate-bounce select-none">🎯</span>
                <h2 className="text-xl font-bold text-text">Get Ready!</h2>
                <p className="text-muted text-sm">
                  The question will be revealed when the host stops
                  procrastinating
                </p>
              </>
            ) : (
              <>
                {gs.activeQuestion?.imageUrl && (
                  <img
                    src={gs.activeQuestion.imageUrl}
                    alt="Question"
                    className="rounded-xl max-h-56 w-auto mx-auto object-contain"
                  />
                )}
                <div
                  key={gs.questionIndex}
                  className="relative bg-card border border-border rounded-2xl p-6 w-full text-center animate-slide-up"
                >
                  {gs.activeQuestion && (
                    <span className="absolute -top-3 right-4 bg-accent text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow">
                      {gs.activeQuestion.points}{" "}
                      {gs.activeQuestion.points === 1 ? "pt" : "pts"}
                    </span>
                  )}
                  <p className="text-xl font-bold text-text">
                    {gs.activeQuestion?.text ?? "Waiting for question..."}
                  </p>
                </div>

                {gs.triviaPhase === "question_open" &&
                  (state.settings.teamsEnabled ? (
                    myTeamSubmitted ? (
                      <div className="bg-green-500/10 border border-green-500 rounded-xl px-5 py-4 text-center w-full">
                        <p className="text-xs text-muted uppercase tracking-widest mb-1">
                          You confidently have submitted your answer
                        </p>
                        <p className="text-lg font-black text-text">
                          {myTeamSubmitted.text}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          You will now be judged. No pressure
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 w-full">
                        {/* Shared team draft */}
                        <div className="bg-surface border border-border rounded-xl px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted uppercase tracking-widest font-semibold">
                              Team Draft
                            </p>
                            {myDraft && (
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {teamMembers.map((p) => {
                                    const locked =
                                      myDraft.lockedPlayerIds.includes(p.id);
                                    const emoji = AVATARS.find(
                                      (a) => a.id === p.avatarId,
                                    )?.emoji;
                                    return (
                                      <div
                                        key={`${p.id}-${locked}`}
                                        title={
                                          locked
                                            ? `${p.name} locked in`
                                            : p.name
                                        }
                                        style={{ backgroundColor: p.color }}
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 ${
                                          locked
                                            ? "border-green-400 animate-lock-bounce"
                                            : "border-transparent opacity-40"
                                        }`}
                                      >
                                        {emoji}
                                      </div>
                                    );
                                  })}
                                </div>
                                <span className="text-xs text-muted">
                                  {myDraft.lockedPlayerIds.length}/
                                  {teamMembers.length} locked
                                </span>
                              </div>
                            )}
                          </div>
                          <p
                            className={`font-bold ${myDraft?.text ? "text-text" : "text-muted italic text-sm"}`}
                          >
                            {myDraft?.text || "No answer drafted yet..."}
                          </p>
                        </div>

                        {/* Suggest / update draft */}
                        <div className="flex gap-2">
                          <input
                            className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                            placeholder="Type an answer..."
                            value={draftInput}
                            onChange={(e) => setDraftInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && draftInput.trim()) {
                                send({
                                  type: "update_draft",
                                  text: draftInput.trim(),
                                });
                                setDraftInput("");
                              }
                            }}
                          />
                          <button
                            type="button"
                            disabled={!draftInput.trim()}
                            onClick={() => {
                              send({
                                type: "update_draft",
                                text: draftInput.trim(),
                              });
                              setDraftInput("");
                            }}
                            className="bg-surface hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed border border-border text-text font-bold px-4 py-3 rounded-xl transition-colors"
                          >
                            Set Draft
                          </button>
                        </div>

                        {/* Lock In */}
                        <button
                          type="button"
                          disabled={!myDraft?.text.trim() || alreadyLocked}
                          onClick={() => send({ type: "lock_in" })}
                          className={`w-full font-bold py-3 rounded-xl transition-colors shadow-md ${
                            alreadyLocked
                              ? "bg-green-500 text-white cursor-default"
                              : myDraft?.text.trim()
                                ? "bg-accent hover:bg-accent-dim text-white animate-pulse"
                                : "bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white"
                          }`}
                        >
                          {alreadyLocked ? "✓ Locked In!" : "Lock In Answer"}
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex gap-2 w-full">
                      <input
                        className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                        placeholder="Your answer..."
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && answerInput.trim()) {
                            send({
                              type: "submit_answer",
                              text: answerInput.trim(),
                            });
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={!answerInput.trim()}
                        onClick={() =>
                          send({
                            type: "submit_answer",
                            text: answerInput.trim(),
                          })
                        }
                        className="bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition-colors shadow-md"
                      >
                        Submit
                      </button>
                    </div>
                  ))}

                {gs.triviaPhase === "answers_closed" && (
                  <div className="bg-surface border border-border rounded-xl px-5 py-3 text-muted text-sm">
                    Bases are loaded, answers are locked, will you be right?
                  </div>
                )}

                {gs.triviaPhase === "answer_revealed" && gs.activeQuestion && (
                  <div className="bg-card border border-accent rounded-2xl p-5 w-full text-center animate-pop-in">
                    <p className="text-xs text-muted uppercase tracking-widest mb-1">
                      Answer
                    </p>
                    <p className="text-2xl font-black text-accent">
                      {gs.activeQuestion.answer}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom scoreboard — pub leaderboard vibe */}
        <div className="flex gap-3 flex-wrap items-end">
          {state.settings.teamsEnabled
            ? state.teams
                .filter((t) => t.memberIds.length > 0)
                .map((team) => {
                  const members = state.players.filter(
                    (p) => p.teamId === team.id,
                  );
                  const isMyTeam = myTeam?.id === team.id;
                  const answer = gs?.answers.find((a) => a.groupId === team.id);
                  const hasAnswered = !!answer;
                  const judgment = answer?.judgment ?? null;
                  const hasDraft = !!gs?.teamDrafts.find(
                    (d) => d.teamId === team.id,
                  )?.text;
                  const borderClass =
                    judgment === "rejected"
                      ? "border-red-500"
                      : judgment === "accepted" || hasAnswered
                        ? "border-green-500"
                        : hasDraft
                          ? "border-yellow-400"
                          : isMyTeam
                            ? "border-accent"
                            : "border-border";
                  return (
                    <div
                      key={team.id}
                      className="flex-1 min-w-[180px] flex flex-col gap-4"
                    >
                      {/* Notepad answer (revealed phase only) */}
                      {gs?.triviaPhase === "answer_revealed" && answer && (
                        <div
                          className="relative bg-yellow-50 px-4 py-3 rounded-sm shadow-md border-l-4 border-yellow-300"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(transparent, transparent 18px, #e5d9a5 18px, #e5d9a5 19px)",
                          }}
                        >
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-accent/40 rounded-sm" />
                          <p className="text-gray-800 font-medium text-sm font-mono">
                            {answer.text}
                          </p>
                        </div>
                      )}

                      {/* Team card */}
                      <div
                        className={`flex flex-col gap-1.5 p-3 rounded-xl border-2 bg-surface shadow-sm transition-colors ${borderClass}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-black text-text text-sm truncate uppercase tracking-wide">
                            {team.name}
                          </p>
                          <span className="font-mono font-black text-accent text-lg flex-shrink-0">
                            {team.score}
                          </span>
                        </div>
                        <div className="flex">
                          {members.map((p, i) => {
                            const emoji = AVATARS.find(
                              (a) => a.id === p.avatarId,
                            )?.emoji;
                            return (
                              <div
                                key={p.id}
                                title={p.online ? p.name : `${p.name} (offline)`}
                                style={{
                                  backgroundColor: p.color,
                                  marginLeft: i === 0 ? 0 : -8,
                                }}
                                className={`w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-sm transition-opacity ${p.online ? "" : "opacity-40 grayscale"}`}
                              >
                                {emoji}
                              </div>
                            );
                          })}
                          {members.length === 0 && (
                            <span className="text-xs text-muted">
                              No members
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            : state.players
                .filter((p) => p.id !== state.hostId)
                .map((player) => {
                  const emoji = AVATARS.find(
                    (a) => a.id === player.avatarId,
                  )?.emoji;
                  const isMe = player.id === myPlayerId;
                  const answer = gs?.answers.find(
                    (a) => a.groupId === player.id,
                  );
                  const hasAnswered = !!answer;
                  const judgment = answer?.judgment ?? null;
                  const borderClass =
                    judgment === "rejected"
                      ? "border-red-500"
                      : hasAnswered
                        ? "border-green-500"
                        : isMe
                          ? "border-accent"
                          : "border-border";
                  return (
                    <div
                      key={player.id}
                      className="flex-1 min-w-[160px] flex flex-col gap-4"
                    >
                      {gs?.triviaPhase === "answer_revealed" && answer && (
                        <div
                          className="relative bg-yellow-50 px-3 py-2 rounded-sm shadow-md border-l-4 border-yellow-300"
                          style={{
                            backgroundImage:
                              "repeating-linear-gradient(transparent, transparent 18px, #e5d9a5 18px, #e5d9a5 19px)",
                          }}
                        >
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-accent/40 rounded-sm" />
                          <p className="text-gray-800 font-medium text-sm font-mono">
                            {answer.text}
                          </p>
                        </div>
                      )}
                      <div
                        className={`relative flex items-center gap-2 p-3 rounded-xl border-2 bg-surface shadow-sm transition-all ${borderClass} ${player.online ? "" : "opacity-50"}`}
                      >
                        <div
                          style={{ backgroundColor: player.color }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${player.online ? "" : "grayscale"}`}
                        >
                          {emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-text truncate uppercase tracking-wide">
                            {player.name}
                          </p>
                          <p className="text-accent font-mono font-bold">
                            {player.score} pts
                          </p>
                        </div>
                        {!player.online && (
                          <span className="absolute top-1.5 right-2 text-[10px] font-bold uppercase text-muted tracking-wider">
                            offline
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
        </div>
      </main>
    );
  }

  // Host view
  return (
    <main className="h-screen overflow-hidden p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-text">
            Trivia <span className="text-accent">Night</span>
          </h1>
          <span className="text-xs font-bold bg-accent text-white px-3 py-1 rounded-full uppercase tracking-widest">
            Host
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-2 bg-surface hover:bg-border border border-border rounded-full px-4 py-1.5 transition-colors group"
          >
            <span className="text-muted text-xs uppercase tracking-widest">
              {codeCopied ? "Copied!" : "Room"}
            </span>
            <span className={`font-mono font-bold tracking-widest transition-colors ${codeCopied ? "text-green-400" : "text-accent group-hover:text-text"}`}>
              {state.roomCode}
            </span>
          </button>
          <MuteButton muted={muted} onToggle={() => setMuted(!muted)} />
          <button
            type="button"
            onClick={() => {
              if (window.confirm("End the game and show final scores?")) {
                send({ type: "host_action", action: "end_game" });
              }
            }}
            className="bg-surface hover:bg-border border border-border text-muted hover:text-text text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            End Game
          </button>
        </div>
      </div>

      {/* Main three-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left — Controls */}
        <div className="flex flex-col gap-3 w-56 bg-card border border-border rounded-2xl p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <h2 className="font-bold text-text">Controls</h2>

          {state.settings.teamsEnabled ? (
            <div className="flex flex-col gap-2">
              {state.teams
                .filter((t) => t.memberIds.length > 0)
                .map((team) => {
                  const members = state.players.filter(
                    (p) => p.teamId === team.id,
                  );
                  return (
                    <div
                      key={team.id}
                      className="flex flex-col gap-2 bg-surface border border-border rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-text">
                            {team.name}
                          </p>
                          <p className="text-xs text-accent font-mono">
                            {team.score} pts
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              send({
                                type: "host_action",
                                action: "award_points",
                                groupId: team.id,
                                points: -1,
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-card border border-border text-muted hover:text-text hover:bg-surface text-sm font-bold transition-colors"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              send({
                                type: "host_action",
                                action: "award_points",
                                groupId: team.id,
                                points: 1,
                              })
                            }
                            className="w-7 h-7 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent-dim transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {members.length > 0 && (
                        <div className="flex">
                          {members.map((p, i) => {
                            const emoji = AVATARS.find(
                              (a) => a.id === p.avatarId,
                            )?.emoji;
                            return (
                              <div
                                key={p.id}
                                title={p.online ? p.name : `${p.name} (offline)`}
                                style={{
                                  backgroundColor: p.color,
                                  marginLeft: i === 0 ? 0 : -8,
                                }}
                                className={`w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-sm transition-opacity ${p.online ? "" : "opacity-40 grayscale"}`}
                              >
                                {emoji}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {state.players
                .filter((p) => p.id !== state.hostId)
                .map((player) => {
                  const emoji = AVATARS.find(
                    (a) => a.id === player.avatarId,
                  )?.emoji;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between bg-surface border border-border rounded-xl px-3 py-2 transition-opacity ${player.online ? "" : "opacity-50"}`}
                      title={player.online ? player.name : `${player.name} (offline)`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          style={{ backgroundColor: player.color }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${player.online ? "" : "grayscale"}`}
                        >
                          {emoji}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text truncate max-w-[72px]">
                            {player.name}
                          </p>
                          <p className="text-xs text-accent font-mono">
                            {player.score} pts
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            send({
                              type: "host_action",
                              action: "award_points",
                              groupId: player.id,
                              points: -1,
                            })
                          }
                          className="w-7 h-7 rounded-lg bg-card border border-border text-muted hover:text-text hover:bg-surface text-sm font-bold transition-colors"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            send({
                              type: "host_action",
                              action: "award_points",
                              groupId: player.id,
                              points: 1,
                            })
                          }
                          className="w-7 h-7 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent-dim transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Center — Live question + compose */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Live question display */}
          <div className="flex-1 bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-text">Live Question</h2>
              <div className="flex items-center gap-2">
                {gs?.activeQuestion && (
                  <span className="bg-accent text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                    {gs.activeQuestion.points}{" "}
                    {gs.activeQuestion.points === 1 ? "pt" : "pts"}
                  </span>
                )}
                <span className="text-xs text-muted bg-surface border border-border px-2 py-0.5 rounded-full">
                  Visible to players
                </span>
              </div>
            </div>

            {/* Question content — vertically centered */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              {gs?.activeQuestion ? (
                <>
                  {gs.activeQuestion.imageUrl && (
                    <img
                      src={gs.activeQuestion.imageUrl}
                      alt="Question"
                      className="max-h-44 w-auto rounded-xl shadow-lg object-contain"
                    />
                  )}
                  <p className="text-2xl font-black text-text text-center leading-snug">
                    {gs.activeQuestion.text}
                  </p>
                  {gs.triviaPhase === "answer_revealed" && (
                    <div className="w-full text-center p-4 bg-surface rounded-xl border border-accent">
                      <p className="text-xs text-muted uppercase tracking-widest mb-1">
                        Answer
                      </p>
                      <p className="text-xl font-black text-accent">
                        {gs.activeQuestion.answer}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center opacity-40">
                  <span className="text-5xl">❓</span>
                  <p className="text-sm text-muted">No question yet</p>
                </div>
              )}
            </div>

            {/* Phase-contextual action buttons */}
            {gs?.triviaPhase === "question_open" && (
              <button
                type="button"
                disabled={!allAnswered}
                onClick={() =>
                  send({ type: "host_action", action: "close_answers" })
                }
                className="w-full bg-surface hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed border border-border text-text font-bold py-2.5 rounded-xl transition-colors"
              >
                {allAnswered
                  ? "Lock Answers"
                  : `Waiting for answers (${answeredCount}/${eligibleGroups.length})`}
              </button>
            )}
            {gs?.triviaPhase === "answers_closed" && (
              <button
                type="button"
                onClick={() =>
                  send({ type: "host_action", action: "reveal_answer" })
                }
                className="w-full bg-accent hover:bg-accent-dim text-white font-bold py-2.5 rounded-xl transition-colors shadow-md"
              >
                Reveal Answer
              </button>
            )}
            {gs?.triviaPhase === "answer_revealed" && (
              <button
                type="button"
                onClick={() =>
                  send({ type: "host_action", action: "next_question" })
                }
                className="w-full bg-surface hover:bg-border border border-border text-text font-bold py-2.5 rounded-xl transition-colors"
              >
                Next Question
              </button>
            )}
          </div>

          {/* Compose panel — only shown when idle */}
          {(!gs || gs.triviaPhase === "idle") && (
            <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-text">Compose Question</h2>
                <button
                  type="button"
                  onClick={handleRandomQuestion}
                  className="flex items-center gap-1.5 bg-surface hover:bg-border border border-border text-muted hover:text-text text-xs font-semibold px-3 py-1.5 rounded-full transition-colors group"
                >
                  <Shuffle
                    size={13}
                    className={`transition-transform duration-300 ${randomSpin ? "rotate-180 text-accent" : "group-hover:text-accent"}`}
                  />
                  Random
                </button>
              </div>

              <textarea
                className="w-full bg-surface border border-border rounded-xl p-3 text-text placeholder:text-muted resize-none h-20 focus:outline-none focus:border-accent transition-colors"
                placeholder="Type your question here..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />

              <input
                className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors text-sm"
                placeholder="Correct answer (only you see this until revealed)"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
              />

              <div className="flex gap-2 items-center">
                <label className="text-xs text-muted uppercase tracking-widest font-semibold">
                  Points
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPointsInput(n)}
                      className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors appearance-none ${
                        pointsInput === n
                          ? "bg-accent text-white"
                          : "bg-surface border border-border text-muted hover:text-text hover:bg-border"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  value={pointsInput}
                  onChange={(e) =>
                    setPointsInput(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-16 bg-surface border border-border rounded-lg px-2 py-1.5 text-text text-sm text-center focus:outline-none focus:border-accent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors text-sm"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL (optional)"
                />
                <button
                  type="button"
                  onClick={() => setConfirmedImage(imageUrl || null)}
                  className="bg-surface hover:bg-border border border-border text-text text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  Preview
                </button>
                {confirmedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl("");
                      setConfirmedImage(null);
                    }}
                    className="bg-surface hover:bg-border border border-border text-muted text-sm px-3 py-2 rounded-xl transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {confirmedImage && (
                <img
                  src={confirmedImage}
                  alt="Preview"
                  className="rounded-xl max-h-32 w-auto mx-auto object-contain"
                />
              )}

              <button
                type="button"
                disabled={!questionText.trim()}
                onClick={() => {
                  send({
                    type: "host_action",
                    action: "reveal_question",
                    question: {
                      text: questionText.trim(),
                      answer: answerText.trim(),
                      points: pointsInput,
                      ...(confirmedImage ? { imageUrl: confirmedImage } : {}),
                    },
                  });
                  setQuestionText("");
                  setAnswerText("");
                  setImageUrl("");
                  setConfirmedImage(null);
                  setPointsInput(1);
                }}
                className="w-full bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-colors shadow-md"
              >
                Reveal Question to Players
              </button>
            </div>
          )}
        </div>

        {/* Right — Question bank */}
        <div className="flex flex-col gap-3 w-64 bg-card border border-border rounded-2xl p-4 min-h-0 overflow-hidden">
          <h2 className="font-bold text-text">Question Bank</h2>

          {/* Category dropdown */}
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setCategoryOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-border"
            >
              <span className="flex items-center gap-2 min-w-0">
                {selectedCategory ? (
                  <>
                    <span>{selectedCategory.emoji}</span>
                    <span className="font-semibold text-text truncate">
                      {selectedCategory.name}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">Pick a category...</span>
                )}
              </span>
              <span className="flex items-center gap-1 flex-shrink-0">
                {selectedCategory && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(null);
                      setCategoryOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.stopPropagation();
                        setSelectedCategory(null);
                      }
                    }}
                    className="text-muted hover:text-text transition-colors"
                  >
                    <X size={13} />
                  </span>
                )}
                <ChevronDown
                  size={14}
                  className={`text-muted transition-transform duration-200 ${categoryOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {categoryOpen && (
              <div className="absolute z-10 top-full mt-1.5 left-0 right-0 bg-card border border-border rounded-xl overflow-hidden shadow-xl">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors ${
                      selectedCategory?.name === cat.name
                        ? "bg-accent/15 text-accent"
                        : "text-text hover:bg-surface"
                    }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span className="font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Question list */}
          {selectedCategory ? (
            <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {selectedCategory.questions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQuestionText(q.q);
                    setAnswerText(q.a);
                  }}
                  className="text-left bg-surface hover:bg-border border border-border rounded-xl px-3 py-2.5 transition-colors group"
                >
                  <p className="text-xs text-text font-medium leading-snug group-hover:text-accent transition-colors">
                    {q.q}
                  </p>
                  <p className="text-xs text-muted mt-1">→ {q.a}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-xs text-center leading-relaxed px-2">
              Select a category to browse questions
            </div>
          )}
        </div>
      </div>

      {/* Bottom — Answers row (hidden when idle) */}
      {gs && gs.triviaPhase !== "idle" && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="font-bold text-text">
            {state.settings.teamsEnabled ? "Team Answers" : "Player Answers"}
          </h2>

          <div className="flex gap-3 flex-wrap">
            {(state.settings.teamsEnabled
              ? state.teams.filter((t) => t.memberIds.length > 0)
              : state.players.filter((p) => p.id !== state.hostId)
            ).map((entity) => {
              const answer = gs.answers.find((a) => a.groupId === entity.id);
              const submitter = answer?.submittedBy
                ? state.players.find((p) => p.id === answer.submittedBy)
                : null;
              const judgment = answer?.judgment ?? null;
              const player = state.settings.teamsEnabled
                ? null
                : (entity as (typeof state.players)[number]);
              const emoji = player
                ? AVATARS.find((a) => a.id === player.avatarId)?.emoji
                : null;
              const draft = state.settings.teamsEnabled
                ? gs.teamDrafts.find((d) => d.teamId === entity.id)
                : null;
              const draftTeamMembers = state.settings.teamsEnabled
                ? state.players.filter((p) => p.teamId === entity.id)
                : [];

              const borderClass =
                judgment === "accepted"
                  ? "border-green-500"
                  : judgment === "rejected"
                    ? "border-red-500"
                    : answer
                      ? "border-accent"
                      : draft?.text
                        ? "border-yellow-400"
                        : "border-border";

              return (
                <div
                  key={entity.id}
                  className={`flex-1 min-w-[200px] flex flex-col gap-2 p-4 rounded-xl border-2 bg-surface transition-colors ${borderClass}`}
                >
                  <div className="flex items-center gap-2">
                    {player && (
                      <div
                        style={{ backgroundColor: player.color }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      >
                        {emoji}
                      </div>
                    )}
                    <p className="font-bold text-text text-sm">{entity.name}</p>
                  </div>
                  {answer ? (
                    <>
                      <p className="text-lg font-black text-text bg-card rounded-lg px-3 py-2">
                        {answer.text}
                      </p>
                      {submitter && state.settings.teamsEnabled && (
                        <p className="text-xs text-muted">
                          by {submitter.name}
                        </p>
                      )}
                      {gs.triviaPhase === "answer_revealed" && (
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() =>
                              send({
                                type: "host_action",
                                action: "judge_answer",
                                groupId: entity.id,
                                verdict: "accept",
                              })
                            }
                            className={`flex-1 text-sm font-bold py-1.5 rounded-lg transition-colors ${
                              judgment === "accepted"
                                ? "bg-green-500 text-white"
                                : "bg-card hover:bg-green-500/20 border border-border text-text"
                            }`}
                          >
                            ✓ Accept
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              send({
                                type: "host_action",
                                action: "judge_answer",
                                groupId: entity.id,
                                verdict: "reject",
                              })
                            }
                            className={`flex-1 text-sm font-bold py-1.5 rounded-lg transition-colors ${
                              judgment === "rejected"
                                ? "bg-red-500 text-white"
                                : "bg-card hover:bg-red-500/20 border border-border text-text"
                            }`}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </>
                  ) : draft?.text ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted uppercase tracking-widest">
                          Draft
                        </span>
                        <div className="flex items-center gap-1">
                          {draftTeamMembers.map((p) => {
                            const locked = draft.lockedPlayerIds.includes(p.id);
                            const memberEmoji = AVATARS.find(
                              (a) => a.id === p.avatarId,
                            )?.emoji;
                            return (
                              <div
                                key={p.id}
                                title={
                                  locked
                                    ? `${p.name} locked in`
                                    : `${p.name} — not locked`
                                }
                                style={{ backgroundColor: p.color }}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 transition-all ${locked ? "border-green-400 opacity-100" : "border-transparent opacity-30"}`}
                              >
                                {memberEmoji}
                              </div>
                            );
                          })}
                          <span className="text-xs text-yellow-600 font-bold ml-0.5">
                            {draft.lockedPlayerIds.length}/
                            {draftTeamMembers.length}
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-black text-text bg-card rounded-lg px-3 py-2">
                        {draft.text}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          send({
                            type: "host_action",
                            action: "submit_draft",
                            teamId: entity.id,
                          })
                        }
                        className="w-full text-sm font-bold py-1.5 rounded-lg bg-accent hover:bg-accent-dim text-white transition-colors"
                      >
                        Submit for Team
                      </button>
                    </>
                  ) : (
                    <p className="text-muted text-sm">Waiting...</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
