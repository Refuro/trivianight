'use client'

import { useEffect, useState } from "react"
import PartySocket from "partysocket"
import type { RoomState, ClientMessage, Identity } from "./types"

export function useRoom(roomCode: string, identity: Identity | null, isCreator: boolean) {
    const [state, setState] = useState<RoomState | null>(null);
    const [socket, setSocket] = useState<PartySocket | null>(null)
    const [kickReason, setKickReason] = useState<string | null>(null)
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null)

    useEffect(() => {
        if (!identity) return;
        const ps = new PartySocket({
            host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
            room: roomCode,
        });

        ps.addEventListener("message", (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'room_state') setState(msg.state)
            if (msg.type === 'kicked') setKickReason(msg.reason)
            if (msg.type === 'you_are') setMyPlayerId(msg.playerId)
        });

        ps.addEventListener("open", () => {
            ps.send(JSON.stringify({
                type: "join",
                isCreator,
                name: identity.name,
                avatarId: identity.avatarId,
                color: identity.color,
            } satisfies ClientMessage))
        })

        setSocket(ps);
        return () => ps.close();
    }, [roomCode, identity, isCreator])

    function send(msg: ClientMessage) {
        socket?.send(JSON.stringify(msg))
    }

    return { state, send, kickReason, myPlayerId}
}