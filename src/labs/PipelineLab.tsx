import React from 'react';
import {
  PIPELINE_STAGES,
  computePipelineStageStates,
  estimateSceneMetrics,
  getProfileById
} from '../engine';
import { SceneViewport3D } from '../components/SceneViewport3D';
import { useGpuLabStore } from '../store/useGpuLabStore';

export const PipelineLab: React.FC = () => {
  const {
    scene,
    updateScene,
    addSceneObject,
    removeSceneObject,
    updateSceneObject,
    profileId,
    clock,
    setInspector
  } = useGpuLabStore();

  const profile = getProfileById(profileId);
  const stageStates = computePipelineStageStates(clock.activeStageId, scene, profile);
  const metrics = estimateSceneMetrics(scene);
  const selectedObj = scene.objects.find((o) => o.id === scene.selectedObjectId);

  return (
    <div className="grid h-full grid-cols-1 gap-2 lg:grid-cols-12">
      <div className="flex flex-col gap-2 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs dark:border-graphite-700 dark:bg-graphite-900">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => addSceneObject('cube')}
              className="rounded border border-slate-300 px-2 py-0.5 hover:border-signal-cyan dark:border-graphite-700"
            >
              + Cube
            </button>
            <button
              onClick={() => addSceneObject('sphere')}
              className="rounded border border-slate-300 px-2 py-0.5 hover:border-signal-cyan dark:border-graphite-700"
            >
              + Sphere
            </button>
            <label className="flex items-center gap-1 font-mono text-[11px]">
              <input
                type="checkbox"
                checked={scene.wireframe}
                onChange={(e) => updateScene({ wireframe: e.target.checked })}
              />
              Wireframe
            </label>
            <label className="flex items-center gap-1 font-mono text-[11px]">
              <input
                type="checkbox"
                checked={scene.texturesEnabled}
                onChange={(e) => updateScene({ texturesEnabled: e.target.checked })}
              />
              Textures
            </label>
            <label className="flex items-center gap-1 font-mono text-[11px]">
              <input
                type="checkbox"
                checked={scene.lightingEnabled}
                onChange={(e) => updateScene({ lightingEnabled: e.target.checked })}
              />
              Lighting
            </label>
            <label className="flex items-center gap-1 font-mono text-[11px]">
              <input
                type="checkbox"
                checked={scene.depthTestEnabled}
                onChange={(e) => updateScene({ depthTestEnabled: e.target.checked })}
              />
              Depth Test
            </label>
          </div>
          <span className="font-mono text-[11px] text-signal-cyan">
            {metrics.drawCalls} Draws • {metrics.totalTriangles.toLocaleString()} Tris
          </span>
        </div>

        <div className="min-h-[260px] flex-1 overflow-hidden rounded border border-slate-300 dark:border-graphite-700">
          <SceneViewport3D />
        </div>

        {selectedObj && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-300 bg-white px-3 py-1.5 font-mono text-[11px] dark:border-graphite-700 dark:bg-graphite-900">
            <span>Selected: {selectedObj.name}</span>
            <label className="flex items-center gap-2">
              Segments: {selectedObj.segments}
              <input
                type="range"
                min={1}
                max={36}
                value={selectedObj.segments}
                onChange={(e) =>
                  updateSceneObject(selectedObj.id, { segments: Number(e.target.value) })
                }
              />
            </label>
            <button
              onClick={() => removeSceneObject(selectedObj.id)}
              className="rounded border border-signal-red/50 px-2 py-0.5 text-signal-red"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto rounded border border-slate-300 bg-white p-2.5 lg:col-span-5 dark:border-graphite-700 dark:bg-graphite-900">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            13-Stage Graphics Pipeline [simulated]
          </h3>
          <span className="font-mono text-[11px] text-signal-green">
            Active: Stage {clock.activeStageId}
          </span>
        </div>
        <div className="space-y-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const st = stageStates[i];
            const isCurrent = st.status === 'active';
            const isDone = st.status === 'completed';
            return (
              <button
                key={stage.id}
                onClick={() =>
                  setInspector({
                    kind: 'pipeline-stage',
                    id: stage.key,
                    title: stage.name,
                    subtitle: `${stage.domain} • ${stage.programmable ? 'Programmable Shader' : 'Fixed-Function'}`,
                    state: st.status.toUpperCase(),
                    origin: 'simulated',
                    inputs: { [stage.inputsLabel]: st.inputSummary },
                    outputs: { [stage.outputsLabel]: st.outputSummary },
                    config: {
                      Invocations: st.invocations.toLocaleString(),
                      ModeledCycles: st.cyclesSimulated.toLocaleString()
                    },
                    history: [`Frame ${clock.frame}`, `Components: ${stage.activeComponents.join(', ')}`],
                    educationalExplanation: stage.educationalNote
                  })
                }
                className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-xs ${
                  isCurrent
                    ? 'border-signal-cyan bg-signal-cyan/10 text-signal-cyan'
                    : isDone
                      ? 'border-signal-green/40 bg-signal-green/5'
                      : 'border-slate-300 dark:border-graphite-700'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{stage.name}</div>
                  <div className="truncate font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {st.inputSummary} → {st.outputSummary}
                  </div>
                </div>
                <span className="ml-2 shrink-0 font-mono text-[10px]">
                  {st.invocations.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
