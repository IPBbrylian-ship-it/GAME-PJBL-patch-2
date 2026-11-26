import * as THREE from 'three';
import { ProceduralTextureBank } from './textures';

export interface CityscapeController {
  root: THREE.Group;
  applyAtmosphere: (blend: number, isTrueEnding?: boolean) => void;
}

interface PlacedFootprint {
  x: number;
  z: number;
  r: number;
}

function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function createCampusWingBuilding(
  textures: ProceduralTextureBank,
  width: number,
  height: number,
  depth: number,
  wallMat: THREE.MeshStandardMaterial,
  roofMat: THREE.MeshStandardMaterial,
  glassMat: THREE.MeshPhysicalMaterial,
  trimMat: THREE.MeshStandardMaterial
): THREE.Group {
  const group = new THREE.Group();

  // Stone plinth foundation
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.55, depth + 0.8), trimMat);
  plinth.position.y = 0.275;
  plinth.receiveShadow = true;

  // Main multi-story body
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  body.position.y = 0.55 + height / 2;
  body.receiveShadow = true;

  // Overhanging cornice & pitched roof
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 1.1, 0.35, depth + 1.1), trimMat);
  cornice.position.y = 0.55 + height + 0.175;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.68, 2.2, 4),
    roofMat
  );
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(width / Math.max(width, depth), 1, depth / Math.max(width, depth));
  roof.position.y = 0.55 + height + 1.45;

  // Recessed side entrance portico + glass door
  const portico = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.6, 1.8), trimMat);
  portico.position.set(0, 1.8, depth / 2 + 0.75);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.6), glassMat);
  glass.position.set(0, 1.45, depth / 2 + 1.67);

  group.add(plinth, body, cornice, roof, portico, glass);

  // Side buttress pilasters for architectural silhouette depth
  const pilasterGeo = new THREE.BoxGeometry(0.55, height + 0.2, 0.45);
  [-width * 0.38, 0, width * 0.38].forEach((px) => {
    if (Math.abs(px) < 1.5) return;
    const pil = new THREE.Mesh(pilasterGeo, trimMat);
    pil.position.set(px, 0.55 + height / 2, depth / 2 + 0.16);
    group.add(pil);
  });

  return group;
}

export function buildLayeredCityscape(
  textures: ProceduralTextureBank,
  options: {
    innerClearRadius: number;
    isWarmDay: boolean;
    isTrueEnding?: boolean;
  }
): CityscapeController {
  const root = new THREE.Group();
  const rng = createSeededRng(20261125);
  const footprints: PlacedFootprint[] = [];

  const isOverlapping = (x: number, z: number, r: number): boolean => {
    const distFromOrigin = Math.hypot(x, z);
    if (distFromOrigin < options.innerClearRadius + r) return true;
    for (let i = 0; i < footprints.length; i++) {
      const f = footprints[i];
      const dx = x - f.x;
      const dz = z - f.z;
      if (dx * dx + dz * dz < (r + f.r + 1.6) * (r + f.r + 1.6)) return true;
    }
    return false;
  };

  // =========================================================================
  // 1. FOREGROUND CAMPUS WINGS & PERIMETER STREETS (30m - 52m)
  // =========================================================================
  const fgWallMat = new THREE.MeshStandardMaterial({
    map: textures.facultyFacade,
    bumpMap: textures.plasterWallBump,
    bumpScale: 0.018,
    color: 0xc2ccd6,
    emissive: 0xd4a353,
    emissiveMap: textures.cityFacadeEmissive,
    emissiveIntensity: 0.0,
    roughness: 0.78,
    metalness: 0.06,
  });
  const fgRoofMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.72,
    metalness: 0.12,
  });
  const fgTrimMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.76,
    metalness: 0.1,
  });
  const fgGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b5975,
    roughness: 0.12,
    metalness: 0.82,
    clearcoat: 0.9,
  });

  // West Campus Library Wing
  const westWing = createCampusWingBuilding(textures, 16, 7.6, 7.2, fgWallMat, fgRoofMat, fgGlassMat, fgTrimMat);
  westWing.position.set(-34, 0, -6);
  westWing.rotation.y = Math.PI / 2;
  root.add(westWing);
  footprints.push({ x: -34, z: -6, r: 10 });

  // East Campus Student Center / Auditorium
  const eastWing = createCampusWingBuilding(textures, 18, 8.2, 7.6, fgWallMat, fgRoofMat, fgGlassMat, fgTrimMat);
  eastWing.position.set(34, 0, -5);
  eastWing.rotation.y = -Math.PI / 2;
  root.add(eastWing);
  footprints.push({ x: 34, z: -5, r: 11 });

  // Northwest Annex Hall (frames horizon behind main Faculty Building)
  const nwAnnex = createCampusWingBuilding(textures, 15, 6.8, 6.5, fgWallMat, fgRoofMat, fgGlassMat, fgTrimMat);
  nwAnnex.position.set(-24, 0, -34);
  nwAnnex.rotation.y = 0.25;
  root.add(nwAnnex);
  footprints.push({ x: -24, z: -34, r: 9.5 });

  // Northeast Annex Hall
  const neAnnex = createCampusWingBuilding(textures, 15, 6.8, 6.5, fgWallMat, fgRoofMat, fgGlassMat, fgTrimMat);
  neAnnex.position.set(24, 0, -34);
  neAnnex.rotation.y = -0.25;
  root.add(neAnnex);
  footprints.push({ x: 24, z: -34, r: 9.5 });

  // South-East & South-West Campus Dorm/Gate Pavilions (placed off-axis so title/prologue camera behind +Z is clear)
  const swHall = createCampusWingBuilding(textures, 13, 6.2, 6.2, fgWallMat, fgRoofMat, fgGlassMat, fgTrimMat);
  swHall.position.set(-28, 0, 26);
  swHall.rotation.y = Math.PI * 0.72;
  root.add(swHall);
  footprints.push({ x: -28, z: 26, r: 8.5 });

  const seHall = createCampusWingBuilding(textures, 13, 6.2, 6.2, fgWallMat, fgRoofMat, fgGlassMat, fgTrimMat);
  seHall.position.set(28, 0, 26);
  seHall.rotation.y = -Math.PI * 0.72;
  root.add(seHall);
  footprints.push({ x: 28, z: 26, r: 8.5 });

  // Perimeter City Boulevard Asphalt Ring (grounded at y = 0.015 so zero Z-fighting)
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x2a333f,
    roughness: 0.88,
    metalness: 0.05,
  });
  const roadRingN = new THREE.Mesh(new THREE.PlaneGeometry(180, 7.5), roadMat);
  roadRingN.rotation.x = -Math.PI / 2;
  roadRingN.position.set(0, 0.015, -44);
  const roadRingS = roadRingN.clone();
  roadRingS.position.set(0, 0.015, 44);
  const roadRingW = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 180), roadMat);
  roadRingW.rotation.x = -Math.PI / 2;
  roadRingW.position.set(-44, 0.015, 0);
  const roadRingE = roadRingW.clone();
  roadRingE.position.set(44, 0.015, 0);
  root.add(roadRingN, roadRingS, roadRingW, roadRingE);

  // =========================================================================
  // 2. MIDGROUND LAYERED CITY BLOCKS (52m - 96m) — InstancedMesh
  // =========================================================================
  const midFacadeMat = new THREE.MeshStandardMaterial({
    map: textures.cityFacade,
    emissive: 0xffffff,
    emissiveMap: textures.cityFacadeEmissive,
    emissiveIntensity: 0.0,
    roughness: 0.84,
    metalness: 0.08,
    color: 0xffffff,
  });
  const midRoofMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.1,
  });

  // Unit geometries pivoted at bottom-center (y = 0)
  const unitBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  unitBoxGeo.translate(0, 0.5, 0);

  const pitchedRoofGeo = new THREE.ConeGeometry(0.74, 1, 4);
  pitchedRoofGeo.rotateY(Math.PI / 4);
  pitchedRoofGeo.translate(0, 0.5, 0);

  interface MidBuildingSpec {
    x: number;
    z: number;
    w: number;
    h: number;
    d: number;
    yaw: number;
    hasPitchedRoof: boolean;
    hasCrown: boolean;
    tint: THREE.Color;
  }

  const midSpecs: MidBuildingSpec[] = [];
  const midCalmPalette = [0xc7bfb4, 0xb8c0c8, 0xaab4be, 0xc3b7a6, 0x9aa9b8];

  // Arrange midground along believable urban street grids around the campus
  for (let i = 0; i < 68; i++) {
    const angle = (i / 68) * Math.PI * 2 + (rng() - 0.5) * 0.08;
    const band = i % 2 === 0 ? 54 + rng() * 18 : 74 + rng() * 20;
    // Snap loosely to 90-degree urban block orientation
    const rawX = Math.cos(angle) * band;
    const rawZ = Math.sin(angle) * band;
    const x = Math.round(rawX / 4) * 4 + (rng() - 0.5) * 2.5;
    const z = Math.round(rawZ / 4) * 4 + (rng() - 0.5) * 2.5;
    const w = 7.5 + rng() * 7.5;
    const d = 6.5 + rng() * 6.5;
    const h = 9 + rng() * 17;
    const radius = Math.hypot(w, d) * 0.52;

    if (isOverlapping(x, z, radius)) continue;
    footprints.push({ x, z, r: radius });

    const yaw = Math.floor(rng() * 4) * (Math.PI / 2);
    const tint = new THREE.Color(midCalmPalette[Math.floor(rng() * midCalmPalette.length)]);
    midSpecs.push({
      x,
      z,
      w,
      h,
      d,
      yaw,
      hasPitchedRoof: h < 14 && rng() > 0.35,
      hasCrown: h >= 14 && rng() > 0.3,
      tint,
    });
  }

  const midBodyInst = new THREE.InstancedMesh(unitBoxGeo, midFacadeMat, midSpecs.length);
  midBodyInst.castShadow = false;
  midBodyInst.receiveShadow = true;

  const pitchedSpecs = midSpecs.filter((s) => s.hasPitchedRoof);
  const crownSpecs = midSpecs.filter((s) => s.hasCrown);
  const midPitchedInst = new THREE.InstancedMesh(
    pitchedRoofGeo,
    midRoofMat,
    Math.max(1, pitchedSpecs.length)
  );
  const midCrownInst = new THREE.InstancedMesh(
    unitBoxGeo,
    midRoofMat,
    Math.max(1, crownSpecs.length)
  );
  midPitchedInst.castShadow = false;
  midCrownInst.castShadow = false;

  const dummy = new THREE.Object3D();
  const midBaseColors: THREE.Color[] = [];
  const midRoofBaseColors: THREE.Color[] = [];
  const midCrownBaseColors: THREE.Color[] = [];

  midSpecs.forEach((s, idx) => {
    dummy.position.set(s.x, 0, s.z);
    dummy.rotation.set(0, s.yaw, 0);
    dummy.scale.set(s.w, s.h, s.d);
    dummy.updateMatrix();
    midBodyInst.setMatrixAt(idx, dummy.matrix);
    midBodyInst.setColorAt(idx, s.tint);
    midBaseColors.push(s.tint.clone());
  });
  midBodyInst.instanceMatrix.needsUpdate = true;
  if (midBodyInst.instanceColor) midBodyInst.instanceColor.needsUpdate = true;
  midBodyInst.computeBoundingSphere();
  root.add(midBodyInst);

  if (pitchedSpecs.length > 0) {
    pitchedSpecs.forEach((s, idx) => {
      dummy.position.set(s.x, s.h, s.z);
      dummy.rotation.set(0, s.yaw, 0);
      dummy.scale.set(s.w * 1.06, 2.2 + (s.w * 0.12), s.d * 1.06);
      dummy.updateMatrix();
      midPitchedInst.setMatrixAt(idx, dummy.matrix);
      const rc = new THREE.Color(rng() > 0.5 ? 0x6b3f35 : 0x3b4859);
      midPitchedInst.setColorAt(idx, rc);
      midRoofBaseColors.push(rc);
    });
    midPitchedInst.instanceMatrix.needsUpdate = true;
    if (midPitchedInst.instanceColor) midPitchedInst.instanceColor.needsUpdate = true;
    midPitchedInst.computeBoundingSphere();
    root.add(midPitchedInst);
  }

  if (crownSpecs.length > 0) {
    crownSpecs.forEach((s, idx) => {
      dummy.position.set(s.x, s.h, s.z);
      dummy.rotation.set(0, s.yaw, 0);
      dummy.scale.set(s.w * 0.56, 2.0 + rng() * 2.2, s.d * 0.56);
      dummy.updateMatrix();
      midCrownInst.setMatrixAt(idx, dummy.matrix);
      const cc = new THREE.Color(0x475569);
      midCrownInst.setColorAt(idx, cc);
      midCrownBaseColors.push(cc);
    });
    midCrownInst.instanceMatrix.needsUpdate = true;
    if (midCrownInst.instanceColor) midCrownInst.instanceColor.needsUpdate = true;
    midCrownInst.computeBoundingSphere();
    root.add(midCrownInst);
  }

  // =========================================================================
  // 3. BACKGROUND URBAN SKYLINE TOWERS (98m - 155m) — Simplified Low-Poly
  // =========================================================================
  const bgTowerMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.05,
  });
  const bgCalmPalette = [0x8899aa, 0x7c8ea0, 0x94a1ae, 0x768595];
  const bgSpecs: { x: number; z: number; w: number; h: number; d: number; yaw: number; stepH: number; tint: THREE.Color }[] = [];

  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2 + (rng() - 0.5) * 0.07;
    const dist = 102 + rng() * 52;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const w = 10 + rng() * 11;
    const d = 9 + rng() * 10;
    const h = 22 + rng() * 34;
    const radius = Math.hypot(w, d) * 0.5;
    if (isOverlapping(x, z, radius)) continue;
    footprints.push({ x, z, r: radius });

    bgSpecs.push({
      x,
      z,
      w,
      h,
      d,
      yaw: Math.floor(rng() * 4) * (Math.PI / 2) + (rng() - 0.5) * 0.14,
      stepH: rng() > 0.35 ? 4 + rng() * 9 : 0,
      tint: new THREE.Color(bgCalmPalette[Math.floor(rng() * bgCalmPalette.length)]),
    });
  }

  const bgBodyInst = new THREE.InstancedMesh(unitBoxGeo, bgTowerMat, bgSpecs.length);
  const bgStepSpecs = bgSpecs.filter((s) => s.stepH > 0);
  const bgStepInst = new THREE.InstancedMesh(unitBoxGeo, bgTowerMat, Math.max(1, bgStepSpecs.length));
  const bgBaseColors: THREE.Color[] = [];
  const bgStepBaseColors: THREE.Color[] = [];

  bgSpecs.forEach((s, idx) => {
    dummy.position.set(s.x, 0, s.z);
    dummy.rotation.set(0, s.yaw, 0);
    dummy.scale.set(s.w, s.h, s.d);
    dummy.updateMatrix();
    bgBodyInst.setMatrixAt(idx, dummy.matrix);
    bgBodyInst.setColorAt(idx, s.tint);
    bgBaseColors.push(s.tint.clone());
  });
  bgBodyInst.instanceMatrix.needsUpdate = true;
  if (bgBodyInst.instanceColor) bgBodyInst.instanceColor.needsUpdate = true;
  bgBodyInst.computeBoundingSphere();
  root.add(bgBodyInst);

  if (bgStepSpecs.length > 0) {
    bgStepSpecs.forEach((s, idx) => {
      dummy.position.set(s.x, s.h, s.z);
      dummy.rotation.set(0, s.yaw, 0);
      dummy.scale.set(s.w * 0.62, s.stepH, s.d * 0.62);
      dummy.updateMatrix();
      bgStepInst.setMatrixAt(idx, dummy.matrix);
      const sc = s.tint.clone().multiplyScalar(0.92);
      bgStepInst.setColorAt(idx, sc);
      bgStepBaseColors.push(sc);
    });
    bgStepInst.instanceMatrix.needsUpdate = true;
    if (bgStepInst.instanceColor) bgStepInst.instanceColor.needsUpdate = true;
    bgStepInst.computeBoundingSphere();
    root.add(bgStepInst);
  }

  // =========================================================================
  // 4. FAR BACKGROUND ATMOSPHERIC SILHOUETTE RING (160m - 228m)
  // =========================================================================
  const farMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1.0,
    metalness: 0.0,
  });
  const farSpecs: { x: number; z: number; w: number; h: number; d: number; yaw: number; tint: THREE.Color }[] = [];

  for (let i = 0; i < 68; i++) {
    const angle = (i / 68) * Math.PI * 2 + (rng() - 0.5) * 0.05;
    const dist = 166 + rng() * 58;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const w = 14 + rng() * 16;
    const d = 12 + rng() * 12;
    const h = 28 + rng() * 48;
    const tint = new THREE.Color(0x7c8fa4).offsetHSL(0, 0, (rng() - 0.5) * 0.06);
    farSpecs.push({ x, z, w, h, d, yaw: angle + Math.PI / 2, tint });
  }

  const farInst = new THREE.InstancedMesh(unitBoxGeo, farMat, farSpecs.length);
  const farBaseColors: THREE.Color[] = [];
  farSpecs.forEach((s, idx) => {
    dummy.position.set(s.x, 0, s.z);
    dummy.rotation.set(0, s.yaw, 0);
    dummy.scale.set(s.w, s.h, s.d);
    dummy.updateMatrix();
    farInst.setMatrixAt(idx, dummy.matrix);
    farInst.setColorAt(idx, s.tint);
    farBaseColors.push(s.tint.clone());
  });
  farInst.instanceMatrix.needsUpdate = true;
  if (farInst.instanceColor) farInst.instanceColor.needsUpdate = true;
  farInst.computeBoundingSphere();
  root.add(farInst);

  // =========================================================================
  // ATMOSPHERE INTERPOLATION (Daylight Calm -> Midnight Horror -> Golden Dawn)
  // =========================================================================
  const tmpColor = new THREE.Color();
  const nightSlate = new THREE.Color(0x1b2636);
  const nightFarSlate = new THREE.Color(0x0c1420);
  const dawnTint = new THREE.Color(0xd6b88d);

  const applyAtmosphere = (blend: number, isTrueEnding = false) => {
    const b = THREE.MathUtils.clamp(blend, 0, 1);

    if (isTrueEnding) {
      fgWallMat.color.setHex(0xd4c8b8);
      fgWallMat.emissiveIntensity = 0.06;
      fgRoofMat.color.setHex(0x283548);
      fgTrimMat.color.setHex(0x8a8275);
      roadMat.color.setHex(0x334155);
      midFacadeMat.emissiveIntensity = 0.08;
    } else {
      fgWallMat.color.setHex(0xc2ccd6).lerp(new THREE.Color(0x253244), b);
      fgWallMat.emissiveIntensity = THREE.MathUtils.clamp((b - 0.3) / 0.7, 0, 1) * 0.36;
      fgRoofMat.color.setHex(0x334155).lerp(new THREE.Color(0x0d1521), b);
      fgTrimMat.color.setHex(0x64748b).lerp(new THREE.Color(0x1a2433), b);
      roadMat.color.setHex(0x2a333f).lerp(new THREE.Color(0x0d131d), b);
      midFacadeMat.emissiveIntensity = THREE.MathUtils.clamp((b - 0.25) / 0.75, 0, 1) * 0.44;
    }

    // Update per-instance desaturated atmospheric perspective tints
    for (let i = 0; i < midBaseColors.length; i++) {
      tmpColor.copy(midBaseColors[i]);
      if (isTrueEnding) tmpColor.lerp(dawnTint, 0.28);
      else tmpColor.lerp(nightSlate, b * 0.78);
      midBodyInst.setColorAt(i, tmpColor);
    }
    if (midBodyInst.instanceColor) midBodyInst.instanceColor.needsUpdate = true;

    for (let i = 0; i < midRoofBaseColors.length; i++) {
      tmpColor.copy(midRoofBaseColors[i]).lerp(nightFarSlate, isTrueEnding ? 0.25 : b * 0.78);
      midPitchedInst.setColorAt(i, tmpColor);
    }
    if (pitchedSpecs.length > 0 && midPitchedInst.instanceColor) {
      midPitchedInst.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < midCrownBaseColors.length; i++) {
      tmpColor.copy(midCrownBaseColors[i]).lerp(nightFarSlate, isTrueEnding ? 0.2 : b * 0.78);
      midCrownInst.setColorAt(i, tmpColor);
    }
    if (crownSpecs.length > 0 && midCrownInst.instanceColor) {
      midCrownInst.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < bgBaseColors.length; i++) {
      tmpColor.copy(bgBaseColors[i]);
      if (isTrueEnding) tmpColor.lerp(dawnTint, 0.22);
      else tmpColor.lerp(nightSlate, b * 0.84);
      bgBodyInst.setColorAt(i, tmpColor);
    }
    if (bgBodyInst.instanceColor) bgBodyInst.instanceColor.needsUpdate = true;

    for (let i = 0; i < bgStepBaseColors.length; i++) {
      tmpColor.copy(bgStepBaseColors[i]);
      if (isTrueEnding) tmpColor.lerp(dawnTint, 0.22);
      else tmpColor.lerp(nightSlate, b * 0.84);
      bgStepInst.setColorAt(i, tmpColor);
    }
    if (bgStepSpecs.length > 0 && bgStepInst.instanceColor) {
      bgStepInst.instanceColor.needsUpdate = true;
    }

    for (let i = 0; i < farBaseColors.length; i++) {
      tmpColor.copy(farBaseColors[i]);
      if (isTrueEnding) tmpColor.lerp(new THREE.Color(0x526074), 0.45);
      else tmpColor.lerp(nightFarSlate, b * 0.88);
      farInst.setColorAt(i, tmpColor);
    }
    if (farInst.instanceColor) farInst.instanceColor.needsUpdate = true;
  };

  applyAtmosphere(options.isWarmDay ? 0 : 1, options.isTrueEnding);

  return { root, applyAtmosphere };
}
