import { computeBarycentric, edgeFunction, perspectiveCorrectWeights } from './math';
import type { RasterConfig, RasterFragment, RasterVertex } from './types';

const MSAA_4X_OFFSETS: [number, number][] = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75]
];

export const DEFAULT_RASTER_VERTICES: [RasterVertex, RasterVertex, RasterVertex] = [
  { x: 0.5, y: 0.14, z: 0.25, w: 1.0, u: 0.5, v: 0.0, color: [0.16, 0.78, 0.92], normal: [0, 0.4, 0.92] },
  { x: 0.86, y: 0.82, z: 0.72, w: 2.6, u: 1.0, v: 1.0, color: [0.96, 0.65, 0.14], normal: [0.6, -0.2, 0.77] },
  { x: 0.16, y: 0.78, z: 0.48, w: 1.5, u: 0.0, v: 1.0, color: [0.22, 0.82, 0.55], normal: [-0.55, -0.25, 0.8] }
];

export const SECONDARY_RASTER_TRIANGLE: [RasterVertex, RasterVertex, RasterVertex] = [
  { x: 0.26, y: 0.24, z: 0.42, w: 1.4, u: 0.0, v: 0.0, color: [0.85, 0.35, 0.35], normal: [-0.3, 0.3, 0.9] },
  { x: 0.82, y: 0.36, z: 0.52, w: 1.8, u: 1.0, v: 0.2, color: [0.55, 0.45, 0.92], normal: [0.4, 0.2, 0.89] },
  { x: 0.48, y: 0.88, z: 0.38, w: 1.2, u: 0.5, v: 1.0, color: [0.28, 0.72, 0.86], normal: [0.0, -0.4, 0.91] }
];

export interface RasterizationResult {
  resolution: number;
  fragments: RasterFragment[];
  pixelMap: Map<string, RasterFragment>;
  culledTriangles: number;
  totalCoveredPixels: number;
  totalGeneratedFragments: number;
  depthRejectedCount: number;
  scissorRejectedCount: number;
  sampleEvaluations: number;
}

function insideTriangle(l0: number, l1: number, l2: number): boolean {
  const eps = -1e-5;
  return l0 >= eps && l1 >= eps && l2 >= eps;
}

export function rasterizeScene(config: RasterConfig): RasterizationResult {
  const res = Math.max(4, Math.min(64, Math.round(config.resolution)));
  const triangles: [RasterVertex, RasterVertex, RasterVertex][] =
    config.triangleCount === 2
      ? [config.vertices, SECONDARY_RASTER_TRIANGLE]
      : [config.vertices];

  const depthBuffer = new Float32Array(res * res).fill(1.0);
  const pixelMap = new Map<string, RasterFragment>();
  const fragments: RasterFragment[] = [];

  let culledTriangles = 0;
  let depthRejectedCount = 0;
  let scissorRejectedCount = 0;
  let sampleEvaluations = 0;

  triangles.forEach((tri, triIdx) => {
    const a = { x: tri[0].x * res, y: tri[0].y * res };
    const b = { x: tri[1].x * res, y: tri[1].y * res };
    const c = { x: tri[2].x * res, y: tri[2].y * res };

    const signedArea = edgeFunction(a, b, c);
    // In screen space (Y down), positive signed area corresponds to front-facing CW winding
    if (config.backfaceCulling && signedArea < 0) {
      culledTriangles++;
      return;
    }

    const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
    const maxX = Math.min(res - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
    const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
    const maxY = Math.min(res - 1, Math.ceil(Math.max(a.y, b.y, c.y)));

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const samples = config.msaa4x ? MSAA_4X_OFFSETS : [[0.5, 0.5]];
        const sampleMask: boolean[] = [];
        let coveredSamples = 0;

        for (const [ox, oy] of samples) {
          sampleEvaluations++;
          const bSample = computeBarycentric(a, b, c, { x: px + ox, y: py + oy });
          const hit = Math.abs(bSample.area) > 1e-6 && insideTriangle(bSample.l0, bSample.l1, bSample.l2);
          sampleMask.push(hit);
          if (hit) coveredSamples++;
        }

        if (coveredSamples === 0) continue;

        const center = computeBarycentric(a, b, c, { x: px + 0.5, y: py + 0.5 });
        const weights: [number, number, number] = config.perspectiveCorrect
          ? perspectiveCorrectWeights(center.l0, center.l1, center.l2, tri[0].w, tri[1].w, tri[2].w)
          : [center.l0, center.l1, center.l2];

        const [w0, w1, w2] = weights;
        const depth = center.l0 * tri[0].z + center.l1 * tri[1].z + center.l2 * tri[2].z;

        const passedScissor =
          !config.scissorEnabled ||
          (px >= config.scissorRect.x &&
            px < config.scissorRect.x + config.scissorRect.w &&
            py >= config.scissorRect.y &&
            py < config.scissorRect.y + config.scissorRect.h);

        if (!passedScissor) {
          scissorRejectedCount++;
          continue;
        }

        const idx = py * res + px;
        const passedDepth = !config.depthTest || depth < depthBuffer[idx];
        if (!passedDepth) {
          depthRejectedCount++;
          continue;
        }

        depthBuffer[idx] = depth;

        const u = w0 * tri[0].u + w1 * tri[1].u + w2 * tri[2].u;
        const v = w0 * tri[0].v + w1 * tri[1].v + w2 * tri[2].v;
        const color: [number, number, number] = [
          w0 * tri[0].color[0] + w1 * tri[1].color[0] + w2 * tri[2].color[0],
          w0 * tri[0].color[1] + w1 * tri[1].color[1] + w2 * tri[2].color[1],
          w0 * tri[0].color[2] + w1 * tri[1].color[2] + w2 * tri[2].color[2]
        ];
        const nx = w0 * tri[0].normal[0] + w1 * tri[1].normal[0] + w2 * tri[2].normal[0];
        const ny = w0 * tri[0].normal[1] + w1 * tri[1].normal[1] + w2 * tri[2].normal[1];
        const nz = w0 * tri[0].normal[2] + w1 * tri[1].normal[2] + w2 * tri[2].normal[2];
        const nLen = Math.hypot(nx, ny, nz) || 1;

        const frag: RasterFragment = {
          px,
          py,
          depth,
          barycentric: [center.l0, center.l1, center.l2],
          uv: [u, v],
          color,
          normal: [nx / nLen, ny / nLen, nz / nLen],
          sampleCoverage: coveredSamples / samples.length,
          sampleMask,
          passedDepth,
          passedScissor,
          triangleIndex: triIdx
        };

        fragments.push(frag);
        pixelMap.set(`${px},${py}`, frag);
      }
    }
  });

  return {
    resolution: res,
    fragments,
    pixelMap,
    culledTriangles,
    totalCoveredPixels: pixelMap.size,
    totalGeneratedFragments: fragments.length,
    depthRejectedCount,
    scissorRejectedCount,
    sampleEvaluations
  };
}
