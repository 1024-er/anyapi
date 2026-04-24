import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 启用静态导出
  images: {
    unoptimized: true, // 静态导出时需要
  },
  // 可选：配置基础路径（如果部署在子目录）
  // basePath: '/my-app',
  // 可选：配置trailingSlash
  // trailingSlash: true,
};

export default withMDX(nextConfig);