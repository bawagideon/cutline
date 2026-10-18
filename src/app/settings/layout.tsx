'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Profile', href: '/settings' },
    { label: 'Security', href: '/security' },
    { label: 'Workspace', href: '/settings/workspace' },
    { label: 'Notifications', href: '/settings/notifications' },
    { label: 'Billing', href: '/settings/billing' },
  ];

  return (
    <StudioLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
          Account, workspace and billing
        </p>
      </div>

      {/* Settings Navigation Tabs (Screens 33-36) */}
      <div className="flex items-center gap-2 mb-8 border-b border-[#1B1E24] pb-3 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href === '/settings' && pathname === '/settings/profile');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#181B20] text-white border border-[#2E333D]'
                  : 'text-[#9CA3AF] hover:text-white hover:bg-[#121417]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Main Settings Body */}
      <div className="max-w-4xl">{children}</div>
    </StudioLayout>
  );
}
