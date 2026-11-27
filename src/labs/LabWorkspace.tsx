import React, { useState } from 'react';
import {
  LEARNING_SCENARIOS,
  PERF_PRESETS,
  SHADER_PRESETS,
  estimatePerformance,
  formatHexAddr,
  formatMiB,
  summarizeVram
} from '../engine';
import { useGpuLabStore } from '../store/useGpuLabStore';
import { ArchitectureLab } from './ArchitectureLab';
import { PipelineLab } from './PipelineLab';
import { ComputeLab } from './ComputeLab';
import { RasterizationLab } from './RasterizationLab';
import { TextureMemoryLab } from './TextureMemoryLab';

export const VramLab: React.FC = () => {
  const {
    vramAllocations,
    vramBudgetMiB,
    setVramBudgetMiB,
    vramResolution,
    vramMsaa,
    setVramTargetPreset,
    addVramAllocation,
    removeVramAllocation,
    setInspector
  } = useGpuLabStore();

  const summary = summarizeVram(vramAllocations, vramBudgetMiB);

  return (
    <div className="flex h-full flex-col gap-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-300 bg-white p-2.5 font-mono dark:border-graphite-700 dark:bg-graphite-900">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setVramTargetPreset('1080p', vramMsaa)}
            className={`rounded border px-2 py-0.5 ${vramResolution === '1080p' ? 'border-signal-cyan text-signal-cyan' : 'border-graphite-700'}`}
          >
            1920×1080
          </button>
          <button
            onClick={() => setVramTargetPreset('1440p', vramMsaa)}
            className={`rounded border px-2 py-0.5 ${vramResolution === '1440p' ? 'border-signal-cyan text-signal-cyan' : 'border-graphite-700'}`}
          >
            2560×1440
          </button>
          <button
            onClick={() => setVramTargetPreset('4k', vramMsaa)}
            className={`rounded border px-2 py-0.5 ${vramResolution === '4k' ? 'border-signal-cyan text-signal-cyan' : 'border-graphite-700'}`}
          >
            3840×2160 (4K)
          </button>
          <button
            onClick={() => setVramTargetPreset(vramResolution, vramMsaa === 1 ? 4 : 1)}
            className="rounded border border-graphite-700 px-2 py-0.5"
          >
            MSAA: {vramMsaa}×
          </button>
          <button
            onClick={() => addVramAllocation('4K Texture Block', 'texture', 64, 'RGBA8_SRGB')}
            className="rounded border border-signal-green/50 px-2 py-0.5 text-signal-green"
          >
            + Alloc 64 MiB Texture
          </button>
        </div>
        <label className="flex items-center gap-2">
          Budget: {vramBudgetMiB} MiB
          <input
            type="range"
            min={128}
            max={2048}
            step={128}
            value={vramBudgetMiB}
            onChange={(e) => setVramBudgetMiB(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="rounded border border-slate-300 bg-white p-2.5 font-mono dark:border-graphite-700 dark:bg-graphite-900">
        <div className="mb-1 flex justify-between">
          <span>
            VRAM Usage: {formatMiB(summary.usedBytes)} / {formatMiB(summary.budgetBytes)} [theoretical]
          </span>
          <span className={summary.overBudget ? 'text-signal-red' : 'text-signal-cyan'}>
            {summary.utilizationPct}% {summary.overBudget ? '(PRESSURE / OVER BUDGET)' : ''}
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded bg-slate-200 dark:bg-graphite-800">
          <div
            className={`h-full ${summary.overBudget ? 'bg-signal-red' : 'bg-signal-cyan'}`}
            style={{ width: `${Math.min(100, summary.utilizationPct)}%` }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto rounded border border-slate-300 bg-white p-2.5 dark:border-graphite-700 dark:bg-graphite-900">
        {vramAllocations.map((a) => (
          <div
            key={a.id}
            onClick={() =>
              setInspector({
                kind: 'vram-block',
                id: a.id,
                title: a.label,
                subtitle: `${a.type} • ${a.format}`,
                state: 'ALLOCATED',
                origin: 'theoretical',
                inputs: { Dimensions: a.dimensions ?? 'Linear', Alignment: `${a.alignmentBytes} B` },
                outputs: { Size: formatMiB(a.sizeBytes), Offset: formatHexAddr(a.offsetBytes) },
                config: { Preview: a.previewHex[0] },
                memoryAddress: formatHexAddr(a.offsetBytes),
                history: a.previewHex,
                educationalExplanation:
                  'GPU resources are aligned to 64 KiB pages in VRAM. Resolution, pixel format, and MSAA sample count multiply render-target footprints.'
              })
            }
            className="flex cursor-pointer items-center justify-between rounded border border-slate-300 px-2.5 py-1.5 font-mono hover:border-signal-cyan dark:border-graphite-700"
          >
            <div>
              <div className="font-sans font-medium">{a.label}</div>
              <div className="text-[10px] text-slate-500">
                {formatHexAddr(a.offsetBytes)} • {a.format}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-signal-cyan">{formatMiB(a.sizeBytes)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeVramAllocation(a.id);
                }}
                className="rounded border border-signal-red/40 px-1.5 py-0.5 text-[10px] text-signal-red"
              >
                Free
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PerformanceLab: React.FC = () => {
  const { perfConfigA, perfConfigB, updatePerfConfigA, updatePerfConfigB } = useGpuLabStore();
  const estA = estimatePerformance(perfConfigA);
  const estB = estimatePerformance(perfConfigB);

  return (
    <div className="grid h-full grid-cols-1 gap-2 lg:grid-cols-2">
      {[
        { title: 'Config A (Baseline)', cfg: perfConfigA, est: estA, update: updatePerfConfigA },
        { title: 'Config B (Comparison)', cfg: perfConfigB, est: estB, update: updatePerfConfigB }
      ].map(({ title, cfg, est, update }) => (
        <div
          key={title}
          className="flex flex-col gap-2 rounded border border-slate-300 bg-white p-3 text-xs dark:border-graphite-700 dark:bg-graphite-900"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{title}</h3>
            <select
              onChange={(e) => {
                const preset = PERF_PRESETS[e.target.value];
                if (preset) update(preset);
              }}
              className="rounded border border-slate-300 bg-transparent px-1.5 py-0.5 font-mono text-[11px] dark:border-graphite-700"
            >
              <option value="">Load Preset...</option>
              {Object.entries(PERF_PRESETS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <label>
              Draw Calls: {cfg.drawCalls}
              <input
                className="w-full"
                type="range"
                min={10}
                max={5000}
                step={10}
                value={cfg.drawCalls}
                onChange={(e) => update({ drawCalls: Number(e.target.value) })}
              />
            </label>
            <label>
              Shader Ops/px: {cfg.shaderOpsPerPixel}
              <input
                className="w-full"
                type="range"
                min={16}
                max={400}
                step={8}
                value={cfg.shaderOpsPerPixel}
                onChange={(e) => update({ shaderOpsPerPixel: Number(e.target.value) })}
              />
            </label>
            <label>
              Overdraw: {cfg.overdrawFactor}×
              <input
                className="w-full"
                type="range"
                min={1}
                max={10}
                step={0.2}
                value={cfg.overdrawFactor}
                onChange={(e) => update({ overdrawFactor: Number(e.target.value) })}
              />
            </label>
            <label>
              Bandwidth: {cfg.memoryBandwidthGBs} GB/s
              <input
                className="w-full"
                type="range"
                min={64}
                max={1024}
                step={32}
                value={cfg.memoryBandwidthGBs}
                onChange={(e) => update({ memoryBandwidthGBs: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="rounded border border-slate-300 bg-slate-50 p-2 font-mono dark:border-graphite-700 dark:bg-graphite-950">
            <div className="flex justify-between">
              <span>Modeled Frame Time [simulated]</span>
              <span className="text-signal-cyan">
                {est.totalFrameMs.toFixed(2)} ms ({est.estimatedFps} FPS est)
              </span>
            </div>
            <div className="mt-1 text-signal-amber">Bottleneck: {est.bottleneck}</div>
            <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] text-slate-400">
              <span>CPU: {est.cpuSubmitMs}ms</span>
              <span>Vert: {est.vertexStageMs}ms</span>
              <span>Frag: {est.fragmentStageMs}ms</span>
              <span>Mem: {est.memoryStageMs}ms</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{est.explanation}</p>
        </div>
      ))}
    </div>
  );
};

export const ShaderLab: React.FC = () => {
  const { shaderPresetId, vertexCode, fragmentCode, selectShaderPreset, setShaderCode } =
    useGpuLabStore();
  const [status, setStatus] = useState('Ready — WebGL2 GLSL 300 es');

  return (
    <div className="flex h-full flex-col gap-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-300 bg-white px-3 py-2 dark:border-graphite-700 dark:bg-graphite-900">
        <select
          value={shaderPresetId}
          onChange={(e) => selectShaderPreset(e.target.value)}
          className="rounded border border-slate-300 bg-transparent px-2 py-1 font-mono text-[11px] dark:border-graphite-700"
        >
          {SHADER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatus('Compiled cleanly (Simulated + WebGL2 target)')}
            className="rounded border border-signal-cyan px-2.5 py-1 font-mono text-[11px] text-signal-cyan"
          >
            Compile & Run
          </button>
          <button
            onClick={() => selectShaderPreset(shaderPresetId)}
            className="rounded border border-slate-300 px-2 py-1 font-mono text-[11px] dark:border-graphite-700"
          >
            Reset Example
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="flex flex-col rounded border border-slate-300 bg-graphite-950 p-2 dark:border-graphite-700">
          <div className="mb-1 font-mono text-[10px] text-signal-cyan">VERTEX SHADER (GLSL 300 es)</div>
          <textarea
            value={vertexCode}
            onChange={(e) => setShaderCode(e.target.value, fragmentCode)}
            className="flex-1 resize-none bg-transparent font-mono text-[11px] text-slate-200 focus:outline-none"
          />
        </div>
        <div className="flex flex-col rounded border border-slate-300 bg-graphite-950 p-2 dark:border-graphite-700">
          <div className="mb-1 font-mono text-[10px] text-signal-green">FRAGMENT SHADER (GLSL 300 es)</div>
          <textarea
            value={fragmentCode}
            onChange={(e) => setShaderCode(vertexCode, e.target.value)}
            className="flex-1 resize-none bg-transparent font-mono text-[11px] text-slate-200 focus:outline-none"
          />
        </div>
      </div>
      <div className="rounded border border-slate-300 bg-white px-3 py-1.5 font-mono text-[11px] text-signal-green dark:border-graphite-700 dark:bg-graphite-900">
        {status} • Conceptual invocation trace explicitly labeled as simulated (physical GPU ISA registers are not exposed by WebGL2).
      </div>
    </div>
  );
};

export const FrameDebuggerLab: React.FC = () => {
  const { clock, selectedEventId, setSelectedEventId, breakpoints, toggleBreakpoint, setInspector } =
    useGpuLabStore();

  return (
    <div className="flex h-full flex-col gap-2 text-xs">
      <div className="flex items-center justify-between rounded border border-slate-300 bg-white px-3 py-2 font-mono text-[11px] dark:border-graphite-700 dark:bg-graphite-900">
        <span>Bounded Frame Event Log ({clock.events.length}/{clock.maxHistory} retained)</span>
        <span className="text-slate-400">Click red dot to toggle stage breakpoint</span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto rounded border border-slate-300 bg-white p-2 font-mono dark:border-graphite-700 dark:bg-graphite-900">
        {clock.events.map((ev) => (
          <div
            key={ev.id}
            onClick={() => {
              setSelectedEventId(ev.id);
              setInspector({
                kind: 'frame-event',
                id: String(ev.id),
                title: ev.label,
                subtitle: `Frame ${ev.frame} • +${ev.timestampMs} ms`,
                state: ev.type.toUpperCase(),
                origin: ev.origin,
                inputs: { Stage: ev.stageId, Component: ev.componentId },
                outputs: { Details: ev.details },
                config: { Breakpoint: String(Boolean(breakpoints[ev.stageId])) },
                history: [`Captured at Frame ${ev.frame}`],
                educationalExplanation:
                  'Frame debuggers capture draw and stage transitions so graphics engineers can inspect state at any point in the frame.'
              });
            }}
            className={`flex cursor-pointer items-center justify-between rounded border px-2 py-1 text-[11px] ${
              selectedEventId === ev.id
                ? 'border-signal-cyan bg-signal-cyan/10'
                : 'border-slate-200 dark:border-graphite-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBreakpoint(ev.stageId);
                }}
                title="Toggle Breakpoint"
                className={`h-2.5 w-2.5 rounded-full border ${
                  breakpoints[ev.stageId]
                    ? 'border-signal-red bg-signal-red'
                    : 'border-slate-500'
                }`}
              />
              <span className="text-slate-400">F{ev.frame}</span>
              <span className="text-signal-cyan">+{ev.timestampMs}ms</span>
              <span>{ev.label}</span>
            </div>
            <span className="truncate text-[10px] text-slate-400">{ev.details}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScenariosLab: React.FC = () => {
  const { setActiveNav, completedScenarios, markScenarioComplete } = useGpuLabStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const sc = LEARNING_SCENARIOS[activeIdx];

  return (
    <div className="grid h-full grid-cols-1 gap-2 lg:grid-cols-12">
      <div className="space-y-1 overflow-y-auto rounded border border-slate-300 bg-white p-2 lg:col-span-5 dark:border-graphite-700 dark:bg-graphite-900">
        {LEARNING_SCENARIOS.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveIdx(idx);
              setSelectedChoice(null);
            }}
            className={`flex w-full items-center justify-between rounded border px-2.5 py-1.5 text-left text-xs ${
              idx === activeIdx
                ? 'border-signal-cyan bg-signal-cyan/10 text-signal-cyan'
                : 'border-slate-200 dark:border-graphite-800'
            }`}
          >
            <span>
              {item.number}. {item.title}
            </span>
            {completedScenarios[item.id] && (
              <span className="font-mono text-[10px] text-signal-green">DONE</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 overflow-y-auto rounded border border-slate-300 bg-white p-3 text-xs lg:col-span-7 dark:border-graphite-700 dark:bg-graphite-900">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Lesson {sc.number}: {sc.title}
          </h3>
          <button
            onClick={() => setActiveNav(sc.targetLab)}
            className="rounded border border-signal-cyan px-2.5 py-1 font-mono text-[11px] text-signal-cyan"
          >
            Open {sc.targetLab} Lab →
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-300">{sc.objective}</p>
        <div className="rounded border border-slate-300 p-2 dark:border-graphite-700">
          <div className="mb-1 font-mono text-[10px] uppercase text-slate-500">Experiments</div>
          <ul className="list-disc space-y-1 pl-4">
            {sc.experiments.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
        <div className="rounded border border-slate-300 p-2 dark:border-graphite-700">
          <div className="mb-1 font-mono text-[10px] uppercase text-slate-500">Knowledge Check</div>
          <div className="mb-2 font-medium">{sc.question}</div>
          <div className="space-y-1">
            {sc.choices.map((c, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedChoice(idx);
                  if (idx === sc.correctChoiceIndex) markScenarioComplete(sc.id);
                }}
                className={`block w-full rounded border px-2 py-1 text-left ${
                  selectedChoice === idx
                    ? idx === sc.correctChoiceIndex
                      ? 'border-signal-green bg-signal-green/10 text-signal-green'
                      : 'border-signal-red bg-signal-red/10 text-signal-red'
                    : 'border-slate-300 dark:border-graphite-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {selectedChoice !== null && (
            <div className="mt-2 font-mono text-[11px] text-slate-400">{sc.answerExplanation}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LabWorkspace: React.FC = () => {
  const activeNav = useGpuLabStore((s) => s.activeNav);

  switch (activeNav) {
    case 'architecture':
      return <ArchitectureLab />;
    case 'pipeline':
      return <PipelineLab />;
    case 'compute':
      return <ComputeLab />;
    case 'rasterization':
      return <RasterizationLab />;
    case 'texture-memory':
      return <TextureMemoryLab />;
    case 'vram':
      return <VramLab />;
    case 'performance':
      return <PerformanceLab />;
    case 'shaders':
      return <ShaderLab />;
    case 'frame-debugger':
      return <FrameDebuggerLab />;
    case 'scenarios':
      return <ScenariosLab />;
    default:
      return <ArchitectureLab />;
  }
};
