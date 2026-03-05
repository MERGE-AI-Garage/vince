// ABOUTME: Three.js 3D orb visualizer with audio-reactive shader distortion
// ABOUTME: Based on Codrops audio visualizer with icosahedron geometry and fresnel glow

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VisualizerProps, Codrops3DOrbSettings } from './types';

const DEFAULT_SETTINGS: Codrops3DOrbSettings = {
  backgroundColor: '#000000',
  color1: '#1a472a',
  color2: '#2d5a3d',
  glowColor: '#4ade80',
  speakingGlowColor: '#22d3ee',
  distortion: 0.15,
};

interface Codrops3DOrbVisualizerProps extends VisualizerProps {
  settings?: Partial<Codrops3DOrbSettings>;
}

// Vertex shader - distorts geometry based on audio level
const vertexShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uDistortion;

  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // Calculate noise-based displacement
    float noise = snoise(position * 2.0 + uTime * 0.5);

    // Audio-reactive distortion
    float distortion = uDistortion * (1.0 + uAudioLevel * 2.0);
    vec3 newPosition = position + normal * noise * distortion;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Fragment shader - fresnel glow effect
const fragmentShader = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uGlowColor;

  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    // Fresnel effect for edge glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(viewDirection, vNormal), 2.0 + uAudioLevel * 2.0);

    // Base color gradient
    float gradient = (vPosition.y + 1.0) * 0.5;
    vec3 baseColor = mix(uColor1, uColor2, gradient);

    // Audio-reactive glow intensity
    float glowIntensity = 0.3 + uAudioLevel * 0.7;
    vec3 glow = uGlowColor * fresnel * glowIntensity;

    // Combine colors
    vec3 finalColor = baseColor + glow;

    // Add subtle pulsing
    float pulse = 0.9 + sin(uTime * 2.0) * 0.1 * (1.0 + uAudioLevel);
    finalColor *= pulse;

    gl_FragColor = vec4(finalColor, 0.9);
  }
`;

export const Codrops3DOrbVisualizer: React.FC<Codrops3DOrbVisualizerProps> = ({
  isActive,
  volumeRef,
  isUserSpeaking,
  className = '',
  settings: settingsOverride,
}) => {
  const settings = { ...DEFAULT_SETTINGS, ...settingsOverride };
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const width = 256;
    const height = 256;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3;

    // Renderer with transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Shader material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uDistortion: { value: settings.distortion },
        uColor1: { value: new THREE.Color(settings.color1) },
        uColor2: { value: new THREE.Color(settings.color2) },
        uGlowColor: { value: new THREE.Color(settings.glowColor) },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    // Icosahedron geometry (20-sided sphere)
    const geometry = new THREE.IcosahedronGeometry(1, 4);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Store refs
    sceneRef.current = { scene, camera, renderer, mesh, material, animationId: 0 };

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      if (!sceneRef.current) return;

      const elapsedTime = clock.getElapsedTime();

      // Update uniforms
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uAudioLevel.value = Math.max(0.05, volumeRef.current);

      // Subtle rotation
      mesh.rotation.y = elapsedTime * 0.2;
      mesh.rotation.x = Math.sin(elapsedTime * 0.3) * 0.1;

      // Render
      renderer.render(scene, camera);

      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        container.removeChild(renderer.domElement);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        sceneRef.current = null;
      }
    };
  }, [isActive, volumeRef, settings.color1, settings.color2, settings.glowColor, settings.distortion]);

  // Update glow color when user is speaking
  useEffect(() => {
    if (sceneRef.current) {
      const glowColor = isUserSpeaking
        ? new THREE.Color(settings.speakingGlowColor)
        : new THREE.Color(settings.glowColor);
      sceneRef.current.material.uniforms.uGlowColor.value = glowColor;
    }
  }, [isUserSpeaking, settings.speakingGlowColor, settings.glowColor]);

  return (
    <div className={`relative flex-shrink-0 my-4 ${className}`}>
      {/* Orb Container */}
      <div
        className={`relative h-64 w-64 rounded-full border transition-all duration-300 ${
          isUserSpeaking
            ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(34,211,238,0.3)]'
            : 'border-accent/30 shadow-[0_0_40px_hsl(var(--accent)/0.3)]'
        } flex items-center justify-center overflow-hidden`}
        style={{ backgroundColor: settings.backgroundColor }}
      >
        {/* Three.js Canvas Container */}
        <div
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
        />

        {/* Spinning Rings Overlay */}
        <div className="absolute inset-0 border-t border-transparent border-l border-white/10 rounded-full animate-spin-slow pointer-events-none z-10"></div>
        <div className="absolute inset-6 border-b border-transparent border-r border-white/5 rounded-full animate-reverse-spin pointer-events-none z-10"></div>
      </div>
    </div>
  );
};
