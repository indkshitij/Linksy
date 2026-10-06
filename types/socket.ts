import {  type JWTPayload } from "jose"

export interface SocketUser {
  userId: string
  sessionId: string
}

export interface SocketTokenPayload extends JWTPayload {
  userId?: string
  sessionId?: string
  type?: string
}