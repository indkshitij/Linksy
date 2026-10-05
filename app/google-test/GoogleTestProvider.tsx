"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"

interface GoogleTestProviderProps {
  children: React.ReactNode
}

export default function GoogleTestProvider({
  children,
}: GoogleTestProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!clientId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not defined.")
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}