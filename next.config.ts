import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          // Content Security Policy - prevents XSS attacks
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Next.js and React
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "manifest-src 'self'"
            ].join("; ")
          },
          // HTTP Strict Transport Security - forces HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload"
          },
          // Prevents clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          // Prevents MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          // Referrer policy for privacy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          // Permissions policy to restrict browser features
          {
            key: "Permissions-Policy",
            value: [
              "camera=('self')",
              "microphone=()",
              "geolocation=('self')",
              "interest-cohort=()"
            ].join(", ")
          },
          // Cross-Origin policies
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless"
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin"
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
