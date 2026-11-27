# GPU Lab — Interactive GPU Architecture & Rendering Simulator

An interactive graphics engineering and educational workstation that visualizes and simulates how a modern GPU executes graphics and compute workloads—from CPU draw submission through vertex transformation, rasterization, texture sampling, cache hierarchy, VRAM allocation, and final pixel output.

## Quick Start (`pnpm`)

```bash
pnpm install
pnpm dev
```

### Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start Vite development server on `http://localhost:5173` |
| `pnpm build` | Strict TypeScript type-check (`tsc -b`) + production Vite bundle |
| `pnpm test` | Run Vitest unit tests for the deterministic simulation engine |
| `pnpm test:e2e` | Run Playwright end-to-end smoke tests |
| `pnpm lint` | Run ESLint across TypeScript/React source |
| `pnpm format` | Format repository with Prettier |

## Architecture Overview

GPU Lab strictly separates its **CPU-side educational simulation engine** (`src/engine/`) from both the **React UI** (`src/components/`, `src/labs/`) and the **real WebGL2 / Three.js renderer**:

- `src/engine/architecture.ts` — Configurable educational GPU profiles (`EDU-G100`, `EDU-W400`, `EDU-C64`, `EDU-M16`), chip-level & SM-level component graphs, and interconnect definitions.
- `src/engine/clock.ts` — Deterministic simulation clock (`play`, `pause`, `step`, `reset`, `speed`) with bounded event history ring buffer.
- `src/engine/pipeline.ts` — 13-stage graphics pipeline state machine, stage counters, active hardware component mapping, and frame event generator.
- `src/engine/math.ts` & `src/engine/rasterizer.ts` — Deterministic 3D transforms, perspective division, edge functions, barycentric & perspective-correct interpolation, 4× MSAA subpixel masks, back-face culling, scissor test, and depth buffer.
- `src/engine/memory.ts` — Nearest/bilinear/mipmap texture sampling and L1/L2/VRAM cache hierarchy simulation across linear, strided, 2D-tiled, and random access patterns.
- `src/engine/compute.ts` — Compute dispatch grid, workgroup/thread/warp indexing, SIMT branch divergence masking, simplified occupancy limiters, and memory coalescing transaction modeling.
- `src/engine/vram.ts` — Aligned VRAM/framebuffer allocator with MiB/GiB accounting and hex preview.
- `src/engine/performance.ts` — Deterministic frame-time breakdown and bottleneck classifier with side-by-side comparison.
- `src/engine/scenarios.ts` — 14 guided interactive learning scenarios with hands-on experiments and knowledge checks.
- `src/store/useGpuLabStore.ts` — Zustand store coordinating simulation state, theme, active lab, and context-sensitive Inspector panel.

## Data Accuracy & Simulation Assumptions

Every metric in GPU Lab is tagged with its origin:

- **Browser-Rendered (`browser_rendered`)**: Live WebGL2/Three.js canvas output, shader compilation logs, and standard `WEBGL_debug_renderer_info` when exposed by the browser.
- **User-Configured (`user_configured`)**: Resolution, MSAA sample count, cache sizes, dispatch dimensions, scene geometry complexity, and shader code.
- **Simulated (`simulated`)**: Pipeline stage cycles, cache hit/miss timelines, warp divergence efficiency, and modeled frame-time breakdowns.
- **Theoretical (`theoretical`)**: Peak FP32 TFLOPS (`cores × 2 × clock`), framebuffer byte footprints (`W × H × BPP × MSAA`), and mipmap chain overhead (`~1.333×`).

Browser APIs cannot inspect physical vendor hardware registers, private warp schedulers, or real L1/L2 cache lines; all internal hardware views are explicitly labeled educational models.
