/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.supabase.net https://*.supabase.in https://*.supabase.com https://api.stripe.com https://challenges.cloudflare.com https://api.resend.com https://api.github.com",
      "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://www.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/courses/ai-in-cybersecurity",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/courses/data-science-with-python",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/courses/business-analysis",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/courses/export-import",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/courses/digital-marketing",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/courses/effective-managerial-skills",
        destination: "/courses",
        permanent: true,
      },
      {
        source: "/awards/Registration",
        destination: "/awards/register",
        permanent: true,
      },
      {
        source: "/awards/registration",
        destination: "/awards/register",
        permanent: true,
      },
      {
        source: "/awards/Register",
        destination: "/awards/register",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
