'use client'

import { useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { AVATARS, AVATAR_COLORS } from "@/lib/avatars";
import { useRouter } from "next/navigation";
import { customAlphabet } from "nanoid";
type Direction = "left" | "right"

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ", 6);

export default function LandingPage() {
  // TODO: Build the landing page.
  // See IMPLEMENTATION_GUIDE.md → Phase 1.1
  // Goal: name input + avatar grid picker, persist to sessionStorage,
  //       then route to /games on continue.
  const [roomCode, setRoomCode] = useState('')
  const [name, setName] = useState('')
  const [shownAvatar, setShownAvatar] = useState(0)
  const [shownColor, setShownColor] = useState(0)

  const router = useRouter()

  function handleAvatarSelect(d: Direction) {
    if (d === 'left') {
      if (shownAvatar === 0) {
        setShownAvatar(AVATARS.length - 1)
      } else {
        setShownAvatar(prev => prev - 1)
      }
    } else if (d === 'right') {
      if (shownAvatar >= AVATARS.length - 1) {
        setShownAvatar(0)
      } else {
        setShownAvatar(prev => prev + 1)
      }
    }
  }
  function handleColorSelect(d: Direction) {
    if (d === 'left') {
      if (shownColor === 0) {
        setShownColor(AVATAR_COLORS.length - 1)
      } else {
        setShownColor(prev => prev - 1)
      }
    } else if (d === 'right') {
      if (shownColor >= AVATAR_COLORS.length - 1) {
        setShownColor(0)
      } else {
        setShownColor(prev => prev + 1)
      }
    }
  }

  function saveIdentity() {
    const avId = AVATARS[shownAvatar].id
    const color = AVATAR_COLORS[shownColor]
    const cleanedName = name.trim()
    sessionStorage.setItem("identity", JSON.stringify({ name: cleanedName, avatarId: avId, color }));
  }

  function handleJoin() {
    saveIdentity()
    const code = roomCode.toUpperCase().trim()

    router.push(`/room/${code}`)
  }

  function handleCreate() {
    console.log(`Continue clicked with the following:\nName: ${name}\nAvatar: ${AVATARS[shownAvatar].label}\nAvatarId: ${AVATARS[shownAvatar].id}\nAvatarEmoji: ${AVATARS[shownAvatar].emoji}\nColor:${AVATAR_COLORS[shownColor]}`)
    saveIdentity()


    const code = makeCode()

    router.push(`/room/${code}?host=true`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Welcome to Trivia Night!</h1>
        <div className="m-2 px-4 flex flex-col w-md justify-center border border-border rounded-xl">
          <div className="flex flex-col gap-2 p-2 ">
            {/*I'll display the avatar here then have arrows below it to select between */}
            <p className="text-xl">Avatar</p>
            <div className="flex justify-between w-sm mx-auto">
              <button type='button' onClick={() => handleAvatarSelect('left')}>
                <ArrowLeft size={32} />
              </button>
              <button type='button' onClick={() => handleColorSelect('left')}>
                <ArrowLeft size={24} />
              </button>
              <p className="text-5xl border-4 p-2 rounded-full" style={{ backgroundColor: AVATAR_COLORS[shownColor], borderColor: AVATAR_COLORS[shownColor] }}>{AVATARS[shownAvatar].emoji}</p>
              <button type='button' onClick={() => handleColorSelect('right')}>
                <ArrowRight size={24} />
              </button>
              <button type='button' onClick={() => handleAvatarSelect('right')}>
                <ArrowRight size={32} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-2 p-2">
            <p className="text-xl">Enter your name</p>
            <input className="border text-center border-border rounded-md p-2" maxLength={15} type='text' value={name || ''} onChange={(e) => setName(e.target.value)} />
          </div>
          <button disabled={name.trim() === ''} className="disabled:opacity-50 text-xl border-2 p-2 border-border rounded-md m-2" onClick={() => handleCreate()}>Create Room</button>
          <div className="flex gap-2 justify-center items-center ">
            <p className="text-lg">Join a room:</p>
            <input className="border text-center border-border rounded-md p-2 m-2" maxLength={6} type='text' value={roomCode || ''} onChange={(e) => setRoomCode(e.target.value)} />
            <button disabled={name.trim() === '' || roomCode.trim() === ''} className="disabled:opacity-50 text-lg border-2 border-border rounded-md p-2 m-2" type='button' onClick={() => handleJoin()}>Join</button>
          </div>
        </div>
      </div>
    </main>
  );
}
