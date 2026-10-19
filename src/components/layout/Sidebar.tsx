'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const displayName = isLoaded && user
    ? user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Creator'
    : 'Studio Member';
  const displayWorkspace = isLoaded && user
    ? 'Personal Studio'
    : 'Solo workspace';

  const navItems = [
    { label: 'Overview', href: '/overview' },
    { label: 'Projects', href: '/projects' },
    { label: 'Production Queue', href: '/production' },
    { label: 'Publishing', href: '/publishing' },
    { label: 'Media Library', href: '/media' },
    { label: 'Channels', href: '/channels' },
    { label: 'Integrations', href: '/integrations' },
    { label: 'Usage & Costs', href: '/usage' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <aside className="w-64 border-r border-[#1B1E24] bg-[#0B0C0E] p-4 flex flex-col justify-between hidden md:flex shrink-0 min-h-screen">
      {/* Brand Header */}
      <Link href="/overview" className="flex items-center gap-3 px-3 py-4 mb-4 group">
        <div className="cutline-logo transition-transform duration-200 group-hover:scale-105" />
        <span className="text-white font-medium text-base tracking-tight">Cutline</span>
      </Link>

      {/* Navigation Links with Gold Edge Active Motif */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-sm transition-all duration-150 relative ${
                isActive
                  ? 'bg-[#181B20] text-white font-medium border border-[#2E333D] border-l-2 border-l-[#E5A93C] shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#E6E8EB] hover:bg-[#121417] border-l-2 border-l-transparent'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & User Profile */}
      <div className="pt-4 border-t border-[#1B1E24] space-y-3">
        <Link
          href="/security"
          className="block px-3.5 py-1.5 text-xs text-[#9CA3AF] hover:text-white transition-colors"
        >
          Security & Sessions
        </Link>
        <Link
          href="/onboarding"
          className="block px-3.5 py-1.5 text-xs text-[#9CA3AF] hover:text-white transition-colors"
        >
          Setup Checklist
        </Link>

        {/* Real Clerk User Profile Card */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#121417] border border-[#22262E]">
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8 rounded-full border border-[#2E333D]',
                userButtonPopoverCard: 'bg-[#121417] border border-[#22262E] text-white',
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{displayName}</div>
            <div className="text-xs text-[#9CA3AF] truncate font-mono">{displayWorkspace}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
