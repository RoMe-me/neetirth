# Security Policy

## Supported Versions

The `main` branch is the only supported version. Security fixes are applied to the latest commit.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Instead, please report via:

1. **GitHub Security Advisories** — Go to [Security → Advisories](https://github.com/RoMe-me/neetirth/security/advisories) and click "Report a vulnerability"
2. **Email** — Contact the repository owner directly

## Security Architecture

### Authentication
- The admin dashboard requires Supabase email/password authentication
- Admin status is verified both client-side (via RLS-protected query) and server-side (via `/api/admin-auth` using the service role key)
- No admin functionality is accessible without authentication

### Authorization
- **Row-Level Security (RLS)** is enabled on all Supabase tables
- Public content (site_content, active announcements) is readable by anyone
- Write access to admin tables requires membership in `admin_users`
- The Supabase service role key is only used server-side and never exposed to the browser

### Secrets Management
- **Never commit secrets** to the repository
- Environment variables are managed via:
  - `.env.local` for local development (gitignored)
  - Vercel environment variables for deployments
  - GitHub Actions secrets for CI/CD
- The `.env.example` file documents required variables without values

### Content Security
- HTTP security headers are set via `vercel.json` (HSTS, X-Frame-Options, etc.)
- API endpoints enforce method restrictions and never expose internal details
- The `/api/health` endpoint returns only status and timestamp

## Dependency Security
- Dependabot monitors npm packages and GitHub Actions for vulnerabilities
- CI runs on every PR to catch breaking changes
- Security advisories are reviewed weekly
