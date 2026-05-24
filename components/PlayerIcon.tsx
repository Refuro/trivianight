import { AVATARS } from "@/lib/avatars";

interface PlayerIconProps {
  avatarId: string
  color: string
  name: string
  host: boolean
}

export default function PlayerIcon({ avatarId, color, name, host }: PlayerIconProps) {
  const icon = AVATARS.find(a => a.id === avatarId)?.emoji

  return (
    <div className="relative flex flex-col items-center gap-1 pt-6">
      {host && (
        <span className="absolute top-0 text-xl leading-none">👑</span>
      )}
      <div
        className="w-16 h-16 flex items-center justify-center rounded-full text-4xl border-4 shadow-md"
        style={{ backgroundColor: color, borderColor: color }}
      >
        {icon}
      </div>
      <span className="bg-surface border border-border text-text text-xs font-semibold px-2 py-0.5 rounded-full max-w-[80px] truncate text-center">
        {name}
      </span>
    </div>
  )
}
