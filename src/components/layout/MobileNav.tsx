'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { label: 'Home', href: '/overview' },
    { label: 'Projects', href: '/projects' },
    { label: 'Queue', href: '/production' },
    { label: 'Publish', href: '/publishing' },
    { label: 'More', href: '/integrations' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0B0C0E]/95 backdrop-blur-md border-t border-[#1B1E24] px-4 py-2 z-50 flex items-center justify-around select-none">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== '/overview' && pathname.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors ${
              isActive ? 'text-[#E5A93C]' : 'text-[#9CA3AF] hover:text-[#E6E8EB]'
            }`}
          >
            <span>{tab.label}</span>
            {isActive && <div className="w-1 h-1 rounded-full bg-[#E5A93C]" />}
          </Link>
        );
      })}
    </nav>
  );
}
