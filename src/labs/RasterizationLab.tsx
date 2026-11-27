import React, { useMemo } from 'react';
import { rasterizeScene } from '../engine';
import { useGpuLabStore } from '../store/useGpuLabStore';

export const RasterizationLab: React.FC = () => {
  const raster = useGpuLabStore((s) => s.raster);
  const updateRaster = useGpuLabStore((s) => s.updateRaster);
  const setInspector = useGpuLabStore((s) => s.setInspector);

  const result = useMemo(() => rasterizeScene(raster), [raster]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3 rounded border border-slate-300 bg-white px-3 py-2 font-mono text-[11px] dark:border-graphite-700 dark:bg-graphite-900">
        <label className="flex items-center gap-1.5">
          Res: {raster.resolution}×{raster.resolution}
          <input
            type="range"
            min={8}
            max={36}
            step={4}
            value={raster.resolution}
            onChange={(e) => updateRaster({ resolution: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={raster.perspectiveCorrect}
            onChange={(e) => updateRaster({ perspectiveCorrect: e.target.checked })}
          />
          Perspective-Correct
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={raster.msaa4x}
            onChange={(e) => updateRaster({ msaa4x: e.target.checked })}
          />
          4× MSAA
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={raster.depthTest}
            onChange={(e) => updateRaster({ depthTest: e.target.checked })}
          />
          Depth Test
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={raster.backfaceCulling}
            onChange={(e) => updateRaster({ backfaceCulling: e.target.checked })}
          />
          Back-Face Cull
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={raster.scissorEnabled}
            onChange={(e) => updateRaster({ scissorEnabled: e.target.checked })}
          />
          Scissor
        </label>
        <button
          onClick={() => updateRaster({ triangleCount: raster.triangleCount === 1 ? 2 : 1 })}
          className="rounded border border-slate-300 px-2 py-0.5 dark:border-graphite-700"
        >
          Triangles: {raster.triangleCount}
        </button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-2 lg:grid-cols-12">
        <div className="flex items-center justify-center rounded border border-slate-300 bg-graphite-950 p-3 lg:col-span-8 dark:border-graphite-700">
          <div
            className="grid aspect-square w-full max-w-[440px] border border-graphite-700"
            style={{ gridTemplateColumns: `repeat(${result.resolution}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: result.resolution * result.resolution }, (_, idx) => {
              const px = idx % result.resolution;
              const py = Math.floor(idx / result.resolution);
              const frag = result.pixelMap.get(`${px},${py}`);
              const bg = frag
                ? `rgba(${Math.round(frag.color[0] * 255)}, ${Math.round(
                    frag.color[1] * 255
                  )}, ${Math.round(frag.color[2] * 255)}, ${0.3 + 0.7 * frag.sampleCoverage})`
                : 'transparent';
              return (
                <button
                  key={`${px}-${py}`}
                  onClick={() => {
                    if (!frag) return;
                    setInspector({
                      kind: 'pixel',
                      id: `px-${px}-${py}`,
                      title: `Pixel (${px}, ${py})`,
                      subtitle: `Triangle #${frag.triangleIndex} • Coverage ${(frag.sampleCoverage * 100).toFixed(0)}%`,
                      state: 'FRAGMENT GENERATED',
                      origin: 'simulated',
                      inputs: {
                        Barycentric: frag.barycentric.map((v) => v.toFixed(3)).join(', '),
                        DepthZ: frag.depth.toFixed(4)
                      },
                      outputs: {
                        UV: `(${frag.uv[0].toFixed(3)}, ${frag.uv[1].toFixed(3)})`,
                        RGB: frag.color.map((c) => Math.round(c * 255)).join(', ')
                      },
                      config: {
                        PerspectiveCorrect: String(raster.perspectiveCorrect),
                        SampleMask: frag.sampleMask.map((m) => (m ? '1' : '0')).join('')
                      },
                      history: ['Edge Function Passed', 'Interpolated Attributes'],
                      educationalExplanation:
                        'Barycentric coordinates (λ0, λ1, λ2) weight vertex attributes across the triangle. Perspective correction divides by clip-space w.'
                    });
                  }}
                  style={{ backgroundColor: bg }}
                  className="aspect-square border border-slate-800/40 hover:outline hover:outline-1 hover:outline-signal-cyan"
                  title={frag ? `(${px},${py}) z=${frag.depth.toFixed(3)}` : `(${px},${py}) empty`}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-2 rounded border border-slate-300 bg-white p-3 font-mono text-xs lg:col-span-4 dark:border-graphite-700 dark:bg-graphite-900">
          <div className="text-[11px] font-semibold uppercase text-slate-500">
            Rasterization Counters [simulated]
          </div>
          <div className="flex justify-between">
            <span>Covered Pixels</span>
            <span className="text-signal-cyan">{result.totalCoveredPixels}</span>
          </div>
          <div className="flex justify-between">
            <span>Generated Fragments</span>
            <span className="text-signal-green">{result.totalGeneratedFragments}</span>
          </div>
          <div className="flex justify-between">
            <span>Depth Rejected</span>
            <span className="text-signal-amber">{result.depthRejectedCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Scissor Rejected</span>
            <span>{result.scissorRejectedCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Sample Evaluations</span>
            <span>{result.sampleEvaluations}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
