import type { ComputeConfig, ComputeThreadInfo, GpuProfile } from './types';

export interface ComputeSimulationResult {
  totalWorkgroups: number;
  threadsPerWorkgroup: number;
  totalThreads: number;
  warpsPerWorkgroup: number;
  totalWarps: number;
  activeWarpsPerSm: number;
  theoreticalOccupancyPct: number;
  occupancyLimiter: 'Warp Limit' | 'Registers' | 'Shared Memory' | 'Workgroup Size';
  branchEfficiencyPct: number;
  memoryTransactionsPerWarp: number;
  coalescingEfficiencyPct: number;
  effectiveThroughputPct: number;
  sampleThreads: ComputeThreadInfo[];
}

export function simulateComputeDispatch(
  config: ComputeConfig,
  profile: GpuProfile
): ComputeSimulationResult {
  const wgX = Math.max(1, config.workgroupX);
  const wgY = Math.max(1, config.workgroupY);
  const threadsPerWorkgroup = wgX * wgY;
  const totalWorkgroups = Math.max(1, config.dispatchX) * Math.max(1, config.dispatchY);
  const totalThreads = totalWorkgroups * threadsPerWorkgroup;

  const warpSize = Math.max(16, config.warpSize || profile.warpSize);
  const warpsPerWorkgroup = Math.ceil(threadsPerWorkgroup / warpSize);
  const totalWarps = totalWorkgroups * warpsPerWorkgroup;

  // Educational simplified occupancy rules (explicitly labeled as conceptual)
  const maxGroupsByWarps = Math.floor(profile.maxWarpsPerSm / Math.max(1, warpsPerWorkgroup));
  const regsPerGroup = Math.max(1, threadsPerWorkgroup * config.registersPerThread);
  const maxGroupsByRegs = Math.floor(profile.registersPerSm / regsPerGroup);
  const maxGroupsByShared =
    config.sharedMemPerGroupKiB > 0
      ? Math.floor(profile.sharedMemPerSmKiB / config.sharedMemPerGroupKiB)
      : maxGroupsByWarps;

  const residentGroupsPerSm = Math.max(
    1,
    Math.min(maxGroupsByWarps, maxGroupsByRegs, maxGroupsByShared, 16)
  );
  const activeWarpsPerSm = Math.min(profile.maxWarpsPerSm, residentGroupsPerSm * warpsPerWorkgroup);
  const theoreticalOccupancyPct = Number(
    ((activeWarpsPerSm / profile.maxWarpsPerSm) * 100).toFixed(1)
  );

  let occupancyLimiter: ComputeSimulationResult['occupancyLimiter'] = 'Warp Limit';
  if (maxGroupsByRegs <= maxGroupsByWarps && maxGroupsByRegs <= maxGroupsByShared) {
    occupancyLimiter = 'Registers';
  } else if (maxGroupsByShared <= maxGroupsByWarps && maxGroupsByShared <= maxGroupsByRegs) {
    occupancyLimiter = 'Shared Memory';
  } else if (threadsPerWorkgroup < warpSize) {
    occupancyLimiter = 'Workgroup Size';
  }

  const branchEfficiencyPct =
    config.branchDivergenceMode === 'uniform'
      ? 100
      : config.branchDivergenceMode === 'half-warp'
        ? 50
        : 50;

  // 128-byte cache line holds 32 x 4-byte floats
  const memoryTransactionsPerWarp =
    config.memoryAccessMode === 'coalesced'
      ? Math.ceil((warpSize * 4) / 128)
      : config.memoryAccessMode === 'strided-4'
        ? Math.min(warpSize, Math.ceil((warpSize * 16) / 128))
        : warpSize;

  const idealTx = Math.ceil((warpSize * 4) / 128);
  const coalescingEfficiencyPct = Number(((idealTx / memoryTransactionsPerWarp) * 100).toFixed(1));

  const barrierPenalty = config.barrierEnabled ? 0.92 : 1.0;
  const effectiveThroughputPct = Number(
    (
      (theoreticalOccupancyPct / 100) *
      (branchEfficiencyPct / 100) *
      (0.5 + 0.5 * (coalescingEfficiencyPct / 100)) *
      barrierPenalty *
      100
    ).toFixed(1)
  );

  // Build deterministic thread map for workgroup (0,0) up to 128 threads for inspection
  const sampleThreads: ComputeThreadInfo[] = [];
  const limit = Math.min(threadsPerWorkgroup, 128);
  for (let i = 0; i < limit; i++) {
    const lx = i % wgX;
    const ly = Math.floor(i / wgX);
    const warpId = Math.floor(i / warpSize);
    const laneId = i % warpSize;

    let branchTaken: 'A' | 'B' = 'A';
    if (config.branchDivergenceMode === 'half-warp') {
      branchTaken = laneId < warpSize / 2 ? 'A' : 'B';
    } else if (config.branchDivergenceMode === 'checkerboard') {
      branchTaken = (lx + ly) % 2 === 0 ? 'A' : 'B';
    }

    const baseAddr = 0x1400_0000;
    let memOffset = i * 4;
    if (config.memoryAccessMode === 'strided-4') {
      memOffset = i * 16;
    } else if (config.memoryAccessMode === 'uncoalesced') {
      memOffset = ((i * 73) % 256) * 128;
    }

    sampleThreads.push({
      globalId: [lx, ly],
      localId: [lx, ly],
      workgroupId: [0, 0],
      linearLocalId: i,
      warpId,
      laneId,
      branchTaken,
      memoryAddress: baseAddr + memOffset,
      status:
        branchTaken === 'B'
          ? 'diverged-masked'
          : config.barrierEnabled && i >= limit / 2
            ? 'barrier-wait'
            : 'completed'
    });
  }

  return {
    totalWorkgroups,
    threadsPerWorkgroup,
    totalThreads,
    warpsPerWorkgroup,
    totalWarps,
    activeWarpsPerSm,
    theoreticalOccupancyPct,
    occupancyLimiter,
    branchEfficiencyPct,
    memoryTransactionsPerWarp,
    coalescingEfficiencyPct,
    effectiveThroughputPct,
    sampleThreads
  };
}
