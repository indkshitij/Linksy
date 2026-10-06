import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"

import { authenticateSocket } from "./socket-auth"
import { getUserRoom, getSessionRoom } from "./rooms"
import { SOCKET_EVENTS } from "./events"

let io: SocketIOServer | null = null

export function getSocketServer(): SocketIOServer | null {
  return io
}

export function initializeSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },

    transports: ["websocket", "polling"],

    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },

    pingTimeout: 20_000,

    pingInterval: 25_000,

    maxHttpBufferSize: 1e6,
  })

  /*
   * -------------------------------------------------------
   * SOCKET AUTHENTICATION
   * -------------------------------------------------------
   */

  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token

      if (!authToken) {
        return next(new Error("Authentication required."))
      }

      const user = await authenticateSocket(authToken)

      socket.data.user = user

      next()
    } catch (error) {
      console.error("Socket authentication failed:", error)

      next(
        new Error(
          error instanceof Error
            ? error.message
            : "Socket authentication failed."
        )
      )
    }
  })

  /*
   * -------------------------------------------------------
   * CONNECTION
   * -------------------------------------------------------
   */

  io.on("connection", (socket) => {
    const user = socket.data.user

    if (!user?.userId) {
      socket.disconnect(true)
      return
    }

    const userRoom = getUserRoom(user.userId)

    /*
     * Every authenticated socket automatically
     * joins its private user room.
     */
    socket.join(userRoom)
    const sessionRoom = getSessionRoom(user.sessionId)

    socket.join(sessionRoom)

    console.log(`Socket connected: ${socket.id} | User: ${user.userId}`)

    /*
     * Tell the client that the socket is ready.
     */
    socket.emit(SOCKET_EVENTS.SOCKET_CONNECTED, {
      socketId: socket.id,
      userId: user.userId,
    })

    /*
     * ---------------------------------------------------
     * DISCONNECT
     * ---------------------------------------------------
     */

    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.id} | User: ${user.userId} | Reason: ${reason}`
      )
    })

    /*
     * ---------------------------------------------------
     * ERROR
     * ---------------------------------------------------
     */

    socket.on("error", (error) => {
      console.error(`Socket error: ${socket.id}`, error)
    })
  })

  return io
}

export function disconnectSession(
  sessionId: string
): void {
  if (!io) {
    return
  }

  const room = `session:${sessionId}`

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

  console.log(
    `Disconnected ${sockets.size} socket(s) for revoked session ${sessionId}`
  )
}