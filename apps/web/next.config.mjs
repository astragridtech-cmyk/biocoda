/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // shared/adapters are TS workspace packages consumed straight from source.
  transpilePackages: ["@biocoda/shared", "@biocoda/adapters", "@biocoda/db"],
  experimental: {
    serverComponentsExternalPackages: ["pg", "@anthropic-ai/sdk", "mammoth"],
  },
  webpack: (config) => {
    // The workspace packages (and our lib) use explicit `.js` import specifiers
    // for NodeNext/Bundler TS resolution. Teach webpack to resolve them to the
    // real `.ts`/`.tsx` sources.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
