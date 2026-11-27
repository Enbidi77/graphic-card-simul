import { describe, expect, it } from 'vitest';
import {
  GPU_PROFILES,
  PIPELINE_STAGES,
  DEFAULT_RASTER_VERTICES,
  PERF_PRESETS,
  LEARNING_SCENARIOS,
  allocateVramBlock,
  appendBoundedEvents,
  calculateRenderTargetBytes,
  computeBarycentric,
  computePipelineStageStates,
  createDefaultVramAllocations,
  createInitialClock,
  estimatePerformance,
  generateProceduralTexture,
  getProfileById,
  getTotalShaderCores,
  mat4Perspective,
  ndcToViewport,
  perspectiveCorrectWeights,
  perspectiveDivide,
  rasterizeScene,
  resetClock,
  sampleTexture,
  simulateCacheHierarchy,
  simulateComputeDispatch,
  stepClock,
  summarizeVram,
  transformVec4
} from '../index';
import type { SceneConfig } from '../types';

const sampleScene: SceneConfig = {
  objects: [
    {
      id: 'cube-1',
      name: 'Calibration Cube',
      type: 'cube',
      position: [-1.4, 0.5, 0],
      rotation: [0, 0.4, 0],
      scale: [1, 1, 1],
      color: '#38bdf8',
      segments: 2,
      textured: true,
      visible: true
    },
    {
      id: 'sphere-1',
      name: 'Tessellated Sphere',
      type: 'sphere',
      position: [1.3, 0.6, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#f59e0b',
      segments: 16,
      textured: false,
      visible: true
    }
  ],
  selectedObjectId: 'cube-1',
  wireframe: false,
  texturesEnabled: true,
  lightingEnabled: true,
  shadowsEnabled: true,
  depthTestEnabled: true,
  autoRotate: true,
  lightDirection: [0.6, 0.9, 0.5]
};

describe('GPU Lab Simulation Engine', () => {
  it('computes GPU profile core totals accurately', () => {
    const mid = getProfileById('edu-desktop-mid');
    expect(getTotalShaderCores(mid)).toBe(4 * 8 * 64);
    expect(GPU_PROFILES.length).toBeGreaterThanOrEqual(4);
  });

  it('handles simulation clock step, wrap, reset, and bounded history', () => {
    let clock = createInitialClock(5);
    expect(clock.frame).toBe(1);
    expect(clock.activeStageId).toBe(1);

    for (let i = 0; i < 13; i++) {
      clock = stepClock(clock, 13, 1.0);
    }
    expect(clock.frame).toBe(2);
    expect(clock.activeStageId).toBe(1);
    expect(clock.simTimeMs).toBe(13);

    const dummyEvents = Array.from({ length: 10 }, (_, idx) => ({
      id: idx + 1,
      frame: 1,
      timestampMs: idx * 0.5,
      stageId: 1,
      type: 'stage' as const,
      label: `Event ${idx}`,
      componentId: 'cmd-processor',
      details: 'test',
      origin: 'simulated' as const
    }));
    clock = appendBoundedEvents(clock, dummyEvents);
    expect(clock.events.length).toBe(5);
    expect(clock.events[0].id).toBe(6);

    const reset = resetClock(5);
    expect(reset.frame).toBe(1);
    expect(reset.simTimeMs).toBe(0);
    expect(reset.events.length).toBe(0);
  });

  it('transitions all 13 pipeline stages deterministically', () => {
    const profile = getProfileById('edu-desktop-mid');
    const states = computePipelineStageStates(8, sampleScene, profile);
    expect(PIPELINE_STAGES.length).toBe(13);
    expect(states.filter((s) => s.status === 'completed').length).toBe(7);
    expect(states[7].status).toBe('active');
    expect(states.filter((s) => s.status === 'idle').length).toBe(5);
  });

  it('performs coordinate transformations and perspective divide accurately', () => {
    const proj = mat4Perspective(Math.PI / 2, 1.0, 0.1, 100);
    const clip = transformVec4(proj, { x: 1, y: 1, z: -2, w: 1 });
    expect(clip.w).toBeCloseTo(2, 4);
    const ndc = perspectiveDivide(clip);
    expect(ndc.x).toBeCloseTo(0.5, 4);
    expect(ndc.y).toBeCloseTo(0.5, 4);
    const vp = ndcToViewport(ndc, 1000, 1000);
    expect(vp.x).toBeCloseTo(750, 2);
    expect(vp.y).toBeCloseTo(250, 2);
  });

  it('computes barycentric and perspective-correct weights accurately', () => {
    const b = computeBarycentric(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: 2.5, y: 2.5 }
    );
    expect(b.l0 + b.l1 + b.l2).toBeCloseTo(1, 5);
    expect(b.l0).toBeCloseTo(0.5, 4);
    expect(b.l1).toBeCloseTo(0.25, 4);
    expect(b.l2).toBeCloseTo(0.25, 4);

    const pc = perspectiveCorrectWeights(0.5, 0.25, 0.25, 1.0, 2.0, 2.0);
    expect(pc[0]).toBeGreaterThan(0.5);
    expect(pc[0] + pc[1] + pc[2]).toBeCloseTo(1, 5);
  });

  it('rasterizes triangles deterministically with depth test and MSAA', () => {
    const res1x = rasterizeScene({
      resolution: 16,
      perspectiveCorrect: true,
      backfaceCulling: true,
      scissorEnabled: false,
      scissorRect: { x: 0, y: 0, w: 16, h: 16 },
      msaa4x: false,
      depthTest: true,
      wireframeOverlay: true,
      pixelGrid: true,
      triangleCount: 2,
      vertices: DEFAULT_RASTER_VERTICES
    });
    const res4x = rasterizeScene({
      resolution: 16,
      perspectiveCorrect: true,
      backfaceCulling: true,
      scissorEnabled: false,
      scissorRect: { x: 0, y: 0, w: 16, h: 16 },
      msaa4x: true,
      depthTest: true,
      wireframeOverlay: true,
      pixelGrid: true,
      triangleCount: 2,
      vertices: DEFAULT_RASTER_VERTICES
    });
    expect(res1x.totalCoveredPixels).toBeGreaterThan(20);
    expect(res1x.depthRejectedCount).toBeGreaterThan(0);
    expect(res4x.sampleEvaluations).toBeGreaterThan(res1x.sampleEvaluations * 3);
  });

  it('samples textures in nearest, bilinear, and mipmap modes', () => {
    const tex = generateProceduralTexture(16);
    const nearest = sampleTexture(tex, 16, 0.35, 0.45, 'nearest', 1);
    const bilinear = sampleTexture(tex, 16, 0.35, 0.45, 'bilinear', 1);
    const mip = sampleTexture(tex, 16, 0.35, 0.45, 'mipmap-bilinear', 8);

    expect(nearest.texelCoords.length).toBe(1);
    expect(bilinear.texelCoords.length).toBe(4);
    expect(mip.mipLevel).toBe(3);
  });

  it('models cache hit/miss differences between linear and random access', () => {
    const base = {
      l1SizeKiB: 16,
      l2SizeKiB: 128,
      lineSizeBytes: 64,
      accessCount: 256,
      strideBytes: 128,
      registerLatency: 1,
      sharedLatency: 24,
      l1Latency: 32,
      l2Latency: 160,
      vramLatency: 420,
      busBandwidthGBs: 448
    };
    const linear = simulateCacheHierarchy({ ...base, pattern: 'linear' });
    const random = simulateCacheHierarchy({ ...base, pattern: 'random' });

    expect(linear.l1HitRate).toBeGreaterThan(80);
    expect(random.l1HitRate).toBeLessThan(linear.l1HitRate);
    expect(random.averageLatencyCycles).toBeGreaterThan(linear.averageLatencyCycles);
  });

  it('computes workgroup indexing, divergence, and coalescing accurately', () => {
    const profile = getProfileById('edu-desktop-mid');
    const uniform = simulateComputeDispatch(
      {
        dispatchX: 4,
        dispatchY: 2,
        workgroupX: 8,
        workgroupY: 8,
        warpSize: 32,
        registersPerThread: 32,
        sharedMemPerGroupKiB: 8,
        branchDivergenceMode: 'uniform',
        memoryAccessMode: 'coalesced',
        barrierEnabled: false
      },
      profile
    );
    const diverged = simulateComputeDispatch(
      {
        dispatchX: 4,
        dispatchY: 2,
        workgroupX: 8,
        workgroupY: 8,
        warpSize: 32,
        registersPerThread: 32,
        sharedMemPerGroupKiB: 8,
        branchDivergenceMode: 'half-warp',
        memoryAccessMode: 'uncoalesced',
        barrierEnabled: false
      },
      profile
    );

    expect(uniform.totalThreads).toBe(512);
    expect(uniform.warpsPerWorkgroup).toBe(2);
    expect(uniform.branchEfficiencyPct).toBe(100);
    expect(diverged.branchEfficiencyPct).toBe(50);
    expect(diverged.memoryTransactionsPerWarp).toBeGreaterThan(uniform.memoryTransactionsPerWarp);
  });

  it('accounts for VRAM allocations and 4K vs 1080p render target scaling', () => {
    const rt1080 = calculateRenderTargetBytes(1920, 1080, 4, 1, 1);
    const rt4k = calculateRenderTargetBytes(3840, 2160, 4, 1, 1);
    expect(rt4k).toBe(rt1080 * 4);

    const allocs = createDefaultVramAllocations(1920, 1080, 1);
    const extended = allocateVramBlock(allocs, 'Extra RT', 'color-rt', rt4k, 'RGBA8', '3840x2160');
    const sumBefore = summarizeVram(allocs, 512);
    const sumAfter = summarizeVram(extended, 512);
    expect(sumAfter.usedBytes).toBeGreaterThan(sumBefore.usedBytes);
  });

  it('diagnoses distinct bottlenecks in the performance model', () => {
    const cpu = estimatePerformance(PERF_PRESETS.cpuBound);
    const vert = estimatePerformance(PERF_PRESETS.vertexBound);
    const frag = estimatePerformance(PERF_PRESETS.fragmentBound);
    const mem = estimatePerformance(PERF_PRESETS.memoryBound);

    expect(cpu.bottleneck).toBe('CPU Submission');
    expect(vert.bottleneck).toBe('Vertex Processing');
    expect(frag.bottleneck).toBe('Fragment Shading');
    expect(mem.bottleneck).toBe('Memory / Texture Bandwidth');
    expect(LEARNING_SCENARIOS.length).toBe(14);
  });
});
