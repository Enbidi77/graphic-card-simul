import { create } from 'zustand';
import {
  DEFAULT_RASTER_VERTICES,
  GPU_PROFILES,
  PERF_PRESETS,
  SHADER_PRESETS,
  allocateVramBlock,
  appendBoundedEvents,
  buildFrameEvents,
  createDefaultVramAllocations,
  createInitialClock,
  getProfileById,
  resetClock,
  stepClock
} from '../engine';
import type {
  CacheHierarchyConfig,
  ComputeConfig,
  FilterMode,
  InspectorTarget,
  NavSectionId,
  PerfWorkloadConfig,
  RasterConfig,
  SceneConfig,
  SceneObject,
  SimClockState,
  SimulationMode,
  ThemeMode,
  VramAllocation,
  VramResourceType
} from '../engine';

const DEFAULT_SCENE: SceneConfig = {
  objects: [
    {
      id: 'cube-1',
      name: 'Calibration Cube',
      type: 'cube',
      position: [-1.45, 0.55, 0],
      rotation: [0.2, 0.5, 0],
      scale: [1, 1, 1],
      color: '#22d3ee',
      segments: 2,
      textured: true,
      visible: true
    },
    {
      id: 'sphere-1',
      name: 'Tessellated Sphere',
      type: 'sphere',
      position: [1.35, 0.65, -0.2],
      rotation: [0, 0, 0],
      scale: [0.85, 0.85, 0.85],
      color: '#f59e0b',
      segments: 20,
      textured: false,
      visible: true
    },
    {
      id: 'plane-1',
      name: 'Ground Plane',
      type: 'plane',
      position: [0, -0.35, 0],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [6, 6, 1],
      color: '#334155',
      segments: 4,
      textured: true,
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

interface GpuLabStore {
  theme: ThemeMode;
  activeNav: NavSectionId;
  sidebarCollapsed: boolean;
  lowDetailMode: boolean;
  profileId: string;
  simMode: SimulationMode;
  clock: SimClockState;
  inspector: InspectorTarget | null;
  scene: SceneConfig;
  raster: RasterConfig;
  textureMode: FilterMode;
  sampleUv: [number, number];
  texFootprint: number;
  cacheConfig: CacheHierarchyConfig;
  compute: ComputeConfig;
  vramBudgetMiB: number;
  vramResolution: '1080p' | '1440p' | '4k';
  vramMsaa: 1 | 4;
  vramAllocations: VramAllocation[];
  perfConfigA: PerfWorkloadConfig;
  perfConfigB: PerfWorkloadConfig;
  shaderPresetId: string;
  vertexCode: string;
  fragmentCode: string;
  selectedEventId: number | null;
  breakpoints: Record<number, boolean>;
  completedScenarios: Record<string, boolean>;

  setTheme: (theme: ThemeMode) => void;
  setActiveNav: (nav: NavSectionId) => void;
  toggleSidebar: () => void;
  setLowDetailMode: (v: boolean) => void;
  setProfileId: (id: string) => void;
  setSimMode: (mode: SimulationMode) => void;
  toggleRunning: () => void;
  setSpeed: (speed: number) => void;
  stepSimulation: () => void;
  resetSimulation: () => void;
  setInspector: (target: InspectorTarget | null) => void;
  updateScene: (patch: Partial<SceneConfig>) => void;
  addSceneObject: (type: SceneObject['type']) => void;
  removeSceneObject: (id: string) => void;
  updateSceneObject: (id: string, patch: Partial<SceneObject>) => void;
  updateRaster: (patch: Partial<RasterConfig>) => void;
  setTextureMode: (mode: FilterMode) => void;
  setSampleUv: (uv: [number, number]) => void;
  setTexFootprint: (v: number) => void;
  updateCacheConfig: (patch: Partial<CacheHierarchyConfig>) => void;
  updateCompute: (patch: Partial<ComputeConfig>) => void;
  setVramBudgetMiB: (mib: number) => void;
  setVramTargetPreset: (res: '1080p' | '1440p' | '4k', msaa: 1 | 4) => void;
  addVramAllocation: (label: string, type: VramResourceType, sizeMiB: number, format: string) => void;
  removeVramAllocation: (id: string) => void;
  updatePerfConfigA: (patch: Partial<PerfWorkloadConfig>) => void;
  updatePerfConfigB: (patch: Partial<PerfWorkloadConfig>) => void;
  selectShaderPreset: (id: string) => void;
  setShaderCode: (vertexCode: string, fragmentCode: string) => void;
  setSelectedEventId: (id: number | null) => void;
  toggleBreakpoint: (stageId: number) => void;
  markScenarioComplete: (id: string) => void;
}

const initialProfile = GPU_PROFILES[0];
const initialClock = appendBoundedEvents(
  createInitialClock(240),
  buildFrameEvents(1, DEFAULT_SCENE, initialProfile, 1)
);

export const useGpuLabStore = create<GpuLabStore>((set, get) => ({
  theme: 'dark',
  activeNav: 'architecture',
  sidebarCollapsed: false,
  lowDetailMode: false,
  profileId: initialProfile.id,
  simMode: 'graphics-pipeline',
  clock: initialClock,
  inspector: null,
  scene: DEFAULT_SCENE,
  raster: {
    resolution: 20,
    perspectiveCorrect: true,
    backfaceCulling: true,
    scissorEnabled: false,
    scissorRect: { x: 3, y: 3, w: 14, h: 14 },
    msaa4x: false,
    depthTest: true,
    wireframeOverlay: true,
    pixelGrid: true,
    triangleCount: 1,
    vertices: DEFAULT_RASTER_VERTICES
  },
  textureMode: 'bilinear',
  sampleUv: [0.37, 0.42],
  texFootprint: 1.0,
  cacheConfig: {
    l1SizeKiB: 32,
    l2SizeKiB: 256,
    lineSizeBytes: 64,
    accessCount: 256,
    strideBytes: 128,
    pattern: 'linear',
    registerLatency: 1,
    sharedLatency: 24,
    l1Latency: 32,
    l2Latency: 160,
    vramLatency: 420,
    busBandwidthGBs: 448
  },
  compute: {
    dispatchX: 4,
    dispatchY: 4,
    workgroupX: 8,
    workgroupY: 8,
    warpSize: 32,
    registersPerThread: 32,
    sharedMemPerGroupKiB: 16,
    branchDivergenceMode: 'uniform',
    memoryAccessMode: 'coalesced',
    barrierEnabled: false
  },
  vramBudgetMiB: 512,
  vramResolution: '1080p',
  vramMsaa: 1,
  vramAllocations: createDefaultVramAllocations(1920, 1080, 1),
  perfConfigA: { ...PERF_PRESETS.balanced },
  perfConfigB: { ...PERF_PRESETS.fragmentBound },
  shaderPresetId: SHADER_PRESETS[0].id,
  vertexCode: SHADER_PRESETS[0].vertexShader,
  fragmentCode: SHADER_PRESETS[0].fragmentShader,
  selectedEventId: 1,
  breakpoints: {},
  completedScenarios: {},

  setTheme: (theme) => set({ theme }),
  setActiveNav: (activeNav) => set({ activeNav }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setLowDetailMode: (lowDetailMode) => set({ lowDetailMode }),
  setProfileId: (profileId) => set({ profileId }),
  setSimMode: (simMode) => set({ simMode }),
  toggleRunning: () =>
    set((s) => ({ clock: { ...s.clock, running: !s.clock.running } })),
  setSpeed: (speed) => set((s) => ({ clock: { ...s.clock, speed } })),
  stepSimulation: () => {
    const state = get();
    const nextClock = stepClock(state.clock, 13, 1.25);
    const profile = getProfileById(state.profileId);
    const hitBreakpoint = Boolean(state.breakpoints[nextClock.activeStageId]);
    let updatedClock = hitBreakpoint ? { ...nextClock, running: false } : nextClock;
    if (nextClock.frame > state.clock.frame) {
      const evts = buildFrameEvents(
        nextClock.frame,
        state.scene,
        profile,
        updatedClock.nextEventId
      );
      updatedClock = appendBoundedEvents(updatedClock, evts);
    }
    set({ clock: updatedClock });
  },
  resetSimulation: () => {
    const state = get();
    const profile = getProfileById(state.profileId);
    const base = resetClock(240);
    const withEvents = appendBoundedEvents(
      base,
      buildFrameEvents(1, state.scene, profile, 1)
    );
    set({ clock: withEvents, selectedEventId: 1 });
  },
  setInspector: (inspector) => set({ inspector }),
  updateScene: (patch) => set((s) => ({ scene: { ...s.scene, ...patch } })),
  addSceneObject: (type) =>
    set((s) => {
      const id = `${type}-${Date.now().toString(36)}`;
      const count = s.scene.objects.length;
      const obj: SceneObject = {
        id,
        name: `${type.toUpperCase()} #${count + 1}`,
        type,
        position: [(count % 3 - 1) * 1.4, 0.6, (Math.floor(count / 3) - 1) * 1.2],
        rotation: [0, 0, 0],
        scale: [0.85, 0.85, 0.85],
        color: type === 'cube' ? '#22d3ee' : type === 'sphere' ? '#10b981' : '#64748b',
        segments: type === 'sphere' ? 16 : 2,
        textured: true,
        visible: true
      };
      return {
        scene: {
          ...s.scene,
          objects: [...s.scene.objects, obj],
          selectedObjectId: id
        }
      };
    }),
  removeSceneObject: (id) =>
    set((s) => {
      const remaining = s.scene.objects.filter((o) => o.id !== id);
      return {
        scene: {
          ...s.scene,
          objects: remaining,
          selectedObjectId: remaining[0]?.id ?? ''
        }
      };
    }),
  updateSceneObject: (id, patch) =>
    set((s) => ({
      scene: {
        ...s.scene,
        objects: s.scene.objects.map((o) => (o.id === id ? { ...o, ...patch } : o))
      }
    })),
  updateRaster: (patch) => set((s) => ({ raster: { ...s.raster, ...patch } })),
  setTextureMode: (textureMode) => set({ textureMode }),
  setSampleUv: (sampleUv) => set({ sampleUv }),
  setTexFootprint: (texFootprint) => set({ texFootprint }),
  updateCacheConfig: (patch) =>
    set((s) => ({ cacheConfig: { ...s.cacheConfig, ...patch } })),
  updateCompute: (patch) => set((s) => ({ compute: { ...s.compute, ...patch } })),
  setVramBudgetMiB: (vramBudgetMiB) => set({ vramBudgetMiB }),
  setVramTargetPreset: (res, msaa) => {
    const dims: Record<'1080p' | '1440p' | '4k', [number, number]> = {
      '1080p': [1920, 1080],
      '1440p': [2560, 1440],
      '4k': [3840, 2160]
    };
    const [w, h] = dims[res];
    set({
      vramResolution: res,
      vramMsaa: msaa,
      vramAllocations: createDefaultVramAllocations(w, h, msaa)
    });
  },
  addVramAllocation: (label, type, sizeMiB, format) =>
    set((s) => ({
      vramAllocations: allocateVramBlock(
        s.vramAllocations,
        label,
        type,
        sizeMiB * 1024 * 1024,
        format
      )
    })),
  removeVramAllocation: (id) =>
    set((s) => ({
      vramAllocations: s.vramAllocations.filter((a) => a.id !== id)
    })),
  updatePerfConfigA: (patch) =>
    set((s) => ({ perfConfigA: { ...s.perfConfigA, ...patch } })),
  updatePerfConfigB: (patch) =>
    set((s) => ({ perfConfigB: { ...s.perfConfigB, ...patch } })),
  selectShaderPreset: (id) => {
    const preset = SHADER_PRESETS.find((p) => p.id === id) ?? SHADER_PRESETS[0];
    set({
      shaderPresetId: preset.id,
      vertexCode: preset.vertexShader,
      fragmentCode: preset.fragmentShader
    });
  },
  setShaderCode: (vertexCode, fragmentCode) => set({ vertexCode, fragmentCode }),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  toggleBreakpoint: (stageId) =>
    set((s) => ({
      breakpoints: { ...s.breakpoints, [stageId]: !s.breakpoints[stageId] }
    })),
  markScenarioComplete: (id) =>
    set((s) => ({
      completedScenarios: { ...s.completedScenarios, [id]: true }
    }))
}));
