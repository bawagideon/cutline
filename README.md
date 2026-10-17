# Cutline Studio

> **Cutline** is an approval-first creator automation studio designed to guide content creators from AI scripting and video rendering through asset review, durable queuing, and YouTube publishing.

---

## 🛡️ Production & Security Principles

Cutline was engineered from the ground up to solve the critical security vulnerabilities and operational shortcomings identified in legacy automation repositories:

1. **Honest Provider Architecture (Zero Silent Fallbacks):**
   - PixVerse provider enforces strict hardware duration limits (maximum 8s per scene). Scenes over 8s are flagged as `over limit` and rejected during validation.
   - Veo, Kling, and Runway are registered as honest stubs (`implemented: false`).
   - Mock rendering is locked out in production via hard code guardrails (`NODE_ENV === 'production'` or `ALLOW_DEV_MOCK_RENDER !== 'true'`).
   - Job logs report honest progress states (`Provider progress: not reported`) rather than fabricating fake progress percentages.

2. **Protected Background Workers & Atomic Leases:**
   - Worker endpoints (`/api/cron/workers`) require an authenticated `Bearer CRON_SECRET` header.
   - Background polling loops have been eliminated from client browsers.
   - Jobs are claimed atomically via leases (`locked_by`, `locked_until`) with database heartbeat tracking.

3. **AES-256-GCM Integration Vault:**
   - All third-party secrets (Gemini, PixVerse, ElevenLabs, YouTube) are encrypted before database insertion using 96-bit random IVs and authenticated tags.
   - Raw secrets are never sent to the browser or logged in server output (`••••••••a91f`).

4. **Approval Gate & Checksum Provenance:**
   - No episode can be scheduled or published without manual approval.
   - Downloader validates host allowlists, enforces a 500MB safety ceiling, and verifies SHA-256 hashes for all rendered media.

5. **YouTube Quota Tracking & Resumable Upload Recovery:**
   - Tracks daily API quota units (1,600 units/upload against a 10,000 unit daily limit).
   - Preserves YouTube upload session URIs. Interrupted transfers can query the byte offset via HTTP 308 and resume without starting over from 0%.

6. **Strict Quality Assurance:**
   - Next.js build error ignoring is disabled (`ignoreBuildErrors: false`, `ignoreDuringBuilds: false`).
   - 100% clean TypeScript strict compilation (`tsc --noEmit`).

---

## 📱 23 Screen Canvas Implementation

All 23 screens from the design canvas (`Cutline Studio — 23 screens.pdf`) are implemented:

| Row | Screen | Route | Key Features |
|---|---|---|---|
| 1. Public & Onboarding | Screen 1 | `/` | Product landing page, value proposition, feature preview |
| | Screen 2 | `/sign-in` | Audit-logged credentials sign-in |
| | Screen 3 | `/onboarding` | Resumable 6-step setup checklist |
| 2. Command | Screen 4 | `/overview` | Command overview, attention cards, active production summary |
| | Screen 5 | `/projects` | Project library with search, status filters, and episode counts |
| | Screen 6 | `/projects/new` | New project setup wizard (niche, aspect ratio, tone, cadence) |
| 3. Episode Studio | Screen 7 & 22 | `/projects/[id]/episodes/[epId]` | Episode workspace, pipeline tracker, responsive mobile layout |
| | Screen 8 | `.../episodes/[epId]/script` | Script editor with AI revision accept/reject diff viewer |
| | Screen 9 | `.../episodes/[epId]/scenes` | Scene planner with duration limit indicators & provider status |
| 4. Assets & Review | Screen 10 | `.../episodes/[epId]/assets` | Episode assets media browser & private storage tags |
| | Screen 11 | `.../episodes/[epId]/review` | Scrubbable player preview, checksum verify, publishing gate |
| | Screen 12 & 23 | `/production` | Production queue, worker heartbeats, mobile queue cards |
| 5. Jobs & Publishing | Screen 13 | `/production/jobs/[jobId]` | Job timeline with redacted logs & honest provider progress |
| | Screen 14 | `/media` | Workspace media library & storage capacity bar |
| | Screen 15 | `/publishing` | Timezone-aware calendar & HTTP 308 resumable upload recovery |
| 6. Connections | Screen 16 | `/channels` | YouTube channel health, revoked state alert, daily quota meter |
| | Screen 17 | `/integrations` | Provider grid (Gemini, PixVerse, ElevenLabs, Storage, Sentry) |
| | Screen 18 | Drawer | Slide-over drawer with masked keys & live latency tester |
| 7. Insights & Account | Screen 19 | `/usage` | Usage and costs labelled "estimated" or "provider-reported" |
| | Screen 20 | `/analytics` | Views velocity chart, retention rate, publishing throughput |
| | Screen 21 | `/security` | Active sessions revocation, cron secret rotation, security audit log |

---

## 🚀 Quickstart

### Prerequisites
- Node.js 20+ (Node 24 recommended)
- Supabase project (PostgreSQL + Storage)

### 1. Installation
```bash
cd cutline
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and populate your secrets:
```bash
cp .env.example .env.local
```

Key environment variables:
- `VAULT_MASTER_KEY`: 64-character hex string (32 bytes) for AES-256-GCM.
- `CRON_SECRET`: High-entropy token for worker authorization.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only privileged database key.
- `ALLOW_DEV_MOCK_RENDER`: `false` in production.

### 3. Run Database Migrations
Apply the initial schema to your Supabase instance:
```bash
# In your Supabase SQL editor or CLI
cat supabase/migrations/20261017000000_cutline_initial_schema.sql
```

### 4. Run Verification & Tests
```bash
# Run unit tests (AES-256-GCM vault, duration limits, safe downloader, worker leases)
npm test

# Run strict TypeScript verification
npm run type-check

# Run development server
npm run dev
```

---

## 🧪 Unit Tests

Native test suite running with Node 24:
- `tests/crypto-vault.test.ts`: Verifies AES-256-GCM encryption/decryption, bit-flip tamper detection, and key masking.
- `tests/render-provider.test.ts`: Verifies PixVerse 8s maximum limit, rejects >8s scene requests, verifies unimplemented stubs, and verifies production mock lockout.
- `tests/safe-downloader.test.ts`: Verifies host allowlist, SSRF mitigation, and protocol enforcement.
- `tests/worker-queue.test.ts`: Verifies worker manager initialization and secret log redaction.
