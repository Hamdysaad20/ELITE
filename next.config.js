const withNextIntl = require("next-intl/plugin")("./src/i18n/request.ts");
const path = require("path");
const webpack = require("webpack");
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  webpack: (config, { dev }) => {
    if (dev) {
      const shimPath = path.resolve(
        __dirname,
        "src/lib/nextSegmentExplorerShim.js",
      );
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /next-devtools[\\/]userspace[\\/]app[\\/]segment-explorer-node(\.js)?$/,
          shimPath,
        ),
      );
    }
    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    return [
      {
        // Long-term cache for static assets (images, fonts, etc.)
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache fonts aggressively
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/checkout",
        destination: "/order",
        permanent: false,
      },
    ];
  },
};

module.exports = withNextIntl(withPWA(nextConfig));
