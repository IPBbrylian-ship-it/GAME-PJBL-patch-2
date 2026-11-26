import * as THREE from 'three';
import { createArticulatedPerson, ArticulatedCharacterRig } from './characters';
import { ProceduralTextureBank } from './textures';

function addContactShadow(group: THREE.Group, tex: THREE.CanvasTexture, radius = 0.85, y = 0.015): void {
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    opacity: 0.54,
    depthWrite: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = y;
  plane.renderOrder = 1;
  group.add(plane);
}

// PROLOG & BABAK IV: Wrought-iron & Slatted Wood Campus Park Bench
export function createParkBench(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.02,
    roughnessMap: textures.frostedWoodRough,
    color: 0x6b4b38,
    roughness: 0.72,
    metalness: 0.05,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1a222d,
    roughness: 0.34,
    metalness: 0.85,
  });

  for (let i = 0; i < 4; i++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.048, 0.12), woodMat);
    slat.position.set(0, 0.45, -0.18 + i * 0.13);
    slat.castShadow = true;
    slat.receiveShadow = true;
    group.add(slat);
  }
  for (let i = 0; i < 3; i++) {
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.11, 0.045), woodMat);
    back.position.set(0, 0.65 + i * 0.145, -0.27);
    back.rotation.x = -0.16;
    back.castShadow = true;
    group.add(back);
  }

  [-0.92, 0.92].forEach((lx) => {
    const legFront = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.45, 12), ironMat);
    legFront.position.set(lx, 0.225, 0.22);
    const legBack = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 1.0, 12), ironMat);
    legBack.position.set(lx, 0.5, -0.25);
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.022, 10, 20, Math.PI * 0.75), ironMat);
    arm.rotation.y = Math.PI / 2;
    arm.position.set(lx, 0.56, 0.02);
    const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.015, 8, 16), ironMat);
    scroll.rotation.y = Math.PI / 2;
    scroll.position.set(lx, 0.36, 0.08);
    group.add(legFront, legBack, arm, scroll);
  });

  addContactShadow(group, textures.contactShadow, 1.35);
  return group;
}

// PROLOG & BABAK IV: Classic Streetlamp with Frosted Glass & Light Cone
export function createClassicStreetlamp(textures: ProceduralTextureBank, warmLight = false): THREE.Group {
  const group = new THREE.Group();
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x151c24, roughness: 0.32, metalness: 0.88 });
  const bulbHex = warmLight ? 0xfbbf24 : 0x93c5fd;
  const glassMat = new THREE.MeshPhysicalMaterial({
    map: textures.frostIce,
    color: bulbHex,
    emissive: bulbHex,
    emissiveIntensity: 1.5,
    roughness: 0.3,
    transparent: true,
    opacity: 0.9,
  });

  const basePts = [
    new THREE.Vector2(0.28, 0),
    new THREE.Vector2(0.22, 0.26),
    new THREE.Vector2(0.14, 0.48),
    new THREE.Vector2(0.07, 0.7),
  ];
  const base = new THREE.Mesh(new THREE.LatheGeometry(basePts, 16), ironMat);
  base.castShadow = true;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.072, 3.3, 14), ironMat);
  pole.position.y = 2.25;
  pole.castShadow = true;
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.15, 0.46, 8), glassMat);
  lantern.position.y = 4.02;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.24, 8), ironMat);
  cap.position.y = 4.34;

  const coneMat = new THREE.MeshBasicMaterial({
    color: bulbHex,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.95, 4.0, 20, 1, true), coneMat);
  cone.position.y = 2.0;
  cone.renderOrder = 4;

  const pLight = new THREE.PointLight(bulbHex, warmLight ? 2.9 : 2.1, 13.5, 1.8);
  pLight.position.y = 3.85;

  group.add(base, pole, lantern, cap, cone, pLight);
  addContactShadow(group, textures.contactShadow, 0.68);
  return group;
}

// PROLOG & BABAK IV: Multi-Branched Winter Tree (Trunk + Primary + Secondary + Twigs)
export function createWinterTree(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const barkMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.035,
    color: 0x2a201b,
    roughness: 0.92,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    map: textures.frostIce,
    bumpMap: textures.frostIceBump,
    bumpScale: 0.02,
    color: 0xdbeafe,
    roughness: 0.65,
  });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 3.0, 14), barkMat);
  trunk.position.y = 1.5;
  trunk.castShadow = true;
  group.add(trunk);

  // Exposed roots
  for (let r = 0; r < 4; r++) {
    const ang = (r / 4) * Math.PI * 2 + 0.3;
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.85, 8), barkMat);
    root.position.set(Math.cos(ang) * 0.32, 0.14, Math.sin(ang) * 0.32);
    root.rotation.z = Math.cos(ang) * -0.9;
    root.rotation.x = Math.sin(ang) * 0.9;
    group.add(root);
  }

  const primaries = [
    { pos: [-0.45, 2.7, 0.15], rot: [0.22, 0, 0.68], len: 2.0, rad: 0.085 },
    { pos: [0.48, 2.88, -0.2], rot: [-0.24, 0, -0.62], len: 1.85, rad: 0.08 },
    { pos: [0.1, 3.15, 0.48], rot: [0.58, 0, 0.14], len: 1.7, rad: 0.072 },
    { pos: [-0.2, 3.35, -0.45], rot: [-0.55, 0, -0.16], len: 1.6, rad: 0.068 },
  ];

  primaries.forEach((b, idx) => {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(b.rad * 0.5, b.rad, b.len, 10), barkMat);
    branch.position.set(b.pos[0], b.pos[1], b.pos[2]);
    branch.rotation.set(b.rot[0], b.rot[1], b.rot[2]);
    branch.castShadow = true;
    group.add(branch);

    // Secondary forks + fine twigs
    for (let s = 0; s < 2; s++) {
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.036, 1.05, 6), barkMat);
      const sign = s === 0 ? 1 : -1;
      fork.position.set(
        b.pos[0] * 1.65 + sign * 0.32,
        b.pos[1] + 0.68 + s * 0.22,
        b.pos[2] * 1.65 + (idx % 2 === 0 ? 0.25 : -0.25)
      );
      fork.rotation.set(b.rot[0] + sign * 0.35, 0, b.rot[2] + sign * 0.45);
      group.add(fork);

      const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.016, 0.62, 5), barkMat);
      twig.position.set(fork.position.x + sign * 0.2, fork.position.y + 0.42, fork.position.z);
      twig.rotation.z = fork.rotation.z + sign * 0.4;
      group.add(twig);
    }

    const frostPatch = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.45, 4, 8), snowMat);
    frostPatch.position.set(b.pos[0] * 0.9, b.pos[1] + 0.08, b.pos[2] * 0.9);
    frostPatch.rotation.set(b.rot[0], b.rot[1], b.rot[2]);
    group.add(frostPatch);
  });

  addContactShadow(group, textures.contactShadow, 1.1);
  return group;
}

// PROLOG & BABAK IV: Campus Trash Bin & Bulletin Board with Torn Posters
export function createCampusTrashBin(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x263140, roughness: 0.42, metalness: 0.72 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.85 });

  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.72, 18), metalMat);
  bin.position.y = 0.36;
  bin.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 20), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.72;
  group.add(bin, rim);
  addContactShadow(group, textures.contactShadow, 0.45);
  return group;
}

export function createCampusBulletinBoard(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.015,
    color: 0x4b3529,
    roughness: 0.75,
  });
  const boardMat = new THREE.MeshStandardMaterial({
    map: textures.bulletinBoard,
    roughness: 0.68,
  });

  [-0.95, 0.95].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 2.3, 10), woodMat);
    post.position.set(px, 1.15, 0);
    post.castShadow = true;
    group.add(post);
  });
  const backing = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.15, 0.1), woodMat);
  backing.position.y = 1.55;
  backing.castShadow = true;
  const flyers = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 0.98), boardMat);
  flyers.position.set(0, 1.55, 0.055);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.45), woodMat);
  roof.position.set(0, 2.18, 0.05);
  roof.rotation.x = 0.18;

  group.add(backing, flyers, roof);
  addContactShadow(group, textures.contactShadow, 1.15);
  return group;
}

// PROLOG & BABAK IV: Uneven Snowbanks & Wild Grass Tufts
export function createSnowMoundsAndGrass(
  textures: ProceduralTextureBank,
  positions: [number, number][]
): THREE.Group {
  const group = new THREE.Group();
  const snowMat = new THREE.MeshStandardMaterial({
    map: textures.frostIce,
    bumpMap: textures.frostIceBump,
    bumpScale: 0.025,
    color: 0xcbe4f5,
    roughness: 0.65,
  });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x1e2c26, roughness: 0.88 });

  positions.forEach(([x, z], i) => {
    const mound = new THREE.Mesh(new THREE.SphereGeometry(0.95 + (i % 3) * 0.35, 16, 12), snowMat);
    mound.scale.set(1.4, 0.24, 1.1);
    mound.position.set(x, 0.02, z);
    mound.receiveShadow = true;
    group.add(mound);

    for (let g = 0; g < 5; g++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.32, 4), grassMat);
      blade.position.set(x + (g - 2) * 0.14, 0.16, z + ((g % 2) - 0.5) * 0.18);
      blade.rotation.z = (g - 2) * 0.14;
      group.add(blade);
    }
  });
  return group;
}

// PROLOG & BABAK IV: Multi-Story Faculty Building with Reflective Glass Panes
export function createFacultyBuilding(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({
    map: textures.facultyFacade,
    bumpMap: textures.plasterWallBump,
    bumpScale: 0.02,
    roughness: 0.78,
    metalness: 0.08,
  });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f1722, roughness: 0.72 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x334e68,
    roughness: 0.08,
    metalness: 0.88,
    clearcoat: 1.0,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(22, 8.5, 6), wallMat);
  body.position.y = 4.25;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(14, 2.4, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 9.7;
  const portico = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.4, 2.4), roofMat);
  portico.position.set(0, 2.2, 3.6);
  const doorGlass = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.8), glassMat);
  doorGlass.position.set(0, 1.6, 4.82);

  group.add(body, roof, portico, doorGlass);
  return group;
}

// BABAK I: Carved Wooden Staircase with Balusters & Handrail (fits 1.9m open stairwell pit)
export function createWoodenStaircase(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.022,
    roughnessMap: textures.frostedWoodRough,
    color: 0x6b4b38,
    roughness: 0.7,
    metalness: 0.05,
  });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x3b281e, roughness: 0.45, metalness: 0.1 });

  for (let s = 0; s < 7; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.2, 0.62), woodMat);
    step.position.set(0, -0.11 - s * 0.34, s * 0.56);
    step.receiveShadow = true;
    group.add(step);

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.038, 0.92, 8), railMat);
    postL.position.set(-0.84, 0.36 - s * 0.34, s * 0.56);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.038, 0.92, 8), railMat);
    postR.position.set(0.84, 0.36 - s * 0.34, s * 0.56);
    group.add(postL, postR);
  }

  const handrailL = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 4.6, 10), railMat);
  handrailL.position.set(-0.84, -0.22, 1.68);
  handrailL.rotation.x = Math.PI / 2 + 0.54;
  const handrailR = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 4.6, 10), railMat);
  handrailR.position.set(0.84, -0.22, 1.68);
  handrailR.rotation.x = Math.PI / 2 + 0.54;
  group.add(handrailL, handrailR);
  return group;
}

// BABAK I: Bed with Carved Headboard, Mattress, Dented Pillow & Crumpled Fabric Blanket
export function createBedWithBedding(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.02,
    color: 0x4b3529,
    roughness: 0.72,
  });
  const mattressMat = new THREE.MeshStandardMaterial({
    map: textures.fabricWeave,
    bumpMap: textures.fabricBump,
    bumpScale: 0.015,
    color: 0xcbd5e1,
    roughness: 0.88,
  });
  const blanketMat = new THREE.MeshStandardMaterial({
    map: textures.fabricWeave,
    bumpMap: textures.fabricBump,
    bumpScale: 0.022,
    roughnessMap: textures.fabricRough,
    color: 0x3f5e78,
    roughness: 0.84,
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.32, 2.35), woodMat);
  frame.position.y = 0.28;
  frame.castShadow = true;
  const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.68, 1.08, 0.12), woodMat);
  headboard.position.set(0, 0.65, -1.14);
  const hbArch = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 20, 1, false, 0, Math.PI), woodMat);
  hbArch.rotation.z = Math.PI / 2;
  hbArch.rotation.y = Math.PI / 2;
  hbArch.position.set(0, 1.18, -1.14);

  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.22, 2.2), mattressMat);
  mattress.position.y = 0.52;
  mattress.receiveShadow = true;

  const pillow = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.44, 8, 14), mattressMat);
  pillow.rotation.z = Math.PI / 2;
  pillow.scale.set(0.8, 1.0, 1.1);
  pillow.position.set(0, 0.66, -0.82);

  // Rumpled blanket ridges
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.11, 1.45), blanketMat);
  blanket.position.set(0, 0.62, 0.36);
  const fold1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 1.4, 6, 10), blanketMat);
  fold1.rotation.z = Math.PI / 2;
  fold1.rotation.y = 0.12;
  fold1.position.set(0.05, 0.67, 0.15);

  group.add(frame, headboard, hbArch, mattress, pillow, blanket, fold1);
  addContactShadow(group, textures.contactShadow, 1.35);
  return group;
}

// BABAK I: Night Window with Swaying Cloth Curtains
export function createNightWindowCurtain(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.015,
    color: 0x3b2a22,
    roughness: 0.72,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    map: textures.frostIce,
    color: 0x1e3a5f,
    emissive: 0x0c2440,
    emissiveIntensity: 0.75,
    roughness: 0.18,
    metalness: 0.15,
  });
  const curtainMat = new THREE.MeshStandardMaterial({
    map: textures.fabricWeave,
    bumpMap: textures.fabricBump,
    bumpScale: 0.018,
    color: 0x64748b,
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.85, 1.75, 0.14), woodMat);
  frame.position.y = 1.85;
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 1.52), glassMat);
  pane.position.set(0, 1.85, 0.08);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.25, 10), woodMat);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, 2.82, 0.16);

  const curtainL = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.95, 6, 8), curtainMat);
  curtainL.position.set(-0.68, 1.84, 0.19);
  curtainL.name = 'curtainLeft';
  const curtainR = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.95, 6, 8), curtainMat);
  curtainR.position.set(0.68, 1.84, 0.19);
  curtainR.name = 'curtainRight';

  group.add(frame, pane, rod, curtainL, curtainR);
  return group;
}

// BABAK I: Bedside Nakas with Water Glass, Thermometer, Children's Book & Smartphone
export function createPhoneNakasFragment(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.018,
    color: 0x3d2c22,
    roughness: 0.72,
  });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a353, roughness: 0.28, metalness: 0.85 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.78 });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 1.7,
    roughness: 0.15,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.56), woodMat);
  body.position.y = 0.46;
  body.castShadow = true;
  const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.04), woodMat);
  drawer.position.set(0, 0.52, 0.29);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), brassMat);
  knob.position.set(0, 0.52, 0.32);
  group.add(body, drawer, knob);

  [
    [-0.28, -0.22],
    [0.28, -0.22],
    [-0.28, 0.22],
    [0.28, 0.22],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.02, 0.28, 10), woodMat);
    leg.position.set(lx, 0.14, lz);
    group.add(leg);
  });

  // Water glass on top
  const glassCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.038, 0.11, 14),
    new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, roughness: 0.08, transparent: true, opacity: 0.72 })
  );
  glassCup.position.set(-0.22, 0.725, -0.1);
  // Thermometer
  const therm = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.008, 0.12, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })
  );
  therm.rotation.z = Math.PI / 2;
  therm.rotation.y = 0.4;
  therm.position.set(-0.14, 0.68, 0.14);
  // Children's storybook
  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.035, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x8c4a4a, roughness: 0.75 })
  );
  book.position.set(0.18, 0.688, -0.08);
  book.rotation.y = -0.22;
  group.add(glassCup, therm, book);

  // Floating glowing smartphone
  const floatGroup = new THREE.Group();
  floatGroup.position.set(0.02, 1.0, 0.05);
  floatGroup.name = 'floatingArtifact';
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 0.025), bodyMat);
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.38), screenMat);
  phoneScreen.position.z = 0.015;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.013, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0x78a9c4, emissive: 0x38bdf8, emissiveIntensity: 1.2 })
  );
  ring.rotation.x = Math.PI / 2;
  floatGroup.add(phoneBody, phoneScreen, ring);
  group.add(floatGroup);

  const glow = new THREE.PointLight(0x78a9c4, 2.2, 5.5, 2);
  glow.position.y = 1.15;
  group.add(glow);
  addContactShadow(group, textures.contactShadow, 0.75);
  return group;
}

// BABAK I: Kotak Musik Panggilan Ibu
export function createMusicBoxFragment(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const standPts = [
    new THREE.Vector2(0.32, 0),
    new THREE.Vector2(0.18, 0.18),
    new THREE.Vector2(0.14, 0.65),
    new THREE.Vector2(0.26, 0.75),
  ];
  const stand = new THREE.Mesh(
    new THREE.LatheGeometry(standPts, 20),
    new THREE.MeshStandardMaterial({
      map: textures.frostedWood,
      bumpMap: textures.frostedWoodBump,
      bumpScale: 0.015,
      color: 0x382820,
      roughness: 0.74,
    })
  );
  stand.castShadow = true;
  group.add(stand);

  const boxMat = new THREE.MeshStandardMaterial({ color: 0x5c3a28, roughness: 0.55 });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4a353,
    emissive: 0xb45309,
    emissiveIntensity: 0.45,
    roughness: 0.22,
    metalness: 0.88,
  });

  const floatGroup = new THREE.Group();
  floatGroup.position.y = 0.98;
  floatGroup.name = 'floatingArtifact';

  const baseBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.28), boxMat);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.28), boxMat);
  lid.position.set(0, 0.2, -0.13);
  lid.rotation.x = -Math.PI * 0.38;
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 16), brassMat);
  cylinder.rotation.z = Math.PI / 2;
  cylinder.position.y = 0.12;
  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    new THREE.MeshStandardMaterial({ color: 0xfde68a, emissive: 0xd97706, emissiveIntensity: 1.6 })
  );
  crystal.position.y = 0.28;

  floatGroup.add(baseBox, lid, cylinder, crystal);
  group.add(floatGroup);

  const glow = new THREE.PointLight(0xd4a353, 2.4, 6, 2);
  glow.position.y = 1.2;
  group.add(glow);

  addContactShadow(group, textures.contactShadow, 0.65);
  return group;
}

// BABAK I: Tembok Es Keheningan
export function createIceWallSeal(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const iceMat = new THREE.MeshPhysicalMaterial({
    map: textures.frostIce,
    bumpMap: textures.frostIceBump,
    bumpScale: 0.035,
    roughnessMap: textures.frostIceRough,
    color: 0x99cbe8,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.42,
    roughness: 0.15,
    metalness: 0.08,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1.0,
  });

  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 0.42), iceMat);
  slab.position.y = 1.7;
  group.add(slab);

  const spikeGeo = new THREE.ConeGeometry(0.32, 1.55, 6);
  for (let i = -3; i <= 3; i++) {
    const spike = new THREE.Mesh(spikeGeo, iceMat);
    spike.position.set(i * 0.46, 0.8 + Math.abs(i) * 0.12, (i % 2 === 0 ? 1 : -1) * 0.18);
    spike.rotation.z = i * 0.12;
    group.add(spike);
  }

  const light = new THREE.PointLight(0x78a9c4, 2.2, 7, 2);
  light.position.set(0, 1.7, 0.8);
  group.add(light);
  return group;
}

// BABAK II: Steel-Frame School Desk & Chair + Open Notebook, Pencil Case & Bag
export function createSchoolDeskAndChair(textures: ProceduralTextureBank, withProps = true): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.016,
    color: 0x614634,
    roughness: 0.72,
  });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.82 });

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.045, 0.56), woodMat);
  deskTop.position.y = 0.74;
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  group.add(deskTop);

  [
    [-0.36, -0.22],
    [0.36, -0.22],
    [-0.36, 0.22],
    [0.36, 0.22],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8), steelMat);
    leg.position.set(lx, 0.36, lz);
    group.add(leg);
  });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.42), woodMat);
  seat.position.set(0, 0.44, 0.52);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.035), woodMat);
  back.position.set(0, 0.72, 0.71);
  group.add(seat, back);

  if (withProps) {
    // Open notebook + pencil case on desk + school bag beside desk
    const nb = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.016, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    );
    nb.position.set(-0.14, 0.77, 0.04);
    nb.rotation.y = 0.12;
    const pCase = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.14, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x3f5e78, roughness: 0.7 })
    );
    pCase.rotation.z = Math.PI / 2;
    pCase.position.set(0.22, 0.785, -0.06);
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.32, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.82 })
    );
    bag.position.set(0.46, 0.16, 0.25);
    bag.rotation.z = -0.25;
    group.add(nb, pCase, bag);
  }

  addContactShadow(group, textures.contactShadow, 0.85);
  return group;
}

// BABAK II: Erratically Spinning Wall Clock
export function createWallClock(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.07, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.65 })
  );
  rim.rotation.x = Math.PI / 2;
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 24),
    new THREE.MeshStandardMaterial({ map: textures.clockFace, roughness: 0.4 })
  );
  face.position.z = 0.04;

  const hourHand = new THREE.Group();
  hourHand.position.z = 0.05;
  hourHand.name = 'clockHour';
  const hMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.14, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  hMesh.position.y = 0.06;
  hourHand.add(hMesh);

  const minHand = new THREE.Group();
  minHand.position.z = 0.055;
  minHand.name = 'clockMinute';
  const mMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.21, 0.01),
    new THREE.MeshBasicMaterial({ color: 0x991b1b })
  );
  mMesh.position.y = 0.095;
  minHand.add(mMesh);

  group.add(rim, face, hourHand, minHand);
  return group;
}

// BABAK II: Flickering Ceiling Fluorescent Tube Fixture
export function createFluorescentFixture(): { group: THREE.Group; light: THREE.PointLight; tubeMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.08, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 })
  );
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0xbae6fd,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.38, 10), tubeMat);
  tube.rotation.z = Math.PI / 2;
  tube.position.y = -0.05;

  const light = new THREE.PointLight(0xdbeafe, 2.2, 11, 2);
  light.position.y = -0.25;
  group.add(housing, tube, light);
  return { group, light, tubeMat };
}

// BABAK II: Giant Rotating Pointed Pencil
export function createGiantPencil(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodBodyMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.015,
    color: 0xb8860b,
    roughness: 0.52,
    metalness: 0.08,
  });
  const shavedMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.82 });
  const graphiteMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.78 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.9 });
  const eraserMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.85 });

  const pivot = new THREE.Group();
  pivot.position.y = 1.55;
  pivot.rotation.z = Math.PI / 2 - 0.14;
  pivot.name = 'giantPencilSpinner';

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 6), woodBodyMat);
  shaft.castShadow = true;
  const coneWood = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.78, 6), shavedMat);
  coneWood.position.y = 1.99;
  const lead = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.3, 12), graphiteMat);
  lead.position.y = 2.26;
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.34, 24), metalMat);
  ferrule.position.y = -1.77;
  const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.32, 24), eraserMat);
  eraser.position.y = -2.08;

  pivot.add(shaft, coneWood, lead, ferrule, eraser);
  group.add(pivot);

  const standPts = [
    new THREE.Vector2(0.45, 0),
    new THREE.Vector2(0.22, 0.25),
    new THREE.Vector2(0.16, 1.35),
  ];
  const stand = new THREE.Mesh(
    new THREE.LatheGeometry(standPts, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.3 })
  );
  group.add(stand);

  addContactShadow(group, textures.contactShadow, 1.45);
  return group;
}

// BABAK II: Double Wooden Ruang BK Door with Rusted 3D Iron Chain Links & Heavy Padlock
export function createChainedBKDoor(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const doorMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.02,
    color: 0x3b2a22,
    roughness: 0.72,
  });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x645448, roughness: 0.42, metalness: 0.82 });
  const lockMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    emissive: 0x7f1d1d,
    emissiveIntensity: 0.85,
    roughness: 0.3,
    metalness: 0.75,
  });

  const leafL = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.8, 0.14), doorMat);
  leafL.position.set(-0.58, 1.4, 0);
  const leafR = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.8, 0.14), doorMat);
  leafR.position.set(0.58, 1.4, 0);
  const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.18, 0.24), ironMat);
  frameTop.position.set(0, 2.88, 0);
  group.add(leafL, leafR, frameTop);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.56),
    new THREE.MeshStandardMaterial({ map: textures.bkSign, roughness: 0.4 })
  );
  signMesh.position.set(0, 2.25, 0.09);
  group.add(signMesh);

  const linkGeo = new THREE.TorusGeometry(0.085, 0.024, 8, 16);
  for (let i = -5; i <= 5; i++) {
    const linkA = new THREE.Mesh(linkGeo, ironMat);
    linkA.position.set(i * 0.19, 1.35 + i * 0.11, 0.11);
    linkA.rotation.y = i % 2 === 0 ? 0.3 : 1.2;
    const linkB = new THREE.Mesh(linkGeo, ironMat);
    linkB.position.set(i * 0.19, 1.35 - i * 0.11, 0.11);
    linkB.rotation.y = i % 2 === 0 ? 1.2 : 0.3;
    group.add(linkA, linkB);
  }

  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.024, 10, 18, Math.PI), ironMat);
  shackle.position.set(0, 1.48, 0.15);
  const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.12), lockMat);
  lockBody.position.set(0, 1.31, 0.15);
  group.add(shackle, lockBody);

  const pLight = new THREE.PointLight(0xc25959, 1.6, 5.5, 2);
  pLight.position.set(0, 1.75, 0.65);
  group.add(pLight);
  return group;
}

export function createPaperNoteFragment(textures: ProceduralTextureBank): THREE.Group {
  const group = createSchoolDeskAndChair(textures, false);
  const floatGroup = new THREE.Group();
  floatGroup.position.y = 1.06;
  floatGroup.name = 'floatingArtifact';

  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.34, 0.015),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0x78a9c4, emissiveIntensity: 1.1 })
  );
  paper.rotation.z = 0.14;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.012, 10, 28),
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, emissive: 0x0284c7, emissiveIntensity: 1.2 })
  );
  ring.rotation.x = Math.PI / 2;
  floatGroup.add(paper, ring);
  group.add(floatGroup);

  const glow = new THREE.PointLight(0x78a9c4, 2.1, 5.5, 2);
  glow.position.y = 1.2;
  group.add(glow);
  return group;
}

export function createBadgeFragment(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.34, 0.85, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.25 })
  );
  base.position.y = 0.425;
  group.add(base);

  const floatGroup = new THREE.Group();
  floatGroup.position.y = 1.15;
  floatGroup.name = 'floatingArtifact';

  const shield = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfde68a,
      emissive: 0xd4a353,
      emissiveIntensity: 1.35,
      roughness: 0.22,
      metalness: 0.85,
    })
  );
  floatGroup.add(shield);
  group.add(floatGroup);

  const glow = new THREE.PointLight(0xd4a353, 2.2, 5.5, 2);
  glow.position.y = 1.25;
  group.add(glow);
  addContactShadow(group, textures.contactShadow, 0.65);
  return group;
}

// BABAK III: Cracked Mirror Frame & Shattered Dressing Vanity
export function createCrackedMirrorFrame(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a201b, roughness: 0.6, metalness: 0.25 });
  const mirrorMat = new THREE.MeshPhysicalMaterial({
    map: textures.frostIce,
    bumpMap: textures.frostIceBump,
    bumpScale: 0.03,
    color: 0x94a3b8,
    roughness: 0.1,
    metalness: 0.88,
    clearcoat: 1.0,
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.95, 0.08), frameMat);
  frame.position.y = 1.5;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.76), mirrorMat);
  glass.position.set(0, 1.5, 0.045);
  group.add(frame, glass);
  return group;
}

export function createShatteredVanity(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.015,
    color: 0x3b2a22,
    roughness: 0.68,
  });
  const shardMat = new THREE.MeshPhysicalMaterial({
    color: 0xcbd5e1,
    roughness: 0.08,
    metalness: 0.85,
  });

  const table = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.78, 0.55), woodMat);
  table.position.y = 0.39;
  const mirrorBack = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.88, 0.06), woodMat);
  mirrorBack.position.set(0, 1.22, -0.22);
  const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.76), shardMat);
  mirrorGlass.position.set(0, 1.22, -0.185);
  group.add(table, mirrorBack, mirrorGlass);

  // Scattered mirror shards on vanity top
  for (let i = 0; i < 6; i++) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 3), shardMat);
    shard.rotation.set(Math.PI / 2, i * 1.1, 0);
    shard.position.set(-0.35 + i * 0.14, 0.79, (i % 2 === 0 ? 1 : -1) * 0.08);
    group.add(shard);
  }
  addContactShadow(group, textures.contactShadow, 0.9);
  return group;
}

// BABAK III: Floating Glitch Smartphone / KBGO Screen (with swappable Ambush Face mode)
export function createKbgoScreen(
  textures: ProceduralTextureBank,
  mode: 'A' | 'B' | 'ambush'
): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a1626, roughness: 0.34, metalness: 0.82 });
  const tex =
    mode === 'ambush'
      ? textures.glitchFaceScreen
      : mode === 'A'
        ? textures.kbgoScreenA
        : textures.kbgoScreenB;

  const screenMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: mode === 'ambush' ? 0x991b1b : 0x581c87,
    emissiveMap: tex,
    emissiveIntensity: mode === 'ambush' ? 1.55 : 1.05,
    roughness: 0.2,
  });

  const scale = mode === 'ambush' ? 1.45 : 1.0;
  const backing = new THREE.Mesh(new THREE.BoxGeometry(1.75 * scale, 1.12 * scale, 0.08), frameMat);
  backing.position.y = 1.75;
  const display = new THREE.Mesh(new THREE.PlaneGeometry(1.62 * scale, 1.0 * scale), screenMat);
  display.position.set(0, 1.75, 0.045);
  display.name = 'kbgoDisplayFront';
  const displayBack = new THREE.Mesh(new THREE.PlaneGeometry(1.62 * scale, 1.0 * scale), screenMat);
  displayBack.position.set(0, 1.75, -0.045);
  displayBack.rotation.y = Math.PI;
  group.add(backing, display, displayBack);

  const pLight = new THREE.PointLight(mode === 'ambush' ? 0xdc2626 : 0x9b6eaf, 1.8, 6.5, 2);
  pLight.position.set(0, 1.75, 0.35);
  pLight.name = 'kbgoLight';
  group.add(pLight);
  return group;
}

// BABAK III: Pulsing Blue Share-Loc Beacon with Floor Light Ripple
export function createShareLocBeacon(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 });
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x78a9c4,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    emissive: 0x0284c7,
    emissiveIntensity: 1.9,
    roughness: 0.15,
    metalness: 0.25,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.16, 16), baseMat);
  base.position.y = 0.08;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 5.2, 14), beamMat);
  beam.position.y = 2.6;

  const ripple = new THREE.Mesh(
    new THREE.RingGeometry(0.65, 0.82, 32),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  ripple.rotation.x = -Math.PI / 2;
  ripple.position.y = 0.03;
  ripple.name = 'beaconRipple';

  const floatGroup = new THREE.Group();
  floatGroup.position.y = 1.35;
  floatGroup.name = 'floatingArtifact';

  const pinCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 12), crystalMat);
  pinCone.rotation.x = Math.PI;
  pinCone.position.y = -0.15;
  const pinHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 1), crystalMat);
  pinHead.position.y = 0.14;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.018, 10, 28), crystalMat);
  ring.rotation.x = Math.PI / 2;

  floatGroup.add(pinCone, pinHead, ring);
  group.add(base, beam, ripple, floatGroup);

  const light = new THREE.PointLight(0x78a9c4, 2.8, 9, 2);
  light.position.y = 1.6;
  group.add(light);

  addContactShadow(group, textures.contactShadow, 0.85);
  return group;
}

// BABAK IV & CUTSCENE: Giant Frosted Glass Dome + Rindi + Erupting Thorn Tendrils
export function createGlassDomeWithRindi(
  textures: ProceduralTextureBank,
  isSoftwareGl: boolean
): {
  group: THREE.Group;
  domeMesh: THREE.Mesh;
  iceRibs: THREE.Group;
  tendrilGroup: THREE.Group;
  rindiRig: ArticulatedCharacterRig;
  domeLight: THREE.PointLight;
} {
  const group = new THREE.Group();
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.3 });
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.95, 0.28, 24), plinthMat);
  plinth.position.y = 0.14;
  plinth.receiveShadow = true;
  group.add(plinth);

  const rindiRig = createArticulatedPerson(textures, {
    role: 'rindi',
    jacketHex: 0xc4bdb2,
    pantsHex: 0x3b5470,
    skinHex: 0xd8b194,
    hairHex: 0x181412,
    withBackpack: false,
    withHijab: false,
    withPleatedSkirt: false,
  });
  rindiRig.root.position.set(0, 0.28, -0.05);
  group.add(rindiRig.root);

  // Sculpted frosted-ice seat plinth supporting Rindiani's seated posture inside the dome
  const iceSeatMat = new THREE.MeshStandardMaterial({
    map: textures.frostIce,
    bumpMap: textures.frostIceBump,
    bumpScale: 0.02,
    color: 0x93c5fd,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.35,
    roughness: 0.28,
    metalness: 0.15,
  });
  const iceSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.43, 10), iceSeatMat);
  iceSeat.position.set(0, 0.28 + 0.215, -0.06);
  iceSeat.receiveShadow = true;
  iceSeat.castShadow = true;
  group.add(iceSeat);

  const domeGeo = new THREE.SphereGeometry(2.28, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.56);
  const domeMat = new THREE.MeshPhysicalMaterial({
    map: textures.frostIce,
    bumpMap: textures.frostIceBump,
    bumpScale: 0.025,
    roughnessMap: textures.frostIceRough,
    color: 0xb8d8eb,
    emissive: 0x0c4a6e,
    emissiveIntensity: 0.25,
    roughness: 0.14,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.72,
    transparent: true,
    opacity: isSoftwareGl ? 0.44 : 0.68,
    clearcoat: 1.0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.position.y = 0.28;
  domeMesh.renderOrder = 6;
  group.add(domeMesh);

  const iceRibs = new THREE.Group();
  iceRibs.position.y = 0.28;
  const ribMat = new THREE.MeshStandardMaterial({
    map: textures.frostIce,
    bumpMap: textures.frostIceBump,
    bumpScale: 0.025,
    color: 0x93c5fd,
    emissive: 0x0369a1,
    emissiveIntensity: 0.65,
    roughness: 0.22,
    metalness: 0.2,
    transparent: true,
    opacity: 0.82,
  });
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.9, 6), ribMat);
    shard.position.set(Math.cos(angle) * 2.18, 0.85, Math.sin(angle) * 2.18);
    shard.lookAt(0, 2.2, 0);
    shard.rotateX(Math.PI / 2);
    iceRibs.add(shard);
  }
  group.add(iceRibs);

  // Dark Thorn Tendrils & Sharp Ice Spikes for Cutscene Shot 2
  const tendrilGroup = new THREE.Group();
  tendrilGroup.position.y = 0.28;
  tendrilGroup.scale.set(1, 0.01, 1);
  tendrilGroup.visible = false;
  const thornMat = new THREE.MeshStandardMaterial({
    map: textures.shadowAsphalt,
    bumpMap: textures.shadowAsphaltBump,
    bumpScale: 0.03,
    color: 0x0b0f17,
    roughness: 0.55,
    metalness: 0.25,
  });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const rad = 0.62 + (i % 3) * 0.22;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1.85 + (i % 3) * 0.35, 7), i % 2 === 0 ? thornMat : ribMat);
    spike.position.set(Math.cos(a) * rad, 0.72, Math.sin(a) * rad);
    spike.lookAt(0, 1.15, 0);
    spike.rotateX(Math.PI * 0.35);
    tendrilGroup.add(spike);
  }
  group.add(tendrilGroup);

  const domeLight = new THREE.PointLight(0x78a9c4, 2.6, 10, 2);
  domeLight.position.y = 1.75;
  group.add(domeLight);

  addContactShadow(group, textures.contactShadow, 3.0);
  return { group, domeMesh, iceRibs, tendrilGroup, rindiRig, domeLight };
}

// BABAK IV: Protection Pillar
export function createProtectionPillar(textures: ProceduralTextureBank, accentColorHex: number): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78, metalness: 0.12 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a353, roughness: 0.28, metalness: 0.85 });
  const coreMat = new THREE.MeshStandardMaterial({
    color: accentColorHex,
    emissive: accentColorHex,
    emissiveIntensity: 0.45,
    roughness: 0.2,
    metalness: 0.25,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.85), stoneMat);
  base.position.y = 0.14;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.35, 14), stoneMat);
  shaft.position.y = 0.95;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.14, 14), brassMat);
  collar.position.y = 1.66;

  const crystalGroup = new THREE.Group();
  crystalGroup.position.y = 2.08;
  crystalGroup.name = 'floatingArtifact';
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), coreMat);
  crystal.name = 'pillarCore';
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.02, 10, 28), brassMat);
  halo.rotation.x = Math.PI / 2;
  crystalGroup.add(crystal, halo);
  group.add(base, shaft, collar, crystalGroup);

  const pLight = new THREE.PointLight(accentColorHex, 1.6, 7.5, 2);
  pLight.position.y = 2.15;
  pLight.name = 'pillarLight';
  group.add(pLight);

  addContactShadow(group, textures.contactShadow, 0.85);
  return group;
}

// Hiding Wardrobe / Dented Metal Locker / Mirror Alcove with Hinged Opening Door Pivot
export function createHidingCloset(
  textures: ProceduralTextureBank,
  style: 'wood' | 'locker' | 'mirror'
): THREE.Group {
  const group = new THREE.Group();
  const color = style === 'wood' ? 0x3b2a22 : style === 'locker' ? 0x1e3240 : 0x1e1b2e;
  const trimColor = style === 'wood' ? 0xd4a353 : style === 'locker' ? 0x78a9c4 : 0x9b6eaf;

  const bodyMat = new THREE.MeshStandardMaterial({
    map: style === 'wood' ? textures.frostedWood : undefined,
    bumpMap: style === 'wood' ? textures.frostedWoodBump : textures.plasterWallBump,
    bumpScale: 0.018,
    color,
    roughness: 0.68,
    metalness: style === 'wood' ? 0.1 : 0.55,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    emissive: trimColor,
    emissiveIntensity: 0.38,
    roughness: 0.35,
    metalness: 0.55,
  });

  const shell = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.25, 0.9), bodyMat);
  shell.position.y = 1.125;
  shell.castShadow = true;

  const leftDoorPivot = new THREE.Group();
  leftDoorPivot.position.set(-0.53, 1.08, 0.46);
  leftDoorPivot.name = 'leftDoorPivot';
  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.08, 0.05), bodyMat);
  leftDoor.position.set(0.26, 0, 0);
  const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.05), trimMat);
  handleL.position.set(0.45, 0, 0.04);
  leftDoorPivot.add(leftDoor, handleL);

  const rightDoorPivot = new THREE.Group();
  rightDoorPivot.position.set(0.53, 1.08, 0.46);
  rightDoorPivot.name = 'rightDoorPivot';
  const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.08, 0.05), bodyMat);
  rightDoor.position.set(-0.26, 0, 0);
  const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.05), trimMat);
  handleR.position.set(-0.45, 0, 0.04);
  rightDoorPivot.add(rightDoor, handleR);

  group.add(shell, leftDoorPivot, rightDoorPivot);
  addContactShadow(group, textures.contactShadow, 0.9);
  return group;
}

// CUTSCENE SHOT 1: Bima's Dropped Cylindrical Metallic Flashlight
export function createDroppedFlashlight(): {
  group: THREE.Group;
  beamLight: THREE.SpotLight;
  lensMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.28, metalness: 0.88 });
  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfef3c7,
    emissiveIntensity: 2.0,
    roughness: 0.1,
  });

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.24, 16), metalMat);
  handle.rotation.z = Math.PI / 2;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.035, 0.07, 16), metalMat);
  head.rotation.z = Math.PI / 2;
  head.position.x = 0.14;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.042, 16), lensMat);
  lens.rotation.y = Math.PI / 2;
  lens.position.x = 0.176;

  const beamLight = new THREE.SpotLight(0xfef3c7, 6.0, 14, Math.PI / 4, 0.5, 1.4);
  beamLight.position.set(0.18, 0, 0);
  const target = new THREE.Object3D();
  target.position.set(4.5, -0.2, 0);
  beamLight.target = target;

  group.add(handle, head, lens, beamLight, target);
  return { group, beamLight, lensMat };
}

// EXPANDED ROOMS: Study / Archive Desk with Lamp & Stacked Books
export function createStudyDeskWithBooks(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.018,
    color: 0x4b3529,
    roughness: 0.72,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.75 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.86 });
  const folderMat = new THREE.MeshStandardMaterial({ color: 0x7c5338, roughness: 0.78 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.06, 0.75), woodMat);
  top.position.y = 0.76;
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  const drawerBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.68, 0.68), woodMat);
  drawerBox.position.set(0.46, 0.38, 0);
  drawerBox.castShadow = true;
  group.add(drawerBox);

  [
    [-0.64, -0.3],
    [-0.64, 0.3],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.74, 0.06), woodMat);
    leg.position.set(lx, 0.37, lz);
    group.add(leg);
  });

  // Stacked folders & notebooks
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.035, 0.22), i === 1 ? paperMat : folderMat);
    f.position.set(-0.35 + i * 0.02, 0.805 + i * 0.036, 0.05);
    f.rotation.y = (i - 1) * 0.16;
    group.add(f);
  }

  // Desk lamp silhouette
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.04, 12), metalMat);
  lampBase.position.set(0.42, 0.81, -0.18);
  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 8), metalMat);
  lampArm.position.set(0.42, 0.98, -0.18);
  lampArm.rotation.z = 0.22;
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.14, 12), metalMat);
  lampShade.position.set(0.35, 1.12, -0.18);
  lampShade.rotation.z = 0.45;
  group.add(lampBase, lampArm, lampShade);

  addContactShadow(group, textures.contactShadow, 0.95);
  return group;
}

// EXPANDED ROOMS: Storage Shelving Rack with Archive Boxes
export function createStorageRack(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x263241, roughness: 0.48, metalness: 0.72 });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.015,
    color: 0x563f31,
    roughness: 0.78,
  });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x756454, roughness: 0.88 });

  [
    [-0.68, -0.24],
    [0.68, -0.24],
    [-0.68, 0.24],
    [0.68, 0.24],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.05, 0.05), steelMat);
    post.position.set(px, 1.025, pz);
    group.add(post);
  });

  [0.24, 0.95, 1.68].forEach((sy, idx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.04, 0.54), woodMat);
    shelf.position.y = sy;
    shelf.receiveShadow = true;
    group.add(shelf);

    if (idx < 2) {
      const crateA = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.38), boxMat);
      crateA.position.set(-0.34, sy + 0.19, 0);
      crateA.rotation.y = 0.08 * (idx + 1);
      const crateB = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.36), woodMat);
      crateB.position.set(0.28, sy + 0.16, 0.02);
      crateB.rotation.y = -0.1;
      group.add(crateA, crateB);
    }
  });

  addContactShadow(group, textures.contactShadow, 0.9);
  return group;
}

// EXPANDED ROOMS: Tall 4-Drawer Steel Filing Cabinet
export function createFilingCabinet(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x24313f, roughness: 0.45, metalness: 0.65 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.48, 0.62), bodyMat);
  body.position.y = 0.74;
  body.castShadow = true;
  group.add(body);

  for (let i = 0; i < 4; i++) {
    const dy = 0.24 + i * 0.34;
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.28, 0.03), bodyMat);
    face.position.set(0, dy, 0.32);
    const pull = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.03), handleMat);
    pull.position.set(0, dy + 0.02, 0.345);
    group.add(face, pull);
  }

  addContactShadow(group, textures.contactShadow, 0.65);
  return group;
}

// EXPANDED ROOMS: Architectural Support Pillar / Column
export function createArchitecturalPillar(
  textures: ProceduralTextureBank,
  height: number,
  colorHex: number
): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    map: textures.plasterWall,
    bumpMap: textures.plasterWallBump,
    bumpScale: 0.02,
    color: colorHex,
    roughness: 0.82,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.28, 0.62), mat);
  base.position.y = 0.14;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.46, height - 0.52, 0.46), mat);
  shaft.position.y = 0.28 + (height - 0.52) / 2;
  shaft.castShadow = true;
  shaft.receiveShadow = true;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.62), mat);
  cap.position.y = height - 0.12;
  group.add(base, shaft, cap);
  return group;
}

// =========================================================================
// ENVIRONMENTAL STORYTELLING & PUZZLE PROPS
// =========================================================================

// Displaced / Fallen Wooden or School Chair showing abrupt disturbance
export function createFallenChair(
  textures: ProceduralTextureBank,
  style: 'wood' | 'school' = 'wood'
): THREE.Group {
  const group = new THREE.Group();
  const pivot = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    bumpMap: textures.frostedWoodBump,
    bumpScale: 0.015,
    color: style === 'wood' ? 0x5c4030 : 0x6b5642,
    roughness: 0.72,
  });
  const frameMat =
    style === 'school'
      ? new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.68 })
      : seatMat;

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.44), seatMat);
  seat.position.y = 0.44;
  seat.castShadow = true;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 0.04), seatMat);
  back.position.set(0, 0.68, -0.2);
  back.castShadow = true;
  pivot.add(seat, back);

  [
    [-0.19, -0.18],
    [0.19, -0.18],
    [-0.19, 0.18],
    [0.19, 0.18],
  ].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.04), frameMat);
    leg.position.set(lx, 0.22, lz);
    pivot.add(leg);
  });

  // Tipped onto its side naturally
  pivot.rotation.z = Math.PI * 0.46;
  pivot.position.set(0.22, 0.22, 0);
  group.add(pivot);
  addContactShadow(group, textures.contactShadow, 0.52);
  return group;
}

// Framed Family / Campus Photo (upright or tipped face-down)
export function createFramedPhoto(
  textures: ProceduralTextureBank,
  tipped = false
): THREE.Group {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x2c1e16, roughness: 0.65 });
  const picMat = new THREE.MeshStandardMaterial({
    map: textures.familyPhoto,
    roughness: 0.35,
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.03), frameMat);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), picMat);
  pic.position.z = 0.018;
  frame.add(pic);

  if (tipped) {
    frame.rotation.x = -Math.PI / 2 + 0.12;
    frame.position.y = 0.03;
  } else {
    frame.position.y = 0.16;
    frame.rotation.x = -0.15;
  }
  group.add(frame);
  return group;
}

// Inspectable Environmental Clue Prop (Pedestal/Table/Floor document with gentle cue orb)
export function createLoreClueProp(
  textures: ProceduralTextureBank,
  style: 'diary' | 'photo' | 'dossier' | 'flyer' | 'medical'
): THREE.Group {
  const group = new THREE.Group();
  const isStand = style === 'flyer';
  const pedMat = new THREE.MeshStandardMaterial({
    map: textures.frostedWood,
    color: 0x263140,
    roughness: 0.72,
  });

  let surfaceY = 0.82;
  if (isStand) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 0.14), pedMat);
    post.position.y = 0.575;
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.56, 0.06), pedMat);
    board.position.set(0, 1.25, 0);
    board.rotation.x = -0.18;
    group.add(post, board);
    surfaceY = 1.25;
  } else {
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.78, 12), pedMat);
    stand.position.y = 0.39;
    stand.castShadow = true;
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.05, 0.52), pedMat);
    top.position.y = 0.8;
    group.add(stand, top);
  }

  const mapTex =
    style === 'photo'
      ? textures.familyPhoto
      : style === 'medical'
        ? textures.medicineCalendar
        : style === 'dossier'
          ? textures.caseArchiveDoc
          : style === 'flyer'
            ? textures.memorialPoster
            : textures.chatPrintout;

  const docMat = new THREE.MeshStandardMaterial({
    map: mapTex,
    emissive: 0x3b2e1a,
    emissiveIntensity: 0.22,
    roughness: 0.58,
  });

  const docMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.28), docMat);
  if (isStand) {
    docMesh.rotation.x = Math.PI / 2 - 0.18;
    docMesh.position.set(0, 1.25, 0.045);
  } else {
    docMesh.position.set(0, surfaceY + 0.015, 0);
    docMesh.rotation.y = 0.14;
  }
  group.add(docMesh);

  const orbColor = style === 'dossier' || style === 'flyer' ? 0x78a9c4 : 0xd4a353;
  const orbMat = new THREE.MeshStandardMaterial({
    color: orbColor,
    emissive: orbColor,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), orbMat);
  orb.position.set(0, isStand ? 1.72 : 1.06, 0);
  orb.name = 'clueOrb';
  group.add(orb);

  const cLight = new THREE.PointLight(orbColor, 0.85, 3.8, 2);
  cLight.position.set(0, isStand ? 1.72 : 1.12, 0);
  cLight.name = 'clueLight';
  group.add(cLight);

  addContactShadow(group, textures.contactShadow, 0.55);
  return group;
}

// Babak I Puzzle Prop: Electrical Breaker Box
export function createBreakerBoxPuzzle(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2b3644,
    roughness: 0.42,
    metalness: 0.78,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    map: textures.fusePanelFace,
    emissive: 0x261d10,
    emissiveIntensity: 0.35,
    roughness: 0.5,
  });

  const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.0, 0.2), metalMat);
  post.position.y = 0.5;
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.86, 0.28), metalMat);
  cabinet.position.y = 1.28;
  cabinet.castShadow = true;

  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.72), faceMat);
  face.position.set(0, 1.28, 0.145);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xc25959,
    emissive: 0xc25959,
    emissiveIntensity: 1.8,
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), ledMat);
  led.position.set(0.22, 1.62, 0.16);
  led.name = 'puzzleLed';

  const pLight = new THREE.PointLight(0xd4a353, 1.35, 5.2, 2);
  pLight.position.set(0, 1.45, 0.35);
  pLight.name = 'puzzleLight';

  group.add(post, cabinet, face, led, pLight);
  addContactShadow(group, textures.contactShadow, 0.65);
  return group;
}

// Babak II & III Puzzle Prop: Keypad Safe / Decryptor Terminal Pedestal
export function createKeypadSafePuzzle(
  textures: ProceduralTextureBank,
  mode: 'safe' | 'terminal'
): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: mode === 'safe' ? 0x1f2b38 : 0x171d2e,
    roughness: 0.36,
    metalness: 0.78,
  });
  const screenTex = mode === 'safe' ? textures.caseArchiveDoc : textures.chatPrintout;
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissive: mode === 'safe' ? 0x2c2012 : 0x162b42,
    emissiveIntensity: mode === 'safe' ? 0.35 : 0.7,
    roughness: 0.25,
  });

  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.96, 0.54), bodyMat);
  ped.position.y = 0.48;
  ped.castShadow = true;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.56, 0.48), bodyMat);
  head.position.y = 1.2;
  head.castShadow = true;

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.34), screenMat);
  screen.position.set(0, 1.24, 0.246);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xc25959,
    emissive: 0xc25959,
    emissiveIntensity: 1.9,
  });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), ledMat);
  led.position.set(0.24, 1.42, 0.255);
  led.name = 'puzzleLed';

  const pLight = new THREE.PointLight(mode === 'safe' ? 0xd4a353 : 0x78a9c4, 1.5, 5.5, 2);
  pLight.position.set(0, 1.4, 0.48);
  pLight.name = 'puzzleLight';

  group.add(ped, head, screen, led, pLight);
  addContactShadow(group, textures.contactShadow, 0.72);
  return group;
}

// Babak IV Puzzle Prop: Campus Satgas PPKS Protocol Terminal
export function createSatgasTerminalPuzzle(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75, metalness: 0.18 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a353, roughness: 0.28, metalness: 0.85 });
  const panelMat = new THREE.MeshStandardMaterial({
    map: textures.memorialPoster,
    emissive: 0x1f364d,
    emissiveIntensity: 0.65,
    roughness: 0.28,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 0.74), stoneMat);
  base.position.y = 0.12;
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.05, 0.44), stoneMat);
  col.position.y = 0.75;
  col.castShadow = true;

  const consoleTop = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.14, 0.56), brassMat);
  consoleTop.position.y = 1.28;
  consoleTop.rotation.x = 0.34;

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), panelMat);
  panel.position.set(0, 1.36, 0.02);
  panel.rotation.x = -Math.PI / 2 + 0.34;

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x78a9c4,
    emissive: 0x78a9c4,
    emissiveIntensity: 1.8,
  });
  const led = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), ledMat);
  led.position.set(0, 1.72, 0);
  led.name = 'puzzleLed';

  const pLight = new THREE.PointLight(0x78a9c4, 1.9, 7.0, 2);
  pLight.position.set(0, 1.8, 0.25);
  pLight.name = 'puzzleLight';

  group.add(base, col, consoleTop, panel, led, pLight);
  addContactShadow(group, textures.contactShadow, 0.85);
  return group;
}

// Memorial Candles & Yellow Solidarity Ribbon Cluster (Babak IV)
export function createMemorialCandles(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.6 });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.4,
  });

  [
    [-0.14, 0.08, 0.16],
    [0.05, -0.06, 0.22],
    [0.18, 0.1, 0.12],
  ].forEach(([cx, cz, h]) => {
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, h, 10), waxMat);
    wax.position.set(cx, h / 2, cz);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 8), flameMat);
    flame.position.set(cx, h + 0.035, cz);
    group.add(wax, flame);
  });

  const cLight = new THREE.PointLight(0xfbbf24, 1.15, 4.5, 2);
  cLight.position.set(0, 0.35, 0);
  group.add(cLight);
  addContactShadow(group, textures.contactShadow, 0.45);
  return group;
}

// Non-colliding scattered floor papers for abandoned / chaotic rooms
export function createScatteredPapers(textures: ProceduralTextureBank): THREE.Group {
  const group = new THREE.Group();
  const paperMat = new THREE.MeshStandardMaterial({
    map: textures.caseArchiveDoc,
    color: 0xd8dee9,
    roughness: 0.88,
  });

  for (let i = 0; i < 4; i++) {
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.008, 0.32), paperMat);
    sheet.position.set((i - 1.5) * 0.28 + Math.sin(i * 2.1) * 0.1, 0.012 + i * 0.002, Math.cos(i * 1.7) * 0.24);
    sheet.rotation.y = i * 0.68;
    group.add(sheet);
  }
  return group;
}


