import GoogleTestProvider from "./GoogleTestProvider"

export default function GoogleTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <GoogleTestProvider>{children}</GoogleTestProvider>
}