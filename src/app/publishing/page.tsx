'use client';

import React, { useState } from 'react';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function PublishingCalendarPage() {
  const [hasInterruptedUpload, setHasInterruptedUpload] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [resumedSuccess, setResumedSuccess] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('New Episode');
  const [scheduleDate, setScheduleDate] = useState('Fri, Oct 23');
  const [scheduleTime, setScheduleTime] = useState('18:00');
  const [scheduleVisibility, setScheduleVisibility] = useState<'Private' | 'Unlisted' | 'Public'>('Unlisted');
  const [hasAiScenes, setHasAiScenes] = useState(true);

  const handleResume = () => {
    setIsResuming(true);
    setTimeout(() => {
      setIsResuming(false);
      setResumedSuccess(true);
      setTimeout(() => setHasInterruptedUpload(false), 2000);
    }, 1200);
  };

  interface ScheduledSlot {
    date: string;
    time: string;
    episode: string;
    project: string;
    channel: string;
    status: string;
    quotaUnits: string;
  }

  const [scheduledSlots] = useState<ScheduledSlot[]>([]);

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Publishing calendar
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            {scheduledSlots.length} slots planned · Approvals gate enabled
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121417] border border-[#22262E] px-3 py-1.5 rounded-lg text-xs font-mono text-white">
            UTC+01:00 (Lagos)
          </div>
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
          >
            Schedule release
          </button>
        </div>
      </div>

      {/* Screen 15: Interrupted Upload Recovery Card */}
      {hasInterruptedUpload && (
        <div className="bg-[#121417] border border-[#E5A93C]/40 rounded-2xl p-6 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] animate-ping" />
                <span className="text-sm font-semibold text-white">
                  Resume interrupted YouTube upload
                </span>
                <span className="text-xs font-mono text-[#E5A93C] bg-[#2D220E] border border-[#543F15] px-2 py-0.5 rounded-full">
                  68% chunk saved
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] max-w-2xl leading-relaxed">
                EP 06 (&ldquo;The Midnight Market&rdquo;) disconnected at byte offset 184MB of 270MB.
                Cutline preserved the YouTube resumable upload session URI (valid for another 18 hours).
                You can resume without re-uploading from 0%.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleResume}
                disabled={isResuming || resumedSuccess}
                className="flex-1 md:flex-none bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isResuming ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#0B0C0E] border-t-transparent rounded-full animate-spin" />
                    Querying HTTP 308 resume range...
                  </>
                ) : resumedSuccess ? (
                  '✓ Upload resumed!'
                ) : (
                  'Resume upload (HTTP 308)'
                )}
              </button>

              <button
                type="button"
                onClick={() => setHasInterruptedUpload(false)}
                className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-2.5 rounded-lg transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Releases Table */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028]">
        {scheduledSlots.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-xl bg-[#1A1D23] border border-[#22262E] flex items-center justify-center text-xl text-[#E5A93C] mx-auto mb-4">
              📅
            </div>
            <h3 className="text-base font-semibold text-white mb-2">No releases scheduled</h3>
            <p className="text-xs text-[#9CA3AF] mb-6 leading-relaxed">
              Videos approved at the review gate will appear here with scheduled drop times, timezone alignment, and YouTube quota estimates.
            </p>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors btn-press shadow-sm"
            >
              + Schedule release
            </button>
          </div>
        ) : (
          scheduledSlots.map((slot, idx) => (
            <div
              key={idx}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#15181D] transition-colors"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">
                    {slot.date}
                  </span>
                  <span className="text-xs font-mono text-[#E5A93C]">
                    {slot.time}
                  </span>
                  <StatusPill
                    label={slot.status}
                    variant={slot.status === 'Ready' ? 'green' : 'gray'}
                  />
                </div>

                <div className="text-base font-medium text-white mt-1">
                  {slot.episode}
                </div>
                <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">
                  Channel: {slot.channel} · Project: {slot.project}
                </div>
              </div>

              <div className="flex items-center gap-4 self-end md:self-center">
                <span className="text-xs font-mono text-[#9CA3AF]">
                  Quota: {slot.quotaUnits}
                </span>
                <button
                  type="button"
                  className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3.5 py-1.5 rounded-lg transition-colors"
                >
                  Edit slot
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Screen 37: Publishing Schedule Modal Dialog */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121417] border border-[#2E333D] rounded-2xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1C2028]">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Schedule EP 07
                </h3>
                <p className="text-xs font-mono text-[#9CA3AF] mt-0.5">
                  Lagos After Dark · Publishing Times in Africa/Lagos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-[#9CA3AF] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                    Date
                  </label>
                  <input
                    type="text"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                    Time (WAT)
                  </label>
                  <input
                    type="text"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Visibility Options */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                  Visibility
                </label>
                <div className="flex gap-2">
                  {(['Private', 'Unlisted', 'Public'] as const).map((vis) => (
                    <button
                      key={vis}
                      type="button"
                      onClick={() => setScheduleVisibility(vis)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                        scheduleVisibility === vis
                          ? 'bg-[#E5A93C] text-[#0B0C0E] font-semibold'
                          : 'bg-[#0B0C0E] border border-[#22262E] text-[#9CA3AF] hover:text-white'
                      }`}
                    >
                      {vis}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Disclosure Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 text-xs text-white cursor-pointer p-3 bg-[#0B0C0E] border border-[#22262E] rounded-xl">
                  <input
                    type="checkbox"
                    checked={hasAiScenes}
                    onChange={(e) => setHasAiScenes(e.target.checked)}
                    className="accent-[#E5A93C] w-4 h-4 rounded mt-0.5"
                  />
                  <div>
                    <div className="font-medium">Contains realistic AI-generated scenes</div>
                    <div className="text-[11px] text-[#9CA3AF] mt-0.5">
                      Complies with YouTube synthesized or altered content disclosure rules.
                    </div>
                  </div>
                </label>
              </div>

              {/* Approval Notice */}
              <div className="text-xs text-[#9CA3AF] font-mono">
                Public release needs your explicit approval.
              </div>
            </div>

            <div className="pt-4 border-t border-[#1C2028] flex gap-3">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="flex-1 border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`EP 07 scheduled for release on ${scheduleDate} at ${scheduleTime} WAT (${scheduleVisibility})`);
                  setIsScheduleModalOpen(false);
                }}
                className="flex-1 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs py-2.5 rounded-xl transition-colors"
              >
                Approve and schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </StudioLayout>
  );
}
