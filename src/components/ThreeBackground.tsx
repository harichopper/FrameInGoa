import React, { useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Palm Leaf mesh ────────────────────────────────────────────
function PalmLeaf({ index, total }: { index: number; total: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationZ = (index / total) * Math.PI * 2;

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(1, 4, 0, 8);
    shape.quadraticCurveTo(-1, 4, 0, 0);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
    });
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.35,
        shininess: 100,
      }),
    [],
  );

  // Dispose on unmount to prevent GPU leak
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[0, 0, rotationZ]}
    />
  );
}

// ─── Leaf group – animates the cluster ────────────────────────
const LEAF_COUNT = 6;

function LeafGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useFrame(({ clock }) => {
    if (!groupRef.current || prefersReduced) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.15;
    groupRef.current.rotation.x = t * 0.08;
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.5;
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: LEAF_COUNT }, (_, i) => (
        <PalmLeaf key={i} index={i} total={LEAF_COUNT} />
      ))}
    </group>
  );
}

// ─── Exported: decorative Three.js motif (HomeView) ──────────
export function ThreeMotif() {
  return (
    <div
      className="w-full h-full max-w-[800px] max-h-[800px] pointer-events-none"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 75 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        frameloop="always"
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} color="#00f0ff" intensity={1.5} />
        <pointLight position={[-5, -5, 5]} color="#ff24e4" intensity={1.0} />
        <LeafGroup />
      </Canvas>
    </div>
  );
}

// ─── Exported: WebGL aurora shader background ─────────────────
export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    let animationFrameId: number;

    const syncSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    syncSize();

    // ── Shaders ────────────────────────────────────────────────
    const vs = /* glsl */ `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fs = /* glsl */ `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      void main() {
        vec2 uv = v_texCoord;
        vec2 mouse = u_mouse / u_resolution;

        float time = u_time * 0.2;

        vec3 color1 = vec3(0.02, 0.05, 0.10);
        vec3 color2 = vec3(0.00, 0.94, 1.00);
        vec3 color3 = vec3(1.00, 0.00, 0.60);
        vec3 color4 = vec3(0.10, 0.00, 0.20);

        float n1 = sin(uv.x * 2.0 + time) * 0.5 + 0.5;
        float n2 = cos(uv.y * 3.0 - time * 1.5) * 0.5 + 0.5;

        vec3 finalColor = mix(color1, color4, uv.y);
        finalColor = mix(finalColor, color2, n1 * 0.3 * (1.0 - uv.y));
        finalColor = mix(finalColor, color3, n2 * 0.2 * uv.y);

        float dist = length(uv - mouse);
        float glow = smoothstep(0.4, 0.0, dist) * 0.25;
        finalColor += color2 * glow;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const compileShader = (type: number, src: string): WebGLShader | null => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vertShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uRes   = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      mouse.y = (1 - (e.clientY - rect.top) / rect.height) * canvas.height;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => syncSize();
    window.addEventListener('resize', handleResize, { passive: true });

    const render = (t: number) => {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime)  gl.uniform1f(uTime,  t * 0.001);
      if (uRes)   gl.uniform2f(uRes,   canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      gl.deleteProgram(prog);
      gl.deleteShader(vertShader);
      gl.deleteShader(fragShader);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[-2] pointer-events-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
