'use client'

import { useEffect, useState } from "react"
import PartySocket from "partysocket"
import type { RoomState, ClientMessage, Identity } from "./types"

export type ConnectionStatus = "connecting" | "connected" | "failed"

function getOrCreateClientId(): string {
    try {
        let id = localStorage.getItem("clientId")
        if (!id) {
            id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36))
            localStorage.setItem("clientId", id)
        }
        return id
    } catch {
        // localStorage blocked (private mode etc) — fall back to a fresh id per session
        return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)
    }
}

export function useRoom(roomCode: string, identity: Identity | null, isCreator: boolean) {
    const [state, setState] = useState<RoomState | null>(null);
    const [socket, setSocket] = useState<PartySocket | null>(null)
    const [kickReason, setKickReason] = useState<string | null>(null)
    const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")

    useEffect(() => {
        if (!identity) return;

        setConnectionStatus("connecting")
        const clientId = getOrCreateClientId()
        setMyPlayerId(clientId)

        const ps = new PartySocket({
            host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999",
            room: roomCode,
        });

        ps.addEventListener("message", (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'room_state') setState(msg.state)
            if (msg.type === 'kicked') setKickReason(msg.reason)
            // 'you_are' is no longer sent; clientId is our stable identifier
        });

        ps.addEventListener("open", () => {
            setConnectionStatus("connected")
            ps.send(JSON.stringify({
                type: "join",
                clientId,
                isCreator,
                name: identity.name,
                avatarId: identity.avatarId,
                color: identity.color,
            } satisfies ClientMessage))
        })

        // Show "failed" if we don't get connected within 6 seconds.
        // partysocket auto-reconnects in the background, so connectionStatus may flip back to "connected" later.
        const failTimer = setTimeout(() => {
            setConnectionStatus((cur) => (cur === "connecting" ? "failed" : cur))
        }, 6000)

        setSocket(ps);
        return () => {
            clearTimeout(failTimer)
            ps.close()
        };
    }, [roomCode, identity, isCreator])

    function send(msg: ClientMessage) {
        socket?.send(JSON.stringify(msg))
    }

    return { state, send, kickReason, myPlayerId, connectionStatus }
}
