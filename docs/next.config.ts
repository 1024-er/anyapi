import type { NextConfig } from "next"
import { createMDX } from "fumadocs-mdx/next"

const withMDX = createMDX()

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Docker / 生产：生成 standalone 产物供 docs/Dockerfile 运行
  output: "standalone",
}

export default withMDX(nextConfig)
