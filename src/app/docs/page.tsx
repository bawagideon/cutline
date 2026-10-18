'use client';

import React from 'react';
import Link from 'next/link';

export default function DocsPage() {
  const sections = [
    {
      id: 'overview',
      title: 'Studio Architecture',
      content:
        'Cutline Studio separates generation from publication through strict approval gates. Background workers process tasks asynchronously via atomic database leases, while cryptographic secrets remain encrypted in an AES-256-GCM vault.',
    },
    {
      id: 'vault',
      title: 'Cryptographic Vault & Key Management',
      content:
        'All third-party credentials (Gemini, PixVerse, ElevenLabs, YouTube) are encrypted before insertion into Supabase PostgreSQL using 96-bit random IVs and 128-bit authentication tags. Plaintext keys are never served to browser bundles.',
    },
    {
      id: 'pipeline',
      title: 'Rendering Pipeline & Duration Boundaries',
      content:
        'PixVerse video generation enforces a hard hardware limit of 8 seconds per scene. Requests over 8s are flagged as over-limit and rejected during validation. Veo, Kling, and Runway are surfaced honestly as unimplemented stubs.',
    },
    {
      id: 'youtube',
      title: 'YouTube Resumable Uploads & Quota Metering',
      content:
        'Upload sessions are persisted in the database. Disconnected transfers issue an HTTP 308 range query to resume without restarting from byte 0. Daily API quotas are metered at 1,600 units per video upload against a 10,000 unit daily pool.',
    },
    {
      id: 'workers',
      title: 'Durable Queue & Atomic Leasing',
      content:
        'Background workers acquire jobs using atomic conditional updates (locked_by and locked_until). If a worker process fails or crashes, its lease expires automatically and another healthy worker resumes processing without duplicate execution.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E6E8EB] flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-[#1B1E24] px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="cutline-logo" />
          <span className="text-white font-medium text-base tracking-tight">Cutline</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-xs text-[#9CA3AF]">
          <Link href="/" className="hover:text-white transition-colors">Product</Link>
          <Link href="/security" className="hover:text-white transition-colors">Security</Link>
          <Link href="/docs" className="text-white font-medium">Docs</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/status" className="hover:text-white transition-colors">Status</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* Docs Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">
            Documentation
          </div>
          <nav className="space-y-1">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block text-xs py-1.5 text-[#9CA3AF] hover:text-white transition-colors"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content Body */}
        <main className="flex-1 max-w-3xl space-y-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
              Cutline Engineering Reference
            </h1>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Technical documentation covering security architecture, worker lifecycle, cryptographic vaults, and provider boundaries.
            </p>
          </div>

          <div className="space-y-10 divide-y divide-[#1C2028]">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="pt-8 first:pt-0">
                <h2 className="text-xl font-semibold text-white mb-3">
                  {s.title}
                </h2>
                <p className="text-sm text-[#9CA3AF] leading-relaxed font-mono">
                  {s.content}
                </p>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
