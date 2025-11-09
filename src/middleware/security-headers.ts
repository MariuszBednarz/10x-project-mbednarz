/**
 * Security Headers Middleware
 *
 * Adds security headers to all responses to protect against common attacks:
 * - Clickjacking (X-Frame-Options, CSP frame-ancestors)
 * - MIME sniffing (X-Content-Type-Options)
 * - XSS (Content-Security-Policy, X-XSS-Protection)
 *
 * @see .ai/security-audit-report.md Section 3
 */

/**
 * Add security headers to response
 *
 * @param response - Original response from handler
 * @returns Response with added security headers
 */
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // ================================================
  // Clickjacking Protection
  // ================================================
  // Prevent site from being embedded in iframes
  headers.set("X-Frame-Options", "DENY");

  // ================================================
  // MIME Sniffing Protection
  // ================================================
  // Prevent browsers from MIME-sniffing response away from declared content-type
  headers.set("X-Content-Type-Options", "nosniff");

  // ================================================
  // XSS Protection (Legacy)
  // ================================================
  // Enable browser's built-in XSS filter (legacy, but doesn't hurt)
  headers.set("X-XSS-Protection", "1; mode=block");

  // ================================================
  // Content Security Policy (CSP)
  // ================================================
  // Whitelist sources of content to prevent XSS attacks
  //
  // ⚠️ IMPORTANT: This is a strict CSP that may need adjustment based on:
  // - External scripts/styles you add
  // - Third-party integrations
  // - Analytics tools
  //
  // If features break, check browser console for CSP violations
  const csp = [
    // Default: only allow from same origin
    "default-src 'self'",

    // Scripts: allow from same origin + inline scripts (needed for React/Astro)
    // ⚠️ 'unsafe-inline' reduces CSP effectiveness but required for React hydration
    "script-src 'self' 'unsafe-inline'",

    // Styles: allow from same origin + inline styles (needed for Tailwind/React)
    "style-src 'self' 'unsafe-inline'",

    // Images: allow from same origin, data URIs, and HTTPS
    "img-src 'self' data: https:",

    // Fonts: allow from same origin and data URIs
    "font-src 'self' data:",

    // AJAX/WebSocket: allow same origin + Supabase API
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",

    // Frames: prevent embedding (same as X-Frame-Options)
    "frame-ancestors 'none'",

    // Forms: only submit to same origin
    "form-action 'self'",

    // Base URI: restrict to same origin
    "base-uri 'self'",
  ].join("; ");

  headers.set("Content-Security-Policy", csp);

  // ================================================
  // HSTS (Strict Transport Security)
  // ================================================
  // ⚠️ COMMENTED OUT: Only enable AFTER confirming HTTPS works in production!
  // Once enabled, browsers will FORCE HTTPS for 1 year (31536000 seconds)
  // If certificate breaks, users won't be able to access the site
  //
  // Uncomment this line ONLY after successful production deployment with HTTPS:
  // headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // ================================================
  // Referrer Policy
  // ================================================
  // Control referrer information sent with requests
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ================================================
  // Permissions Policy (formerly Feature Policy)
  // ================================================
  // Disable unused browser features to reduce attack surface
  headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()"
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
