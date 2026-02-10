import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  outputFileTracingIncludes: {
    '/*': ['./node_modules/@sparticuz/chromium/**/*'],
  },
};

export default nextConfig;
