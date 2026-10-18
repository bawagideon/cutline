'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function ProjectsPage() {
  const [filter, setFilter] = useState<'All' | 'Active' | 'In review' | 'Archived'>('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scrubFrames, setScrubFrames] = useState<Record<string, number>>({});

  const projects = [
    {
      id: 'lagos-after-dark',
      name: 'Lagos After Dark',
      category: 'Documentary',
      episodesCount: 7,
      format: '16:9',
      status: 'Active',
      color: 'from-purple-950/40 to-slate-900',
      frames: ['Intro / Marina Bridge', 'Street Night Market', 'Danfo Bus Stop', 'Midnight Aerial'],
    },
    {
      id: 'street-kitchen-diaries',
      name: 'Street Kitchen Diaries',
      category: 'Food',
      episodesCount: 4,
      format: '16:9',
      status: 'Active',
      color: 'from-emerald-950/40 to-slate-900',
      frames: ['Spice Market Prep', 'Suya Grilling Flame', 'Jollof Pot Reveal', 'Tasting Reaction'],
    },
    {
      id: 'code-in-yoruba',
      name: 'Code in Yoruba',
      category: 'Education',
      episodesCount: 12,
      format: '16:9',
      status: 'In review',
      color: 'from-amber-950/40 to-slate-900',
      frames: ['Terminal Setup', 'Yoruba Syntax Intro', 'Logic Flow Diagram', 'Compiled App Test'],
    },
    {
      id: 'naija-tech-weekly',
      name: 'Naija Tech Weekly',
      category: 'News',
      episodesCount: 31,
      format: '16:9',
      status: 'Active',
      color: 'from-blue-950/40 to-slate-900',
      frames: ['Studio Headline', 'Funding Roundup', 'Interview Clip', 'Weekly Wrapup'],
    },
    {
      id: 'okada-stories',
      name: 'Okada Stories',
      category: 'Fiction',
      episodesCount: 2,
      format: '16:9',
      status: 'Draft',
      color: 'from-stone-900 to-slate-900',
      frames: ['Dawn Awakening', 'Traffic Rush', 'Passenger Dilemma', 'Sunset Horizon'],
    },
    {
      id: 'harmattan',
      name: 'Harmattan',
      category: 'Travel',
      episodesCount: 5,
      format: '16:9',
      status: 'Archived',
      color: 'from-neutral-900 to-slate-950',
      frames: ['Hazy Sunrise', 'Northern Savannah', 'Ancient City Walls', 'Dust Settling'],
    },
  ];

  const handleMouseMove = (projectId: string, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const frameIndex = Math.floor(ratio * 4);
    setScrubFrames((prev) => ({ ...prev, [projectId]: frameIndex }));
  };

  const filtered = projects.filter((p) => {
    const matchesFilter = filter === 'All' || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 cut-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-sm text-[#9CA3AF] mt-1 font-mono">
            {filtered.length} visible · {projects.length} total projects
          </p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors self-start md:self-auto btn-press shadow-md"
        >
          New project
        </Link>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 cut-in">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name..."
            className="w-full bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-2 text-sm text-white outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Status Filter Tabs with Filter Collapse */}
          <div className="flex items-center bg-[#121417] p-1 rounded-lg border border-[#22262E] text-xs">
            {(['All', 'Active', 'In review', 'Archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all duration-150 btn-press ${
                  filter === tab
                    ? 'bg-[#1F242D] text-white shadow-sm border border-[#2E333D]'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Working Layout Morph Toggles */}
          <div className="flex items-center bg-[#121417] p-1 rounded-lg border border-[#22262E] text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors btn-press ${
                viewMode === 'grid' ? 'bg-[#1F242D] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors btn-press ${
                viewMode === 'list' ? 'bg-[#1F242D] text-white shadow-sm' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display: Grid View vs List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cut-in">
          {filtered.map((project) => {
            const currentFrame = scrubFrames[project.id] || 0;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/episodes/7`}
                className="group bg-[#121417] border border-[#22262E] hover:border-[#E5A93C]/50 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col hover:-translate-y-0.5 hover:shadow-xl"
              >
                {/* Hover Scrub Storyboard Thumbnail */}
                <div
                  onMouseMove={(e) => handleMouseMove(project.id, e)}
                  onMouseLeave={() => setScrubFrames((prev) => ({ ...prev, [project.id]: 0 }))}
                  className={`h-40 bg-gradient-to-br ${project.color} p-4 flex flex-col justify-between border-b border-[#1B1E24] relative cursor-crosshair select-none`}
                >
                  <div className="flex justify-between items-center z-10">
                    <span className="text-[10px] font-mono text-[#E5A93C] bg-[#0B0C0E]/80 px-2 py-0.5 rounded border border-[#2D220E]">
                      {project.format}
                    </span>
                    <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded">
                      Frame {currentFrame + 1}/4
                    </span>
                  </div>

                  {/* Storyboard title banner */}
                  <div className="z-10 bg-black/50 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                    <div className="text-xs text-white font-medium truncate">
                      {project.frames[currentFrame]}
                    </div>
                  </div>

                  {/* Scrub progress indicator */}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
                    <div
                      className="h-full bg-[#E5A93C] transition-all duration-75"
                      style={{ width: `${((currentFrame + 1) / 4) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-white group-hover:text-[#E5A93C] transition-colors">
                        {project.name}
                      </h3>
                      <StatusPill label={project.status} />
                    </div>
                    <div className="text-xs text-[#9CA3AF] font-mono">
                      {project.category} · {project.episodesCount} eps
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Layout Morph: List View */
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl divide-y divide-[#1C2028] overflow-hidden cut-in">
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}/episodes/7`}
              className="flex items-center justify-between p-4 hover:bg-[#181B20] transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${project.color} border border-[#22262E] flex items-center justify-center font-mono text-xs text-[#E5A93C]`}>
                  {project.format === '16:9' ? '16:9' : '9:16'}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white group-hover:text-[#E5A93C] transition-colors truncate">
                    {project.name}
                  </div>
                  <div className="text-xs text-[#9CA3AF] font-mono">
                    {project.category} · {project.episodesCount} episodes
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusPill label={project.status} />
                <span className="text-xs text-[#9CA3AF] group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </StudioLayout>
  );
}
