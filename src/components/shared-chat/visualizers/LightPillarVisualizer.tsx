// ABOUTME: Light Pillar voice visualizer with ray-marching shader and audio reactivity
// ABOUTME: Based on ReactBits Light Pillar with customizable colors, intensity, and glow

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VisualizerProps } from './types';

export interface LightPillarSettings {
  topColor: string;
  bottomColor: string;
  intensity: number;
  rotationSpeed: number;
  glowAmount: number;
  pillarWidth: number;
  pillarHeight: number;
  noiseIntensity: number;
  pillarRotation: number;
}

export const DEFAULT_LIGHT_PILLAR_SETTINGS: LightPillarSettings = {
  topColor: '#5227FF',
  bottomColor: '#FF9FFC',
  intensity: 1.0,
  rotationSpeed: 0.3,
  glowAmount: 0.005,
  pillarWidth: 3.0,
  pillarHeight: 0.4,
  noiseIntensity: 0.5,
  pillarRotation: 0.0,
};

interface LightPillarVisualizerProps extends VisualizerProps {
  settings?: Partial<LightPillarSettings>;
}

// Vertex shader - simple fullscreen quad
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Fragment shader - ray marching light pillar effect
const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform float uAudioLevel;
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  uniform float uIntensity;
  uniform float uRotationSpeed;
  uniform float uGlowAmount;
  uniform float uPillarWidth;
  uniform float uPillarHeight;
  uniform float uNoiseIntensity;
  uniform float uPillarRotation;
  uniform vec2 uResolution;

  varying vec2 vUv;

  #define PI 3.14159265359
  #define MAX_STEPS 64
  #define MAX_DIST 10.0
  #define SURF_DIST 0.001

  // Rotation matrix
  mat2 rot2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  // Simplex noise for organic movement
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
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

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Layered wave deformation for organic pillar movement
  vec3 waveDeform(vec3 p, float t, float audioMod) {
    vec3 result = p;
    float freq = 1.0;
    float amp = 0.15 * (1.0 + audioMod * 0.5);

    for (int i = 0; i < 3; i++) {
      result.x += cos(result.y * freq + t) * amp;
      result.z += sin(result.y * freq * 1.3 + t * 0.7) * amp;
      freq *= 2.0;
      amp *= 0.5;
    }

    return result;
  }

  // Distance function for the pillar
  float pillarSDF(vec3 p, float audioLevel) {
    // Apply wave deformation with audio modulation
    float deformStrength = uNoiseIntensity * (1.0 + audioLevel * 2.0);
    vec3 deformed = waveDeform(p, uTime * uRotationSpeed, audioLevel);

    // Add noise-based displacement
    float noise = snoise(deformed * 0.5 + uTime * 0.2) * deformStrength * 0.3;

    // Cylindrical pillar with audio-reactive width
    float pillarW = uPillarWidth * (1.0 + audioLevel * 0.5);
    float dist = length(deformed.xz) - pillarW * 0.1;

    // Taper towards top and bottom
    float taper = smoothstep(-2.0, 0.0, p.y) * smoothstep(2.0, 0.0, p.y);
    dist += (1.0 - taper) * 0.5;

    return dist + noise;
  }

  // Ray march through the scene
  float rayMarch(vec3 ro, vec3 rd, float audioLevel) {
    float dO = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
      vec3 p = ro + rd * dO;
      float dS = pillarSDF(p, audioLevel);
      dO += dS;
      if (dO > MAX_DIST || abs(dS) < SURF_DIST) break;
    }

    return dO;
  }

  void main() {
    // Normalized coordinates centered
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

    // Audio level with smoothing
    float audioLevel = uAudioLevel;

    // Camera setup - looking at the pillar
    vec3 ro = vec3(0.0, 0.0, 3.0);
    vec3 rd = normalize(vec3(uv, -1.0));

    // Rotate camera around the pillar based on time and audio
    float rotAngle = uTime * uRotationSpeed + audioLevel * 0.5 + uPillarRotation;
    ro.xz *= rot2D(rotAngle);
    rd.xz *= rot2D(rotAngle);

    // Ray march
    float d = rayMarch(ro, rd, audioLevel);

    // Calculate color
    vec3 color = vec3(0.0);

    if (d < MAX_DIST) {
      vec3 p = ro + rd * d;

      // Vertical gradient for color mixing
      float gradient = smoothstep(-1.5, 1.5, p.y);
      vec3 pillarColor = mix(uBottomColor, uTopColor, gradient);

      // Fresnel-like glow at edges
      float fresnel = pow(1.0 - abs(dot(rd, normalize(p))), 2.0);

      // Audio-reactive intensity
      float audioIntensity = uIntensity * (1.0 + audioLevel * 1.5);

      // Glow effect
      float glow = exp(-d * uGlowAmount * 10.0) * audioIntensity;

      // Combine color with glow
      color = pillarColor * glow;
      color += pillarColor * fresnel * 0.5 * audioIntensity;

      // Add noise texture
      float noiseTexture = snoise(p * 3.0 + uTime * 0.5) * 0.1;
      color += noiseTexture * pillarColor * 0.3;
    }

    // Atmospheric glow around pillar even when not hit
    float atmosGlow = exp(-length(uv) * 2.0) * 0.3 * uIntensity * (1.0 + audioLevel);
    vec3 atmosColor = mix(uBottomColor, uTopColor, 0.5);
    color += atmosColor * atmosGlow;

    // Vignette
    float vignette = 1.0 - length(uv) * 0.5;
    color *= vignette;

    // Add subtle film grain
    float grain = snoise(vec3(gl_FragCoord.xy * 0.5, uTime * 10.0)) * 0.02 * uNoiseIntensity;
    color += grain;

    // Output with alpha for compositing
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Helper to convert hex to RGB normalized values
function hexToRgb(hex: string): THREE.Color {
  const color = new THREE.Color(hex);
  return color;
}

export const LightPillarVisualizer: React.FC<LightPillarVisualizerProps> = ({
  isActive,
  volumeRef,
  isUserSpeaking,
  className = '',
  settings = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    animationId: number;
  } | null>(null);

  // Merge default settings with provided settings
  const config: LightPillarSettings = { ...DEFAULT_LIGHT_PILLAR_SETTINGS, ...settings };

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const width = 256;
    const height = 256;

    // Scene setup
    const scene = new THREE.Scene();

    // Orthographic camera for fullscreen quad
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Renderer with transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: 'highp',
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
        uTopColor: { value: hexToRgb(config.topColor) },
        uBottomColor: { value: hexToRgb(config.bottomColor) },
        uIntensity: { value: config.intensity },
        uRotationSpeed: { value: config.rotationSpeed },
        uGlowAmount: { value: config.glowAmount },
        uPillarWidth: { value: config.pillarWidth },
        uPillarHeight: { value: config.pillarHeight },
        uNoiseIntensity: { value: config.noiseIntensity },
        uPillarRotation: { value: config.pillarRotation * (Math.PI / 180) },
        uResolution: { value: new THREE.Vector2(width, height) },
      },
      transparent: true,
    });

    // Fullscreen quad geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Store refs
    sceneRef.current = { scene, camera, renderer, mesh, material, animationId: 0 };

    // Animation loop
    const clock = new THREE.Clock();
    let smoothedAudio = 0;

    const animate = () => {
      if (!sceneRef.current) return;

      const elapsedTime = clock.getElapsedTime();
      const rawAudio = Math.max(0.05, volumeRef.current);

      // Fast attack, slow decay smoothing
      const attackSpeed = 0.3;
      const decaySpeed = 0.05;
      if (rawAudio > smoothedAudio) {
        smoothedAudio += (rawAudio - smoothedAudio) * attackSpeed;
      } else {
        smoothedAudio += (rawAudio - smoothedAudio) * decaySpeed;
      }

      // Update uniforms
      material.uniforms.uTime.value = elapsedTime;
      material.uniforms.uAudioLevel.value = smoothedAudio;

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
  }, [isActive, volumeRef, config.topColor, config.bottomColor, config.intensity,
      config.rotationSpeed, config.glowAmount, config.pillarWidth, config.pillarHeight,
      config.noiseIntensity]);

  // Update colors dynamically when user is speaking
  useEffect(() => {
    if (sceneRef.current) {
      // When user speaks, shift to cyan tones
      if (isUserSpeaking) {
        sceneRef.current.material.uniforms.uTopColor.value = new THREE.Color('#22d3ee');
        sceneRef.current.material.uniforms.uBottomColor.value = new THREE.Color('#0891b2');
      } else {
        sceneRef.current.material.uniforms.uTopColor.value = hexToRgb(config.topColor);
        sceneRef.current.material.uniforms.uBottomColor.value = hexToRgb(config.bottomColor);
      }
    }
  }, [isUserSpeaking, config.topColor, config.bottomColor]);

  // Update shader settings when config changes
  useEffect(() => {
    if (sceneRef.current) {
      const { material } = sceneRef.current;
      material.uniforms.uIntensity.value = config.intensity;
      material.uniforms.uRotationSpeed.value = config.rotationSpeed;
      material.uniforms.uGlowAmount.value = config.glowAmount;
      material.uniforms.uPillarWidth.value = config.pillarWidth;
      material.uniforms.uPillarHeight.value = config.pillarHeight;
      material.uniforms.uNoiseIntensity.value = config.noiseIntensity;
      material.uniforms.uPillarRotation.value = config.pillarRotation * (Math.PI / 180); // Convert degrees to radians
    }
  }, [config.intensity, config.rotationSpeed, config.glowAmount,
      config.pillarWidth, config.pillarHeight, config.noiseIntensity, config.pillarRotation]);

  return (
    <div className={`relative flex-shrink-0 my-4 ${className}`}>
      {/* Orb Container */}
      <div
        className={`relative h-64 w-64 rounded-full bg-black/90 border transition-all duration-300 ${
          isUserSpeaking
            ? 'border-cyan-500/50 shadow-[0_0_50px_rgba(34,211,238,0.4)]'
            : 'border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.3)]'
        } flex items-center justify-center overflow-hidden`}
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
