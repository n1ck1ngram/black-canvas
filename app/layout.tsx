import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Whiteboard App",
  description: "A collaborative whiteboard application with dark mode",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: "black" }}>
      <body className={`${inter.className} bg-black text-gray-200`}>{children}</body>
    </html>
  )
}

import './globals.css'
