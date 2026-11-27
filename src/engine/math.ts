import type { Vec2, Vec3, Vec4 } from './types';

export type Mat4 = Float32Array;

export function mat4Identity(): Mat4 {
  const m = new Float32Array(16);
  m[0] = 1;
  m[5] = 1;
  m[10] = 1;
  m[15] = 1;
  return m;
}

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[0 * 4 + row] * b[col * 4 + 0] +
        a[1 * 4 + row] * b[col * 4 + 1] +
        a[2 * 4 + row] * b[col * 4 + 2] +
        a[3 * 4 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

export function mat4Perspective(
  fovRad: number,
  aspect: number,
  near: number,
  far: number
): Mat4 {
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

export function mat4Translate(x: number, y: number, z: number): Mat4 {
  const m = mat4Identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

export function transformVec4(m: Mat4, v: Vec4): Vec4 {
  return {
    x: m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w,
    y: m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w,
    z: m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w,
    w: m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w
  };
}

export function perspectiveDivide(clip: Vec4): Vec3 {
  const w = Math.abs(clip.w) < 1e-8 ? 1e-8 : clip.w;
  return {
    x: clip.x / w,
    y: clip.y / w,
    z: clip.z / w
  };
}

export function ndcToViewport(
  ndc: Vec3,
  width: number,
  height: number
): { x: number; y: number; depth: number } {
  return {
    x: (ndc.x * 0.5 + 0.5) * width,
    y: (1.0 - (ndc.y * 0.5 + 0.5)) * height,
    depth: ndc.z * 0.5 + 0.5
  };
}

export function edgeFunction(a: Vec2, b: Vec2, p: Vec2): number {
  return (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
}

export function computeBarycentric(
  a: Vec2,
  b: Vec2,
  c: Vec2,
  p: Vec2
): { l0: number; l1: number; l2: number; area: number } {
  const area = edgeFunction(a, b, c);
  if (Math.abs(area) < 1e-8) {
    return { l0: 0, l1: 0, l2: 0, area: 0 };
  }
  const w0 = edgeFunction(b, c, p);
  const w1 = edgeFunction(c, a, p);
  const w2 = edgeFunction(a, b, p);
  return {
    l0: w0 / area,
    l1: w1 / area,
    l2: w2 / area,
    area
  };
}

export function perspectiveCorrectWeights(
  l0: number,
  l1: number,
  l2: number,
  w0: number,
  w1: number,
  w2: number
): [number, number, number] {
  const inv0 = l0 / Math.max(1e-6, w0);
  const inv1 = l1 / Math.max(1e-6, w1);
  const inv2 = l2 / Math.max(1e-6, w2);
  const sum = inv0 + inv1 + inv2;
  if (Math.abs(sum) < 1e-8) return [l0, l1, l2];
  return [inv0 / sum, inv1 / sum, inv2 / sum];
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
