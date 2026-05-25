"use client";

import { RoomState } from "@/lib/types";
import PlayerIcon from "./PlayerIcon";

export default function TriviaHosted({
  state,
  myPlayerId,
}: {
  state: RoomState;
  myPlayerId: string;
}) {
  return (
    <>
      {state.phase === "playing" ? (
        <div className="min-h-screen flex flex-col gap-6 justify-center max-w-xl mx-auto ">
          {/* Host View */}
          {state.hostId === myPlayerId ? (
            <div className="flex flex-col">
              <p>setup options for the host</p>
            </div>
          ) : (
            //nonhost during setup
            <div>
              <p>non hosts see this</p>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
