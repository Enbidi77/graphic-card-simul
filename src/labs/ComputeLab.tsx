import React from 'react';
import { getProfileById, simulateComputeDispatch } from '../engine';
import { useGpuLabStore } from '../store/useGpuLabStore';

export const ComputeLab: React.FC = () => {
  const compute = useGpuLabStore((s) => s.compute);
  const updateCompute = useGpuLabStore((s) => s.updateCompute);
  const profileId = useGpuLabStore((s) => s.profileId);
  const setInspector = useGpuLabStore((s) => s.setInspector);

  const profile = getProfileById(profileId);
  const res = simulateComputeDispatch(compute, profile);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="grid grid-cols-2 gap-2 rounded border border-slate-300 bg-white p-2.5 text-xs md:grid-cols-4 dark:border-graphite-700 dark:bg-graphite-900">
        <label className="flex flex-col gap-1 font-mono text-[11px]">
          Dispatch Grid: {compute.dispatchX}×{compute.dispatchY}
          <input
            type="range"
            min={1}
            max={16}
            value={compute.dispatchX}
            onChange={(e) =>
              updateCompute({ dispatchX: Number(e.target.value), dispatchY: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-[11px]">
          Workgroup: {compute.workgroupX}×{compute.workgroupY}
          <input
            type="range"
            min={4}
            max={16}
            step={4}
            value={compute.workgroupX}
            onChange={(e) =>
              updateCompute({ workgroupX: Number(e.target.value), workgroupY: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-[11px]">
          Regs/Thread: {compute.registersPerThread}
          <input
            type="range"
            min={16}
            max={128}
            step={8}
            value={compute.registersPerThread}
            onChange={(e) => updateCompute({ registersPerThread: Number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-[11px]">
          Branch Pattern
          <select
            value={compute.branchDivergenceMode}
            onChange={(e) =>
              updateCompute({
                branchDivergenceMode: e.target.value as 'uniform' | 'half-warp' | 'checkerboard'
              })
            }
            className="rounded border border-slate-300 bg-transparent px-1 py-0.5 dark:border-graphite-700"
          >
            <option value="uniform">Uniform (100% eff)</option>
            <option value="half-warp">Half-Warp Divergent</option>
            <option value="checkerboard">Checkerboard Divergent</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs md:grid-cols-5">
        <div className="rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-900">
          <div className="text-[10px] text-slate-500">TOTAL THREADS</div>
          <div className="text-sm text-signal-cyan">{res.totalThreads.toLocaleString()}</div>
        </div>
        <div className="rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-900">
          <div className="text-[10px] text-slate-500">OCCUPANCY (EST)</div>
          <div className="text-sm text-signal-green">{res.theoreticalOccupancyPct}%</div>
          <div className="text-[10px] text-slate-400">Limiter: {res.occupancyLimiter}</div>
        </div>
        <div className="rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-900">
          <div className="text-[10px] text-slate-500">BRANCH EFFICIENCY</div>
          <div className="text-sm text-signal-amber">{res.branchEfficiencyPct}%</div>
        </div>
        <div className="rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-900">
          <div className="text-[10px] text-slate-500">COALESCING</div>
          <div className="text-sm">{res.coalescingEfficiencyPct}%</div>
          <div className="text-[10px] text-slate-400">{res.memoryTransactionsPerWarp} tx/warp</div>
        </div>
        <div className="rounded border border-slate-300 bg-white p-2 dark:border-graphite-700 dark:bg-graphite-900">
          <div className="text-[10px] text-slate-500">EFFECTIVE SIMT</div>
          <div className="text-sm text-signal-cyan">{res.effectiveThroughputPct}%</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded border border-slate-300 bg-white p-3 dark:border-graphite-700 dark:bg-graphite-900">
        <div className="mb-2 flex items-center justify-between font-mono text-[11px]">
          <span>Workgroup (0,0) Thread Invocations — Click any thread to inspect</span>
          <select
            value={compute.memoryAccessMode}
            onChange={(e) =>
              updateCompute({
                memoryAccessMode: e.target.value as 'coalesced' | 'strided-4' | 'uncoalesced'
              })
            }
            className="rounded border border-slate-300 bg-transparent px-1.5 py-0.5 dark:border-graphite-700"
          >
            <option value="coalesced">Memory: Coalesced (+4B)</option>
            <option value="strided-4">Memory: Strided (+16B)</option>
            <option value="uncoalesced">Memory: Uncoalesced Scatter</option>
          </select>
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${Math.min(compute.workgroupX, 16)}, minmax(0, 1fr))` }}
        >
          {res.sampleThreads.map((t) => (
            <button
              key={t.linearLocalId}
              onClick={() =>
                setInspector({
                  kind: 'thread',
                  id: `t-${t.linearLocalId}`,
                  title: `Thread (${t.localId[0]}, ${t.localId[1]})`,
                  subtitle: `Workgroup (0,0) • Warp ${t.warpId} Lane ${t.laneId}`,
                  state: t.status.toUpperCase(),
                  origin: 'simulated',
                  inputs: {
                    GlobalID: `(${t.globalId[0]}, ${t.globalId[1]})`,
                    LocalID: `(${t.localId[0]}, ${t.localId[1]})`
                  },
                  outputs: {
                    Branch: `Path ${t.branchTaken}`,
                    WarpLane: `${t.warpId}:${t.laneId}`
                  },
                  config: {
                    WarpSize: profile.warpSize,
                    Registers: compute.registersPerThread
                  },
                  memoryAddress: `0x${t.memoryAddress.toString(16).toUpperCase()}`,
                  history: [`Dispatched to SM`, `Branch ${t.branchTaken} executed`],
                  educationalExplanation:
                    'SIMT warps execute one instruction across all lanes simultaneously. Divergent lanes are masked until paths reconverge.'
                })
              }
              className={`rounded border py-1 font-mono text-[10px] ${
                t.branchTaken === 'A'
                  ? 'border-signal-cyan/50 bg-signal-cyan/10 text-signal-cyan'
                  : 'border-signal-amber/60 bg-signal-amber/15 text-signal-amber'
              }`}
            >
              W{t.warpId}:{t.laneId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
