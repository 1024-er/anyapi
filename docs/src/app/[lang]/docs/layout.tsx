import { DocsLayout } from "fumadocs-ui/layouts/docs"
import type { ReactNode } from "react"
import { source } from "@/lib/source"
import { DocsNavTitle } from "@/components/docs-nav-title"

const bannerText: Record<string, { title: string; desc: string }> = {
  en: { title: "Supports Claude, GPT, Gemini and more", desc: "Synced with official releases" },
  zh: { title: "支持 Claude、GPT、Gemini 等主流模型", desc: "与官方同步更新" },
  "zh-tw": { title: "支援 Claude、GPT、Gemini 等主流模型", desc: "與官方同步更新" },
  fr: { title: "Claude, GPT, Gemini et plus", desc: "Synchronisé avec les versions officielles" },
  ru: { title: "Claude, GPT, Gemini и другие модели", desc: "Синхронизация с официальными релизами" },
  ja: { title: "Claude・GPT・Gemini 等の主要モデルに対応", desc: "公式リリースと同期" },
  vi: { title: "Hỗ trợ Claude, GPT, Gemini và nhiều hơn nữa", desc: "Đồng bộ với bản phát hành chính thức" },
}

function SidebarBanner({ lang }: { lang: string }) {
  const t = bannerText[lang] || bannerText.en
  return (
    <div className="rounded-lg bg-fd-primary/10 p-3 text-sm">
      <p className="font-medium" style={{ color: "oklch(0.55 0.20 264)" }}>{t.title}</p>
      <p className="text-fd-muted-foreground text-xs mt-0.5">{t.desc}</p>
    </div>
  )
}

interface Props {
  params: Promise<{ lang: string }>
  children: ReactNode
}

export default async function DocsRootLayout({ params, children }: Props) {
  const { lang } = await params

  return (
    <DocsLayout
      tree={source.getPageTree(lang)}
      nav={{
        title: <DocsNavTitle />,
      }}
      sidebar={{
        banner: <SidebarBanner lang={lang} />,
      }}
    >
      {children}
    </DocsLayout>
  )
}
