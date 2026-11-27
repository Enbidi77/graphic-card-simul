import type { PerfEstimate, PerfWorkloadConfig } from './types';

export const PERF_PRESETS: Record<string, PerfWorkloadConfig> = {
  balanced: {
    name: 'Balanced 1080p Scene',
    width: 1920,
    height: 1080,
    objectCount: 40,
    trianglesPerObject: 2500,
    drawCalls: 40,
    shaderOpsPerPixel: 48,
    textureSize: 1024,
    overdrawFactor: 1.6,
    branchDivergencePct: 10,
    memoryBandwidthGBs: 448,
    computeThroughputGFlops: 14000,
    msaaSamples: 1
  },
  vertexBound: {
    name: 'Vertex / Excessive Geometry',
    width: 1920,
    height: 1080,
    objectCount: 24,
    trianglesPerObject: 180000,
    drawCalls: 24,
    shaderOpsPerPixel: 32,
    textureSize: 1024,
    overdrawFactor: 1.2,
    branchDivergencePct: 5,
    memoryBandwidthGBs: 448,
    computeThroughputGFlops: 14000,
    msaaSamples: 1
  },
  fragmentBound: {
    name: 'Fragment & 4K Shader Heavy',
    width: 3840,
    height: 2160,
    objectCount: 30,
    trianglesPerObject: 2000,
    drawCalls: 30,
    shaderOpsPerPixel: 360,
    textureSize: 2048,
    overdrawFactor: 2.8,
    branchDivergencePct: 45,
    memoryBandwidthGBs: 448,
    computeThroughputGFlops: 14000,
    msaaSamples: 4
  },
  highOverdraw: {
    name: 'High Overdraw (Transparent Stack)',
    width: 2560,
    height: 1440,
    objectCount: 25,
    trianglesPerObject: 400,
    drawCalls: 25,
    shaderOpsPerPixel: 110,
    textureSize: 2048,
    overdrawFactor: 8.5,
    branchDivergencePct: 15,
    memoryBandwidthGBs: 320,
    computeThroughputGFlops: 14000,
    msaaSamples: 1
  },
  memoryBound: {
    name: 'Texture & Memory Bandwidth Pressure',
    width: 3840,
    height: 2160,
    objectCount: 40,
    trianglesPerObject: 1500,
    drawCalls: 40,
    shaderOpsPerPixel: 55,
    textureSize: 4096,
    overdrawFactor: 3.0,
    branchDivergencePct: 10,
    memoryBandwidthGBs: 128,
    computeThroughputGFlops: 14000,
    msaaSamples: 4
  },
  cpuBound: {
    name: 'CPU Submission Overhead (Many Draws)',
    width: 1920,
    height: 1080,
    objectCount: 4500,
    trianglesPerObject: 40,
    drawCalls: 4500,
    shaderOpsPerPixel: 24,
    textureSize: 512,
    overdrawFactor: 1.1,
    branchDivergencePct: 5,
    memoryBandwidthGBs: 448,
    computeThroughputGFlops: 14000,
    msaaSamples: 1
  }
};

export function estimatePerformance(cfg: PerfWorkloadConfig): PerfEstimate {
  const totalTriangles = cfg.objectCount * cfg.trianglesPerObject;
  const totalPixels = cfg.width * cfg.height;
  const shadedFragments = Math.round(totalPixels * cfg.overdrawFactor);

  // Deterministic educational timing model (milliseconds)
  // Assumptions:
  // - CPU draw call overhead ~ 3.2 microseconds/draw
  // - Vertex throughput scaled by computeThroughputGFlops
  // - Fragment shading scaled by ALU ops, divergence penalty, and computeThroughputGFlops
  // - Memory traffic accounts for color/depth R/W + MSAA + texture footprint pressure
  const cpuSubmitMs = Number(((cfg.drawCalls * 0.0032)).toFixed(3));

  const effectiveGFlops = Math.max(500, cfg.computeThroughputGFlops);
  const divergencePenalty = 1 + (cfg.branchDivergencePct / 100) * 1.15;

  const vertexOpsG = (totalTriangles * 3 * 42) / 1e9;
  const vertexStageMs = Number(((vertexOpsG / (effectiveGFlops * 0.12)) * 1000).toFixed(3));

  const rasterStageMs = Number(
    ((totalTriangles * 0.0000012 + shadedFragments * 0.00000008)).toFixed(3)
  );

  const fragOpsG =
    (shadedFragments * cfg.shaderOpsPerPixel * divergencePenalty * (1 + (cfg.msaaSamples - 1) * 0.25)) /
    1e9;
  const fragmentStageMs = Number(((fragOpsG / (effectiveGFlops * 0.55)) * 1000).toFixed(3));

  const texPenalty = Math.log2(Math.max(256, cfg.textureSize) / 256) * 0.45 + 1.0;
  const bytesPerFrag = (12 * cfg.msaaSamples + 16 * texPenalty);
  const totalGB = (shadedFragments * bytesPerFrag) / 1e9;
  const memoryStageMs = Number(((totalGB / Math.max(32, cfg.memoryBandwidthGBs)) * 1000).toFixed(3));

  // GPU stages overlap, so total frame time approximates max(CPU, GPU critical path)
  const gpuCriticalMs = Math.max(
    vertexStageMs + rasterStageMs * 0.5,
    fragmentStageMs + rasterStageMs * 0.3,
    memoryStageMs + rasterStageMs * 0.2
  );
  const totalFrameMs = Number(Math.max(0.1, Math.max(cpuSubmitMs, gpuCriticalMs)).toFixed(3));
  const estimatedFps = Number((1000 / totalFrameMs).toFixed(1));

  const candidates: Array<{ name: PerfEstimate['bottleneck']; val: number }> = [
    { name: 'CPU Submission', val: cpuSubmitMs },
    { name: 'Vertex Processing', val: vertexStageMs },
    { name: 'Fragment Shading', val: fragmentStageMs },
    { name: 'Memory / Texture Bandwidth', val: memoryStageMs }
  ];
  candidates.sort((a, b) => b.val - a.val);

  const top = candidates[0];
  const second = candidates[1];
  const bottleneck: PerfEstimate['bottleneck'] =
    top.val > second.val * 1.18 ? top.name : 'Balanced';

  const explanations: Record<PerfEstimate['bottleneck'], string> = {
    'CPU Submission':
      'Draw call count is saturating CPU command encoding before GPU shader units reach full utilization. Batching or instancing reduces submission overhead.',
    'Vertex Processing':
      'Triangle and vertex count dominate the geometry frontend. Level-of-detail (LOD), frustum culling, and mesh simplification relieve vertex pressure.',
    'Fragment Shading':
      'High resolution, overdraw, shader ALU complexity, or branch divergence are saturating SM fragment throughput. Reduce overdraw (front-to-back Early-Z) or simplify shader math.',
    'Memory / Texture Bandwidth':
      'Framebuffer R/W, MSAA sample count, and large texture fetches are saturating modeled GDDR bandwidth. Mipmapping, texture compression, or lower MSAA reduces traffic.',
    Balanced:
      'Workload is reasonably balanced across CPU submission, vertex processing, fragment shading, and memory bandwidth.'
  };

  return {
    totalTriangles,
    totalPixels,
    shadedFragments,
    cpuSubmitMs,
    vertexStageMs,
    rasterStageMs,
    fragmentStageMs,
    memoryStageMs,
    totalFrameMs,
    estimatedFps,
    bottleneck,
    explanation: explanations[bottleneck],
    utilizations: {
      cpuFrontendPct: Math.min(100, Math.round((cpuSubmitMs / totalFrameMs) * 100)),
      vertexPct: Math.min(100, Math.round((vertexStageMs / totalFrameMs) * 100)),
      fragmentPct: Math.min(100, Math.round((fragmentStageMs / totalFrameMs) * 100)),
      memoryPct: Math.min(100, Math.round((memoryStageMs / totalFrameMs) * 100))
    }
  };
}
