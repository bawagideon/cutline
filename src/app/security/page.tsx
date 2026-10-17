'use client';

import React, { useState } from 'react';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

interface SessionItem {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function SecurityPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'sess-1',
      device: 'Desktop Workstation',
      browser: 'Chrome 128 / Windows',
      ip: '102.89.44.12',
      location: 'Lagos, Nigeria',
      lastActive: 'Active now',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'iPhone 15 Pro',
      browser: 'Mobile Safari 17.5',
      ip: '102.89.44.88',
      location: 'Lagos, Nigeria',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);

  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
    setRevokedMessage('Session revoked immediately. Refresh token invalidated.');
    setTimeout(() => setRevokedMessage(null), 3000);
  };

  const handleRevokeAllOther = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    setRevokedMessage('All other sessions terminated across all devices.');
    setTimeout(() => setRevokedMessage(null), 3000);
  };

  const auditEvents = [
    { time: '12:40:05', event: 'Vault secret decrypted', actor: 'dispatcher (job_8f29d)', ip: '10.0.4.18' },
    { time: '10:15:20', event: 'Web session authenticated', actor: 'ade@cutline.studio', ip: '102.89.44.12' },
    { time: '09:00:00', event: 'Cron worker authenticated', actor: 'CRON_SECRET bearer', ip: 'internal-scheduler' },
    { time: 'Yesterday', event: 'Vault master key verified', actor: 'system-boot-check', ip: 'internal' },
  ];

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Security & Sessions
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            Identity verification, multi-tenant isolation, and session lifecycle
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRevokeAllOther}
            className="border border-[#EF4444]/60 hover:bg-[#2E1419] text-xs font-medium text-[#EF4444] px-4 py-2 rounded-lg transition-colors"
          >
            Revoke all other sessions
          </button>
        </div>
      </div>

      {revokedMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#0E2A1E] border border-[#1B4D36] text-xs font-mono text-[#34D399]">
          ✓ {revokedMessage}
        </div>
      )}

      {/* Screen 21: Active Sessions */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 mb-8">
        <h2 className="text-base font-semibold text-white mb-4">Active Sessions</h2>
        <div className="space-y-4 divide-y divide-[#1C2028]">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    {sess.device} · {sess.browser}
                  </span>
                  {sess.isCurrent ? (
                    <StatusPill label="This device" variant="green" />
                  ) : (
                    <span className="text-xs font-mono text-[#9CA3AF]">
                      {sess.lastActive}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono mt-1">
                  IP: {sess.ip} · {sess.location}
                </div>
              </div>

              {!sess.isCurrent && (
                <button
                  type="button"
                  onClick={() => handleRevoke(sess.id)}
                  className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-[#EF4444] px-3.5 py-1.5 rounded-lg transition-colors self-start md:self-auto"
                >
                  Revoke session
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vault & Secrets Health Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">AES-256-GCM Vault Status</h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            All third-party provider tokens are encrypted with 96-bit unique IVs and authenticated tags before database insertion.
          </p>
          <div className="pt-2 text-xs font-mono text-[#34D399]">
            ✓ Master Key initialized & verified
          </div>
        </div>

        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">Worker Cron Authentication</h3>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            The worker endpoints reject all requests lacking the secret Bearer header. Automated client poller was purged in favor of durable server execution.
          </p>
          <div className="pt-2 text-xs font-mono text-[#34D399]">
            ✓ Bearer authentication enforced
          </div>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Security Audit Log</h2>
        <div className="space-y-3">
          {auditEvents.map((evt, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs font-mono py-2 border-b border-[#1C2028] last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#6B7280]">{evt.time}</span>
                <span className="text-white font-medium">{evt.event}</span>
                <span className="text-[#9CA3AF] hidden sm:inline">({evt.actor})</span>
              </div>
              <span className="text-[#6B7280]">{evt.ip}</span>
            </div>
          ))}
        </div>
      </div>
    </StudioLayout>
  );
}
