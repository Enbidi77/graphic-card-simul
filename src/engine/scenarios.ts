import type { LearningScenario } from './types';

export const LEARNING_SCENARIOS: LearningScenario[] = [
  {
    id: 'tri-to-pixel',
    number: 1,
    title: 'From a 3D Triangle to a Pixel',
    targetLab: 'pipeline',
    objective: 'Trace a single draw call through all 13 stages from CPU submission to swapchain present.',
    startingSetup: 'Default 3D scene with cube, sphere, and plane; pipeline paused at Stage 1.',
    experiments: [
      'Click Step Forward repeatedly to watch each stage activate and pass data downstream.',
      'Select Stage 4 (Vertex Shader) and Stage 8 (Rasterization) to compare vertex vs. fragment counts.'
    ],
    visualExplanation: 'The pipeline graph highlights active stages while the architecture path animates data movement.',
    expectedObservation: 'A few hundred vertices expand into tens of thousands of fragments after rasterization.',
    question: 'Which stage converts continuous screen-space triangles into discrete pixel fragments?',
    choices: ['Vertex Shader', 'Primitive Assembly', 'Rasterization', 'Framebuffer Present'],
    correctChoiceIndex: 2,
    answerExplanation: 'Rasterization evaluates edge functions across screen pixels/samples to generate fragments.'
  },
  {
    id: 'vertex-transform',
    number: 2,
    title: 'How a Vertex Shader Transforms Geometry',
    targetLab: 'shaders',
    objective: 'Observe how model, view, and projection matrices map local object coordinates into clip space.',
    startingSetup: 'Shader Playground loaded with the Vertex Color Interpolation preset.',
    experiments: [
      'Modify the vertex shader position offset (e.g., add a sine wave along Y) and click Compile.',
      'Inspect the simulated vertex invocation trace to view local vs. clip-space coordinates.'
    ],
    visualExplanation: 'Live WebGL2 preview updates immediately when vertex positions are transformed.',
    expectedObservation: 'Changing vertex positions in the vertex shader reshapes the mesh before rasterization.',
    question: 'What coordinate space must a vertex shader output in gl_Position?',
    choices: ['Screen Pixel Space', 'Clip Space (Homogeneous x,y,z,w)', 'Texture UV Space', 'World Space'],
    correctChoiceIndex: 1,
    answerExplanation: 'Vertex shaders output homogeneous clip-space coordinates; hardware performs clipping and division by w.'
  },
  {
    id: 'perspective-interp',
    number: 3,
    title: 'How Perspective Changes Interpolation',
    targetLab: 'rasterization',
    objective: 'Compare affine screen-space interpolation against perspective-correct 1/w interpolation.',
    startingSetup: 'Rasterization Lab with a tilted triangle whose vertices have distinct w depths (1.0, 2.6, 1.5).',
    experiments: [
      'Toggle Perspective-Correct Interpolation OFF and ON.',
      'Click a pixel near the center of the triangle and compare its interpolated UV and color weights.'
    ],
    visualExplanation: 'Barycentric weights shift toward closer (smaller w) vertices under perspective correction.',
    expectedObservation: 'Affine interpolation warps textures/attributes on slanted surfaces; perspective correction fixes it.',
    question: 'Why does perspective-correct interpolation divide attributes by w before interpolating?',
    choices: [
      'Attributes vary linearly in screen space only after dividing by clip-space w',
      'To reduce VRAM usage by half',
      'Because w is always zero for back-facing triangles',
      'To disable depth testing'
    ],
    correctChoiceIndex: 0,
    answerExplanation: 'In screen space, 1/w and (attribute / w) vary linearly across a triangle, whereas raw attributes do not.'
  },
  {
    id: 'fragment-cost',
    number: 4,
    title: 'Why Fragment Shading Can Become Expensive',
    targetLab: 'performance',
    objective: 'Measure how shader ALU complexity and overdraw rapidly turn a balanced frame fragment-bound.',
    startingSetup: 'Performance Lab with the Balanced 1080p preset.',
    experiments: [
      'Increase Shader Ops/Pixel from 48 to 320 and Overdraw from 1.6x to 4.0x.',
      'Compare Config A (Balanced) side by side with Config B (Fragment Heavy).'
    ],
    visualExplanation: 'Fragment stage bar grows to dominate total frame time while vertex time stays small.',
    expectedObservation: 'Because millions of pixels execute per frame, per-fragment cost scales multiplicatively with overdraw.',
    question: 'Which two factors multiply together to determine total fragment shader invocations?',
    choices: [
      'Draw calls × Vertex count',
      'Screen pixels × Overdraw factor',
      'L2 cache size × Clock speed',
      'VRAM capacity × Index count'
    ],
    correctChoiceIndex: 1,
    answerExplanation: 'Each pixel covered multiple times by overlapping geometry invokes the fragment shader repeatedly.'
  },
  {
    id: 'texture-sampling',
    number: 5,
    title: 'How Textures Are Sampled',
    targetLab: 'texture-memory',
    objective: 'Compare nearest-neighbor texel lookup against 4-tap bilinear filtering.',
    startingSetup: 'Texture & Memory Explorer with UV coordinates at (0.37, 0.42).',
    experiments: [
      'Switch between Nearest-Neighbor and Bilinear Filtering.',
      'Drag the U/V sliders slightly across texel boundaries and watch the 4 bilinear tap weights.'
    ],
    visualExplanation: 'Nearest snaps to one texel; bilinear blends the 4 surrounding texels weighted by fractional distance.',
    expectedObservation: 'Bilinear filtering eliminates blocky steps at the cost of reading 4 neighboring texels.',
    question: 'How many texels does a single 2D bilinear filter tap combine?',
    choices: ['1 texel', '2 texels', '4 texels (2×2 neighborhood)', '16 texels'],
    correctChoiceIndex: 2,
    answerExplanation: 'Bilinear filtering interpolates horizontally and vertically across a 2×2 neighborhood of texels.'
  },
  {
    id: 'mipmaps-aliasing',
    number: 6,
    title: 'Why Mipmaps Reduce Texture Aliasing',
    targetLab: 'texture-memory',
    objective: 'See how mipmap level selection matches texel footprint to screen pixel size.',
    startingSetup: 'Texture & Memory Explorer in Mipmap + Bilinear mode.',
    experiments: [
      'Increase the Pixel Footprint slider from 1.0 texels to 8.0 texels (simulating a distant surface).',
      'Observe the selected Mip Level (LOD) and how pre-filtered mips prevent shimmering.'
    ],
    visualExplanation: 'Higher footprints automatically step down to smaller mip levels, improving both quality and cache locality.',
    expectedObservation: 'Mipmapping prevents undersampling aliasing and keeps neighboring pixels hitting the same L1 cache lines.',
    question: 'Roughly how much extra VRAM does a full 2D mipmap chain add to a base texture?',
    choices: ['100% (doubles size)', '~33.3% (1/3 extra)', '10%', '0% (free)'],
    correctChoiceIndex: 1,
    answerExplanation: 'Each mip level is 1/4 the area of the previous level: 1/4 + 1/16 + 1/64 + ... = 1/3 (~33.3%).'
  },
  {
    id: 'depth-testing',
    number: 7,
    title: 'How Depth Testing Hides Geometry',
    targetLab: 'rasterization',
    objective: 'Verify how the Z-buffer resolves visibility between two overlapping triangles.',
    startingSetup: 'Rasterization Lab with 2 overlapping triangles and Depth Test enabled.',
    experiments: [
      'Toggle Depth Testing OFF and ON to see the second triangle overwrite closer pixels.',
      'Check the Depth Rejected counter when Depth Testing is active.'
    ],
    visualExplanation: 'Each pixel stores its nearest depth value; farther fragments fail the comparison and are discarded.',
    expectedObservation: 'With depth testing enabled, closer surfaces stay visible regardless of draw order.',
    question: 'What happens to a fragment whose depth is greater than the existing Z-buffer value (standard LESS test)?',
    choices: ['It is blended automatically', 'It is rejected and discarded', 'It doubles MSAA coverage', 'It flushes L2 cache'],
    correctChoiceIndex: 1,
    answerExplanation: 'Under a standard LESS depth test, farther fragments fail and are discarded without overwriting color.'
  },
  {
    id: 'blending-transparency',
    number: 8,
    title: 'How Blending Combines Transparent Objects',
    targetLab: 'pipeline',
    objective: 'Understand why alpha blending happens at Stage 12 (ROPs) and requires back-to-front sorting.',
    startingSetup: 'Graphics Pipeline Simulator focused on Stage 9 (Early-Z) and Stage 12 (ROP & Blend).',
    experiments: [
      'Inspect Stage 12 to see how source and destination colors combine: SrcColor*SrcAlpha + DstColor*(1-SrcAlpha).',
      'Compare opaque Early-Z rejection against translucent blending where fragments cannot simply discard background pixels.'
    ],
    visualExplanation: 'ROPs read the existing render target pixel, blend it with the new fragment color, and write back.',
    expectedObservation: 'Alpha blending increases render-target read-modify-write bandwidth and requires sorted draw order.',
    question: 'Why must transparent geometry normally be drawn back-to-front?',
    choices: [
      'Alpha blending is order-dependent (non-commutative)',
      'Vertex shaders cannot process transparent meshes first',
      'Front-to-back disables texture sampling',
      'VRAM only stores back-to-front indices'
    ],
    correctChoiceIndex: 0,
    answerExplanation: 'Standard Over blending (src*a + dst*(1-a)) produces different results depending on draw order.'
  },
  {
    id: 'memory-patterns',
    number: 9,
    title: 'Why Memory Access Patterns Matter',
    targetLab: 'texture-memory',
    objective: 'Contrast linear/tiled access locality against strided and random memory patterns.',
    startingSetup: 'Texture & Memory Explorer cache simulator set to Linear access.',
    experiments: [
      'Switch Access Pattern from Linear to Strided (128B) and Random.',
      'Compare L1 Hit Rate, Average Modeled Latency (cycles), and VRAM Accesses.'
    ],
    visualExplanation: 'Address timeline turns from cyan/green (L1/L2 hits) to red/amber (VRAM misses) as locality breaks.',
    expectedObservation: 'Cache-line reuse collapses under random/strided access, multiplying latency and bytes transferred.',
    question: 'Why does linear consecutive access achieve a high L1 cache hit rate?',
    choices: [
      'Multiple consecutive 4-byte reads share the same 64B/128B cache line',
      'Linear addresses bypass the memory controller',
      'VRAM latency becomes 1 cycle for linear reads',
      'Linear reads disable L2 cache'
    ],
    correctChoiceIndex: 0,
    answerExplanation: 'Fetching one cache line brings in many adjacent elements, so subsequent consecutive reads hit L1.'
  },
  {
    id: 'branch-divergence',
    number: 10,
    title: 'How Branch Divergence Reduces Parallel Efficiency',
    targetLab: 'compute',
    objective: 'Observe SIMT warp masking when threads inside the same warp take different if/else paths.',
    startingSetup: 'Compute Shader Simulator with 8×8 workgroups and Uniform branching.',
    experiments: [
      'Switch Branch Mode from Uniform to Half-Warp Divergent or Checkerboard.',
      'Click individual threads in Warp 0 to inspect active vs. masked lane status.'
    ],
    visualExplanation: 'Within a lockstep warp, hardware executes Branch A with half the lanes masked, then Branch B.',
    expectedObservation: 'Branch efficiency drops to 50%, cutting effective SIMT throughput in half.',
    question: 'When does an if/else branch cause SIMT divergence penalty?',
    choices: [
      'Whenever any shader contains an if statement',
      'Only when threads within the same warp/wavefront take different paths',
      'Only when workgroups have fewer than 4 threads',
      'Whenever shared memory is used'
    ],
    correctChoiceIndex: 1,
    answerExplanation: 'Uniform branches where all lanes in a warp take the same path incur no divergence penalty.'
  },
  {
    id: 'resolution-scaling',
    number: 11,
    title: 'Why Higher Resolutions Increase Pixel Workloads',
    targetLab: 'vram',
    objective: 'Compare 1080p vs. 4K render target storage and fragment processing workload.',
    startingSetup: 'VRAM Explorer set to 1920×1080 RGBA8 + Depth + Stencil.',
    experiments: [
      'Switch resolution preset from 1920×1080 to 3840×2160.',
      'Observe the 4× jump in color, depth, and stencil buffer MiB allocations.'
    ],
    visualExplanation: 'Doubling both width and height quadruples total pixel count (2.07M → 8.29M pixels).',
    expectedObservation: 'A 3840×2160 target consumes 4× the framebuffer memory and 4× the pixel shading work of 1920×1080.',
    question: 'How many times more pixels does 3840×2160 (4K) contain compared to 1920×1080 (1080p)?',
    choices: ['2×', '3×', '4×', '8×'],
    correctChoiceIndex: 2,
    answerExplanation: '(3840 / 1920) × (2160 / 1080) = 2 × 2 = 4× as many pixels.'
  },
  {
    id: 'msaa-impact',
    number: 12,
    title: 'How Multisampling Affects Sample Processing & Storage',
    targetLab: 'rasterization',
    objective: 'Inspect 4× MSAA subpixel coverage masks and their memory impact in VRAM.',
    startingSetup: 'Rasterization Lab with MSAA 4× toggled OFF.',
    experiments: [
      'Enable 4× MSAA and click an edge pixel on the triangle boundary.',
      'Inspect the 4 subpixel coverage samples and check the Sample Evaluations counter.'
    ],
    visualExplanation: 'Edge pixels record partial coverage (1/4, 2/4, 3/4) for smoother anti-aliased edges while shading once per pixel.',
    expectedObservation: '4× MSAA quadruples depth/color sample storage and coverage checks without quadrupling fragment shader runs on interior pixels.',
    question: 'What does 4× MSAA store per pixel in the multisampled render target before resolve?',
    choices: [
      '1 color and 1 depth value',
      '4 color/depth sample slots per pixel',
      '4 separate vertex buffers',
      '4 mipmap chains'
    ],
    correctChoiceIndex: 1,
    answerExplanation: '4× MSAA allocates 4 sample slots per pixel for color and depth/stencil, increasing framebuffer memory by ~4×.'
  },
  {
    id: 'compute-dispatch',
    number: 13,
    title: 'How Compute Workloads Are Dispatched',
    targetLab: 'compute',
    objective: 'Explore how Dispatch Grid × Workgroup Dimensions map onto Warps and SM Occupancy.',
    startingSetup: 'Compute Shader Simulator with 4×4 dispatch and 8×8 workgroup (64 threads/group).',
    experiments: [
      'Increase Registers/Thread from 32 to 96 and watch Occupancy drop.',
      'Select a thread in the grid to inspect its Workgroup ID, Local ID, Global ID, Warp ID, and Lane ID.'
    ],
    visualExplanation: 'Finite SM register files and shared memory limit how many warps can reside simultaneously on an SM.',
    expectedObservation: 'High register or shared memory usage caps active warps per SM even when the dispatch has thousands of threads.',
    question: 'If a compute dispatch launches 4×2 workgroups of 8×8 threads each, how many total threads run?',
    choices: ['64 threads', '128 threads', '512 threads', '1024 threads'],
    correctChoiceIndex: 2,
    answerExplanation: '4 × 2 = 8 workgroups; 8 × 8 = 64 threads per workgroup; 8 × 64 = 512 total threads.'
  },
  {
    id: 'cpu-submission',
    number: 14,
    title: 'How CPU Submission Overhead Can Limit Throughput',
    targetLab: 'performance',
    objective: 'Diagnose a CPU-bound workload caused by thousands of tiny draw calls.',
    startingSetup: 'Performance Lab loaded with the CPU Submission Overhead preset (4,500 draw calls).',
    experiments: [
      'Observe the Bottleneck Diagnosis flagging CPU Submission despite low vertex and fragment times.',
      'Reduce Draw Calls to 45 (simulating GPU instancing/batching) while keeping total triangles constant.'
    ],
    visualExplanation: 'Each draw call adds CPU validation and command encoding latency; instancing merges them into one submission.',
    expectedObservation: 'Frame time plummets when thousands of small draws are batched into instanced draws.',
    question: 'Which technique directly reduces CPU draw-call submission overhead for repeated meshes?',
    choices: [
      'Increasing MSAA to 8×',
      'GPU Instancing / Draw Batching',
      'Disabling Mipmaps',
      'Increasing Shader Ops per Pixel'
    ],
    correctChoiceIndex: 1,
    answerExplanation: 'Instancing submits many copies of a mesh in a single draw call, cutting CPU command overhead.'
  }
];
