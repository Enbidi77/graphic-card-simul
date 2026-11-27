export type MetricOrigin =
  | 'browser_rendered'
  | 'user_configured'
  | 'simulated'
  | 'theoretical';

export type ThemeMode = 'dark' | 'light';

export type NavSectionId =
  | 'architecture'
  | 'pipeline'
  | 'compute'
  | 'rasterization'
  | 'texture-memory'
  | 'vram'
  | 'performance'
  | 'shaders'
  | 'frame-debugger'
  | 'scenarios';

export type SimulationMode =
  | 'graphics-pipeline'
  | 'compute-dispatch'
  | 'memory-trace'
  | 'frame-capture';

export type ComponentCategory =
  | 'frontend'
  | 'compute'
  | 'cache'
  | 'memory'
  | 'output';

export interface GpuComponentNode {
  id: string;
  name: string;
  shortName: string;
  category: ComponentCategory;
  description: string;
  educationalNote: string;
  level: 'chip' | 'sm';
  x: number;
  y: number;
  w: number;
  h: number;
  baseAddress?: string;
  specs: Record<string, string | number>;
}

export interface GpuConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  busWidthBits: number;
  stageIds: number[];
}

export interface GpuProfile {
  id: string;
  name: string;
  subtitle: string;
  classification: 'Generic Educational' | 'Vendor-Inspired Conceptual';
  gpcCount: number;
  smsPerGpc: number;
  coresPerSm: number;
  warpSize: number;
  maxWarpsPerSm: number;
  registersPerSm: number;
  sharedMemPerSmKiB: number;
  l1CachePerSmKiB: number;
  l2CacheMiB: number;
  vramGiB: number;
  memBandwidthGBs: number;
  clockMHz: number;
  textureUnitsPerSm: number;
  ropCount: number;
  notes: string;
}

export interface PipelineStageDef {
  id: number;
  key: string;
  name: string;
  shortName: string;
  domain: 'CPU' | 'Frontend' | 'Geometry' | 'Raster' | 'Shading' | 'Memory' | 'Output';
  programmable: boolean;
  activeComponents: string[];
  summary: string;
  educationalNote: string;
  inputsLabel: string;
  outputsLabel: string;
}

export interface PipelineStageState {
  stageId: number;
  status: 'idle' | 'active' | 'completed';
  invocations: number;
  cyclesSimulated: number;
  inputSummary: string;
  outputSummary: string;
}

export interface SimEvent {
  id: number;
  frame: number;
  timestampMs: number;
  stageId: number;
  type: 'draw' | 'dispatch' | 'stage' | 'memory' | 'barrier' | 'present';
  label: string;
  componentId: string;
  details: string;
  origin: MetricOrigin;
  breakpoint?: boolean;
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'plane';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  segments: number;
  textured: boolean;
  visible: boolean;
}

export interface SceneConfig {
  objects: SceneObject[];
  selectedObjectId: string;
  wireframe: boolean;
  texturesEnabled: boolean;
  lightingEnabled: boolean;
  shadowsEnabled: boolean;
  depthTestEnabled: boolean;
  autoRotate: boolean;
  lightDirection: [number, number, number];
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface RasterVertex {
  x: number;
  y: number;
  z: number;
  w: number;
  u: number;
  v: number;
  color: [number, number, number];
  normal: [number, number, number];
}

export interface RasterFragment {
  px: number;
  py: number;
  depth: number;
  barycentric: [number, number, number];
  uv: [number, number];
  color: [number, number, number];
  normal: [number, number, number];
  sampleCoverage: number;
  sampleMask: boolean[];
  passedDepth: boolean;
  passedScissor: boolean;
  triangleIndex: number;
}

export interface RasterConfig {
  resolution: number;
  perspectiveCorrect: boolean;
  backfaceCulling: boolean;
  scissorEnabled: boolean;
  scissorRect: { x: number; y: number; w: number; h: number };
  msaa4x: boolean;
  depthTest: boolean;
  wireframeOverlay: boolean;
  pixelGrid: boolean;
  triangleCount: 1 | 2;
  vertices: [RasterVertex, RasterVertex, RasterVertex];
}

export type FilterMode = 'nearest' | 'bilinear' | 'mipmap-bilinear';
export type AccessPattern = 'linear' | 'strided' | 'random' | 'tiled-2d';

export interface CacheHierarchyConfig {
  l1SizeKiB: number;
  l2SizeKiB: number;
  lineSizeBytes: number;
  accessCount: number;
  strideBytes: number;
  pattern: AccessPattern;
  registerLatency: number;
  sharedLatency: number;
  l1Latency: number;
  l2Latency: number;
  vramLatency: number;
  busBandwidthGBs: number;
}

export interface MemoryAccessRecord {
  index: number;
  address: number;
  cacheLine: number;
  tier: 'L1' | 'L2' | 'VRAM';
  latencyCycles: number;
  bytesTransferred: number;
}

export interface CacheSimulationResult {
  totalAccesses: number;
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  vramAccesses: number;
  l1HitRate: number;
  l2HitRate: number;
  estimatedBytesTransferred: number;
  averageLatencyCycles: number;
  estimatedBandwidthUtilPct: number;
  timeline: MemoryAccessRecord[];
}

export interface ComputeConfig {
  dispatchX: number;
  dispatchY: number;
  workgroupX: number;
  workgroupY: number;
  warpSize: number;
  registersPerThread: number;
  sharedMemPerGroupKiB: number;
  branchDivergenceMode: 'uniform' | 'half-warp' | 'checkerboard';
  memoryAccessMode: 'coalesced' | 'strided-4' | 'uncoalesced';
  barrierEnabled: boolean;
}

export interface ComputeThreadInfo {
  globalId: [number, number];
  localId: [number, number];
  workgroupId: [number, number];
  linearLocalId: number;
  warpId: number;
  laneId: number;
  branchTaken: 'A' | 'B';
  memoryAddress: number;
  status: 'completed' | 'diverged-masked' | 'barrier-wait';
}

export type VramResourceType =
  | 'vertex-buffer'
  | 'index-buffer'
  | 'texture'
  | 'depth-buffer'
  | 'stencil-buffer'
  | 'color-rt'
  | 'uniform-buffer'
  | 'compute-buffer';

export interface VramAllocation {
  id: string;
  label: string;
  type: VramResourceType;
  sizeBytes: number;
  offsetBytes: number;
  alignmentBytes: number;
  format: string;
  dimensions?: string;
  msaaSamples?: number;
  previewHex: string[];
}

export interface PerfWorkloadConfig {
  name: string;
  width: number;
  height: number;
  objectCount: number;
  trianglesPerObject: number;
  drawCalls: number;
  shaderOpsPerPixel: number;
  textureSize: number;
  overdrawFactor: number;
  branchDivergencePct: number;
  memoryBandwidthGBs: number;
  computeThroughputGFlops: number;
  msaaSamples: 1 | 2 | 4 | 8;
}

export interface PerfEstimate {
  totalTriangles: number;
  totalPixels: number;
  shadedFragments: number;
  cpuSubmitMs: number;
  vertexStageMs: number;
  rasterStageMs: number;
  fragmentStageMs: number;
  memoryStageMs: number;
  totalFrameMs: number;
  estimatedFps: number;
  bottleneck:
    | 'CPU Submission'
    | 'Vertex Processing'
    | 'Fragment Shading'
    | 'Memory / Texture Bandwidth'
    | 'Balanced';
  explanation: string;
  utilizations: {
    cpuFrontendPct: number;
    vertexPct: number;
    fragmentPct: number;
    memoryPct: number;
  };
}

export interface LearningScenario {
  id: string;
  number: number;
  title: string;
  targetLab: NavSectionId;
  objective: string;
  startingSetup: string;
  experiments: string[];
  visualExplanation: string;
  expectedObservation: string;
  question: string;
  choices: string[];
  correctChoiceIndex: number;
  answerExplanation: string;
  presetPatch?: Record<string, unknown>;
}

export interface InspectorTarget {
  kind:
    | 'component'
    | 'pipeline-stage'
    | 'scene-object'
    | 'pixel'
    | 'thread'
    | 'vram-block'
    | 'frame-event'
    | 'memory-access';
  id: string;
  title: string;
  subtitle: string;
  state: string;
  origin: MetricOrigin;
  inputs: Record<string, string | number>;
  outputs: Record<string, string | number>;
  config: Record<string, string | number>;
  memoryAddress?: string;
  history: string[];
  educationalExplanation: string;
}
