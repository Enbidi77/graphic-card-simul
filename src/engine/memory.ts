import { clamp } from './math';
import type {
  CacheHierarchyConfig,
  CacheSimulationResult,
  FilterMode,
  MemoryAccessRecord
} from './types';

export interface TextureSampleResult {
  r: number;
  g: number;
  b: number;
  mipLevel: number;
  texelCoords: [number, number][];
  weights: number[];
}

export function generateProceduralTexture(size: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const checker = ((x >> 1) + (y >> 1)) % 2 === 0;
      const border = x === 0 || y === 0 || x === size - 1 || y === size - 1;
      if (border) {
        data[idx] = 56;
        data[idx + 1] = 189;
        data[idx + 2] = 248;
        data[idx + 3] = 255;
      } else if (checker) {
        data[idx] = 226;
        data[idx + 1] = 232;
        data[idx + 2] = 240;
        data[idx + 3] = 255;
      } else {
        data[idx] = 51;
        data[idx + 1] = 65;
        data[idx + 2] = 85;
        data[idx + 3] = 255;
      }
    }
  }
  return data;
}

export function sampleTexture(
  tex: Uint8ClampedArray,
  size: number,
  u: number,
  v: number,
  mode: FilterMode,
  footprintTexels = 1.0
): TextureSampleResult {
  const cu = clamp(u, 0, 0.99999);
  const cv = clamp(v, 0, 0.99999);
  const maxMip = Math.max(0, Math.floor(Math.log2(size)));
  const mipLevel =
    mode === 'mipmap-bilinear'
      ? clamp(Math.floor(Math.log2(Math.max(1, footprintTexels))), 0, maxMip)
      : 0;

  const readTexel = (tx: number, ty: number): [number, number, number] => {
    const x = clamp(tx, 0, size - 1);
    const y = clamp(ty, 0, size - 1);
    const i = (y * size + x) * 4;
    return [tex[i], tex[i + 1], tex[i + 2]];
  };

  if (mode === 'nearest') {
    const tx = Math.floor(cu * size);
    const ty = Math.floor(cv * size);
    const [r, g, b] = readTexel(tx, ty);
    return { r, g, b, mipLevel: 0, texelCoords: [[tx, ty]], weights: [1] };
  }

  // Bilinear (and conceptual mipmap box blend for mipLevel > 0)
  const fx = cu * size - 0.5;
  const fy = cv * size - 0.5;
  const x0 = clamp(Math.floor(fx), 0, size - 1);
  const y0 = clamp(Math.floor(fy), 0, size - 1);
  const x1 = clamp(x0 + 1, 0, size - 1);
  const y1 = clamp(y0 + 1, 0, size - 1);
  const tx = clamp(fx - Math.floor(fx), 0, 1);
  const ty = clamp(fy - Math.floor(fy), 0, 1);

  const c00 = readTexel(x0, y0);
  const c10 = readTexel(x1, y0);
  const c01 = readTexel(x0, y1);
  const c11 = readTexel(x1, y1);

  const w00 = (1 - tx) * (1 - ty);
  const w10 = tx * (1 - ty);
  const w01 = (1 - tx) * ty;
  const w11 = tx * ty;

  let r = c00[0] * w00 + c10[0] * w10 + c01[0] * w01 + c11[0] * w11;
  let g = c00[1] * w00 + c10[1] * w10 + c01[1] * w01 + c11[1] * w11;
  let b = c00[2] * w00 + c10[2] * w10 + c01[2] * w01 + c11[2] * w11;

  if (mipLevel > 0) {
    // Mip averaging converges smoothly toward mean texel luminance as mip increases
    const blend = clamp(mipLevel / Math.max(1, maxMip), 0, 0.85);
    const avg = 142;
    r = r * (1 - blend) + avg * blend;
    g = g * (1 - blend) + avg * blend;
    b = b * (1 - blend) + avg * blend;
  }

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b),
    mipLevel,
    texelCoords: [
      [x0, y0],
      [x1, y0],
      [x0, y1],
      [x1, y1]
    ],
    weights: [w00, w10, w01, w11]
  };
}

function deterministicHash(n: number): number {
  let x = (n + 1) * 2654435761;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  return (x >>> 0) % 16384;
}

export function simulateCacheHierarchy(
  config: CacheHierarchyConfig
): CacheSimulationResult {
  const lineSize = Math.max(16, config.lineSizeBytes);
  const l1Lines = Math.max(4, Math.floor((config.l1SizeKiB * 1024) / lineSize));
  const l2Lines = Math.max(l1Lines, Math.floor((config.l2SizeKiB * 1024) / lineSize));

  // Direct-mapped / LRU-approximated set arrays for deterministic educational simulation
  const l1Order: number[] = [];
  const l1Set = new Set<number>();
  const l2Order: number[] = [];
  const l2Set = new Set<number>();

  const touchCache = (set: Set<number>, order: number[], line: number, cap: number) => {
    if (set.has(line)) return true;
    set.add(line);
    order.push(line);
    if (order.length > cap) {
      const evicted = order.shift();
      if (evicted !== undefined) set.delete(evicted);
    }
    return false;
  };

  let l1Hits = 0;
  let l1Misses = 0;
  let l2Hits = 0;
  let l2Misses = 0;
  let totalLatency = 0;
  let estimatedBytesTransferred = 0;
  const timeline: MemoryAccessRecord[] = [];
  const baseAddr = 0x1000_0000;

  for (let i = 0; i < config.accessCount; i++) {
    let offset = 0;
    if (config.pattern === 'linear') {
      offset = i * 4;
    } else if (config.pattern === 'strided') {
      offset = i * Math.max(4, config.strideBytes);
    } else if (config.pattern === 'tiled-2d') {
      const tileX = i % 4;
      const tileY = Math.floor(i / 4) % 4;
      const tileIdx = Math.floor(i / 16);
      offset = tileIdx * 64 + tileY * 16 + tileX * 4;
    } else {
      offset = deterministicHash(i) * 16;
    }

    const address = baseAddr + offset;
    const cacheLine = Math.floor(address / lineSize);

    let tier: 'L1' | 'L2' | 'VRAM';
    let latencyCycles = config.l1Latency;
    let bytesTransferred = 4;

    if (touchCache(l1Set, l1Order, cacheLine, l1Lines)) {
      l1Hits++;
      tier = 'L1';
      latencyCycles = config.l1Latency;
      bytesTransferred = 4;
    } else {
      l1Misses++;
      if (touchCache(l2Set, l2Order, cacheLine, l2Lines)) {
        l2Hits++;
        tier = 'L2';
        latencyCycles = config.l2Latency;
        bytesTransferred = lineSize;
      } else {
        l2Misses++;
        tier = 'VRAM';
        latencyCycles = config.vramLatency;
        bytesTransferred = lineSize;
      }
    }

    totalLatency += latencyCycles;
    estimatedBytesTransferred += bytesTransferred;

    if (timeline.length < 128) {
      timeline.push({
        index: i,
        address,
        cacheLine,
        tier,
        latencyCycles,
        bytesTransferred
      });
    }
  }

  const total = Math.max(1, config.accessCount);
  const avgLatency = totalLatency / total;
  const vramFraction = l2Misses / total;
  const estimatedBandwidthUtilPct = clamp(
    (vramFraction * (lineSize / 4) * 18) * (448 / Math.max(64, config.busBandwidthGBs)),
    1,
    100
  );

  return {
    totalAccesses: config.accessCount,
    l1Hits,
    l1Misses,
    l2Hits,
    l2Misses,
    vramAccesses: l2Misses,
    l1HitRate: (l1Hits / total) * 100,
    l2HitRate: l1Misses > 0 ? (l2Hits / l1Misses) * 100 : 100,
    estimatedBytesTransferred,
    averageLatencyCycles: Number(avgLatency.toFixed(1)),
    estimatedBandwidthUtilPct: Number(estimatedBandwidthUtilPct.toFixed(1)),
    timeline
  };
}
