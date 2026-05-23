'use client'
import { useIdentity } from "@/lib/useIdentity";
import { useRoom } from "@/lib/useRoom";
// This page handles BOTH the lobby and the in-game UI — it switches based on
// the room's `phase` field. See IMPLEMENTATION_GUIDE.md → Phase 1.4 and Phase 2/3.

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";



export default function RoomPage() {

  const router = useRouter()

  const params = useParams();
  const code = params.code as string

  const searchParams = useSearchParams();
  const isCreator = searchParams.get("host") === "true";

  const { identity, checked } = useIdentity()
  const { state, send, kickReason } = useRoom(code, identity, isCreator)


  useEffect(() => {
    if (!identity && checked) router.push('/')
  }, [identity, checked, router])
  useEffect(() => {
    if (kickReason) router.push(`/&kick_reason:${kickReason}`)
  }, [kickReason])
  // TODO 4: Branch on state.phase:
  //         - "lobby"   → <Lobby state={state} send={send} />
  //         - "playing" → branch again on state.gameMode for trivia vs jeopardy
  //         - "ended"   → final scores screen
  //
  //         For now, just dump state.players in a list so you can verify the
  //         connection is working before you build the lobby UI.

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Room {code}</h1>
      <p className="text-zinc-500">all my lobby shits gonna be shown here with game type selection.</p>
      <p>State: {state ? 'Connected' : 'Connecting...'}</p>
      <p>Players: {(state?.players.length ? state.players.length : 0)}</p>
    </main>
  );
}
