import React from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Sun,
  Moon,
  Cpu,
  Sliders
} from 'lucide-react';
import { GPU_PROFILES } from '../engine';
import type { SimulationMode } from '../engine';
import { useGpuLabStore } from '../store/useGpuLabStore';

export const TopToolbar: React.FC = () => {
  const {
    theme,
    setTheme,
    profileId,
    setProfileId,
    simMode,
    setSimMode,
    clock,
    toggleRunning,
    stepSimulation,
    resetSimulation,
    setSpeed,
    lowDetailMode,
    setLowDetailMode
  } = useGpuLabStore();

  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-slate-300 bg-slate-100 px-3 text-xs dark:border-graphite-700 dark:bg-graphite-900">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          <Cpu className="h-4 w-4 text-signal-cyan" />
          <span>GPU Lab</span>
          <span className="rounded border border-slate-300 px-1 py-0.5 font-mono text-[10px] text-slate-500 dark:border-graphite-700 dark:text-slate-400">
            SIM v1.0
          </span>
        </div>

        <select
          aria-label="GPU Profile"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] dark:border-graphite-700 dark:bg-graphite-850"
        >
          {GPU_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Simulation Mode"
          value={simMode}
          onChange={(e) => setSimMode(e.target.value as SimulationMode)}
          className="hidden rounded border border-slate-300 bg-white px-2 py-1 font-mono text-[11px] md:block dark:border-graphite-700 dark:bg-graphite-850"
        >
          <option value="graphics-pipeline">Mode: Graphics Pipeline</option>
          <option value="compute-dispatch">Mode: Compute Dispatch</option>
          <option value="memory-trace">Mode: Memory Trace</option>
          <option value="frame-capture">Mode: Frame Capture</option>
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleRunning}
          title="Play / Pause (Space)"
          className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 font-medium hover:border-signal-cyan dark:border-graphite-700 dark:bg-graphite-850"
        >
          {clock.running ? (
            <Pause className="h-3.5 w-3.5 text-signal-amber" />
          ) : (
            <Play className="h-3.5 w-3.5 text-signal-green" />
          )}
          <span>{clock.running ? 'Pause' : 'Run'}</span>
        </button>

        <button
          onClick={stepSimulation}
          title="Step Forward (.)"
          className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 hover:border-signal-cyan dark:border-graphite-700 dark:bg-graphite-850"
        >
          <StepForward className="h-3.5 w-3.5 text-signal-cyan" />
          <span>Step</span>
        </button>

        <button
          onClick={resetSimulation}
          title="Reset Simulation (R)"
          className="rounded border border-slate-300 bg-white p-1 hover:border-signal-amber dark:border-graphite-700 dark:bg-graphite-850"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <select
          aria-label="Simulation Speed"
          value={clock.speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="rounded border border-slate-300 bg-white px-1.5 py-1 font-mono text-[11px] dark:border-graphite-700 dark:bg-graphite-850"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1.0×</option>
          <option value={2}>2.0×</option>
          <option value={4}>4.0×</option>
        </select>

        <div className="hidden items-center gap-2 rounded border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-[11px] lg:flex dark:border-graphite-700 dark:bg-graphite-950">
          <span className="text-slate-500">FRM</span>
          <span className="text-signal-cyan">{String(clock.frame).padStart(4, '0')}</span>
          <span className="text-slate-500">STG</span>
          <span className="text-signal-green">{clock.activeStageId}/13</span>
          <span className="text-slate-500">T</span>
          <span>{clock.simTimeMs.toFixed(1)}ms</span>
        </div>

        <button
          onClick={() => setLowDetailMode(!lowDetailMode)}
          title="Toggle Low-Detail Mode"
          className={`rounded border px-2 py-1 font-mono text-[10px] ${
            lowDetailMode
              ? 'border-signal-amber text-signal-amber'
              : 'border-slate-300 text-slate-500 dark:border-graphite-700 dark:text-slate-400'
          }`}
        >
          <Sliders className="inline h-3 w-3 mr-1" />
          {lowDetailMode ? 'LD' : 'HD'}
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Theme"
          className="rounded border border-slate-300 bg-white p-1 dark:border-graphite-700 dark:bg-graphite-850"
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
};
