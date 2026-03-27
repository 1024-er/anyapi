import { createI18nMiddleware } from "fumadocs-core/i18n/middleware"
import { i18n } from "@/lib/i18n"
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server"

const fdMiddleware = createI18nMiddleware(i18n)

const localeAliases: Record<string, string> = {
  "zh-cn": "zh",
  "zh-sg": "zh",
  "zh-hans": "zh",
  "zh-tw": "zh-tw",
  "zh-hk": "zh-tw",
  "zh-mo": "zh-tw",
  "zh-hant": "zh-tw",
}

function resolveLocale(raw: string): string {
  const lower = raw.toLowerCase().trim()

  const exact = localeAliases[lower]
  if (exact) return exact

  if (lower === "zh" || lower.startsWith("zh-hans")) return "zh"
  if (lower.startsWith("zh-hant") || lower.startsWith("zh-tw") || lower.startsWith("zh-hk")) return "zh-tw"

  const base = lower.split("-")[0]
  const supported = i18n.languages as readonly string[]
  if (supported.includes(base)) return base

  return ""
}

function detectLanguageFromHeader(acceptLang: string): string {
  const langs = acceptLang
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=")
      return { lang: lang.trim(), q: q ? parseFloat(q) : 1 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { lang } of langs) {
    const normalized = resolveLocale(lang)
    if (normalized) return normalized
  }

  return i18n.defaultLanguage
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  const pathSegments = pathname.split("/")
  const firstSeg = pathSegments[1]

  if (firstSeg) {
    const resolved = resolveLocale(firstSeg)

    if (resolved && resolved !== firstSeg) {
      const url = request.nextUrl.clone()
      url.pathname = "/" + resolved + "/" + pathSegments.slice(2).join("/")
      return NextResponse.redirect(url)
    }
  }

  const isRootOrLangless = pathname === "/" || !i18n.languages.some(
    (lang) => pathname === `/${lang}` || pathname.startsWith(`/${lang}/`)
  )

  if (isRootOrLangless) {
    const acceptLang = request.headers.get("accept-language")
    if (acceptLang) {
      const detected = detectLanguageFromHeader(acceptLang)
      const url = request.nextUrl.clone()
      if (pathname === "/") {
        url.pathname = `/${detected}/`
      } else {
        url.pathname = `/${detected}${pathname}`
      }
      return NextResponse.redirect(url)
    }
  }

  return fdMiddleware(request, event)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
