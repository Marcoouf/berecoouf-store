/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optionnel: redirects (si tu veux aussi basculer l’URL en EN)
  async redirects() {
    return [
      { source: '/artistes', destination: '/artists', permanent: false },
      { source: '/galerie',  destination: '/artworks', permanent: false },
      { source: '/artiste/:slug', destination: '/artists/:slug', permanent: false },
      { source: '/oeuvre/:slug',  destination: '/artworks/:slug', permanent: false },
    ];
  },
};

export default nextConfig;