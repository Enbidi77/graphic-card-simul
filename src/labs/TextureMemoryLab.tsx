import React, { useMemo } from 'react';
import {
  generateProceduralTexture,
  sampleTexture,
  simulateCacheHierarchy
} from '../engine';
import type { AccessPattern, FilterMode } from '../engine';
import { useGpuLabStore } from '../store/useGpuLabStore';

export const TextureMemoryLab: React.FC = () => {
  const textureMode = useGpuLabStore((s) => s.textureMode);
  const setTextureMode = useGpuLabStore((s) => s.setTextureMode);
  const sampleUv = useGpuLabStore((s) => s.sampleUv);
  const setSampleUv = useGpuLabStore((s) => s.setSampleUv);
  const texFootprint = useGpuLabStore((s) => s.texFootprint);
  const setTexFootprint = useGpuLabStore((s) => s.setTexFootprint);
  const cacheConfig = useGpuLabStore((s) => s.cacheConfig);
  const updateCacheConfig = useGpuLabStore((s) => s.updateCacheConfig);

  const tex = useMemo(() => generateProceduralTexture(16), []);
  const texSample = useMemo(
    () => sampleTexture(tex, 16, sampleUv[0], sampleUv[1], textureMode, texFootprint),
    [tex, sampleUv, textureMode, texFootprint]
  );
  const cacheRes = useMemo(() => simulateCacheHierarchy(cacheConfig), [cacheConfig]);

  return (
    <div className="grid h-full grid-cols-1 gap-2 lg:grid-cols-12">
      <div className="flex flex-col gap-2 rounded border border-slate-300 bg-white p-3 text-xs lg:col-span-5 dark:border-graphite-700 dark:bg-graphite-900">
        <h3 className="font-semibold">Texture Sampling Unit [simulated]</h3>
        <div className="flex flex-wrap gap-2 font-mono text-[11px]">
          <select
            value={textureMode}
            onChange={(e) => setTextureMode(e.target.value as FilterMode)}
            className="rounded border border-slate-300 bg-transparent px-2 py-1 dark:border-graphite-700"
          >
            <option value="nearest">Nearest-Neighbor</option>
            <option value="bilinear">Bilinear (4-tap)</option>
            <option value="mipmap-bilinear">Mipmap + Bilinear</option>
          </select>
        </div>
        <label className="font-mono text-[11px]">
          U: {sampleUv[0].toFixed(2)}
          <input
            className="w-full"
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={sampleUv[0]}
            onChange={(e) => setSampleUv([Number(e.target.value), sampleUv[1]])}
          />
        </label>
        <label className="font-mono text-[11px]">
          V: {sampleUv[1].toFixed(2)}
          <input
            className="w-full"
            type="range"
            min={0}
            max={0.99}
            step={0.01}
            value={sampleUv[1]}
            onChange={(e) => setSampleUv([sampleUv[0], Number(e.target.value)])}
          />
        </label>
        <label className="font-mono text-[11px]">
          Pixel Footprint: {texFootprint.toFixed(1)} texels (LOD {texSample.mipLevel})
          <input
            className="w-full"
            type="range"
            min={1}
            max={16}
            step={0.5}
            value={texFootprint}
            onChange={(e) => setTexFootprint(Number(e.target.value))}
          />
        </label>
        <div className="flex items-center gap-3 rounded border border-slate-300 p-2 font-mono text-[11px] dark:border-graphite-700">
          <div
            className="h-10 w-10 rounded border border-slate-500"
            style={{ backgroundColor: `rgb(${texSample.r},${texSample.g},${texSample.b})` }}
          />
          <div>
            <div>RGB({texSample.r}, {texSample.g}, {texSample.b})</div>
            <div className="text-slate-400">
              Taps: {texSample.texelCoords.length} • Mip: {texSample.mipLevel}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded border border-slate-300 bg-white p-3 text-xs lg:col-span-7 dark:border-graphite-700 dark:bg-graphite-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Cache Hierarchy & Address Timeline [simulated]</h3>
          <select
            value={cacheConfig.pattern}
            onChange={(e) => updateCacheConfig({ pattern: e.target.value as AccessPattern })}
            className="rounded border border-slate-300 bg-transparent px-2 py-0.5 font-mono text-[11px] dark:border-graphite-700"
          >
            <option value="linear">Pattern: Linear (+4B)</option>
            <option value="tiled-2d">Pattern: 2D Tiled</option>
            <option value="strided">Pattern: Strided ({cacheConfig.strideBytes}B)</option>
            <option value="random">Pattern: Random Scatter</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-[11px] sm:grid-cols-4">
          <div className="rounded border border-slate-300 p-2 dark:border-graphite-700">
            <div className="text-[10px] text-slate-500">L1 HIT RATE</div>
            <div className="text-sm text-signal-green">{cacheRes.l1HitRate.toFixed(1)}%</div>
          </div>
          <div className="rounded border border-slate-300 p-2 dark:border-graphite-700">
            <div className="text-[10px] text-slate-500">VRAM MISSES</div>
            <div className="text-sm text-signal-red">{cacheRes.vramAccesses}</div>
          </div>
          <div className="rounded border border-slate-300 p-2 dark:border-graphite-700">
            <div className="text-[10px] text-slate-500">AVG LATENCY</div>
            <div className="text-sm text-signal-amber">{cacheRes.averageLatencyCycles} cyc</div>
          </div>
          <div className="rounded border border-slate-300 p-2 dark:border-graphite-700">
            <div className="text-[10px] text-slate-500">BYTES XFER</div>
            <div className="text-sm text-signal-cyan">
              {(cacheRes.estimatedBytesTransferred / 1024).toFixed(1)} KiB
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded border border-slate-300 bg-graphite-950 p-2 dark:border-graphite-700">
          {cacheRes.timeline.map((rec) => (
            <div
              key={rec.index}
              title={`#${rec.index} 0x${rec.address.toString(16)} → ${rec.tier} (${rec.latencyCycles} cyc)`}
              className={`h-4 w-2 rounded-sm ${
                rec.tier === 'L1'
                  ? 'bg-signal-green'
                  : rec.tier === 'L2'
                    ? 'bg-signal-amber'
                    : 'bg-signal-red'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
