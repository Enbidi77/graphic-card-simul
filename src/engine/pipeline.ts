import type {
  GpuProfile,
  PipelineStageDef,
  PipelineStageState,
  SceneConfig,
  SimEvent
} from './types';

export const PIPELINE_STAGES: PipelineStageDef[] = [
  {
    id: 1,
    key: 'cpu-submit',
    name: '1. CPU Draw Command Submission',
    shortName: 'CPU Submit',
    domain: 'CPU',
    programmable: false,
    activeComponents: ['cmd-processor'],
    summary: 'Application encodes draw calls, pipeline state, and buffer bindings into a command buffer.',
    educationalNote:
      'High draw-call counts with tiny meshes can make CPU command encoding and driver validation the bottleneck before the GPU is saturated.',
    inputsLabel: 'Scene Objects & State',
    outputsLabel: 'Encoded Command Buffer'
  },
  {
    id: 2,
    key: 'cmd-proc',
    name: '2. Command Processor Decode',
    shortName: 'Cmd Proc',
    domain: 'Frontend',
    programmable: false,
    activeComponents: ['cmd-processor', 'work-scheduler'],
    summary: 'GPU front-end reads command packets from the ring buffer and configures hardware state.',
    educationalNote:
      'The Command Processor decouples CPU submission from GPU execution using an asynchronous ring buffer.',
    inputsLabel: 'Command Ring Buffer',
    outputsLabel: 'Hardware Draw Packets'
  },
  {
    id: 3,
    key: 'vertex-fetch',
    name: '3. Vertex Buffer Fetch (Input Assembler)',
    shortName: 'Vertex Fetch',
    domain: 'Geometry',
    programmable: false,
    activeComponents: ['work-scheduler', 'ldst-units', 'l2-cache', 'vram-ctrl'],
    summary: 'Reads index and vertex attributes (position, normal, UV) from VRAM through L2/L1 caches.',
    educationalNote:
      'Indexed drawing reuses transformed vertices via a post-transform vertex cache, reducing redundant vertex shader invocations.',
    inputsLabel: 'VBO / IBO Addresses',
    outputsLabel: 'Unpacked Vertex Attributes'
  },
  {
    id: 4,
    key: 'vertex-shader',
    name: '4. Vertex Shader Execution',
    shortName: 'Vertex Shader',
    domain: 'Geometry',
    programmable: true,
    activeComponents: ['gpc-cluster', 'sm-unit'],
    summary: 'Transforms vertex positions by Model-View-Projection matrices and computes per-vertex varyings.',
    educationalNote:
      'Vertex shaders run once per unique vertex across SM shader cores in warps, outputting clip-space gl_Position.',
    inputsLabel: 'Attributes + Uniforms',
    outputsLabel: 'Clip-Space Pos + Varyings'
  },
  {
    id: 5,
    key: 'primitive-assembly',
    name: '5. Primitive Assembly',
    shortName: 'Prim Assembly',
    domain: 'Geometry',
    programmable: false,
    activeComponents: ['gpc-cluster', 'sm-unit'],
    summary: 'Groups shaded vertices into triangles (or lines/points) according to draw topology.',
    educationalNote:
      'Three consecutive vertices (or indices) form each triangle primitive and establish its winding order (CW/CCW).',
    inputsLabel: 'Shaded Vertices',
    outputsLabel: 'Assembled Triangles'
  },
  {
    id: 6,
    key: 'clip-persp',
    name: '6. Clipping & Perspective Division',
    shortName: 'Clip & Persp',
    domain: 'Geometry',
    programmable: false,
    activeComponents: ['gpc-cluster'],
    summary: 'Clips triangles outside the view frustum and divides (x, y, z) by w to produce NDC [-1, 1].',
    educationalNote:
      'Perspective division (x/w, y/w, z/w) makes distant objects smaller; 1/w is retained for perspective-correct interpolation.',
    inputsLabel: 'Clip-Space Triangles',
    outputsLabel: 'NDC Triangles [-1, 1]'
  },
  {
    id: 7,
    key: 'viewport-transform',
    name: '7. Viewport Transformation',
    shortName: 'Viewport Xform',
    domain: 'Raster',
    programmable: false,
    activeComponents: ['gpc-cluster'],
    summary: 'Maps normalized device coordinates [-1, 1] into pixel window coordinates [0..W, 0..H].',
    educationalNote:
      'Back-face culling also discards triangles facing away from the camera before rasterization begins.',
    inputsLabel: 'NDC Coordinates',
    outputsLabel: 'Screen-Space Triangles'
  },
  {
    id: 8,
    key: 'rasterization',
    name: '8. Rasterization (Fragment Generation)',
    shortName: 'Rasterization',
    domain: 'Raster',
    programmable: false,
    activeComponents: ['gpc-cluster'],
    summary: 'Evaluates edge functions across screen tiles to find covered pixels and computes barycentric weights.',
    educationalNote:
      'Modern GPUs rasterize in 2×2 pixel quads so fragment shaders can compute screen-space derivatives (dFdx/dFdy) for mipmapping.',
    inputsLabel: 'Screen-Space Triangles',
    outputsLabel: '2×2 Fragment Quads'
  },
  {
    id: 9,
    key: 'early-z',
    name: '9. Early Depth / Stencil Test',
    shortName: 'Early-Z Test',
    domain: 'Raster',
    programmable: false,
    activeComponents: ['framebuffer', 'l2-cache'],
    summary: 'Rejects fragments occluded by closer geometry before invoking expensive fragment shaders.',
    educationalNote:
      'Rendering opaque geometry front-to-back maximizes Early-Z rejection. Writing gl_FragDepth or using discard can disable Early-Z.',
    inputsLabel: 'Candidate Fragments + Depth Buffer',
    outputsLabel: 'Visible Fragments'
  },
  {
    id: 10,
    key: 'fragment-shader',
    name: '10. Fragment / Pixel Shader Execution',
    shortName: 'Fragment Shader',
    domain: 'Shading',
    programmable: true,
    activeComponents: ['gpc-cluster', 'sm-unit'],
    summary: 'Computes final shaded color per visible fragment using interpolated attributes and lighting equations.',
    educationalNote:
      'Fragment shading often dominates frame time at 1440p/4K or under heavy overdraw because millions of pixels execute per frame.',
    inputsLabel: 'Interpolated Varyings',
    outputsLabel: 'Shaded RGBA Color'
  },
  {
    id: 11,
    key: 'texture-memory',
    name: '11. Texture Sampling & Memory Ops',
    shortName: 'Tex & Memory',
    domain: 'Memory',
    programmable: false,
    activeComponents: ['tex-units', 'ldst-units', 'l2-cache', 'vram-ctrl'],
    summary: 'Texture units select mip levels, filter texels, and fetch missing cache lines from L2/VRAM.',
    educationalNote:
      'Texture caches exploit 2D spatial locality across 2×2 fragment quads. Mipmaps keep texel footprints near 1:1 to prevent cache thrashing.',
    inputsLabel: 'UV Coords + Derivatives',
    outputsLabel: 'Filtered Texel Colors'
  },
  {
    id: 12,
    key: 'rop-blend',
    name: '12. Depth/Stencil Write & Alpha Blending',
    shortName: 'ROP & Blend',
    domain: 'Output',
    programmable: false,
    activeComponents: ['framebuffer', 'l2-cache'],
    summary: 'Updates depth/stencil targets and blends translucent fragment outputs with existing color buffer pixels.',
    educationalNote:
      'ROPs enforce strict atomic ordering per pixel so overlapping triangles in draw-call order blend deterministically.',
    inputsLabel: 'Shaded Color + Render Target',
    outputsLabel: 'Updated Color & Depth Targets'
  },
  {
    id: 13,
    key: 'present',
    name: '13. Framebuffer Present (Swapchain)',
    shortName: 'Present',
    domain: 'Output',
    programmable: false,
    activeComponents: ['framebuffer', 'vram-ctrl'],
    summary: 'Resolves MSAA targets if enabled and swaps the completed backbuffer to the display scanout.',
    educationalNote:
      'Double or triple buffering prevents tearing by scanning out the front buffer while the GPU renders the next frame into the back buffer.',
    inputsLabel: 'Completed Backbuffer',
    outputsLabel: 'Presented Display Frame'
  }
];

export function estimateObjectTriangles(type: 'cube' | 'sphere' | 'plane', segments: number): number {
  const s = Math.max(1, Math.round(segments));
  if (type === 'cube') return 12 * s * s;
  if (type === 'plane') return 2 * s * s;
  // UV sphere: 2 * widthSegments * (heightSegments - 1)
  return Math.max(16, 2 * s * Math.max(2, Math.floor(s * 0.75)));
}

export function estimateSceneMetrics(scene: SceneConfig) {
  const visible = scene.objects.filter((o) => o.visible);
  const drawCalls = visible.length;
  const totalTriangles = visible.reduce(
    (sum, obj) => sum + estimateObjectTriangles(obj.type, obj.segments),
    0
  );
  const totalVertices = Math.round(totalTriangles * 1.65);
  const culledTriangles = Math.round(totalTriangles * 0.44);
  const survivingTriangles = Math.max(1, totalTriangles - culledTriangles);
  const candidateFragments = survivingTriangles * 88;
  const earlyZRejected = scene.depthTestEnabled ? Math.round(candidateFragments * 0.28) : 0;
  const shadedFragments = Math.max(1, candidateFragments - earlyZRejected);
  const textureFetches = scene.texturesEnabled ? shadedFragments * 2 : 0;

  return {
    drawCalls,
    totalTriangles,
    totalVertices,
    culledTriangles,
    survivingTriangles,
    candidateFragments,
    earlyZRejected,
    shadedFragments,
    textureFetches
  };
}

export function computePipelineStageStates(
  activeStageId: number,
  scene: SceneConfig,
  profile: GpuProfile
): PipelineStageState[] {
  const m = estimateSceneMetrics(scene);
  const smCount = profile.gpcCount * profile.smsPerGpc;
  const scale = Math.max(0.25, 32 / Math.max(1, smCount));

  return PIPELINE_STAGES.map((stage) => {
    const status: PipelineStageState['status'] =
      activeStageId === 0
        ? 'idle'
        : stage.id < activeStageId
          ? 'completed'
          : stage.id === activeStageId
            ? 'active'
            : 'idle';

    let invocations = 0;
    let cycles = 0;
    let inputSummary = '';
    let outputSummary = '';

    switch (stage.id) {
      case 1:
        invocations = m.drawCalls;
        cycles = Math.round(m.drawCalls * 180);
        inputSummary = `${m.drawCalls} visible meshes`;
        outputSummary = `${m.drawCalls} draw packets`;
        break;
      case 2:
        invocations = m.drawCalls;
        cycles = Math.round(m.drawCalls * 45);
        inputSummary = `${m.drawCalls} packets`;
        outputSummary = `State + ${m.drawCalls} kicks`;
        break;
      case 3:
        invocations = m.totalVertices;
        cycles = Math.round((m.totalVertices * 0.4) * scale);
        inputSummary = `${(m.totalVertices * 32 / 1024).toFixed(1)} KiB VBO`;
        outputSummary = `${m.totalVertices} vertices`;
        break;
      case 4:
        invocations = m.totalVertices;
        cycles = Math.round((m.totalVertices * 1.1) * scale);
        inputSummary = `${m.totalVertices} verts`;
        outputSummary = `${Math.ceil(m.totalVertices / profile.warpSize)} warps`;
        break;
      case 5:
        invocations = m.totalTriangles;
        cycles = Math.round(m.totalTriangles * 0.35);
        inputSummary = `${m.totalVertices} shaded verts`;
        outputSummary = `${m.totalTriangles} triangles`;
        break;
      case 6:
        invocations = m.totalTriangles;
        cycles = Math.round(m.totalTriangles * 0.45);
        inputSummary = `${m.totalTriangles} clip tris`;
        outputSummary = `${m.survivingTriangles} NDC tris`;
        break;
      case 7:
        invocations = m.survivingTriangles;
        cycles = Math.round(m.survivingTriangles * 0.25);
        inputSummary = `${m.survivingTriangles} NDC tris`;
        outputSummary = `${m.culledTriangles} culled`;
        break;
      case 8:
        invocations = m.candidateFragments;
        cycles = Math.round(m.candidateFragments * 0.08 * scale);
        inputSummary = `${m.survivingTriangles} screen tris`;
        outputSummary = `${Math.ceil(m.candidateFragments / 4)} quads`;
        break;
      case 9:
        invocations = m.candidateFragments;
        cycles = Math.round(m.candidateFragments * 0.04);
        inputSummary = `${m.candidateFragments} frags`;
        outputSummary = `${m.earlyZRejected} Early-Z culled`;
        break;
      case 10:
        invocations = m.shadedFragments;
        cycles = Math.round(
          m.shadedFragments * (scene.lightingEnabled ? 0.24 : 0.1) * scale
        );
        inputSummary = `${m.shadedFragments} visible frags`;
        outputSummary = `${Math.ceil(m.shadedFragments / profile.warpSize)} warps`;
        break;
      case 11:
        invocations = m.textureFetches;
        cycles = Math.round(m.textureFetches * 0.14 * (448 / profile.memBandwidthGBs));
        inputSummary = scene.texturesEnabled ? `${m.textureFetches} taps` : 'Textures disabled';
        outputSummary = scene.texturesEnabled ? 'Filtered RGBA' : 'Bypassed';
        break;
      case 12:
        invocations = m.shadedFragments;
        cycles = Math.round(m.shadedFragments * 0.05);
        inputSummary = `${m.shadedFragments} shaded px`;
        outputSummary = 'RT0 + Depth updated';
        break;
      case 13:
        invocations = 1;
        cycles = 120;
        inputSummary = 'Backbuffer RT0';
        outputSummary = 'Swapchain Present';
        break;
    }

    return {
      stageId: stage.id,
      status,
      invocations,
      cyclesSimulated: cycles,
      inputSummary,
      outputSummary
    };
  });
}

export function buildFrameEvents(
  frame: number,
  scene: SceneConfig,
  profile: GpuProfile,
  baseId: number
): SimEvent[] {
  const states = computePipelineStageStates(13, scene, profile);
  let t = 0;
  return PIPELINE_STAGES.map((stage, idx) => {
    const st = states[idx];
    const dt = Number(((st.cyclesSimulated / Math.max(100, profile.clockMHz)) * 0.015).toFixed(3));
    t = Number((t + Math.max(0.02, dt)).toFixed(3));
    const type: SimEvent['type'] =
      stage.id === 1
        ? 'draw'
        : stage.id === 11
          ? 'memory'
          : stage.id === 13
            ? 'present'
            : 'stage';
    return {
      id: baseId + idx,
      frame,
      timestampMs: t,
      stageId: stage.id,
      type,
      label: stage.name,
      componentId: stage.activeComponents[0] ?? 'gpc-cluster',
      details: `${st.inputSummary} -> ${st.outputSummary} (${st.invocations.toLocaleString()} ops)`,
      origin: 'simulated'
    };
  });
}
