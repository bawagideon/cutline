'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

export default function ProfileSettingsPage() {
  const { user } = useUser();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('Africa/Lagos (WAT)');
  const [theme, setTheme] = useState<'Dark' | 'Light' | 'System'>('Dark');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.fullName || user.firstName || 'Creator');
      setEmail(user.primaryEmailAddress?.emailAddress || '');
    }
    // Load persisted local preferences
    try {
      const savedTz = localStorage.getItem('cutline_timezone');
      if (savedTz) setTimezone(savedTz);
      const savedTheme = localStorage.getItem('cutline_theme') as 'Dark' | 'Light' | 'System' | null;
      if (savedTheme) setTheme(savedTheme);
    } catch {
      // Storage access blocked or restricted
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('cutline_timezone', timezone);
      localStorage.setItem('cutline_theme', theme);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // Handle storage quota or restriction
    }
  };

  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : 'C';

  return (
    <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-5 pb-6 border-b border-[#1C2028]">
        {user?.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={displayName}
            width={64}
            height={64}
            unoptimized
            className="w-16 h-16 rounded-full border border-[#2E333D] object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#181B20] border border-[#2E333D] flex items-center justify-center text-xl font-bold text-[#E5A93C]">
            {avatarLetter}
          </div>
        )}
        <div>
          <div className="text-sm font-semibold text-white">{displayName || 'Creator'}</div>
          <p className="text-[11px] font-mono text-[#6B7280] mt-0.5">
            Identity managed by Clerk Authentication
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF]">
              Display Name
            </label>
            <span className="text-[10px] font-mono text-[#E5A93C] bg-[#E5A93C]/10 px-2 py-0.5 rounded">
              Managed by Clerk
            </span>
          </div>
          <input
            type="text"
            value={displayName}
            readOnly
            className="w-full bg-[#0E1013] border border-[#22262E] text-[#9CA3AF] rounded-xl px-4 py-2.5 text-sm cursor-not-allowed focus:outline-none font-mono"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#9CA3AF]">
              Email Address
            </label>
            <span className="text-[10px] font-mono text-[#E5A93C] bg-[#E5A93C]/10 px-2 py-0.5 rounded">
              Managed by Clerk
            </span>
          </div>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full bg-[#0E1013] border border-[#22262E] text-[#9CA3AF] rounded-xl px-4 py-2.5 text-sm cursor-not-allowed focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
            Timezone Preference
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-mono"
          >
            <option value="Africa/Lagos (WAT)">Africa/Lagos (WAT, UTC+01:00)</option>
            <option value="Europe/London (GMT/BST)">Europe/London (UTC+00:00)</option>
            <option value="America/New_York (EST)">America/New_York (UTC-05:00)</option>
            <option value="America/Los_Angeles (PST)">America/Los_Angeles (UTC-08:00)</option>
            <option value="Asia/Tokyo (JST)">Asia/Tokyo (UTC+09:00)</option>
          </select>
        </div>

        {/* Theme Selector (Screen 33) */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
            Theme
          </label>
          <div className="flex items-center gap-3">
            {(['Dark', 'Light', 'System'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                  theme === t
                    ? 'bg-[#E5A93C] text-[#0B0C0E] font-semibold shadow-sm'
                    : 'bg-[#0B0C0E] border border-[#22262E] text-[#9CA3AF] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#1C2028] flex items-center justify-between">
          <span className="text-xs font-mono text-[#34D399]">
            {saved ? '✓ Studio preferences saved' : ''}
          </span>
          <button
            type="submit"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors btn-press shadow-sm"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
