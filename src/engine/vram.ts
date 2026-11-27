import type { VramAllocation, VramResourceType } from './types';

export const BYTES_PER_MIB = 1024 * 1024;
export const BYTES_PER_GIB = 1024 * 1024 * 1024;

export function alignBytes(size: number, alignment = 65536): number {
  return Math.ceil(size / alignment) * alignment;
}

export function formatMiB(bytes: number): string {
  const mib = bytes / BYTES_PER_MIB;
  if (mib >= 1024) {
    return `${(bytes / BYTES_PER_GIB).toFixed(2)} GiB`;
  }
  if (mib >= 1) {
    return `${mib.toFixed(2)} MiB`;
  }
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

export function formatHexAddr(offset: number): string {
  return `0x${offset.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function calculateRenderTargetBytes(
  width: number,
  height: number,
  bytesPerPixel: number,
  msaaSamples = 1,
  bufferCount = 1
): number {
  return width * height * bytesPerPixel * Math.max(1, msaaSamples) * Math.max(1, bufferCount);
}

export function calculateTextureBytes(
  width: number,
  height: number,
  bytesPerPixel = 4,
  mipmapped = true
): number {
  const base = width * height * bytesPerPixel;
  return mipmapped ? Math.round(base * 1.333333) : base;
}

function makePreviewHex(seed: number, type: VramResourceType): string[] {
  const tags: Record<VramResourceType, string[]> = {
    'vertex-buffer': ['3F800000', 'BF000000', '00000000', '3F800000'],
    'index-buffer': ['00000001', '00020003', '00040005', '00060007'],
    texture: ['E2E8F0FF', '334155FF', '38BDF8FF', '1E293BFF'],
    'depth-buffer': ['3F7A1200', '3F71C400', '3F688000', '3F800000'],
    'stencil-buffer': ['00000001', '01010101', '00000000', '01010000'],
    'color-rt': ['18202AFF', '22D3EEFF', 'F59E0BFF', '10B981FF'],
    'uniform-buffer': ['3F800000', '00000000', '3F3504F3', '40A00000'],
    'compute-buffer': ['41200000', '41A00000', '42000000', '42480000']
  };
  const base = tags[type];
  return [
    `${formatHexAddr(seed)}: ${base[0]} ${base[1]} ${base[2]} ${base[3]}`,
    `${formatHexAddr(seed + 16)}: ${base[2]} ${base[0]} ${base[3]} ${base[1]}`
  ];
}

export function createDefaultVramAllocations(
  width = 1920,
  height = 1080,
  msaaSamples = 1
): VramAllocation[] {
  const specs: Array<{
    id: string;
    label: string;
    type: VramResourceType;
    rawBytes: number;
    format: string;
    dimensions?: string;
    msaa?: number;
  }> = [
    {
      id: 'rt-color-front',
      label: 'Swapchain Color RT0 (RGBA8)',
      type: 'color-rt',
      rawBytes: calculateRenderTargetBytes(width, height, 4, msaaSamples, 2),
      format: 'R8G8B8A8_UNORM (Double Buffered)',
      dimensions: `${width}×${height}`,
      msaa: msaaSamples
    },
    {
      id: 'rt-depth',
      label: 'Depth Buffer (D32_FLOAT)',
      type: 'depth-buffer',
      rawBytes: calculateRenderTargetBytes(width, height, 4, msaaSamples, 1),
      format: 'D32_SFLOAT',
      dimensions: `${width}×${height}`,
      msaa: msaaSamples
    },
    {
      id: 'rt-stencil',
      label: 'Stencil Buffer (S8_UINT)',
      type: 'stencil-buffer',
      rawBytes: calculateRenderTargetBytes(width, height, 1, msaaSamples, 1),
      format: 'S8_UINT',
      dimensions: `${width}×${height}`,
      msaa: msaaSamples
    },
    {
      id: 'tex-albedo',
      label: 'Scene Albedo Atlas (Mipmapped)',
      type: 'texture',
      rawBytes: calculateTextureBytes(2048, 2048, 4, true),
      format: 'R8G8B8A8_SRGB + Mips',
      dimensions: '2048×2048'
    },
    {
      id: 'tex-shadow',
      label: 'Directional Shadow Map',
      type: 'texture',
      rawBytes: calculateTextureBytes(2048, 2048, 4, false),
      format: 'D32_SFLOAT',
      dimensions: '2048×2048'
    },
    {
      id: 'vbo-scene',
      label: 'Geometry Vertex Buffer (VBO)',
      type: 'vertex-buffer',
      rawBytes: 8 * BYTES_PER_MIB,
      format: 'Pos3+Norm3+UV2 (32B/vert)',
      dimensions: '262,144 vertices'
    },
    {
      id: 'ibo-scene',
      label: 'Geometry Index Buffer (IBO)',
      type: 'index-buffer',
      rawBytes: 4 * BYTES_PER_MIB,
      format: 'UINT32',
      dimensions: '1,048,576 indices'
    },
    {
      id: 'ubo-frame',
      label: 'Frame Uniforms & Matrices (UBO)',
      type: 'uniform-buffer',
      rawBytes: 256 * 1024,
      format: 'std140',
      dimensions: '256 KiB'
    },
    {
      id: 'ssbo-compute',
      label: 'Compute Dispatch Storage Buffer',
      type: 'compute-buffer',
      rawBytes: 32 * BYTES_PER_MIB,
      format: 'FP32 Structured Buffer',
      dimensions: '8,388,608 floats'
    }
  ];

  let cursor = 0x1000_0000;
  return specs.map((s) => {
    const aligned = alignBytes(s.rawBytes, 65536);
    const alloc: VramAllocation = {
      id: s.id,
      label: s.label,
      type: s.type,
      sizeBytes: aligned,
      offsetBytes: cursor,
      alignmentBytes: 65536,
      format: s.format,
      dimensions: s.dimensions,
      msaaSamples: s.msaa,
      previewHex: makePreviewHex(cursor, s.type)
    };
    cursor += aligned;
    return alloc;
  });
}

export function allocateVramBlock(
  existing: VramAllocation[],
  label: string,
  type: VramResourceType,
  rawBytes: number,
  format: string,
  dimensions?: string
): VramAllocation[] {
  const aligned = alignBytes(rawBytes, 65536);
  const last = existing[existing.length - 1];
  const offset = last ? last.offsetBytes + last.sizeBytes : 0x1000_0000;
  const next: VramAllocation = {
    id: `alloc-${Date.now()}-${existing.length}`,
    label,
    type,
    sizeBytes: aligned,
    offsetBytes: offset,
    alignmentBytes: 65536,
    format,
    dimensions,
    previewHex: makePreviewHex(offset, type)
  };
  return [...existing, next];
}

export function summarizeVram(allocations: VramAllocation[], budgetMiB: number) {
  const usedBytes = allocations.reduce((acc, a) => acc + a.sizeBytes, 0);
  const budgetBytes = Math.max(1, budgetMiB) * BYTES_PER_MIB;
  const utilizationPct = Number(((usedBytes / budgetBytes) * 100).toFixed(1));
  const overBudget = usedBytes > budgetBytes;
  return {
    usedBytes,
    budgetBytes,
    freeBytes: Math.max(0, budgetBytes - usedBytes),
    utilizationPct,
    overBudget
  };
}
