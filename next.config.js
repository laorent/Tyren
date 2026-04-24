/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Fix workspace root inference warning
    outputFileTracingRoot: require('path').join(__dirname, './'),
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        return config;
    },
}

module.exports = nextConfig
