/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desativa a verificação do ESLint durante a compilação
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
