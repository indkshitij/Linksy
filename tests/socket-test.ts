import { io } from "socket.io-client"

console.log("Token available:", Boolean(process.env.ACCESS_TOKEN))

const token = process.env.ACCESS_TOKEN

if (!token) {
  throw new Error("ACCESS_TOKEN environment variable is required.")
}

const socket = io("http://localhost:4000", {
  auth: {
    token,
  },
  transports: ["websocket"],
})

socket.on("connect", () => {
  console.log("Socket connected:", socket.id)
})

socket.on("socket:connected", (data) => {
  console.log("Authenticated:", data)
})

socket.on("connect_error", (error) => {
  console.error("Socket connection failed:", error.message)
})

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason)
})
