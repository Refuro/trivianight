"use client";

import { Volume2, VolumeX } from "lucide-react";

interface MuteButtonProps {
  muted: boolean;
  onToggle: () => void;
  className?: string;
}

export function MuteButton({ muted, onToggle, className = "" }: MuteButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={muted ? "Unmute sounds" : "Mute sounds"}
      className={`p-1.5 rounded-full text-muted hover:text-text hover:bg-surface transition-colors ${className}`}
    >
      {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
    </button>
  );
}
