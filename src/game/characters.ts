import * as THREE from 'three';
import { ProceduralTextureBank } from './textures';

export interface ArticulatedCharacterRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  chestMesh: THREE.Mesh;
  shoulders: THREE.Group;
  head: THREE.Group;
  leftEyelid?: THREE.Mesh;
  rightEyelid?: THREE.Mesh;
  clothStrands: THREE.Object3D[];
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftForearm?: THREE.Group;
  rightForearm?: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftKnee?: THREE.Group;
  rightKnee?: THREE.Group;
  maskAnchor?: THREE.Object3D;
  distortionCloud?: THREE.Points;
  auraLight?: THREE.PointLight;
}

function addShadowDisc(parent: THREE.Group, tex: THREE.CanvasTexture, radius = 0.6): void {
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
    })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.015;
  parent.add(plane);
}

/**
 * Deforms a high-segment sphere into an anatomical human cranium + jawline + cheekbones + eye hollows.
 */
function createSculptedHeadGeometry(gauntFactor = 0): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.114, 28, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Subtle vertical cranial elongation
    y *= 1.1;

    // Narrow temple/jaw width subtly
    x *= 0.88;

    // Lower face -> taper toward jawline & chin
    if (y < 0.0) {
      const jawT = Math.min(1, Math.abs(y) / 0.125);
      x *= 1 - jawT * (0.28 + gauntFactor * 0.14);
      if (z > 0) {
        // Project chin forward slightly and narrow at tip
        z += Math.max(0, 0.014 * (1 - Math.abs(x) / 0.08)) * (1 - jawT * 0.35);
      } else {
        // Taper back of jaw cleanly toward neck
        z *= 1 - jawT * 0.25;
      }
    }

    // Cheekbone fullness & slight cheek hollow beneath (stronger on gaunt entity)
    if (z > 0.02 && y > -0.045 && y < 0.03) {
      const cheekSide = Math.exp(-Math.pow((Math.abs(x) - 0.056) / 0.025, 2));
      if (y > -0.005) {
        z += cheekSide * (0.008 + gauntFactor * 0.007);
      } else {
        z -= cheekSide * (0.004 + gauntFactor * 0.016);
      }
    }

    // Recessed eye sockets
    if (z > 0.065 && y > -0.002 && y < 0.036) {
      const eyeMask = Math.exp(-Math.pow((Math.abs(x) - 0.036) / 0.018, 2));
      const eyeYMask = Math.exp(-Math.pow((y - 0.016) / 0.014, 2));
      z -= eyeMask * eyeYMask * (0.012 + gauntFactor * 0.012);
    }

    // Subtle brow ridge overhang
    if (z > 0.065 && y >= 0.032 && y < 0.058) {
      const browMask = Math.exp(-Math.pow(x / 0.065, 2));
      z += browMask * (0.007 + gauntFactor * 0.008);
    }

    // Rounded occipital back of skull
    if (z < -0.02 && y > 0.0) {
      z -= 0.01;
    }

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function addEarsAndNose(
  head: THREE.Group,
  skinMat: THREE.Material,
  gauntFactor = 0
): void {
  // Sculpted ears tucked gently at temples
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.022, 4, 8), skinMat);
    ear.scale.set(0.48, 1.0, 0.72);
    ear.position.set(side * 0.098, 0.165, -0.006);
    ear.rotation.z = side * -0.14;
    ear.rotation.y = side * 0.25;
    head.add(ear);
  });

  // Multi-part contoured nose (bridge + tip + subtle nostrils)
  const bridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.032, 4, 8), skinMat);
  bridge.scale.set(0.85, 1.0, 1.15);
  bridge.rotation.x = -0.34;
  bridge.position.set(0, 0.168, 0.106);

  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0105 - gauntFactor * 0.002, 10, 8), skinMat);
  tip.scale.set(1.05, 0.82, 1.05);
  tip.position.set(0, 0.15, 0.118);

  head.add(bridge, tip);
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 6), skinMat);
    wing.position.set(side * 0.009, 0.147, 0.112);
    head.add(wing);
  });
}

function addNaturalMouth(
  head: THREE.Group,
  lipHex: number,
  feminine: boolean
): void {
  const lipMat = new THREE.MeshStandardMaterial({
    color: lipHex,
    roughness: 0.42,
    metalness: 0.02,
  });
  const w = feminine ? 0.021 : 0.023;
  const upperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w, 0.117, 0.106),
    new THREE.Vector3(-w * 0.35, 0.12, 0.114),
    new THREE.Vector3(0, 0.1185, 0.115),
    new THREE.Vector3(w * 0.35, 0.12, 0.114),
    new THREE.Vector3(w, 0.117, 0.106),
  ]);
  const upperLip = new THREE.Mesh(new THREE.TubeGeometry(upperCurve, 12, 0.0038, 6, false), lipMat);

  const lowerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-w * 0.85, 0.115, 0.107),
    new THREE.Vector3(0, 0.111, 0.114),
    new THREE.Vector3(w * 0.85, 0.115, 0.107),
  ]);
  const lowerLip = new THREE.Mesh(
    new THREE.TubeGeometry(lowerCurve, 10, feminine ? 0.0044 : 0.004, 6, false),
    lipMat
  );
  head.add(upperLip, lowerLip);
}

function addArticulatedHand(
  parent: THREE.Group,
  skinMat: THREE.Material,
  side: number,
  options: { slim?: boolean; clawLen?: number; nailMat?: THREE.Material } = {}
): void {
  const slim = options.slim ?? false;
  const clawLen = options.clawLen ?? 0;

  const palm = new THREE.Mesh(
    new THREE.CapsuleGeometry(slim ? 0.015 : 0.018, 0.032, 4, 10),
    skinMat
  );
  palm.scale.set(0.65, 1.0, 1.35);
  palm.castShadow = true;
  parent.add(palm);

  for (let f = 0; f < 4; f++) {
    const len = (f === 1 || f === 2 ? 0.034 : 0.029) + clawLen;
    const finger = new THREE.Mesh(
      new THREE.CapsuleGeometry(slim ? 0.0042 : 0.0048, len, 4, 6),
      skinMat
    );
    finger.position.set(0, -0.026 - len * 0.45, -0.015 + f * 0.01);
    finger.rotation.z = side * 0.08;
    finger.rotation.x = clawLen > 0 ? 0.18 : 0.08;
    parent.add(finger);

    if (options.nailMat) {
      const nail = new THREE.Mesh(new THREE.ConeGeometry(0.0032, 0.016, 5), options.nailMat);
      nail.position.set(0, -0.026 - len * 0.98, -0.015 + f * 0.01);
      nail.rotation.x = Math.PI + 0.22;
      parent.add(nail);
    }
  }

  const thumbLen = 0.022 + clawLen * 0.5;
  const thumb = new THREE.Mesh(
    new THREE.CapsuleGeometry(slim ? 0.0046 : 0.0052, thumbLen, 4, 6),
    skinMat
  );
  thumb.position.set(-side * 0.012, -0.012, 0.022);
  thumb.rotation.x = 0.52;
  thumb.rotation.z = side * 0.25;
  parent.add(thumb);
}

function addSneakerShoe(
  parent: THREE.Group,
  upperHex: number,
  soleHex: number,
  accentHex: number,
  scaleX = 1.0,
  scaleZ = 1.0
): void {
  const shoeGrp = new THREE.Group();
  const upperMat = new THREE.MeshStandardMaterial({ color: upperHex, roughness: 0.58, metalness: 0.05 });
  const soleMat = new THREE.MeshStandardMaterial({ color: soleHex, roughness: 0.78, metalness: 0.04 });
  const accMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.65 });

  // Sculpted sneaker sole
  const sole = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.115, 6, 12), soleMat);
  sole.rotation.x = Math.PI / 2;
  sole.scale.set(1.06 * scaleX, 1.05 * scaleZ, 0.36);
  sole.position.set(0, -0.048, 0.035);
  sole.castShadow = true;

  // Sculpted shoe upper & rounded toe box
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.039, 0.098, 6, 12), upperMat);
  upper.rotation.x = Math.PI / 2;
  upper.scale.set(0.98 * scaleX, 1.0 * scaleZ, 0.72);
  upper.position.set(0, -0.024, 0.032);
  upper.castShadow = true;

  const heel = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.039, 0.045, 14), accMat);
  heel.scale.set(scaleX, 1, 0.92);
  heel.position.set(0, -0.014, -0.018);

  // Subtle tongue & lace bars
  for (let l = 0; l < 3; l++) {
    const lace = new THREE.Mesh(new THREE.CapsuleGeometry(0.0035, 0.026, 4, 6), soleMat);
    lace.rotation.z = Math.PI / 2;
    lace.position.set(0, 0.005 - l * 0.003, 0.022 + l * 0.022);
    shoeGrp.add(lace);
  }

  shoeGrp.add(sole, upper, heel);
  parent.add(shoeGrp);
}

/**
 * Builds an anatomically sculpted, layered character matching reference sheets:
 * - role === 'rindi': Design_Wanita_1fa0a990.jpeg (Oatmeal unzipped hoodie, white tee, wide blue jeans, cream tote bag, long tousled dark hair)
 * - role === 'bima': Design_Pria_d5160912.jpeg (Navy collared jacket w/ university crest, white tee, black cargo pants, black backpack, wristwatch, wavy curtain hair)
 * - role === 'mannequin': Sculpted anatomical mannequin for Babak II classroom
 */
export function createArticulatedPerson(
  textures: ProceduralTextureBank,
  opts: {
    role: 'rindi' | 'bima' | 'mannequin';
    jacketHex: number;
    pantsHex: number;
    skinHex: number;
    hairHex: number;
    withBackpack?: boolean;
    withHijab?: boolean;
    withPleatedSkirt?: boolean;
  }
): ArticulatedCharacterRig {
  const root = new THREE.Group();
  const clothStrands: THREE.Object3D[] = [];

  const isRindi = opts.role === 'rindi';
  const isBima = opts.role === 'bima';
  const isMannequin = opts.role === 'mannequin';

  // Proportional height matching JPEGs (~162 cm Rindi, ~175 cm Bima)
  const heightScale = isRindi ? 0.94 : 1.0;

  const skinMat = new THREE.MeshStandardMaterial({
    color: opts.skinHex,
    roughness: isMannequin ? 0.42 : 0.56,
    metalness: 0.02,
  });

  const jacketMat = new THREE.MeshStandardMaterial({
    color: isRindi ? 0xffffff : opts.jacketHex,
    map: isRindi ? textures.hoodieWeave : textures.fabricWeave,
    bumpMap: isRindi ? textures.hoodieBump : textures.fabricBump,
    bumpScale: 0.012,
    roughnessMap: textures.fabricRough,
    roughness: isRindi ? 0.86 : 0.78,
    metalness: 0.04,
  });

  const innerShirtMat = new THREE.MeshStandardMaterial({
    color: isMannequin ? 0xcbd5e1 : 0xedf1f6,
    map: textures.fabricWeave,
    roughness: 0.72,
    metalness: 0.02,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: isRindi ? 0xffffff : opts.pantsHex,
    map: isRindi ? textures.denimWeave : textures.fabricWeave,
    bumpMap: isRindi ? textures.denimBump : textures.fabricBump,
    bumpScale: 0.012,
    roughness: isRindi ? 0.84 : 0.86,
    metalness: 0.03,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: opts.hairHex,
    roughness: 0.52,
    metalness: 0.06,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xc8d2de,
    roughness: 0.28,
    metalness: 0.85,
  });

  const bodyRoot = new THREE.Group();
  bodyRoot.scale.setScalar(heightScale);
  root.add(bodyRoot);

  // Hips / Pelvis pivot (y = 0.90 grounded)
  const hips = new THREE.Group();
  hips.position.y = 0.9;
  bodyRoot.add(hips);

  const pelvisWidth = isRindi ? 0.98 : 0.96;
  const pelvisProfile = [
    new THREE.Vector2(0.124, -0.07),
    new THREE.Vector2(0.146, 0.0),
    new THREE.Vector2(0.132, 0.085),
  ];
  const pelvis = new THREE.Mesh(new THREE.LatheGeometry(pelvisProfile, 26), pantsMat);
  pelvis.scale.set(pelvisWidth, 1.0, 0.76);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Waistband / Belt contour
  const waistBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.131, 0.134, 0.036, 24),
    isRindi ? pantsMat : new THREE.MeshStandardMaterial({ color: 0x11151c, roughness: 0.55 })
  );
  waistBand.scale.set(pelvisWidth, 1.0, 0.77);
  waistBand.position.y = 0.075;
  hips.add(waistBand);

  // Optional pleated skirt if explicitly requested for mannequin variation
  if (isMannequin && opts.withPleatedSkirt) {
    const skirtPts = [
      new THREE.Vector2(0.14, 0.05),
      new THREE.Vector2(0.2, -0.14),
      new THREE.Vector2(0.24, -0.35),
    ];
    const skirt = new THREE.Mesh(new THREE.LatheGeometry(skirtPts, 24), pantsMat);
    skirt.castShadow = true;
    hips.add(skirt);
  }

  // Torso (Anatomical inner shirt + open outer jacket panels)
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  const innerPts = isRindi
    ? [
        new THREE.Vector2(0.114, 0.0),
        new THREE.Vector2(0.106, 0.14),
        new THREE.Vector2(0.136, 0.29),
        new THREE.Vector2(0.138, 0.39),
        new THREE.Vector2(0.088, 0.45),
      ]
    : [
        new THREE.Vector2(0.124, -0.02),
        new THREE.Vector2(0.122, 0.14),
        new THREE.Vector2(0.156, 0.31),
        new THREE.Vector2(0.162, 0.41),
        new THREE.Vector2(0.1, 0.47),
      ];

  const chestMesh = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 28), innerShirtMat);
  chestMesh.scale.set(1.04, 1.0, 0.78);
  chestMesh.castShadow = true;
  chestMesh.receiveShadow = true;
  torso.add(chestMesh);

  // Open outer jacket shell (leaves front center open showing white t-shirt!)
  const jacketPts = isRindi
    ? [
        new THREE.Vector2(0.132, -0.04),
        new THREE.Vector2(0.13, 0.12),
        new THREE.Vector2(0.154, 0.29),
        new THREE.Vector2(0.156, 0.4),
        new THREE.Vector2(0.104, 0.46),
      ]
    : [
        new THREE.Vector2(0.134, 0.01),
        new THREE.Vector2(0.134, 0.14),
        new THREE.Vector2(0.168, 0.31),
        new THREE.Vector2(0.174, 0.42),
        new THREE.Vector2(0.11, 0.475),
      ];

  // Open front arc (~290 degrees wrapping back & sides, leaving ~70 deg front center gap!)
  const openGap = isRindi ? 0.56 : 0.6;
  const jacketShell = new THREE.Mesh(
    new THREE.LatheGeometry(jacketPts, 28, openGap, Math.PI * 2 - openGap * 2),
    jacketMat
  );
  jacketShell.scale.set(1.05, 1.0, 0.8);
  jacketShell.castShadow = true;
  jacketShell.receiveShadow = true;
  torso.add(jacketShell);

  // Open front jacket edge folds & metallic zipper tracks
  [-1, 1].forEach((side) => {
    const fold = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.39, 4, 8), jacketMat);
    fold.position.set(side * 0.056, 0.21, 0.108);
    fold.rotation.z = side * -0.05;
    torso.add(fold);

    const zip = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.4, 0.008), metalMat);
    zip.position.set(side * 0.046, 0.21, 0.114);
    zip.rotation.z = side * -0.05;
    torso.add(zip);
  });

  if (isRindi) {
    // Hoodie kangaroo pocket halves + bottom ribbed hem + chest drawstrings
    [-1, 1].forEach((side) => {
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.11, 0.018), jacketMat);
      pocket.position.set(side * 0.086, 0.065, 0.104);
      pocket.rotation.y = side * 0.38;
      torso.add(pocket);
    });
    const ribHem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.132, 0.128, 0.042, 24, 1, true, openGap, Math.PI * 2 - openGap * 2),
      jacketMat
    );
    ribHem.scale.set(1.05, 1, 0.8);
    ribHem.position.y = -0.022;
    torso.add(ribHem);
  } else if (isBima) {
    // Bima's left-chest university emblem + "UNIVERSITAS" text
    const crestMat = new THREE.MeshStandardMaterial({
      map: textures.bimaCrest,
      roughness: 0.72,
      metalness: 0.05,
    });
    const crest = new THREE.Mesh(new THREE.PlaneGeometry(0.052, 0.052), crestMat);
    crest.position.set(0.095, 0.315, 0.118);
    crest.rotation.y = 0.52;
    torso.add(crest);
  }

  // Shoulders pivot (supports cold shivering micro-animation)
  const shoulders = new THREE.Group();
  shoulders.position.y = 0.42;
  torso.add(shoulders);

  // Garment neck detail: Rindiani draped hoodie + drawstrings vs Bima fold-down jacket collar
  if (isRindi) {
    const hoodCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.075, 0.02, 0.06),
      new THREE.Vector3(-0.105, 0.04, -0.02),
      new THREE.Vector3(0, 0.055, -0.095),
      new THREE.Vector3(0.105, 0.04, -0.02),
      new THREE.Vector3(0.075, 0.02, 0.06),
    ]);
    const drapedHood = new THREE.Mesh(new THREE.TubeGeometry(hoodCurve, 18, 0.036, 10, false), jacketMat);
    drapedHood.castShadow = true;
    shoulders.add(drapedHood);

    // Soft white hoodie drawstrings hanging on front chest
    const cordMat = new THREE.MeshStandardMaterial({ color: 0xedeae4, roughness: 0.75 });
    [-1, 1].forEach((side) => {
      const cordCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.042, 0.03, 0.085),
        new THREE.Vector3(side * 0.046, -0.05, 0.118),
        new THREE.Vector3(side * 0.042, -0.14, 0.115),
      ]);
      const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 8, 0.0042, 6, false), cordMat);
      shoulders.add(cord);
      clothStrands.push(cord);
    });
  } else if (isBima) {
    // Crisp fold-down navy jacket collar flaps
    [-1, 1].forEach((side) => {
      const collarFlap = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.052, 0.018), jacketMat);
      collarFlap.position.set(side * 0.062, 0.036, 0.055);
      collarFlap.rotation.y = side * -0.45;
      collarFlap.rotation.x = 0.55;
      collarFlap.rotation.z = side * -0.22;
      shoulders.add(collarFlap);
    });
    const backCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.078, 0.048, 16, 1, true, Math.PI * 0.55, Math.PI * 0.9),
      jacketMat
    );
    backCollar.position.set(0, 0.045, -0.005);
    shoulders.add(backCollar);
  }

  // Accessories matching JPEGs
  if (isRindi) {
    // Cream/Canvas Tote Bag slung over her left shoulder (+X in +Z-facing space), resting beside left hip
    const toteMat = new THREE.MeshStandardMaterial({
      color: 0xd8d2c5,
      map: textures.fabricWeave,
      bumpMap: textures.fabricBump,
      bumpScale: 0.01,
      roughness: 0.85,
    });
    const strapCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.115, 0.045, 0.04),
      new THREE.Vector3(0.145, -0.06, 0.07),
      new THREE.Vector3(0.175, -0.24, 0.02),
      new THREE.Vector3(0.175, -0.27, -0.07),
      new THREE.Vector3(0.14, -0.04, -0.07),
      new THREE.Vector3(0.108, 0.045, -0.01),
    ]);
    const toteStrap = new THREE.Mesh(new THREE.TubeGeometry(strapCurve, 16, 0.011, 6, false), toteMat);
    toteStrap.castShadow = true;
    shoulders.add(toteStrap);

    const toteBody = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.25, 0.21), toteMat);
    toteBody.scale.set(0.84, 1.0, 1.0);
    toteBody.position.set(0.18, -0.38, -0.03);
    toteBody.rotation.z = 0.08;
    toteBody.castShadow = true;
    shoulders.add(toteBody);
  } else if (isBima && opts.withBackpack) {
    // Matte Black Backpack + Front Shoulder Straps (Design_Pria_d5160912.jpeg)
    const packMat = new THREE.MeshStandardMaterial({
      color: 0x16181d,
      map: textures.fabricWeave,
      bumpMap: textures.fabricBump,
      bumpScale: 0.012,
      roughness: 0.76,
      metalness: 0.06,
    });
    const packGrp = new THREE.Group();
    packGrp.position.set(0, 0.22, -0.175);

    const mainPack = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.16, 6, 16), packMat);
    mainPack.scale.set(1.1, 1.05, 0.62);
    mainPack.castShadow = true;

    const frontPouch = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.15, 0.055), packMat);
    frontPouch.position.set(0, -0.075, -0.075);

    const topLoop = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 6, 12, Math.PI), packMat);
    topLoop.position.set(0, 0.19, 0.01);

    packGrp.add(mainPack, frontPouch, topLoop);
    torso.add(packGrp);

    // Curved padded shoulder straps wrapping over front shoulders
    [-1, 1].forEach((side) => {
      const sCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.09, -0.02, -0.11),
        new THREE.Vector3(side * 0.115, 0.05, 0.01),
        new THREE.Vector3(side * 0.11, -0.08, 0.11),
        new THREE.Vector3(side * 0.135, -0.26, 0.08),
        new THREE.Vector3(side * 0.135, -0.31, -0.08),
      ]);
      const strap = new THREE.Mesh(new THREE.TubeGeometry(sCurve, 14, 0.014, 6, false), packMat);
      strap.castShadow = true;
      shoulders.add(strap);
    });
  }

  // Head & Sculpted Facial Anatomy
  const head = new THREE.Group();
  head.position.y = 0.055;
  shoulders.add(head);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(isRindi ? 0.041 : 0.048, isRindi ? 0.048 : 0.055, 0.105, 18),
    skinMat
  );
  neck.position.y = 0.038;
  neck.castShadow = true;
  head.add(neck);

  const cranium = new THREE.Mesh(createSculptedHeadGeometry(0), skinMat);
  cranium.position.y = 0.175;
  cranium.castShadow = true;
  head.add(cranium);

  addEarsAndNose(head, skinMat, 0);

  let leftEyelid: THREE.Mesh | undefined;
  let rightEyelid: THREE.Mesh | undefined;

  if (!isMannequin) {
    addNaturalMouth(head, isRindi ? 0xa36b6d : 0x93625c, isRindi);

    // Expressive eyebrows
    const browMat = new THREE.MeshStandardMaterial({ color: opts.hairHex, roughness: 0.78 });
    [-1, 1].forEach((side) => {
      const browCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.018, 0.205 + (isRindi ? 0.002 : 0), 0.098),
        new THREE.Vector3(side * 0.036, 0.21, 0.102),
        new THREE.Vector3(side * 0.052, 0.203, 0.092),
      ]);
      const brow = new THREE.Mesh(
        new THREE.TubeGeometry(browCurve, 8, isRindi ? 0.0028 : 0.0038, 6, false),
        browMat
      );
      head.add(brow);
    });

    // Subtle dark undereye fatigue shadow for Rindiani
    if (isRindi) {
      const fatigueMat = new THREE.MeshStandardMaterial({
        color: 0x8b6764,
        roughness: 0.7,
        transparent: true,
        opacity: 0.35,
      });
      [-1, 1].forEach((side) => {
        const shade = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), fatigueMat);
        shade.scale.set(1.2, 0.45, 0.4);
        shade.position.set(side * 0.036, 0.177, 0.096);
        head.add(shade);
      });
    }

    // Specular eyeballs + animatable eyelids
    const scleraMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.14 });
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x241712,
      roughness: 0.08,
      metalness: 0.12,
    });
    const speckMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const buildEye = (side: number) => {
      const eyeGrp = new THREE.Group();
      eyeGrp.position.set(side * 0.035, 0.188, 0.092);

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.014, 14, 12), scleraMat);
      sclera.scale.set(1.1, 0.85, 0.72);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 12, 10), irisMat);
      iris.position.set(0, 0, 0.0072);
      const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0024, 6, 6), speckMat);
      glint.position.set(0.0025, 0.0028, 0.014);

      const lid = new THREE.Mesh(
        new THREE.SphereGeometry(0.0155, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
        skinMat
      );
      lid.rotation.x = -0.22;
      lid.scale.set(1.16, 0.24, 0.82);
      lid.position.set(0, 0.0035, 0.001);

      eyeGrp.add(sclera, iris, glint, lid);
      head.add(eyeGrp);
      return lid;
    };

    leftEyelid = buildEye(-1);
    rightEyelid = buildEye(1);
  }

  // Sculpted Hair Volume & Strands
  if (isRindi) {
    // Crown shell + long layered back hair + face-framing slightly messy curtain bangs (Design_Wanita_1fa0a990.jpeg)
    const hairCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.119, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hairCrown.scale.set(0.94, 1.08, 1.0);
    hairCrown.position.set(0, 0.188, -0.015);
    hairCrown.rotation.x = -0.26;
    hairCrown.castShadow = true;
    head.add(hairCrown);

    // Cascading back hair locks down past shoulder blades
    for (let s = -4; s <= 4; s++) {
      const ang = s * 0.25;
      const rx = Math.sin(ang) * 0.105;
      const rz = -Math.cos(ang) * 0.105 - 0.008;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx * 0.85, 0.24, rz * 0.85),
        new THREE.Vector3(rx * 1.1, 0.11, rz * 1.15),
        new THREE.Vector3(rx * 1.16, -0.05, rz * 1.25),
        new THREE.Vector3(rx * 1.05, -0.2, rz * 1.12),
      ]);
      const lock = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.028, 7, false), hairMat);
      lock.castShadow = true;
      head.add(lock);
      clothStrands.push(lock);
    }

    // Face-framing tousled wisps curving past temples & cheekbones
    [-1, 1].forEach((side) => {
      const wisp1 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.012, 0.295, 0.04),
        new THREE.Vector3(side * 0.068, 0.235, 0.095),
        new THREE.Vector3(side * 0.088, 0.155, 0.098),
        new THREE.Vector3(side * 0.072, 0.065, 0.075),
      ]);
      const mesh1 = new THREE.Mesh(new THREE.TubeGeometry(wisp1, 10, 0.013, 6, false), hairMat);
      head.add(mesh1);
      clothStrands.push(mesh1);

      const wisp2 = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 0.025, 0.29, 0.02),
        new THREE.Vector3(side * 0.096, 0.215, 0.045),
        new THREE.Vector3(side * 0.108, 0.11, 0.05),
        new THREE.Vector3(side * 0.092, -0.03, 0.055),
      ]);
      const mesh2 = new THREE.Mesh(new THREE.TubeGeometry(wisp2, 10, 0.016, 6, false), hairMat);
      head.add(mesh2);
      clothStrands.push(mesh2);
    });
  } else if (isBima) {
    // Voluminous wavy black middle-parted curtain hair (Design_Pria_d5160912.jpeg)
    const hairCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.123, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    hairCrown.scale.set(0.98, 1.06, 1.04);
    hairCrown.position.set(0, 0.194, -0.018);
    hairCrown.rotation.x = -0.34;
    hairCrown.castShadow = true;
    head.add(hairCrown);

    // Thick wavy middle-parted bangs framing both sides of forehead
    [-1, 1].forEach((side) => {
      for (let k = 0; k < 3; k++) {
        const wave = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * (0.008 + k * 0.018), 0.302 - k * 0.008, 0.048),
          new THREE.Vector3(side * (0.048 + k * 0.018), 0.265 - k * 0.008, 0.106),
          new THREE.Vector3(side * (0.088 + k * 0.01), 0.212 - k * 0.01, 0.085 - k * 0.02),
          new THREE.Vector3(side * 0.098, 0.175, 0.03 - k * 0.02),
        ]);
        const strand = new THREE.Mesh(new THREE.TubeGeometry(wave, 10, 0.019 - k * 0.002, 7, false), hairMat);
        strand.castShadow = true;
        head.add(strand);
        clothStrands.push(strand);
      }
    });

    // Layered nape & back tufts
    for (let s = -2; s <= 2; s++) {
      const nape = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.07, 4, 8), hairMat);
      nape.position.set(s * 0.032, 0.115, -0.102);
      nape.rotation.x = 0.2;
      head.add(nape);
    }
  } else {
    // Mannequin smooth sculpted hair cap
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.119, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.56),
      hairMat
    );
    hairCap.scale.set(0.92, 1.08, 0.98);
    hairCap.position.set(0, 0.184, -0.014);
    hairCap.rotation.x = -0.24;
    head.add(hairCap);
  }

  // Articulated Arms (Upper Sleeve + Elbow Joint + Forearm Sleeve + Cuff + Wrist + Hand)
  const buildArm = (side: number): { pivot: THREE.Group; forearm: THREE.Group } => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * (isRindi ? 0.185 : 0.205), -0.015, 0);

    // Shoulder cap for smooth shoulder-to-arm transition
    const deltoid = new THREE.Mesh(
      new THREE.SphereGeometry(isRindi ? 0.048 : 0.055, 14, 12),
      jacketMat
    );
    deltoid.scale.set(0.95, 1.05, 0.95);
    deltoid.castShadow = true;
    armPivot.add(deltoid);

    // Upper arm sleeve
    const upperPts = [
      new THREE.Vector2(isRindi ? 0.042 : 0.048, -0.23),
      new THREE.Vector2(isRindi ? 0.046 : 0.052, -0.11),
      new THREE.Vector2(isRindi ? 0.048 : 0.054, 0.0),
    ];
    const upperSleeve = new THREE.Mesh(new THREE.LatheGeometry(upperPts, 16), jacketMat);
    upperSleeve.castShadow = true;
    armPivot.add(upperSleeve);

    // Elbow joint pivot
    const forearm = new THREE.Group();
    forearm.position.set(0, -0.24, 0);
    armPivot.add(forearm);

    const elbowCap = new THREE.Mesh(
      new THREE.SphereGeometry(isRindi ? 0.039 : 0.045, 12, 10),
      jacketMat
    );
    forearm.add(elbowCap);

    // Rolled / pushed-up sleeve segment + exposed slim forearm skin (matches both Rindi & Bima JPEGs!)
    const lowerSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(isRindi ? 0.041 : 0.046, isRindi ? 0.039 : 0.044, 0.14, 16),
      jacketMat
    );
    lowerSleeve.position.y = -0.075;
    lowerSleeve.castShadow = true;

    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(isRindi ? 0.039 : 0.044, 0.008, 8, 16),
      jacketMat
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.position.y = -0.145;

    const bareForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(isRindi ? 0.027 : 0.031, isRindi ? 0.022 : 0.025, 0.105, 14),
      skinMat
    );
    bareForearm.position.y = -0.185;
    bareForearm.castShadow = true;

    forearm.add(lowerSleeve, cuff, bareForearm);

    // Bima's black wristwatch on his left wrist (side === 1 in +Z-facing character local space!)
    if (isBima && side === 1) {
      const watchMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.32, metalness: 0.45 });
      const strap = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.016, 16), watchMat);
      strap.position.y = -0.215;
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.008, 14), metalMat);
      dial.rotation.z = Math.PI / 2;
      dial.position.set(0.024, -0.215, 0);
      forearm.add(strap, dial);
    }

    const handGrp = new THREE.Group();
    handGrp.position.y = -0.245;
    addArticulatedHand(handGrp, skinMat, side, { slim: isRindi });
    forearm.add(handGrp);

    shoulders.add(armPivot);
    return { pivot: armPivot, forearm };
  };

  const leftArmRig = buildArm(-1);
  const rightArmRig = buildArm(1);

  // Articulated Legs (Thigh + Cargo Pocket if Bima + Knee Joint + Shin + Sneaker)
  const buildLeg = (side: number): { pivot: THREE.Group; knee: THREE.Group } => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * (isRindi ? 0.088 : 0.094), -0.02, 0);

    const thighPts = isRindi
      ? [
          new THREE.Vector2(0.068, -0.41),
          new THREE.Vector2(0.072, -0.2),
          new THREE.Vector2(0.078, 0.0),
        ]
      : [
          new THREE.Vector2(0.062, -0.41),
          new THREE.Vector2(0.07, -0.2),
          new THREE.Vector2(0.076, 0.0),
        ];

    const thigh = new THREE.Mesh(new THREE.LatheGeometry(thighPts, 18), pantsMat);
    thigh.castShadow = true;
    legPivot.add(thigh);

    // Bima's signature outer thigh cargo pockets with top flaps
    if (isBima) {
      const pocketBox = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.135, 0.105), pantsMat);
      pocketBox.position.set(side * 0.066, -0.23, 0.0);
      const pocketFlap = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.03, 0.108), pantsMat);
      pocketFlap.position.set(side * 0.068, -0.155, 0.0);
      legPivot.add(pocketBox, pocketFlap);
    }

    // Knee articulation pivot
    const knee = new THREE.Group();
    knee.position.y = -0.41;
    legPivot.add(knee);

    const kneeCap = new THREE.Mesh(
      new THREE.SphereGeometry(isRindi ? 0.067 : 0.061, 14, 12),
      pantsMat
    );
    knee.add(kneeCap);

    // Wide-leg jeans for Rindiani vs structured straight-tapered cargo shins for Bima
    const shinPts = isRindi
      ? [
          new THREE.Vector2(0.076, -0.39),
          new THREE.Vector2(0.072, -0.18),
          new THREE.Vector2(0.067, 0.0),
        ]
      : [
          new THREE.Vector2(0.056, -0.39),
          new THREE.Vector2(0.06, -0.18),
          new THREE.Vector2(0.061, 0.0),
        ];

    const shin = new THREE.Mesh(new THREE.LatheGeometry(shinPts, 18), pantsMat);
    shin.castShadow = true;
    knee.add(shin);

    // Sneaker foot anchored at ankle (bottom of sole hits y = 0.00!)
    const footPivot = new THREE.Group();
    footPivot.position.set(0, -0.41, 0);
    if (isRindi) {
      addSneakerShoe(footPivot, 0xd8dde4, 0xf1f5f9, 0xc3cbd4, 0.94, 0.94);
    } else if (isBima) {
      addSneakerShoe(footPivot, 0xd4d8df, 0xe8ecf2, 0x9aa4b2, 1.02, 1.02);
    } else {
      addSneakerShoe(footPivot, 0x334155, 0x475569, 0x1e293b, 0.98, 0.98);
    }
    knee.add(footPivot);

    hips.add(legPivot);
    return { pivot: legPivot, knee };
  };

  const leftLegRig = buildLeg(-1);
  const rightLegRig = buildLeg(1);

  addShadowDisc(root, textures.contactShadow, isRindi ? 0.54 : 0.58);

  return {
    root,
    hips,
    torso,
    chestMesh,
    shoulders,
    head,
    leftEyelid,
    rightEyelid,
    clothStrands,
    leftArm: leftArmRig.pivot,
    rightArm: rightArmRig.pivot,
    leftForearm: leftArmRig.forearm,
    rightForearm: rightArmRig.forearm,
    leftLeg: leftLegRig.pivot,
    rightLeg: rightLegRig.pivot,
    leftKnee: leftLegRig.knee,
    rightKnee: rightLegRig.knee,
  };
}

/**
 * Restored Original Entitas Bayangan Design:
 * - Billowing tattered shadow-asphalt cloak (LatheGeometry + hanging cloth tatters)
 * - Mouthless cracked porcelain mask over elongated dark skull
 * - Piercing pinpoint eyes (crimson red for Authority figure, ice-blue for standard shadow)
 * - Elongated clawed shadow arms + floating frost/shadow shards (orbitShardA / orbitShardB)
 * - Swirling 80-point dark distortion cloud & eerie rim aura light
 */
export function createArticulatedShadow(
  textures: ProceduralTextureBank,
  authorityTall: boolean
): ArticulatedCharacterRig {
  const root = new THREE.Group();
  const clothStrands: THREE.Object3D[] = [];

  const sc = authorityTall ? 1.24 : 1.06;

  const cloakMat = new THREE.MeshStandardMaterial({
    map: textures.shadowAsphalt,
    bumpMap: textures.shadowAsphaltBump,
    bumpScale: 0.035,
    color: 0x0a0d14,
    emissive: authorityTall ? 0x1a0810 : 0x100814,
    emissiveIntensity: 0.56,
    roughness: 0.88,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const darkBodyMat = new THREE.MeshStandardMaterial({
    map: textures.shadowAsphalt,
    bumpMap: textures.shadowAsphaltBump,
    bumpScale: 0.03,
    color: 0x05070c,
    roughness: 0.82,
    metalness: 0.1,
  });

  const maskMat = new THREE.MeshStandardMaterial({
    map: textures.porcelainMask,
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.05,
  });

  const pinMat = new THREE.MeshBasicMaterial({
    color: authorityTall ? 0xef4444 : 0x7dd3fc,
  });

  const shardMat = new THREE.MeshStandardMaterial({
    color: authorityTall ? 0x7f1d1d : 0x38bdf8,
    emissive: authorityTall ? 0xdc2626 : 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.22,
    metalness: 0.25,
    transparent: true,
    opacity: 0.84,
  });

  // Waist/hips pivot anchored at y = 0.90 (compatible with animateCharacterPose 'shadowStalk')
  const hips = new THREE.Group();
  hips.position.y = 0.9;
  hips.scale.setScalar(sc);
  root.add(hips);

  // Flowing tattered shadow robe draping down from waist to just above floor
  const robePoints = [
    new THREE.Vector2(0.42, -0.88),
    new THREE.Vector2(0.32, -0.58),
    new THREE.Vector2(0.22, -0.28),
    new THREE.Vector2(0.145, 0.08),
  ];
  const robe = new THREE.Mesh(new THREE.LatheGeometry(robePoints, 28), cloakMat);
  robe.castShadow = true;
  hips.add(robe);

  // Ragged shredded lower cloak strands hanging around perimeter
  for (let s = 0; s < 10; s++) {
    const ang = (s / 10) * Math.PI * 2;
    const len = 0.34 + (s % 3) * 0.12;
    const strand = new THREE.Mesh(new THREE.ConeGeometry(0.068, len, 5), cloakMat);
    strand.scale.set(1.0, 1.0, 0.26);
    strand.position.set(Math.sin(ang) * 0.34, -0.72, Math.cos(ang) * 0.34);
    strand.rotation.y = ang;
    strand.rotation.x = Math.PI + 0.12;
    hips.add(strand);
    clothStrands.push(strand);
  }

  // Minimal leg pivots so ArticulatedCharacterRig contract remains clean while hidden inside cloak
  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.08, -0.02, 0);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.08, -0.02, 0);
  hips.add(leftLeg, rightLeg);

  // Gaunt shadowy torso & high-collar mantle
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  const chestPoints = [
    new THREE.Vector2(0.128, -0.02),
    new THREE.Vector2(0.118, 0.14),
    new THREE.Vector2(0.168, 0.34),
    new THREE.Vector2(0.178, 0.44),
    new THREE.Vector2(0.105, 0.5),
  ];
  const chestMesh = new THREE.Mesh(new THREE.LatheGeometry(chestPoints, 24), cloakMat);
  chestMesh.scale.set(1.04, 1.0, 0.78);
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Ragged cloak drape across shoulders
  const drape = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.24, 0.34, 18, 1, true),
    cloakMat
  );
  drape.position.y = 0.36;
  drape.scale.set(1.12, 1.0, 0.85);
  torso.add(drape);

  const shoulders = new THREE.Group();
  shoulders.position.y = 0.44;
  // Subtle unnatural asymmetric hunch in shoulder line
  shoulders.rotation.z = authorityTall ? 0.065 : -0.055;
  torso.add(shoulders);

  // High ragged shadow collar framing the porcelain mask
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.122, 0.138, 0.145, 18, 1, true, Math.PI * 0.35, Math.PI * 1.3),
    cloakMat
  );
  collar.position.set(0, 0.065, -0.015);
  shoulders.add(collar);

  // Gaunt elongated neck enabling unnatural craning and severe head snaps
  const gauntNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.048, 0.14, 12),
    darkBodyMat
  );
  gauntNeck.position.set(0, 0.05, 0.01);
  shoulders.add(gauntNeck);

  // Elongated dark skull + mouthless cracked porcelain mask + deep sunken eye rims + pinpoint glowing eyes
  const head = new THREE.Group();
  head.position.y = 0.095;
  shoulders.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.148, 28, 24), darkBodyMat);
  skull.scale.set(0.82, 1.28, 0.92);
  skull.position.y = 0.17;
  skull.castShadow = true;
  head.add(skull);

  const maskGeo = new THREE.SphereGeometry(
    0.136,
    28,
    24,
    -Math.PI * 0.38,
    Math.PI * 0.76,
    Math.PI * 0.18,
    Math.PI * 0.66
  );
  const porcelainMaskMesh = new THREE.Mesh(maskGeo, maskMat);
  porcelainMaskMesh.scale.set(0.92, 1.18, 0.98);
  porcelainMaskMesh.position.set(0, 0.17, 0.028);
  porcelainMaskMesh.castShadow = true;
  head.add(porcelainMaskMesh);

  // Deep shadow eye-socket rings around pinpoint pupils so eyes pierce out from hollow darkness
  const socketRimMat = new THREE.MeshBasicMaterial({ color: 0x020306 });
  [-1, 1].forEach((side) => {
    const socketCavity = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0085, 8, 16), socketRimMat);
    socketCavity.position.set(side * 0.042, 0.186, 0.132);
    socketCavity.rotation.z = side * -0.14;
    head.add(socketCavity);

    const eyePin = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 10, 10), pinMat);
    eyePin.position.set(side * 0.042, 0.185, 0.139);
    head.add(eyePin);
  });

  // Camera target anchor right in front of the porcelain mask for ambushes
  const maskAnchor = new THREE.Object3D();
  maskAnchor.position.set(0, 0.17, 0.16);
  head.add(maskAnchor);

  // Elongated shadowy clawed arms (upper arm + forearm + 5 long splayed jagged claws)
  const buildShadowArm = (side: number): { pivot: THREE.Group; forearm: THREE.Group } => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.215, -0.01, 0.01);

    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.033, 0.34, 14),
      cloakMat
    );
    sleeve.position.y = -0.17;
    sleeve.castShadow = true;
    armPivot.add(sleeve);

    // Tattered sleeve drape hanging at elbow
    const sleeveTatter = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.22, 5), cloakMat);
    sleeveTatter.scale.set(1.0, 1.0, 0.28);
    sleeveTatter.position.set(side * 0.024, -0.3, -0.015);
    sleeveTatter.rotation.x = Math.PI;
    armPivot.add(sleeveTatter);
    clothStrands.push(sleeveTatter);

    const forearm = new THREE.Group();
    forearm.position.set(0, -0.34, 0);
    armPivot.add(forearm);

    const lowerArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.015, 0.33, 12),
      darkBodyMat
    );
    lowerArm.position.y = -0.165;
    lowerArm.castShadow = true;
    forearm.add(lowerArm);

    for (let c = 0; c < 5; c++) {
      const spread = c - 2;
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.155, 6), darkBodyMat);
      claw.position.set(spread * 0.016, -0.38, 0.026);
      claw.rotation.x = Math.PI + 0.22 + (c % 2) * 0.1;
      claw.rotation.z = spread * -0.085;
      forearm.add(claw);
    }

    shoulders.add(armPivot);
    return { pivot: armPivot, forearm };
  };

  const leftArmRig = buildShadowArm(-1);
  const rightArmRig = buildShadowArm(1);

  // Floating frost / shadow shards orbiting the entity (queried by name in engine.ts)
  const orbitShardA = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), shardMat);
  orbitShardA.name = 'orbitShardA';
  orbitShardA.position.set(-0.62, 1.25 * sc, 0.14);
  orbitShardA.rotation.set(0.4, 0.6, 0.2);

  const orbitShardB = new THREE.Mesh(new THREE.OctahedronGeometry(0.072, 0), shardMat);
  orbitShardB.name = 'orbitShardB';
  orbitShardB.position.set(0.62, 1.5 * sc, -0.12);
  orbitShardB.rotation.set(-0.3, 0.8, 0.5);
  root.add(orbitShardA, orbitShardB);

  // 80-point dark swirling distortion cloud around entity
  const cloudGeo = new THREE.BufferGeometry();
  const cloudCount = 80;
  const cloudPos = new Float32Array(cloudCount * 3);
  for (let i = 0; i < cloudCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.38 + Math.random() * 0.45;
    cloudPos[i * 3] = Math.cos(a) * r;
    cloudPos[i * 3 + 1] = 0.22 + Math.random() * 1.95 * sc;
    cloudPos[i * 3 + 2] = Math.sin(a) * r;
  }
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
  const distortionCloud = new THREE.Points(
    cloudGeo,
    new THREE.PointsMaterial({
      color: 0x090d16,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    })
  );
  root.add(distortionCloud);

  // Eerie flickering rim aura light
  const auraLight = new THREE.PointLight(authorityTall ? 0xdc2626 : 0x78a9c4, 1.5, 6.5, 2);
  auraLight.position.set(0, 1.65 * sc, 0.32);
  root.add(auraLight);

  addShadowDisc(root, textures.contactShadow, 0.74);

  return {
    root,
    hips,
    torso,
    chestMesh,
    shoulders,
    head,
    clothStrands,
    leftArm: leftArmRig.pivot,
    rightArm: rightArmRig.pivot,
    leftForearm: leftArmRig.forearm,
    rightForearm: rightArmRig.forearm,
    leftLeg,
    rightLeg,
    maskAnchor,
    distortionCloud,
    auraLight,
  };
}

export function animateCharacterPose(
  rig: ArticulatedCharacterRig,
  mode: 'idle' | 'walk' | 'seatedHug' | 'shadowStalk' | 'shadowStare',
  time: number,
  speed = 1,
  forceEyesClosed = false
): void {
  // Subtle cloth/hair/tatter wind sway
  for (let i = 0; i < rig.clothStrands.length; i++) {
    rig.clothStrands[i].rotation.z = Math.sin(time * 2.1 + i * 0.9) * 0.032;
  }

  // Natural blinking micro-animation (or forced closed during Cutscene Shot 3)
  if (rig.leftEyelid && rig.rightEyelid) {
    let lidScale = 0.24;
    if (forceEyesClosed) {
      lidScale = 1.08;
    } else {
      const blinkCycle = time % 4.3;
      if (blinkCycle > 4.12) {
        lidScale = 1.05;
      }
    }
    rig.leftEyelid.scale.y = lidScale;
    rig.rightEyelid.scale.y = lidScale;
  }

  // Chest breathing micro-animation
  const breath = 1 + Math.sin(time * 2.2) * 0.02;
  rig.chestMesh.scale.set(1.04 * breath, 1.0, 0.78 * breath);

  if (mode === 'seatedHug') {
    rig.hips.position.y = 0.5;
    rig.torso.rotation.x = 0.22 + Math.sin(time * 2.1) * 0.024;
    rig.shoulders.position.x = Math.sin(time * 25.0) * 0.0035;
    rig.shoulders.rotation.z = Math.sin(time * 17.0) * 0.01;
    rig.head.rotation.x = 0.3 + Math.sin(time * 1.4) * 0.03;
    rig.head.rotation.z = Math.sin(time * 0.7) * 0.035;

    // Seated thighs horizontal on bench/crystal seat, shins vertical to floor
    rig.leftLeg.rotation.x = -1.5;
    rig.rightLeg.rotation.x = -1.5;
    if (rig.leftKnee) rig.leftKnee.rotation.x = 1.42;
    if (rig.rightKnee) rig.rightKnee.rotation.x = 1.42;

    // Arms wrapped softly hugging waist/knees without chest clipping
    rig.leftArm.rotation.x = -0.72;
    rig.leftArm.rotation.z = -0.2;
    rig.rightArm.rotation.x = -0.72;
    rig.rightArm.rotation.z = 0.2;
    if (rig.leftForearm) {
      rig.leftForearm.rotation.x = -0.88;
      rig.leftForearm.rotation.z = 0.54;
    }
    if (rig.rightForearm) {
      rig.rightForearm.rotation.x = -0.88;
      rig.rightForearm.rotation.z = -0.54;
    }
    return;
  }

  if (mode === 'walk') {
    const phase = time * 6.5 * speed;
    const legSwing = Math.sin(phase) * 0.52;
    rig.hips.position.y = 0.9 + Math.abs(Math.sin(phase)) * 0.024;
    rig.torso.rotation.x = 0.05;
    rig.shoulders.position.x = 0;
    rig.shoulders.rotation.z = Math.sin(phase) * 0.025;
    rig.head.rotation.x = -0.02;
    rig.head.rotation.z = 0;

    rig.leftLeg.rotation.x = legSwing;
    rig.rightLeg.rotation.x = -legSwing;
    if (rig.leftKnee) rig.leftKnee.rotation.x = Math.max(0.05, -Math.cos(phase) * 0.42);
    if (rig.rightKnee) rig.rightKnee.rotation.x = Math.max(0.05, Math.cos(phase) * 0.42);

    rig.leftArm.rotation.x = -Math.sin(phase) * 0.42;
    rig.rightArm.rotation.x = Math.sin(phase) * 0.42;
    rig.leftArm.rotation.z = 0.06;
    rig.rightArm.rotation.z = -0.06;
    if (rig.leftForearm) {
      rig.leftForearm.rotation.x = -0.22 - Math.max(0, Math.sin(phase)) * 0.18;
      rig.leftForearm.rotation.z = 0;
    }
    if (rig.rightForearm) {
      rig.rightForearm.rotation.x = -0.22 - Math.max(0, -Math.sin(phase)) * 0.18;
      rig.rightForearm.rotation.z = 0;
    }
    return;
  }

  if (mode === 'shadowStalk' || mode === 'shadowStare') {
    const isStare = mode === 'shadowStare';
    const stride = time * (isStare ? 0.5 : 4.8 * Math.max(0.75, speed));
    const snapGate = Math.sin(time * 1.15 + Math.cos(time * 0.47));
    const headSnap =
      snapGate > 0.72
        ? 0.62 + Math.sin(time * 28.0) * 0.045
        : snapGate < -0.78
          ? -0.58 + Math.cos(time * 25.0) * 0.04
          : Math.sin(time * 1.65) * 0.24 + (Math.sin(time * 19.0) > 0.88 ? 0.18 : 0);

    rig.hips.position.y = isStare
      ? 0.9 + Math.sin(time * 1.4) * 0.01
      : 0.88 + Math.abs(Math.sin(stride)) * 0.022;
    rig.hips.rotation.z = isStare ? 0.03 : Math.sin(stride * 0.5) * 0.045;
    rig.torso.rotation.x = (isStare ? 0.26 : 0.22) + Math.sin(time * 2.1) * 0.045;
    rig.shoulders.rotation.z = (isStare ? 0.09 : 0.07) + Math.sin(time * 15.5) * 0.012;
    rig.head.position.y = 0.095 + Math.sin(time * 2.9) * 0.015;
    rig.head.rotation.x = -0.18 + (snapGate > 0.72 ? -0.12 : 0);
    rig.head.rotation.z = headSnap;
    rig.head.rotation.y = Math.sin(time * 21.0) > 0.91 ? (Math.sin(time * 41) * 0.16) : 0;

    if (isStare) {
      rig.leftLeg.rotation.x = 0.06;
      rig.rightLeg.rotation.x = -0.06;
      rig.leftArm.rotation.x = -0.24 + Math.sin(time * 19.0) * 0.025;
      rig.rightArm.rotation.x = -0.72 + Math.cos(time * 22.0) * 0.035;
      rig.leftArm.rotation.z = 0.18;
      rig.rightArm.rotation.z = -0.14;
      if (rig.leftForearm) rig.leftForearm.rotation.x = -0.22 + Math.sin(time * 24) * 0.04;
      if (rig.rightForearm) rig.rightForearm.rotation.x = -0.58 + Math.cos(time * 26) * 0.05;
    } else {
      rig.leftLeg.rotation.x = Math.sin(stride) * 0.44;
      rig.rightLeg.rotation.x = -Math.sin(stride) * 0.36;
      if (rig.leftKnee) rig.leftKnee.rotation.x = Math.max(0.12, -Math.cos(stride) * 0.45);
      if (rig.rightKnee) rig.rightKnee.rotation.x = Math.max(0.12, Math.cos(stride) * 0.45);

      const spasm = Math.sin(time * 23.0) * 0.042;
      rig.leftArm.rotation.x = -0.62 + Math.sin(time * 2.8) * 0.22 + spasm;
      rig.rightArm.rotation.x = -0.48 - Math.sin(time * 2.5) * 0.24 - spasm;
      rig.leftArm.rotation.z = 0.16 + Math.sin(time * 3.3) * 0.05;
      rig.rightArm.rotation.z = -0.16 - Math.cos(time * 3.1) * 0.05;
      if (rig.leftForearm) rig.leftForearm.rotation.x = -0.44 + Math.sin(time * 26.0) * 0.05;
      if (rig.rightForearm) rig.rightForearm.rotation.x = -0.32 + Math.cos(time * 24.0) * 0.05;
    }

    if (rig.distortionCloud) {
      rig.distortionCloud.rotation.y += isStare ? 0.012 : 0.028;
    }
    if (rig.auraLight) {
      const spike = Math.sin(time * 39.0) > 0.8 ? 0.7 : 0;
      rig.auraLight.intensity = 1.15 + Math.sin(time * 13.0) * 0.35 + spike;
    }
    return;
  }

  // Idle breathing & relaxed natural stance
  rig.hips.position.y = 0.9;
  rig.torso.rotation.x = Math.sin(time * 1.8) * 0.018;
  rig.shoulders.position.x = 0;
  rig.shoulders.rotation.z = 0;
  rig.head.rotation.x = Math.sin(time * 1.8 - 0.5) * 0.022;
  rig.head.rotation.z = 0;
  rig.leftLeg.rotation.x = 0;
  rig.rightLeg.rotation.x = 0;
  if (rig.leftKnee) rig.leftKnee.rotation.x = 0;
  if (rig.rightKnee) rig.rightKnee.rotation.x = 0;
  rig.leftArm.rotation.x = 0.04;
  rig.rightArm.rotation.x = 0.04;
  rig.leftArm.rotation.z = 0.07;
  rig.rightArm.rotation.z = -0.07;
  if (rig.leftForearm) {
    rig.leftForearm.rotation.x = -0.14;
    rig.leftForearm.rotation.z = 0;
  }
  if (rig.rightForearm) {
    rig.rightForearm.rotation.x = -0.14;
    rig.rightForearm.rotation.z = 0;
  }
}
