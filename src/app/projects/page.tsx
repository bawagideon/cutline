'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

interface ProjectItem {
  id: string;
  name: string;
  category: string;
  episodesCount: number;
  format: string;
  status: string;
  color: string;
  frames: string[];
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState<'All' | 'Active' | 'In review' | 'Archived'>('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [scrubFrames, setScrubFrames] = useState<Record<string, number>>({});
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  interface ProjectApiRecord {
    id: string;
    name: string;
    category?: string;
    episodes?: Array<{ count?: number }>;
    format?: string;
    status?: string;
  }

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to load projects`);
      }
      const json = await res.json();
      if (json.projects && json.projects.length > 0) {
        setProjects(
          json.projects.map((p: ProjectApiRecord) => ({
            id: p.id,
            name: p.name,
            category: p.category || 'Documentary',
            episodesCount: p.episodes?.[0]?.count || 0,
            format: p.format || '16:9',
            status: p.status || 'Active',
            color: 'from-amber-950/40 to-slate-900',
            frames: ['Script Outline', 'Scene Planning', 'Render Pipeline', 'Review Gate'],
          }))
        );
      } else {
        setProjects([]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Database connection error';
      setError(msg);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filtered = projects.filter((p) => {
    const matchesFilter = filter === 'All' ? true : p.status === filter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <StudioLayout>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 cut-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Projects
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            {projects.length} series · Approval-first pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/projects/new"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs md:text-sm px-4 py-2.5 rounded-lg transition-colors btn-press shadow-md"
          >
            + New project
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-4 font-mono cut-in">
          <div>
            <span className="font-semibold text-red-400">Database Connection Error:</span> {error}
          </div>
          <button
            type="button"
            onClick={() => loadProjects()}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 rounded-lg text-white font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Filter Pills with Filter Collapse Motif */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121417] border border-[#22262E] rounded-xl overflow-x-auto">
          {(['All', 'Active', 'In review', 'Archived'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap btn-press ${
                filter === tab
                  ? 'bg-[#1F242D] text-white border border-[#2E333D] shadow-xs'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Layout Morph Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#121417] border border-[#22262E] focus:border-[#E5A93C] rounded-lg px-3.5 py-1.5 text-xs text-white placeholder-[#6B7280] outline-none w-48 sm:w-64 transition-colors"
            />
          </div>

          {/* Grid / List Toggle (Layout Morph) */}
          <div className="flex items-center p-1 bg-[#121417] border border-[#22262E] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded text-xs transition-colors btn-press ${
                viewMode === 'grid' ? 'bg-[#1F242D] text-[#E5A93C]' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              田
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1.5 rounded text-xs transition-colors btn-press ${
                viewMode === 'list' ? 'bg-[#1F242D] text-[#E5A93C]' : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-12 text-center text-xs text-[#9CA3AF] font-mono">
          Loading workspace projects...
        </div>
      ) : projects.length === 0 ? (
        /* Genuine Zero State: No Projects Created Yet */
        <div className="bg-[#121417] border border-[#22262E] rounded-2xl p-12 text-center max-w-xl mx-auto my-8 cut-in">
          <div className="w-14 h-14 rounded-2xl bg-[#1A1D23] border border-[#2E333D] flex items-center justify-center text-3xl mx-auto mb-4">
            🎬
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects created yet</h3>
          <p className="text-xs md:text-sm text-[#9CA3AF] mb-6 leading-relaxed">
            Every documentary series, tutorial channel, or short begins with a project. Projects organize your scripts, rendered scenes, and YouTube release schedule.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-5 py-2.5 rounded-xl transition-colors btn-press shadow-md"
          >
            + Create first project
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View with Hover Scrub */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 cut-in">
          {filtered.map((project) => {
            const currentFrame = scrubFrames[project.id] ?? 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/episodes/1`}
                className="group bg-[#121417] border border-[#22262E] hover:border-[#383E4C] rounded-2xl overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
              >
                {/* Visual Storyboard Header with Hover Scrub */}
                <div
                  className={`h-40 bg-gradient-to-br ${project.color} relative p-4 flex flex-col justify-between overflow-hidden cursor-ew-resize select-none`}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const frameIndex = Math.min(
                      project.frames.length - 1,
                      Math.max(0, Math.floor((x / rect.width) * project.frames.length))
                    );
                    setScrubFrames((prev) => ({ ...prev, [project.id]: frameIndex }));
                  }}
                  onMouseLeave={() => {
                    setScrubFrames((prev) => ({ ...prev, [project.id]: 0 }));
                  }}
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/80 bg-black/50 px-2 py-0.5 rounded">
                      {project.format}
                    </span>
                    <span className="text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded">
                      Frame {currentFrame + 1}/{project.frames.length}
                    </span>
                  </div>

                  <div className="z-10 bg-black/50 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                    <div className="text-xs text-white font-medium truncate">
                      {project.frames[currentFrame]}
                    </div>
                  </div>

                  <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40">
                    <div
                      className="h-full bg-[#E5A93C] transition-all duration-75"
                      style={{ width: `${((currentFrame + 1) / project.frames.length) * 100}%` }}
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
              href={`/projects/${project.id}/episodes/1`}
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
