import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/@sparticuz/chromium/**/*',
      './assets/fonts/DejaVuSans.ttf',
      './public/shows/*/files/poster*.jpg',
      './public/shows/*/files/poster*.png',
    ],
  },
};

export default nextConfig;
