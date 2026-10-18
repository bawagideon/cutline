'use client';

import React, { useState } from 'react';

interface NotificationRow {
  id: string;
  event: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export default function NotificationsSettingsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([
    { id: '1', event: 'Job failed', email: true, push: false, inApp: true },
    { id: '2', event: 'Review ready', email: true, push: false, inApp: true },
    { id: '3', event: 'Publish succeeded', email: true, push: false, inApp: true },
    { id: '4', event: 'Token expiring', email: true, push: false, inApp: true },
    { id: '5', event: 'Budget warning', email: true, push: false, inApp: true },
  ]);

  const [saved, setSaved] = useState(false);

  const toggle = (id: string, channel: 'email' | 'push' | 'inApp') => {
    setRows(
      rows.map((r) =>
        r.id === id ? { ...r, [channel]: !r[channel] } : r
      )
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-white">Notification channels</h2>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Choose where alerts and production notices are routed.
        </p>
      </div>

      {/* Screen 34 Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-[#1C2028] text-[#9CA3AF] uppercase text-[11px] tracking-wider">
              <th className="py-3 pr-4 font-normal">EVENT</th>
              <th className="py-3 px-4 text-center font-normal">EMAIL</th>
              <th className="py-3 px-4 text-center font-normal">PUSH</th>
              <th className="py-3 pl-4 text-center font-normal">IN-APP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2028]">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#15181D] transition-colors">
                <td className="py-3.5 pr-4 text-white font-medium">
                  {row.event}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={row.email}
                    onChange={() => toggle(row.id, 'email')}
                    className="accent-[#E5A93C] w-4 h-4 cursor-pointer rounded"
                  />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={row.push}
                    onChange={() => toggle(row.id, 'push')}
                    className="accent-[#E5A93C] w-4 h-4 cursor-pointer rounded"
                  />
                </td>
                <td className="py-3.5 pl-4 text-center">
                  <input
                    type="checkbox"
                    checked={row.inApp}
                    onChange={() => toggle(row.id, 'inApp')}
                    className="accent-[#E5A93C] w-4 h-4 cursor-pointer rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Screen 34 Honest Note */}
      <div className="p-4 rounded-xl bg-[#0B0C0E] border border-[#22262E] text-xs text-[#9CA3AF] leading-relaxed">
        Push needs the app installed as a PWA and a configured push service. Otherwise it shows as unavailable.
      </div>

      <div className="pt-4 border-t border-[#1C2028] flex items-center justify-between">
        <span className="text-xs font-mono text-[#34D399]">
          {saved ? '✓ Notifications saved' : ''}
        </span>
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors"
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
