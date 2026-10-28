const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextExpertConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withNextIntl(nextConfig);
