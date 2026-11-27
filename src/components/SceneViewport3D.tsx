import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useGpuLabStore } from '../store/useGpuLabStore';
import { estimateObjectTriangles } from '../engine';
import type { SceneObject } from '../engine';

function SceneMesh({
  obj,
  wireframe,
  texturesEnabled,
  lightingEnabled,
  selected,
  onSelect
}: {
  obj: SceneObject;
  wireframe: boolean;
  texturesEnabled: boolean;
  lightingEnabled: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const texture = useMemo(() => {
    const size = 64;
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const c = ((x >> 3) + (y >> 3)) % 2 === 0;
        data[idx] = c ? 215 : 42;
        data[idx + 1] = c ? 226 : 55;
        data[idx + 2] = c ? 236 : 72;
        data[idx + 3] = 255;
      }
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.needsUpdate = true;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    return tex;
  }, []);

  if (!obj.visible) return null;

  return (
    <mesh
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {obj.type === 'cube' && (
        <boxGeometry args={[1, 1, 1, obj.segments, obj.segments, obj.segments]} />
      )}
      {obj.type === 'sphere' && (
        <sphereGeometry args={[0.7, Math.max(6, obj.segments), Math.max(4, Math.floor(obj.segments * 0.75))]} />
      )}
      {obj.type === 'plane' && <planeGeometry args={[1, 1, obj.segments, obj.segments]} />}
      {lightingEnabled ? (
        <meshStandardMaterial
          color={selected ? '#22d3ee' : obj.color}
          map={texturesEnabled && obj.textured ? texture : null}
          wireframe={wireframe}
          roughness={0.55}
          metalness={0.15}
        />
      ) : (
        <meshBasicMaterial
          color={selected ? '#22d3ee' : obj.color}
          map={texturesEnabled && obj.textured ? texture : null}
          wireframe={wireframe}
        />
      )}
    </mesh>
  );
}

export const SceneViewport3D: React.FC = () => {
  const scene = useGpuLabStore((s) => s.scene);
  const updateScene = useGpuLabStore((s) => s.updateScene);
  const setInspector = useGpuLabStore((s) => s.setInspector);

  const handleSelect = (obj: SceneObject) => {
    updateScene({ selectedObjectId: obj.id });
    const tris = estimateObjectTriangles(obj.type, obj.segments);
    setInspector({
      kind: 'scene-object',
      id: obj.id,
      title: obj.name,
      subtitle: `3D Scene Mesh (${obj.type})`,
      state: obj.visible ? 'Visible in Draw List' : 'Hidden',
      origin: 'browser_rendered',
      inputs: { Type: obj.type, Segments: obj.segments, Textured: String(obj.textured) },
      outputs: { Triangles: tris, Vertices: Math.round(tris * 1.65) },
      config: {
        Position: obj.position.map((v) => v.toFixed(2)).join(', '),
        Scale: obj.scale.map((v) => v.toFixed(2)).join(', ')
      },
      history: ['Bound VBO/IBO', 'Submitted DrawIndexed'],
      educationalExplanation:
        'Each visible mesh generates a draw call whose vertex and triangle counts directly feed the simulated graphics pipeline.'
    });
  };

  return (
    <div className="relative h-full w-full bg-graphite-950">
      <Canvas
        shadows={scene.shadowsEnabled}
        camera={{ position: [3.2, 2.5, 4.2], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#0e1114']} />
        <ambientLight intensity={scene.lightingEnabled ? 0.35 : 1.0} />
        {scene.lightingEnabled && (
          <directionalLight
            position={[4, 6, 3]}
            intensity={1.4}
            castShadow={scene.shadowsEnabled}
          />
        )}
        <Grid infiniteGrid fadeDistance={14} cellColor="#26303d" sectionColor="#334155" />
        {scene.objects.map((obj) => (
          <SceneMesh
            key={obj.id}
            obj={obj}
            wireframe={scene.wireframe}
            texturesEnabled={scene.texturesEnabled}
            lightingEnabled={scene.lightingEnabled}
            selected={scene.selectedObjectId === obj.id}
            onSelect={() => handleSelect(obj)}
          />
        ))}
        <OrbitControls makeDefault />
      </Canvas>
      <div className="pointer-events-none absolute left-2 top-2 rounded border border-graphite-700 bg-graphite-900/90 px-2 py-1 font-mono text-[11px] text-slate-300">
        WebGL2 Viewport [browser_rendered] • Orbit / Pan / Zoom
      </div>
    </div>
  );
};
