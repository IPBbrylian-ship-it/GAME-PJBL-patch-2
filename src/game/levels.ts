import * as THREE from 'three';
import { DifficultyMode, EndingType, LayerIndex } from '../types/game';
import {
  ArticulatedCharacterRig,
  createArticulatedPerson,
  createArticulatedShadow,
} from './characters';
import { CityscapeController, buildLayeredCityscape } from './cityscape';
import {
  createArchitecturalPillar,
  createBadgeFragment,
  createBedWithBedding,
  createBreakerBoxPuzzle,
  createCampusBulletinBoard,
  createCampusTrashBin,
  createChainedBKDoor,
  createClassicStreetlamp,
  createCrackedMirrorFrame,
  createFacultyBuilding,
  createFallenChair,
  createFilingCabinet,
  createFluorescentFixture,
  createFramedPhoto,
  createGiantPencil,
  createGlassDomeWithRindi,
  createHidingCloset,
  createIceWallSeal,
  createKbgoScreen,
  createKeypadSafePuzzle,
  createLoreClueProp,
  createMemorialCandles,
  createMusicBoxFragment,
  createNightWindowCurtain,
  createPaperNoteFragment,
  createParkBench,
  createPhoneNakasFragment,
  createProtectionPillar,
  createSatgasTerminalPuzzle,
  createScatteredPapers,
  createSchoolDeskAndChair,
  createShareLocBeacon,
  createShatteredVanity,
  createSnowMoundsAndGrass,
  createStorageRack,
  createStudyDeskWithBooks,
  createWallClock,
  createWinterTree,
  createWoodenStaircase,
} from './models';
import { ProceduralTextureBank } from './textures';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface InteractableItem {
  id: string;
  kind: 'fragment' | 'pillar' | 'exit' | 'clue' | 'puzzle';
  position: THREE.Vector3;
  radius: number;
  collected: boolean;
  label: string;
  mesh: THREE.Group;
  loreId?: string;
  puzzleId?: string;
  lockedByPuzzleId?: string;
}

export interface HidingSpot {
  id: string;
  position: THREE.Vector3;
  lookOutYaw: number;
  label: string;
  mesh: THREE.Group;
}

export type EnemyAiState =
  | 'patrol'
  | 'stalkWatch'
  | 'freezeOnLook'
  | 'repositionHidden'
  | 'chase'
  | 'frozenByLantern';

export interface ShadowEnemy {
  rig: ArticulatedCharacterRig;
  waypoints: THREE.Vector3[];
  currentWaypoint: number;
  baseSpeed: number;
  frozenTimer: number;
  chasing: boolean;
  lastWhisperTime: number;
  aiState?: EnemyAiState;
  stateTimer?: number;
  repositionCooldown?: number;
  path?: { x: number; z: number }[];
  pathTimer?: number;
  lastX?: number;
  lastZ?: number;
  stuckTimer?: number;
  hiddenFromView?: boolean;
  peekTriggered?: boolean;
}

export interface AutoDoorTrigger {
  triggerZ: number;
  triggered: boolean;
  pivot: THREE.Group;
  targetYaw: number;
  openYaw: number;
  closedYaw: number;
  hingeX: number;
  hingeZ: number;
  leafLength: number;
  directionSign: 1 | -1;
}

export interface StoryTriggerZone {
  id: string;
  position: THREE.Vector3;
  radius: number;
  fired: boolean;
}

export interface EnvJumpscareZone {
  id: string;
  kind: 'wardrobe' | 'mannequins' | 'glitchPhone';
  position: THREE.Vector3;
  radius: number;
  fired: boolean;
  focusTarget: THREE.Vector3;
  doorLeftPivot?: THREE.Object3D;
  doorRightPivot?: THREE.Object3D;
  glitchScreenGroup?: THREE.Group;
}

export interface FlickerLightEntry {
  light: THREE.PointLight;
  tubeMat: THREE.MeshStandardMaterial;
  seed: number;
}

export interface CampusSceneResult {
  root: THREE.Group;
  rindiRig: ArticulatedCharacterRig;
  bimaRig: ArticulatedCharacterRig;
  sunLight: THREE.DirectionalLight;
  benchLamp: THREE.Group;
  farLamp: THREE.Group;
  groundMat: THREE.MeshStandardMaterial;
  walkwayMat: THREE.MeshStandardMaterial;
  snowMounds: THREE.Group;
  cityscape: CityscapeController;
}

export interface LevelBuildResult {
  root: THREE.Group;
  playerSpawn: THREE.Vector3;
  playerYaw: number;
  colliders: AABB[];
  interactables: InteractableItem[];
  hidingSpots: HidingSpot[];
  enemies: ShadowEnemy[];
  mannequins: ArticulatedCharacterRig[];
  animatedObjects: { mesh: THREE.Object3D; mode: 'spinY' | 'bob' | 'pencil' }[];
  curtainMeshes: THREE.Object3D[];
  clockHands: { hour?: THREE.Object3D; minute?: THREE.Object3D }[];
  flickerLights: FlickerLightEntry[];
  beaconRipples: THREE.Object3D[];
  autoDoors: AutoDoorTrigger[];
  storyTriggers: StoryTriggerZone[];
  envScares: EnvJumpscareZone[];
  mirrorFrames?: THREE.Group[];
  cityscape?: CityscapeController;
  domeController?: {
    domeMesh: THREE.Mesh;
    iceRibs: THREE.Group;
    tendrilGroup: THREE.Group;
    rindiRig: ArticulatedCharacterRig;
    domeLight: THREE.PointLight;
  };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

function addBoxWall(
  parent: THREE.Group,
  colliders: AABB[],
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  parent.add(mesh);
  colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minZ: z - d / 2,
    maxZ: z + d / 2,
  });
  return mesh;
}

export function buildCampusParkScene(
  textures: ProceduralTextureBank,
  mode: 'title' | 'prologue' | EndingType
): CampusSceneResult {
  const root = new THREE.Group();

  const isWarmDay = mode === 'title' || mode === 'prologue';
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.campusStone,
    bumpMap: textures.campusStoneBump,
    bumpScale: 0.03,
    roughness: 0.84,
    color: mode === 'true' ? 0xdbeafe : isWarmDay ? 0xc8d2c6 : 0xa3bdd4,
  });

  // Extended horizon ground plane so far-background skyline is firmly grounded
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  const walkwayMat = new THREE.MeshStandardMaterial({
    color: isWarmDay ? 0x475569 : 0x26313d,
    roughness: 0.72,
  });
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 52), walkwayMat);
  walkway.position.set(0, 0.02, 2);
  walkway.receiveShadow = true;
  root.add(walkway);

  const crossWalkway = new THREE.Mesh(new THREE.BoxGeometry(44, 0.035, 2.8), walkwayMat);
  crossWalkway.position.set(0, 0.018, -6.5);
  crossWalkway.receiveShadow = true;
  root.add(crossWalkway);

  // Uneven snowbanks & wild grass along footpath
  const snowMounds = createSnowMoundsAndGrass(textures, [
    [-2.8, 1.5],
    [2.9, 2.8],
    [-3.4, -3.5],
    [3.6, -4.2],
    [-4.8, 6.2],
    [4.5, 6.8],
    [-8.5, -10.2],
    [8.2, -9.8],
  ]);
  snowMounds.visible = !isWarmDay;
  root.add(snowMounds);

  // Park Bench, Trash Bin & Bulletin Board with torn posters
  const bench = createParkBench(textures);
  bench.position.set(0, 0, -1.2);
  root.add(bench);

  const farBench = createParkBench(textures);
  farBench.position.set(6.5, 0, -8.8);
  farBench.rotation.y = -0.35;
  root.add(farBench);

  const trashBin = createCampusTrashBin(textures);
  trashBin.position.set(1.65, 0, -1.35);
  root.add(trashBin);

  const bulletin = createCampusBulletinBoard(textures);
  bulletin.position.set(-3.2, 0, -4.6);
  bulletin.rotation.y = 0.42;
  root.add(bulletin);

  // Classic Streetlamps
  const benchLamp = createClassicStreetlamp(textures, mode === 'true');
  benchLamp.position.set(-2.35, 0, -1.8);
  root.add(benchLamp);

  const farLamp = createClassicStreetlamp(textures, mode === 'true');
  farLamp.position.set(3.8, 0, 5.5);
  root.add(farLamp);

  [
    [-5.2, -11.5],
    [5.2, -11.5],
    [-12.5, -5.2],
    [12.5, -5.2],
  ].forEach(([lx, lz]) => {
    const extraLamp = createClassicStreetlamp(textures, mode === 'true');
    extraLamp.position.set(lx, 0, lz);
    if (isWarmDay) {
      extraLamp.traverse((child) => {
        if ((child as THREE.PointLight).isPointLight) {
          (child as THREE.PointLight).intensity = 0;
        }
      });
    }
    root.add(extraLamp);
  });

  if (isWarmDay) {
    [benchLamp, farLamp].forEach((lamp) => {
      lamp.traverse((child) => {
        if ((child as THREE.PointLight).isPointLight) {
          (child as THREE.PointLight).intensity = 0;
        }
      });
    });
  }

  // Multi-story Faculty building in campus foreground
  const faculty = createFacultyBuilding(textures);
  faculty.position.set(0, 0, -23.5);
  root.add(faculty);

  // Branched Winter Trees framing campus lawn
  [
    [-6.2, -5.5],
    [6.5, -4.8],
    [-8.5, 3.8],
    [8.2, 4.4],
    [-13.0, -13.0],
    [13.5, -12.5],
    [-16.5, 8.5],
    [16.5, 8.5],
    [-18.0, -2.5],
    [18.0, -2.5],
  ].forEach(([tx, tz], idx) => {
    const tree = createWinterTree(textures);
    tree.position.set(tx, 0, tz);
    tree.rotation.y = idx * 0.9;
    root.add(tree);
  });

  // Campus wrought-iron perimeter fence & stone gate posts
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x161e29, roughness: 0.4, metalness: 0.8 });
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2a3648, roughness: 0.78 });
  const fenceBack = new THREE.Mesh(new THREE.BoxGeometry(44, 0.9, 0.12), fenceMat);
  fenceBack.position.set(0, 0.45, -15.5);
  root.add(fenceBack);
  for (let i = -3; i <= 3; i++) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.75, 0.55), postMat);
    post.position.set(i * 7, 0.875, -15.5);
    root.add(post);
  }

  // 4-Tier Layered Urban Cityscape surrounding the campus horizon
  const cityscape = buildLayeredCityscape(textures, {
    innerClearRadius: 27,
    isWarmDay,
    isTrueEnding: mode === 'true',
  });
  root.add(cityscape.root);

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

  const bimaRig = createArticulatedPerson(textures, {
    role: 'bima',
    jacketHex: 0x1c2c44,
    pantsHex: 0x181b20,
    skinHex: 0xcfa485,
    hairHex: 0x141418,
    withBackpack: true,
    withHijab: false,
  });

  if (mode === 'true') {
    rindiRig.root.position.set(-0.65, 0, 0.4);
    rindiRig.root.rotation.y = 0.28;
    bimaRig.root.position.set(0.75, 0, 0.55);
    bimaRig.root.rotation.y = -0.35;
  } else {
    rindiRig.root.position.set(0, 0.02, -1.16);
    rindiRig.root.rotation.y = 0.08;
    if (mode === 'title') {
      bimaRig.root.visible = false;
    } else {
      bimaRig.root.position.set(1.45, 0, 0.65);
      bimaRig.root.rotation.y = -0.82;
    }
  }
  root.add(rindiRig.root, bimaRig.root);

  const sunLight = new THREE.DirectionalLight(
    mode === 'true' ? 0xfde68a : isWarmDay ? 0xffe2b0 : 0x93c5fd,
    mode === 'true' ? 1.55 : isWarmDay ? 1.45 : 0.35
  );
  sunLight.position.set(10, 14, 12);
  sunLight.castShadow = true;
  root.add(sunLight);

  return {
    root,
    rindiRig,
    bimaRig,
    sunLight,
    benchLamp,
    farLamp,
    groundMat,
    walkwayMat,
    snowMounds,
    cityscape,
  };
}

export function buildLayer(
  layerIndex: LayerIndex,
  textures: ProceduralTextureBank,
  isSoftwareGl: boolean,
  frostLevel: number,
  difficulty: DifficultyMode
): LevelBuildResult {
  const root = new THREE.Group();
  const colliders: AABB[] = [];
  const interactables: InteractableItem[] = [];
  const hidingSpots: HidingSpot[] = [];
  const enemies: ShadowEnemy[] = [];
  const mannequins: ArticulatedCharacterRig[] = [];
  const animatedObjects: { mesh: THREE.Object3D; mode: 'spinY' | 'bob' | 'pencil' }[] = [];
  const curtainMeshes: THREE.Object3D[] = [];
  const clockHands: { hour?: THREE.Object3D; minute?: THREE.Object3D }[] = [];
  const flickerLights: FlickerLightEntry[] = [];
  const beaconRipples: THREE.Object3D[] = [];
  const autoDoors: AutoDoorTrigger[] = [];
  const storyTriggers: StoryTriggerZone[] = [];
  const envScares: EnvJumpscareZone[] = [];

  const speedFactor = difficulty === 'story' ? 0.58 : 1.0;

  if (layerIndex === 0) {
    // =========================================================================
    // BABAK I: Rumah Lantai Dua yang Membeku (Expanded Multi-Wing House)
    // =========================================================================
    const floorMat = new THREE.MeshStandardMaterial({
      map: textures.frostedWood,
      bumpMap: textures.frostedWoodBump,
      bumpScale: 0.025,
      roughnessMap: textures.frostedWoodRough,
      roughness: 0.55,
      metalness: 0.08,
      color: 0xa4bdd4,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: textures.plasterWall,
      bumpMap: textures.plasterWallBump,
      bumpScale: 0.03,
      color: 0x3b4858,
      roughness: 0.85,
      metalness: 0.04,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      map: textures.frostedWood,
      bumpMap: textures.frostedWoodBump,
      bumpScale: 0.015,
      color: 0x4b3529,
      roughness: 0.68,
    });

    // Floor slabs surrounding a true recessed stairwell opening at x: 3.7..5.6, z: 3.5..7.9
    const addFloorSlab = (w: number, d: number, cx: number, cz: number, y = 0) => {
      const slab = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
      slab.rotation.x = -Math.PI / 2;
      slab.position.set(cx, y, cz);
      slab.receiveShadow = true;
      root.add(slab);
    };
    addFloorSlab(17.7, 40, -5.15, -3); // West side of stairwell (x: -14.0 .. 3.7)
    addFloorSlab(8.4, 40, 9.8, -3); // East side of stairwell (x: 5.6 .. 14.0)
    addFloorSlab(1.9, 26.5, 4.65, -9.75); // North of stairwell (z: -23.0 .. 3.5)
    addFloorSlab(1.9, 9.1, 4.65, 12.45); // South of stairwell (z: 7.9 .. 17.0)

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 40),
      new THREE.MeshStandardMaterial({ color: 0x0b1018, roughness: 0.9 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.7, -3);
    root.add(ceiling);

    // Lowered ceiling soffit inside East Claustrophobic Storage Room
    const atticCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 11.2),
      new THREE.MeshStandardMaterial({ color: 0x080b12, roughness: 0.92 })
    );
    atticCeiling.rotation.x = Math.PI / 2;
    atticCeiling.position.set(8.4, 3.18, -5.0);
    root.add(atticCeiling);

    // South Foyer & Staircase Perimeter
    addBoxWall(root, colliders, 0, 1.85, 15.2, 15.4, 3.7, 0.45, wallMat);
    addBoxWall(root, colliders, -7.5, 1.85, 12.35, 0.45, 3.7, 5.8, wallMat);
    addBoxWall(root, colliders, 7.5, 1.85, 11.6, 0.45, 3.7, 7.2, wallMat);

    // West Wing Outer Walls (Bedroom + North Music/Guest Room)
    addBoxWall(root, colliders, -12.6, 1.85, -3.0, 0.45, 3.7, 25.4, wallMat);
    addBoxWall(root, colliders, -10.05, 1.85, 9.5, 5.1, 3.7, 0.45, wallMat);
    addBoxWall(root, colliders, -8.0, 1.85, -15.5, 9.2, 3.7, 0.45, wallMat);

    // West Bedroom <-> Central Hall partition (Doorway at z: 2.6..5.6)
    addBoxWall(root, colliders, -3.8, 1.85, 7.55, 0.38, 3.7, 3.9, wallMat);
    addBoxWall(root, colliders, -3.8, 1.85, 0.4, 0.38, 3.7, 4.4, wallMat);

    // West Bedroom <-> North Music Room partition (Doorway at x: -6.5..-3.8)
    addBoxWall(root, colliders, -9.55, 1.85, 0.5, 6.1, 3.7, 0.38, wallMat);

    // North Music Room <-> North Hall partition (Doorways at z: -4.5..-1.8 and z: -15.5..-11.5)
    addBoxWall(root, colliders, -3.8, 1.85, -8.0, 0.38, 3.7, 7.0, wallMat);

    // East Wing Outer Walls (Stairwell + Tight Storage Room)
    addBoxWall(root, colliders, 12.6, 1.65, -1.25, 0.45, 3.3, 18.5, wallMat);
    addBoxWall(root, colliders, 10.05, 1.65, 8.0, 5.1, 3.3, 0.45, wallMat);
    addBoxWall(root, colliders, 10.05, 1.65, 0.5, 5.1, 3.3, 0.38, wallMat);
    addBoxWall(root, colliders, 8.0, 1.65, -10.5, 9.2, 3.3, 0.45, wallMat);

    // Central Hall <-> East Storage partition (Doorways at z: -1.7..0.5 and z: -10.5..-7.3)
    addBoxWall(root, colliders, 4.2, 1.65, -4.5, 0.38, 3.3, 5.6, wallMat);
    // Internal U-turn divider inside East Storage for claustrophobic navigation
    addBoxWall(root, colliders, 8.5, 1.65, -5.0, 0.35, 3.3, 4.6, wallMat);

    // North Ice Corridor (`z: -21.2..-10.5`)
    addBoxWall(root, colliders, -3.4, 1.85, -18.35, 0.45, 3.7, 5.7, wallMat);
    addBoxWall(root, colliders, 3.4, 1.85, -15.85, 0.45, 3.7, 10.7, wallMat);
    addBoxWall(root, colliders, 0, 1.85, -21.2, 7.2, 3.7, 0.45, wallMat);

    // Architectural wooden columns framing the Central Hall
    [
      [-3.1, 8.2],
      [3.1, 8.2],
      [-3.1, -4.2],
      [3.1, -4.2],
    ].forEach(([px, pz]) => {
      const col = createArchitecturalPillar(textures, 3.7, 0x4b3529);
      col.position.set(px, 0, pz);
      root.add(col);
      colliders.push({ minX: px - 0.32, maxX: px + 0.32, minZ: pz - 0.32, maxZ: pz + 0.32 });
    });

    // Open Wooden Stairwell Pit + Visible Balustrade Railings + Downstairs Warm Glow
    // Pit covers x: 3.7..5.6, z: 3.5..7.9; leaves 1.485m clear walkable corridor East (x: 5.79..7.275) into East Alcove
    const pitWallMat = new THREE.MeshStandardMaterial({ color: 0x261a14, roughness: 0.8 });
    const makePitWall = (w: number, h: number, d: number, px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), pitWallMat);
      m.position.set(px, py, pz);
      m.receiveShadow = true;
      root.add(m);
    };
    makePitWall(0.12, 2.6, 4.4, 3.64, -1.3, 5.7);
    makePitWall(0.12, 2.6, 4.4, 5.66, -1.3, 5.7);
    makePitWall(2.02, 2.6, 0.12, 4.65, -1.3, 3.44);
    makePitWall(2.02, 2.6, 0.12, 4.65, -1.3, 7.96);
    makePitWall(2.2, 0.14, 4.8, 4.65, -2.55, 5.7); // Downstairs landing floor

    // Visible upper-floor safety balustrade railings framing all 4 edges of the stairwell opening
    const makeRailBeam = (w: number, h: number, d: number, rx: number, ry: number, rz: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), trimMat);
      m.position.set(rx, ry, rz);
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
    };
    makeRailBeam(0.16, 1.02, 4.56, 3.6, 0.51, 5.7); // West railing
    makeRailBeam(0.16, 1.02, 4.56, 5.7, 0.51, 5.7); // East railing
    makeRailBeam(2.26, 1.02, 0.16, 4.65, 0.51, 3.44); // North railing
    makeRailBeam(2.26, 1.02, 0.16, 4.65, 0.51, 7.96); // South railing

    const stair = createWoodenStaircase(textures);
    stair.position.set(4.65, 0, 3.85);
    root.add(stair);
    // Single collider matched 1:1 to visible balustrade outer perimeter
    colliders.push({ minX: 3.51, maxX: 5.79, minZ: 3.36, maxZ: 8.04 });

    const stairGlow = new THREE.PointLight(0xd4a353, 5.2, 15, 1.5);
    stairGlow.position.set(4.65, -0.75, 6.2);
    root.add(stairGlow);

    // Night windows with swaying curtains (West Bedroom & North-West Music Room)
    [
      [-12.34, 5.2, Math.PI / 2],
      [-12.34, -9.8, Math.PI / 2],
      [12.34, 3.8, -Math.PI / 2],
    ].forEach(([wx, wz, wry]) => {
      const win = createNightWindowCurtain(textures);
      win.position.set(wx, 0, wz);
      win.rotation.y = wry;
      root.add(win);
      const cL = win.getObjectByName('curtainLeft');
      const cR = win.getObjectByName('curtainRight');
      if (cL) curtainMeshes.push(cL);
      if (cR) curtainMeshes.push(cR);
    });

    storyTriggers.push({
      id: 'stair_warmth',
      position: new THREE.Vector3(2.1, 0, 6.0),
      radius: 2.5,
      fired: false,
    });

    // West Bedroom: Bed, Study Desk & Hiding Wardrobe
    const bed = createBedWithBedding(textures);
    bed.position.set(-10.2, 0, 6.5);
    bed.rotation.y = Math.PI / 2;
    root.add(bed);
    colliders.push({ minX: -11.5, maxX: -8.9, minZ: 5.5, maxZ: 7.5 });

    const bedDesk = createStudyDeskWithBooks(textures);
    bedDesk.position.set(-7.6, 0, 8.6);
    bedDesk.rotation.y = Math.PI;
    root.add(bedDesk);
    colliders.push({ minX: -8.35, maxX: -6.85, minZ: 8.2, maxZ: 9.0 });

    // North-West Music Room: Study Desk & Wall Clock
    const musicDesk = createStudyDeskWithBooks(textures);
    musicDesk.position.set(-11.4, 0, -4.5);
    musicDesk.rotation.y = Math.PI / 2;
    root.add(musicDesk);
    colliders.push({ minX: -11.8, maxX: -11.0, minZ: -5.25, maxZ: -3.75 });

    const houseClock = createWallClock(textures);
    houseClock.position.set(3.15, 2.45, -11.2);
    houseClock.rotation.y = -Math.PI / 2;
    root.add(houseClock);
    clockHands.push({
      hour: houseClock.getObjectByName('clockHour'),
      minute: houseClock.getObjectByName('clockMinute'),
    });

    // East Storage Room: Storage Racks
    [
      [6.2, -7.8, 0],
      [10.8, -2.8, Math.PI / 2],
      [10.8, -7.2, Math.PI / 2],
    ].forEach(([rx, rz, rry]) => {
      const rack = createStorageRack(textures);
      rack.position.set(rx, 0, rz);
      rack.rotation.y = rry;
      root.add(rack);
      const rot = Math.abs(Math.sin(rry)) > 0.7;
      colliders.push({
        minX: rx - (rot ? 0.32 : 0.74),
        maxX: rx + (rot ? 0.32 : 0.74),
        minZ: rz - (rot ? 0.74 : 0.32),
        maxZ: rz + (rot ? 0.74 : 0.32),
      });
    });

    // Hiding Wardrobes
    const closet1 = createHidingCloset(textures, 'wood');
    closet1.position.set(-4.6, 0, 8.2);
    closet1.rotation.y = Math.PI / 2;
    root.add(closet1);
    colliders.push({ minX: -5.05, maxX: -4.15, minZ: 7.62, maxZ: 8.78 });
    hidingSpots.push({
      id: 'hide_1_a',
      position: new THREE.Vector3(-4.6, 0, 8.2),
      lookOutYaw: -Math.PI / 2,
      label: 'Lemari Pakaian Kamar',
      mesh: closet1,
    });

    const closet2 = createHidingCloset(textures, 'wood');
    closet2.position.set(-4.6, 0, -13.5);
    closet2.rotation.y = Math.PI / 2;
    root.add(closet2);
    colliders.push({ minX: -5.05, maxX: -4.15, minZ: -14.08, maxZ: -12.92 });
    hidingSpots.push({
      id: 'hide_1_b',
      position: new THREE.Vector3(-4.6, 0, -13.5),
      lookOutYaw: -Math.PI / 2,
      label: 'Lemari Ruang Musik',
      mesh: closet2,
    });

    const closet3 = createHidingCloset(textures, 'wood');
    closet3.position.set(2.55, 0, -13.2);
    closet3.rotation.y = -Math.PI / 2;
    root.add(closet3);
    colliders.push({ minX: 2.1, maxX: 3.0, minZ: -13.78, maxZ: -12.62 });
    hidingSpots.push({
      id: 'hide_1_c',
      position: new THREE.Vector3(2.55, 0, -13.2),
      lookOutYaw: Math.PI / 2,
      label: 'Lemari Lorong Utara',
      mesh: closet3,
    });

    // Environmental Jumpscare: Wardrobe doors bang open violently as Bima approaches north hall
    envScares.push({
      id: 'env_wardrobe',
      kind: 'wardrobe',
      position: new THREE.Vector3(1.1, 0, -13.2),
      radius: 2.4,
      fired: false,
      focusTarget: new THREE.Vector3(2.55, 1.4, -13.2),
      doorLeftPivot: closet3.getObjectByName('leftDoorPivot'),
      doorRightPivot: closet3.getObjectByName('rightDoorPivot'),
    });

    // Environmental Storytelling & Puzzles (Babak I)
    const chairFall1 = createFallenChair(textures, 'wood');
    chairFall1.position.set(-2.4, 0, 3.2);
    chairFall1.rotation.y = 0.65;
    root.add(chairFall1);

    const chairFall2 = createFallenChair(textures, 'wood');
    chairFall2.position.set(-10.5, 0, -6.6);
    chairFall2.rotation.y = -0.85;
    root.add(chairFall2);

    const papersHouse = createScatteredPapers(textures);
    papersHouse.position.set(-9.0, 0, -5.6);
    root.add(papersHouse);

    const tippedFrame = createFramedPhoto(textures, true);
    tippedFrame.position.set(1.6, 0, 10.6);
    tippedFrame.rotation.y = -0.4;
    root.add(tippedFrame);

    // Clues (Babak I)
    const addHouseClue = (
      id: string,
      style: 'diary' | 'photo' | 'dossier' | 'flyer' | 'medical',
      x: number,
      z: number,
      ry: number,
      label: string
    ) => {
      const m = createLoreClueProp(textures, style);
      m.position.set(x, 0, z);
      m.rotation.y = ry;
      root.add(m);
      colliders.push({ minX: x - 0.34, maxX: x + 0.34, minZ: z - 0.34, maxZ: z + 0.34 });
      const orb = m.getObjectByName('clueOrb');
      if (orb) animatedObjects.push({ mesh: orb, mode: 'bob' });
      interactables.push({
        id,
        kind: 'clue',
        loreId: id,
        position: new THREE.Vector3(x, 0, z),
        radius: 2.2,
        collected: false,
        label,
        mesh: m,
      });
    };

    addHouseClue('clue_1_photo', 'photo', 2.4, 9.8, -0.5, 'Periksa Foto Syukuran Keluarga');
    addHouseClue('clue_1_calendar', 'medical', -5.6, 5.8, 0.3, 'Baca Kalender Pemulihan DBD & Catatan Listrik');
    addHouseClue('clue_1_diary', 'diary', 10.6, -5.0, -Math.PI / 2, 'Periksa Kartu Berobat di Gudang Timur');
    addHouseClue('clue_1_drawing', 'photo', -7.2, -13.2, 0.4, 'Lihat Buku Gambar Krayon Masa Kecil');

    // Babak I Puzzle: Panel Sekring Lantai Atas in East Storage
    const breakerMesh = createBreakerBoxPuzzle(textures);
    breakerMesh.position.set(6.0, 0, -2.5);
    breakerMesh.rotation.y = -0.2;
    root.add(breakerMesh);
    colliders.push({ minX: 5.58, maxX: 6.42, minZ: -2.85, maxZ: -2.15 });
    interactables.push({
      id: 'puzzle_1_fusebox',
      kind: 'puzzle',
      puzzleId: 'puzzle_1_fusebox',
      position: new THREE.Vector3(6.0, 0, -2.5),
      radius: 2.35,
      collected: false,
      label: 'Atur Panel Sekring Listrik Lantai Atas',
      mesh: breakerMesh,
    });

    // Fragment 1: Nakas with smartphone in West Bedroom
    const phoneMesh = createPhoneNakasFragment(textures);
    phoneMesh.position.set(-10.2, 0, 3.1);
    root.add(phoneMesh);
    colliders.push({ minX: -10.6, maxX: -9.8, minZ: 2.78, maxZ: 3.42 });
    const f1 = phoneMesh.getObjectByName('floatingArtifact');
    if (f1) animatedObjects.push({ mesh: f1, mode: 'bob' });
    interactables.push({
      id: 'frag_1_phone',
      kind: 'fragment',
      position: new THREE.Vector3(-10.2, 0, 3.1),
      radius: 2.3,
      collected: false,
      label: 'Periksa Ponsel di Atas Meja Nakas',
      mesh: phoneMesh,
    });

    // Fragment 2: Kotak Musik Panggilan Ibu in North-West Music Room (Powered by Fusebox Puzzle)
    const musicMesh = createMusicBoxFragment(textures);
    musicMesh.position.set(-9.4, 0, -9.2);
    root.add(musicMesh);
    colliders.push({ minX: -9.72, maxX: -9.08, minZ: -9.52, maxZ: -8.88 });
    const f2 = musicMesh.getObjectByName('floatingArtifact');
    if (f2) animatedObjects.push({ mesh: f2, mode: 'bob' });
    interactables.push({
      id: 'frag_1_music',
      kind: 'fragment',
      lockedByPuzzleId: 'puzzle_1_fusebox',
      position: new THREE.Vector3(-9.4, 0, -9.2),
      radius: 2.3,
      collected: false,
      label: 'Ambil Kotak Musik Panggilan Ibu',
      mesh: musicMesh,
    });

    // Exit: Tembok Es Keheningan
    const iceSeal = createIceWallSeal(textures);
    iceSeal.position.set(0, 0, -20.2);
    iceSeal.scale.set(1.65, 1.05, 1);
    root.add(iceSeal);
    colliders.push({ minX: -2.95, maxX: 2.95, minZ: -20.45, maxZ: -19.95 });
    interactables.push({
      id: 'exit_1',
      kind: 'exit',
      position: new THREE.Vector3(0, 0, -20.2),
      radius: 2.9,
      collected: false,
      label: 'Hadapi Tembok Es Keheningan',
      mesh: iceSeal,
    });

    const stalkerRig = createArticulatedShadow(textures, false);
    stalkerRig.root.position.set(-8.5, 0, -11.5);
    root.add(stalkerRig.root);
    enemies.push({
      rig: stalkerRig,
      waypoints: [
        new THREE.Vector3(-8.5, 0, -11.5),
        new THREE.Vector3(0, 0, -12.2),
        new THREE.Vector3(6.0, 0, -9.2),
        new THREE.Vector3(6.2, 0, -1.2),
        new THREE.Vector3(0, 0, 1.8),
        new THREE.Vector3(-7.5, 0, 2.2),
      ],
      currentWaypoint: 0,
      baseSpeed: (2.2 + frostLevel * 0.85) * speedFactor,
      frozenTimer: 0,
      chasing: false,
      lastWhisperTime: 0,
    });

    return {
      root,
      playerSpawn: new THREE.Vector3(0, 1.65, 13.6),
      playerYaw: 0,
      colliders,
      interactables,
      hidingSpots,
      enemies,
      mannequins,
      animatedObjects,
      curtainMeshes,
      clockHands,
      flickerLights,
      beaconRipples,
      autoDoors,
      storyTriggers,
      envScares,
      bounds: { minX: -12.375, maxX: 12.375, minZ: -20.975, maxZ: 14.975 },
    };
  }

  if (layerIndex === 1) {
    // =========================================================================
    // BABAK II: Kelas Putaran Pensil, Ruang Arsip & Lorong Ruang BK
    // =========================================================================
    const floorMat = new THREE.MeshStandardMaterial({
      map: textures.schoolTile,
      bumpMap: textures.schoolTileBump,
      bumpScale: 0.025,
      roughnessMap: textures.schoolTileRough,
      roughness: 0.58,
      metalness: 0.1,
      color: 0xa4bed4,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: textures.plasterWall,
      bumpMap: textures.plasterWallBump,
      bumpScale: 0.028,
      color: 0x314050,
      roughness: 0.84,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 52), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -9;
    floor.receiveShadow = true;
    root.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 52),
      new THREE.MeshStandardMaterial({ color: 0x0a1017, roughness: 0.9 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.85, -9);
    root.add(ceiling);

    // Lowered ceiling soffits in tight utility & final BK approach
    const tightCeilingA = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 13),
      new THREE.MeshStandardMaterial({ color: 0x070b10, roughness: 0.92 })
    );
    tightCeilingA.rotation.x = Math.PI / 2;
    tightCeilingA.position.set(12.95, 3.25, 4.25);
    const tightCeilingB = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 8.6),
      new THREE.MeshStandardMaterial({ color: 0x070b10, roughness: 0.92 })
    );
    tightCeilingB.rotation.x = Math.PI / 2;
    tightCeilingB.position.set(0, 3.16, -29.5);
    root.add(tightCeilingA, tightCeilingB);

    // Large Main Classroom Perimeter (`x: -10.5..10.5, z: -4.5..15.0`)
    addBoxWall(root, colliders, 0, 1.925, 15.0, 21.4, 3.85, 0.45, wallMat);
    addBoxWall(root, colliders, -10.5, 1.925, 5.25, 0.45, 3.85, 19.5, wallMat);
    // East classroom wall with 2 doorways into East Utility/Locker Storage
    addBoxWall(root, colliders, 10.5, 1.925, 12.4, 0.45, 3.85, 5.2, wallMat);
    addBoxWall(root, colliders, 10.5, 1.925, 4.35, 0.45, 3.85, 5.7, wallMat);
    addBoxWall(root, colliders, 10.5, 1.925, -2.85, 0.45, 3.85, 3.3, wallMat);
    // North classroom wall opening into wide BK corridor (`x: -3.4..3.4`)
    addBoxWall(root, colliders, -6.95, 1.925, -4.5, 7.1, 3.85, 0.45, wallMat);
    addBoxWall(root, colliders, 6.95, 1.925, -4.5, 7.1, 3.85, 0.45, wallMat);

    // East Small Utility & Locker Room (`x: 10.5..15.4, z: -2.0..10.5`)
    addBoxWall(root, colliders, 15.4, 1.65, 4.25, 0.45, 3.3, 12.9, wallMat);
    addBoxWall(root, colliders, 12.95, 1.65, -2.0, 4.9, 3.3, 0.45, wallMat);
    addBoxWall(root, colliders, 12.95, 1.65, 10.5, 4.9, 3.3, 0.45, wallMat);

    // Main BK Corridor (`x: -3.4..3.4, z: -25.5..-4.5`)
    addBoxWall(root, colliders, 3.4, 1.8, -15.0, 0.45, 3.6, 21.0, wallMat);
    addBoxWall(root, colliders, -3.4, 1.8, -12.15, 0.45, 3.6, 15.3, wallMat);
    addBoxWall(root, colliders, -3.4, 1.8, -24.25, 0.45, 3.6, 2.5, wallMat);

    // West Archive / Case Files Room (`x: -12.6..-3.4, z: -25.5..-16.2`)
    addBoxWall(root, colliders, -12.6, 1.7, -20.85, 0.45, 3.4, 9.7, wallMat);
    addBoxWall(root, colliders, -8.0, 1.7, -16.2, 9.2, 3.4, 0.45, wallMat);
    addBoxWall(root, colliders, -8.0, 1.7, -25.5, 9.2, 3.4, 0.45, wallMat);

    // Final Claustrophobic BK Approach (`x: -2.4..2.4, z: -33.6..-25.5`)
    addBoxWall(root, colliders, -2.9, 1.58, -25.5, 1.2, 3.16, 0.45, wallMat);
    addBoxWall(root, colliders, 2.9, 1.58, -25.5, 1.2, 3.16, 0.45, wallMat);
    addBoxWall(root, colliders, -2.4, 1.58, -29.55, 0.45, 3.16, 8.1, wallMat);
    addBoxWall(root, colliders, 2.4, 1.58, -29.55, 0.45, 3.16, 8.1, wallMat);
    addBoxWall(root, colliders, 0, 1.58, -33.6, 5.2, 3.16, 0.45, wallMat);

    // Chalkboard & Erratic Spinning Wall Clock
    const boardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.85, 5.6),
      new THREE.MeshStandardMaterial({ map: textures.chalkboard, roughness: 0.85 })
    );
    boardMesh.position.set(-10.18, 2.05, 5.2);
    boardMesh.rotation.y = Math.PI;
    boardMesh.rotation.x = 0.04;
    root.add(boardMesh);

    const clock = createWallClock(textures);
    clock.position.set(10.18, 2.65, 4.4);
    clock.rotation.y = -Math.PI / 2;
    root.add(clock);
    clockHands.push({
      hour: clock.getObjectByName('clockHour'),
      minute: clock.getObjectByName('clockMinute'),
    });

    // Flickering Fluorescent Tubes across Classroom, Storage, Archive & BK Corridor
    [
      [-4.2, 3.75, 8.5],
      [4.2, 3.75, 2.0],
      [13.0, 3.15, 4.2],
      [0, 3.5, -11.5],
      [-8.0, 3.3, -20.8],
      [0, 3.08, -28.5],
    ].forEach(([fx, fy, fz], idx) => {
      const fl = createFluorescentFixture();
      fl.group.position.set(fx, fy, fz);
      root.add(fl.group);
      flickerLights.push({ light: fl.light, tubeMat: fl.tubeMat, seed: idx * 3.7 + 1.1 });
    });

    // 18 Sets of School Desks & Chairs arranged in wide classroom columns
    const deskCoords: [number, number][] = [
      [-8.2, 11.2],
      [-8.2, 8.2],
      [-8.2, 5.2],
      [-8.2, 2.2],
      [-8.2, -0.8],
      [-5.6, 11.2],
      [-5.6, 8.2],
      [-5.6, 2.2],
      [-5.6, -0.8],
      [5.6, 11.2],
      [5.6, 8.2],
      [5.6, 2.2],
      [5.6, -0.8],
      [8.2, 11.2],
      [8.2, 8.2],
      [8.2, 5.2],
      [8.2, 2.2],
      [8.2, -0.8],
    ];
    deskCoords.forEach(([dx, dz], idx) => {
      const desk = createSchoolDeskAndChair(textures, idx % 2 === 0);
      desk.position.set(dx, 0, dz);
      desk.rotation.y = dx < 0 ? 0.14 : -0.14;
      root.add(desk);
      colliders.push({ minX: dx - 0.48, maxX: dx + 0.48, minZ: dz - 0.35, maxZ: dz + 0.65 });
    });

    // Giant Rotating Pointed Pencil at center
    const giantPencil = createGiantPencil(textures);
    giantPencil.position.set(0, 0, 5.2);
    root.add(giantPencil);
    colliders.push({ minX: -0.7, maxX: 0.7, minZ: 4.5, maxZ: 5.9 });
    const spinner = giantPencil.getObjectByName('giantPencilSpinner');
    if (spinner) animatedObjects.push({ mesh: spinner, mode: 'pencil' });

    const pencilLight = new THREE.PointLight(0xd4a353, 2.1, 10.5, 2);
    pencilLight.position.set(0, 3.2, 5.2);
    root.add(pencilLight);

    // 6 Articulated Classroom Mannequins in a wider circle
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.35;
      const mx = Math.cos(ang) * 3.7;
      const mz = 5.2 + Math.sin(ang) * 3.7;
      const man = createArticulatedPerson(textures, {
        role: 'mannequin',
        jacketHex: 0x94a3b8,
        pantsHex: 0x475569,
        skinHex: 0xcbd5e1,
        hairHex: 0x64748b,
        withPleatedSkirt: i % 2 === 0,
      });
      man.root.position.set(mx, 0, mz);
      man.root.lookAt(0, 0, 5.2);
      man.head.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.22;
      root.add(man.root);
      mannequins.push(man);
      colliders.push({ minX: mx - 0.35, maxX: mx + 0.35, minZ: mz - 0.35, maxZ: mz + 0.35 });
    }

    // West Archive Room & East Storage Props
    const archiveDesk = createStudyDeskWithBooks(textures);
    archiveDesk.position.set(-6.5, 0, -23.8);
    root.add(archiveDesk);
    colliders.push({ minX: -7.25, maxX: -5.75, minZ: -24.2, maxZ: -23.4 });

    [
      [-11.6, -24.0, 0],
      [-10.2, -24.5, 0],
    ].forEach(([cx, cz, ry]) => {
      const cab = createFilingCabinet(textures);
      cab.position.set(cx, 0, cz);
      cab.rotation.y = ry;
      root.add(cab);
      colliders.push({ minX: cx - 0.32, maxX: cx + 0.32, minZ: cz - 0.34, maxZ: cz + 0.34 });
    });

    const eastRack = createStorageRack(textures);
    eastRack.position.set(13.6, 0, 8.6);
    root.add(eastRack);
    colliders.push({ minX: 12.85, maxX: 14.35, minZ: 8.28, maxZ: 8.92 });

    // Environmental Jumpscare: Mannequin heads snap to stare at Bima near classroom exit
    envScares.push({
      id: 'env_mannequins',
      kind: 'mannequins',
      position: new THREE.Vector3(0, 0, -3.2),
      radius: 2.4,
      fired: false,
      focusTarget: new THREE.Vector3(0, 1.55, 5.2),
    });

    storyTriggers.push({
      id: 'bk_hallway',
      position: new THREE.Vector3(0, 0, -14.2),
      radius: 2.6,
      fired: false,
    });

    // Lockers (hiding spots & corridor atmosphere)
    const locker1 = createHidingCloset(textures, 'locker');
    locker1.position.set(14.4, 0, 3.8);
    locker1.rotation.y = -Math.PI / 2;
    root.add(locker1);
    colliders.push({ minX: 13.92, maxX: 14.88, minZ: 3.22, maxZ: 4.38 });
    hidingSpots.push({
      id: 'hide_2_a',
      position: new THREE.Vector3(14.4, 0, 3.8),
      lookOutYaw: Math.PI / 2,
      label: 'Loker Ruang Alat Timur',
      mesh: locker1,
    });

    const locker2 = createHidingCloset(textures, 'locker');
    locker2.position.set(-11.4, 0, -18.0);
    locker2.rotation.y = Math.PI / 2;
    root.add(locker2);
    colliders.push({ minX: -11.88, maxX: -10.92, minZ: -18.58, maxZ: -17.42 });
    hidingSpots.push({
      id: 'hide_2_b',
      position: new THREE.Vector3(-11.4, 0, -18.0),
      lookOutYaw: -Math.PI / 2,
      label: 'Loker Ruang Arsip',
      mesh: locker2,
    });

    const locker3 = createHidingCloset(textures, 'locker');
    locker3.position.set(-2.6, 0, -14.8);
    locker3.rotation.y = Math.PI / 2;
    root.add(locker3);
    colliders.push({ minX: -3.05, maxX: -2.15, minZ: -15.38, maxZ: -14.22 });
    hidingSpots.push({
      id: 'hide_2_c',
      position: new THREE.Vector3(-2.6, 0, -14.8),
      lookOutYaw: -Math.PI / 2,
      label: 'Loker Koridor BK',
      mesh: locker3,
    });

    // Decorative dented corridor lockers along East corridor wall
    [-9.5, -14.5, -21.5].forEach((lz) => {
      const decL = createHidingCloset(textures, 'locker');
      decL.position.set(2.68, 0, lz);
      decL.rotation.y = -Math.PI / 2;
      root.add(decL);
      colliders.push({ minX: 2.22, maxX: 3.14, minZ: lz - 0.56, maxZ: lz + 0.56 });
    });

    // Environmental Storytelling & Puzzles (Babak II)
    const schoolChairFall = createFallenChair(textures, 'school');
    schoolChairFall.position.set(3.4, 0, -1.2);
    schoolChairFall.rotation.y = 0.7;
    root.add(schoolChairFall);

    const archiveChairFall = createFallenChair(textures, 'school');
    archiveChairFall.position.set(-4.6, 0, -23.8);
    archiveChairFall.rotation.y = -0.9;
    root.add(archiveChairFall);

    const papersSchool = createScatteredPapers(textures);
    papersSchool.position.set(-0.6, 0, -1.8);
    root.add(papersSchool);

    const papersArchive = createScatteredPapers(textures);
    papersArchive.position.set(-8.6, 0, -23.2);
    root.add(papersArchive);

    const addSchoolClue = (
      id: string,
      style: 'diary' | 'photo' | 'dossier' | 'flyer' | 'medical',
      x: number,
      z: number,
      ry: number,
      label: string
    ) => {
      const m = createLoreClueProp(textures, style);
      m.position.set(x, 0, z);
      m.rotation.y = ry;
      root.add(m);
      colliders.push({ minX: x - 0.34, maxX: x + 0.34, minZ: z - 0.34, maxZ: z + 0.34 });
      const orb = m.getObjectByName('clueOrb');
      if (orb) animatedObjects.push({ mesh: orb, mode: 'bob' });
      interactables.push({
        id,
        kind: 'clue',
        loreId: id,
        position: new THREE.Vector3(x, 0, z),
        radius: 2.2,
        collected: false,
        label,
        mesh: m,
      });
    };

    addSchoolClue('clue_2_seating', 'dossier', -2.8, 10.5, 0.25, 'Periksa Denah Bangku Kelas');
    addSchoolClue('clue_2_janitor', 'diary', 12.8, 0.2, -0.4, 'Baca Buku Piket Penjaga Sekolah');
    addSchoolClue('clue_2_dossier', 'dossier', -6.0, -17.8, 0.3, 'Periksa Map Kuning Arsip BK');
    addSchoolClue('clue_2_tally', 'diary', 2.2, -18.2, -Math.PI / 2, 'Baca Catatan Pita Nama di Lorong BK');

    // Babak II Puzzle: Brankas Arsip Terkunci in West Archive
    const safeMesh = createKeypadSafePuzzle(textures, 'safe');
    safeMesh.position.set(-11.2, 0, -21.2);
    safeMesh.rotation.y = Math.PI / 2;
    root.add(safeMesh);
    colliders.push({ minX: -11.62, maxX: -10.78, minZ: -21.58, maxZ: -20.82 });
    interactables.push({
      id: 'puzzle_2_archive',
      kind: 'puzzle',
      puzzleId: 'puzzle_2_archive',
      position: new THREE.Vector3(-11.2, 0, -21.2),
      radius: 2.4,
      collected: false,
      label: 'Buka Kunci Kombinasi Brankas Arsip BK',
      mesh: safeMesh,
    });

    // Fragment 1 & 2
    const noteMesh = createPaperNoteFragment(textures);
    noteMesh.position.set(-6.8, 0, -2.5);
    root.add(noteMesh);
    colliders.push({ minX: -7.28, maxX: -6.32, minZ: -2.85, maxZ: -2.15 });
    const f1 = noteMesh.getObjectByName('floatingArtifact');
    if (f1) animatedObjects.push({ mesh: f1, mode: 'bob' });
    interactables.push({
      id: 'frag_2_note',
      kind: 'fragment',
      position: new THREE.Vector3(-6.8, 0, -2.5),
      radius: 2.3,
      collected: false,
      label: 'Ambil Catatan Undian Putaran Pensil',
      mesh: noteMesh,
    });

    const badgeMesh = createBadgeFragment(textures);
    badgeMesh.position.set(-8.8, 0, -21.0);
    root.add(badgeMesh);
    colliders.push({ minX: -9.12, maxX: -8.48, minZ: -21.32, maxZ: -20.68 });
    const f2 = badgeMesh.getObjectByName('floatingArtifact');
    if (f2) animatedObjects.push({ mesh: f2, mode: 'bob' });
    interactables.push({
      id: 'frag_2_badge',
      kind: 'fragment',
      lockedByPuzzleId: 'puzzle_2_archive',
      position: new THREE.Vector3(-8.8, 0, -21.0),
      radius: 2.3,
      collected: false,
      label: 'Periksa Berkas Laporan Sekolah Membeku',
      mesh: badgeMesh,
    });

    // Exit: Double Wooden Ruang BK Door with Rusted 3D Chains & Padlock
    const chainedDoor = createChainedBKDoor(textures);
    chainedDoor.position.set(0, 0, -32.9);
    root.add(chainedDoor);
    interactables.push({
      id: 'exit_2',
      kind: 'exit',
      position: new THREE.Vector3(0, 0, -32.9),
      radius: 2.8,
      collected: false,
      label: 'Buka Rantai Pintu Ruang BK',
      mesh: chainedDoor,
    });

    const authRig = createArticulatedShadow(textures, true);
    authRig.root.position.set(0, 0, -27.5);
    root.add(authRig.root);
    enemies.push({
      rig: authRig,
      waypoints: [
        new THREE.Vector3(0, 0, -28.0),
        new THREE.Vector3(0, 0, -17.5),
        new THREE.Vector3(-7.2, 0, -20.8),
        new THREE.Vector3(0, 0, -9.5),
        new THREE.Vector3(-4.2, 0, 1.2),
        new THREE.Vector3(4.2, 0, 1.2),
        new THREE.Vector3(12.6, 0, 3.8),
      ],
      currentWaypoint: 0,
      baseSpeed: (2.3 + frostLevel * 0.9) * speedFactor,
      frozenTimer: 0,
      chasing: false,
      lastWhisperTime: 0,
    });

    return {
      root,
      playerSpawn: new THREE.Vector3(0, 1.65, 13.0),
      playerYaw: 0,
      colliders,
      interactables,
      hidingSpots,
      enemies,
      mannequins,
      animatedObjects,
      curtainMeshes,
      clockHands,
      flickerLights,
      beaconRipples,
      autoDoors,
      storyTriggers,
      envScares,
      bounds: { minX: -15.175, maxX: 15.175, minZ: -33.375, maxZ: 14.775 },
    };
  }

  if (layerIndex === 2) {
    // =========================================================================
    // BABAK III: Labirin Piksel, Kamar Terpecah & Lorong Fitnah
    // =========================================================================
    const floorMat = new THREE.MeshStandardMaterial({
      map: textures.mirrorGrid,
      bumpMap: textures.schoolTileBump,
      bumpScale: 0.018,
      roughness: 0.25,
      metalness: 0.45,
      color: 0x94a3b8,
    });
    const glassWallMat = new THREE.MeshPhysicalMaterial({
      map: textures.plasterWall,
      bumpMap: textures.plasterWallBump,
      bumpScale: 0.025,
      color: 0x1e293b,
      emissive: 0x1a152e,
      emissiveIntensity: 0.35,
      roughness: 0.16,
      metalness: 0.68,
      clearcoat: 0.85,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 54), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -10.5;
    floor.receiveShadow = true;
    root.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 54),
      new THREE.MeshStandardMaterial({ color: 0x080710, roughness: 0.9 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 3.85, -10.5);
    root.add(ceiling);

    // Lowered ceiling soffit inside final slander corridor
    const slanderCeiling = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 14.5),
      new THREE.MeshStandardMaterial({ color: 0x050409, roughness: 0.92 })
    );
    slanderCeiling.rotation.x = Math.PI / 2;
    slanderCeiling.position.set(0, 3.25, -29.2);
    root.add(slanderCeiling);

    // Outer Labyrinth Perimeter (`x: -15.4..15.4, z: -22.2..15.0`)
    addBoxWall(root, colliders, 0, 1.925, 15.0, 31.2, 3.85, 0.45, glassWallMat);
    addBoxWall(root, colliders, -15.4, 1.925, -3.6, 0.45, 3.85, 37.6, glassWallMat);
    addBoxWall(root, colliders, 15.4, 1.925, -3.6, 0.45, 3.85, 37.6, glassWallMat);

    // Galeri Cermin Entry Baffles (`z = 5.5`, central passage open `x: -4.5..4.5`)
    addBoxWall(root, colliders, -9.75, 1.925, 5.5, 10.5, 3.85, 0.38, glassWallMat);
    addBoxWall(root, colliders, 9.75, 1.925, 5.5, 10.5, 3.85, 0.38, glassWallMat);

    // West Small Room: Kamar Pesan Malam (`x: -15.4..-7.5, z: -6.5..5.5`)
    addBoxWall(root, colliders, -7.5, 1.925, -0.5, 0.38, 3.85, 6.0, glassWallMat);
    addBoxWall(root, colliders, -12.8, 1.925, -6.5, 4.8, 3.85, 0.38, glassWallMat);

    // Central Multi-Path Glass Partitions
    addBoxWall(root, colliders, -3.6, 1.925, -5.0, 0.38, 3.85, 7.0, glassWallMat);
    addBoxWall(root, colliders, 3.6, 1.925, -7.0, 0.38, 3.85, 7.0, glassWallMat);
    addBoxWall(root, colliders, 0, 1.925, -14.5, 14.0, 3.85, 0.38, glassWallMat);

    // East Medium Room: Ruang Suar (`x: 7.5..15.4, z: -16.5..-5.5`)
    addBoxWall(root, colliders, 12.8, 1.925, -5.5, 4.8, 3.85, 0.38, glassWallMat);
    addBoxWall(root, colliders, 7.5, 1.925, -11.0, 0.38, 3.85, 5.0, glassWallMat);

    // Slamming Door Partition Wall (`z = -22.2`) & Narrow Final Slander Corridor (`z: -36.2..-22.2`)
    addBoxWall(root, colliders, -9.45, 1.925, -22.2, 12.1, 3.85, 0.45, glassWallMat);
    addBoxWall(root, colliders, 9.45, 1.925, -22.2, 12.1, 3.85, 0.45, glassWallMat);
    addBoxWall(root, colliders, -2.65, 1.65, -22.2, 1.5, 3.3, 0.45, glassWallMat);
    addBoxWall(root, colliders, 2.65, 1.65, -22.2, 1.5, 3.3, 0.45, glassWallMat);
    addBoxWall(root, colliders, -3.4, 1.65, -29.2, 0.45, 3.3, 14.0, glassWallMat);
    addBoxWall(root, colliders, 3.4, 1.65, -29.2, 0.45, 3.3, 14.0, glassWallMat);
    addBoxWall(root, colliders, 0, 1.65, -36.2, 7.2, 3.3, 0.45, glassWallMat);

    // Cracked Wall Mirror Frames & Shattered Dressing Vanity
    const mirrorFrames: THREE.Group[] = [];
    [
      [-15.0, 10.2, Math.PI / 2],
      [15.0, 10.2, -Math.PI / 2],
      [-3.2, -5.0, Math.PI / 2],
      [3.2, -7.0, -Math.PI / 2],
      [-15.0, -14.2, Math.PI / 2],
      [-3.0, -28.0, Math.PI / 2],
    ].forEach(([mx, mz, ry]) => {
      const mFrame = createCrackedMirrorFrame(textures);
      mFrame.position.set(mx, 0, mz);
      mFrame.rotation.y = ry;
      root.add(mFrame);
      mirrorFrames.push(mFrame);
    });

    const vanity = createShatteredVanity(textures);
    vanity.position.set(11.5, 0, 11.4);
    vanity.rotation.y = -Math.PI / 2;
    root.add(vanity);
    colliders.push({ minX: 10.9, maxX: 12.1, minZ: 10.6, maxZ: 12.2 });

    const vanity2 = createShatteredVanity(textures);
    vanity2.position.set(-11.5, 0, 11.4);
    vanity2.rotation.y = Math.PI / 2;
    root.add(vanity2);
    colliders.push({ minX: -12.1, maxX: -10.9, minZ: 10.6, maxZ: 12.2 });

    // Hinged double wooden doors spanning full 3.8m doorway (`x: -1.9..+1.9`) at Z = -22.2
    const doorMat = new THREE.MeshStandardMaterial({
      map: textures.frostedWood,
      bumpMap: textures.frostedWoodBump,
      bumpScale: 0.018,
      color: 0x3f2a22,
      roughness: 0.65,
    });
    const knobMat = new THREE.MeshStandardMaterial({ color: 0xd4a353, metalness: 0.9, roughness: 0.2 });

    const createCorridorDoorLeaf = (hingeX: number, sign: 1 | -1, openYaw: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(hingeX, 0, -22.2);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.88, 3.24, 0.16), doorMat);
      leaf.position.set(sign * 0.94, 1.62, 0);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), knobMat);
      knob.position.set(sign * 1.68, 1.08, 0.12);
      pivot.rotation.y = openYaw;
      pivot.add(leaf, knob);
      root.add(pivot);
      autoDoors.push({
        triggerZ: -23.2,
        triggered: false,
        pivot,
        targetYaw: openYaw,
        openYaw,
        closedYaw: 0,
        hingeX,
        hingeZ: -22.2,
        leafLength: 1.88,
        directionSign: sign,
      });
    };

    // Leaves open northward into corridor walls (leaving central 2.4m+ passage clear)
    createCorridorDoorLeaf(-1.9, 1, 1.18);
    createCorridorDoorLeaf(1.9, -1, -1.18);

    storyTriggers.push({
      id: 'slam_house',
      position: new THREE.Vector3(0, 0, -23.8),
      radius: 2.6,
      fired: false,
    });
    storyTriggers.push({
      id: 'whisper_corridor',
      position: new THREE.Vector3(0, 0, -29.8),
      radius: 2.6,
      fired: false,
    });

    // Multiple Floating KBGO Glitch Smartphone Screens across the expanded maze
    const screenCoords: { x: number; z: number; ry: number; m: 'A' | 'B' }[] = [
      { x: -6.4, z: 9.2, ry: 0.45, m: 'A' },
      { x: 6.4, z: 9.2, ry: -0.45, m: 'B' },
      { x: -9.8, z: -12.0, ry: 0.5, m: 'A' },
      { x: 5.5, z: -2.0, ry: -0.5, m: 'B' },
      { x: 10.5, z: -18.5, ry: -0.6, m: 'A' },
      { x: -2.8, z: -26.5, ry: Math.PI / 2, m: 'B' },
      { x: 2.8, z: -31.0, ry: -Math.PI / 2, m: 'A' },
    ];
    screenCoords.forEach((sc) => {
      const scr = createKbgoScreen(textures, sc.m);
      scr.position.set(sc.x, 0, sc.z);
      scr.rotation.y = sc.ry;
      root.add(scr);
      animatedObjects.push({ mesh: scr, mode: 'bob' });
    });

    // Environmental Jumpscare: Giant Glitch Face Phone Screen Ambush near central hub
    const ambushScreen = createKbgoScreen(textures, 'ambush');
    ambushScreen.position.set(-1.6, 0, -4.5);
    ambushScreen.rotation.y = 0.22;
    ambushScreen.visible = false;
    root.add(ambushScreen);
    envScares.push({
      id: 'env_glitchphone',
      kind: 'glitchPhone',
      position: new THREE.Vector3(-0.6, 0, -1.8),
      radius: 2.5,
      fired: false,
      focusTarget: new THREE.Vector3(-1.6, 1.75, -4.5),
      glitchScreenGroup: ambushScreen,
    });

    // Hiding Alcoves
    const hideA = createHidingCloset(textures, 'mirror');
    hideA.position.set(14.1, 0, 7.8);
    hideA.rotation.y = -Math.PI / 2;
    root.add(hideA);
    colliders.push({ minX: 13.62, maxX: 14.58, minZ: 7.22, maxZ: 8.38 });
    hidingSpots.push({
      id: 'hide_3_a',
      position: new THREE.Vector3(14.1, 0, 7.8),
      lookOutYaw: Math.PI / 2,
      label: 'Sekat Kaca Selatan',
      mesh: hideA,
    });

    const hideB = createHidingCloset(textures, 'mirror');
    hideB.position.set(14.1, 0, -14.2);
    hideB.rotation.y = -Math.PI / 2;
    root.add(hideB);
    colliders.push({ minX: 13.62, maxX: 14.58, minZ: -14.78, maxZ: -13.62 });
    hidingSpots.push({
      id: 'hide_3_b',
      position: new THREE.Vector3(14.1, 0, -14.2),
      lookOutYaw: Math.PI / 2,
      label: 'Sekat Kaca Ruang Suar',
      mesh: hideB,
    });

    const hideC = createHidingCloset(textures, 'mirror');
    hideC.position.set(-14.1, 0, -14.2);
    hideC.rotation.y = Math.PI / 2;
    root.add(hideC);
    colliders.push({ minX: -14.58, maxX: -13.62, minZ: -14.78, maxZ: -13.62 });
    hidingSpots.push({
      id: 'hide_3_c',
      position: new THREE.Vector3(-14.1, 0, -14.2),
      lookOutYaw: -Math.PI / 2,
      label: 'Sekat Kaca Barat',
      mesh: hideC,
    });

    // Environmental Storytelling & Puzzles (Babak III)
    const mirrorChair = createFallenChair(textures, 'wood');
    mirrorChair.position.set(-8.5, 0, 12.0);
    mirrorChair.rotation.y = 0.55;
    root.add(mirrorChair);

    const papersSlander = createScatteredPapers(textures);
    papersSlander.position.set(-6.4, 0, -19.2);
    root.add(papersSlander);

    const addMirrorClue = (
      id: string,
      style: 'diary' | 'photo' | 'dossier' | 'flyer' | 'medical',
      x: number,
      z: number,
      ry: number,
      label: string
    ) => {
      const m = createLoreClueProp(textures, style);
      m.position.set(x, 0, z);
      m.rotation.y = ry;
      root.add(m);
      colliders.push({ minX: x - 0.34, maxX: x + 0.34, minZ: z - 0.34, maxZ: z + 0.34 });
      const orb = m.getObjectByName('clueOrb');
      if (orb) animatedObjects.push({ mesh: orb, mode: 'bob' });
      interactables.push({
        id,
        kind: 'clue',
        loreId: id,
        position: new THREE.Vector3(x, 0, z),
        radius: 2.25,
        collected: false,
        label,
        mesh: m,
      });
    };

    addMirrorClue('clue_3_vanity', 'diary', 8.5, 12.2, -0.45, 'Baca Memo Meja Rias Pecah');
    addMirrorClue('clue_3_chat', 'dossier', -13.8, 3.6, 0.5, 'Periksa Salinan Log Ancaman 04:19');
    addMirrorClue('clue_3_flyer', 'flyer', 5.4, -19.2, -0.35, 'Baca Selebaran Fitnah & Catatan Bima');
    addMirrorClue('clue_3_bracelet', 'diary', 13.8, -8.2, -0.6, 'Periksa Gelang Putus & Pin Share-Loc');

    // Babak III Puzzle: Terminal Dekripsi Suar Share-Loc in East Ruang Suar
    const terminalMesh = createKeypadSafePuzzle(textures, 'terminal');
    terminalMesh.position.set(9.2, 0, -7.2);
    terminalMesh.rotation.y = -0.35;
    root.add(terminalMesh);
    colliders.push({ minX: 8.78, maxX: 9.62, minZ: -7.58, maxZ: -6.82 });
    interactables.push({
      id: 'puzzle_3_terminal',
      kind: 'puzzle',
      puzzleId: 'puzzle_3_terminal',
      position: new THREE.Vector3(9.2, 0, -7.2),
      radius: 2.4,
      collected: false,
      label: 'Dekripsi Terminal Firewall Suar Share-Loc',
      mesh: terminalMesh,
    });

    const kbgoPhone = createPhoneNakasFragment(textures);
    kbgoPhone.position.set(-11.8, 0, -0.5);
    root.add(kbgoPhone);
    colliders.push({ minX: -12.2, maxX: -11.4, minZ: -0.82, maxZ: -0.18 });
    const f1 = kbgoPhone.getObjectByName('floatingArtifact');
    if (f1) animatedObjects.push({ mesh: f1, mode: 'bob' });
    interactables.push({
      id: 'frag_3_kbgo',
      kind: 'fragment',
      position: new THREE.Vector3(-11.8, 0, -0.5),
      radius: 2.3,
      collected: false,
      label: 'Amankan Bukti Pesan PAP & Rekayasa AI',
      mesh: kbgoPhone,
    });

    const shareBeacon = createShareLocBeacon(textures);
    shareBeacon.position.set(11.6, 0, -10.5);
    root.add(shareBeacon);
    colliders.push({ minX: 11.18, maxX: 12.02, minZ: -10.92, maxZ: -10.08 });
    const f2 = shareBeacon.getObjectByName('floatingArtifact');
    if (f2) animatedObjects.push({ mesh: f2, mode: 'spinY' });
    const rip2 = shareBeacon.getObjectByName('beaconRipple');
    if (rip2) beaconRipples.push(rip2);
    interactables.push({
      id: 'frag_3_shareloc',
      kind: 'fragment',
      lockedByPuzzleId: 'puzzle_3_terminal',
      position: new THREE.Vector3(11.6, 0, -10.5),
      radius: 2.4,
      collected: false,
      label: 'Aktifkan Suar Biru Share-Loc Penyelamatan',
      mesh: shareBeacon,
    });

    const exitBeacon = createShareLocBeacon(textures);
    exitBeacon.position.set(0, 0, -34.8);
    root.add(exitBeacon);
    const ripExit = exitBeacon.getObjectByName('beaconRipple');
    if (ripExit) beaconRipples.push(ripExit);
    interactables.push({
      id: 'exit_3',
      kind: 'exit',
      position: new THREE.Vector3(0, 0, -34.8),
      radius: 2.8,
      collected: false,
      label: 'Tembus Lorong Fitnah Menuju Sudut Kampus',
      mesh: exitBeacon,
    });

    const stalkerA = createArticulatedShadow(textures, false);
    stalkerA.root.position.set(9.2, 0, 2.2);
    root.add(stalkerA.root);
    enemies.push({
      rig: stalkerA,
      waypoints: [
        new THREE.Vector3(9.2, 0, 2.2),
        new THREE.Vector3(-10.5, 0, 2.2),
        new THREE.Vector3(-10.5, 0, -11.5),
        new THREE.Vector3(-10.5, 0, -18.5),
        new THREE.Vector3(10.5, 0, -18.5),
        new THREE.Vector3(10.5, 0, -8.5),
        new THREE.Vector3(0, 0, 1.5),
      ],
      currentWaypoint: 0,
      baseSpeed: (2.4 + frostLevel * 0.85) * speedFactor,
      frozenTimer: 0,
      chasing: false,
      lastWhisperTime: 0,
    });

    const stalkerB = createArticulatedShadow(textures, true);
    stalkerB.root.position.set(0, 0, -28.5);
    root.add(stalkerB.root);
    enemies.push({
      rig: stalkerB,
      waypoints: [
        new THREE.Vector3(-2.0, 0, -27.5),
        new THREE.Vector3(2.0, 0, -27.5),
        new THREE.Vector3(0, 0, -33.2),
      ],
      currentWaypoint: 0,
      baseSpeed: (2.25 + frostLevel * 0.85) * speedFactor,
      frozenTimer: 0,
      chasing: false,
      lastWhisperTime: 0,
    });

    return {
      root,
      playerSpawn: new THREE.Vector3(0, 1.65, 13.4),
      playerYaw: 0,
      colliders,
      interactables,
      hidingSpots,
      enemies,
      mannequins,
      animatedObjects,
      curtainMeshes,
      clockHands,
      flickerLights,
      beaconRipples,
      autoDoors,
      storyTriggers,
      envScares,
      mirrorFrames,
      bounds: { minX: -15.175, maxX: 15.175, minZ: -35.975, maxZ: 14.775 },
    };
  }

  // =========================================================================
  // BABAK IV: Kubah Kaca di Sudut Kampus (Expanded Plaza + Layered Cityscape)
  // =========================================================================
  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.campusStone,
    bumpMap: textures.campusStoneBump,
    bumpScale: 0.03,
    roughness: 0.78,
    metalness: 0.05,
    color: 0xa9c5df,
  });

  const campusGround = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), groundMat);
  campusGround.rotation.x = -Math.PI / 2;
  campusGround.receiveShadow = true;
  root.add(campusGround);

  const pathMat = new THREE.MeshStandardMaterial({ color: 0x243447, roughness: 0.68, metalness: 0.12 });
  const pathNS = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.04, 54), pathMat);
  pathNS.position.y = 0.025;
  const pathEW = new THREE.Mesh(new THREE.BoxGeometry(54, 0.04, 3.6), pathMat);
  pathEW.position.y = 0.025;
  const plazaRing = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.8, 0.06, 32), pathMat);
  plazaRing.position.y = 0.03;
  root.add(pathNS, pathEW, plazaRing);

  // Diagonal stone garden walkways to the 4 distinct corner zones
  [Math.PI / 4, -Math.PI / 4].forEach((rot) => {
    const diag = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.032, 46), pathMat);
    diag.position.y = 0.018;
    diag.rotation.y = rot;
    root.add(diag);
  });

  root.add(
    createSnowMoundsAndGrass(textures, [
      [-7.5, 6.5],
      [7.5, 6.5],
      [-7.5, -6.5],
      [7.5, -6.5],
      [-18.5, 10.5],
      [18.5, -10.5],
      [-19.5, -9.5],
      [18.5, 10.0],
    ])
  );

  // Main Faculty Building + 360-Degree Layered Urban Cityscape
  const faculty = createFacultyBuilding(textures);
  faculty.position.set(0, 0, -35.5);
  root.add(faculty);

  const cityscape = buildLayeredCityscape(textures, {
    innerClearRadius: 30,
    isWarmDay: false,
  });
  root.add(cityscape.root);

  // Asymmetric Campus Zone Props
  // SW Memorial Bench Garden
  const memorialBench = createParkBench(textures);
  memorialBench.position.set(-18.8, 0, 16.5);
  memorialBench.rotation.y = 0.72;
  root.add(memorialBench);
  colliders.push({ minX: -19.8, maxX: -17.8, minZ: 15.7, maxZ: 17.3 });

  // SE Bulletin Board & Campus Trash Bin near Satgas Pillar II
  const bulletin = createCampusBulletinBoard(textures);
  bulletin.position.set(4.6, 0, 18.8);
  bulletin.rotation.y = -0.35;
  root.add(bulletin);
  colliders.push({ minX: 3.55, maxX: 5.65, minZ: 18.45, maxZ: 19.15 });

  const bulletinEast = createCampusBulletinBoard(textures);
  bulletinEast.position.set(18.5, 0, 16.2);
  bulletinEast.rotation.y = -0.78;
  root.add(bulletinEast);
  colliders.push({ minX: 17.5, maxX: 19.5, minZ: 15.2, maxZ: 17.2 });

  const trash = createCampusTrashBin(textures);
  trash.position.set(-3.0, 0, 18.5);
  root.add(trash);
  colliders.push({ minX: -3.3, maxX: -2.7, minZ: 18.2, maxZ: 18.8 });

  // NE Colonnade Stone Pillars framing Pillar III
  [
    [13.0, -17.5],
    [18.2, -12.0],
  ].forEach(([ax, az]) => {
    const col = createArchitecturalPillar(textures, 3.2, 0x334155);
    col.position.set(ax, 0, az);
    root.add(col);
    colliders.push({ minX: ax - 0.34, maxX: ax + 0.34, minZ: az - 0.34, maxZ: az + 0.34 });
  });

  // Perimeter wrought-iron fence & pillars at ±27.8
  const pillarStoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.7 });
  for (let i = -4; i <= 4; i++) {
    const offset = i * 6.8;
    [
      [offset, -27.8],
      [offset, 27.8],
      [-27.8, offset],
      [27.8, offset],
    ].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.2, 0.65), pillarStoneMat);
      col.position.set(px, 1.1, pz);
      root.add(col);
    });
  }
  const fenceN = new THREE.Mesh(new THREE.BoxGeometry(55.6, 0.9, 0.12), railMat);
  fenceN.position.set(0, 0.75, -27.8);
  const fenceS = fenceN.clone();
  fenceS.position.set(0, 0.75, 27.8);
  const fenceW = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 55.6), railMat);
  fenceW.position.set(-27.8, 0.75, 0);
  const fenceE = fenceW.clone();
  fenceE.position.set(27.8, 0.75, 0);
  root.add(fenceN, fenceS, fenceW, fenceE);

  [
    [-19.5, -18.5],
    [20.5, -18.5],
    [-21.0, 18.5],
    [21.0, 18.5],
    [-24.0, -7.5],
    [24.0, 7.5],
    [-12.0, -23.0],
    [12.0, -23.0],
    [-23.5, 11.5],
    [23.5, -11.5],
  ].forEach(([tx, tz], idx) => {
    const tree = createWinterTree(textures);
    tree.position.set(tx, 0, tz);
    tree.rotation.y = idx * 1.1;
    root.add(tree);
  });

  [
    [-5.5, -20.5],
    [5.5, -20.5],
    [-20.5, 5.5],
    [20.5, -5.5],
    [-5.5, 20.5],
    [5.5, 20.5],
  ].forEach(([lx, lz]) => {
    const lamp = createClassicStreetlamp(textures, false);
    lamp.position.set(lx, 0, lz);
    root.add(lamp);
  });

  const domeController = createGlassDomeWithRindi(textures, isSoftwareGl);
  domeController.group.position.set(0, 0, 0);
  root.add(domeController.group);
  colliders.push({ minX: -2.4, maxX: 2.4, minZ: -2.4, maxZ: 2.4 });

  const shelterW = createHidingCloset(textures, 'locker');
  shelterW.position.set(-21.5, 0, 0);
  shelterW.rotation.y = Math.PI / 2;
  root.add(shelterW);
  colliders.push({ minX: -21.98, maxX: -21.02, minZ: -0.6, maxZ: 0.6 });
  hidingSpots.push({
    id: 'hide_4_w',
    position: new THREE.Vector3(-21.5, 0, 0),
    lookOutYaw: -Math.PI / 2,
    label: 'Pos Perlindungan Barat',
    mesh: shelterW,
  });

  const shelterE = createHidingCloset(textures, 'locker');
  shelterE.position.set(21.5, 0, 0);
  shelterE.rotation.y = -Math.PI / 2;
  root.add(shelterE);
  colliders.push({ minX: 21.02, maxX: 21.98, minZ: -0.6, maxZ: 0.6 });
  hidingSpots.push({
    id: 'hide_4_e',
    position: new THREE.Vector3(21.5, 0, 0),
    lookOutYaw: Math.PI / 2,
    label: 'Pos Perlindungan Timur',
    mesh: shelterE,
  });

  const pillarConfigs = [
    {
      id: 'pillar_1',
      pos: new THREE.Vector3(-15.5, 0, 14.5),
      color: 0xd4a353,
      label: 'Nyalakan Pilar I: Keberanian Bersuara & Lingkar Terdekat',
    },
    {
      id: 'pillar_2',
      pos: new THREE.Vector3(15.5, 0, 13.5),
      color: 0x78a9c4,
      label: 'Nyalakan Pilar II: Ruang Aman & Satgas PPKS Proaktif',
    },
    {
      id: 'pillar_3',
      pos: new THREE.Vector3(15.5, 0, -14.5),
      color: 0xc26d43,
      label: 'Nyalakan Pilar III: Keadilan & Sanksi Tegas Tanpa Kompromi',
    },
    {
      id: 'pillar_4',
      pos: new THREE.Vector3(-15.5, 0, -14.5),
      color: 0x9b6eaf,
      label: 'Nyalakan Pilar IV: Pemulihan Psikologis & Martabat Korban',
    },
  ];

  pillarConfigs.forEach((cfg) => {
    const pMesh = createProtectionPillar(textures, cfg.color);
    pMesh.position.copy(cfg.pos);
    root.add(pMesh);
    colliders.push({
      minX: cfg.pos.x - 0.42,
      maxX: cfg.pos.x + 0.42,
      minZ: cfg.pos.z - 0.42,
      maxZ: cfg.pos.z + 0.42,
    });
    const pFloat = pMesh.getObjectByName('floatingArtifact');
    if (pFloat) animatedObjects.push({ mesh: pFloat, mode: 'spinY' });
    interactables.push({
      id: cfg.id,
      kind: 'pillar',
      position: cfg.pos.clone(),
      radius: 2.6,
      collected: false,
      label: cfg.label,
      mesh: pMesh,
    });
  });

  // Environmental Storytelling Clues, Candles & Satgas PPKS Protocol Terminal (Babak IV)
  const candlesSW = createMemorialCandles(textures);
  candlesSW.position.set(-19.5, 0, 15.0);
  root.add(candlesSW);

  const candlesNW = createMemorialCandles(textures);
  candlesNW.position.set(-16.5, 0, -16.8);
  root.add(candlesNW);

  const addCampusClue = (
    id: string,
    style: 'diary' | 'photo' | 'dossier' | 'flyer' | 'medical',
    x: number,
    z: number,
    ry: number,
    label: string
  ) => {
    const m = createLoreClueProp(textures, style);
    m.position.set(x, 0, z);
    m.rotation.y = ry;
    root.add(m);
    colliders.push({ minX: x - 0.34, maxX: x + 0.34, minZ: z - 0.34, maxZ: z + 0.34 });
    const orb = m.getObjectByName('clueOrb');
    if (orb) animatedObjects.push({ mesh: orb, mode: 'bob' });
    interactables.push({
      id,
      kind: 'clue',
      loreId: id,
      position: new THREE.Vector3(x, 0, z),
      radius: 2.35,
      collected: false,
      label,
      mesh: m,
    });
  };

  addCampusClue('clue_4_letter', 'diary', -17.0, 18.2, 0.55, 'Baca Surat Solidaritas Mahasiswa');
  addCampusClue('clue_4_satgas', 'flyer', 15.2, 18.0, -0.5, 'Baca Papan Protokol Resmi Satgas PPKS');
  addCampusClue('clue_4_charter', 'flyer', 17.2, -17.2, -2.35, 'Baca Plakat Komitmen Tanpa Impunitas');
  addCampusClue('clue_4_ribbon', 'diary', -17.8, -17.2, 2.35, 'Periksa Lilin Harapan & Pita Pemulihan');

  const satgasTerm = createSatgasTerminalPuzzle(textures);
  satgasTerm.position.set(0, 0, -10.5);
  root.add(satgasTerm);
  colliders.push({ minX: -0.52, maxX: 0.52, minZ: -10.95, maxZ: -10.05 });
  interactables.push({
    id: 'puzzle_4_satgas',
    kind: 'puzzle',
    puzzleId: 'puzzle_4_satgas',
    position: new THREE.Vector3(0, 0, -10.5),
    radius: 2.6,
    collected: false,
    label: 'Aktifkan Terminal Protokol Satgas PPKS',
    mesh: satgasTerm,
  });

  interactables.push({
    id: 'exit_4_dome',
    kind: 'exit',
    lockedByPuzzleId: 'puzzle_4_satgas',
    position: new THREE.Vector3(0, 0, 0),
    radius: 4.1,
    collected: false,
    label: 'Sentuh Kubah Kaca untuk Membebaskan Rindi',
    mesh: domeController.group,
  });

  const shadow1 = createArticulatedShadow(textures, true);
  shadow1.root.position.set(-18, 0, -18);
  root.add(shadow1.root);
  enemies.push({
    rig: shadow1,
    waypoints: [
      new THREE.Vector3(-18, 0, -18),
      new THREE.Vector3(18, 0, -18),
      new THREE.Vector3(18, 0, 18),
      new THREE.Vector3(-18, 0, 18),
    ],
    currentWaypoint: 0,
    baseSpeed: (2.4 + frostLevel * 1.05) * speedFactor,
    frozenTimer: 0,
    chasing: false,
    lastWhisperTime: 0,
  });

  const shadow2 = createArticulatedShadow(textures, false);
  shadow2.root.position.set(18, 0, 18);
  root.add(shadow2.root);
  enemies.push({
    rig: shadow2,
    waypoints: [
      new THREE.Vector3(18, 0, 18),
      new THREE.Vector3(-18, 0, 18),
      new THREE.Vector3(-18, 0, -18),
      new THREE.Vector3(18, 0, -18),
    ],
    currentWaypoint: 0,
    baseSpeed: (2.3 + frostLevel * 0.95) * speedFactor,
    frozenTimer: 0,
    chasing: false,
    lastWhisperTime: 0,
  });

  return {
    root,
    playerSpawn: new THREE.Vector3(0, 1.65, 22.8),
    playerYaw: 0,
    colliders,
    interactables,
    hidingSpots,
    enemies,
    mannequins,
    animatedObjects,
    curtainMeshes,
    clockHands,
    flickerLights,
    beaconRipples,
    autoDoors,
    storyTriggers,
    envScares,
    cityscape,
    domeController,
    bounds: { minX: -26.8, maxX: 26.8, minZ: -26.8, maxZ: 26.8 },
  };
}
