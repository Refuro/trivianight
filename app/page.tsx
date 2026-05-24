'use client'

import { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { AVATARS, AVATAR_COLORS } from "@/lib/avatars";
import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";

type Direction = "left" | "right"

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export default function LandingPage() {
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [shownAvatar, setShownAvatar] = useState(0)
  const [shownColor, setShownColor] = useState(0)

  const router = useRouter()

  function handleAvatarSelect(d: Direction) {
    if (d === 'left') {
      setShownAvatar(shownAvatar === 0 ? AVATARS.length - 1 : prev => prev - 1)
    } else {
      setShownAvatar(shownAvatar >= AVATARS.length - 1 ? 0 : prev => prev + 1)
    }
  }

  function handleColorSelect(d: Direction) {
    if (d === 'left') {
      setShownColor(shownColor === 0 ? AVATAR_COLORS.length - 1 : prev => prev - 1)
    } else {
      setShownColor(shownColor >= AVATAR_COLORS.length - 1 ? 0 : prev => prev + 1)
    }
  }

  function saveIdentity() {
    sessionStorage.setItem("identity", JSON.stringify({
      name: name.trim(),
      avatarId: AVATARS[shownAvatar].id,
      color: AVATAR_COLORS[shownColor],
    }));
  }

  function handleJoin() {
    saveIdentity()
    router.push(`/room/${roomCode.toUpperCase().trim()}`)
  }

  function handleCreate() {
    saveIdentity()
    router.push(`/room/${makeCode()}?host=true`)
  }

  const ready = name.trim() !== ''

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight text-text">
            Trivia <span className="text-accent">Night</span>
          </h1>
          <p className="text-muted text-sm mt-1">Pick your look, then jump in</p>
        </div>

        {/* Card */}
        <div className="w-full bg-card border border-border rounded-2xl p-6 flex flex-col gap-5 shadow-lg">

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Avatar</p>
            <div className="flex items-center gap-3">
              {/* Avatar arrows */}
              <button type="button" onClick={() => handleAvatarSelect('left')}
                className="text-muted hover:text-text transition-colors">
                <ChevronLeft size={28} />
              </button>

              {/* Color arrow left */}
              <button type="button" onClick={() => handleColorSelect('left')}
                className="text-muted hover:text-text transition-colors">
                <ChevronLeft size={20} />
              </button>

              {/* Avatar display */}
              <div
                className="text-5xl w-20 h-20 flex items-center justify-center rounded-full border-4 shadow-lg"
                style={{ backgroundColor: AVATAR_COLORS[shownColor], borderColor: AVATAR_COLORS[shownColor] }}
              >
                {AVATARS[shownAvatar].emoji}
              </div>

              {/* Color arrow right */}
              <button type="button" onClick={() => handleColorSelect('right')}
                className="text-muted hover:text-text transition-colors">
                <ChevronRight size={20} />
              </button>

              {/* Avatar arrow right */}
              <button type="button" onClick={() => handleAvatarSelect('right')}
                className="text-muted hover:text-text transition-colors">
                <ChevronRight size={28} />
              </button>
            </div>
          </div>

          {/* Name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted">
              Your Name
            </label>
            <input
              className="bg-surface border border-border rounded-xl px-4 py-2.5 text-center text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              maxLength={15}
              type="text"
              placeholder="Enter name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Create button */}
          <button
            disabled={!ready}
            onClick={handleCreate}
            className="w-full bg-accent hover:bg-accent-dim disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg py-3 rounded-xl transition-colors shadow-md"
          >
            Create Room
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted text-xs uppercase tracking-widest">or join</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Join row */}
          <div className="flex gap-2">
            <input
              className="flex-1 bg-surface border border-border rounded-xl px-4 py-2.5 text-center text-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors uppercase tracking-widest font-mono"
              maxLength={6}
              type="text"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
            />
            <button
              disabled={!ready || roomCode.trim() === ''}
              onClick={handleJoin}
              className="bg-surface hover:bg-border disabled:opacity-40 disabled:cursor-not-allowed border border-border text-text font-bold px-5 rounded-xl transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
