'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StudioLayout } from '@/components/layout/StudioLayout';
import { StatusPill } from '@/components/ui/StatusPill';

interface SceneItem {
  id: string;
  num: string;
  title: string;
  duration: number; // in seconds
  prompt: string;
  status: 'Rendered' | 'Failed' | 'Needs prompt' | 'Rendering' | 'Queued';
}

export default function ScenePlannerPage() {
  const params = useParams();
  const id = params?.id || 'lagos-after-dark';
  const epId = params?.epId || '7';

  const [scenes, setScenes] = useState<SceneItem[]>([
    {
      id: 'sc-1',
      num: '01',
      title: 'Oshodi dawn',
      duration: 5,
      prompt: 'Interior of a faded yellow danfo at dawn, 35mm, warm light, handheld',
      status: 'Rendered',
    },
    {
      id: 'sc-2',
      num: '02',
      title: 'Conductor interview',
      duration: 8,
      prompt: 'Close up of conductor counting vintage naira notes, dusty window reflections',
      status: 'Rendered',
    },
    {
      id: 'sc-3',
      num: '03',
      title: 'Bus interior',
      duration: 5,
      prompt: 'Commuters looking out of rainy windows, cinematic slow pan',
      status: 'Rendered',
    },
    {
      id: 'sc-4',
      num: '04',
      title: 'Rain on Third Mainland',
      duration: 12, // Exceeds PixVerse 8s maximum!
      prompt: 'Aerial drone shot moving along Third Mainland bridge through tropical storm',
      status: 'Failed',
    },
    {
      id: 'sc-5',
      num: '05',
      title: 'Archive footage',
      duration: 5,
      prompt: '',
      status: 'Needs prompt',
    },
    {
      id: 'sc-6',
      num: '06',
      title: 'Market montage',
      duration: 8,
      prompt: 'Fast paced cuts of market vendors loading bags onto the roof rack',
      status: 'Rendering',
    },
    {
      id: 'sc-7',
      num: '07',
      title: 'Closing shot',
      duration: 5,
      prompt: 'Bus taillights disappearing into Lagos dusk fog',
      status: 'Queued',
    },
  ]);

  const [selectedScene, setSelectedScene] = useState<SceneItem | null>(null);
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);

  const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

  const moveScene = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= scenes.length) return;

    const newScenes = [...scenes];
    const [moved] = newScenes.splice(index, 1);
    newScenes.splice(targetIndex, 0, moved);

    // Renumber scenes sequentially
    const renumbered = newScenes.map((s, idx) => ({
      ...s,
      num: String(idx + 1).padStart(2, '0'),
    }));

    setScenes(renumbered);
    setJustDroppedId(moved.id);
    setTimeout(() => setJustDroppedId(null), 350);
  };

  const getStatusVariant = (status: SceneItem['status']) => {
    switch (status) {
      case 'Rendered':
        return 'green';
      case 'Failed':
        return 'red';
      case 'Needs prompt':
        return 'amber';
      case 'Rendering':
        return 'blue';
      case 'Queued':
      default:
        return 'gray';
    }
  };

  return (
    <StudioLayout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 cut-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Scene planner
          </h1>
          <p className="text-xs md:text-sm text-[#9CA3AF] mt-1 font-mono">
            {scenes.length} scenes · {totalDuration}s total duration
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}/episodes/${epId}`}
            className="text-xs text-[#9CA3AF] hover:text-white px-3 py-2 transition-colors"
          >
            ← Episode
          </Link>
          <button
            type="button"
            onClick={() => {
              const newNum = String(scenes.length + 1).padStart(2, '0');
              setScenes([
                ...scenes,
                {
                  id: `sc-${Date.now()}`,
                  num: newNum,
                  title: `New scene ${newNum}`,
                  duration: 5,
                  prompt: '',
                  status: 'Needs prompt',
                },
              ]);
            }}
            className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-4 py-2 rounded-lg transition-colors btn-press"
          >
            Add scene
          </button>
          <button
            type="button"
            className="bg-[#E5A93C] hover:bg-[#F0B84D] text-[#0B0C0E] font-semibold text-xs px-4 py-2 rounded-lg transition-colors btn-press shadow-sm"
          >
            Render all approved
          </button>
        </div>
      </div>

      {/* Honest Provider Status Bar (Screen 9) */}
      <div className="bg-[#121417] border border-[#22262E] rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-4 text-xs font-mono cut-in">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">PixVerse</span>
          <span className="text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-2 py-0.5 rounded-full">
            configured (max 8s)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Veo, Kling, Runway</span>
          <span className="text-[#F87171] bg-[#2E1419] border border-[#52222B] px-2 py-0.5 rounded-full">
            not implemented
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Dev mock</span>
          <span className="text-[#9CA3AF] bg-[#181B20] border border-[#2E333D] px-2 py-0.5 rounded-full">
            off in production
          </span>
        </div>
      </div>

      {/* Scenes Table / Card Container with Drag Lift & Failure Nudge */}
      <div className="bg-[#121417] border border-[#22262E] rounded-2xl overflow-hidden divide-y divide-[#1C2028] cut-in">
        {scenes.map((scene, index) => {
          const isOverLimit = scene.duration > 8; // PixVerse maximum is 8s
          const isDragged = draggedSceneId === scene.id;
          const isSettled = justDroppedId === scene.id;

          return (
            <div
              key={scene.id}
              className={`p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 relative ${
                scene.status === 'Failed'
                  ? 'border-l-4 border-l-[#F87171] bg-[#1A1315]/50 shake-nudge'
                  : 'hover:bg-[#15181D]'
              } ${isDragged ? 'scale-[1.02] shadow-2xl bg-[#1C2028] z-20' : ''} ${
                isSettled ? 'border-b-2 border-b-[#E5A93C]' : ''
              }`}
            >
              {/* Scene Reorder Gripper & Info */}
              <div className="flex items-start md:items-center gap-4 min-w-0">
                {/* Drag Grip & Keyboard Controls */}
                <div className="flex flex-col items-center gap-1 font-mono text-[10px] text-[#6B7280]">
                  <button
                    type="button"
                    title="Move up (Alt+Up)"
                    disabled={index === 0}
                    onClick={() => moveScene(index, 'up')}
                    className="hover:text-white disabled:opacity-30 p-0.5"
                  >
                    ▲
                  </button>
                  <span
                    onMouseDown={() => setDraggedSceneId(scene.id)}
                    onMouseUp={() => setDraggedSceneId(null)}
                    className="cursor-grab active:cursor-grabbing font-bold text-xs"
                  >
                    ⋮⋮
                  </span>
                  <button
                    type="button"
                    title="Move down (Alt+Down)"
                    disabled={index === scenes.length - 1}
                    onClick={() => moveScene(index, 'down')}
                    className="hover:text-white disabled:opacity-30 p-0.5"
                  >
                    ▼
                  </button>
                </div>

                <span className="font-mono text-sm font-semibold text-[#6B7280]">
                  {scene.num}
                </span>

                <div>
                  <div className="text-sm font-medium text-white flex items-center gap-2">
                    <span>{scene.title}</span>
                    {scene.status === 'Failed' && (
                      <span className="text-[10px] font-mono text-[#F87171] bg-[#2A1215] px-2 py-0.5 rounded border border-[#F87171]/40">
                        Duration Exceeds 8s Max
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#9CA3AF] font-mono mt-0.5 truncate max-w-md">
                    {scene.prompt ? (
                      <>
                        visual prompt ·{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedScene(scene)}
                          className="text-[#E5A93C] hover:underline"
                        >
                          edit
                        </button>
                      </>
                    ) : (
                      <span className="text-[#F87171]">missing prompt</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Indicators with Status Morph */}
              <div className="flex items-center gap-3 self-end md:self-center">
                <span className="text-xs font-mono text-[#9CA3AF]">
                  {scene.duration}s
                </span>

                {isOverLimit ? (
                  <span className="text-xs font-mono text-[#F87171] bg-[#2E1419] border border-[#52222B] px-2.5 py-0.5 rounded-full">
                    {scene.duration}s over limit
                  </span>
                ) : (
                  <span className="text-xs font-mono text-[#34D399] bg-[#0E2A1E] border border-[#1B4D36] px-2.5 py-0.5 rounded-full">
                    capable
                  </span>
                )}

                <div className="transition-all duration-300">
                  <StatusPill
                    label={scene.status}
                    variant={getStatusVariant(scene.status)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedScene(scene)}
                  className="border border-[#2E333D] hover:bg-[#181B20] text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors btn-press"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Scene Modal */}
      {selectedScene && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121417] border border-[#2E333D] rounded-2xl max-w-lg w-full p-6 space-y-4 cut-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                Edit Scene {selectedScene.num}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedScene(null)}
                className="text-[#9CA3AF] hover:text-white btn-press"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1 font-mono uppercase">
                Scene Title
              </label>
              <input
                type="text"
                value={selectedScene.title}
                onChange={(e) =>
                  setSelectedScene({ ...selectedScene, title: e.target.value })
                }
                className="w-full bg-[#0B0C0E] border border-[#22262E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5A93C]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1 font-mono uppercase">
                Duration (seconds) — PixVerse max 8s
              </label>
              <input
                type="number"
                value={selectedScene.duration}
                onChange={(e) =>
                  setSelectedScene({
                    ...selectedScene,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-[#0B0C0E] border border-[#22262E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E5A93C]"
              />
              {selectedScene.duration > 8 && (
                <p className="text-xs text-[#F87171] mt-1 font-mono">
                  Warning: PixVerse video render provider rejects requests over 8s.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1 font-mono uppercase">
                Visual Prompt
              </label>
              <textarea
                value={selectedScene.prompt}
                onChange={(e) =>
                  setSelectedScene({ ...selectedScene, prompt: e.target.value })
                }
                rows={3}
                className="w-full bg-[#0B0C0E] border border-[#22262E] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#E5A93C]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#1C2028]">
              <button
                type="button"
                onClick={() => setSelectedScene(null)}
                className="border border-[#2E333D] px-4 py-2 rounded-lg text-xs text-white hover:bg-[#181B20] btn-press"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setScenes(
                    scenes.map((s) => (s.id === selectedScene.id ? selectedScene : s))
                  );
                  setSelectedScene(null);
                }}
                className="bg-[#E5A93C] text-[#0B0C0E] font-semibold px-4 py-2 rounded-lg text-xs hover:bg-[#F0B84D] btn-press"
              >
                Save Scene
              </button>
            </div>
          </div>
        </div>
      )}
    </StudioLayout>
  );
}
