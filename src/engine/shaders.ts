export interface ShaderPreset {
  id: string;
  name: string;
  description: string;
  inputsNote: string;
  outputsNote: string;
  vertexShader: string;
  fragmentShader: string;
}

export const SHADER_PRESETS: ShaderPreset[] = [
  {
    id: 'lambert',
    name: 'Lambert Diffuse Lighting',
    description: 'Directional diffuse lighting using interpolated surface normals and dot(N, L).',
    inputsNote: 'Attributes: aPosition (vec3), aNormal (vec3), aUv (vec2). Uniforms: uModel, uView, uProj, uLightDir, uColor.',
    outputsNote: 'Transforms vertices to clip space and shades fragments with ambient + max(dot(N, L), 0.0) diffuse.',
    vertexShader: `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec3 vNormal;
out vec2 vUv;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vUv = aUv;
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
uniform vec3 uLightDir;
uniform vec3 uColor;
out vec4 fragColor;
void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDir);
  float diff = max(dot(N, L), 0.0);
  vec3 col = uColor * (0.22 + 0.78 * diff);
  fragColor = vec4(col, 1.0);
}`
  },
  {
    id: 'solid',
    name: 'Solid Color',
    description: 'Minimal pass-through vertex transform with constant uniform color output.',
    inputsNote: 'Attributes: aPosition (vec3). Uniforms: uModel, uView, uProj, uColor.',
    outputsNote: 'Every covered fragment outputs the exact uniform RGB color with no lighting or texture lookups.',
    vertexShader: `#version 300 es
precision highp float;
in vec3 aPosition;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
void main() {
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(uColor, 1.0);
}`
  },
  {
    id: 'vertex-color',
    name: 'Vertex Color Interpolation',
    description: 'Derives RGB color per vertex from object-space position and interpolates across triangles.',
    inputsNote: 'Attributes: aPosition (vec3). Varying: vColor (vec3) interpolated by rasterizer.',
    outputsNote: 'Demonstrates smooth barycentric interpolation of per-vertex attributes.',
    vertexShader: `#version 300 es
precision highp float;
in vec3 aPosition;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec3 vColor;
void main() {
  vColor = aPosition * 0.5 + 0.5;
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor, 1.0);
}`
  },
  {
    id: 'texture-map',
    name: 'Texture Mapping',
    description: 'Samples a 2D procedural calibration texture via sampler2D uTexture and modulates with lighting.',
    inputsNote: 'Attributes: aPosition, aNormal, aUv. Sampler: uTexture (sampler2D).',
    outputsNote: 'Demonstrates TMU texture sampling using interpolated UV coordinates.',
    vertexShader: `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec3 vNormal;
out vec2 vUv;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vUv = aUv;
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
uniform sampler2D uTexture;
uniform vec3 uLightDir;
out vec4 fragColor;
void main() {
  vec3 tex = texture(uTexture, vUv).rgb;
  float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  fragColor = vec4(tex * (0.3 + 0.7 * diff), 1.0);
}`
  },
  {
    id: 'normals',
    name: 'Normal Visualization',
    description: 'Maps world-space surface normals from [-1, 1] into [0, 1] RGB debug colors.',
    inputsNote: 'Attributes: aPosition, aNormal. Varying: vNormal.',
    outputsNote: 'Red = +X, Green = +Y, Blue = +Z surface orientation.',
    vertexShader: `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec3 vNormal;
void main() {
  vNormal = normalize(mat3(uModel) * aNormal);
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;
in vec3 vNormal;
out vec4 fragColor;
void main() {
  fragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
}`
  },
  {
    id: 'uv-viz',
    name: 'UV Coordinate Visualization',
    description: 'Displays interpolated texture coordinates (U in Red, V in Green) directly on geometry.',
    inputsNote: 'Attributes: aPosition, aUv. Varying: vUv.',
    outputsNote: 'Highlights UV seams, stretching, and interpolation across faces.',
    vertexShader: `#version 300 es
precision highp float;
in vec3 aPosition;
in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
void main() {
  fragColor = vec4(vUv.x, vUv.y, 0.18, 1.0);
}`
  },
  {
    id: 'checkerboard',
    name: 'Procedural Checkerboard',
    description: 'Computes an analytical checkerboard pattern in the fragment shader without texture fetches.',
    inputsNote: 'Attributes: aPosition, aNormal, aUv. Uniforms: uTime, uLightDir.',
    outputsNote: 'Demonstrates ALU-only procedural shading with zero texture cache bandwidth.',
    vertexShader: `#version 300 es
precision highp float;
in vec3 aPosition;
in vec3 aNormal;
in vec2 aUv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;
out vec3 vNormal;
out vec2 vUv;
void main() {
  vNormal = mat3(uModel) * aNormal;
  vUv = aUv;
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;
in vec3 vNormal;
in vec2 vUv;
uniform vec3 uLightDir;
out vec4 fragColor;
void main() {
  vec2 tile = floor(vUv * 8.0);
  float c = mod(tile.x + tile.y, 2.0);
  vec3 base = mix(vec3(0.14, 0.19, 0.24), vec3(0.22, 0.78, 0.92), c);
  float diff = max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  fragColor = vec4(base * (0.3 + 0.7 * diff), 1.0);
}`
  }
];
