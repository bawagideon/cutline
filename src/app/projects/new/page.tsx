'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('Lagos After Dark');
  const [description, setDescription] = useState('Night-economy documentaries from Lagos');
  const [category, setCategory] = useState<'Documentary' | 'Education' | 'News' | 'Fiction'>('Documentary');
  const [format, setFormat] = useState<'16:9' | '9:16'>('16:9');
  const [language, setLanguage] = useState('English (Nigeria)');
  const [submitting, setSubmitting] = useState(false);
  const [clapperSnapped, setClapperSnapped] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClapperSnapped(true);
    setSubmitting(true);

    setTimeout(() => {
      router.push('/projects/lagos-after-dark/episodes/7');
    }, 600);
  };

  return (
    <StudioLayout>
      <div className="max-w-5xl cut-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">New project</h1>
          <p className="text-sm text-[#9CA3AF] mt-1 font-mono">Only the essentials. Defaults come later.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 bg-[#121417] border border-[#22262E] rounded-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                  PROJECT NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (step < 2) setStep(2);
                  }}
                  required
                  className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                  CATEGORY
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['Documentary', 'Education', 'News', 'Fiction'] as const).map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 btn-press ${
                        category === cat
                          ? 'border-[#E5A93C] text-[#E5A93C] bg-[#2D220E] shadow-sm'
                          : 'border-[#22262E] text-[#9CA3AF] hover:text-white bg-[#0B0C0E]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                  FORMAT (FRAME MORPH)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormat('16:9');
                      setStep(3);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 btn-press ${
                      format === '16:9'
                        ? 'border-[#E5A93C] text-[#E5A93C] bg-[#2D220E] shadow-sm'
                        : 'border-[#22262E] text-[#9CA3AF] hover:text-white bg-[#0B0C0E]'
                    }`}
                  >
                    16:9 · Landscape (YouTube)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormat('9:16');
                      setStep(3);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 btn-press ${
                      format === '9:16'
                        ? 'border-[#E5A93C] text-[#E5A93C] bg-[#2D220E] shadow-sm'
                        : 'border-[#22262E] text-[#9CA3AF] hover:text-white bg-[#0B0C0E]'
                    }`}
                  >
                    9:16 · Vertical (Shorts)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#9CA3AF] mb-2">
                  LANGUAGE
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors"
                />
              </div>

              {/* Clapper Create Action Button */}
              <div className="flex items-center gap-4 pt-4 border-t border-[#1C2028]">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`text-[#0B0C0E] font-semibold text-sm px-6 py-2.5 rounded-lg transition-all duration-200 btn-press flex items-center gap-2 ${
                    clapperSnapped ? 'slate-snap bg-[#34D399] shadow-lg' : 'bg-[#E5A93C] hover:bg-[#F0B84D]'
                  }`}
                >
                  <span className="font-mono">🎬</span>
                  <span>{clapperSnapped ? 'Snapping Slate...' : submitting ? 'Creating...' : 'Create project'}</span>
                </button>
                <Link
                  href="/projects"
                  className="border border-[#2A2F3A] hover:bg-[#181B20] text-[#9CA3AF] hover:text-white text-sm px-5 py-2.5 rounded-lg transition-colors btn-press"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Right Rail & Frame Morph Preview Box */}
          <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-6 h-fit space-y-6">
            <h2 className="text-sm font-semibold text-white">Live preview & progress</h2>

            {/* Frame Morph Interactive Canvas Preview */}
            <div className="flex flex-col items-center justify-center p-4 bg-[#0B0C0E] rounded-xl border border-[#22262E] overflow-hidden min-h-[160px]">
              <div
                className={`border-2 border-[#E5A93C] rounded-lg bg-gradient-to-br from-[#2D220E] to-[#121417] flex items-center justify-center transition-all duration-300 shadow-md ${
                  format === '16:9'
                    ? 'w-48 h-27 aspect-video'
                    : 'w-24 h-42 aspect-[9/16]'
                }`}
              >
                <span className="text-[10px] font-mono text-[#E5A93C] font-semibold">
                  {format}
                </span>
              </div>
              <span className="text-[10px] text-[#9CA3AF] font-mono mt-3">
                {format === '16:9' ? '1920×1080 Standard' : '1080×1920 Mobile Shorts'}
              </span>
            </div>

            {/* Rail Draw Stepper */}
            <div className="space-y-4 relative">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] ring-4 ring-[#2D220E]" />
                <span className="font-medium text-white">1 · Essentials & Title</span>
              </div>
              <div className={`flex items-center gap-3 text-xs transition-colors duration-200 ${step >= 2 ? 'text-white' : 'text-[#6B7280]'}`}>
                <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${step >= 2 ? 'bg-[#E5A93C] ring-4 ring-[#2D220E]' : 'bg-[#22262E]'}`} />
                <span>2 · Voice and Tone</span>
              </div>
              <div className={`flex items-center gap-3 text-xs transition-colors duration-200 ${step >= 3 ? 'text-white' : 'text-[#6B7280]'}`}>
                <span className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${step >= 3 ? 'bg-[#E5A93C] ring-4 ring-[#2D220E]' : 'bg-[#22262E]'}`} />
                <span>3 · Format & Aspect</span>
              </div>
            </div>

            <div className="pt-6 border-t border-[#1C2028] text-xs text-[#9CA3AF] leading-relaxed font-mono">
              You can change all of this later. Nothing is generated or spent until you approve a job.
            </div>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
