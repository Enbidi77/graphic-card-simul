import type { GpuComponentNode, GpuConnection, GpuProfile } from './types';

export const GPU_PROFILES: GpuProfile[] = [
  {
    id: 'edu-desktop-mid',
    name: 'EDU-G100 (Balanced Desktop)',
    subtitle: 'Generic Educational Model — 4 GPCs, 32 SMs',
    classification: 'Generic Educational',
    gpcCount: 4,
    smsPerGpc: 8,
    coresPerSm: 64,
    warpSize: 32,
    maxWarpsPerSm: 48,
    registersPerSm: 65536,
    sharedMemPerSmKiB: 96,
    l1CachePerSmKiB: 128,
    l2CacheMiB: 32,
    vramGiB: 12,
    memBandwidthGBs: 448,
    clockMHz: 1850,
    textureUnitsPerSm: 4,
    ropCount: 64,
    notes:
      'Configurable classroom model representing a balanced discrete desktop GPU. Counts and latencies are pedagogical approximations, not a specific commercial silicon SKU.'
  },
  {
    id: 'edu-workstation-wide',
    name: 'EDU-W400 (High-Throughput)',
    subtitle: 'Vendor-Inspired Conceptual — 8 GPCs, 80 SMs',
    classification: 'Vendor-Inspired Conceptual',
    gpcCount: 8,
    smsPerGpc: 10,
    coresPerSm: 128,
    warpSize: 32,
    maxWarpsPerSm: 64,
    registersPerSm: 65536,
    sharedMemPerSmKiB: 128,
    l1CachePerSmKiB: 128,
    l2CacheMiB: 64,
    vramGiB: 24,
    memBandwidthGBs: 960,
    clockMHz: 2100,
    textureUnitsPerSm: 4,
    ropCount: 128,
    notes:
      'Conceptual high-throughput desktop/compute architecture modeled after wide SIMT designs with large L2 cache and high GDDR bandwidth.'
  },
  {
    id: 'edu-wave64-compute',
    name: 'EDU-C64 (Wavefront-64)',
    subtitle: 'Vendor-Inspired Conceptual — 64-wide Wavefronts',
    classification: 'Vendor-Inspired Conceptual',
    gpcCount: 4,
    smsPerGpc: 12,
    coresPerSm: 64,
    warpSize: 64,
    maxWarpsPerSm: 32,
    registersPerSm: 65536,
    sharedMemPerSmKiB: 64,
    l1CachePerSmKiB: 128,
    l2CacheMiB: 48,
    vramGiB: 16,
    memBandwidthGBs: 576,
    clockMHz: 2050,
    textureUnitsPerSm: 4,
    ropCount: 96,
    notes:
      'Conceptual 64-lane wavefront architecture demonstrating how wider SIMD execution groups affect divergence and occupancy tradeoffs.'
  },
  {
    id: 'edu-mobile-compact',
    name: 'EDU-M16 (Compact Low-Power)',
    subtitle: 'Generic Educational Model — Tight Bandwidth Budget',
    classification: 'Generic Educational',
    gpcCount: 2,
    smsPerGpc: 4,
    coresPerSm: 32,
    warpSize: 32,
    maxWarpsPerSm: 24,
    registersPerSm: 32768,
    sharedMemPerSmKiB: 32,
    l1CachePerSmKiB: 64,
    l2CacheMiB: 4,
    vramGiB: 4,
    memBandwidthGBs: 96,
    clockMHz: 1100,
    textureUnitsPerSm: 2,
    ropCount: 16,
    notes:
      'Compact integrated/mobile educational model highlighting how narrow memory bandwidth and smaller caches amplify overdraw and texture fetch pressure.'
  }
];

export const CHIP_COMPONENTS: GpuComponentNode[] = [
  {
    id: 'cmd-processor',
    name: 'Command Processor (Front-End)',
    shortName: 'CMD PROC',
    category: 'frontend',
    level: 'chip',
    x: 40,
    y: 28,
    w: 220,
    h: 64,
    baseAddress: '0x0000_1000',
    description:
      'Parses CPU-submitted command buffers (draw calls, compute dispatches, state transitions, barriers) from PCIe/host ring buffers.',
    educationalNote:
      'The CPU does not shade pixels directly. It encodes draw commands into a ring buffer; the Command Processor fetches and decodes them asynchronously.',
    specs: { Interface: 'PCIe Gen4 x16 (Conceptual)', Queues: 'Graphics + Async Compute' }
  },
  {
    id: 'work-scheduler',
    name: 'Graphics & Compute Work Schedulers',
    shortName: 'WORK SCHEDULER',
    category: 'frontend',
    level: 'chip',
    x: 310,
    y: 28,
    w: 260,
    h: 64,
    baseAddress: '0x0000_2000',
    description:
      'Distributes vertex batches, primitive tiles, fragment quads, and compute thread blocks across available GPCs and SMs.',
    educationalNote:
      'Hardware schedulers keep SMs saturated by dispatching new warps/wavefronts whenever registers and shared memory become free.',
    specs: { Policy: 'Round-Robin + Occupancy Aware (Modeled)', Domains: '3D + Compute' }
  },
  {
    id: 'gpc-cluster',
    name: 'Graphics Processing Clusters (GPCs)',
    shortName: 'GPC ARRAY',
    category: 'compute',
    level: 'chip',
    x: 40,
    y: 122,
    w: 530,
    h: 190,
    baseAddress: '0x0010_0000',
    description:
      'Top-level compute and rasterization partitions containing Streaming Multiprocessors (SMs), geometry engines, and rasterizers.',
    educationalNote:
      'Scaling a GPU architecture across product tiers typically replicates GPCs and SMs in parallel while sharing a unified L2 cache.',
    specs: { Contains: 'SMs + Raster Engine + PolyMorph/Geometry' }
  },
  {
    id: 'sm-unit',
    name: 'Streaming Multiprocessors (SMs / CUs)',
    shortName: 'SM / CU BLOCK',
    category: 'compute',
    level: 'chip',
    x: 62,
    y: 162,
    w: 230,
    h: 132,
    baseAddress: '0x0011_0000',
    description:
      'Core programmable execution units executing vertex, fragment, and compute shaders in SIMT warps/wavefronts.',
    educationalNote:
      'Click "Inspect SM Interior" to zoom inside an SM and examine Warp Schedulers, Shader Cores, Register Files, Shared Memory/L1, Texture Units, and LD/ST Units.',
    specs: { Execution: 'SIMT Lockstep', Inspectable: 'SM-Level View Available' }
  },
  {
    id: 'tex-units',
    name: 'Texture Mapping Units (TMUs)',
    shortName: 'TEXTURE UNITS',
    category: 'compute',
    level: 'chip',
    x: 312,
    y: 162,
    w: 236,
    h: 60,
    baseAddress: '0x0012_4000',
    description:
      'Dedicated fixed-function units that compute UV derivatives, select mip levels, and perform nearest/bilinear/anisotropic filtering.',
    educationalNote:
      'Texture filtering runs in dedicated hardware so shader cores do not spend dozens of arithmetic cycles interpolating texels manually.',
    specs: { Filtering: 'Nearest, Bilinear, Trilinear, Mipmap' }
  },
  {
    id: 'ldst-units',
    name: 'Load / Store Units (LD/ST)',
    shortName: 'LD/ST UNITS',
    category: 'compute',
    level: 'chip',
    x: 312,
    y: 234,
    w: 236,
    h: 60,
    baseAddress: '0x0012_8000',
    description:
      'Calculate memory addresses, coalesce adjacent thread requests into cache-line transactions, and issue reads/writes to L1/Shared/L2.',
    educationalNote:
      'When 32 threads in a warp read consecutive 4-byte floats, LD/ST units coalesce them into a single 128-byte cache line transaction.',
    specs: { Coalescing: '128B Cache Line Granularity' }
  },
  {
    id: 'l2-cache',
    name: 'Unified L2 Cache Crossbar',
    shortName: 'L2 CACHE',
    category: 'cache',
    level: 'chip',
    x: 40,
    y: 344,
    w: 530,
    h: 60,
    baseAddress: '0x0100_0000',
    description:
      'Chip-wide coherent cache shared by all SMs, Texture Units, and ROPs to absorb bandwidth before hitting off-chip VRAM.',
    educationalNote:
      'L2 cache is the last on-die defense against high-latency off-chip GDDR transfers (~300-500 cycles vs. ~120-200 cycles for L2).',
    specs: { Scope: 'Chip-wide Coherent', LineSize: '64B - 128B' }
  },
  {
    id: 'vram-ctrl',
    name: 'VRAM / GDDR Memory Controllers',
    shortName: 'VRAM / GDDR CTRL',
    category: 'memory',
    level: 'chip',
    x: 40,
    y: 432,
    w: 256,
    h: 64,
    baseAddress: '0x1000_0000',
    description:
      'High-bandwidth off-chip memory channels storing vertex/index buffers, textures, compute buffers, and render targets.',
    educationalNote:
      'GPUs optimize for throughput (hundreds of GB/s) rather than low single-thread latency, hiding VRAM latency via massive warp-level multithreading.',
    specs: { Type: 'GDDR6 / HBM (Conceptual)', Access: 'High-Throughput Burst' }
  },
  {
    id: 'framebuffer',
    name: 'ROP / Framebuffer & Render Targets',
    shortName: 'ROP / FRAMEBUFFER',
    category: 'output',
    level: 'chip',
    x: 314,
    y: 432,
    w: 256,
    h: 64,
    baseAddress: '0x2000_0000',
    description:
      'Render Output Units perform depth/stencil tests, MSAA resolve, and alpha blending before writing final pixels to the swapchain.',
    educationalNote:
      'Early-Z testing can discard occluded fragments before fragment shading, saving substantial ALU and texture bandwidth.',
    specs: { Operations: 'Depth/Stencil, Blend, MSAA Resolve, Present' }
  }
];

export const SM_COMPONENTS: GpuComponentNode[] = [
  {
    id: 'sm-warp-sched',
    name: 'Warp / Wavefront Schedulers',
    shortName: 'WARP SCHEDULER',
    category: 'frontend',
    level: 'sm',
    x: 36,
    y: 30,
    w: 248,
    h: 72,
    baseAddress: '0x0011_0100',
    description:
      'Selects ready warps (32 or 64 threads) each cycle and dispatches instructions to execution pipelines with zero-overhead context switching.',
    educationalNote:
      'If Warp 0 stalls waiting on a texture fetch from VRAM, the scheduler immediately issues an instruction from Warp 1 on the very next cycle.',
    specs: { SwitchCost: '0 cycles (Resident Registers)', Issue: 'Dual/Quad Sub-Partitions' }
  },
  {
    id: 'sm-reg-file',
    name: 'Vector Register File',
    shortName: 'REGISTER FILE',
    category: 'cache',
    level: 'sm',
    x: 316,
    y: 30,
    w: 252,
    h: 72,
    baseAddress: '0x0011_0800',
    description:
      'Ultra-fast on-chip SRAM partitioned across all active threads in the SM. High per-thread register use lowers maximum occupancy.',
    educationalNote:
      'Registers are the fastest storage on the GPU (~1 cycle) and hold per-invocation shader variables, intermediates, and coordinates.',
    specs: { Latency: '~1 cycle', Granularity: '32-bit Scalar Registers / Lane' }
  },
  {
    id: 'sm-shader-cores',
    name: 'Shader Execution Units (ALU / FMA Cores)',
    shortName: 'SHADER CORES (SIMT)',
    category: 'compute',
    level: 'sm',
    x: 36,
    y: 132,
    w: 532,
    h: 112,
    baseAddress: '0x0011_1000',
    description:
      'Array of floating-point (FP32) and integer (INT32) arithmetic lanes executing the same instruction across all active lanes of a warp.',
    educationalNote:
      'Under branch divergence, lanes taking the alternate path are masked off while the first path executes, then masks flip — halving effective throughput.',
    specs: { ExecutionModel: 'SIMT Lockstep', Ops: 'FMA, INT, SFU (sin/cos/rsqrt)' }
  },
  {
    id: 'sm-shared-l1',
    name: 'Shared Memory & L1 Data Cache',
    shortName: 'SHARED MEM / L1',
    category: 'cache',
    level: 'sm',
    x: 36,
    y: 274,
    w: 250,
    h: 96,
    baseAddress: '0x0011_4000',
    description:
      'Configurable on-SM SRAM split between programmer-managed Shared Memory (workgroup scratchpad) and hardware-managed L1 cache.',
    educationalNote:
      'Shared memory lets threads inside the same workgroup exchange data at ~20-30 cycle latency instead of round-tripping through VRAM.',
    specs: { Banks: '32 Banks (4-byte stride)', Scope: 'Workgroup / SM Local' }
  },
  {
    id: 'sm-tex-ldst',
    name: 'SM Texture & LD/ST Pipelines',
    shortName: 'TEX + LD/ST PIPE',
    category: 'memory',
    level: 'sm',
    x: 318,
    y: 274,
    w: 250,
    h: 96,
    baseAddress: '0x0011_8000',
    description:
      'Handles texture coordinate filtering, mip selection, and coalesced memory requests to the chip-wide L2 cache.',
    educationalNote:
      'Uncoalesced or strided memory access forces LD/ST units to emit multiple cache line requests per warp, multiplying memory traffic.',
    specs: { Interface: 'To Unified L2 Crossbar' }
  }
];

export const CHIP_CONNECTIONS: GpuConnection[] = [
  { id: 'c-cmd-sched', from: 'cmd-processor', to: 'work-scheduler', label: 'Decoded Draws', busWidthBits: 256, stageIds: [1, 2] },
  { id: 'c-sched-sm', from: 'work-scheduler', to: 'sm-unit', label: 'Warp Dispatch', busWidthBits: 512, stageIds: [3, 4, 5, 6, 7, 8, 10] },
  { id: 'c-sm-tex', from: 'sm-unit', to: 'tex-units', label: 'UV / Sampler', busWidthBits: 256, stageIds: [10, 11] },
  { id: 'c-sm-ldst', from: 'sm-unit', to: 'ldst-units', label: 'Buffer Load/Store', busWidthBits: 256, stageIds: [3, 11] },
  { id: 'c-tex-l2', from: 'tex-units', to: 'l2-cache', label: 'Texel Fetch', busWidthBits: 512, stageIds: [11] },
  { id: 'c-ldst-l2', from: 'ldst-units', to: 'l2-cache', label: 'Cache Line Req', busWidthBits: 512, stageIds: [3, 11] },
  { id: 'c-l2-vram', from: 'l2-cache', to: 'vram-ctrl', label: 'GDDR Burst', busWidthBits: 384, stageIds: [3, 11] },
  { id: 'c-l2-rop', from: 'l2-cache', to: 'framebuffer', label: 'Color / Depth R/W', busWidthBits: 512, stageIds: [9, 12, 13] }
];

export function getProfileById(id: string): GpuProfile {
  return GPU_PROFILES.find((p) => p.id === id) ?? GPU_PROFILES[0];
}

export function getTotalShaderCores(profile: GpuProfile): number {
  return profile.gpcCount * profile.smsPerGpc * profile.coresPerSm;
}

export function getTheoreticalPeakTflops(profile: GpuProfile): number {
  const cores = getTotalShaderCores(profile);
  // 2 FLOPs per FMA per core per cycle
  return (cores * 2 * profile.clockMHz) / 1_000_000;
}
