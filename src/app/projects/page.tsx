'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

export default function ProjectsPage() {
  const [filter, setFilter] = useState<'All' | 'Active' | 'In review' | 'Archived'>('All');
  const [search, setSearch] = useState('');

  const projects = [
    {
      id: 'lagos-after-dark',
      name: 'Lagos After Dark',
      category: 'Documentary',
      episodesCount: 7,
      format: '16:9',
      status: 'Active',
      color: 'from-purple-950/40 to-slate-900',
    },
    {
      id: 'street-kitchen-diaries',
      name: 'Street Kitchen Diaries',
      category: 'Food',
      episodesCount: 4,
      format: '16:9',
      status: 'Active',
      color: 'from-emerald-950/40 to-slate-900',
    },
    {
      id: 'code-in-yoruba',
      name: 'Code in Yoruba',
      category: 'Education',
      episodesCount: 12,
      format: '16:9',
      status: 'In review',
      color: 'from-amber-950/40 to-slate-900',
    },
    {
      id: 'naija-tech-weekly',
      name: 'Naija Tech Weekly',
      category: 'News',
      episodesCount: 31,
      format: '16:9',
      status: 'Active',
      color: 'from-blue-950/40 to-slate-900',
    },
    {
      id: 'okada-stories',
      name: 'Okada Stories',
      category: 'Fiction',
      episodesCount: 2,
      format: '16:9',
      status: 'Draft',
      color: 'from-stone-900 to-slate-900',
    },
    {
      id: 'harmattan',
      name: 'Harmattan',
      category: 'Travel',
      episodesCount: 5,
      format: '16:9',
      status: 'Archived',
      color: 'from-neutral-900 to-slate-950',
    },
  ];

  const filtered = projects.filter((p) => {
    const matchesFilter = filter === 'All' || p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">6 projects, 61 episodes</p>
        </div>
        <Link
          href="/projects/new"
          className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors self-start md:self-auto"
        >
          New project
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects"
            className="w-full bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-4 py-2 text-sm text-white outline-none transition-colors"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center bg-[#121417] p-1 rounded-lg border border-[#22262E] text-xs">
            {(['All', 'Active', 'In review', 'Archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  filter === tab
                    ? 'bg-[#1F242D] text-white shadow-sm'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-[#121417] p-1 rounded-lg border border-[#22262E] text-xs">
            <button className="px-3 py-1.5 rounded-md bg-[#1F242D] text-white font-medium">Grid</button>
            <button className="px-3 py-1.5 rounded-md text-[#9CA3AF] hover:text-white">List</button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}/episodes/7`}
            className="group bg-[#121417] border border-[#22262E] hover:border-[#383E4C] rounded-2xl overflow-hidden transition-all duration-200 flex flex-col"
          >
            {/* Aspect ratio banner */}
            <div className={`h-40 bg-gradient-to-br ${project.color} p-4 flex flex-col justify-between border-b border-[#1B1E24]`}>
              <span className="text-xs font-mono text-[#9CA3AF] bg-[#0B0C0E]/60 px-2 py-1 rounded w-fit">
                {project.format}
              </span>
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
        ))}
      </div>
    </StudioLayout>
  );
}
