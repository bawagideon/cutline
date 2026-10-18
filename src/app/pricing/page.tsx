'use client';

import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'FREE',
      price: '$0',
      period: '/mo',
      badge: null,
      description: 'Ideal for testing workflows and building your initial pilot.',
      features: [
        '1 project',
        '1 YouTube channel',
        'Bring your own keys',
        'Community support',
      ],
      buttonText: 'Choose Free',
      buttonVariant: 'secondary',
    },
    {
      name: 'CREATOR',
      price: '$19',
      period: '/mo',
      badge: 'Current Plan',
      description: 'For active creators producing weekly automated series.',
      features: [
        'Unlimited projects',
        '2 channels and scheduling',
        '50 GB private media',
        '90-day script history',
      ],
      buttonText: 'Choose Creator',
      buttonVariant: 'gold',
    },
    {
      name: 'STUDIO',
      price: '$49',
      period: '/mo',
      badge: null,
      description: 'For multi-channel teams and production operations.',
      features: [
        '5 channels',
        'Priority worker queue',
        'Spend caps and audit log',
        '250 GB private media',
      ],
      buttonText: 'Choose Studio',
      buttonVariant: 'secondary',
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
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <Link href="/pricing" className="text-white font-medium">Pricing</Link>
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-16 md:py-24">
        {/* Title & Honest Billing Notice */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Pay for the studio, not the surprise.
          </h1>
          <p className="text-sm md:text-base text-[#9CA3AF] leading-relaxed">
            Draft pricing for planning. Gemini and render costs are billed by those providers directly to your own API keys.
          </p>
        </div>

        {/* Pricing Cards Grid (Screen 24) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all ${
                plan.buttonVariant === 'gold'
                  ? 'bg-[#121417] border-2 border-[#E5A93C] shadow-2xl relative'
                  : 'bg-[#121417] border border-[#22262E]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF]">
                    {plan.name}
                  </span>
                  {plan.badge && (
                    <span className="text-[11px] font-mono font-semibold text-[#E5A93C] bg-[#2D220E] border border-[#543F15] px-2.5 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm font-mono text-[#9CA3AF]">{plan.period}</span>
                </div>

                <p className="text-xs text-[#9CA3AF] leading-relaxed mb-6">
                  {plan.description}
                </p>

                {/* Features List */}
                <div className="space-y-3 pt-6 border-t border-[#1C2028]">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-[#E6E8EB]">
                      <span className="text-[#E5A93C] font-mono">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/onboarding"
                  className={`block text-center text-xs font-semibold py-3 rounded-xl transition-all ${
                    plan.buttonVariant === 'gold'
                      ? 'bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E]'
                      : 'border border-[#2E333D] hover:bg-[#181B20] text-white'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
