import React, { useEffect } from 'react';
import { TopToolbar } from './components/TopToolbar';
import { SidebarNav } from './components/SidebarNav';
import { InspectorPanel } from './components/InspectorPanel';
import { LabWorkspace } from './labs/LabWorkspace';
import { useGpuLabStore } from './store/useGpuLabStore';
import { getProfileById, getTotalShaderCores, getTheoreticalPeakTflops } from './engine';
import type { NavSectionId } from './engine';

const SHORTCUT_MAP: Record<string, NavSectionId> = {
  '1': 'architecture',
  '2': 'pipeline',
  '3': 'compute',
  '4': 'rasterization',
  '5': 'texture-memory',
  '6': 'vram',
  '7': 'performance',
  '8': 'shaders',
  '9': 'frame-debugger',
  '0': 'scenarios'
};

export default function App() {
  const theme = useGpuLabStore((s) => s.theme);
  const running = useGpuLabStore((s) => s.clock.running);
  const speed = useGpuLabStore((s) => s.clock.speed);
  const stepSimulation = useGpuLabStore((s) => s.stepSimulation);
  const toggleRunning = useGpuLabStore((s) => s.toggleRunning);
  const resetSimulation = useGpuLabStore((s) => s.resetSimulation);
  const setActiveNav = useGpuLabStore((s) => s.setActiveNav);
  const profileId = useGpuLabStore((s) => s.profileId);

  const profile = getProfileById(profileId);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Native requestAnimationFrame-driven deterministic simulation loop
  useEffect(() => {
    if (!running) return;
    let rafId = 0;
    let lastTick = performance.now();
    const intervalMs = Math.max(120, 650 / Math.max(0.25, speed));

    const loop = (now: number) => {
      if (now - lastTick >= intervalMs) {
        lastTick = now;
        stepSimulation();
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [running, speed, stepSimulation]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggleRunning();
      } else if (e.key === '.') {
        stepSimulation();
      } else if (e.key.toLowerCase() === 'r') {
        resetSimulation();
      } else if (SHORTCUT_MAP[e.key]) {
        setActiveNav(SHORTCUT_MAP[e.key]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleRunning, stepSimulation, resetSimulation, setActiveNav]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-graphite-950 dark:text-slate-200">
      <TopToolbar />
      <div className="flex min-h-0 flex-1">
        <SidebarNav />
        <main className="min-w-0 flex-1 overflow-auto p-3">
          <LabWorkspace />
        </main>
        <InspectorPanel />
      </div>
      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-slate-300 bg-slate-100 px-3 font-mono text-[10px] text-slate-500 dark:border-graphite-700 dark:bg-graphite-900 dark:text-slate-400">
        <div>
          PROFILE: {profile.name} • {getTotalShaderCores(profile).toLocaleString()} Cores •{' '}
          {getTheoreticalPeakTflops(profile).toFixed(2)} TFLOPS (Theoretical)
        </div>
        <div className="hidden sm:block">
          Shortcuts: [Space] Play/Pause • [.] Step • [R] Reset • [1-0] Switch Labs
        </div>
      </footer>
    </div>
  );
}
