const BASE_URL = import.meta.env.VITE_BASE_URL;

export function securityHeaders(): object {
    return {
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': [
            // Fetch directives
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for most modern frameworks
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            // Document directives
            `frame-ancestors 'self' ${BASE_URL}`,
            "frame-src 'self'",
            // Navigation directives
            "form-action 'self'",
            "base-uri 'self'",
            // Other directives
            "upgrade-insecure-requests"
        ].join('; '),
        'X-Frame-Options': 'DENY',
    };
}
