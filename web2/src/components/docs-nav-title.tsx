"use client"

import { LogoMark } from "@/components/logo-mark"

export function DocsNavTitle() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="font-bold">Any API</span>
    </span>
  )
}
