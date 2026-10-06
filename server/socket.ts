import dotenv from "dotenv"

dotenv.config({
  path: ".env.local",
})

import http from "http"

import { connectDB } from "../lib/db"
import { initializeSocketServer } from "../lib/realtime/socket-server"
import { disconnectSessionSockets } from "./socket-control"

const PORT = Number(process.env.SOCKET_PORT ?? 4000)

const CONTROL_SECRET = process.env.SOCKET_CONTROL_SECRET

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error("Invalid SOCKET_PORT configuration.")
}

if (!CONTROL_SECRET) {
  throw new Error("SOCKET_CONTROL_SECRET is not configured.")
}

await connectDB()

const server = http.createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/internal/disconnect") {
    response.writeHead(404)
    response.end()
    return
  }

  const authorization = request.headers.authorization

  if (authorization !== `Bearer ${CONTROL_SECRET}`) {
    response.writeHead(401)
    response.end(
      JSON.stringify({
        success: false,
        message: "Unauthorized.",
      })
    )
    return
  }

  try {
    let body = ""

    for await (const chunk of request) {
      body += chunk
    }

    const data = JSON.parse(body)

    if (typeof data.sessionId !== "string" || data.sessionId.length === 0) {
      response.writeHead(400)
      response.end(
        JSON.stringify({
          success: false,
          message: "sessionId is required.",
        })
      )
      return
    }

    disconnectSessionSockets(io, data.sessionId)

    response.writeHead(200, {
      "Content-Type": "application/json",
    })

    response.end(
      JSON.stringify({
        success: true,
        message: "Session sockets disconnected.",
      })
    )
  } catch (error) {
    console.error("Socket control error:", error)

    response.writeHead(500)
    response.end(
      JSON.stringify({
        success: false,
        message: "Failed to disconnect session sockets.",
      })
    )
  }
})

const io = initializeSocketServer(server)

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})
