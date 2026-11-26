import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ControlMode,
  CutsceneId,
  CutsceneOverlayState,
  DifficultyMode,
  DialogueLine,
  EndingType,
  GamePhase,
  HudSnapshot,
  LAYER_METAS,
  LayerIndex,
  StoryPhase,
} from '../types/game';
import { HorrorAudioEngine } from './audio';
import {
  ArticulatedCharacterRig,
  animateCharacterPose,
  createArticulatedShadow,
} from './characters';
import {
  CUTSCENE_CATALOG,
  CutsceneAudioCue,
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  sampleCutsceneFade,
  sampleCutsceneSubtitle,
} from './cutscenes';
import {
  AABB,
  CampusSceneResult,
  InteractableItem,
  LevelBuildResult,
  ShadowEnemy,
  buildCampusParkScene,
  buildLayer,
} from './levels';
import {
  NavGrid,
  buildNavGrid,
  collidesWithWorld,
  findPath,
  hasLineOfSight,
  isInPlayerViewCone,
  resolveCircleAABB,
} from './navigation';
import { createDroppedFlashlight } from './models';
import {
  FRAGMENT_DIALOGUES,
  LAYER_INTRO_DIALOGUES,
  PROLOGUE_DIALOGUES,
  PUZZLE_LOCKED_DIALOGUES,
  PUZZLE_SOLVED_DIALOGUES,
  TRIGGER_DIALOGUES,
  getEpilogueDialogues,
} from './story';
import { LORE_CLUES, PUZZLE_CONFIGS } from './lore';
import { ProceduralTextureBank, createProceduralTextureBank } from './textures';

// Pre-allocated scratch vectors to eliminate per-frame GC
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onDialogueRequested: (lines: DialogueLine[], onComplete: () => void) => void;
  onLayerCompleted: (completedLayer: LayerIndex) => void;
  onPauseRequested: () => void;
  onCheckpointRetryRequested: () => void;
  onContextLossChange: (lost: boolean) => void;
  onGameOver: () => void;
  onCutsceneStateChange: (state: CutsceneOverlayState | null) => void;
  onInspectLore: (loreId: string) => void;
  onOpenPuzzle: (puzzleId: string) => void;
  onOpenJournal: () => void;
}

interface StageCheckpoint {
  layerIndex: LayerIndex;
  playerPos: THREE.Vector3;
  yaw: number;
  warmth: number;
  frostLevel: number;
  collectedCount: number;
  collectedTotalFragments: number;
  exitUnlocked: boolean;
  collectedItemIds: string[];
  discoveredClues: string[];
  solvedPuzzles: string[];
  playedCutscenes: CutsceneId[];
  firedTriggers: string[];
  firedEnvScares: string[];
  autoDoorTriggered: boolean;
}

export class SudutBekuEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private audio: HorrorAudioEngine;

  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: ProceduralTextureBank;

  private fog: THREE.FogExp2;
  private hemiLight!: THREE.HemisphereLight;
  private keyDirLight!: THREE.DirectionalLight;
  private bgColorCalm = new THREE.Color(0x88a4be);
  private fogColorCalm = new THREE.Color(0xa9bac6);
  private bgColorNight = new THREE.Color(0x04080f);
  private bgColorDawn = new THREE.Color(0x1f2d42);
  private flashlight: THREE.SpotLight;
  private flashlightTarget: THREE.Object3D;
  private lanternLight: THREE.PointLight;
  private lanternRing: THREE.Mesh;

  private snowPoints: THREE.Points;
  private snowCount = 720;
  private snowSpeeds: Float32Array;
  private snowEnabled = false;

  private dustPoints: THREE.Points;
  private dustCount = 2400;
  private dustBaseOffsets: Float32Array;

  private levelData: LevelBuildResult | null = null;
  private campusScene: CampusSceneResult | null = null;
  private layerIndex: LayerIndex = 0;
  private phase: GamePhase = 'title';
  private difficulty: DifficultyMode = 'standard';
  private controlMode: ControlMode = 'pc';

  // Player & 5-Life Survival state
  private playerPos = new THREE.Vector3(0, 1.65, 11);
  private yaw = 0;
  private pitch = 0;
  private headBobPhase = 0;
  private warmth = 100;
  private stamina = 100;
  private readonly maxLives = 5;
  private lives = 5;
  private stageRetryUsed = false;
  private damageCooldownTimer = 0;
  private damageFlashTimer = 0;
  private pendingRetryTrigger = false;
  private stageCheckpoint: StageCheckpoint | null = null;
  private stageEntryFragments = 0;
  private stageEntryFrost = 0.38;
  private stageEntryClues: string[] = [];
  private stageEntryPuzzles: string[] = [];
  private jumpscareCount = 0;
  private graceTimer = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;

  // Jumpscare transient state
  private jumpscareTimer = 0;
  private jumpscareDuration = 1.05;
  private jumpscareKind: 'entity' | 'wardrobe' | 'mannequins' | 'glitchPhone' | null = null;
  private activeJumpscareEnemy: ShadowEnemy | null = null;
  private jumpscareFocusPos = new THREE.Vector3();
  private strobePhase: 'none' | 'red' | 'blue' = 'none';
  private mannequinsAlerted = false;
  private wardrobeSlamFired = false;
  private buzzCooldown = 0;

  // Unified Cinematic Cutscene Controller State
  private cinematicEffectsEnabled = true;
  private playedCutscenes = new Set<CutsceneId>();
  private activeCutsceneId: CutsceneId | null = null;
  private cutsceneTime = 0;
  private cutsceneCueFired = new Set<number>();
  private cutsceneStageSwapped = false;
  private cutsceneOnComplete: (() => void) | null = null;
  private cutsceneSavedPos = new THREE.Vector3();
  private cutsceneSavedYaw = 0;
  private cutsceneSavedPitch = 0;
  private cutsceneSavedEnemyPos: THREE.Vector3[] = [];
  private cutsceneSavedEnemyRotY: number[] = [];
  private cutsceneDomeLoaded = false;
  private lastEmittedCutsceneKey = '';
  private droppedFlashlight: {
    group: THREE.Group;
    beamLight: THREE.SpotLight;
    lensMat: THREE.MeshStandardMaterial;
  } | null = null;
  private cutsceneShadows: ArticulatedCharacterRig[] = [];

  // Lentera Konstitusi
  private lanternCooldownTimer = 0;
  private readonly lanternCooldownDuration = 8.0;
  private lanternPulseTimer = 0;

  // Hiding
  private isHiding = false;
  private savedPreHidePos = new THREE.Vector3();
  private savedPreHideYaw = 0;

  // Story, Frost & Atmosphere Phase
  private frostLevel = 0.38;
  private collectedCount = 0;
  private exitUnlocked = false;
  private collectedTotalFragments = 0;
  private discoveredClues = new Set<string>();
  private solvedPuzzles = new Set<string>();
  private currentEpilogueType: EndingType = 'true';
  private storyPhase: StoryPhase = 'calm_before';
  private horrorBlend = 0;
  private targetHorrorBlend = 0;
  private navGrid: NavGrid | null = null;
  private extraDoorColliders: AABB[] = [];
  private mirrorPeekCooldown = 0;

  // Input state
  private heldKeys: Record<string, boolean> = {};
  private justPressed: Record<string, boolean> = {};
  private isDraggingLook = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isPointerLocked = false;
  private virtualMoveX = 0;
  private virtualMoveY = 0;
  private mobileAutoSprint = false;
  private mobileSprintHeld = false;

  // Loop
  private clock = new THREE.Clock();
  private frameId = 0;
  private hudEmitAccum = 0;
  private disposed = false;
  private titleAngle = 0.4;
  private epilogueTime = 0;

  constructor(container: HTMLElement, audio: HorrorAudioEngine, callbacks: EngineCallbacks) {
    this.container = container;
    this.audio = audio;
    this.callbacks = callbacks;

    this.isSoftwareGl = detectSoftwareGl();
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = this.bgColorCalm.clone();
    this.fog = new THREE.FogExp2(0xa9bac6, 0.008);
    this.scene.fog = this.fog;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(72, w / h, 0.08, 320);
    this.scene.add(this.camera);

    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x5c5346, 0.92);
    this.scene.add(this.hemiLight);

    this.keyDirLight = new THREE.DirectionalLight(0xffe5b8, 1.1);
    this.keyDirLight.position.set(8, 16, 10);
    this.scene.add(this.keyDirLight);

    // Camera-attached Realistic Flashlight with Shadow Mapping
    this.flashlight = new THREE.SpotLight(0xfef3c7, 5.6, 26, Math.PI / 4.8, 0.55, 1.5);
    this.flashlight.position.set(0.14, -0.1, -0.1);
    this.flashlight.castShadow = !this.isSoftwareGl;
    this.flashlight.shadow.mapSize.set(1024, 1024);
    this.flashlight.shadow.camera.near = 0.2;
    this.flashlight.shadow.camera.far = 26;
    this.flashlight.shadow.bias = -0.0005;
    this.flashlightTarget = new THREE.Object3D();
    this.flashlightTarget.position.set(0, -0.08, -10);
    this.camera.add(this.flashlight);
    this.camera.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // Lentera pulse light & shockwave ring
    this.lanternLight = new THREE.PointLight(0xd4a353, 0, 22, 1.5);
    this.scene.add(this.lanternLight);

    const ringGeo = new THREE.TorusGeometry(1, 0.05, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd4a353,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.lanternRing = new THREE.Mesh(ringGeo, ringMat);
    this.lanternRing.rotation.x = Math.PI / 2;
    this.lanternRing.visible = false;
    this.scene.add(this.lanternRing);

    this.textures = createProceduralTextureBank(this.renderer);

    // Continuous Falling Snow
    const snowGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.snowCount * 3);
    this.snowSpeeds = new Float32Array(this.snowCount);
    for (let i = 0; i < this.snowCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 48;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 48;
      this.snowSpeeds[i] = 1.1 + Math.random() * 1.5;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xe0f2fe,
      map: this.textures.snowParticle,
      size: 0.16,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.snowPoints = new THREE.Points(snowGeo, snowMat);
    this.snowPoints.visible = false;
    this.snowPoints.frustumCulled = false;
    this.scene.add(this.snowPoints);

    // 2400 Floating Atmospheric Dust Motes illuminated near player / flashlight
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(this.dustCount * 3);
    this.dustBaseOffsets = new Float32Array(this.dustCount * 3);
    for (let i = 0; i < this.dustCount; i++) {
      const ox = (Math.random() - 0.5) * 20;
      const oy = 0.25 + Math.random() * 3.1;
      const oz = (Math.random() - 0.5) * 20;
      this.dustBaseOffsets[i * 3] = ox;
      this.dustBaseOffsets[i * 3 + 1] = oy;
      this.dustBaseOffsets[i * 3 + 2] = oz;
      dustPositions[i * 3] = ox;
      dustPositions[i * 3 + 1] = oy;
      dustPositions[i * 3 + 2] = oz;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfef3c7,
      map: this.textures.dustMote,
      size: 0.052,
      transparent: true,
      opacity: 0.36,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.dustPoints.frustumCulled = false;
    this.scene.add(this.dustPoints);

    // Load Campus Park Bench Scene for Title Screen live 3D camera
    this.loadCampusScene('title');

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.clock.start();
    this.tick();
  }

  private clearActiveScenes(): void {
    if (this.droppedFlashlight) {
      this.scene.remove(this.droppedFlashlight.group);
      this.disposeObjectTree(this.droppedFlashlight.group);
      this.droppedFlashlight = null;
    }
    if (this.cutsceneShadows.length > 0) {
      this.cutsceneShadows.forEach((s) => {
        this.scene.remove(s.root);
        this.disposeObjectTree(s.root);
      });
      this.cutsceneShadows = [];
    }
    if (this.levelData) {
      this.scene.remove(this.levelData.root);
      this.disposeObjectTree(this.levelData.root);
      this.levelData = null;
    }
    if (this.campusScene) {
      this.scene.remove(this.campusScene.root);
      this.disposeObjectTree(this.campusScene.root);
      this.campusScene = null;
    }
  }

  private applyCampusAtmosphere(blend: number): void {
    const b = THREE.MathUtils.clamp(blend, 0, 1);
    const bg = this.bgColorCalm.clone().lerp(this.bgColorNight, b);
    this.scene.background = bg;
    this.fog.color.copy(this.fogColorCalm).lerp(this.bgColorNight, b);
    this.fog.density = THREE.MathUtils.lerp(0.0042, 0.0175, b);

    const calmSky = new THREE.Color(0xdbeafe);
    const nightSky = new THREE.Color(0x78a9c4);
    this.hemiLight.color.copy(calmSky).lerp(nightSky, b);

    const calmGnd = new THREE.Color(0x5c5346);
    const nightGnd = new THREE.Color(0x0f172a);
    this.hemiLight.groundColor.copy(calmGnd).lerp(nightGnd, b);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.92, 0.46, b);

    const calmDir = new THREE.Color(0xffe5b8);
    const nightDir = new THREE.Color(0xffedd5);
    this.keyDirLight.color.copy(calmDir).lerp(nightDir, b);
    this.keyDirLight.intensity = THREE.MathUtils.lerp(1.1, 0.36, b);

    if (this.campusScene) {
      const warmSun = new THREE.Color(0xffe2b0);
      const coldSun = new THREE.Color(0x93c5fd);
      this.campusScene.sunLight.color.copy(warmSun).lerp(coldSun, b);
      this.campusScene.sunLight.intensity = THREE.MathUtils.lerp(1.45, 0.35, b);

      const warmGround = new THREE.Color(0xc8d2c6);
      const coldGround = new THREE.Color(0xa3bdd4);
      this.campusScene.groundMat.color.copy(warmGround).lerp(coldGround, b);

      const warmWalk = new THREE.Color(0x475569);
      const coldWalk = new THREE.Color(0x26313d);
      this.campusScene.walkwayMat.color.copy(warmWalk).lerp(coldWalk, b);

      const lampStrength = THREE.MathUtils.clamp((b - 0.22) / 0.65, 0, 1);
      [this.campusScene.benchLamp, this.campusScene.farLamp].forEach((lamp) => {
        lamp.traverse((child) => {
          if ((child as THREE.PointLight).isPointLight) {
            (child as THREE.PointLight).intensity = lampStrength * 2.1;
          }
        });
      });

      this.campusScene.snowMounds.visible = b > 0.48;
      this.campusScene.cityscape?.applyAtmosphere(b, false);
    }

    this.snowEnabled = b > 0.25;
    this.snowPoints.visible = this.snowEnabled;
    (this.snowPoints.material as THREE.PointsMaterial).opacity =
      THREE.MathUtils.clamp((b - 0.25) / 0.65, 0, 1) * 0.72;
  }

  public setPrologueLineProgress(lineIndex: number): void {
    if (this.phase !== 'prologue') return;
    if (lineIndex <= 2) {
      this.storyPhase = 'calm_before';
      this.targetHorrorBlend = 0;
    } else if (lineIndex === 3) {
      this.storyPhase = 'transitioning';
      this.targetHorrorBlend = 0.52;
    } else {
      this.storyPhase = 'transitioning';
      this.targetHorrorBlend = 0.92;
    }
    this.emitHud();
  }

  private loadCampusScene(mode: 'title' | 'prologue' | EndingType): void {
    this.clearActiveScenes();
    this.campusScene = buildCampusParkScene(this.textures, mode);
    this.scene.add(this.campusScene.root);

    if (mode === 'title' || mode === 'prologue') {
      this.storyPhase = 'calm_before';
      this.horrorBlend = 0;
      this.targetHorrorBlend = 0;
      this.applyCampusAtmosphere(0);
    } else if (mode === 'true') {
      this.storyPhase = 'horror_after';
      this.horrorBlend = 1;
      this.targetHorrorBlend = 1;
      this.scene.background = this.bgColorDawn.clone();
      this.fog.color.copy(this.bgColorDawn);
      this.fog.density = 0.0085;
      this.campusScene.cityscape?.applyAtmosphere(0.15, true);
      this.hemiLight.color.setHex(0xfde68a);
      this.hemiLight.groundColor.setHex(0x334155);
      this.hemiLight.intensity = 0.88;
      this.keyDirLight.color.setHex(0xfef3c7);
      this.keyDirLight.intensity = 1.05;
      this.snowEnabled = false;
      this.snowPoints.visible = false;
    } else {
      this.storyPhase = 'horror_after';
      this.horrorBlend = 1;
      this.targetHorrorBlend = 1;
      this.applyCampusAtmosphere(1);
    }
  }

  public startPrologue(difficulty: DifficultyMode): void {
    this.audio.init();
    this.difficulty = difficulty;
    this.frostLevel = 0.38;
    this.warmth = 100;
    this.stamina = 100;
    this.lives = this.maxLives;
    this.stageRetryUsed = false;
    this.damageCooldownTimer = 0;
    this.damageFlashTimer = 0;
    this.pendingRetryTrigger = false;
    this.stageCheckpoint = null;
    this.stageEntryFragments = 0;
    this.stageEntryFrost = 0.38;
    this.stageEntryClues = [];
    this.stageEntryPuzzles = [];
    this.jumpscareCount = 0;
    this.graceTimer = 0;
    this.jumpscareTimer = 0;
    this.jumpscareKind = null;
    this.activeJumpscareEnemy = null;
    this.strobePhase = 'none';
    this.lanternCooldownTimer = 0;
    this.collectedTotalFragments = 0;
    this.discoveredClues.clear();
    this.solvedPuzzles.clear();
    this.playedCutscenes.clear();
    this.activeCutsceneId = null;
    this.cutsceneOnComplete = null;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.callbacks.onCutsceneStateChange(null);

    this.loadCampusScene('prologue');
    this.phase = 'prologue';
    this.clearInputs();
    this.emitHud();

    this.callbacks.onDialogueRequested(PROLOGUE_DIALOGUES, () => {
      this.startCutscene('prologue_collapse', () => {
        if (!this.levelData) {
          this.loadLayer(0);
        }
        const intro = LAYER_INTRO_DIALOGUES[0];
        if (intro) {
          this.triggerDialoguePause(intro, () => {
            this.phase = 'playing';
            this.emitHud();
          });
        } else {
          this.phase = 'playing';
          this.emitHud();
        }
      });
    });
  }

  public advanceToLayer(layerIdx: LayerIndex, newFrostLevel: number): void {
    this.frostLevel = THREE.MathUtils.clamp(newFrostLevel, 0.15, 1.0);
    this.warmth = Math.min(100, this.warmth + 25);
    this.stamina = 100;
    this.lives = this.maxLives;
    this.stageRetryUsed = false;
    this.damageCooldownTimer = 0;
    this.damageFlashTimer = 0;
    this.pendingRetryTrigger = false;
    this.stageEntryFragments = this.collectedTotalFragments;
    this.stageEntryFrost = this.frostLevel;
    this.stageEntryClues = Array.from(this.discoveredClues);
    this.stageEntryPuzzles = Array.from(this.solvedPuzzles);
    this.loadLayer(layerIdx);

    const openLayerDialogue = () => {
      const intro = LAYER_INTRO_DIALOGUES[layerIdx];
      if (intro) {
        this.triggerDialoguePause(intro, () => {
          this.phase = 'playing';
          this.emitHud();
        });
      } else {
        this.phase = 'playing';
      }
      this.emitHud();
    };

    if (layerIdx === 3 && !this.playedCutscenes.has('babak4_dome_intro')) {
      this.startCutscene('babak4_dome_intro', openLayerDialogue);
      return;
    }

    this.phase = 'playing';
    openLayerDialogue();
  }

  public startEpilogue(endingType: EndingType, onEpilogueDone: () => void): void {
    this.currentEpilogueType = endingType;
    this.epilogueTime = 0;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.loadCampusScene(endingType);
    this.phase = 'epilogue';
    this.clearInputs();
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.emitHud();

    const lines = getEpilogueDialogues(endingType);
    this.callbacks.onDialogueRequested(lines, () => {
      this.phase = 'ending';
      onEpilogueDone();
    });
  }

  public setPhase(phase: GamePhase): void {
    this.phase = phase;
    if (phase !== 'playing') {
      this.clearInputs();
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
    }
    if (phase === 'title') {
      this.activeCutsceneId = null;
      this.cutsceneOnComplete = null;
      this.camera.fov = 72;
      this.camera.updateProjectionMatrix();
      this.camera.rotation.z = 0;
      this.callbacks.onCutsceneStateChange(null);
      this.loadCampusScene('title');
    }
    this.emitHud();
  }

  public setCinematicEffectsEnabled(enabled: boolean): void {
    this.cinematicEffectsEnabled = enabled;
    if (!enabled) {
      this.shakeIntensity = 0;
      if (this.phase === 'cutscene') {
        this.camera.fov = 72;
        this.camera.updateProjectionMatrix();
        this.camera.rotation.z = 0;
      }
    }
  }

  public skipActiveCutscene(): void {
    if (this.phase !== 'cutscene' || !this.activeCutsceneId) return;
    const meta = CUTSCENE_CATALOG[this.activeCutsceneId];
    if (this.cutsceneTime < meta.skipLockSeconds) return;
    this.finishActiveCutscene(true);
  }

  public setControlMode(mode: ControlMode): void {
    this.controlMode = mode;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, mode === 'mobile' ? 1.5 : 2)
    );
    if (mode === 'mobile' && document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.clearInputs();
    this.emitHud();
  }

  public setVirtualJoystick(x: number, y: number, autoSprint: boolean): void {
    this.virtualMoveX = THREE.MathUtils.clamp(x, -1, 1);
    this.virtualMoveY = THREE.MathUtils.clamp(y, -1, 1);
    this.mobileAutoSprint = autoSprint;
  }

  public applyTouchLook(dx: number, dy: number): void {
    if (this.phase !== 'playing' || this.jumpscareTimer > 0) return;
    this.audio.init();
    this.yaw -= dx * 0.0052;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0044, -1.25, 1.25);
  }

  public setMobileSprint(active: boolean): void {
    this.mobileSprintHeld = active;
  }

  public triggerMobileInteract(): void {
    this.audio.init();
    if (this.phase !== 'playing' || this.jumpscareTimer > 0) return;
    const closest = this.findClosestInteractable();
    this.handleInteract(closest.item, closest.hideSpotIdx);
    this.emitHud();
  }

  public triggerMobileLantern(): void {
    this.audio.init();
    if (this.phase !== 'playing' || this.jumpscareTimer > 0 || this.isHiding) return;
    this.triggerLenteraKonstitusi();
    this.emitHud();
  }

  public requestPointerLock(): void {
    if (this.controlMode === 'mobile') return;
    if (this.phase === 'playing' && document.pointerLockElement !== this.renderer.domElement) {
      try {
        this.renderer.domElement.requestPointerLock?.();
      } catch {
        // Drag fallback remains active
      }
    }
  }

  public getCollectedFragmentsCount(): number {
    return this.collectedTotalFragments;
  }

  public getFrostLevel(): number {
    return this.frostLevel;
  }

  public getJumpscareCount(): number {
    return this.jumpscareCount;
  }

  public getDiscoveredClues(): string[] {
    return Array.from(this.discoveredClues);
  }

  public getSolvedPuzzles(): string[] {
    return Array.from(this.solvedPuzzles);
  }

  public resumeFromOverlay(): void {
    this.phase = 'playing';
    this.clearInputs();
    this.emitHud();
  }

  public useCheckpointRetry(): void {
    if (!this.levelData || !this.stageCheckpoint) {
      this.restartCurrentStage();
      return;
    }

    const cp = this.stageCheckpoint;
    this.stageRetryUsed = true;
    this.lives = this.maxLives;
    this.pendingRetryTrigger = false;
    this.jumpscareTimer = 0;
    this.jumpscareKind = null;
    this.activeJumpscareEnemy = null;
    this.strobePhase = 'none';
    this.damageCooldownTimer = 1.8;
    this.damageFlashTimer = 0;
    this.graceTimer = 3.2;
    this.stamina = 100;
    this.isHiding = false;
    this.shakeIntensity = 0;
    this.lanternCooldownTimer = 0;
    this.lanternPulseTimer = 0;
    this.lanternLight.intensity = 0;
    this.lanternRing.visible = false;

    this.warmth = cp.warmth;
    this.frostLevel = cp.frostLevel;
    this.collectedCount = cp.collectedCount;
    this.collectedTotalFragments = cp.collectedTotalFragments;
    this.exitUnlocked = cp.exitUnlocked;

    this.discoveredClues = new Set(cp.discoveredClues);
    this.solvedPuzzles = new Set(cp.solvedPuzzles);
    this.playedCutscenes = new Set(cp.playedCutscenes);

    // Restore stage auto-doors cleanly in open state so passage is never obstructed
    for (const ad of this.levelData.autoDoors) {
      ad.triggered = cp.autoDoorTriggered;
      ad.targetYaw = ad.openYaw;
      ad.pivot.rotation.y = ad.openYaw;
    }
    this.refreshExtraDoorColliders();

    // Restore interactables to match checkpoint state
    const collectedSet = new Set(cp.collectedItemIds);
    for (const item of this.levelData.interactables) {
      if (item.kind === 'fragment') {
        const wasCollected = collectedSet.has(item.id);
        item.collected = wasCollected;
        item.mesh.visible = !wasCollected;
      } else if (item.kind === 'pillar') {
        const wasCollected = collectedSet.has(item.id);
        item.collected = wasCollected;
        const core = item.mesh.getObjectByName('pillarCore') as THREE.Mesh | undefined;
        const pLight = item.mesh.getObjectByName('pillarLight') as THREE.PointLight | undefined;
        if (core) {
          const m = core.material as THREE.MeshStandardMaterial;
          m.color.setHex(wasCollected ? 0xfef08a : 0x78a9c4);
          m.emissive.setHex(wasCollected ? 0xd4a353 : 0x3b82f6);
          m.emissiveIntensity = wasCollected ? 2.4 : 0.7;
        }
        if (pLight) {
          pLight.color.setHex(wasCollected ? 0xd4a353 : 0x78a9c4);
          pLight.intensity = wasCollected ? 3.5 : 1.4;
        }
      } else if (item.kind === 'puzzle' && item.puzzleId) {
        const solved = this.solvedPuzzles.has(item.puzzleId);
        item.collected = solved;
        const led = item.mesh.getObjectByName('puzzleLed') as THREE.Mesh | undefined;
        const pLight = item.mesh.getObjectByName('puzzleLight') as THREE.PointLight | undefined;
        if (led) {
          const m = led.material as THREE.MeshStandardMaterial;
          m.color.setHex(solved ? 0xd4a353 : 0x38bdf8);
          m.emissive.setHex(solved ? 0xd4a353 : 0x0284c7);
          m.emissiveIntensity = solved ? 2.4 : 1.1;
        }
        if (pLight) {
          pLight.color.setHex(solved ? 0xd4a353 : 0x38bdf8);
          pLight.intensity = solved ? 2.6 : 1.4;
        }
      } else if (item.kind === 'clue' && item.loreId) {
        const found = this.discoveredClues.has(item.loreId);
        const orb = item.mesh.getObjectByName('clueOrb') as THREE.Mesh | undefined;
        const cLight = item.mesh.getObjectByName('clueLight') as THREE.PointLight | undefined;
        if (orb) orb.visible = !found;
        if (cLight) cLight.intensity = found ? 0.25 : 1.25;
      }
    }

    const trigSet = new Set(cp.firedTriggers);
    for (const trig of this.levelData.storyTriggers) {
      trig.fired = trigSet.has(trig.id);
    }
    const scareSet = new Set(cp.firedEnvScares);
    for (const scare of this.levelData.envScares) {
      scare.fired = scareSet.has(scare.id);
    }

    // Safely place player at validated checkpoint coordinates
    const safePlayer = resolveCircleAABB(
      cp.playerPos.x,
      cp.playerPos.z,
      0.42,
      this.levelData.colliders,
      this.levelData.bounds,
      this.extraDoorColliders
    );
    this.playerPos.set(safePlayer.x, 1.65, safePlayer.z);
    this.yaw = cp.yaw;
    this.pitch = 0;

    // Relocate enemies far away from respawn point with breathing room
    for (const enemy of this.levelData.enemies) {
      let bestWp = enemy.waypoints[0];
      let bestDist = -1;
      for (const wp of enemy.waypoints) {
        const d = Math.hypot(wp.x - this.playerPos.x, wp.z - this.playerPos.z);
        if (d > bestDist) {
          bestDist = d;
          bestWp = wp;
        }
      }
      enemy.rig.root.position.copy(bestWp);
      enemy.rig.root.visible = true;
      enemy.hiddenFromView = false;
      enemy.frozenTimer = 2.6;
      enemy.chasing = false;
      enemy.aiState = 'patrol';
      enemy.path = [];
      enemy.stuckTimer = 0;
    }

    this.flashlight.color.setHex(0xfef3c7);
    this.flashlight.intensity = 5.6;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.camera.rotation.z = 0;
    this.updateDomeVisuals();
    this.clearInputs();
    this.phase = 'playing';
    this.emitHud();
    this.requestPointerLock();
  }

  public restartCurrentStage(): void {
    const targetLayer = this.layerIndex;
    this.lives = this.maxLives;
    this.stageRetryUsed = false;
    this.damageCooldownTimer = 0;
    this.damageFlashTimer = 0;
    this.pendingRetryTrigger = false;
    this.warmth = 100;
    this.stamina = 100;
    this.frostLevel = this.stageEntryFrost;
    this.collectedTotalFragments = this.stageEntryFragments;
    this.discoveredClues = new Set(this.stageEntryClues);
    this.solvedPuzzles = new Set(this.stageEntryPuzzles);
    this.activeCutsceneId = null;
    this.cutsceneOnComplete = null;
    this.callbacks.onCutsceneStateChange(null);

    if (targetLayer === 0) this.playedCutscenes.delete('babak1_stalker_reveal');
    if (targetLayer === 1) this.playedCutscenes.delete('babak2_authority_reveal');
    if (targetLayer === 2) this.playedCutscenes.delete('babak3_corridor_dread');
    if (targetLayer === 3) {
      this.playedCutscenes.delete('babak4_dome_intro');
      this.playedCutscenes.delete('babak4_liberation');
    }

    this.loadLayer(targetLayer);
    this.flashlight.color.setHex(0xfef3c7);
    this.flashlight.intensity = 5.6;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.camera.rotation.z = 0;
    this.clearInputs();
    this.phase = 'playing';
    this.emitHud();
    this.requestPointerLock();
  }

  private captureStageCheckpoint(): void {
    if (!this.levelData) return;
    this.refreshExtraDoorColliders();
    const safePlayer = resolveCircleAABB(
      this.playerPos.x,
      this.playerPos.z,
      0.42,
      this.levelData.colliders,
      this.levelData.bounds,
      this.extraDoorColliders
    );

    this.stageCheckpoint = {
      layerIndex: this.layerIndex,
      playerPos: new THREE.Vector3(safePlayer.x, 1.65, safePlayer.z),
      yaw: this.yaw,
      warmth: this.warmth,
      frostLevel: this.frostLevel,
      collectedCount: this.collectedCount,
      collectedTotalFragments: this.collectedTotalFragments,
      exitUnlocked: this.exitUnlocked,
      collectedItemIds: this.levelData.interactables
        .filter((it) => it.collected)
        .map((it) => it.id),
      discoveredClues: Array.from(this.discoveredClues),
      solvedPuzzles: Array.from(this.solvedPuzzles),
      playedCutscenes: Array.from(this.playedCutscenes),
      firedTriggers: this.levelData.storyTriggers
        .filter((tr) => tr.fired)
        .map((tr) => tr.id),
      firedEnvScares: this.levelData.envScares
        .filter((sc) => sc.fired)
        .map((sc) => sc.id),
      autoDoorTriggered: this.levelData.autoDoors.some((d) => d.triggered),
    };
  }

  public completePuzzle(puzzleId: string): void {
    this.solvedPuzzles.add(puzzleId);
    this.audio.playPuzzleSolved();
    this.warmth = Math.min(100, this.warmth + 16);
    this.frostLevel = Math.max(0.15, this.frostLevel - 0.025);

    if (this.levelData) {
      for (const item of this.levelData.interactables) {
        if (item.kind === 'puzzle' && item.puzzleId === puzzleId) {
          item.collected = true;
          const led = item.mesh.getObjectByName('puzzleLed') as THREE.Mesh | undefined;
          const pLight = item.mesh.getObjectByName('puzzleLight') as THREE.PointLight | undefined;
          if (led) {
            const m = led.material as THREE.MeshStandardMaterial;
            m.color.setHex(0xd4a353);
            m.emissive.setHex(0xd4a353);
            m.emissiveIntensity = 2.4;
          }
          if (pLight) {
            pLight.color.setHex(0xd4a353);
            pLight.intensity = 2.6;
          }
        }
      }

      if (puzzleId === 'puzzle_4_satgas') {
        this.lanternPulseTimer = 1.1;
        this.lanternLight.position.set(this.playerPos.x, 1.5, this.playerPos.z);
        this.lanternLight.intensity = 10;
        this.lanternRing.position.set(this.playerPos.x, 0.25, this.playerPos.z);
        this.lanternRing.scale.setScalar(0.5);
        this.lanternRing.visible = true;
        for (const enemy of this.levelData.enemies) {
          enemy.frozenTimer = Math.max(enemy.frozenTimer, 4.5);
          enemy.chasing = false;
        }
      }
    }

    this.captureStageCheckpoint();

    const lines = PUZZLE_SOLVED_DIALOGUES[puzzleId];
    if (lines) {
      this.triggerDialoguePause(lines, () => {
        this.phase = 'playing';
        this.emitHud();
      });
    } else {
      this.phase = 'playing';
      this.emitHud();
    }
  }

  private loadLayer(layerIdx: LayerIndex): void {
    this.clearActiveScenes();

    this.layerIndex = layerIdx;
    this.isHiding = false;
    this.collectedCount = 0;
    this.exitUnlocked = false;
    this.graceTimer = 2.2;
    this.damageCooldownTimer = 0;
    this.damageFlashTimer = 0;
    this.pendingRetryTrigger = false;
    this.jumpscareTimer = 0;
    this.jumpscareKind = null;
    this.activeJumpscareEnemy = null;
    this.strobePhase = 'none';
    this.mannequinsAlerted = false;
    this.wardrobeSlamFired = false;
    this.mirrorPeekCooldown = 0;
    this.extraDoorColliders = [];

    this.storyPhase = 'horror_after';
    this.horrorBlend = 1;
    this.targetHorrorBlend = 1;
    this.hemiLight.color.setHex(0x78a9c4);
    this.hemiLight.groundColor.setHex(0x0f172a);
    this.hemiLight.intensity = 0.46;
    this.keyDirLight.color.setHex(0xffedd5);
    this.keyDirLight.intensity = 0.36;

    this.scene.background = this.bgColorNight.clone();
    this.fog.color.copy(this.bgColorNight);
    this.snowEnabled = true;
    this.snowPoints.visible = true;
    (this.snowPoints.material as THREE.PointsMaterial).opacity = 0.72;

    this.levelData = buildLayer(
      layerIdx,
      this.textures,
      this.isSoftwareGl,
      this.frostLevel,
      this.difficulty
    );
    this.scene.add(this.levelData.root);

    const navCellSize = layerIdx === 3 ? 0.65 : 0.55;
    this.navGrid = buildNavGrid(this.levelData.bounds, this.levelData.colliders, 0.36, navCellSize);
    this.levelData.enemies.forEach((enemy) => {
      enemy.aiState = 'patrol';
      enemy.stateTimer = 0;
      enemy.repositionCooldown = 3.5;
      enemy.path = [];
      enemy.pathTimer = 0;
      enemy.lastX = enemy.rig.root.position.x;
      enemy.lastZ = enemy.rig.root.position.z;
      enemy.stuckTimer = 0;
      enemy.hiddenFromView = false;
      enemy.peekTriggered = false;
    });

    this.playerPos.copy(this.levelData.playerSpawn);
    this.yaw = this.levelData.playerYaw;
    this.pitch = 0;
    this.refreshExtraDoorColliders();

    if (layerIdx === 3) {
      this.fog.density = 0.0135 + this.frostLevel * 0.012;
      this.levelData.cityscape?.applyAtmosphere(1, false);
    } else {
      this.fog.density = 0.036 + this.frostLevel * 0.042;
    }
    this.updateDomeVisuals();
    this.captureStageCheckpoint();
  }

  private updateDomeVisuals(): void {
    if (!this.levelData?.domeController) return;
    const { domeMesh, iceRibs, rindiRig, domeLight } = this.levelData.domeController;
    const progress = this.collectedCount / 4;
    const mat = domeMesh.material as THREE.MeshPhysicalMaterial;

    const iceFactor = THREE.MathUtils.clamp(0.45 + this.frostLevel * 0.55 - progress * 0.72, 0.12, 1.0);
    mat.opacity = this.isSoftwareGl ? 0.18 + iceFactor * 0.35 : 0.25 + iceFactor * 0.48;
    iceRibs.scale.setScalar(Math.max(0.08, 1.05 - progress * 0.85));
    iceRibs.visible = progress < 1 || this.frostLevel > 0.65;

    if (progress >= 1 && this.frostLevel < 0.6) {
      domeLight.color.setHex(0xd4a353);
      domeLight.intensity = 3.5;
    } else {
      domeLight.color.setHex(0x78a9c4);
      domeLight.intensity = 2.4 + progress * 0.8;
    }
    animateCharacterPose(rindiRig, 'seatedHug', this.clock.elapsedTime);
  }

  private clearInputs(): void {
    for (const k of Object.keys(this.heldKeys)) this.heldKeys[k] = false;
    for (const k of Object.keys(this.justPressed)) this.justPressed[k] = false;
    this.isDraggingLook = false;
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.mobileAutoSprint = false;
    this.mobileSprintHeld = false;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) &&
      (this.phase === 'playing' || this.phase === 'cutscene')
    ) {
      e.preventDefault();
    }
    if (!this.heldKeys[e.code]) {
      this.justPressed[e.code] = true;
      if (
        this.phase === 'cutscene' &&
        (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')
      ) {
        this.skipActiveCutscene();
        return;
      }
    }
    this.heldKeys[e.code] = true;

    if (e.code === 'Escape' && this.phase === 'playing') {
      this.callbacks.onPauseRequested();
      return;
    }

    if (e.code === 'KeyJ' && this.phase === 'playing' && !this.jumpscareTimer) {
      this.phase = 'journal';
      this.clearInputs();
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
      this.audio.playPaperInspect();
      this.callbacks.onOpenJournal();
      this.emitHud();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys[e.code] = false;
  };

  private onBlur = (): void => {
    this.clearInputs();
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.controlMode === 'mobile' || this.phase !== 'playing' || this.jumpscareTimer > 0) return;
    if (this.isPointerLocked) {
      this.yaw -= e.movementX * 0.0022;
      this.pitch = THREE.MathUtils.clamp(this.pitch - e.movementY * 0.0022, -1.25, 1.25);
    } else if (this.isDraggingLook) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.yaw -= dx * 0.0045;
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * 0.0045, -1.25, 1.25);
    }
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (this.controlMode === 'mobile' || this.phase !== 'playing') return;
    this.audio.init();
    this.isDraggingLook = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    if (e.target === this.renderer.domElement) {
      this.requestPointerLock();
    }
  };

  private onMouseUp = (): void => {
    this.isDraggingLook = false;
  };

  private onPointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    this.emitHud();
  };

  private onResize = (): void => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, this.controlMode === 'mobile' ? 1.5 : 2)
    );
  };

  private onContextLost = (e: Event): void => {
    e.preventDefault();
    this.callbacks.onContextLossChange(true);
  };

  private onContextRestored = (): void => {
    this.callbacks.onContextLossChange(false);
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', this.onResize);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  private unbindEvents(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);
  }

  private collidesAt(x: number, z: number, radius = 0.42): boolean {
    if (!this.levelData) return false;
    const b = this.levelData.bounds;
    if (x < b.minX + radius || x > b.maxX - radius || z < b.minZ + radius || z > b.maxZ - radius) {
      return true;
    }
    const cols: AABB[] = this.levelData.colliders;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (x + radius > c.minX && x - radius < c.maxX && z + radius > c.minZ && z - radius < c.maxZ) {
        return true;
      }
    }
    for (let i = 0; i < this.extraDoorColliders.length; i++) {
      const c = this.extraDoorColliders[i];
      if (x + radius > c.minX && x - radius < c.maxX && z + radius > c.minZ && z - radius < c.maxZ) {
        return true;
      }
    }
    return false;
  }

  private findClosestInteractable(): { item: InteractableItem | null; hideSpotIdx: number } {
    if (!this.levelData) return { item: null, hideSpotIdx: -1 };
    let bestItem: InteractableItem | null = null;
    let bestDist = Infinity;

    for (const item of this.levelData.interactables) {
      if (item.collected) continue;
      const dist = Math.hypot(this.playerPos.x - item.position.x, this.playerPos.z - item.position.z);
      if (dist <= item.radius && dist < bestDist) {
        bestDist = dist;
        bestItem = item;
      }
    }
    if (bestItem) return { item: bestItem, hideSpotIdx: -1 };

    let bestHideIdx = -1;
    let bestHideDist = 2.25;
    this.levelData.hidingSpots.forEach((spot, idx) => {
      const dist = Math.hypot(this.playerPos.x - spot.position.x, this.playerPos.z - spot.position.z);
      if (dist < bestHideDist) {
        bestHideDist = dist;
        bestHideIdx = idx;
      }
    });

    return { item: null, hideSpotIdx: bestHideIdx };
  }

  private triggerLenteraKonstitusi(): void {
    if (this.lanternCooldownTimer > 0 || !this.levelData) return;
    this.lanternCooldownTimer = this.lanternCooldownDuration;
    this.lanternPulseTimer = 1.1;
    this.audio.playLanternPulse();

    this.lanternLight.position.set(this.playerPos.x, 1.5, this.playerPos.z);
    this.lanternLight.intensity = 10;

    this.lanternRing.position.set(this.playerPos.x, 0.25, this.playerPos.z);
    this.lanternRing.scale.setScalar(0.5);
    this.lanternRing.visible = true;

    for (const enemy of this.levelData.enemies) {
      const d = Math.hypot(
        enemy.rig.root.position.x - this.playerPos.x,
        enemy.rig.root.position.z - this.playerPos.z
      );
      if (d <= 12.5) {
        enemy.frozenTimer = 4.8;
        enemy.chasing = false;
      }
    }
  }

  private triggerDialoguePause(lines: DialogueLine[], onAfter: () => void): void {
    this.phase = 'dialogue';
    this.clearInputs();
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }
    this.callbacks.onDialogueRequested(lines, onAfter);
  }

  private handleInteract(item: InteractableItem | null, hideSpotIdx: number): void {
    if (this.isHiding) {
      this.isHiding = false;
      this.playerPos.copy(this.savedPreHidePos);
      this.yaw = this.savedPreHideYaw;
      this.audio.playHideToggle(false);
      return;
    }

    if (item) {
      if (item.kind === 'clue' && item.loreId) {
        this.audio.playPaperInspect();
        const isFirst = !this.discoveredClues.has(item.loreId);
        if (isFirst) {
          this.discoveredClues.add(item.loreId);
          this.warmth = Math.min(100, this.warmth + 10);
          this.frostLevel = Math.max(0.15, this.frostLevel - 0.012);
          const orb = item.mesh.getObjectByName('clueOrb') as THREE.Mesh | undefined;
          const cLight = item.mesh.getObjectByName('clueLight') as THREE.PointLight | undefined;
          if (orb) orb.visible = false;
          if (cLight) cLight.intensity = 0.25;
        }
        this.phase = 'inspect';
        this.clearInputs();
        if (document.pointerLockElement === this.renderer.domElement) {
          document.exitPointerLock?.();
        }
        this.callbacks.onInspectLore(item.loreId);
        this.emitHud();
        return;
      }

      if (item.kind === 'puzzle' && item.puzzleId) {
        this.audio.playSwitchClick(0);
        this.phase = 'puzzle';
        this.clearInputs();
        if (document.pointerLockElement === this.renderer.domElement) {
          document.exitPointerLock?.();
        }
        this.callbacks.onOpenPuzzle(item.puzzleId);
        this.emitHud();
        return;
      }

      if (item.kind === 'fragment' || item.kind === 'pillar') {
        if (item.lockedByPuzzleId && !this.solvedPuzzles.has(item.lockedByPuzzleId)) {
          this.audio.playChainRattle();
          const lockLines = PUZZLE_LOCKED_DIALOGUES[item.lockedByPuzzleId];
          if (lockLines) {
            this.triggerDialoguePause(lockLines, () => {
              this.phase = 'playing';
              this.emitHud();
            });
          }
          return;
        }

        item.collected = true;
        this.collectedCount += 1;
        if (item.kind === 'fragment') {
          this.collectedTotalFragments += 1;
          item.mesh.visible = false;
          this.audio.playMemoryChime();
        } else {
          const core = item.mesh.getObjectByName('pillarCore') as THREE.Mesh | undefined;
          const pLight = item.mesh.getObjectByName('pillarLight') as THREE.PointLight | undefined;
          if (core) {
            const m = core.material as THREE.MeshStandardMaterial;
            m.color.setHex(0xfef08a);
            m.emissive.setHex(0xd4a353);
            m.emissiveIntensity = 2.4;
          }
          if (pLight) {
            pLight.color.setHex(0xd4a353);
            pLight.intensity = 3.5;
          }
          this.audio.playPillarActivate(this.collectedCount);
          this.updateDomeVisuals();
          if (this.collectedCount >= 4) {
            this.audio.playIceShatter();
          }
        }

        const totalNeeded = LAYER_METAS[this.layerIndex].totalTargets;
        if (this.collectedCount >= totalNeeded) {
          this.exitUnlocked = true;
        }
        this.captureStageCheckpoint();

        const lines = FRAGMENT_DIALOGUES[item.id];
        if (lines) {
          this.triggerDialoguePause(lines, () => {
            this.phase = 'playing';
            this.emitHud();
          });
        }
        return;
      }

      if (item.kind === 'exit') {
        if (!this.exitUnlocked) {
          if (this.layerIndex === 1) {
            this.audio.playChainRattle();
          }
          const needed = LAYER_METAS[this.layerIndex].totalTargets;
          this.triggerDialoguePause(
            [
              {
                speaker: 'Bima',
                emotion: 'Memeriksa segel',
                portraitExpr: 'anxious',
                text: `Segel ini masih terkunci rapat. Aku masih perlu mengumpulkan ${
                  needed - this.collectedCount
                } ${LAYER_METAS[this.layerIndex].objectiveLabel.toLowerCase()} lagi di area ini.`,
              },
            ],
            () => {
              this.phase = 'playing';
              this.emitHud();
            }
          );
          return;
        }

        if (item.lockedByPuzzleId && !this.solvedPuzzles.has(item.lockedByPuzzleId)) {
          this.audio.playChainRattle();
          const lockLines = PUZZLE_LOCKED_DIALOGUES[item.lockedByPuzzleId];
          if (lockLines) {
            this.triggerDialoguePause(lockLines, () => {
              this.phase = 'playing';
              this.emitHud();
            });
          }
          return;
        }

        this.audio.playSealBreak();
        const exitLines = FRAGMENT_DIALOGUES[item.id];
        const finishLayer = () => {
          this.phase = 'mirror';
          this.clearInputs();
          if (document.pointerLockElement === this.renderer.domElement) {
            document.exitPointerLock?.();
          }
          this.callbacks.onLayerCompleted(this.layerIndex);
        };

        if (this.layerIndex === 3 && !this.playedCutscenes.has('babak4_liberation')) {
          this.startCutscene('babak4_liberation', finishLayer);
          return;
        }

        if (exitLines && this.layerIndex < 3) {
          this.triggerDialoguePause(exitLines, finishLayer);
        } else {
          finishLayer();
        }
        return;
      }
    }

    if (hideSpotIdx >= 0 && this.levelData) {
      const spot = this.levelData.hidingSpots[hideSpotIdx];
      this.savedPreHidePos.copy(this.playerPos);
      this.savedPreHideYaw = this.yaw;
      this.isHiding = true;
      this.playerPos.set(spot.position.x, 1.48, spot.position.z);
      this.yaw = spot.lookOutYaw;
      this.pitch = 0;
      this.audio.playHideToggle(true);
    }
  }

  private triggerEntityAmbush(enemy: ShadowEnemy): void {
    // Anti double-damage protection: strictly 1 life lost per valid jumpscare
    if (
      this.phase !== 'playing' ||
      this.damageCooldownTimer > 0 ||
      this.jumpscareTimer > 0 ||
      this.graceTimer > 0
    ) {
      return;
    }

    this.damageCooldownTimer = 1.6;
    this.jumpscareCount += 1;
    this.lives = Math.max(0, this.lives - 1);
    this.damageFlashTimer = 0.72;
    // Decouple warmth from survival lives so coldness never causes unfair life loss
    this.warmth = Math.max(25, this.warmth - (this.difficulty === 'story' ? 6 : 10));

    this.audio.playJumpscareShriek();
    this.audio.playLifeLost();

    if (this.lives <= 0) {
      if (!this.stageRetryUsed) {
        // First time reaching 0 lives in this stage: brief impact jumpscare then pause for 1x checkpoint retry
        this.pendingRetryTrigger = true;
        this.jumpscareKind = 'entity';
        this.jumpscareDuration = 0.78;
        this.jumpscareTimer = this.jumpscareDuration;
        this.activeJumpscareEnemy = enemy;
        this.shakeIntensity = this.cinematicEffectsEnabled ? 0.38 : 0;
        this.strobePhase = 'red';
        const dirX = -Math.sin(this.yaw);
        const dirZ = -Math.cos(this.yaw);
        const targetX = this.playerPos.x + dirX * 0.92;
        const targetZ = this.playerPos.z + dirZ * 0.92;
        if (this.levelData) {
          const safePos = resolveCircleAABB(
            targetX,
            targetZ,
            0.38,
            this.levelData.colliders,
            this.levelData.bounds,
            this.extraDoorColliders
          );
          enemy.rig.root.position.set(safePos.x, 0, safePos.z);
        } else {
          enemy.rig.root.position.set(targetX, 0, targetZ);
        }
        enemy.rig.root.visible = true;
        enemy.hiddenFromView = false;
        enemy.rig.root.lookAt(this.playerPos.x, 0, this.playerPos.z);
        enemy.frozenTimer = 4.0;
        enemy.chasing = false;
        this.emitHud(0.9);
        return;
      }

      // Second time reaching 0 lives in the same stage -> final fatal Game Over
      this.startFatalCutscene();
      return;
    }

    this.jumpscareKind = 'entity';
    this.jumpscareDuration = 1.05;
    this.jumpscareTimer = this.jumpscareDuration;
    this.activeJumpscareEnemy = enemy;
    this.shakeIntensity = this.cinematicEffectsEnabled ? 0.42 : 0;
    this.strobePhase = 'red';

    // Snap enemy cleanly in front of player's line of sight, clamped away from walls/furniture
    const dirX = -Math.sin(this.yaw);
    const dirZ = -Math.cos(this.yaw);
    const targetX = this.playerPos.x + dirX * 0.92;
    const targetZ = this.playerPos.z + dirZ * 0.92;
    if (this.levelData) {
      const safePos = resolveCircleAABB(
        targetX,
        targetZ,
        0.38,
        this.levelData.colliders,
        this.levelData.bounds,
        this.extraDoorColliders
      );
      enemy.rig.root.position.set(safePos.x, 0, safePos.z);
    } else {
      enemy.rig.root.position.set(targetX, 0, targetZ);
    }
    enemy.rig.root.visible = true;
    enemy.hiddenFromView = false;
    enemy.rig.root.lookAt(this.playerPos.x, 0, this.playerPos.z);
    enemy.frozenTimer = 5.2;
    enemy.chasing = false;
    enemy.aiState = 'frozenByLantern';
    enemy.path = [];
    this.emitHud(0.9);
  }

  private finishJumpscare(): void {
    const kind = this.jumpscareKind;
    this.jumpscareKind = null;
    this.strobePhase = 'none';
    this.flashlight.color.setHex(0xfef3c7);

    if (this.pendingRetryTrigger) {
      this.pendingRetryTrigger = false;
      this.activeJumpscareEnemy = null;
      this.phase = 'retry';
      this.clearInputs();
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock?.();
      }
      this.emitHud();
      this.callbacks.onCheckpointRetryRequested();
      return;
    }

    if (kind === 'entity') {
      // Knock Bima slightly back safely & grant 4-second grace period
      const backX = this.playerPos.x + Math.sin(this.yaw) * 1.4;
      const backZ = this.playerPos.z + Math.cos(this.yaw) * 1.4;
      if (!this.collidesAt(backX, this.playerPos.z)) this.playerPos.x = backX;
      if (!this.collidesAt(this.playerPos.x, backZ)) this.playerPos.z = backZ;

      this.graceTimer = 4.0;
      if (this.activeJumpscareEnemy) {
        // Push entity back to far waypoint so Bima has clear breathing room
        const wp = this.activeJumpscareEnemy.waypoints[0];
        this.activeJumpscareEnemy.rig.root.position.copy(wp);
        this.activeJumpscareEnemy.frozenTimer = 4.2;
        this.activeJumpscareEnemy = null;
      }
    }
    this.emitHud();
  }

  private startFatalCutscene(): void {
    this.startCutscene('fatal_12s', () => {
      this.phase = 'gameover';
      this.emitHud();
      this.callbacks.onGameOver();
    });
  }

  private playCutsceneAudioCue(cue: CutsceneAudioCue): void {
    if (cue === 'clock') this.audio.playClockToll();
    else if (cue === 'whisper') this.audio.playWhisperStatic();
    else if (cue === 'door') this.audio.playDoorSlam();
    else if (cue === 'chain') this.audio.playChainRattle();
    else if (cue === 'ice') this.audio.playIceShatter();
    else if (cue === 'chime') this.audio.playMemoryChime();
    else if (cue === 'finalChord') this.audio.playCutsceneFinalChord();
    else if (cue === 'shatter') this.audio.playGlassShatterMassive();
  }

  private startCutscene(id: CutsceneId, onComplete: () => void): void {
    this.playedCutscenes.add(id);
    this.activeCutsceneId = id;
    this.phase = 'cutscene';
    this.cutsceneTime = 0;
    this.cutsceneCueFired.clear();
    this.cutsceneStageSwapped = false;
    this.cutsceneDomeLoaded = false;
    this.cutsceneOnComplete = onComplete;
    this.lastEmittedCutsceneKey = '';

    this.jumpscareTimer = 0;
    this.jumpscareKind = null;
    this.strobePhase = 'none';
    this.clearInputs();
    if (document.pointerLockElement === this.renderer.domElement) {
      document.exitPointerLock?.();
    }

    if (id === 'prologue_collapse') {
      this.storyPhase = 'transitioning';
      this.targetHorrorBlend = 1.0;
    }

    this.cutsceneSavedPos.copy(this.playerPos);
    this.cutsceneSavedYaw = this.yaw;
    this.cutsceneSavedPitch = this.pitch;
    this.cutsceneSavedEnemyPos = [];
    this.cutsceneSavedEnemyRotY = [];
    if (this.levelData) {
      for (const e of this.levelData.enemies) {
        this.cutsceneSavedEnemyPos.push(e.rig.root.position.clone());
        this.cutsceneSavedEnemyRotY.push(e.rig.root.rotation.y);
        e.chasing = false;
        e.rig.root.visible = true;
        e.hiddenFromView = false;
      }
    }

    if (id === 'fatal_12s') {
      this.audio.playGlassShatterMassive();
      this.audio.playJumpscareShriek();
      this.flashlight.intensity = 0;
      this.droppedFlashlight = createDroppedFlashlight();
      const fx = -Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      this.droppedFlashlight.group.position.set(
        this.playerPos.x + fx * 1.1,
        0.055,
        this.playerPos.z + fz * 1.1
      );
      this.droppedFlashlight.group.rotation.y = this.yaw + 0.4;
      this.scene.add(this.droppedFlashlight.group);
    } else if (id === 'babak1_stalker_reveal' && this.levelData?.enemies[0]) {
      this.levelData.enemies[0].rig.root.visible = true;
      this.levelData.enemies[0].rig.root.position.set(-1.7, 0, -9.5);
    } else if (id === 'babak2_authority_reveal' && this.levelData?.enemies[0]) {
      this.levelData.enemies[0].rig.root.visible = true;
      this.levelData.enemies[0].rig.root.position.set(0, 0, -20.6);
    } else if (id === 'babak3_corridor_dread' && this.levelData?.enemies[1]) {
      this.levelData.enemies[1].rig.root.visible = true;
      this.levelData.enemies[1].rig.root.position.set(0.15, 0, -28.5);
    }

    this.emitCutsceneOverlay(id, 0);
    this.emitHud(id === 'fatal_12s' ? 0.5 : 8);
  }

  private emitCutsceneOverlay(id: CutsceneId, t: number): void {
    const meta = CUTSCENE_CATALOG[id];
    const sub = sampleCutsceneSubtitle(meta, t);
    const fadeOpacity = sampleCutsceneFade(id, t, meta.duration);
    const canSkip = t >= meta.skipLockSeconds;
    const letterbox = this.cinematicEffectsEnabled;
    const key = `${id}|${sub.speaker ?? ''}|${sub.text ?? ''}|${fadeOpacity.toFixed(2)}|${canSkip ? 1 : 0}|${letterbox ? 1 : 0}`;
    if (key === this.lastEmittedCutsceneKey) return;
    this.lastEmittedCutsceneKey = key;
    this.callbacks.onCutsceneStateChange({
      id,
      speaker: sub.speaker,
      subtitle: sub.text,
      fadeOpacity,
      canSkip,
      letterbox,
    });
  }

  private refreshExtraDoorColliders(): void {
    if (!this.levelData || this.layerIndex !== 2) {
      this.extraDoorColliders = [];
      return;
    }
    const cols: AABB[] = [];
    for (const ad of this.levelData.autoDoors) {
      const angle = ad.pivot.rotation.y;
      const tipX = ad.hingeX + ad.directionSign * ad.leafLength * Math.cos(angle);
      const tipZ = ad.hingeZ - ad.directionSign * ad.leafLength * Math.sin(angle);
      const pad = 0.08;
      cols.push({
        minX: Math.min(ad.hingeX, tipX) - pad,
        maxX: Math.max(ad.hingeX, tipX) + pad,
        minZ: Math.min(ad.hingeZ, tipZ) - pad,
        maxZ: Math.max(ad.hingeZ, tipZ) + pad,
      });
    }
    this.extraDoorColliders = cols;
  }

  private updateAutoDoors(dt: number, cutsceneT: number | null): void {
    if (!this.levelData || this.layerIndex !== 2) return;
    for (const ad of this.levelData.autoDoors) {
      if (cutsceneT !== null && this.activeCutsceneId === 'babak3_corridor_dread') {
        ad.triggered = true;
        // Slam shut during 0..3.1s for dramatic shock, then rebound open cleanly so player is never softlocked
        ad.targetYaw = cutsceneT < 3.1 ? ad.closedYaw : ad.openYaw;
      } else {
        ad.targetYaw = ad.openYaw;
      }
      ad.pivot.rotation.y = THREE.MathUtils.damp(ad.pivot.rotation.y, ad.targetYaw, 14, dt);
    }
    this.refreshExtraDoorColliders();
  }

  private finishActiveCutscene(skipped: boolean): void {
    const id = this.activeCutsceneId;
    const cb = this.cutsceneOnComplete;
    this.activeCutsceneId = null;
    this.cutsceneOnComplete = null;
    this.cutsceneCueFired.clear();
    this.lastEmittedCutsceneKey = '';

    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.camera.rotation.z = 0;

    if (id === 'prologue_collapse' && !this.cutsceneStageSwapped) {
      this.cutsceneStageSwapped = true;
      this.loadLayer(0);
    }

    if (
      id === 'babak1_stalker_reveal' ||
      id === 'babak2_authority_reveal' ||
      id === 'babak3_corridor_dread'
    ) {
      if (id === 'babak3_corridor_dread' && this.levelData) {
        // Guarantee Stage III double doors swing wide open after cutscene or skip
        for (const ad of this.levelData.autoDoors) {
          ad.triggered = true;
          ad.targetYaw = ad.openYaw;
          ad.pivot.rotation.y = ad.openYaw;
        }
        this.refreshExtraDoorColliders();
      }

      if (this.levelData) {
        const safePos = resolveCircleAABB(
          this.cutsceneSavedPos.x,
          this.cutsceneSavedPos.z,
          0.42,
          this.levelData.colliders,
          this.levelData.bounds,
          this.extraDoorColliders
        );
        this.playerPos.set(safePos.x, this.cutsceneSavedPos.y, safePos.z);
      } else {
        this.playerPos.copy(this.cutsceneSavedPos);
      }
      this.yaw = this.cutsceneSavedYaw;
      this.pitch = this.cutsceneSavedPitch;
      this.flashlight.intensity = 5.6;
      this.graceTimer = Math.max(this.graceTimer, 2.8);

      if (this.levelData) {
        this.levelData.enemies.forEach((enemy, idx) => {
          const savedPos = this.cutsceneSavedEnemyPos[idx];
          if (savedPos) {
            const d = Math.hypot(savedPos.x - this.playerPos.x, savedPos.z - this.playerPos.z);
            if (d > 6.5) {
              enemy.rig.root.position.copy(savedPos);
            } else {
              enemy.rig.root.position.copy(enemy.waypoints[0]);
            }
          } else {
            enemy.rig.root.position.copy(enemy.waypoints[0]);
          }
          enemy.rig.root.rotation.y = this.cutsceneSavedEnemyRotY[idx] ?? 0;
          enemy.frozenTimer = Math.max(enemy.frozenTimer, 1.5);
          enemy.chasing = false;
        });
      }
    } else if (id === 'babak4_dome_intro' && this.levelData) {
      this.playerPos.copy(this.levelData.playerSpawn);
      this.yaw = this.levelData.playerYaw;
      this.pitch = 0;
      this.flashlight.intensity = 5.6;
      this.graceTimer = 2.5;
    }

    if (skipped && id === 'fatal_12s') {
      if (this.droppedFlashlight) {
        this.scene.remove(this.droppedFlashlight.group);
        this.disposeObjectTree(this.droppedFlashlight.group);
        this.droppedFlashlight = null;
      }
    }

    this.clearInputs();
    this.callbacks.onCutsceneStateChange(null);
    if (cb) {
      cb();
    } else {
      this.phase = 'playing';
      this.emitHud();
    }
  }

  private setCameraPoseSmooth(
    posX: number,
    posY: number,
    posZ: number,
    lookX: number,
    lookY: number,
    lookZ: number,
    fov = 72,
    roll = 0
  ): void {
    this.camera.position.set(posX, posY, posZ);
    _lookTarget.set(lookX, lookY, lookZ);
    this.camera.lookAt(_lookTarget);
    const targetFov = this.cinematicEffectsEnabled ? fov : 72;
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    }
    this.camera.rotation.z = this.cinematicEffectsEnabled ? roll : 0;
  }

  private updateCutscene(dt: number, elapsed: number): void {
    if (!this.activeCutsceneId) return;
    const id = this.activeCutsceneId;
    const meta = CUTSCENE_CATALOG[id];

    this.cutsceneTime += dt;
    const t = this.cutsceneTime;
    this.updateSnow(dt, elapsed);
    if (this.levelData) {
      this.updateLivingEnvironment(dt, elapsed);
    }

    // Fire timed audio cues once
    meta.audioCues.forEach((cueEntry, idx) => {
      if (t >= cueEntry.at && !this.cutsceneCueFired.has(idx)) {
        this.cutsceneCueFired.add(idx);
        this.playCutsceneAudioCue(cueEntry.cue);
      }
    });

    if (id === 'prologue_collapse') {
      this.targetHorrorBlend = 1.0;
      this.horrorBlend = THREE.MathUtils.damp(this.horrorBlend, this.targetHorrorBlend, 3.2, dt);
      if (!this.cutsceneStageSwapped) {
        this.applyCampusAtmosphere(this.horrorBlend);
      }
      this.flashlight.intensity = t < 2.65 ? 0 : THREE.MathUtils.lerp(1.5, 4.8, Math.min(1, (t - 2.65) / 1.5));
      if (t < 2.65) {
        const p = easeInOutSine(t / 2.65);
        if (this.campusScene) {
          animateCharacterPose(this.campusScene.rindiRig, 'seatedHug', elapsed);
          animateCharacterPose(this.campusScene.bimaRig, 'idle', elapsed);
        }
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(2.55, 1.45, p),
          THREE.MathUtils.lerp(1.72, 1.36, p),
          THREE.MathUtils.lerp(2.35, 0.85, p),
          THREE.MathUtils.lerp(0.35, 0.05, p),
          THREE.MathUtils.lerp(1.05, 0.96, p),
          THREE.MathUtils.lerp(-0.5, -1.08, p),
          THREE.MathUtils.lerp(72, 58, p)
        );
      } else {
        if (!this.cutsceneStageSwapped) {
          this.cutsceneStageSwapped = true;
          this.loadLayer(0);
          this.phase = 'cutscene';
        }
        const p = easeOutCubic((t - 2.65) / (meta.duration - 2.65));
        const spZ = this.levelData?.playerSpawn.z ?? 13.6;
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(1.1, 0, p),
          THREE.MathUtils.lerp(2.05, 1.65, p),
          THREE.MathUtils.lerp(spZ - 6.2, spZ, p),
          0,
          THREE.MathUtils.lerp(1.38, 1.65, p),
          THREE.MathUtils.lerp(-2.5, 4.0, p),
          THREE.MathUtils.lerp(62, 72, p)
        );
      }
      this.audio.updateAmbience(dt, 0.65, 99, false, 0, false, this.horrorBlend, 1);
    } else if (id === 'babak1_stalker_reveal') {
      const enemy = this.levelData?.enemies[0];
      const sp = this.cutsceneSavedPos;
      const sx = sp.x;
      const sy = sp.y;
      const sz = sp.z;
      const lookDefaultX = sx - Math.sin(this.cutsceneSavedYaw) * 8;
      const lookDefaultZ = sz - Math.cos(this.cutsceneSavedYaw) * 8;

      if (enemy) {
        animateCharacterPose(enemy.rig, 'shadowStalk', elapsed);
        if (t < 2.2) {
          const mp = easeInOutSine(t / 2.2);
          enemy.rig.root.position.set(THREE.MathUtils.lerp(-1.65, 0.0, mp), 0, -9.5);
          enemy.rig.root.rotation.y = Math.PI * 0.5;
        } else if (t < 3.6) {
          const turnP = easeInOutSine((t - 2.2) / 0.8);
          enemy.rig.root.position.set(0.0, 0, -9.5);
          enemy.rig.root.rotation.y = THREE.MathUtils.lerp(Math.PI * 0.5, 0, turnP);
          enemy.rig.head.rotation.z = Math.sin(elapsed * 2.5) * 0.24;
        } else {
          const exitP = easeInOutSine((t - 3.6) / 1.5);
          enemy.rig.root.position.set(THREE.MathUtils.lerp(0.0, 1.85, exitP), 0, -9.5);
          enemy.rig.root.rotation.y = Math.PI * 0.45;
        }
      }

      if (t < 1.1) {
        const p = easeInOutSine(t / 1.1);
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(sx, 0.28, p),
          THREE.MathUtils.lerp(sy, 1.52, p),
          THREE.MathUtils.lerp(sz, -0.65, p),
          THREE.MathUtils.lerp(lookDefaultX, 0.0, p),
          THREE.MathUtils.lerp(sy + Math.sin(this.cutsceneSavedPitch) * 6, 1.44, p),
          THREE.MathUtils.lerp(lookDefaultZ, -9.5, p),
          THREE.MathUtils.lerp(72, 56, p)
        );
      } else if (t < 4.15) {
        const p = easeInOutSine((t - 1.1) / 3.05);
        this.flashlight.intensity = t > 2.2 && t < 2.75 && Math.sin(elapsed * 28) > 0.15 ? 1.8 : 5.6;
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(0.28, -0.18, p),
          1.52 + (this.cinematicEffectsEnabled ? Math.sin(elapsed * 1.4) * 0.015 : 0),
          THREE.MathUtils.lerp(-0.65, -2.1, p),
          0.0,
          1.45,
          -9.5,
          THREE.MathUtils.lerp(56, 52, p)
        );
      } else {
        this.flashlight.intensity = 5.6;
        const p = easeOutCubic((t - 4.15) / (meta.duration - 4.15));
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(-0.18, sx, p),
          THREE.MathUtils.lerp(1.52, sy, p),
          THREE.MathUtils.lerp(-2.1, sz, p),
          THREE.MathUtils.lerp(0.0, lookDefaultX, p),
          THREE.MathUtils.lerp(1.45, sy + Math.sin(this.cutsceneSavedPitch) * 6, p),
          THREE.MathUtils.lerp(-9.5, lookDefaultZ, p),
          THREE.MathUtils.lerp(52, 72, p)
        );
      }
      this.audio.updateAmbience(dt, this.frostLevel, 5.5, false, this.layerIndex, false);
    } else if (id === 'babak2_authority_reveal') {
      const enemy = this.levelData?.enemies[0];
      const sp = this.cutsceneSavedPos;
      const lookDefaultX = sp.x - Math.sin(this.cutsceneSavedYaw) * 8;
      const lookDefaultZ = sp.z - Math.cos(this.cutsceneSavedYaw) * 8;

      if (enemy) {
        animateCharacterPose(enemy.rig, 'shadowStalk', elapsed);
        if (t < 3.2) {
          const adv = easeInOutSine(t / 3.2);
          enemy.rig.root.position.set(0, 0, THREE.MathUtils.lerp(-20.8, -17.6, adv));
          enemy.rig.root.rotation.y = 0;
        } else {
          const ret = easeInOutSine((t - 3.2) / 1.8);
          enemy.rig.root.position.set(0, 0, THREE.MathUtils.lerp(-17.6, -21.8, ret));
          enemy.rig.root.rotation.y = Math.PI;
        }
      }

      if (t < 1.15) {
        const p = easeInOutSine(t / 1.15);
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(sp.x, 0.0, p),
          THREE.MathUtils.lerp(sp.y, 1.38, p),
          THREE.MathUtils.lerp(sp.z, -8.5, p),
          THREE.MathUtils.lerp(lookDefaultX, 0.0, p),
          THREE.MathUtils.lerp(sp.y, 1.56, p),
          THREE.MathUtils.lerp(lookDefaultZ, -20.5, p),
          THREE.MathUtils.lerp(72, 54, p)
        );
      } else if (t < 3.95) {
        const p = easeInOutSine((t - 1.15) / 2.8);
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(0.0, 0.14, p),
          1.38 + (this.cinematicEffectsEnabled ? Math.sin(elapsed * 1.6) * 0.015 : 0),
          THREE.MathUtils.lerp(-8.5, -10.9, p),
          0.0,
          1.56,
          -20.5,
          THREE.MathUtils.lerp(54, 50, p)
        );
      } else {
        const p = easeOutCubic((t - 3.95) / (meta.duration - 3.95));
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(0.14, sp.x, p),
          THREE.MathUtils.lerp(1.38, sp.y, p),
          THREE.MathUtils.lerp(-10.9, sp.z, p),
          THREE.MathUtils.lerp(0.0, lookDefaultX, p),
          THREE.MathUtils.lerp(1.56, sp.y + Math.sin(this.cutsceneSavedPitch) * 6, p),
          THREE.MathUtils.lerp(-20.5, lookDefaultZ, p),
          THREE.MathUtils.lerp(50, 72, p)
        );
      }
      this.audio.updateAmbience(dt, this.frostLevel, 4.8, false, this.layerIndex, false);
    } else if (id === 'babak3_corridor_dread') {
      this.updateAutoDoors(dt, t);
      const enemy = this.levelData?.enemies[1];
      const sp = this.cutsceneSavedPos;
      const lookDefaultX = sp.x - Math.sin(this.cutsceneSavedYaw) * 8;
      const lookDefaultZ = sp.z - Math.cos(this.cutsceneSavedYaw) * 8;

      if (enemy) {
        animateCharacterPose(enemy.rig, 'shadowStalk', elapsed);
        if (t < 2.8) {
          enemy.rig.root.position.set(0.15, 0, -28.5);
          enemy.rig.root.rotation.y = 0;
        } else {
          const sl = easeInOutSine((t - 2.8) / 1.8);
          enemy.rig.root.position.set(THREE.MathUtils.lerp(0.15, 2.3, sl), 0, -28.5);
          enemy.rig.root.rotation.y = Math.PI * 0.5;
        }
      }

      if (t < 1.3) {
        const p = easeInOutCubic(t / 1.3);
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(sp.x, 0.0, p),
          THREE.MathUtils.lerp(sp.y, 1.5, p),
          THREE.MathUtils.lerp(sp.z, -23.8, p),
          THREE.MathUtils.lerp(lookDefaultX, 0.0, p),
          THREE.MathUtils.lerp(sp.y, 1.48, p),
          THREE.MathUtils.lerp(lookDefaultZ, -30.5, p),
          THREE.MathUtils.lerp(72, 56, p)
        );
      } else if (t < 3.6) {
        const p = easeInOutSine((t - 1.3) / 2.3);
        this.setCameraPoseSmooth(
          0.0,
          1.5,
          THREE.MathUtils.lerp(-23.8, -25.0, p),
          0.0,
          1.45,
          -31.0,
          THREE.MathUtils.lerp(56, 52, p)
        );
      } else {
        const p = easeOutCubic((t - 3.6) / (meta.duration - 3.6));
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(0.0, sp.x, p),
          THREE.MathUtils.lerp(1.5, sp.y, p),
          THREE.MathUtils.lerp(-25.0, sp.z, p),
          THREE.MathUtils.lerp(0.0, lookDefaultX, p),
          THREE.MathUtils.lerp(1.45, sp.y + Math.sin(this.cutsceneSavedPitch) * 6, p),
          THREE.MathUtils.lerp(-31.0, lookDefaultZ, p),
          THREE.MathUtils.lerp(52, 72, p)
        );
      }
      this.audio.updateAmbience(dt, this.frostLevel, 5.2, false, this.layerIndex, false);
    } else if (id === 'babak4_dome_intro') {
      const domeCtrl = this.levelData?.domeController;
      if (domeCtrl) {
        animateCharacterPose(domeCtrl.rindiRig, 'seatedHug', elapsed);
      }
      this.flashlight.intensity = t > 4.0 ? THREE.MathUtils.lerp(0, 5.6, (t - 4.0) / 1.4) : 0;

      if (t < 3.5) {
        const p = easeInOutSine(t / 3.5);
        const angle = THREE.MathUtils.lerp(0.85, -0.15, p);
        const radius = THREE.MathUtils.lerp(10.5, 6.2, p);
        this.setCameraPoseSmooth(
          Math.sin(angle) * radius,
          THREE.MathUtils.lerp(4.8, 2.25, p),
          Math.cos(angle) * radius,
          0,
          1.15,
          0,
          THREE.MathUtils.lerp(60, 54, p)
        );
      } else {
        const p = easeOutCubic((t - 3.5) / (meta.duration - 3.5));
        const sp = this.levelData?.playerSpawn ?? this.playerPos;
        this.setCameraPoseSmooth(
          THREE.MathUtils.lerp(Math.sin(-0.15) * 6.2, sp.x, p),
          THREE.MathUtils.lerp(2.25, sp.y, p),
          THREE.MathUtils.lerp(Math.cos(-0.15) * 6.2, sp.z, p),
          0,
          THREE.MathUtils.lerp(1.15, 1.55, p),
          0,
          THREE.MathUtils.lerp(54, 72, p)
        );
      }
      this.audio.updateAmbience(dt, this.frostLevel, 12, false, this.layerIndex, false);
    } else if (id === 'babak4_liberation') {
      const domeCtrl = this.levelData?.domeController;
      const p = easeInOutSine(t / meta.duration);
      this.flashlight.intensity = THREE.MathUtils.lerp(4.2, 0, Math.min(1, p * 1.4));
      if (domeCtrl) {
        animateCharacterPose(domeCtrl.rindiRig, 'seatedHug', elapsed);
        const mat = domeCtrl.domeMesh.material as THREE.MeshPhysicalMaterial;
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.06, Math.min(1, dt * 1.8));
        domeCtrl.iceRibs.scale.setScalar(Math.max(0.02, 1.0 - p * 0.96));
        domeCtrl.domeLight.color.setHex(0xd4a353);
        domeCtrl.domeLight.intensity = 3.5 + p * 2.2;
      }
      this.setCameraPoseSmooth(
        THREE.MathUtils.lerp(this.cutsceneSavedPos.x, 0.15, Math.min(1, p * 1.15)),
        THREE.MathUtils.lerp(this.cutsceneSavedPos.y, 1.42, p),
        THREE.MathUtils.lerp(this.cutsceneSavedPos.z, 3.25, p),
        0,
        1.05,
        0,
        THREE.MathUtils.lerp(72, 56, p)
      );
      this.audio.updateAmbience(dt, Math.max(0.15, this.frostLevel * (1 - p)), 99, false, this.layerIndex, false);
    } else if (id === 'fatal_12s') {
      // Shot 1 (0 - 3s): Camera collapses on floor tilted 75°, watching dropped flashlight roll & flicker 3x
      if (t < 3.0) {
        if (this.droppedFlashlight) {
          const roll = Math.min(0.65, t * 0.28);
          this.droppedFlashlight.group.position.z -= dt * 0.14;
          this.droppedFlashlight.group.rotation.x = roll;

          let power = 1.0;
          if ((t > 0.7 && t < 0.88) || (t > 1.35 && t < 1.54) || (t > 2.05 && t < 2.26)) {
            power = 0.08;
          } else if (t >= 2.55) {
            power = 0;
          }
          this.droppedFlashlight.beamLight.intensity = power * 6.5;
          this.droppedFlashlight.lensMat.emissiveIntensity = power * 2.2;
        }

        const dPos = this.droppedFlashlight ? this.droppedFlashlight.group.position : this.playerPos;
        this.setCameraPoseSmooth(
          this.playerPos.x + Math.sin(this.yaw) * 0.35,
          THREE.MathUtils.lerp(1.3, 0.22, Math.min(1, t * 1.8)),
          this.playerPos.z + Math.cos(this.yaw) * 0.35,
          dPos.x,
          0.06,
          dPos.z,
          70,
          THREE.MathUtils.lerp(0, 1.31, Math.min(1, t * 2.2))
        );
        this.audio.updateAmbience(dt, 0.95, 3, false, this.layerIndex, false);
      } else {
        if (!this.cutsceneDomeLoaded) {
          this.cutsceneDomeLoaded = true;
          this.loadLayer(3);
          this.phase = 'cutscene';
          this.flashlight.intensity = 0;
          this.camera.rotation.z = 0;
          this.fog.density = 0.025;

          if (this.levelData) {
            this.levelData.enemies.forEach((e) => {
              this.scene.remove(e.rig.root);
            });
            this.levelData.enemies = [];
            if (this.levelData.domeController) {
              this.levelData.domeController.tendrilGroup.visible = true;
              this.levelData.domeController.domeLight.color.setHex(0x3b82f6);
              this.levelData.domeController.domeLight.intensity = 3.2;
            }
          }

          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + 0.25;
            const sh = createArticulatedShadow(this.textures, i % 2 === 0);
            sh.root.position.set(Math.cos(a) * 3.85, 0, Math.sin(a) * 3.85);
            sh.root.lookAt(0, 0, 0);
            this.scene.add(sh.root);
            this.cutsceneShadows.push(sh);
          }
        }

        const domeCtrl = this.levelData?.domeController;

        if (t < 6.0) {
          const localT = (t - 3.0) / 3.0;
          if (domeCtrl) {
            domeCtrl.tendrilGroup.scale.set(
              1,
              THREE.MathUtils.lerp(0.05, 1.18, Math.min(1, localT * 1.4)),
              1
            );
            animateCharacterPose(domeCtrl.rindiRig, 'seatedHug', elapsed);
          }
          this.cutsceneShadows.forEach((sh, idx) => {
            animateCharacterPose(sh, 'shadowStalk', elapsed + idx);
            sh.torso.rotation.x = 0.35 + Math.sin(elapsed * 1.6 + idx) * 0.06;
          });
          const orbitA = 0.3 + localT * 0.7;
          this.setCameraPoseSmooth(
            Math.sin(orbitA) * 5.6,
            1.85,
            Math.cos(orbitA) * 5.6,
            0,
            1.05,
            0,
            64,
            0
          );
          this.audio.updateAmbience(dt, 1.0, 2.5, false, this.layerIndex, false);
        } else if (t < 9.0) {
          const localT = (t - 6.0) / 3.0;
          if (domeCtrl) {
            const eyesClosed = localT > 0.42;
            animateCharacterPose(domeCtrl.rindiRig, 'seatedHug', elapsed, 1, eyesClosed);
            const domeMat = domeCtrl.domeMesh.material as THREE.MeshPhysicalMaterial;
            domeMat.transmission = 0;
            domeMat.opacity = THREE.MathUtils.lerp(0.45, 0.97, Math.max(0, (localT - 0.3) / 0.7));
            domeMat.color.setHex(0x0c1b2e);
            domeCtrl.iceRibs.scale.setScalar(1.0 + localT * 0.25);
            domeCtrl.domeLight.intensity = Math.max(0.2, 3.0 - localT * 2.7);
            if (localT > 0.92) {
              domeCtrl.rindiRig.root.visible = false;
            }
          }
          this.setCameraPoseSmooth(0.18, 1.05, 1.62 + localT * 0.75, 0, 0.92, 0.05, 58, 0);
          this.audio.updateAmbience(dt, 1.0, 2.0, false, this.layerIndex, false);
        } else {
          const localT = (t - 9.0) / 3.0;
          this.fog.density = 0.025 + localT * 0.022;
          this.setCameraPoseSmooth(
            0,
            THREE.MathUtils.lerp(2.4, 10.5, localT),
            THREE.MathUtils.lerp(4.2, 13.5, localT),
            0,
            0.8,
            0,
            68,
            0
          );
          this.audio.updateAmbience(dt, 1.0, 99, false, this.layerIndex, false);
        }
      }
    }

    this.emitCutsceneOverlay(id, t);

    if (t >= meta.duration) {
      this.finishActiveCutscene(false);
    }
  }

  private updateSnow(dt: number, elapsed: number): void {
    if (!this.snowEnabled) return;
    const snowArr = this.snowPoints.geometry.attributes.position.array as Float32Array;
    const center = this.campusScene ? 0 : this.playerPos.x;
    const centerZ = this.campusScene ? 0 : this.playerPos.z;
    const speedMult = this.activeCutsceneId === 'fatal_12s' ? 2.4 : 1.0;

    for (let i = 0; i < this.snowCount; i++) {
      const idx = i * 3;
      snowArr[idx + 1] -= this.snowSpeeds[i] * speedMult * dt;
      snowArr[idx] += Math.sin(elapsed * 0.8 + i) * 0.3 * speedMult * dt;
      if (snowArr[idx + 1] < 0) {
        snowArr[idx + 1] = 11.5;
        snowArr[idx] = center + (Math.random() - 0.5) * 48;
        snowArr[idx + 2] = centerZ + (Math.random() - 0.5) * 48;
      }
    }
    this.snowPoints.geometry.attributes.position.needsUpdate = true;
  }

  private updateDustMotes(elapsed: number): void {
    this.dustPoints.visible = !this.campusScene && this.phase === 'playing';
    if (!this.dustPoints.visible) return;
    const arr = this.dustPoints.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.dustCount; i++) {
      const idx = i * 3;
      arr[idx] = this.playerPos.x + this.dustBaseOffsets[idx] + Math.sin(elapsed * 0.45 + i) * 0.16;
      arr[idx + 1] = this.dustBaseOffsets[idx + 1] + Math.cos(elapsed * 0.35 + i * 0.7) * 0.12;
      arr[idx + 2] = this.playerPos.z + this.dustBaseOffsets[idx + 2] + Math.cos(elapsed * 0.42 + i) * 0.16;
    }
    this.dustPoints.geometry.attributes.position.needsUpdate = true;
  }

  private updateLivingEnvironment(dt: number, elapsed: number): void {
    if (!this.levelData) return;

    for (const anim of this.levelData.animatedObjects) {
      if (anim.mode === 'pencil') {
        anim.mesh.rotation.y += dt * 0.72;
      } else if (anim.mode === 'spinY') {
        anim.mesh.rotation.y += dt * 1.4;
      } else if (anim.mode === 'bob') {
        anim.mesh.rotation.y += dt * 0.9;
        anim.mesh.position.y += Math.sin(elapsed * 2.4) * 0.0018;
      }
    }

    // Swaying night curtains
    for (let i = 0; i < this.levelData.curtainMeshes.length; i++) {
      const c = this.levelData.curtainMeshes[i];
      c.rotation.z = Math.sin(elapsed * 1.6 + i * 1.2) * 0.055;
      c.rotation.x = Math.cos(elapsed * 1.1 + i) * 0.04;
    }

    // Erratically spinning wall clock hands
    for (const ch of this.levelData.clockHands) {
      const jitter = Math.sin(elapsed * 7.5) > 0.35 ? 1.8 : -0.4;
      if (ch.minute) ch.minute.rotation.z -= dt * (2.6 + jitter);
      if (ch.hour) ch.hour.rotation.z -= dt * 0.45;
    }

    // Flickering fluorescent tubes
    if (this.buzzCooldown > 0) this.buzzCooldown -= dt;
    for (const fl of this.levelData.flickerLights) {
      const wave = Math.sin(elapsed * 19.0 + fl.seed) * Math.sin(elapsed * 7.3 + fl.seed * 2);
      const on = wave > -0.58;
      fl.light.intensity = on ? 2.1 : 0.12;
      fl.tubeMat.emissiveIntensity = on ? 1.6 : 0.08;
      if (!on && this.buzzCooldown <= 0 && this.phase === 'playing') {
        this.buzzCooldown = 2.6;
        this.audio.playElectricBuzz();
      }
    }

    // Share-Loc floor light ripples
    for (const rip of this.levelData.beaconRipples) {
      const phase = (elapsed * 0.85) % 1;
      const sc = 0.75 + phase * 2.2;
      rip.scale.set(sc, sc, 1);
      const m = (rip as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = (1 - phase) * 0.72;
    }

    // Classroom mannequins (snap heads toward player after environmental scare triggers)
    for (const man of this.levelData.mannequins) {
      animateCharacterPose(man, 'idle', elapsed);
      if (this.mannequinsAlerted) {
        man.head.lookAt(this.playerPos.x, 1.55, this.playerPos.z);
      }
    }

    if (this.levelData.domeController) {
      animateCharacterPose(this.levelData.domeController.rindiRig, 'seatedHug', elapsed);
    }
  }

  private updateSimulation(dt: number, elapsed: number): number {
    this.updateSnow(dt, elapsed);
    this.updateDustMotes(elapsed);

    if (this.phase === 'cutscene') {
      this.updateCutscene(dt, elapsed);
      return 1;
    }

    // Campus Park Bench Scenes (Title / Prologue / Epilogue)
    if (this.campusScene) {
      this.flashlight.intensity = 0;

      if (this.phase === 'title' || this.phase === 'prologue') {
        this.horrorBlend = THREE.MathUtils.damp(this.horrorBlend, this.targetHorrorBlend, 2.4, dt);
        this.applyCampusAtmosphere(this.horrorBlend);
      }

      if (this.phase === 'title') {
        this.titleAngle += dt * 0.14;
        const camX = Math.sin(this.titleAngle) * 4.8;
        const camZ = 1.6 + Math.cos(this.titleAngle) * 2.8;
        this.camera.position.set(camX, 1.85, camZ);
        this.camera.lookAt(0, 0.95, -1.0);
        this.camera.rotation.z = 0;
        animateCharacterPose(this.campusScene.rindiRig, 'seatedHug', elapsed);
      } else if (this.phase === 'prologue') {
        const sway = this.cinematicEffectsEnabled ? Math.sin(elapsed * 0.35) * 0.14 : 0;
        const pushIn = this.horrorBlend * 0.55;
        this.camera.position.set(
          2.55 - pushIn * 0.45 + sway,
          1.72 - pushIn * 0.18,
          2.35 - pushIn * 0.8 + Math.cos(elapsed * 0.28) * 0.08
        );
        this.camera.lookAt(0.35 - pushIn * 0.18, 1.05 - pushIn * 0.05, -0.5 - pushIn * 0.35);
        this.camera.rotation.z = 0;
        animateCharacterPose(this.campusScene.rindiRig, 'seatedHug', elapsed);
        animateCharacterPose(this.campusScene.bimaRig, 'idle', elapsed);
      } else if (this.phase === 'epilogue' || this.phase === 'ending') {
        this.epilogueTime += dt;
        if (this.currentEpilogueType === 'true') {
          const craneLift = this.cinematicEffectsEnabled
            ? Math.min(0.42, this.epilogueTime * 0.04)
            : 0;
          this.camera.position.set(
            0.2 + (this.cinematicEffectsEnabled ? Math.sin(elapsed * 0.25) * 0.25 : 0),
            1.78 + craneLift,
            4.4 + craneLift * 1.4
          );
          this.camera.lookAt(0, 1.15, -1.5);
          const walkDist = Math.min(2.4, this.epilogueTime * 0.35);
          this.campusScene.rindiRig.root.position.z = 0.4 - walkDist;
          this.campusScene.bimaRig.root.position.z = 0.55 - walkDist;
          const pose = walkDist < 2.35 ? 'walk' : 'idle';
          animateCharacterPose(this.campusScene.rindiRig, pose, elapsed, 0.7);
          animateCharacterPose(this.campusScene.bimaRig, pose, elapsed, 0.7);
        } else {
          const drift = this.cinematicEffectsEnabled ? Math.sin(elapsed * 0.32) * 0.16 : 0;
          this.camera.position.set(2.4 + drift, 1.75, 2.4);
          this.camera.lookAt(0.1, 1.0, -0.9);
          animateCharacterPose(this.campusScene.rindiRig, 'seatedHug', elapsed);
          animateCharacterPose(this.campusScene.bimaRig, 'idle', elapsed);
        }
      }
      const campusBlend =
        this.currentEpilogueType === 'true' && (this.phase === 'epilogue' || this.phase === 'ending')
          ? 0
          : this.horrorBlend;
      this.audio.updateAmbience(dt, this.frostLevel, 99, false, 0, false, campusBlend, 1);
      return 99;
    }

    if (!this.levelData) return 99;

    this.updateLivingEnvironment(dt, elapsed);

    if (
      this.phase === 'dialogue' ||
      this.phase === 'inspect' ||
      this.phase === 'puzzle' ||
      this.phase === 'journal' ||
      this.phase === 'paused' ||
      this.phase === 'retry' ||
      this.phase === 'mirror' ||
      this.phase === 'gameover'
    ) {
      this.audio.updateAmbience(dt, this.frostLevel, 99, this.isHiding, this.layerIndex, false);
      return 99;
    }

    if (this.phase !== 'playing') return 99;

    if (this.damageCooldownTimer > 0) {
      this.damageCooldownTimer = Math.max(0, this.damageCooldownTimer - dt);
    }
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer = Math.max(0, this.damageFlashTimer - dt);
    }

    // Active Jumpscare Lock Sequence (Entity Ambush or Environmental Scare)
    if (this.jumpscareTimer > 0) {
      this.jumpscareTimer -= dt;
      const strobeTick = Math.floor(elapsed * 22) % 2;
      this.strobePhase = strobeTick === 0 ? 'red' : 'blue';
      this.flashlight.color.setHex(strobeTick === 0 ? 0xff3b3b : 0x3b82f6);
      this.flashlight.intensity = 9.0;

      if (this.jumpscareKind === 'entity' && this.activeJumpscareEnemy?.rig.maskAnchor) {
        this.activeJumpscareEnemy.rig.maskAnchor.getWorldPosition(this.jumpscareFocusPos);
      }

      const sx = (Math.random() - 0.5) * 0.14;
      const sy = (Math.random() - 0.5) * 0.14;
      this.camera.position.set(this.playerPos.x + sx, this.playerPos.y + sy, this.playerPos.z);
      this.camera.lookAt(this.jumpscareFocusPos);
      this.camera.rotation.z = (Math.random() - 0.5) * 0.12;

      if (this.jumpscareTimer <= 0) {
        this.camera.rotation.z = 0;
        this.finishJumpscare();
      }
      return 0.9;
    }

    this.flashlight.color.setHex(0xfef3c7);
    this.flashlight.intensity = 5.6;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return 2.0;
    }

    if (this.graceTimer > 0) this.graceTimer = Math.max(0, this.graceTimer - dt);
    if (this.lanternCooldownTimer > 0) this.lanternCooldownTimer = Math.max(0, this.lanternCooldownTimer - dt);

    if (this.lanternPulseTimer > 0) {
      this.lanternPulseTimer = Math.max(0, this.lanternPulseTimer - dt);
      const t = 1 - this.lanternPulseTimer / 1.1;
      this.lanternLight.intensity = (1 - t) * 10;
      const ringMat = this.lanternRing.material as THREE.MeshBasicMaterial;
      ringMat.opacity = (1 - t) * 0.85;
      this.lanternRing.scale.setScalar(0.5 + t * 12.5);
      if (this.lanternPulseTimer <= 0) this.lanternRing.visible = false;
    }

    // Edge-triggered actions
    const pressedE = Boolean(this.justPressed['KeyE']);
    const pressedF = Boolean(this.justPressed['KeyF']);
    this.justPressed['KeyE'] = false;
    this.justPressed['KeyF'] = false;

    const closest = this.findClosestInteractable();
    if (pressedE) {
      this.handleInteract(closest.item, closest.hideSpotIdx);
    }
    if (pressedF && !this.isHiding) {
      this.triggerLenteraKonstitusi();
    }

    // Movement (Keyboard + Virtual Dual-Stick Analog)
    let moving = false;
    let sprinting = false;
    if (!this.isHiding) {
      const keyZ =
        (this.heldKeys['KeyW'] || this.heldKeys['ArrowUp'] ? 1 : 0) -
        (this.heldKeys['KeyS'] || this.heldKeys['ArrowDown'] ? 1 : 0);
      const keyX =
        (this.heldKeys['KeyD'] || this.heldKeys['ArrowRight'] ? 1 : 0) -
        (this.heldKeys['KeyA'] || this.heldKeys['ArrowLeft'] ? 1 : 0);

      let moveZ = keyZ + this.virtualMoveY;
      let moveX = keyX + this.virtualMoveX;
      const rawMag = Math.hypot(moveX, moveZ);

      if (rawMag > 0.08) {
        moving = true;
        const clampedMag = Math.min(1, rawMag);
        moveX /= rawMag;
        moveZ /= rawMag;

        const wantSprint = Boolean(
          this.heldKeys['ShiftLeft'] ||
            this.heldKeys['ShiftRight'] ||
            this.mobileAutoSprint ||
            this.mobileSprintHeld
        );
        if (wantSprint && this.stamina > 6) {
          sprinting = true;
          this.stamina = Math.max(0, this.stamina - 28 * dt);
        } else {
          this.stamina = Math.min(100, this.stamina + 12 * dt);
        }

        const speed = (sprinting ? 6.2 : 3.85) * clampedMag;
        _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
        _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

        _vecA.set(0, 0, 0).addScaledVector(_forward, moveZ).addScaledVector(_right, moveX);
        const nextX = this.playerPos.x + _vecA.x * speed * dt;
        const nextZ = this.playerPos.z + _vecA.z * speed * dt;

        if (!this.collidesAt(nextX, this.playerPos.z)) this.playerPos.x = nextX;
        if (!this.collidesAt(this.playerPos.x, nextZ)) this.playerPos.z = nextZ;

        this.headBobPhase += dt * (sprinting ? 13 : 8.5) * clampedMag;
      } else {
        this.stamina = Math.min(100, this.stamina + 20 * dt);
      }
    } else {
      this.stamina = Math.min(100, this.stamina + 24 * dt);
    }

    // Hinged Double Doors (Babak III): trigger dramatic cutscene once, never permanently lock corridor
    for (const ad of this.levelData.autoDoors) {
      if (!ad.triggered && this.playerPos.z < ad.triggerZ) {
        ad.triggered = true;
        this.audio.playDoorSlam();
        this.audio.playWhisperStatic();
        if (this.cinematicEffectsEnabled) {
          this.shakeIntensity = Math.max(this.shakeIntensity, 0.18);
        }
        if (this.layerIndex === 2 && !this.playedCutscenes.has('babak3_corridor_dread')) {
          this.startCutscene('babak3_corridor_dread', () => {
            this.phase = 'playing';
            this.emitHud();
          });
          return 99;
        }
      }
    }
    this.updateAutoDoors(dt, null);

    // Story-driven Ghost Reveal Sightline Cutscenes (Babak I & Babak II)
    if (
      this.layerIndex === 0 &&
      !this.isHiding &&
      !this.playedCutscenes.has('babak1_stalker_reveal') &&
      Math.abs(this.playerPos.x) < 1.85 &&
      this.playerPos.z < 1.8 &&
      this.playerPos.z > -1.6
    ) {
      this.startCutscene('babak1_stalker_reveal', () => {
        this.phase = 'playing';
        this.emitHud();
      });
      return 99;
    }

    if (
      this.layerIndex === 1 &&
      !this.isHiding &&
      !this.playedCutscenes.has('babak2_authority_reveal') &&
      Math.abs(this.playerPos.x) < 2.1 &&
      this.playerPos.z < -6.8 &&
      this.playerPos.z > -10.2
    ) {
      this.startCutscene('babak2_authority_reveal', () => {
        this.phase = 'playing';
        this.emitHud();
      });
      return 99;
    }

    // Environmental Jumpscare Triggers (Wardrobe / Mannequins / Glitch Phone)
    for (const scare of this.levelData.envScares) {
      if (!scare.fired && !this.isHiding) {
        const d = Math.hypot(this.playerPos.x - scare.position.x, this.playerPos.z - scare.position.z);
        if (d <= scare.radius) {
          scare.fired = true;
          this.jumpscareKind = scare.kind;
          this.jumpscareDuration = 0.72;
          this.jumpscareTimer = this.jumpscareDuration;
          this.jumpscareFocusPos.copy(scare.focusTarget);
          this.shakeIntensity = this.cinematicEffectsEnabled ? 0.3 : 0;

          if (scare.kind === 'wardrobe') {
            this.wardrobeSlamFired = true;
            this.audio.playDoorSlam();
            this.audio.playJumpscareShriek();
          } else if (scare.kind === 'mannequins') {
            this.mannequinsAlerted = true;
            this.audio.playMetalBang();
          } else if (scare.kind === 'glitchPhone') {
            if (scare.glitchScreenGroup) {
              scare.glitchScreenGroup.visible = true;
              scare.glitchScreenGroup.lookAt(this.playerPos.x, 1.75, this.playerPos.z);
            }
            this.audio.playNotificationGlitch();
            this.audio.playJumpscareShriek();
          }
          break;
        }
      }
      if (scare.fired && scare.kind === 'wardrobe' && this.wardrobeSlamFired) {
        if (scare.doorLeftPivot) {
          scare.doorLeftPivot.rotation.y = THREE.MathUtils.damp(scare.doorLeftPivot.rotation.y, -1.9, 16, dt);
        }
        if (scare.doorRightPivot) {
          scare.doorRightPivot.rotation.y = THREE.MathUtils.damp(scare.doorRightPivot.rotation.y, 1.9, 16, dt);
        }
      }
    }

    // Contextual Story Trigger Zones
    for (const trig of this.levelData.storyTriggers) {
      if (!trig.fired) {
        const d = Math.hypot(this.playerPos.x - trig.position.x, this.playerPos.z - trig.position.z);
        if (d <= trig.radius) {
          trig.fired = true;
          const lines = TRIGGER_DIALOGUES[trig.id];
          if (lines) {
            this.triggerDialoguePause(lines, () => {
              this.phase = 'playing';
              this.emitHud();
            });
            return 99;
          }
        }
      }
    }

    // Babak III cracked mirror apparition pulse when walking past wall mirrors
    if (this.mirrorPeekCooldown > 0) this.mirrorPeekCooldown = Math.max(0, this.mirrorPeekCooldown - dt);
    if (
      this.layerIndex === 2 &&
      !this.isHiding &&
      this.mirrorPeekCooldown <= 0 &&
      this.levelData.mirrorFrames &&
      this.levelData.mirrorFrames.length > 0
    ) {
      for (const mf of this.levelData.mirrorFrames) {
        const md = Math.hypot(this.playerPos.x - mf.position.x, this.playerPos.z - mf.position.z);
        if (md < 4.2 && isInPlayerViewCone(this.playerPos.x, this.playerPos.z, this.yaw, mf.position.x, mf.position.z, 0.55)) {
          this.mirrorPeekCooldown = 14.0;
          this.audio.playApparitionShift(mf.position.x > this.playerPos.x ? 0.55 : -0.55);
          this.audio.playWhisperStatic();
          if (this.cinematicEffectsEnabled) {
            this.shakeIntensity = Math.max(this.shakeIntensity, 0.08);
          }
          break;
        }
      }
    }

    // Articulated Shadow Enemies AI (NavGrid A* + AABB Collision + Psychological Emergence)
    let nearestThreat = 99;
    const colliders = this.levelData.colliders;
    const bounds = this.levelData.bounds;
    const extraCols = this.extraDoorColliders;

    for (const enemy of this.levelData.enemies) {
      const ePos = enemy.rig.root.position;
      const dist = Math.hypot(ePos.x - this.playerPos.x, ePos.z - this.playerPos.z);
      if (!enemy.hiddenFromView && dist < nearestThreat) nearestThreat = dist;

      const sA = enemy.rig.root.getObjectByName('orbitShardA');
      const sB = enemy.rig.root.getObjectByName('orbitShardB');
      if (sA) sA.position.y = 1.25 + Math.sin(elapsed * 3.2) * 0.16;
      if (sB) sB.position.y = 1.5 + Math.cos(elapsed * 2.8) * 0.16;

      if (enemy.repositionCooldown && enemy.repositionCooldown > 0) {
        enemy.repositionCooldown = Math.max(0, enemy.repositionCooldown - dt);
      }
      if (enemy.pathTimer && enemy.pathTimer > 0) {
        enemy.pathTimer = Math.max(0, enemy.pathTimer - dt);
      }

      if (enemy.frozenTimer > 0) {
        enemy.frozenTimer = Math.max(0, enemy.frozenTimer - dt);
        enemy.aiState = 'frozenByLantern';
        enemy.rig.root.visible = true;
        enemy.hiddenFromView = false;
        animateCharacterPose(enemy.rig, 'shadowStare', elapsed, 0.25);
        continue;
      }

      // Temporary off-screen shadow relocation before re-emerging behind player
      if (enemy.aiState === 'repositionHidden') {
        enemy.stateTimer = Math.max(0, (enemy.stateTimer ?? 0) - dt);
        enemy.rig.root.visible = false;
        enemy.hiddenFromView = true;
        if (enemy.stateTimer <= 0) {
          let relocated = false;
          for (let attempt = 0; attempt < 16; attempt++) {
            const ang = Math.random() * Math.PI * 2;
            const rad = 5.6 + Math.random() * 5.2;
            const cx = this.playerPos.x + Math.cos(ang) * rad;
            const cz = this.playerPos.z + Math.sin(ang) * rad;
            if (isInPlayerViewCone(this.playerPos.x, this.playerPos.z, this.yaw, cx, cz, 0.2)) {
              continue;
            }
            if (collidesWithWorld(cx, cz, 0.46, colliders, bounds, extraCols)) {
              continue;
            }
            if (!hasLineOfSight(cx, cz, this.playerPos.x, this.playerPos.z, colliders, extraCols, 0.15)) {
              continue;
            }
            ePos.set(cx, 0, cz);
            relocated = true;
            break;
          }
          enemy.rig.root.visible = true;
          enemy.hiddenFromView = false;
          enemy.path = [];
          enemy.stuckTimer = 0;
          enemy.aiState = relocated ? 'stalkWatch' : 'patrol';
          enemy.stateTimer = relocated ? 2.4 : 0;
          enemy.repositionCooldown = 11.0;
          if (relocated) {
            const pan = Math.sin(this.yaw) * (ePos.z - this.playerPos.z) - Math.cos(this.yaw) * (ePos.x - this.playerPos.x);
            this.audio.playApparitionShift(THREE.MathUtils.clamp(-pan * 0.12, -0.85, 0.85));
          }
        }
        continue;
      }

      enemy.rig.root.visible = true;
      enemy.hiddenFromView = false;

      const hasLOS = hasLineOfSight(
        ePos.x,
        ePos.z,
        this.playerPos.x,
        this.playerPos.z,
        colliders,
        extraCols,
        0.08
      );
      const inCone = isInPlayerViewCone(
        this.playerPos.x,
        this.playerPos.z,
        this.yaw,
        ePos.x,
        ePos.z,
        0.52
      );
      const detectRange = this.difficulty === 'story' ? 6.2 : 9.5 + this.frostLevel * 4.0;
      const canChase = !this.isHiding && this.graceTimer <= 0 && dist < detectRange && (hasLOS || dist < 5.0);

      if (this.isHiding || this.graceTimer > 0) {
        enemy.aiState = 'patrol';
        enemy.chasing = false;
      } else if (
        enemy.aiState !== 'chase' &&
        hasLOS &&
        inCone &&
        dist > 3.8 &&
        dist < 13.5
      ) {
        // Freeze motionless at corridor end staring at player when spotted first
        if (enemy.aiState !== 'freezeOnLook') {
          enemy.aiState = 'freezeOnLook';
          enemy.stateTimer = 0;
        } else {
          enemy.stateTimer = (enemy.stateTimer ?? 0) + dt;
          if (enemy.stateTimer > 1.55) {
            if (dist < 7.5) {
              enemy.aiState = 'chase';
            } else if ((enemy.repositionCooldown ?? 0) <= 0 && this.difficulty !== 'story') {
              enemy.aiState = 'repositionHidden';
              enemy.stateTimer = 0.85;
              enemy.repositionCooldown = 10.0;
              this.audio.playApparitionShift(0);
              continue;
            } else {
              enemy.aiState = 'chase';
            }
          }
        }
        enemy.chasing = false;
      } else if (canChase) {
        if (!inCone && dist > 5.4 && dist < 12.2 && enemy.aiState !== 'chase') {
          enemy.aiState = 'stalkWatch';
        } else {
          enemy.aiState = 'chase';
        }
        enemy.chasing = enemy.aiState === 'chase';
      } else if (enemy.aiState === 'chase' && dist < detectRange + 3.2 && hasLOS) {
        enemy.chasing = true;
      } else {
        enemy.aiState = 'patrol';
        enemy.chasing = false;
      }

      if (enemy.aiState === 'freezeOnLook') {
        animateCharacterPose(enemy.rig, 'shadowStare', elapsed);
        enemy.rig.root.rotation.y = Math.atan2(this.playerPos.x - ePos.x, this.playerPos.z - ePos.z);
        if (dist < 7.0 && elapsed - enemy.lastWhisperTime > 6.5) {
          enemy.lastWhisperTime = elapsed;
          this.audio.playWhisperStatic();
        }
        continue;
      }

      animateCharacterPose(
        enemy.rig,
        'shadowStalk',
        elapsed,
        enemy.aiState === 'chase' ? 1.18 : 0.88
      );

      const goal =
        enemy.aiState === 'chase' || enemy.aiState === 'stalkWatch'
          ? this.playerPos
          : enemy.waypoints[enemy.currentWaypoint];

      const goalDist = Math.hypot(goal.x - ePos.x, goal.z - ePos.z);
      if (enemy.aiState === 'patrol' && goalDist < 0.72) {
        enemy.currentWaypoint = (enemy.currentWaypoint + 1) % enemy.waypoints.length;
        enemy.path = [];
      } else {
        let steerX = goal.x;
        let steerZ = goal.z;

        const directGoalLOS = hasLineOfSight(
          ePos.x,
          ePos.z,
          goal.x,
          goal.z,
          colliders,
          extraCols,
          0.42
        );

        if (!directGoalLOS && this.navGrid) {
          if (!enemy.path || enemy.path.length === 0 || (enemy.pathTimer ?? 0) <= 0) {
            enemy.path = findPath(
              this.navGrid,
              ePos.x,
              ePos.z,
              goal.x,
              goal.z,
              colliders,
              extraCols
            );
            enemy.pathTimer = 0.36;
          }
          while (
            enemy.path.length > 0 &&
            Math.hypot(enemy.path[0].x - ePos.x, enemy.path[0].z - ePos.z) < 0.42
          ) {
            enemy.path.shift();
          }
          if (enemy.path.length > 0) {
            steerX = enemy.path[0].x;
            steerZ = enemy.path[0].z;
          }
        } else {
          enemy.path = [];
        }

        _vecB.set(steerX - ePos.x, 0, steerZ - ePos.z);
        const stepDist = _vecB.length();
        if (stepDist > 0.04) {
          _vecB.normalize();
          const moveSpd =
            enemy.aiState === 'chase'
              ? enemy.baseSpeed * 1.15
              : enemy.aiState === 'stalkWatch'
                ? enemy.baseSpeed * 0.86
                : enemy.baseSpeed * 0.72;

          const prevX = ePos.x;
          const prevZ = ePos.z;
          ePos.x += _vecB.x * moveSpd * dt;
          ePos.z += _vecB.z * moveSpd * dt;

          const resolved = resolveCircleAABB(ePos.x, ePos.z, 0.42, colliders, bounds, extraCols);
          ePos.x = resolved.x;
          ePos.z = resolved.z;

          const movedActual = Math.hypot(ePos.x - prevX, ePos.z - prevZ);
          if (movedActual < moveSpd * dt * 0.14) {
            enemy.stuckTimer = (enemy.stuckTimer ?? 0) + dt;
            if (enemy.stuckTimer > 0.75) {
              enemy.stuckTimer = 0;
              enemy.path = [];
              enemy.pathTimer = 0;
              if (enemy.aiState === 'patrol') {
                enemy.currentWaypoint = (enemy.currentWaypoint + 1) % enemy.waypoints.length;
              } else if ((enemy.repositionCooldown ?? 0) <= 0) {
                enemy.aiState = 'repositionHidden';
                enemy.stateTimer = 0.75;
                enemy.repositionCooldown = 8.0;
                continue;
              }
            }
          } else {
            enemy.stuckTimer = 0;
          }
          enemy.lastX = ePos.x;
          enemy.lastZ = ePos.z;
          enemy.rig.root.rotation.y = Math.atan2(_vecB.x, _vecB.z);
        }
      }

      if (dist < 6.5 && elapsed - enemy.lastWhisperTime > 7.0) {
        enemy.lastWhisperTime = elapsed;
        this.audio.playWhisperStatic();
      }

      if (!this.isHiding && dist < 1.22 && this.graceTimer <= 0 && hasLOS) {
        this.triggerEntityAmbush(enemy);
        return 0.9;
      }
    }

    // Life-reactive flashlight, fog & subtle camera tension (strictly gated outside calm_before)
    const healthRatio = this.lives / Math.max(1, this.maxLives);
    let targetFlash = 5.6;
    if (this.storyPhase !== 'calm_before') {
      if (this.lives <= 1) {
        const glitchDip = Math.sin(elapsed * 29.0) * Math.cos(elapsed * 17.0) > 0.78;
        targetFlash = glitchDip ? 1.8 : 4.2 + Math.sin(elapsed * 7.0) * 0.6;
      } else if (this.lives <= 2) {
        const dip = Math.sin(elapsed * 19.0) > 0.88;
        targetFlash = dip ? 2.6 : 4.85;
      } else if (this.lives <= 3) {
        targetFlash = 5.15;
      }
      const baseFog =
        this.layerIndex === 3
          ? 0.0135 + this.frostLevel * 0.012
          : 0.036 + this.frostLevel * 0.042;
      this.fog.density = baseFog + (1 - healthRatio) * (this.layerIndex === 3 ? 0.004 : 0.011);
    }

    if (nearestThreat < 5.5) {
      targetFlash = Math.random() > 0.25 ? targetFlash : 1.5;
    }
    this.flashlight.intensity = targetFlash;

    if (nearestThreat > 10 || this.isHiding) {
      this.warmth = Math.min(100, this.warmth + 3.0 * dt);
    }

    const bobOffset = moving && !this.isHiding ? Math.sin(this.headBobPhase) * 0.045 : 0;
    const healthBreathRoll =
      this.cinematicEffectsEnabled && this.storyPhase !== 'calm_before' && this.lives <= 2
        ? Math.sin(elapsed * (this.lives <= 1 ? 2.4 : 1.5)) * (this.lives <= 1 ? 0.018 : 0.008)
        : 0;
    this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 9, dt);
    const sx = (Math.random() - 0.5) * this.shakeIntensity;
    const sy = (Math.random() - 0.5) * this.shakeIntensity;

    this.camera.position.set(this.playerPos.x + sx, this.playerPos.y + bobOffset + sy, this.playerPos.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = healthBreathRoll;

    const surface = LAYER_METAS[this.layerIndex].surface;
    this.audio.updateAmbience(
      dt,
      this.frostLevel,
      nearestThreat,
      this.isHiding,
      this.layerIndex,
      true,
      this.horrorBlend,
      healthRatio
    );
    this.audio.updateFootsteps(dt, moving, sprinting, this.isHiding, surface);
    this.audio.updateHeartbeat(dt, nearestThreat, this.isHiding, healthRatio, this.horrorBlend);

    return nearestThreat;
  }

  private computeActiveObjectiveHint(): string {
    const meta = LAYER_METAS[this.layerIndex];
    const stagePuzzle = Object.values(PUZZLE_CONFIGS).find((p) => p.layerIndex === this.layerIndex);
    const puzzleSolved = stagePuzzle ? this.solvedPuzzles.has(stagePuzzle.id) : true;

    if (this.exitUnlocked && puzzleSolved) {
      return `Menuju ${meta.exitLabel}`;
    }
    if (this.exitUnlocked && !puzzleSolved && stagePuzzle) {
      return `Aktifkan ${stagePuzzle.title}`;
    }
    if (!puzzleSolved && stagePuzzle && this.collectedCount >= meta.totalTargets - 1) {
      return `Selesaikan ${stagePuzzle.title} untuk membuka fragmen terakhir`;
    }
    return meta.ambientHint;
  }

  private emitHud(threatDistance = 99): void {
    const closest =
      this.phase === 'playing' ? this.findClosestInteractable() : { item: null, hideSpotIdx: -1 };
    let promptText: string | null = null;
    let promptSubtext: string | null = null;

    if (this.phase === 'playing') {
      if (this.isHiding) {
        promptText = '[E] Keluar dari Tempat Persembunyian';
        promptSubtext = 'Tahan napas sebentar, bayangan tidak bisa melihatmu di sini.';
      } else if (closest.item) {
        promptText = `[E] ${closest.item.label}`;
        if (closest.item.kind === 'clue' && closest.item.loreId) {
          const lore = LORE_CLUES[closest.item.loreId];
          promptSubtext = this.discoveredClues.has(closest.item.loreId)
            ? `Sudah tersimpan di Arsip (${lore?.locationLabel ?? 'Petunjuk'})`
            : `Arsip Petunjuk · ${lore?.locationLabel ?? 'Periksa dokumen'}`;
        } else if (closest.item.kind === 'puzzle') {
          promptSubtext = 'Teka-teki area · Cocokkan dengan petunjuk sekitar.';
        } else if (closest.item.lockedByPuzzleId && !this.solvedPuzzles.has(closest.item.lockedByPuzzleId)) {
          const reqPuzzle = PUZZLE_CONFIGS[closest.item.lockedByPuzzleId];
          promptSubtext = `Masih terkunci — selesaikan ${reqPuzzle?.title ?? 'mekanisme area'} dulu.`;
        } else if (closest.item.kind === 'exit' && !this.exitUnlocked) {
          const remaining = LAYER_METAS[this.layerIndex].totalTargets - this.collectedCount;
          promptSubtext = `Masih terkunci (butuh ${remaining} ${LAYER_METAS[this.layerIndex].objectiveLabel} lagi).`;
        }
      } else if (closest.hideSpotIdx >= 0 && this.levelData) {
        promptText = `[E] Sembunyi di ${this.levelData.hidingSpots[closest.hideSpotIdx].label}`;
        promptSubtext = 'Berlindung sementara dari kejaran bayangan.';
      }
    }

    const totalCluesInAll = Object.keys(LORE_CLUES).length;
    const totalPuzzlesInAll = Object.keys(PUZZLE_CONFIGS).length;

    this.callbacks.onHudUpdate({
      layerIndex: this.layerIndex,
      lives: this.lives,
      maxLives: this.maxLives,
      extraRetryAvailable: !this.stageRetryUsed,
      damageFlash: Math.min(1, this.damageFlashTimer / 0.72),
      jumpscareCount: this.jumpscareCount,
      graceTimer: this.graceTimer,
      strobePhase: this.strobePhase,
      warmth: Math.round(this.warmth),
      stamina: Math.round(this.stamina),
      lanternCooldown: this.lanternCooldownTimer / this.lanternCooldownDuration,
      lanternActive: this.lanternPulseTimer > 0,
      isHiding: this.isHiding,
      isPointerLocked: this.isPointerLocked,
      collectedCount: this.collectedCount,
      totalTargets: LAYER_METAS[this.layerIndex].totalTargets,
      cluesFound: this.discoveredClues.size,
      cluesTotal: totalCluesInAll,
      solvedPuzzlesCount: this.solvedPuzzles.size,
      totalPuzzlesCount: totalPuzzlesInAll,
      activeObjectiveHint: this.computeActiveObjectiveHint(),
      exitUnlocked: this.exitUnlocked && (!this.levelData?.interactables.some(
        (it) => it.kind === 'exit' && it.lockedByPuzzleId && !this.solvedPuzzles.has(it.lockedByPuzzleId)
      )),
      frostLevel: this.frostLevel,
      threatDistance,
      storyPhase: this.storyPhase,
      horrorBlend: this.horrorBlend,
      promptText,
      promptSubtext,
    });
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const elapsed = this.clock.elapsedTime;

    const threatDist = this.updateSimulation(dt, elapsed);
    this.renderer.render(this.scene, this.camera);

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.08) {
      this.hudEmitAccum = 0;
      this.emitHud(threatDist);
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private disposeObjectTree(obj: THREE.Object3D): void {
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else if (m.material) {
          m.material.dispose();
        }
      }
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.unbindEvents();
    this.clearActiveScenes();
    this.snowPoints.geometry.dispose();
    (this.snowPoints.material as THREE.Material).dispose();
    this.dustPoints.geometry.dispose();
    (this.dustPoints.material as THREE.Material).dispose();
    this.lanternRing.geometry.dispose();
    (this.lanternRing.material as THREE.Material).dispose();
    this.textures.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
