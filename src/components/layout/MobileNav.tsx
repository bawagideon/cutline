'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', href: '/overview', icon: '⊞' },
    { label: 'Projects', href: '/projects', icon: '📁' },
    { label: 'Queue', href: '/production', icon: '⚡' },
    { label: 'Publish', href: '/publishing', icon: '📅' },
    { label: 'More', href: '/settings', icon: '⚙' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-12 pb-[env(safe-area-inset-bottom)] bg-[#0B0C0E]/95 backdrop-blur-md border-t border-[#1B1E24] px-2 z-50 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== '/overview' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-all duration-150 btn-press ${
              isActive ? 'text-[#E5A93C]' : 'text-[#9CA3AF] hover:text-[#E6E8EB]'
            }`}
          >
            <span className="text-xs leading-none">{tab.icon}</span>
            <span className="mt-0.5 leading-none">{tab.label}</span>
            {isActive && <div className="w-1 h-1 rounded-full bg-[#E5A93C] mt-0.5" />}
          </Link>
        );
      })}
    </nav>
  );
}
