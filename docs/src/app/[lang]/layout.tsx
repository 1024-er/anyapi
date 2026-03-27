import { RootProvider } from "fumadocs-ui/provider/next"
import type { ReactNode } from "react"
import { i18nUI } from "@/lib/i18n"
import { DM_Sans, Signika } from "next/font/google"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const signika = Signika({
  subsets: ["latin"],
  variable: "--font-signika",
  display: "swap",
})

interface Props {
  params: Promise<{ lang: string }>
  children: ReactNode
}

export default async function LangLayout({ params, children }: Props) {
  const { lang } = await params

  return (
    <html lang={lang} className={`${dmSans.variable} ${signika.variable}`} suppressHydrationWarning>
      <body>
        <RootProvider i18n={i18nUI.provider(lang)}>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
