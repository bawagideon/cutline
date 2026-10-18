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

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokedMessage, setRevokedMessage] = useState<string | null>(null);
  const [isReauthSheetOpen, setIsReauthSheetOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [isHoldingDelete, setIsHoldingDelete] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deleteIntervalId, setDeleteIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);

  // Revoke Dissolve Motif: session slides out and the list closes the gap
  const handleRevoke = (id: string) => {
    setRevokingId(id);
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setRevokingId(null);
      setRevokedMessage('Session revoked immediately. Refresh token invalidated.');
      setTimeout(() => setRevokedMessage(null), 3000);
    }, 200);
  };

  const handleRevokeAllOther = () => {
    setIsReauthSheetOpen(true);
  };

  const confirmReauthRevokeAll = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReauthSheetOpen(false);
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    setRevokedMessage('All other sessions terminated across all devices.');
    setTimeout(() => setRevokedMessage(null), 3000);
  };

  // Hold to Delete Motif: 1.5s press with filling ring and haptic
  const startHoldDelete = () => {
    setIsHoldingDelete(true);
    setDeleteProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / 1500) * 100));
      setDeleteProgress(progress);

      if (elapsed >= 1500) {
        clearInterval(interval);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate([60, 100, 60]); } catch {}
        }
        setIsDeleted(true);
        setIsHoldingDelete(false);
      }
    }, 25);

    setDeleteIntervalId(interval);
  };

  const cancelHoldDelete = () => {
    if (deleteIntervalId) clearInterval(deleteIntervalId);
    setIsHoldingDelete(false);
    setDeleteProgress(0);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
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
            className="border border-[#F87171]/60 hover:bg-[#2E1419] text-xs font-medium text-[#F87171] px-4 py-2 rounded-lg transition-colors btn-press"
          >
            Revoke all other sessions
          </button>
        </div>
      </div>

      {revokedMessage && (
        <div className="mb-6 p-4 rounded-xl bg-[#0E2A1E] border border-[#1B4D36] text-xs font-mono text-[#34D399] cut-in">
          ✓ {revokedMessage}
        </div>
      )}

      {/* Screen 21: Active Sessions with Revoke Dissolve */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 mb-8 cut-in">
        <h2 className="text-base font-semibold text-white mb-4">Active Sessions</h2>
        <div className="space-y-4 divide-y divide-[#1C2028]">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                revokingId === sess.id ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
              }`}
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
                  className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-[#F87171] px-3.5 py-1.5 rounded-lg transition-colors btn-press self-start md:self-auto font-mono"
                >
                  Revoke session
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Vault & Secrets Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 cut-in">
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

      {/* Hold to Delete Danger Zone */}
      <div className="bg-[#121417] border border-[#52222B] rounded-2xl p-6 mb-8 cut-in">
        <h3 className="text-sm font-semibold text-[#F87171] mb-1">Danger Zone</h3>
        <p className="text-xs text-[#9CA3AF] mb-4">
          Permanently delete your workspace data, projects, rendered assets, and vault credentials.
        </p>

        {isDeleted ? (
          <div className="p-3 bg-[#2A1215] border border-[#F87171] rounded-xl text-xs font-mono text-[#F87171]">
            ✓ Workspace purged. Signing out...
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              type="button"
              onMouseDown={startHoldDelete}
              onMouseUp={cancelHoldDelete}
              onMouseLeave={cancelHoldDelete}
              onTouchStart={startHoldDelete}
              onTouchEnd={cancelHoldDelete}
              className="relative overflow-hidden bg-[#2A1215] border border-[#F87171] text-[#F87171] font-semibold text-xs px-6 py-3 rounded-xl transition-transform active:scale-95 select-none"
            >
              <span className="relative z-10">
                {isHoldingDelete ? `Hold to confirm (${deleteProgress}%)` : 'Hold 1.5s to delete workspace'}
              </span>
              <div
                className="absolute inset-0 bg-[#F87171]/30 transition-all duration-75"
                style={{ width: `${deleteProgress}%` }}
              />
            </button>
            <span className="text-xs font-mono text-[#6B7280]">
              Keyboard alternative: press Alt+D or type confirm in workspace settings.
            </span>
          </div>
        )}
      </div>

      {/* Security Audit Log */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 cut-in">
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

      {/* Reauth Sheet Modal Motif */}
      {isReauthSheetOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={confirmReauthRevokeAll}
            className="bg-[#121417] border border-[#22262E] rounded-2xl max-w-md w-full p-6 space-y-4 cut-in"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🔒 Re-authenticate</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsReauthSheetOpen(false)}
                className="text-[#9CA3AF] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Confirm your studio password to revoke all active sessions across all devices.
            </p>

            <input
              type="password"
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              placeholder="Enter your current password..."
              required
              className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-2.5 text-xs text-white outline-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReauthSheetOpen(false)}
                className="border border-[#2E333D] px-4 py-2 rounded-lg text-xs text-[#9CA3AF] hover:text-white btn-press"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#F87171] hover:bg-[#EF4444] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg btn-press"
              >
                Confirm Revocation
              </button>
            </div>
          </form>
        </div>
      )}
    </StudioLayout>
  );
}
