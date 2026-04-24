import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string }>
}

export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'zh' },
    { lang: 'zh-tw' },
    { lang: 'fr' },
    { lang: 'ru' },
    { lang: 'ja' },
    { lang: 'vi' },
  ]
}

export default async function LangPage({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/docs`)
}
