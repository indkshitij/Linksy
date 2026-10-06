import { Server as SocketIOServer } from "socket.io"
import { getSessionRoom } from "@/lib/realtime/rooms"
import { SOCKET_EVENTS } from "@/lib/realtime/events"

export function disconnectSessionSockets(
  io: SocketIOServer,
  sessionId: string
): void {
  const room = getSessionRoom(sessionId)

  const sockets = io.sockets.adapter.rooms.get(room)

  if (!sockets || sockets.size === 0) {
    return
  }

  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId)

    if (!socket) {
      continue
    }

    socket.emit(SOCKET_EVENTS.SOCKET_DISCONNECTED, {
      reason: "SESSION_REVOKED",
    })

    socket.disconnect(true)
  }

  console.log(`Disconnected ${sockets.size} socket(s) for session ${sessionId}`)
}
