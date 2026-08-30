import { useQuery } from 'convex/react'
import usePresenceLib from '@convex-dev/presence/react'
import { api } from '@convex/_generated/api'

const VESPER_ROOM = 'vesper'

function HeartbeatInner({ userId }: { userId: string }): null {
  usePresenceLib(api.presence, VESPER_ROOM, userId)
  return null
}

export function Heartbeat(): React.JSX.Element | null {
  const me = useQuery(api.profiles.me)
  const myId = me?.user?._id
  if (!myId) return null
  return <HeartbeatInner userId={myId} />
}

export interface PresenceEntry {
  userId: string
  online: boolean
  lastDisconnected: number
}

export function useRoomPresence(roomId: string = VESPER_ROOM): PresenceEntry[] | undefined {
  return useQuery(api.presence.listRoom, { roomId, onlineOnly: false }) as
    | PresenceEntry[]
    | undefined
}
