// ABOUTME: Hyperspeed visualizer with 3D highway light trails - direct port from Codrops Infinite Lights
// ABOUTME: Audio-reactive speed effect with 7 presets matching the original demos

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer, EffectPass, RenderPass, BloomEffect, SMAAEffect } from 'postprocessing';
import { VisualizerProps } from './types';

// ============== TYPES ==============

// Named presets match Codrops demos, numbered presets are aliases
export type HyperspeedPreset =
  | 'one' | 'two' | 'three' | 'four' | 'five' | 'six' | 'seven'
  | 'cyberpunk' | 'akira' | 'golden' | 'highway' | 'neon' | 'deep' | 'vertigo';

// Map named presets to numbered presets
const PRESET_ALIASES: Record<string, 'one' | 'two' | 'three' | 'four' | 'five' | 'six' | 'seven'> = {
  cyberpunk: 'one',
  akira: 'two',
  golden: 'three',
  highway: 'four',
  neon: 'five',
  deep: 'six',
  vertigo: 'seven',
  // Self-referential for numbered presets
  one: 'one',
  two: 'two',
  three: 'three',
  four: 'four',
  five: 'five',
  six: 'six',
  seven: 'seven',
};

export interface HyperspeedSettings {
  preset: HyperspeedPreset;
  baseSpeed: number;
  bloomStrength: number;
}

export const DEFAULT_HYPERSPEED_SETTINGS: HyperspeedSettings = {
  preset: 'one',
  baseSpeed: 1.0,
  bloomStrength: 1.5,
};

interface HyperspeedVisualizerProps extends VisualizerProps {
  settings?: Partial<HyperspeedSettings>;
}

// ============== DISTORTION UNIFORMS ==============

const mountainUniforms = {
  uFreq: new THREE.Vector3(3, 6, 10),
  uAmp: new THREE.Vector3(30, 30, 20),
};

const xyUniforms = {
  uFreq: new THREE.Vector2(5, 2),
  uAmp: new THREE.Vector2(25, 15),
};

const LongRaceUniforms = {
  uFreq: new THREE.Vector2(2, 3),
  uAmp: new THREE.Vector2(35, 10),
};

const turbulentUniforms = {
  uFreq: new THREE.Vector4(4, 8, 8, 1),
  uAmp: new THREE.Vector4(25, 5, 10, 10),
};

const deepUniforms = {
  uFreq: new THREE.Vector2(4, 8),
  uAmp: new THREE.Vector2(10, 20),
  uPowY: new THREE.Vector2(20, 2),
};

const nsin = (val: number) => Math.sin(val) * 0.5 + 0.5;

// ============== DISTORTION DEFINITIONS ==============

interface Distortion {
  uniforms: Record<string, { value: THREE.Vector2 | THREE.Vector3 | THREE.Vector4 }>;
  getDistortion: string;
  getJS?: (progress: number, time: number) => THREE.Vector3;
}

const distortions: Record<string, Distortion> = {
  mountainDistortion: {
    uniforms: {
      uFreq: { value: mountainUniforms.uFreq },
      uAmp: { value: mountainUniforms.uAmp },
    },
    getDistortion: `
      uniform vec3 uAmp;
      uniform vec3 uFreq;
      #define PI 3.14159265358979
      float nsin(float val){
        return sin(val) * 0.5 + 0.5;
      }
      vec3 getDistortion(float progress){
        float movementProgressFix = 0.02;
        return vec3(
          cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
          nsin(progress * PI * uFreq.y + uTime) * uAmp.y - nsin(movementProgressFix * PI * uFreq.y + uTime) * uAmp.y,
          nsin(progress * PI * uFreq.z + uTime) * uAmp.z - nsin(movementProgressFix * PI * uFreq.z + uTime) * uAmp.z
        );
      }
    `,
    getJS: (progress: number, time: number) => {
      const movementProgressFix = 0.02;
      const uFreq = mountainUniforms.uFreq;
      const uAmp = mountainUniforms.uAmp;
      const distortion = new THREE.Vector3(
        Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x -
          Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
        nsin(progress * Math.PI * uFreq.y + time) * uAmp.y -
          nsin(movementProgressFix * Math.PI * uFreq.y + time) * uAmp.y,
        nsin(progress * Math.PI * uFreq.z + time) * uAmp.z -
          nsin(movementProgressFix * Math.PI * uFreq.z + time) * uAmp.z
      );
      const lookAtAmp = new THREE.Vector3(2, 2, 2);
      const lookAtOffset = new THREE.Vector3(0, 0, -5);
      return distortion.multiply(lookAtAmp).add(lookAtOffset);
    },
  },
  xyDistortion: {
    uniforms: {
      uFreq: { value: xyUniforms.uFreq },
      uAmp: { value: xyUniforms.uAmp },
    },
    getDistortion: `
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      #define PI 3.14159265358979
      vec3 getDistortion(float progress){
        float movementProgressFix = 0.02;
        return vec3(
          cos(progress * PI * uFreq.x + uTime) * uAmp.x - cos(movementProgressFix * PI * uFreq.x + uTime) * uAmp.x,
          sin(progress * PI * uFreq.y + PI/2. + uTime) * uAmp.y - sin(movementProgressFix * PI * uFreq.y + PI/2. + uTime) * uAmp.y,
          0.
        );
      }
    `,
    getJS: (progress: number, time: number) => {
      const movementProgressFix = 0.02;
      const uFreq = xyUniforms.uFreq;
      const uAmp = xyUniforms.uAmp;
      const distortion = new THREE.Vector3(
        Math.cos(progress * Math.PI * uFreq.x + time) * uAmp.x -
          Math.cos(movementProgressFix * Math.PI * uFreq.x + time) * uAmp.x,
        Math.sin(progress * Math.PI * uFreq.y + time + Math.PI / 2) * uAmp.y -
          Math.sin(movementProgressFix * Math.PI * uFreq.y + time + Math.PI / 2) * uAmp.y,
        0
      );
      const lookAtAmp = new THREE.Vector3(2, 0.4, 1);
      const lookAtOffset = new THREE.Vector3(0, 0, -3);
      return distortion.multiply(lookAtAmp).add(lookAtOffset);
    },
  },
  LongRaceDistortion: {
    uniforms: {
      uFreq: { value: LongRaceUniforms.uFreq },
      uAmp: { value: LongRaceUniforms.uAmp },
    },
    getDistortion: `
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      #define PI 3.14159265358979
      vec3 getDistortion(float progress){
        float camProgress = 0.0125;
        return vec3(
          sin(progress * PI * uFreq.x + uTime) * uAmp.x - sin(camProgress * PI * uFreq.x + uTime) * uAmp.x,
          sin(progress * PI * uFreq.y + uTime) * uAmp.y - sin(camProgress * PI * uFreq.y + uTime) * uAmp.y,
          0.
        );
      }
    `,
    getJS: (progress: number, time: number) => {
      const camProgress = 0.0125;
      const uFreq = LongRaceUniforms.uFreq;
      const uAmp = LongRaceUniforms.uAmp;
      const distortion = new THREE.Vector3(
        Math.sin(progress * Math.PI * uFreq.x + time) * uAmp.x -
          Math.sin(camProgress * Math.PI * uFreq.x + time) * uAmp.x,
        Math.sin(progress * Math.PI * uFreq.y + time) * uAmp.y -
          Math.sin(camProgress * Math.PI * uFreq.y + time) * uAmp.y,
        0
      );
      const lookAtAmp = new THREE.Vector3(1, 1, 0);
      const lookAtOffset = new THREE.Vector3(0, 0, -5);
      return distortion.multiply(lookAtAmp).add(lookAtOffset);
    },
  },
  turbulentDistortion: {
    uniforms: {
      uFreq: { value: turbulentUniforms.uFreq },
      uAmp: { value: turbulentUniforms.uAmp },
    },
    getDistortion: `
      uniform vec4 uFreq;
      uniform vec4 uAmp;
      float nsin(float val){
        return sin(val) * 0.5 + 0.5;
      }
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return (
          cos(PI * progress * uFreq.r + uTime) * uAmp.r +
          pow(cos(PI * progress * uFreq.g + uTime * (uFreq.g / uFreq.r)), 2. ) * uAmp.g
        );
      }
      float getDistortionY(float progress){
        return (
          -nsin(PI * progress * uFreq.b + uTime) * uAmp.b +
          -pow(nsin(PI * progress * uFreq.a + uTime / (uFreq.b / uFreq.a)), 5.) * uAmp.a
        );
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.0125),
          getDistortionY(progress) - getDistortionY(0.0125),
          0.
        );
      }
    `,
    getJS: (progress: number, time: number) => {
      const uFreq = turbulentUniforms.uFreq;
      const uAmp = turbulentUniforms.uAmp;

      const getX = (p: number) =>
        Math.cos(Math.PI * p * uFreq.x + time) * uAmp.x +
        Math.pow(Math.cos(Math.PI * p * uFreq.y + time * (uFreq.y / uFreq.x)), 2) * uAmp.y;

      const getY = (p: number) =>
        -nsin(Math.PI * p * uFreq.z + time) * uAmp.z -
        Math.pow(nsin(Math.PI * p * uFreq.w + time / (uFreq.z / uFreq.w)), 5) * uAmp.w;

      const distortion = new THREE.Vector3(
        getX(progress) - getX(progress + 0.007),
        getY(progress) - getY(progress + 0.007),
        0
      );
      const lookAtAmp = new THREE.Vector3(-2, -5, 0);
      const lookAtOffset = new THREE.Vector3(0, 0, -10);
      return distortion.multiply(lookAtAmp).add(lookAtOffset);
    },
  },
  deepDistortion: {
    uniforms: {
      uFreq: { value: deepUniforms.uFreq },
      uAmp: { value: deepUniforms.uAmp },
      uPowY: { value: deepUniforms.uPowY },
    },
    getDistortion: `
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      uniform vec2 uPowY;
      float nsin(float val){
        return sin(val) * 0.5 + 0.5;
      }
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return (
          sin(progress * PI * uFreq.x + uTime) * uAmp.x
        );
      }
      float getDistortionY(float progress){
        return (
          pow(abs(progress * uPowY.x), uPowY.y) + sin(progress * PI * uFreq.y + uTime) * uAmp.y
        );
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.02),
          getDistortionY(progress) - getDistortionY(0.02),
          0.
        );
      }
    `,
    getJS: (progress: number, time: number) => {
      const uFreq = deepUniforms.uFreq;
      const uAmp = deepUniforms.uAmp;
      const uPowY = deepUniforms.uPowY;

      const getX = (p: number) => Math.sin(p * Math.PI * uFreq.x + time) * uAmp.x;
      const getY = (p: number) => Math.pow(p * uPowY.x, uPowY.y) + Math.sin(p * Math.PI * uFreq.y + time) * uAmp.y;

      const distortion = new THREE.Vector3(
        getX(progress) - getX(progress + 0.01),
        getY(progress) - getY(progress + 0.01),
        0
      );
      const lookAtAmp = new THREE.Vector3(-2, -4, 0);
      const lookAtOffset = new THREE.Vector3(0, 0, -10);
      return distortion.multiply(lookAtAmp).add(lookAtOffset);
    },
  },
  // Static version of turbulent distortion - no time animation in distortion itself
  turbulentDistortionStill: {
    uniforms: {
      uFreq: { value: turbulentUniforms.uFreq },
      uAmp: { value: turbulentUniforms.uAmp },
    },
    getDistortion: `
      uniform vec4 uFreq;
      uniform vec4 uAmp;
      float nsin(float val){
        return sin(val) * 0.5 + 0.5;
      }
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return (
          cos(PI * progress * uFreq.r) * uAmp.r +
          pow(cos(PI * progress * uFreq.g * (uFreq.g / uFreq.r)), 2. ) * uAmp.g
        );
      }
      float getDistortionY(float progress){
        return (
          -nsin(PI * progress * uFreq.b) * uAmp.b +
          -pow(nsin(PI * progress * uFreq.a / (uFreq.b / uFreq.a)), 5.) * uAmp.a
        );
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.02),
          getDistortionY(progress) - getDistortionY(0.02),
          0.
        );
      }
    `,
    getJS: (progress: number) => {
      const uFreq = turbulentUniforms.uFreq;
      const uAmp = turbulentUniforms.uAmp;

      const getX = (p: number) =>
        Math.cos(Math.PI * p * uFreq.x) * uAmp.x +
        Math.pow(Math.cos(Math.PI * p * uFreq.y * (uFreq.y / uFreq.x)), 2) * uAmp.y;

      const getY = (p: number) =>
        -nsin(Math.PI * p * uFreq.z) * uAmp.z -
        Math.pow(nsin(Math.PI * p * uFreq.w / (uFreq.z / uFreq.w)), 5) * uAmp.w;

      const distortion = new THREE.Vector3(
        getX(progress) - getX(progress + 0.007),
        getY(progress) - getY(progress + 0.007),
        0
      );
      const lookAtAmp = new THREE.Vector3(-2, -5, 0);
      const lookAtOffset = new THREE.Vector3(0, 0, -10);
      return distortion.multiply(lookAtAmp).add(lookAtOffset);
    },
  },
  // Static version of deep distortion - no time animation, modified amplitude
  deepDistortionStill: {
    uniforms: {
      uFreq: { value: deepUniforms.uFreq },
      uAmp: { value: deepUniforms.uAmp },
      uPowY: { value: deepUniforms.uPowY },
    },
    getDistortion: `
      uniform vec2 uFreq;
      uniform vec2 uAmp;
      uniform vec2 uPowY;
      float nsin(float val){
        return sin(val) * 0.5 + 0.5;
      }
      #define PI 3.14159265358979
      float getDistortionX(float progress){
        return (
          sin(progress * PI * uFreq.x) * uAmp.x * 2.0
        );
      }
      float getDistortionY(float progress){
        return (
          pow(abs(progress * uPowY.x), uPowY.y) + sin(progress * PI * uFreq.y) * uAmp.y
        );
      }
      vec3 getDistortion(float progress){
        return vec3(
          getDistortionX(progress) - getDistortionX(0.02),
          getDistortionY(progress) - getDistortionY(0.02),
          0.
        );
      }
    `,
    getJS: (progress: number) => {
      const uFreq = deepUniforms.uFreq;
      const uAmp = deepUniforms.uAmp;
      const uPowY = deepUniforms.uPowY;

      const getX = (p: number) => Math.sin(p * Math.PI * uFreq.x) * uAmp.x * 2.0;
      const getY = (p: number) => Math.pow(p * uPowY.x, uPowY.y) + Math.sin(p * Math.PI * uFreq.y) * uAmp.y;

      const distortion = new THREE.Vector3(
        getX(progress) - getX(progress + 0.01),
        getY(progress) - getY(progress + 0.01),
        0
      );
      const lookAtAmp = new THREE.Vector3(-2, -4, 0);
      const lookAtOffset = new THREE.Vector3(0, 0, -10);
      return distortion.multiply(lookAtAmp).add(lookAtOffset);
    },
  },
};

// ============== PRESETS (Matching Codrops demos) ==============

interface PresetConfig {
  distortion: string;
  length: number;
  roadWidth: number;
  islandWidth: number;
  lanesPerRoad: number;
  fov: number;
  fovSpeedUp: number;
  speedUp: number;
  carLightsFade: number;
  totalSideLightSticks: number;
  lightPairsPerRoadWay: number;
  shoulderLinesWidthPercentage: number;
  brokenLinesWidthPercentage: number;
  brokenLinesLengthPercentage: number;
  lightStickWidth: [number, number];
  lightStickHeight: [number, number];
  movingAwaySpeed: [number, number];
  movingCloserSpeed: [number, number];
  carLightsLength: [number, number];
  carLightsRadius: [number, number];
  carWidthPercentage: [number, number];
  carShiftX: [number, number];
  carFloorSeparation: [number, number];
  colors: {
    roadColor: number;
    islandColor: number;
    background: number;
    shoulderLines: number;
    brokenLines: number;
    leftCars: number[];
    rightCars: number[];
    sticks: number;
  };
}

const PRESETS: Record<HyperspeedPreset, PresetConfig> = {
  // Cyberpunk - cyan/magenta
  one: {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
      rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
      sticks: 0x03b3c3,
    },
  },
  // Akira - red/white
  two: {
    distortion: 'mountainDistortion',
    length: 400,
    roadWidth: 9,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 50,
    lightPairsPerRoadWay: 50,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.05, 400 * 0.15],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.2, 0.2],
    carFloorSeparation: [0.05, 1],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0xff102a, 0xeb383e, 0xff102a],
      rightCars: [0xdadafa, 0xbebae3, 0x8f97e4],
      sticks: 0xdadafa,
    },
  },
  // Golden - yellow/red
  three: {
    distortion: 'xyDistortion',
    length: 400,
    roadWidth: 9,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 3,
    carLightsFade: 0.4,
    totalSideLightSticks: 50,
    lightPairsPerRoadWay: 30,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.02, 0.05],
    lightStickHeight: [0.3, 0.7],
    movingAwaySpeed: [20, 50],
    movingCloserSpeed: [-150, -230],
    carLightsLength: [400 * 0.05, 400 * 0.2],
    carLightsRadius: [0.03, 0.08],
    carWidthPercentage: [0.1, 0.5],
    carShiftX: [-0.5, 0.5],
    carFloorSeparation: [0, 0.1],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0x7d0d1b, 0xa90519, 0xff102a],
      rightCars: [0xf1eece, 0xe6e2b1, 0xdfd98a],
      sticks: 0xf1eece,
    },
  },
  // Highway - pink/cyan
  four: {
    distortion: 'LongRaceDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 5,
    lanesPerRoad: 2,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 50,
    lightPairsPerRoadWay: 70,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.05, 400 * 0.15],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.2, 0.2],
    carFloorSeparation: [0.05, 1],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0xff5f73, 0xe74d60, 0xff102a],
      rightCars: [0xa4e3e6, 0x80d1d4, 0x53c2c6],
      sticks: 0xa4e3e6,
    },
  },
  // Neon - orange/blue (Demo 5 - turbulentDistortionStill)
  five: {
    distortion: 'turbulentDistortionStill',
    length: 400,
    roadWidth: 9,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 50,
    lightPairsPerRoadWay: 50,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.05, 400 * 0.15],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.2, 0.2],
    carFloorSeparation: [0.05, 1],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0xdc5b20, 0xdca320, 0xdc2020],
      rightCars: [0x334bf7, 0xe5e6ed, 0xbfc6f3],
      sticks: 0xc5e8eb,
    },
  },
  // Deep - red/cream (Demo 6 - deepDistortionStill)
  six: {
    distortion: 'deepDistortionStill',
    length: 400,
    roadWidth: 18,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 50,
    lightPairsPerRoadWay: 50,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.05, 400 * 0.15],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.2, 0.2],
    carFloorSeparation: [0.05, 1],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      leftCars: [0xff322f, 0xa33010, 0xa81508],
      rightCars: [0xfdfdf0, 0xf3dea0, 0xe2bb88],
      sticks: 0xfdfdf0,
    },
  },
  // Vertigo - red/white/blue (Demo 7 - deepDistortion with time animation)
  seven: {
    distortion: 'deepDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 3,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 30,
    lightPairsPerRoadWay: 60,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.05, 400 * 0.15],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.2, 0.2],
    carFloorSeparation: [0.05, 1],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0x131318,
      brokenLines: 0x131318,
      // Demo 7 exact colors
      leftCars: [0xe2173c, 0x841010, 0xf23d3d],
      rightCars: [0xffffff, 0x7686bf, 0x1338b5],
      sticks: 0xdce0ee,
    },
  },
  // Named aliases — same configs as the numbered presets
  get cyberpunk() { return this.one; },
  get akira() { return this.two; },
  get golden() { return this.three; },
  get highway() { return this.four; },
  get neon() { return this.five; },
  get deep() { return this.six; },
  get vertigo() { return this.seven; },
};

// ============== SHADERS ==============

const carLightsFragment = `
  #define USE_FOG;
  ${THREE.ShaderChunk['fog_pars_fragment']}
  varying vec3 vColor;
  varying vec2 vUv;
  uniform vec2 uFade;
  void main() {
    vec3 color = vec3(vColor);
    float alpha = smoothstep(uFade.x, uFade.y, vUv.x);
    gl_FragColor = vec4(color, alpha);
    if (gl_FragColor.a < 0.0001) discard;
    ${THREE.ShaderChunk['fog_fragment']}
  }
`;

const carLightsVertex = `
  #define USE_FOG;
  ${THREE.ShaderChunk['fog_pars_vertex']}
  attribute vec3 aOffset;
  attribute vec3 aMetrics;
  attribute vec3 aColor;
  uniform float uTravelLength;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vColor;
  #include <getDistortion_vertex>
  void main() {
    vec3 transformed = position.xyz;
    float radius = aMetrics.r;
    float myLength = aMetrics.g;
    float speed = aMetrics.b;

    transformed.xy *= radius;
    transformed.z *= myLength;

    transformed.z += myLength - mod(uTime * speed + aOffset.z, uTravelLength);
    transformed.xy += aOffset.xy;

    float progress = abs(transformed.z / uTravelLength);
    transformed.xyz += getDistortion(progress);

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    vColor = aColor;
    ${THREE.ShaderChunk['fog_vertex']}
  }
`;

const sideSticksVertex = `
  #define USE_FOG;
  ${THREE.ShaderChunk['fog_pars_vertex']}
  attribute float aOffset;
  attribute vec3 aColor;
  attribute vec2 aMetrics;
  uniform float uTravelLength;
  uniform float uTime;
  varying vec3 vColor;
  mat4 rotationY( in float angle ) {
    return mat4(	cos(angle),		0,		sin(angle),	0,
                 0,		1.0,			 0,	0,
            -sin(angle),	0,		cos(angle),	0,
            0, 		0,				0,	1);
  }
  #include <getDistortion_vertex>
  void main(){
    vec3 transformed = position.xyz;
    float width = aMetrics.x;
    float height = aMetrics.y;

    transformed.xy *= vec2(width, height);
    float time = mod(uTime * 60. * 2. + aOffset, uTravelLength);

    transformed = (rotationY(3.14/2.) * vec4(transformed,1.)).xyz;

    transformed.z += - uTravelLength + time;

    float progress = abs(transformed.z / uTravelLength);
    transformed.xyz += getDistortion(progress);

    transformed.y += height / 2.;
    transformed.x += -width / 2.;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vColor = aColor;
    ${THREE.ShaderChunk['fog_vertex']}
  }
`;

const sideSticksFragment = `
  #define USE_FOG;
  ${THREE.ShaderChunk['fog_pars_fragment']}
  varying vec3 vColor;
  void main(){
    vec3 color = vec3(vColor);
    gl_FragColor = vec4(color,1.);
    ${THREE.ShaderChunk['fog_fragment']}
  }
`;

const roadMarkings_vars = `
  uniform float uLanes;
  uniform vec3 uBrokenLinesColor;
  uniform vec3 uShoulderLinesColor;
  uniform float uShoulderLinesWidthPercentage;
  uniform float uBrokenLinesWidthPercentage;
  uniform float uBrokenLinesLengthPercentage;
`;

const roadMarkings_fragment = `
  uv.y = mod(uv.y + uTime * 0.05, 1.);
  float laneWidth = 1.0 / uLanes;
  float brokenLineWidth = laneWidth * uBrokenLinesWidthPercentage;
  float laneEmptySpace = 1. - uBrokenLinesLengthPercentage;

  float brokenLines = step(1.0 - brokenLineWidth, fract(uv.x * uLanes)) * step(laneEmptySpace, fract(uv.y * 10.0));
  float sideLines = step(1.0 - uShoulderLinesWidthPercentage, uv.x) + step(uv.x, uShoulderLinesWidthPercentage);

  color = mix(color, uBrokenLinesColor, brokenLines);
  color = mix(color, uShoulderLinesColor, sideLines);
`;

const roadBaseFragment = `
  #define USE_FOG;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uTime;
  #include <roadMarkings_vars>
  ${THREE.ShaderChunk['fog_pars_fragment']}
  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(uColor);
    #include <roadMarkings_fragment>
    gl_FragColor = vec4(color, 1.);
    ${THREE.ShaderChunk['fog_fragment']}
  }
`;

const islandFragment = roadBaseFragment
  .replace('#include <roadMarkings_fragment>', '')
  .replace('#include <roadMarkings_vars>', '');

const roadFragment = roadBaseFragment
  .replace('#include <roadMarkings_fragment>', roadMarkings_fragment)
  .replace('#include <roadMarkings_vars>', roadMarkings_vars);

const roadVertex = `
  #define USE_FOG;
  uniform float uTime;
  ${THREE.ShaderChunk['fog_pars_vertex']}
  uniform float uTravelLength;
  varying vec2 vUv;
  #include <getDistortion_vertex>
  void main() {
    vec3 transformed = position.xyz;
    vec3 distortion = getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
    transformed.x += distortion.x;
    transformed.z += distortion.y;
    transformed.y += -1. * distortion.z;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
    gl_Position = projectionMatrix * mvPosition;
    vUv = uv;
    ${THREE.ShaderChunk['fog_vertex']}
  }
`;

// ============== HELPER FUNCTIONS ==============

const random = (base: number | [number, number]) => {
  if (Array.isArray(base)) return Math.random() * (base[1] - base[0]) + base[0];
  return Math.random() * base;
};

const pickRandom = <T,>(arr: T | T[]): T => {
  if (Array.isArray(arr)) return arr[Math.floor(Math.random() * arr.length)];
  return arr;
};

function lerp(current: number, target: number, speed = 0.1, limit = 0.001): number {
  let change = (target - current) * speed;
  if (Math.abs(change) < limit) {
    change = target - current;
  }
  return change;
}

// ============== CAR LIGHTS CLASS ==============

class CarLights {
  mesh!: THREE.Mesh;
  private options: PresetConfig;
  private colors: number[];
  private speed: [number, number];
  private fade: THREE.Vector2;
  private fogUniforms: Record<string, { value: THREE.Color | number }>;
  private distortionObj: Distortion;

  constructor(
    options: PresetConfig,
    colors: number[],
    speed: [number, number],
    fade: THREE.Vector2,
    fogUniforms: Record<string, { value: THREE.Color | number }>,
    distortionObj: Distortion
  ) {
    this.options = options;
    this.colors = colors;
    this.speed = speed;
    this.fade = fade;
    this.fogUniforms = fogUniforms;
    this.distortionObj = distortionObj;
  }

  init(): THREE.Mesh {
    const options = this.options;
    const curve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1));
    const geometry = new THREE.TubeGeometry(curve, 40, 1, 8, false);

    const instanced = new THREE.InstancedBufferGeometry().copy(geometry as unknown as THREE.InstancedBufferGeometry);
    instanced.instanceCount = options.lightPairsPerRoadWay * 2;

    const laneWidth = options.roadWidth / options.lanesPerRoad;

    const aOffset: number[] = [];
    const aMetrics: number[] = [];
    const aColor: number[] = [];

    const threeColors = this.colors.map((c) => new THREE.Color(c));

    for (let i = 0; i < options.lightPairsPerRoadWay; i++) {
      const radius = random(options.carLightsRadius);
      const length = random(options.carLightsLength);
      const speed = random(this.speed);

      const carLane = i % options.lanesPerRoad;
      let laneX = carLane * laneWidth - options.roadWidth / 2 + laneWidth / 2;

      const carWidth = random(options.carWidthPercentage) * laneWidth;
      const carShiftX = random(options.carShiftX) * laneWidth;
      laneX += carShiftX;

      const offsetY = random(options.carFloorSeparation) + radius * 1.3;
      const offsetZ = -random(options.length);

      aOffset.push(laneX - carWidth / 2);
      aOffset.push(offsetY);
      aOffset.push(offsetZ);

      aOffset.push(laneX + carWidth / 2);
      aOffset.push(offsetY);
      aOffset.push(offsetZ);

      aMetrics.push(radius);
      aMetrics.push(length);
      aMetrics.push(speed);

      aMetrics.push(radius);
      aMetrics.push(length);
      aMetrics.push(speed);

      const color = pickRandom(threeColors);
      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);

      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);
    }

    instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 3, false));
    instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 3, false));
    instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false));

    const material = new THREE.ShaderMaterial({
      fragmentShader: carLightsFragment,
      vertexShader: carLightsVertex,
      transparent: true,
      uniforms: Object.assign(
        {
          uTime: { value: 0 },
          uTravelLength: { value: options.length },
          uFade: { value: this.fade },
        },
        this.fogUniforms,
        this.distortionObj.uniforms
      ),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <getDistortion_vertex>',
        this.distortionObj.getDistortion
      );
    };

    const mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    this.mesh = mesh;
    return mesh;
  }

  update(time: number) {
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
  }
}

// ============== LIGHT STICKS CLASS ==============

class LightSticks {
  mesh!: THREE.Mesh;
  private options: PresetConfig;
  private fogUniforms: Record<string, { value: THREE.Color | number }>;
  private distortionObj: Distortion;

  constructor(
    options: PresetConfig,
    fogUniforms: Record<string, { value: THREE.Color | number }>,
    distortionObj: Distortion
  ) {
    this.options = options;
    this.fogUniforms = fogUniforms;
    this.distortionObj = distortionObj;
  }

  init(): THREE.Mesh {
    const options = this.options;
    const geometry = new THREE.PlaneGeometry(1, 1);
    const instanced = new THREE.InstancedBufferGeometry().copy(geometry as unknown as THREE.InstancedBufferGeometry);
    const totalSticks = options.totalSideLightSticks;
    instanced.instanceCount = totalSticks;

    const stickoffset = options.length / (totalSticks - 1);
    const aOffset: number[] = [];
    const aColor: number[] = [];
    const aMetrics: number[] = [];

    const color = new THREE.Color(options.colors.sticks);

    for (let i = 0; i < totalSticks; i++) {
      const width = random(options.lightStickWidth);
      const height = random(options.lightStickHeight);
      aOffset.push((i - 1) * stickoffset * 2 + stickoffset * Math.random());

      aColor.push(color.r);
      aColor.push(color.g);
      aColor.push(color.b);

      aMetrics.push(width);
      aMetrics.push(height);
    }

    instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset), 1, false));
    instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor), 3, false));
    instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics), 2, false));

    const material = new THREE.ShaderMaterial({
      fragmentShader: sideSticksFragment,
      vertexShader: sideSticksVertex,
      side: THREE.DoubleSide,
      uniforms: Object.assign(
        {
          uTravelLength: { value: options.length },
          uTime: { value: 0 },
        },
        this.fogUniforms,
        this.distortionObj.uniforms
      ),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <getDistortion_vertex>',
        this.distortionObj.getDistortion
      );
    };

    const mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    this.mesh = mesh;
    return mesh;
  }

  update(time: number) {
    (this.mesh.material as THREE.ShaderMaterial).uniforms.uTime.value = time;
  }
}

// ============== ROAD CLASS ==============

class Road {
  private options: PresetConfig;
  private fogUniforms: Record<string, { value: THREE.Color | number }>;
  private distortionObj: Distortion;
  private uTime = { value: 0 };
  leftRoadWay!: THREE.Mesh;
  rightRoadWay!: THREE.Mesh;
  island!: THREE.Mesh;

  constructor(
    options: PresetConfig,
    fogUniforms: Record<string, { value: THREE.Color | number }>,
    distortionObj: Distortion
  ) {
    this.options = options;
    this.fogUniforms = fogUniforms;
    this.distortionObj = distortionObj;
  }

  createPlane(side: number, isRoad: boolean): THREE.Mesh {
    const options = this.options;
    const segments = 100;
    const geometry = new THREE.PlaneGeometry(
      isRoad ? options.roadWidth : options.islandWidth,
      options.length,
      20,
      segments
    );

    let uniforms: Record<string, { value: unknown }> = {
      uTravelLength: { value: options.length },
      uColor: { value: new THREE.Color(isRoad ? options.colors.roadColor : options.colors.islandColor) },
      uTime: this.uTime,
    };

    if (isRoad) {
      uniforms = Object.assign(uniforms, {
        uLanes: { value: options.lanesPerRoad },
        uBrokenLinesColor: { value: new THREE.Color(options.colors.brokenLines) },
        uShoulderLinesColor: { value: new THREE.Color(options.colors.shoulderLines) },
        uShoulderLinesWidthPercentage: { value: options.shoulderLinesWidthPercentage },
        uBrokenLinesLengthPercentage: { value: options.brokenLinesLengthPercentage },
        uBrokenLinesWidthPercentage: { value: options.brokenLinesWidthPercentage },
      });
    }

    const material = new THREE.ShaderMaterial({
      fragmentShader: isRoad ? roadFragment : islandFragment,
      vertexShader: roadVertex,
      side: THREE.DoubleSide,
      uniforms: Object.assign(uniforms, this.fogUniforms, this.distortionObj.uniforms),
    });

    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <getDistortion_vertex>',
        this.distortionObj.getDistortion
      );
    };

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = -options.length / 2;
    mesh.position.x += (options.islandWidth / 2 + options.roadWidth / 2) * side;

    return mesh;
  }

  init(scene: THREE.Scene) {
    this.leftRoadWay = this.createPlane(-1, true);
    this.rightRoadWay = this.createPlane(1, true);
    this.island = this.createPlane(0, false);

    scene.add(this.leftRoadWay);
    scene.add(this.rightRoadWay);
    scene.add(this.island);
  }

  update(time: number) {
    this.uTime.value = time;
  }
}

// ============== MAIN COMPONENT ==============

export const HyperspeedVisualizer: React.FC<HyperspeedVisualizerProps> = ({
  isActive,
  volumeRef,
  className,
  settings: settingsOverride,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const frameIdRef = useRef<number>(0);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const timeOffsetRef = useRef<number>(0);
  const speedUpRef = useRef<number>(0);
  const speedUpTargetRef = useRef<number>(0);
  const fovTargetRef = useRef<number>(90);
  const smoothVolumeRef = useRef<number>(0);

  const leftCarLightsRef = useRef<CarLights | null>(null);
  const rightCarLightsRef = useRef<CarLights | null>(null);
  const lightSticksRef = useRef<LightSticks | null>(null);
  const roadRef = useRef<Road | null>(null);

  const settings = useMemo(
    () => ({
      ...DEFAULT_HYPERSPEED_SETTINGS,
      ...settingsOverride,
    }),
    [settingsOverride]
  );

  const presetConfig = useMemo(() => {
    // Resolve preset alias to numbered preset
    const resolvedPreset = PRESET_ALIASES[settings.preset] || 'one';
    return PRESETS[resolvedPreset];
  }, [settings.preset]);

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 264;
    const height = container.clientHeight || 264;

    const distortionObj = distortions[presetConfig.distortion];

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(presetConfig.colors.background);
    const fog = new THREE.Fog(presetConfig.colors.background, presetConfig.length * 0.2, presetConfig.length * 500);
    scene.fog = fog;
    sceneRef.current = scene;

    const fogUniforms = {
      fogColor: { value: fog.color },
      fogNear: { value: fog.near },
      fogFar: { value: fog.far },
    };

    // Camera
    const camera = new THREE.PerspectiveCamera(presetConfig.fov, width / height, 0.1, 10000);
    camera.position.z = -5;
    camera.position.y = 8;
    camera.position.x = 0;
    cameraRef.current = camera;
    fovTargetRef.current = presetConfig.fov;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Road
    const road = new Road(presetConfig, fogUniforms, distortionObj);
    road.init(scene);
    roadRef.current = road;

    // Car lights (left - moving away)
    const leftCarLights = new CarLights(
      presetConfig,
      presetConfig.colors.leftCars,
      presetConfig.movingAwaySpeed,
      new THREE.Vector2(0, 1 - presetConfig.carLightsFade),
      fogUniforms,
      distortionObj
    );
    const leftMesh = leftCarLights.init();
    leftMesh.position.setX(-presetConfig.roadWidth / 2 - presetConfig.islandWidth / 2);
    scene.add(leftMesh);
    leftCarLightsRef.current = leftCarLights;

    // Car lights (right - moving closer)
    const rightCarLights = new CarLights(
      presetConfig,
      presetConfig.colors.rightCars,
      presetConfig.movingCloserSpeed,
      new THREE.Vector2(1, 0 + presetConfig.carLightsFade),
      fogUniforms,
      distortionObj
    );
    const rightMesh = rightCarLights.init();
    rightMesh.position.setX(presetConfig.roadWidth / 2 + presetConfig.islandWidth / 2);
    scene.add(rightMesh);
    rightCarLightsRef.current = rightCarLights;

    // Light sticks
    const lightSticks = new LightSticks(presetConfig, fogUniforms, distortionObj);
    const stickMesh = lightSticks.init();
    stickMesh.position.setX(-(presetConfig.roadWidth + presetConfig.islandWidth / 2));
    scene.add(stickMesh);
    lightSticksRef.current = lightSticks;

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new EffectPass(
        camera,
        new BloomEffect({
          intensity: settings.bloomStrength,
          luminanceThreshold: 0.2,
          luminanceSmoothing: 0,
        })
      )
    );
    composer.addPass(new EffectPass(camera, new SMAAEffect()));
    composerRef.current = composer;

    clockRef.current.start();
  }, [presetConfig, settings.bloomStrength]);

  const animate = useCallback(() => {
    if (!composerRef.current || !cameraRef.current || !sceneRef.current) return;

    const delta = clockRef.current.getDelta();
    const lerpPercentage = Math.exp(-(-60 * Math.log2(1 - 0.1)) * delta);

    // Audio-reactive speed
    const rawVolume = volumeRef.current || 0;
    const attackSpeed = 0.3;
    const decaySpeed = 0.05;

    if (rawVolume > smoothVolumeRef.current) {
      smoothVolumeRef.current += (rawVolume - smoothVolumeRef.current) * attackSpeed;
    } else {
      smoothVolumeRef.current += (rawVolume - smoothVolumeRef.current) * decaySpeed;
    }

    // Speed based on audio
    speedUpTargetRef.current = smoothVolumeRef.current * presetConfig.speedUp * 2;
    speedUpRef.current += lerp(speedUpRef.current, speedUpTargetRef.current, lerpPercentage, 0.00001);
    timeOffsetRef.current += speedUpRef.current * delta;

    const time = (clockRef.current.elapsedTime + timeOffsetRef.current) * settings.baseSpeed;

    // Update all elements
    if (roadRef.current) roadRef.current.update(time);
    if (leftCarLightsRef.current) leftCarLightsRef.current.update(time);
    if (rightCarLightsRef.current) rightCarLightsRef.current.update(time);
    if (lightSticksRef.current) lightSticksRef.current.update(time);

    // Dynamic FOV based on audio
    const targetFov = presetConfig.fov + smoothVolumeRef.current * (presetConfig.fovSpeedUp - presetConfig.fov);
    const fovChange = lerp(cameraRef.current.fov, targetFov, lerpPercentage);
    if (fovChange !== 0) {
      cameraRef.current.fov += fovChange * delta * 6;
    }

    // Camera look-at distortion
    const distortionObj = distortions[presetConfig.distortion];
    if (distortionObj.getJS) {
      const distortion = distortionObj.getJS(0.025, time);
      cameraRef.current.lookAt(
        new THREE.Vector3(
          cameraRef.current.position.x + distortion.x,
          cameraRef.current.position.y + distortion.y,
          cameraRef.current.position.z + distortion.z
        )
      );
    }

    cameraRef.current.updateProjectionMatrix();
    composerRef.current.render(delta);
    frameIdRef.current = requestAnimationFrame(animate);
  }, [volumeRef, settings.baseSpeed, presetConfig]);

  useEffect(() => {
    if (!isActive) return;

    initScene();
    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && containerRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch {
          // Element might already be removed
        }
        rendererRef.current.dispose();
      }
      composerRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      leftCarLightsRef.current = null;
      rightCarLightsRef.current = null;
      lightSticksRef.current = null;
      roadRef.current = null;
    };
  }, [isActive, initScene, animate]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current || !composerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
      composerRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '264px',
        height: '264px',
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#000',
      }}
    />
  );
};
