import type { ReactNode } from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | Documentation",
    default: "Documentation",
  },
  description: "AI API 平台文档",
  icons: {
    icon: "/logo.png",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
