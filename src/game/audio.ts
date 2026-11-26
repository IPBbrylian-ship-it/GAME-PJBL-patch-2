import { SurfaceType } from '../types/game';

export class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private dryBus: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private echoDelay: DelayNode | null = null;
  private echoSend: GainNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private distortionCurve: Float32Array<ArrayBuffer> | null = null;

  // Continuous Ambient Layers
  private windGain: GainNode | null = null;
  private windFilterA: BiquadFilterNode | null = null;
  private windFilterB: BiquadFilterNode | null = null;

  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  private scrapeGain: GainNode | null = null;
  private scrapeFilter: BiquadFilterNode | null = null;
  private staticGain: GainNode | null = null;
  private staticFilter: BiquadFilterNode | null = null;

  private whisperGain: GainNode | null = null;
  private whisperPanner: StereoPannerNode | null = null;

  private calmPadGain: GainNode | null = null;
  private breathGain: GainNode | null = null;
  private breathFilter: BiquadFilterNode | null = null;

  private muted = false;
  private initialized = false;
  private bgmEnabled = true;

  private heartbeatTimer = 0;
  private stepTimer = 0;
  private stepPanSide = -1;
  private bgmStep = 0;
  private bgmTimer = 0;
  private whisperPanTimer = 0;
  private creakTimer = 4.5;
  private breathPhase = 0;

  // Haunting A Harmonic Minor / E Phrygian motif (Akira Yamaoka / Silent Hill style)
  private readonly bgmNotes: (number | null)[] = [
    440.0, null, 523.25, 493.88, 349.23, null, 329.63, null,
    415.30, null, 440.0, 349.23, 329.63, null, 246.94, null,
    440.0, null, 659.25, 587.33, 523.25, null, 415.30, null,
    349.23, 329.63, 293.66, null, 246.94, null, 220.0, null,
  ];

  public init(): void {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }

    // Master Safety Limiter -> Destination
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -10;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 8;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.18;
    this.limiter.connect(this.ctx.destination);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.78;
    this.masterGain.connect(this.limiter);

    // Dry Bus
    this.dryBus = this.ctx.createGain();
    this.dryBus.gain.value = 0.92;
    this.dryBus.connect(this.masterGain);

    // Procedural Cold Hallway Impulse Response Reverb (ConvolverNode)
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.createImpulseResponse(2.6);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.54;
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.masterGain);

    // Long Tape Echo Delay Bus (for Haunted Music Box, Piano & Glitch)
    this.echoDelay = this.ctx.createDelay(1.5);
    this.echoDelay.delayTime.value = 0.38;
    const echoFeedback = this.ctx.createGain();
    echoFeedback.gain.value = 0.36;
    const echoTone = this.ctx.createBiquadFilter();
    echoTone.type = 'lowpass';
    echoTone.frequency.value = 1150;
    this.echoSend = this.ctx.createGain();
    this.echoSend.gain.value = 0.32;

    this.echoDelay.connect(echoTone);
    echoTone.connect(echoFeedback);
    echoFeedback.connect(this.echoDelay);
    echoTone.connect(this.echoSend);
    this.echoSend.connect(this.dryBus);
    this.echoSend.connect(this.reverbNode);

    this.buildNoiseAndDistortionBuffers();
    this.startAmbientLayers();
    this.initialized = true;
  }

  private createImpulseResponse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const length = Math.floor(sr * seconds);
    const ir = ctx.createBuffer(2, length, sr);

    // Early cold corridor reflection taps (18ms - 85ms)
    const taps = [0.018, 0.031, 0.047, 0.066, 0.085];
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        const decay = Math.pow(1 - progress, 2.75);
        const raw = (Math.random() * 2 - 1) * decay;
        // 1-pole dark damping so corridor reverb feels icy & hollow, not fizzy
        lp = lp * 0.72 + raw * 0.28;
        data[i] = lp * 0.78;
      }
      taps.forEach((tSec, idx) => {
        const sampleIdx = Math.min(length - 1, Math.floor((tSec + ch * 0.004) * sr));
        data[sampleIdx] += (ch === idx % 2 ? 0.42 : 0.24) / (idx + 1);
      });
    }
    return ir;
  }

  private buildNoiseAndDistortionBuffers(): void {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    const length = sr * 4;

    // Pink-weighted wind/static noise buffer
    this.noiseBuffer = this.ctx.createBuffer(1, length, sr);
    const pink = this.noiseBuffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      pink[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.1848) * 0.22));
    }

    // Crisp white noise buffer for radio static & crystal cracks
    this.whiteNoiseBuffer = this.ctx.createBuffer(1, sr * 2, sr);
    const whiteData = this.whiteNoiseBuffer.getChannelData(0);
    for (let i = 0; i < whiteData.length; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }

    // Soft-clipping overdrive curve for jumpscare screech & radio grit
    const nSamples = 256;
    const curveBuffer = new ArrayBuffer(nSamples * Float32Array.BYTES_PER_ELEMENT);
    this.distortionCurve = new Float32Array(curveBuffer);
    const k = 18;
    for (let i = 0; i < nSamples; i++) {
      const x = (i * 2) / nSamples - 1;
      this.distortionCurve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
  }

  private createPanner(pan: number): StereoPannerNode | null {
    if (!this.ctx || !this.ctx.createStereoPanner) return null;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    return panner;
  }

  private connectSpatial(
    node: AudioNode,
    pan: number,
    reverbMix = 0.42,
    echoMix = 0
  ): void {
    if (!this.ctx || !this.dryBus) return;
    const panner = this.createPanner(pan);
    const out: AudioNode = panner || node;
    if (panner) {
      node.connect(panner);
    }
    out.connect(this.dryBus);

    if (reverbMix > 0 && this.reverbNode) {
      const wet = this.ctx.createGain();
      wet.gain.value = reverbMix;
      out.connect(wet);
      wet.connect(this.reverbNode);
    }
    if (echoMix > 0 && this.echoDelay) {
      const dSend = this.ctx.createGain();
      dSend.gain.value = echoMix;
      out.connect(dSend);
      dSend.connect(this.echoDelay);
    }
  }

  private startAmbientLayers(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || !this.whiteNoiseBuffer) return;

    // 1. Howling Blizzard Wind (Pink noise -> 2 parallel LFO-modulated bandpass filters)
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;

    this.windFilterA = this.ctx.createBiquadFilter();
    this.windFilterA.type = 'bandpass';
    this.windFilterA.frequency.value = 260;
    this.windFilterA.Q.value = 3.1;

    this.windFilterB = this.ctx.createBiquadFilter();
    this.windFilterB.type = 'bandpass';
    this.windFilterB.frequency.value = 640;
    this.windFilterB.Q.value = 2.6;

    const lfoWindA = this.ctx.createOscillator();
    const lfoGainA = this.ctx.createGain();
    lfoWindA.frequency.value = 0.07;
    lfoGainA.gain.value = 135;
    lfoWindA.connect(lfoGainA);
    lfoGainA.connect(this.windFilterA.frequency);
    lfoWindA.start();

    const lfoWindB = this.ctx.createOscillator();
    const lfoGainB = this.ctx.createGain();
    lfoWindB.frequency.value = 0.11;
    lfoGainB.gain.value = 280;
    lfoWindB.connect(lfoGainB);
    lfoGainB.connect(this.windFilterB.frequency);
    lfoWindB.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.12;

    const windPanA = this.createPanner(-0.22);
    const windPanB = this.createPanner(0.24);
    windSrc.connect(this.windFilterA);
    windSrc.connect(this.windFilterB);
    if (windPanA && windPanB) {
      this.windFilterA.connect(windPanA);
      this.windFilterB.connect(windPanB);
      windPanA.connect(this.windGain);
      windPanB.connect(this.windGain);
    } else {
      this.windFilterA.connect(this.windGain);
      this.windFilterB.connect(this.windGain);
    }
    this.connectSpatial(this.windGain, 0, 0.36, 0);
    windSrc.start();

    // 2. BGM Layer 1: Dark Industrial Drone (45Hz - 90Hz Sawtooth + Triangle + LFO Lowpass)
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.075;

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 185;
    this.droneFilter.Q.value = 2.2;

    const droneLfo = this.ctx.createOscillator();
    const droneLfoGain = this.ctx.createGain();
    droneLfo.frequency.value = 0.13;
    droneLfoGain.gain.value = 75;
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(this.droneFilter.frequency);
    droneLfo.start();

    this.droneFilter.connect(this.droneGain);
    this.connectSpatial(this.droneGain, 0, 0.48, 0);

    const pitchDriftLfo = this.ctx.createOscillator();
    const pitchDriftAmt = this.ctx.createGain();
    pitchDriftLfo.frequency.value = 0.08;
    pitchDriftAmt.gain.value = 14;
    pitchDriftLfo.connect(pitchDriftAmt);
    pitchDriftLfo.start();

    const droneSpecs: Array<{ freq: number; type: OscillatorType; vol: number }> = [
      { freq: 46.25, type: 'sawtooth', vol: 0.42 },
      { freq: 69.3, type: 'triangle', vol: 0.48 },
      { freq: 82.41, type: 'sawtooth', vol: 0.25 },
    ];
    droneSpecs.forEach((spec) => {
      if (!this.ctx || !this.droneFilter) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = spec.type;
      osc.frequency.value = spec.freq;
      g.gain.value = spec.vol;
      pitchDriftAmt.connect(osc.detune);
      osc.connect(g);
      g.connect(this.droneFilter);
      osc.start();
    });

    // 3. BGM Layer 3A: FM Rusted Metallic Scrape (scales with threat distance)
    this.scrapeGain = this.ctx.createGain();
    this.scrapeGain.gain.value = 0;

    this.scrapeFilter = this.ctx.createBiquadFilter();
    this.scrapeFilter.type = 'bandpass';
    this.scrapeFilter.frequency.value = 920;
    this.scrapeFilter.Q.value = 4.2;

    const scrapeLfo = this.ctx.createOscillator();
    const scrapeLfoGain = this.ctx.createGain();
    scrapeLfo.frequency.value = 0.23;
    scrapeLfoGain.gain.value = 420;
    scrapeLfo.connect(scrapeLfoGain);
    scrapeLfoGain.connect(this.scrapeFilter.frequency);
    scrapeLfo.start();

    const scrapeCarrier = this.ctx.createOscillator();
    scrapeCarrier.type = 'sawtooth';
    scrapeCarrier.frequency.value = 186;

    const scrapeModA = this.ctx.createOscillator();
    const scrapeModAGain = this.ctx.createGain();
    scrapeModA.type = 'sine';
    scrapeModA.frequency.value = 73;
    scrapeModAGain.gain.value = 210;
    scrapeModA.connect(scrapeModAGain);
    scrapeModAGain.connect(scrapeCarrier.frequency);

    const scrapeModB = this.ctx.createOscillator();
    const scrapeModBGain = this.ctx.createGain();
    scrapeModB.type = 'triangle';
    scrapeModB.frequency.value = 293;
    scrapeModBGain.gain.value = 135;
    scrapeModB.connect(scrapeModBGain);
    scrapeModBGain.connect(scrapeCarrier.frequency);

    scrapeCarrier.connect(this.scrapeFilter);
    this.scrapeFilter.connect(this.scrapeGain);
    this.connectSpatial(this.scrapeGain, 0, 0.55, 0);
    scrapeCarrier.start();
    scrapeModA.start();
    scrapeModB.start();

    // 4. BGM Layer 3B: Proximity Radio Static (Bandpass white/pink noise)
    this.staticGain = this.ctx.createGain();
    this.staticGain.gain.value = 0;

    this.staticFilter = this.ctx.createBiquadFilter();
    this.staticFilter.type = 'bandpass';
    this.staticFilter.frequency.value = 1480;
    this.staticFilter.Q.value = 2.6;

    const staticSrc = this.ctx.createBufferSource();
    staticSrc.buffer = this.whiteNoiseBuffer;
    staticSrc.loop = true;
    staticSrc.connect(this.staticFilter);
    this.staticFilter.connect(this.staticGain);
    this.connectSpatial(this.staticGain, 0, 0.25, 0);
    staticSrc.start();

    // 5. Ambient Stigma Whispers (Active in Babak II, III, IV - 3 Formant Filters + Spatial Panning)
    this.whisperGain = this.ctx.createGain();
    this.whisperGain.gain.value = 0;

    this.whisperPanner = this.createPanner(0);
    const whisperSrc = this.ctx.createBufferSource();
    whisperSrc.buffer = this.noiseBuffer;
    whisperSrc.loop = true;

    const whisperBreathLfo = this.ctx.createOscillator();
    const whisperBreathGain = this.ctx.createGain();
    whisperBreathLfo.frequency.value = 0.29;
    whisperBreathGain.gain.value = 0.35;
    whisperBreathLfo.connect(whisperBreathGain);
    whisperBreathGain.connect(this.whisperGain.gain);
    whisperBreathLfo.start();

    const formantFreqs = [680, 1380, 2450];
    formantFreqs.forEach((fFreq, idx) => {
      if (!this.ctx || !this.whisperGain) return;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = fFreq;
      bp.Q.value = 7.5 + idx;

      const fLfo = this.ctx.createOscillator();
      const fLfoGain = this.ctx.createGain();
      fLfo.frequency.value = 0.16 + idx * 0.07;
      fLfoGain.gain.value = 110 + idx * 60;
      fLfo.connect(fLfoGain);
      fLfoGain.connect(bp.frequency);
      fLfo.start();

      const fg = this.ctx.createGain();
      fg.gain.value = 0.45 / (idx + 1);
      whisperSrc.connect(bp);
      bp.connect(fg);
      fg.connect(this.whisperGain);
    });

    if (this.whisperPanner) {
      this.whisperGain.connect(this.whisperPanner);
      this.whisperPanner.connect(this.dryBus);
      if (this.reverbNode) {
        const wWet = this.ctx.createGain();
        wWet.gain.value = 0.65;
        this.whisperPanner.connect(wWet);
        wWet.connect(this.reverbNode);
      }
    } else {
      this.connectSpatial(this.whisperGain, 0, 0.65, 0);
    }
    whisperSrc.start();

    // 6. Calm Late-Afternoon Campus Ambient Pad (only heard when horrorBlend < 1)
    this.calmPadGain = this.ctx.createGain();
    this.calmPadGain.gain.value = 0.055;
    const calmFilter = this.ctx.createBiquadFilter();
    calmFilter.type = 'lowpass';
    calmFilter.frequency.value = 380;
    const calmNotes = [130.81, 196.0, 261.63];
    calmNotes.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      g.gain.value = 0.28 / (idx + 1);
      osc.connect(g);
      g.connect(calmFilter);
      osc.start();
    });
    // Soft afternoon air breeze through pink noise
    const breezeSrc = this.ctx.createBufferSource();
    breezeSrc.buffer = this.noiseBuffer;
    breezeSrc.loop = true;
    const breezeLp = this.ctx.createBiquadFilter();
    breezeLp.type = 'bandpass';
    breezeLp.frequency.value = 340;
    breezeLp.Q.value = 1.1;
    const breezeG = this.ctx.createGain();
    breezeG.gain.value = 0.12;
    breezeSrc.connect(breezeLp);
    breezeLp.connect(breezeG);
    breezeG.connect(calmFilter);
    calmFilter.connect(this.calmPadGain);
    this.connectSpatial(this.calmPadGain, 0, 0.25, 0);
    breezeSrc.start();

    // 7. Player Stress Breathing Layer (scales dynamically as player health drops)
    this.breathGain = this.ctx.createGain();
    this.breathGain.gain.value = 0;
    this.breathFilter = this.ctx.createBiquadFilter();
    this.breathFilter.type = 'bandpass';
    this.breathFilter.frequency.value = 440;
    this.breathFilter.Q.value = 2.4;
    const breathSrc = this.ctx.createBufferSource();
    breathSrc.buffer = this.noiseBuffer;
    breathSrc.loop = true;
    breathSrc.connect(this.breathFilter);
    this.breathFilter.connect(this.breathGain);
    this.connectSpatial(this.breathGain, 0, 0.14, 0);
    breathSrc.start();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.78, this.ctx.currentTime, 0.05);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setBgmEnabled(enabled: boolean): void {
    this.bgmEnabled = enabled;
  }

  public updateAmbience(
    dt: number,
    frostLevel: number,
    threatDistance: number,
    isHiding: boolean,
    layerIndex = 0,
    inGameplay = false,
    horrorBlend = 1,
    healthRatio = 1
  ): void {
    if (!this.ctx || !this.windFilterA || !this.windFilterB || !this.windGain) return;
    const now = this.ctx.currentTime;
    const hMix = Math.max(0, Math.min(1, horrorBlend));
    const hSafe = Math.max(0, Math.min(1, healthRatio));
    const damageSeverity = hMix > 0.35 ? 1 - hSafe : 0;

    // Crossfade calm warm campus ambience -> dark psychological horror layers
    if (this.calmPadGain) {
      const calmTarget = Math.max(0, 1 - hMix * 1.15) * 0.068;
      this.calmPadGain.gain.setTargetAtTime(calmTarget, now, 0.25);
    }

    // Blizzard wind intensity & resonance (silent during calm_before)
    const windBase = isHiding ? 0.065 : 0.11 + frostLevel * 0.14;
    const windVol = windBase * hMix;
    const windFreqA = isHiding ? 185 : 230 + frostLevel * 170;
    const windFreqB = isHiding ? 410 : 560 + frostLevel * 320;
    this.windGain.gain.setTargetAtTime(windVol, now, 0.25);
    this.windFilterA.frequency.setTargetAtTime(windFreqA, now, 0.25);
    this.windFilterB.frequency.setTargetAtTime(windFreqB, now, 0.25);

    // Layer 1 & Layer 3 Dynamic Terror Tension (+ low-health oppression)
    const danger = Math.max(0, Math.min(1, 1 - (threatDistance - 2.0) / 13.0));
    const healthDroneBoost = damageSeverity > 0.2 ? damageSeverity * 0.065 : 0;
    if (this.droneGain && this.droneFilter) {
      const targetDrone =
        (isHiding ? 0.045 + danger * 0.03 : 0.068 + danger * 0.095 + healthDroneBoost) * hMix;
      this.droneGain.gain.setTargetAtTime(targetDrone, now, 0.22);
      this.droneFilter.frequency.setTargetAtTime(
        165 + danger * 220 + damageSeverity * 125,
        now,
        0.22
      );
    }

    if (this.scrapeGain && this.scrapeFilter) {
      const scrapeTarget =
        danger > 0.12 ? (danger - 0.12) * (isHiding ? 0.03 : 0.095) * hMix : 0;
      this.scrapeGain.gain.setTargetAtTime(scrapeTarget, now, 0.18);
      this.scrapeFilter.frequency.setTargetAtTime(750 + danger * 900, now, 0.2);
    }

    if (this.staticGain && this.staticFilter) {
      const staticThreat = Math.max(danger, damageSeverity >= 0.75 ? 0.34 : 0);
      const staticTarget =
        staticThreat > 0.16 ? (staticThreat - 0.16) * (isHiding ? 0.025 : 0.085) * hMix : 0;
      this.staticGain.gain.setTargetAtTime(staticTarget, now, 0.16);
      this.staticFilter.frequency.setTargetAtTime(1250 + staticThreat * 1050, now, 0.16);
    }

    // Stigma Whispers active in Babak II, III & IV (layerIndex >= 1) and never during calm_before
    if (this.whisperGain) {
      const whisperActive = inGameplay && layerIndex >= 1 && hMix > 0.55;
      const targetWhisper = whisperActive ? (isHiding ? 0.02 : 0.055 + danger * 0.04) * hMix : 0;
      this.whisperGain.gain.setTargetAtTime(targetWhisper, now, 0.35);

      if (whisperActive && this.whisperPanner) {
        this.whisperPanTimer -= dt;
        if (this.whisperPanTimer <= 0) {
          this.whisperPanTimer = 1.6 + Math.random() * 2.2;
          const nextPan = (Math.random() - 0.5) * 1.68;
          this.whisperPanner.pan.setTargetAtTime(nextPan, now, 0.65);
        }
      }
    }

    // Player Stress Breathing (Part 4: activates below 75% stability during horror gameplay)
    if (this.breathGain && this.breathFilter) {
      if (inGameplay && hMix > 0.45 && hSafe < 0.75) {
        const rate = hSafe < 0.25 ? 0.62 : hSafe < 0.5 ? 0.42 : 0.28;
        this.breathPhase += dt * rate * Math.PI * 2;
        const cycle = Math.max(0, Math.sin(this.breathPhase));
        const ampBase = hSafe < 0.25 ? 0.115 : hSafe < 0.5 ? 0.068 : 0.032;
        this.breathGain.gain.setTargetAtTime(ampBase * (0.25 + cycle * 0.75), now, 0.08);
        this.breathFilter.frequency.setTargetAtTime(360 + cycle * 210, now, 0.08);
      } else {
        this.breathGain.gain.setTargetAtTime(0, now, 0.18);
      }
    }

    // Occasional distant spatial wooden/metallic creak in headphones during horror gameplay
    if (inGameplay && hMix > 0.5 && !this.muted) {
      this.creakTimer -= dt;
      if (this.creakTimer <= 0) {
        this.creakTimer = 7.5 + Math.random() * 9.0;
        this.playDistantSpatialCreak();
      }
    }

    // Layer 2: Detuned Haunted Music Box & Piano (-12 to +15 cents) gated by horrorBlend
    if (this.bgmEnabled && !this.muted && hMix > 0.35) {
      this.bgmTimer -= dt;
      if (this.bgmTimer <= 0) {
        this.bgmTimer = danger > 0.5 || damageSeverity >= 0.75 ? 0.58 : 0.72;
        const note = this.bgmNotes[this.bgmStep % this.bgmNotes.length];
        this.bgmStep = (this.bgmStep + 1) % this.bgmNotes.length;
        if (note) {
          const detuneCents = -12 + Math.random() * 27;
          const pan = Math.sin(this.bgmStep * 0.7) * 0.42;
          const baseVol = danger > 0.55 ? 0.052 : 0.082;
          this.playBgmMusicBoxPianoNote(note, detuneCents, baseVol * hMix, pan);
        }
      }
    }
  }

  private playBgmMusicBoxPianoNote(
    freq: number,
    detuneCents: number,
    volume: number,
    pan: number
  ): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;

    const oscBody = this.ctx.createOscillator();
    const oscBell = this.ctx.createOscillator();
    const oscSub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const bellGain = this.ctx.createGain();

    oscBody.type = 'triangle';
    oscBody.frequency.value = freq;
    oscBody.detune.value = detuneCents;

    // Music box metallic overtone partial
    oscBell.type = 'sine';
    oscBell.frequency.value = freq * 2.0;
    oscBell.detune.value = detuneCents * 1.2;

    oscSub.type = 'sine';
    oscSub.frequency.value = freq * 0.5;
    oscSub.detune.value = detuneCents * 0.4;

    bellGain.gain.setValueAtTime(0.32, now);
    bellGain.gain.exponentialRampToValueAtTime(0.02, now + 0.65);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(480, now + 1.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.35);

    oscBody.connect(filter);
    oscSub.connect(filter);
    oscBell.connect(bellGain);
    bellGain.connect(filter);
    filter.connect(gain);

    this.connectSpatial(gain, pan, 0.58, 0.42);

    oscBody.start(now);
    oscBell.start(now);
    oscSub.start(now);
    oscBody.stop(now + 2.4);
    oscBell.stop(now + 2.4);
    oscSub.stop(now + 2.4);
  }

  private playDistantSpatialCreak(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const pan = (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.45);

    const osc = this.ctx.createOscillator();
    const bp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    const base = 140 + Math.random() * 110;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 0.78, now + 0.48);

    bp.type = 'bandpass';
    bp.frequency.value = 540 + Math.random() * 320;
    bp.Q.value = 6.5;

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.028, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.52);

    osc.connect(bp);
    bp.connect(g);
    this.connectSpatial(g, pan, 0.72, 0.15);
    osc.start(now);
    osc.stop(now + 0.55);
  }

  public updateFootsteps(
    dt: number,
    moving: boolean,
    sprinting: boolean,
    isHiding: boolean,
    surface: SurfaceType
  ): void {
    if (!moving || isHiding) {
      this.stepTimer = 0.1;
      return;
    }
    const interval = sprinting ? 0.31 : 0.48;
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      this.stepTimer = interval;
      this.stepPanSide *= -1;
      this.playFootstep(sprinting, surface, this.stepPanSide * 0.18);
    }
  }

  private playFootstep(sprinting: boolean, surface: SurfaceType, pan: number): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    if (surface === 'wood') {
      filter.frequency.value = 430 + Math.random() * 140;
      filter.Q.value = 2.6;
    } else if (surface === 'tile') {
      filter.frequency.value = 1180 + Math.random() * 340;
      filter.Q.value = 2.1;
    } else {
      filter.frequency.value = 1720 + Math.random() * 520;
      filter.Q.value = 0.95;
    }

    const gain = this.ctx.createGain();
    const vol = sprinting ? 0.22 : 0.13;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (surface === 'snow' ? 0.14 : 0.095));

    src.connect(filter);
    filter.connect(gain);
    this.connectSpatial(gain, pan, surface === 'tile' ? 0.45 : 0.26, 0);
    src.start(now, Math.random() * 1.4, 0.16);

    if (surface === 'wood' || surface === 'tile') {
      const thud = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(surface === 'wood' ? 115 : 145, now);
      thud.frequency.exponentialRampToValueAtTime(48, now + 0.075);
      tGain.gain.setValueAtTime(sprinting ? 0.11 : 0.065, now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      thud.connect(tGain);
      this.connectSpatial(tGain, pan, 0.24, 0);
      thud.start(now);
      thud.stop(now + 0.095);
    }
  }

  public updateHeartbeat(
    dt: number,
    threatDistance: number,
    isHiding: boolean,
    healthRatio = 1,
    horrorBlend = 1
  ): void {
    if (!this.ctx || !this.dryBus || this.muted || horrorBlend < 0.35) return;
    const proximityDanger = Math.max(0, Math.min(1, 1 - (threatDistance - 2.2) / 13));
    const healthDanger = healthRatio < 0.25 ? 0.68 : healthRatio < 0.5 ? 0.34 : 0;
    const danger = Math.max(proximityDanger, healthDanger);
    if (danger <= 0.06) {
      this.heartbeatTimer = 0.2;
      return;
    }
    const bpm = 58 + danger * (isHiding ? 48 : 92);
    const interval = 60 / bpm;
    this.heartbeatTimer -= dt;
    if (this.heartbeatTimer <= 0) {
      this.heartbeatTimer = interval;
      this.playHeartThump(0.13 + danger * 0.3);
    }
  }

  public playApparitionShift(pan = 0): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.45);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(g);
    this.connectSpatial(g, pan, 0.72, 0.25);
    osc.start(now);
    osc.stop(now + 0.52);

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(980, now);
    bp.frequency.exponentialRampToValueAtTime(320, now + 0.45);
    bp.Q.value = 4.2;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.08, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
    src.connect(bp);
    bp.connect(ng);
    this.connectSpatial(ng, -pan * 0.7, 0.68, 0.18);
    src.start(now, Math.random() * 0.5, 0.48);
  }

  private playHeartThump(volume: number): void {
    if (!this.ctx || !this.dryBus) return;
    const now = this.ctx.currentTime;
    const beat = (offset: number, pitch: number, amp: number) => {
      if (!this.ctx || !this.dryBus) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now + offset);
      osc.frequency.exponentialRampToValueAtTime(28, now + offset + 0.12);
      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.exponentialRampToValueAtTime(amp, now + offset + 0.016);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
      osc.connect(gain);
      gain.connect(this.dryBus);
      osc.start(now + offset);
      osc.stop(now + offset + 0.17);
    };
    // Double lub-dub sub-bass pulse
    beat(0, 68, volume);
    beat(0.16, 54, volume * 0.7);
  }

  public playTypeBlip(seed = 0): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 540 + (seed % 5) * 35;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.028, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
    osc.connect(gain);
    this.connectSpatial(gain, 0, 0.14, 0);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playClockToll(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    [130.81, 196.0, 261.63, 311.13].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22 / (idx + 1), now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
      osc.connect(gain);
      this.connectSpatial(gain, (idx - 1.5) * 0.18, 0.72, 0.22);
      osc.start(now);
      osc.stop(now + 2.9);
    });
  }

  public playMemoryChime(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = now + i * 0.09;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(gain);
      this.connectSpatial(gain, (i - 1.5) * 0.25, 0.65, 0.35);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  public playPillarActivate(stepIndex: number): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    const base = 261.63 * Math.pow(1.12246, stepIndex * 2);
    [base, base * 1.25, base * 1.5, base * 2].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);
      osc.connect(gain);
      this.connectSpatial(gain, (idx - 1.5) * 0.2, 0.68, 0.28);
      osc.start(now);
      osc.stop(now + 1.5);
    });
  }

  public playLanternPulse(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.78);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc.connect(gain);
    this.connectSpatial(gain, 0, 0.62, 0.2);
    osc.start(now);
    osc.stop(now + 0.95);
  }

  // High-pass FM Metallic Chain Clanks for Locked Counseling Room Door
  public playChainRattle(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const t = now + i * 0.085;
      const pan = (Math.random() - 0.5) * 0.9;

      // Inharmonic FM iron clank
      const carrier = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const hp = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      carrier.type = 'square';
      carrier.frequency.value = 1520 + i * 280;
      mod.type = 'sine';
      mod.frequency.value = 537 + i * 70;
      modGain.gain.value = 920;

      hp.type = 'highpass';
      hp.frequency.value = 1800;

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(hp);
      hp.connect(gain);
      this.connectSpatial(gain, pan, 0.65, 0.12);

      carrier.start(t);
      mod.start(t);
      carrier.stop(t + 0.18);
      mod.stop(t + 0.18);

      // Metallic scrape transient burst
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'highpass';
      bp.frequency.value = 2400;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.14, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      src.connect(bp);
      bp.connect(ng);
      this.connectSpatial(ng, pan, 0.55, 0);
      src.start(t, 0.15, 0.12);
    }
  }

  public playIceShatter(): void {
    if (!this.ctx || !this.dryBus || !this.whiteNoiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;

    // Deep sub fracture boom
    const boom = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    boom.type = 'sawtooth';
    boom.frequency.setValueAtTime(92, now);
    boom.frequency.exponentialRampToValueAtTime(28, now + 0.65);
    bGain.gain.setValueAtTime(0.28, now);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    boom.connect(bGain);
    this.connectSpatial(bGain, 0, 0.52, 0);
    boom.start(now);
    boom.stop(now + 0.75);

    // Razor-sharp crystalline crackle
    const src = this.ctx.createBufferSource();
    src.buffer = this.whiteNoiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2400;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.36, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    src.connect(hp);
    hp.connect(ng);
    this.connectSpatial(ng, 0, 0.64, 0);
    src.start(now, 0, 0.9);
  }

  public playSealBreak(): void {
    this.playIceShatter();
    this.playMemoryChime();
  }

  public playDoorSlam(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const pan = (Math.random() - 0.5) * 0.7;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(118, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 0.3);
    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    osc.connect(gain);
    this.connectSpatial(gain, pan, 0.62, 0);
    osc.start(now);
    osc.stop(now + 0.36);

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 720;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.28, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    src.connect(lp);
    lp.connect(ng);
    this.connectSpatial(ng, pan, 0.58, 0);
    src.start(now, 0.1, 0.26);
  }

  public playWhisperStatic(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const pan = (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.45);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1950, now);
    filter.frequency.linearRampToValueAtTime(880, now + 0.62);
    filter.Q.value = 6.2;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    src.connect(filter);
    filter.connect(gain);
    this.connectSpatial(gain, pan, 0.7, 0.2);
    src.start(now, Math.random() * 0.6, 0.75);
  }

  public playDamageSting(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    [138.59, 146.83, 277.18].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, now + 0.45);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.connect(gain);
      this.connectSpatial(gain, (idx - 1) * 0.35, 0.5, 0);
      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  public playLifeLost(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;

    // Heavy low impact pulse signaling 1 life lost
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(112, now);
    thump.frequency.exponentialRampToValueAtTime(32, now + 0.28);
    thumpGain.gain.setValueAtTime(0.45, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    thump.connect(thumpGain);
    thumpGain.connect(this.dryBus);
    thump.start(now);
    thump.stop(now + 0.36);

    // Brief falling minor second chime drop
    [329.63, 233.08].forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.78, t + 0.26);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(g);
      this.connectSpatial(g, idx === 0 ? -0.22 : 0.22, 0.48, 0.14);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  public playHideToggle(entering: boolean): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = entering ? 480 : 950;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    src.connect(filter);
    filter.connect(gain);
    this.connectSpatial(gain, 0, 0.35, 0);
    src.start(now, 0.1, 0.24);
  }

  // Brutal 1.2s Jumpscare: 35 Hz Sub-Bass + FM Waterphone/Violin Distortion Screech + 1.2s Radio Static
  public playJumpscareShriek(): void {
    if (!this.ctx || !this.dryBus || !this.whiteNoiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;

    // 1. 35Hz Sub-Bass Chest Slam
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(58, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.18);
    sub.frequency.exponentialRampToValueAtTime(26, now + 0.85);
    subGain.gain.setValueAtTime(0.68, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    sub.connect(subGain);
    subGain.connect(this.dryBus);
    sub.start(now);
    sub.stop(now + 1.0);

    // 2. FM Waterphone / Violin Screech Distortion
    const carrier = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const shaper = this.ctx.createWaveShaper();
    const screechGain = this.ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(720, now);
    carrier.frequency.linearRampToValueAtTime(1520, now + 0.14);
    carrier.frequency.exponentialRampToValueAtTime(520, now + 1.15);

    mod.type = 'sine';
    mod.frequency.setValueAtTime(237, now);
    mod.frequency.linearRampToValueAtTime(389, now + 0.32);
    modGain.gain.setValueAtTime(950, now);
    modGain.gain.exponentialRampToValueAtTime(280, now + 1.15);

    if (this.distortionCurve) {
      shaper.curve = this.distortionCurve;
    }

    screechGain.gain.setValueAtTime(0.28, now);
    screechGain.gain.exponentialRampToValueAtTime(0.001, now + 1.18);

    mod.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(shaper);
    shaper.connect(screechGain);
    this.connectSpatial(screechGain, 0, 0.52, 0.18);

    carrier.start(now);
    mod.start(now);
    carrier.stop(now + 1.2);
    mod.stop(now + 1.2);

    // 3. 1.2-Second Distorted Radio Static Burst
    const staticSrc = this.ctx.createBufferSource();
    staticSrc.buffer = this.whiteNoiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2300, now);
    bp.frequency.linearRampToValueAtTime(1450, now + 1.18);
    bp.Q.value = 1.15;

    const staticShaper = this.ctx.createWaveShaper();
    if (this.distortionCurve) staticShaper.curve = this.distortionCurve;

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.46, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    staticSrc.connect(bp);
    bp.connect(staticShaper);
    staticShaper.connect(nGain);
    this.connectSpatial(nGain, 0, 0.38, 0);
    staticSrc.start(now, 0, 1.22);
  }

  public playGlassShatterMassive(): void {
    if (!this.ctx || !this.dryBus || !this.whiteNoiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    this.playIceShatter();

    // Razor-sharp staggered crystalline shard transients
    [2450, 3180, 3820, 4650, 2890, 5120].forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.042;
      const osc = this.ctx.createOscillator();
      const hp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.58, t + 0.19);

      hp.type = 'highpass';
      hp.frequency.value = 2100;

      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(hp);
      hp.connect(g);
      this.connectSpatial(g, (idx % 2 === 0 ? -1 : 1) * (0.2 + idx * 0.1), 0.65, 0.12);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playMetalBang(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.34);
    g.gain.setValueAtTime(0.42, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(g);
    this.connectSpatial(g, 0.2, 0.65, 0);
    osc.start(now);
    osc.stop(now + 0.4);

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1480;
    bp.Q.value = 3.5;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.32, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    src.connect(bp);
    bp.connect(ng);
    this.connectSpatial(ng, -0.2, 0.6, 0);
    src.start(now, 0.2, 0.3);
  }

  // Distorted / FM-warped Smartphone Notification Glitch (Babak III)
  public playNotificationGlitch(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    [1318.5, 1760, 1244.5, 2193].forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.055;
      const osc = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modG = this.ctx.createGain();
      const shaper = this.ctx.createWaveShaper();
      const g = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * (i % 2 === 0 ? 0.84 : 1.14), t + 0.11);

      mod.type = 'sawtooth';
      mod.frequency.value = 95 + i * 37;
      modG.gain.value = 260;

      if (this.distortionCurve) shaper.curve = this.distortionCurve;

      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      mod.connect(modG);
      modG.connect(osc.frequency);
      osc.connect(shaper);
      shaper.connect(g);
      this.connectSpatial(g, (i % 2 === 0 ? -1 : 1) * 0.4, 0.5, 0.32);

      osc.start(t);
      mod.start(t);
      osc.stop(t + 0.18);
      mod.stop(t + 0.18);
    });
  }

  public playElectricBuzz(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 100;
    g.gain.setValueAtTime(0.032, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g);
    this.connectSpatial(g, (Math.random() - 0.5) * 0.8, 0.45, 0);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  public playCutsceneFinalChord(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    // Slow A-minor chord dissolving into cold corridor reverb
    [220.0, 261.63, 329.63, 440.0].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = idx % 2 === 0 ? -6 : 8;
      const start = now + idx * 0.18;
      g.gain.setValueAtTime(0.001, start);
      g.gain.linearRampToValueAtTime(0.11, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0008, start + 3.4);
      osc.connect(g);
      this.connectSpatial(g, (idx - 1.5) * 0.24, 0.78, 0.35);
      osc.start(start);
      osc.stop(start + 3.5);
    });
  }

  public playPaperInspect(): void {
    if (!this.ctx || !this.dryBus || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1650, now);
    bp.frequency.linearRampToValueAtTime(2400, now + 0.14);
    bp.Q.value = 1.6;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    src.connect(bp);
    bp.connect(gain);
    this.connectSpatial(gain, 0, 0.25, 0);
    src.start(now, 0.2, 0.2);
  }

  public playSwitchClick(pitchOffset = 0): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520 + pitchOffset * 60, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.055);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(g);
    this.connectSpatial(g, 0, 0.22, 0);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playPuzzleSolved(): void {
    if (!this.ctx || !this.dryBus || this.muted) return;
    const now = this.ctx.currentTime;
    [392.0, 493.88, 587.33, 783.99].forEach((freq, i) => {
      if (!this.ctx) return;
      const t = now + i * 0.075;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(g);
      this.connectSpatial(g, (i - 1.5) * 0.18, 0.55, 0.12);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
    this.initialized = false;
  }
}
