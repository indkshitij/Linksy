"use client"

import { GoogleLogin } from "@react-oauth/google"
import { useState } from "react"

export default function GoogleTestPage() {
  const [result, setResult] = useState<any>(null)

  async function handleGoogleSuccess(credentialResponse: any) {
    if (!credentialResponse.credential) {
      setResult({ error: "Google ID token not received." })
      return
    }

    const response = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: credentialResponse.credential,
      }),
    })

    const data = await response.json()
    setResult(data)
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold">Linksy Google Login Test</h1>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            setResult({ error: "Google login failed." })
          }}
        />

        {result && (
          <pre className="max-w-xl overflow-auto rounded-lg bg-gray-800 p-4 text-left text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </main>
  )
}
