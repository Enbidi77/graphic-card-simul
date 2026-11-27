import React, { useState } from 'react';
import {
  CHIP_COMPONENTS,
  CHIP_CONNECTIONS,
  PIPELINE_STAGES,
  SM_COMPONENTS,
  getProfileById,
  getTheoreticalPeakTflops,
  getTotalShaderCores
} from '../engine';
import type { GpuComponentNode } from '../engine';
import { useGpuLabStore } from '../store/useGpuLabStore';

const CATEGORY_STROKE: Record<string, string> = {
  frontend: '#22d3ee',
  compute: '#10b981',
  cache: '#f59e0b',
  memory: '#a78bfa',
  output: '#38bdf8'
};

export const ArchitectureLab: React.FC = () => {
  const [viewLevel, setViewLevel] = useState<'chip' | 'sm'>('chip');
  const [selectedId, setSelectedId] = useState<string>('sm-unit');
  const profileId = useGpuLabStore((s) => s.profileId);
  const activeStageId = useGpuLabStore((s) => s.clock.activeStageId);
  const setInspector = useGpuLabStore((s) => s.setInspector);

  const profile = getProfileById(profileId);
  const activeStage = PIPELINE_STAGES.find((s) => s.id === activeStageId) ?? PIPELINE_STAGES[0];
  const nodes = viewLevel === 'chip' ? CHIP_COMPONENTS : SM_COMPONENTS;

  const selectNode = (node: GpuComponentNode) => {
    setSelectedId(node.id);
    const active = activeStage.activeComponents.includes(node.id);
    setInspector({
      kind: 'component',
      id: node.id,
      title: node.name,
      subtitle: `${profile.name} • ${node.level === 'chip' ? 'Chip Overview' : 'SM Interior'}`,
      state: active ? `ACTIVE (${activeStage.shortName})` : 'IDLE / STANDBY',
      origin: 'simulated',
      inputs: { ActiveStage: activeStage.name, Category: node.category.toUpperCase() },
      outputs: {
        WarpSize: `${profile.warpSize} lanes`,
        TotalCores: getTotalShaderCores(profile)
      },
      config: { ...node.specs, L2Cache: `${profile.l2CacheMiB} MiB`, Bandwidth: `${profile.memBandwidthGBs} GB/s` },
      memoryAddress: node.baseAddress,
      history: [`Stage ${activeStage.id}: ${activeStage.shortName}`],
      educationalExplanation: node.educationalNote
    });
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-300 bg-white px-3 py-2 dark:border-graphite-700 dark:bg-graphite-900">
        <div>
          <h2 className="text-sm font-semibold">GPU Architecture Explorer</h2>
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {profile.classification} • {profile.gpcCount} GPCs × {profile.smsPerGpc} SMs ×{' '}
            {profile.coresPerSm} Cores = {getTotalShaderCores(profile).toLocaleString()} Cores •{' '}
            {getTheoreticalPeakTflops(profile).toFixed(2)} TFLOPS [theoretical]
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setViewLevel('chip')}
            className={`rounded border px-2.5 py-1 text-xs ${
              viewLevel === 'chip'
                ? 'border-signal-cyan bg-signal-cyan/10 text-signal-cyan'
                : 'border-slate-300 dark:border-graphite-700'
            }`}
          >
            Chip Overview
          </button>
          <button
            onClick={() => setViewLevel('sm')}
            className={`rounded border px-2.5 py-1 text-xs ${
              viewLevel === 'sm'
                ? 'border-signal-cyan bg-signal-cyan/10 text-signal-cyan'
                : 'border-slate-300 dark:border-graphite-700'
            }`}
          >
            Inspect SM Interior
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded border border-slate-300 bg-slate-50 p-2 dark:border-graphite-700 dark:bg-graphite-950">
        <svg viewBox="0 0 610 520" className="h-full w-full">
          {viewLevel === 'chip' &&
            CHIP_CONNECTIONS.map((conn) => {
              const a = CHIP_COMPONENTS.find((c) => c.id === conn.from);
              const b = CHIP_COMPONENTS.find((c) => c.id === conn.to);
              if (!a || !b) return null;
              const isHot = conn.stageIds.includes(activeStageId);
              const x1 = a.x + a.w / 2;
              const y1 = a.y + a.h / 2;
              const x2 = b.x + b.w / 2;
              const y2 = b.y + b.h / 2;
              return (
                <g key={conn.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isHot ? '#22d3ee' : '#334155'}
                    strokeWidth={isHot ? 2.5 : 1.2}
                    strokeDasharray={isHot ? '6 4' : undefined}
                  />
                </g>
              );
            })}

          {nodes.map((node) => {
            const isActive =
              viewLevel === 'chip'
                ? activeStage.activeComponents.includes(node.id)
                : activeStage.activeComponents.includes('sm-unit');
            const isSelected = selectedId === node.id;
            const accent = CATEGORY_STROKE[node.category] ?? '#64748b';
            return (
              <g
                key={node.id}
                onClick={() => selectNode(node)}
                className="cursor-pointer"
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={4}
                  fill={isActive ? 'rgba(34,211,238,0.12)' : 'rgba(20,24,29,0.92)'}
                  stroke={isSelected ? '#22d3ee' : isActive ? accent : '#334155'}
                  strokeWidth={isSelected ? 2.2 : isActive ? 1.8 : 1}
                />
                <text
                  x={node.x + 10}
                  y={node.y + 20}
                  fill="#e2e8f0"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {node.shortName}
                </text>
                <text
                  x={node.x + 10}
                  y={node.y + 36}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontFamily="sans-serif"
                >
                  {node.name.slice(0, 34)}
                </text>
                {node.baseAddress && (
                  <text
                    x={node.x + 10}
                    y={node.y + node.h - 10}
                    fill={isActive ? '#22d3ee' : '#64748b'}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {node.baseAddress} • {isActive ? 'ACTIVE' : 'IDLE'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
