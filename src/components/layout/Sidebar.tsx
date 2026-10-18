'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/overview' },
    { label: 'Projects', href: '/projects' },
    { label: 'Production', href: '/production', badge: '3' },
    { label: 'Media', href: '/media' },
    { label: 'Publishing', href: '/publishing', badge: '2' },
    { label: 'Channels', href: '/channels' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Integrations', href: '/integrations' },
    { label: 'Usage', href: '/usage' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0B0C0E] border-r border-[#1B1E24] p-4 select-none shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <div className="cutline-logo" />
        <span className="text-white font-medium text-base tracking-tight">Cutline</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/overview' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-[#181B20] text-white font-medium border border-[#2E333D]'
                  : 'text-[#9CA3AF] hover:text-[#E6E8EB] hover:bg-[#121417]'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-[#2D220E] text-[#E5A93C]' : 'bg-[#181B20] text-[#9CA3AF]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
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

        {/* User Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#121417] border border-[#22262E]">
          <div className="w-8 h-8 rounded-full bg-[#1F242D] border border-[#2E333D] flex items-center justify-center text-xs font-semibold text-[#E5A93C]">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">Ade Okafor</div>
            <div className="text-xs text-[#9CA3AF] truncate">Solo workspace</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
