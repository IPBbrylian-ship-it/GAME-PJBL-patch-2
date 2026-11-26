import {
  CONSTITUTIONAL_MAPPINGS,
  ENDINGS,
  LAYER_METAS,
  MIRROR_QUESTIONS,
} from '../types/game';
import {
  CUTSCENE_FATAL_LINE,
  FRAGMENT_DIALOGUES,
  LAYER_INTRO_DIALOGUES,
  PROLOGUE_DIALOGUES,
  TRIGGER_DIALOGUES,
  getEpilogueDialogues,
} from './story';

function safeJsonForHtml(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, '<\\/');
}

export function buildStandaloneHtml(): string {
  const storyBundle = {
    layers: LAYER_METAS,
    mirrors: MIRROR_QUESTIONS,
    constitutionalMappings: CONSTITUTIONAL_MAPPINGS,
    endings: ENDINGS,
    prologue: PROLOGUE_DIALOGUES,
    layerIntros: LAYER_INTRO_DIALOGUES,
    fragments: FRAGMENT_DIALOGUES,
    triggers: TRIGGER_DIALOGUES,
    cutsceneFatalLine: CUTSCENE_FATAL_LINE,
    epilogues: {
      true: getEpilogueDialogues('true'),
      neutral: getEpilogueDialogues('neutral'),
      bad: getEpilogueDialogues('bad'),
    },
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>SHATTERED MEMORIES: Sudut Beku Rindiani (Standalone 1-File)</title>
  <style>
    * { box-sizing: border-box; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
      background: #04080f; color: #d6dde6;
      font-family: Georgia, 'Times New Roman', serif;
      touch-action: none; overscroll-behavior: none;
    }
    input, textarea { user-select: text; -webkit-user-select: text; touch-action: manipulation; }
    button:focus-visible, input:focus-visible { outline: 1px solid #d4a353; outline-offset: 2px; }
    .mono { font-family: 'Courier New', Courier, monospace; }
    .serif { font-family: Georgia, 'Times New Roman', serif; }
    .tabular { font-variant-numeric: tabular-nums; }
    #gl-wrap { position: fixed; inset: 0; }
    .scanlines {
      position: fixed; inset: 0; z-index: 4; pointer-events: none;
      background: repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(2,6,14,0.20) 3px, rgba(2,6,14,0.20) 4px);
    }
    .grain {
      position: fixed; inset: 0; z-index: 4; pointer-events: none; opacity: 0.055;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    #vignette, #strobe-fx, #edge-glitch, #crack-svg, #fade-curtain { position: fixed; inset: 0; pointer-events: none; }
    #vignette { z-index: 8; transition: background 240ms ease; }
    #strobe-fx { z-index: 9; display: none; }
    #edge-glitch {
      z-index: 9; display: none; opacity: 0.72;
      background:
        repeating-linear-gradient(to bottom, transparent 0px, transparent 5px, rgba(220,38,38,0.16) 6px, transparent 8px),
        radial-gradient(circle at center, transparent 55%, rgba(153,27,27,0.45) 100%);
      animation: edgeGlitch 2.4s steps(2, end) infinite;
    }
    .low-health-pulse { animation: lowHealthPulse 1.45s ease-in-out infinite; }
    @keyframes lowHealthPulse { 0%, 100% { opacity: 0.72; } 50% { opacity: 1; } }
    @keyframes edgeGlitch {
      0%, 84%, 100% { opacity: 0; transform: translate3d(0,0,0); }
      86% { opacity: 0.45; transform: translate3d(-2px,0,0); }
      90% { opacity: 0.25; transform: translate3d(2px,0,0); }
      94% { opacity: 0.52; transform: translate3d(-1px,0,0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .low-health-pulse, #edge-glitch { animation: none !important; }
    }
    #crack-svg { z-index: 9; width: 100%; height: 100%; }
    #fade-curtain { z-index: 24; background: #020408; opacity: 0; transition: opacity 140ms linear; }
    .hidden-fx { display: none !important; }
    .cs-bar {
      height: 50px; background: rgba(2,4,8,0.96);
      border-color: rgba(30,41,59,0.5); border-style: solid; border-width: 0;
      transition: height 280ms ease, opacity 220ms ease;
    }
    .cs-bar.top { border-bottom-width: 1px; }
    .cs-bar.bot { border-top-width: 1px; }
    .cs-bar.collapsed { height: 0; opacity: 0; border-width: 0; }
    .screen { position: fixed; inset: 0; z-index: 20; display: none; }
    .screen.active { display: flex; }
    #title-screen {
      flex-direction: column; justify-content: space-between; padding: 22px 26px;
      overflow-y: auto; touch-action: pan-y;
      background: linear-gradient(to right, rgba(3,6,12,0.93) 0%, rgba(5,11,20,0.72) 55%, rgba(5,11,20,0.25) 100%);
    }
    .btn {
      min-height: 44px; border: 1px solid #3d4959; background: rgba(9,16,26,0.9); color: #d6dde6;
      padding: 10px 14px; cursor: pointer; font-size: 12px; transition: border-color 140ms, background-color 140ms;
      white-space: nowrap;
    }
    .btn:hover { border-color: #d4a353; background: rgba(15,24,38,0.95); }
    .btn-primary {
      min-height: 48px; border: 1px solid #d4a353; background: #d4a353; color: #090d14;
      padding: 12px 26px; font-weight: bold; letter-spacing: 0.14em; cursor: pointer; font-size: 14px;
      transition: background-color 140ms; white-space: nowrap;
    }
    .btn-primary:hover { background: #e0b467; }
    .input-box {
      min-height: 44px; width: 100%; padding: 8px 10px; border: 1px solid #323d4d;
      background: #070d16; color: #e2e8f0; font-size: 12px; outline: none;
    }
    .input-box:focus { border-color: #d4a353; }
    .ctrl-card {
      min-height: 52px; text-align: left; padding: 10px 12px; border: 1px solid #2f3947;
      background: rgba(7,12,20,0.9); color: #94a3b8; cursor: pointer; transition: border-color 140ms;
    }
    .ctrl-card.selected { border-color: #d4a353; background: rgba(19,28,40,0.95); color: #e2e8f0; }
    #hud-screen { pointer-events: none; z-index: 14; flex-direction: column; justify-content: space-between; padding: 14px 18px; }
    .stability-card {
      max-width: 310px; border: 1px solid rgba(61,73,89,0.85); background: rgba(7,11,19,0.82);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      padding: 9px 12px; box-shadow: 0 10px 24px rgba(0,0,0,0.55); margin-bottom: 8px;
    }
    .crystal-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; margin-top: 6px; }
    .crystal-seg {
      height: 9px; border: 1px solid #334155; background: rgba(15,23,42,0.75);
      clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);
    }
    .paper-note {
      max-width: 310px; border: 1px solid rgba(61,73,89,0.82); background: rgba(11,16,24,0.82);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      padding: 10px 12px; box-shadow: 0 10px 24px rgba(0,0,0,0.5);
    }
    .bar-track { height: 3px; width: 100%; background: #1e2631; margin-top: 3px; }
    .bar-fill { height: 100%; transition: width 120ms; }
    #portrait-banner {
      display: none; position: fixed; top: 8px; left: 50%; transform: translateX(-50%); z-index: 26;
      max-width: 92vw; border: 1px solid rgba(120,169,196,0.55); background: rgba(7,13,23,0.9);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      padding: 6px 12px; font-size: 10px; color: #cbd5e1; align-items: center; gap: 8px; pointer-events: auto;
    }
    /* MULTI-TOUCH MOBILE CONTROLS */
    #touch-controls { position: fixed; inset: 0; z-index: 12; display: none; pointer-events: none; }
    #touch-controls.active { display: block; }
    #touch-cam-zone { position: absolute; inset: 0; pointer-events: auto; touch-action: none; }
    #touch-stick-zone {
      position: absolute; bottom: 14px; left: 14px; width: 154px; height: 154px;
      display: flex; align-items: center; justify-content: center; pointer-events: auto; touch-action: none;
    }
    #touch-stick-base {
      position: relative; width: 120px; height: 120px; border-radius: 50%;
      border: 1px solid rgba(120,169,196,0.45); background: rgba(6,11,19,0.42);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
    }
    #touch-stick-knob {
      width: 48px; height: 48px; border-radius: 50%;
      border: 1px solid rgba(147,197,253,0.85); background: rgba(18,32,48,0.8); pointer-events: none;
    }
    #touch-actions {
      position: absolute; bottom: 18px; right: 16px; display: flex; align-items: flex-end;
      gap: 10px; pointer-events: auto; touch-action: none;
    }
    .touch-btn {
      border-radius: 50%; border: 1px solid rgba(120,169,196,0.48); background: rgba(7,12,20,0.62);
      backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      color: #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      cursor: pointer; position: relative; padding: 0;
    }
    #dialogue-screen {
      z-index: 30; align-items: flex-end; justify-content: center; padding: 18px; cursor: pointer; touch-action: manipulation;
      background: linear-gradient(to top, rgba(2,5,10,0.72), transparent 55%);
    }
    .dialogue-box {
      width: 100%; max-width: 780px; border: 1px solid #3d4959;
      background: linear-gradient(180deg, rgba(11,16,24,0.95) 0%, rgba(6,10,17,0.97) 100%);
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      padding: 20px 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.88); min-height: 48px;
    }
    #cutscene-screen {
      z-index: 25; pointer-events: none; flex-direction: column; justify-content: space-between;
    }
    #mirror-screen, #ending-screen, #pause-screen, #gameover-screen {
      z-index: 35; align-items: center; justify-content: center; padding: 18px;
      background: rgba(2,5,10,0.94); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
      overflow-y: auto; touch-action: pan-y;
    }
    .dossier {
      width: 100%; max-width: 780px; border: 1px solid #3d4959;
      background: linear-gradient(180deg, rgba(11,16,24,0.96) 0%, rgba(6,10,17,0.98) 100%);
      padding: 24px; margin: auto; box-shadow: 0 24px 64px rgba(0,0,0,0.88);
    }
    .choice-btn {
      min-height: 48px; width: 100%; text-align: left; border: 1px solid #2f3947; background: rgba(8,12,19,0.92);
      padding: 14px; color: #e2e8f0; cursor: pointer; margin-top: 10px; transition: border-color 140ms, background-color 140ms;
    }
    .choice-btn:hover { border-color: #d4a353; background: rgba(17,25,36,0.96); }
    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .kpi-strip-3 {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      border-top: 1px solid #24303f; border-bottom: 1px solid #24303f;
    }
    .kpi-strip-4 {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      border-top: 1px solid #24303f; border-bottom: 1px solid #24303f;
    }
    .kpi-cell { padding: 10px 12px; border-right: 1px solid #24303f; }
    .kpi-cell:last-child { border-right: none; }
    .stat-box { border: 1px solid #24303f; background: #0a0f17; padding: 10px 12px; }
  </style>
  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.170.0/build/three.module.js"
      }
    }
  </script>
</head>
<body>
  <div id="gl-wrap"></div>
  <div id="fx-scanlines" class="scanlines"></div>
  <div id="fx-grain" class="grain"></div>
  <div id="vignette"></div>
  <div id="strobe-fx"></div>
  <div id="edge-glitch"></div>
  <div id="fade-curtain"></div>

  <!-- PERMANENT PROGRESSIVE SCREEN-EDGE CRACKS (1-4 JUMPSCARE HITS) -->
  <svg id="crack-svg" viewBox="0 0 1000 600" preserveAspectRatio="none">
    <g id="crack-t1" style="display:none;" stroke="rgba(186,230,253,0.68)" stroke-width="2" fill="none">
      <polyline points="0,0 74,48 118,38 175,92 162,135" />
      <polyline points="74,48 52,102 96,144" />
      <polyline points="118,38 158,14 215,24" />
    </g>
    <g id="crack-t2" style="display:none;" stroke="rgba(186,230,253,0.74)" stroke-width="2.2" fill="none">
      <polyline points="1000,600 912,535 865,552 805,488 818,438" />
      <polyline points="912,535 942,468 896,422" />
      <polyline points="865,552 818,582 758,568" />
    </g>
    <g id="crack-t3" style="display:none;" stroke="rgba(224,242,254,0.82)" stroke-width="2.4" fill="none">
      <polyline points="1000,0 915,62 855,48 795,112 814,172" />
      <polyline points="915,62 948,132 895,184" />
      <polyline points="855,48 802,18 738,34" />
    </g>
    <g id="crack-t4" style="display:none;" stroke="rgba(248,113,113,0.82)" stroke-width="2.8" fill="none">
      <polyline points="0,600 95,522 148,540 218,475 204,412" />
      <polyline points="95,522 65,442 125,388" />
      <polyline points="175,92 248,142 292,126" />
      <polyline points="805,488 738,442 695,460" />
    </g>
  </svg>

  <!-- TITLE SCREEN -->
  <div id="title-screen" class="screen active">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div class="mono" style="font-size:11px;letter-spacing:0.18em;color:#8aa4b8;">ARSIP MEMORI · KEWARGANEGARAAN PjBL</div>
      <button id="btn-mute-title" class="btn mono">Suara Aktif</button>
    </div>

    <div style="max-width:560px;margin:auto 0;">
      <div class="mono" style="font-size:11px;letter-spacing:0.25em;color:#8aa4b8;">DOKUMEN PSIKOLOGIS · EMPAT BABAK INGATAN</div>
      <h1 class="serif" style="font-size:36px;margin:8px 0 4px 0;color:#cbd5e1;letter-spacing:2px;">SHATTERED MEMORIES</h1>
      <div class="serif" style="font-size:22px;color:#d4a353;letter-spacing:3px;margin-bottom:14px;">SUDUT BEKU RINDIANI</div>
      <p class="mono" style="font-size:12px;line-height:1.65;color:#b6c2d1;margin-bottom:18px;">
        Di sudut taman kampus yang membeku, Bima mencoba menembus tembok diam Rindiani.
        Jaga Kestabilan Batin Rindiani (5/5) dari sergapan bayangan trauma sembari menyelamatkan ingatan yang terkunci.
      </p>

      <div class="grid-2" style="margin-bottom:14px;">
        <div>
          <label class="mono" style="display:block;font-size:11px;color:#8aa4b8;margin-bottom:4px;">Inisial / Nama Responden</label>
          <input id="resp-input" class="input-box mono" type="text" placeholder="Misal: Mahasiswa A / NIM" />
        </div>
        <div>
          <label class="mono" style="display:block;font-size:11px;color:#8aa4b8;margin-bottom:4px;">Intensitas Eksplorasi</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;">
            <button id="mode-std" class="btn mono" style="border-color:#d4a353;color:#d4a353;">Standar</button>
            <button id="mode-story" class="btn mono" style="color:#94a3b8;">Cerita Aman</button>
          </div>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div class="mono" style="display:flex;justify-content:space-between;font-size:11px;color:#8aa4b8;margin-bottom:5px;">
          <span>MODE PERANGKAT KONTROL</span>
          <span id="ctrl-status-lbl" style="color:#78a9c4;">Keyboard &amp; Mouse</span>
        </div>
        <div class="grid-2">
          <button id="ctrl-pc" class="ctrl-card selected mono">
            <div style="font-size:12px;font-weight:bold;">[MODE PC / LAPTOP]</div>
            <div style="font-size:10px;color:#8aa4b8;margin-top:3px;">WASD/Panah, Mouse, Shift, E &amp; F</div>
          </button>
          <button id="ctrl-mobile" class="ctrl-card mono">
            <div style="font-size:12px;font-weight:bold;">[MODE MOBILE / TOUCHSCREEN]</div>
            <div style="font-size:10px;color:#8aa4b8;margin-top:3px;">Virtual Dual-Stick &amp; Tombol Sentuh</div>
          </button>
        </div>
      </div>

      <button id="btn-start" class="btn-primary serif">MULAI SELAM BATIN</button>
      <div style="margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button id="btn-fx-title" class="btn mono" style="min-height:36px;padding:6px 11px;font-size:11px;color:#cbd5e1;">Efek Kamera Sinematik: Aktif</button>
      </div>
      <div class="mono" style="display:flex;gap:18px;margin-top:12px;font-size:12px;">
        <span id="toggle-ctrl" style="color:#9aa8b8;cursor:pointer;text-decoration:underline;">Panduan Kontrol</span>
        <span id="toggle-about" style="color:#9aa8b8;cursor:pointer;text-decoration:underline;">Tentang Riset PjBL</span>
      </div>
      <div id="subpanel-box" class="mono" style="display:none;margin-top:12px;border:1px solid #334155;background:rgba(7,13,22,0.94);padding:12px;font-size:11px;line-height:1.6;color:#cbd5e1;"></div>
    </div>

    <div id="title-hint-line" class="mono" style="font-size:11px;color:#8aa4b8;border-top:1px solid #232d3b;padding-top:10px;">
      WASD Bergerak · Mouse / Geser Lihat · Shift Lari · F Lentera · E Aksi / Sembunyi · Esc Jeda
    </div>
  </div>

  <!-- PORTRAIT ORIENTATION WARNING BANNER (MOBILE) -->
  <div id="portrait-banner" class="mono">
    <span>Putar perangkat ke posisi Landscape untuk pengalaman terbaik</span>
    <button id="btn-close-portrait" style="background:none;border:none;color:#d4a353;font-weight:bold;cursor:pointer;padding:2px 6px;">✕</button>
  </div>

  <!-- MULTI-TOUCH MOBILE CONTROLS OVERLAY -->
  <div id="touch-controls">
    <div id="touch-cam-zone"></div>
    <div id="touch-stick-zone">
      <div id="touch-stick-base">
        <div id="touch-stick-lbl" class="mono" style="position:absolute;top:-16px;font-size:9px;letter-spacing:0.12em;color:rgba(138,164,184,0.8);pointer-events:none;">GERAK</div>
        <div id="touch-stick-knob"></div>
      </div>
    </div>
    <div id="touch-actions">
      <button id="touch-sprint" class="touch-btn mono" style="width:54px;height:54px;font-size:9px;">LARI</button>
      <button id="touch-lantern" class="touch-btn mono" style="width:62px;height:62px;font-size:8.5px;border:none;">
        <svg viewBox="0 0 62 62" style="position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);pointer-events:none;">
          <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(51,65,85,0.65)" stroke-width="2.5"></circle>
          <circle id="lantern-ring-progress" cx="31" cy="31" r="26" fill="none" stroke="#d4a353" stroke-width="2.8" stroke-dasharray="163.36" stroke-dashoffset="0" stroke-linecap="round"></circle>
        </svg>
        <span style="position:relative;z-index:2;font-weight:bold;">LENTERA</span>
      </button>
      <button id="touch-interact" class="touch-btn mono" style="width:68px;height:68px;font-size:10px;font-weight:bold;">AKSI</button>
    </div>
  </div>

  <!-- GAME HUD -->
  <div id="hud-screen" class="screen">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
      <div>
        <div class="stability-card">
          <div class="mono" style="display:flex;justify-content:space-between;font-size:10px;letter-spacing:0.12em;">
            <span style="color:#cbd5e1;">KESTABILAN BATIN</span>
            <span id="hud-stab-txt" class="tabular" style="color:#78a9c4;font-weight:bold;">5/5</span>
          </div>
          <div class="crystal-row" id="hud-stab-bars">
            <div class="crystal-seg"></div><div class="crystal-seg"></div><div class="crystal-seg"></div><div class="crystal-seg"></div><div class="crystal-seg"></div>
          </div>
          <div id="hud-grace" class="mono" style="display:none;font-size:10px;color:#d4a353;margin-top:6px;"></div>
        </div>

        <div class="paper-note">
          <div class="mono" style="display:flex;justify-content:space-between;font-size:11px;color:#8aa4b8;border-bottom:1px solid #2b3440;padding-bottom:6px;">
            <span id="hud-era">BABAK I</span>
            <span id="hud-progress" class="tabular" style="color:#d4a353;font-weight:bold;">0/2</span>
          </div>
          <div id="hud-title" class="serif" style="font-size:13px;font-weight:bold;color:#e2e8f0;margin-top:5px;"></div>
          <div id="hud-hint" class="mono" style="font-size:10px;line-height:1.45;color:#9fb0c2;margin-top:4px;"></div>
        </div>

        <div id="hud-mobile-bars-slot" style="margin-top:8px;"></div>
      </div>

      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;pointer-events:auto;">
        <div style="display:flex;gap:6px;">
          <button id="btn-ctrl-hud" class="btn mono" style="padding:8px 10px;">PC</button>
          <button id="btn-mute-hud" class="btn mono" style="padding:8px 10px;">Suara</button>
          <button id="btn-pause" class="btn mono" style="padding:8px 12px;">Jeda</button>
        </div>
        <div id="hud-pc-hint" class="mono" style="font-size:10px;color:#8aa4b8;background:rgba(5,9,16,0.7);padding:4px 8px;">
          WASD Gerak · Shift Lari · F Lentera · E Aksi
        </div>
      </div>
    </div>

    <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;padding:0 16px;">
      <div id="hud-reticle" style="width:6px;height:6px;border-radius:50%;background:rgba(220,227,236,0.78);"></div>
      <div id="hud-hiding" class="mono" style="display:none;padding:6px 14px;border:1px solid #4b5c6e;background:rgba(5,9,17,0.92);color:#9fc2db;font-size:12px;">BERSEMBUNYI DALAM GELAP</div>
      <div id="hud-prompt" class="mono" style="display:none;margin-top:22px;padding:8px 16px;border:1px solid rgba(212,163,83,0.6);background:rgba(6,10,18,0.92);text-align:center;">
        <div id="hud-prompt-main" style="font-size:13px;color:#e6c07b;font-weight:bold;"></div>
        <div id="hud-prompt-sub" style="font-size:11px;color:#9fb0c2;margin-top:2px;"></div>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;align-items:flex-end;">
      <div id="hud-pc-bars-slot">
        <div id="hud-bars-wrap" class="mono" style="font-size:10px;color:#9aa8b8;display:flex;flex-direction:column;gap:6px;width:190px;background:rgba(6,11,19,0.65);padding:6px 8px;border:1px solid rgba(36,48,62,0.7);">
          <div>
            <div style="display:flex;justify-content:space-between;"><span>KEHANGATAN</span><span id="hud-warmth" class="tabular">100%</span></div>
            <div class="bar-track"><div id="bar-warmth" class="bar-fill" style="width:100%;background:#78a9c4;"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;"><span>NAPAS</span><span id="hud-stamina" class="tabular">100%</span></div>
            <div class="bar-track"><div id="bar-stamina" class="bar-fill" style="width:100%;background:#9fb8cc;"></div></div>
          </div>
          <div id="hud-lantern-row">
            <div style="display:flex;justify-content:space-between;"><span style="color:#d4a353;">LENTERA [F]</span><span id="hud-lantern" class="tabular" style="color:#d4a353;">SIAP</span></div>
            <div class="bar-track"><div id="bar-lantern" class="bar-fill" style="width:100%;background:#d4a353;"></div></div>
          </div>
        </div>
      </div>
      <div id="hud-frost-badge" class="mono tabular" style="font-size:11px;color:#8aa4b8;">TRAUMA BEKU · <span id="hud-frost" style="color:#cbd5e1;">38%</span></div>
    </div>
  </div>

  <!-- CUTSCENE SUBTITLE OVERLAY -->
  <div id="cutscene-screen" class="screen">
    <div id="cutscene-bar-top" class="cs-bar top"></div>
    <div style="margin-top:auto;padding:0 24px 16px 24px;display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div id="cutscene-sub-box" style="display:none;max-width:680px;border:1px solid rgba(61,73,89,0.85);background:rgba(5,8,16,0.9);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:15px 22px;text-align:center;">
        <div id="cutscene-sub-speaker" class="mono" style="font-size:10px;letter-spacing:0.2em;color:#78a9c4;margin-bottom:6px;text-transform:uppercase;">RINDIANI · SUARA MELEMAH</div>
        <p id="cutscene-sub-text" class="serif" style="margin:0;font-size:17px;font-style:italic;color:#e2e8f0;line-height:1.55;"></p>
      </div>
      <div style="width:100%;display:flex;justify-content:flex-end;">
        <button id="btn-skip-cutscene" class="btn mono" style="display:none;pointer-events:auto;min-height:36px;padding:6px 12px;font-size:11px;border-color:rgba(120,169,196,0.55);color:#cbd5e1;">Lewati Adegan · Spasi</button>
      </div>
    </div>
    <div id="cutscene-bar-bot" class="cs-bar bot"></div>
  </div>

  <!-- DIALOGUE BOX -->
  <div id="dialogue-screen" class="screen">
    <div class="dialogue-box">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #2d3748;padding-bottom:8px;margin-bottom:12px;">
        <div>
          <span id="dlg-speaker" class="serif" style="font-size:17px;font-weight:bold;color:#d4a353;"></span>
          <span style="color:#64748b;margin:0 8px;">·</span>
          <span id="dlg-emotion" class="mono" style="font-size:12px;color:#8aa4b8;"></span>
        </div>
        <span id="dlg-count" class="mono tabular" style="font-size:11px;color:#64748b;">1/1</span>
      </div>
      <p id="dlg-text" class="mono" style="font-size:14px;line-height:1.65;color:#dce3ec;min-height:52px;margin:0;"></p>
      <div class="mono" style="text-align:right;font-size:11px;color:#9aa8b8;margin-top:12px;" id="dlg-hint">[Spasi / Klik] Lanjutkan</div>
    </div>
  </div>

  <!-- PAUSE MODAL -->
  <div id="pause-screen" class="screen">
    <div class="dossier" style="max-width:440px;">
      <div class="mono" style="font-size:11px;color:#8aa4b8;">PENELUSURAN DIJEDA</div>
      <h2 class="serif" style="margin:6px 0 12px 0;color:#e2e8f0;" id="pause-title"></h2>
      <div id="pause-ctrl-hint" class="mono" style="border:1px solid #26303d;background:#070b11;padding:10px;font-size:11px;line-height:1.6;color:#cbd5e1;margin-bottom:16px;">
        WASD/Panah: Gerak · Mouse/Geser: Lihat · Shift: Lari · F: Lentera Bekukan Bayangan · E: Ambil/Sembunyi/Buka Segel
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        <button id="btn-resume" class="btn-primary serif">LANJUTKAN</button>
        <button id="btn-ctrl-pause" class="btn mono">Mode Kontrol: PC</button>
        <button id="btn-fx-pause" class="btn mono">Efek Kamera Sinematik: Aktif</button>
        <button id="btn-restart-pause" class="btn mono">Ulangi dari Awal</button>
        <button id="btn-title-pause" class="btn mono">Kembali ke Layar Judul</button>
      </div>
    </div>
  </div>

  <!-- MIRROR MODAL -->
  <div id="mirror-screen" class="screen">
    <div class="dossier">
      <div class="mono" style="display:flex;justify-content:space-between;font-size:11px;color:#8aa4b8;border-bottom:1px solid #252e3a;padding-bottom:10px;">
        <span id="mir-between"></span>
        <span id="mir-frost" class="tabular" style="color:#78a9c4;"></span>
      </div>
      <h2 class="serif" style="color:#e2e8f0;margin:14px 0 8px 0;">Lembar Evaluasi: Cermin Psikologis</h2>
      <p id="mir-prompt" class="mono" style="font-size:14px;line-height:1.65;color:#dce3ec;"></p>
      <div id="mir-context" class="mono" style="font-size:12px;color:#d4a353;border-top:1px solid #252e3a;border-bottom:1px solid #252e3a;padding:8px 0;margin:12px 0;"></div>
      <div id="mir-options"></div>
    </div>
  </div>

  <!-- SPECIAL GAME OVER MODAL -->
  <div id="gameover-screen" class="screen">
    <div class="dossier" style="border-color:rgba(194,89,89,0.7);background:#0a0d14;">
      <div style="height:2px;width:100%;background:linear-gradient(90deg,rgba(194,89,89,0.9),rgba(194,89,89,0.35),transparent);margin-bottom:14px;"></div>
      <div class="mono" style="font-size:11px;letter-spacing:0.16em;color:#f87171;">KESTABILAN BATIN 0/5 · KEHANCURAN TOTAL</div>
      <h1 class="serif" style="color:#e2e8f0;margin:10px 0;font-size:24px;line-height:1.25;">GAME OVER: BATIN RINDIANI TAK LAGI DAPAT DISELAMATKAN</h1>
      <p class="mono" style="font-size:12px;line-height:1.65;color:#cbd5e1;margin-bottom:16px;">
        Kubah kaca membeku gelap dan menutup rapat suara Rindiani selamanya. Akumulasi trauma yang dibiarkan tanpa perlindungan, cemoohan sekitar, dan keterlambatan menjemput ruang aman menghancurkan sisa kepercayaan yang dimilikinya.
      </p>
      <div class="mono" style="border:1px solid #24303f;background:#070a10;padding:14px;margin-bottom:16px;font-size:11px;">
        <div id="go-resp" style="color:#d4a353;font-weight:bold;margin-bottom:10px;"></div>
        <div class="kpi-strip-4" style="margin-bottom:12px;">
          <div class="kpi-cell"><div style="font-size:10px;color:#8aa4b8;">LOKASI</div><div id="go-layer" style="margin-top:4px;font-weight:bold;"></div></div>
          <div class="kpi-cell"><div style="font-size:10px;color:#8aa4b8;">KESTABILAN</div><div style="margin-top:4px;font-weight:bold;color:#f87171;">0 / 5</div></div>
          <div class="kpi-cell"><div style="font-size:10px;color:#8aa4b8;">FRAGMEN</div><div id="go-frags" style="margin-top:4px;font-weight:bold;color:#78a9c4;"></div></div>
          <div class="kpi-cell"><div style="font-size:10px;color:#8aa4b8;">KESADARAN</div><div id="go-score" style="margin-top:4px;font-weight:bold;color:#d4a353;"></div></div>
        </div>
        <div style="color:#9aa8b8;line-height:1.6;">
          Refleksi Kewarganegaraan: Saat lingkungan memilih bungkam dan membiarkan bayangan intimidasi mengejar korban, amanat kemanusiaan (Sila ke-2 Pancasila) serta hak atas rasa aman (Pasal 28G ayat (1) UUD NRI 1945) runtuh di hadapan pembiaran.
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button id="btn-go-restart" class="btn-primary mono" style="padding:10px 18px;font-size:12px;">ULANGI PERJALANAN</button>
          <button id="btn-go-copy" class="btn mono">SALIN DATA EVALUASI PjBL</button>
        </div>
        <button id="btn-go-title" class="btn mono">Layar Judul</button>
      </div>
    </div>
  </div>

  <!-- ENDING MODAL -->
  <div id="ending-screen" class="screen">
    <div class="dossier">
      <div style="height:2px;width:100%;background:linear-gradient(90deg,rgba(212,163,83,0.9),rgba(120,169,196,0.5),transparent);margin-bottom:14px;"></div>
      <div class="mono" style="display:flex;justify-content:space-between;font-size:12px;border-bottom:1px solid #24303f;padding-bottom:10px;">
        <span id="end-sub"></span>
        <span id="end-badge" style="color:#8aa4b8;"></span>
      </div>
      <h1 id="end-title" class="serif" style="color:#e2e8f0;margin:12px 0 8px 0;font-size:25px;"></h1>
      <p id="end-narr" class="mono" style="font-size:12px;line-height:1.65;color:#cbd5e1;margin-bottom:16px;"></p>

      <div class="serif" style="font-size:14px;font-weight:bold;color:#d4a353;margin-bottom:8px;">TINJAUAN PANCASILA & UUD NRI 1945</div>
      <p id="end-const" class="mono" style="font-size:12px;line-height:1.6;color:#dce3ec;border:1px solid #24303f;background:#070b11;padding:12px;margin-bottom:12px;"></p>
      <div id="end-mappings" class="grid-2" style="margin-bottom:16px;"></div>

      <div class="mono" style="border:1px solid #24303f;background:#070b11;padding:14px;margin-bottom:16px;">
        <div id="end-resp" style="font-size:12px;color:#d4a353;margin-bottom:10px;"></div>
        <div class="kpi-strip-3">
          <div class="kpi-cell"><div style="font-size:10px;color:#8aa4b8;">KESADARAN & EMPATI</div><div id="end-score" class="tabular" style="font-size:26px;font-weight:bold;margin-top:4px;"></div></div>
          <div class="kpi-cell"><div style="font-size:10px;color:#8aa4b8;">KEBEKUAN AKHIR</div><div id="end-frost" class="tabular" style="font-size:26px;font-weight:bold;color:#78a9c4;margin-top:4px;"></div></div>
          <div class="kpi-cell"><div style="font-size:10px;color:#8aa4b8;">KLASIFIKASI</div><div id="end-cat" style="font-size:11px;color:#dce3ec;margin-top:6px;"></div></div>
        </div>
        <div id="end-log" style="margin-top:12px;font-size:11px;color:#cbd5e1;"></div>
      </div>

      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <button id="btn-copy" class="btn-primary mono" style="padding:10px 18px;font-size:12px;">Salin Data ke Clipboard</button>
        <button id="btn-restart-end" class="btn mono">Ulangi Selam Batin</button>
      </div>
    </div>
  </div>

  <script type="module">
    import * as THREE from 'three';

    const STORY = ${safeJsonForHtml(storyBundle)};

    // --- PROCEDURAL WEB AUDIO ENGINE (SPATIAL REVERB & ADAPTIVE 3-LAYER HORROR) ---
    class AudioSys {
      constructor() {
        this.ctx = null; this.master = null; this.limiter = null; this.dryBus = null;
        this.reverb = null; this.reverbGain = null; this.echoDelay = null; this.echoSend = null;
        this.windGain = null; this.windFilterA = null; this.windFilterB = null;
        this.droneGain = null; this.droneFilter = null;
        this.scrapeGain = null; this.scrapeFilter = null;
        this.staticGain = null; this.staticFilter = null;
        this.whisperGain = null; this.whisperPanner = null;
        this.calmPadGain = null; this.breathGain = null; this.breathFilter = null;
        this.noise = null; this.whiteNoise = null; this.distCurve = null;
        this.muted = false; this.ready = false;
        this.bgmTimer = 0; this.bgmStep = 0; this.stepTimer = 0; this.stepPan = -1;
        this.hbTimer = 0; this.wPanTimer = 0; this.creakTimer = 4.5; this.breathPhase = 0;
        this.notes = [
          440, null, 523.25, 493.88, 349.23, null, 329.63, null,
          415.30, null, 440, 349.23, 329.63, null, 246.94, null,
          440, null, 659.25, 587.33, 523.25, null, 415.30, null,
          349.23, 329.63, 293.66, null, 246.94, null, 220, null
        ];
      }
      init() {
        if (this.ready) { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return; }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.value = -10; this.limiter.knee.value = 12;
        this.limiter.ratio.value = 8; this.limiter.attack.value = 0.003; this.limiter.release.value = 0.18;
        this.limiter.connect(this.ctx.destination);

        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.78;
        this.master.connect(this.limiter);

        this.dryBus = this.ctx.createGain();
        this.dryBus.gain.value = 0.92;
        this.dryBus.connect(this.master);

        this.reverb = this.ctx.createConvolver();
        this.reverb.buffer = this.createIR(2.6);
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.54;
        this.reverb.connect(this.reverbGain);
        this.reverbGain.connect(this.master);

        this.echoDelay = this.ctx.createDelay(1.5);
        this.echoDelay.delayTime.value = 0.38;
        const echoFb = this.ctx.createGain(); echoFb.gain.value = 0.36;
        const echoLp = this.ctx.createBiquadFilter(); echoLp.type = 'lowpass'; echoLp.frequency.value = 1150;
        this.echoSend = this.ctx.createGain(); this.echoSend.gain.value = 0.32;
        this.echoDelay.connect(echoLp); echoLp.connect(echoFb); echoFb.connect(this.echoDelay);
        echoLp.connect(this.echoSend); this.echoSend.connect(this.dryBus); this.echoSend.connect(this.reverb);

        const sr = this.ctx.sampleRate;
        const pLen = sr * 4;
        this.noise = this.ctx.createBuffer(1, pLen, sr);
        const pd = this.noise.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < pLen; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99765 * b0 + w * 0.099046;
          b1 = 0.96300 * b1 + w * 0.2965164;
          b2 = 0.57000 * b2 + w * 1.0526913;
          pd[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + w * 0.1848) * 0.22));
        }

        this.whiteNoise = this.ctx.createBuffer(1, sr * 2, sr);
        const wd = this.whiteNoise.getChannelData(0);
        for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;

        this.distCurve = new Float32Array(256);
        const k = 18;
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          this.distCurve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
        }

        this.startLayers();
        this.ready = true;
      }
      createIR(sec) {
        const sr = this.ctx.sampleRate, len = Math.floor(sr * sec);
        const ir = this.ctx.createBuffer(2, len, sr);
        const taps = [0.018, 0.031, 0.047, 0.066, 0.085];
        for (let ch = 0; ch < 2; ch++) {
          const d = ir.getChannelData(ch); let lp = 0;
          for (let i = 0; i < len; i++) {
            const raw = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.75);
            lp = lp * 0.72 + raw * 0.28; d[i] = lp * 0.78;
          }
          taps.forEach((ts, idx) => {
            const si = Math.min(len - 1, Math.floor((ts + ch * 0.004) * sr));
            d[si] += (ch === idx % 2 ? 0.42 : 0.24) / (idx + 1);
          });
        }
        return ir;
      }
      panner(pan) {
        if (!this.ctx || !this.ctx.createStereoPanner) return null;
        const p = this.ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); return p;
      }
      spatial(node, pan, revMix = 0.42, echoMix = 0) {
        if (!this.ctx || !this.dryBus) return;
        const p = this.panner(pan), out = p || node;
        if (p) node.connect(p);
        out.connect(this.dryBus);
        if (revMix > 0 && this.reverb) {
          const w = this.ctx.createGain(); w.gain.value = revMix; out.connect(w); w.connect(this.reverb);
        }
        if (echoMix > 0 && this.echoDelay) {
          const e = this.ctx.createGain(); e.gain.value = echoMix; out.connect(e); e.connect(this.echoDelay);
        }
      }
      startLayers() {
        // 1. Dual-LFO Howling Blizzard Wind
        const wSrc = this.ctx.createBufferSource(); wSrc.buffer = this.noise; wSrc.loop = true;
        this.windFilterA = this.ctx.createBiquadFilter(); this.windFilterA.type = 'bandpass'; this.windFilterA.frequency.value = 260; this.windFilterA.Q.value = 3.1;
        this.windFilterB = this.ctx.createBiquadFilter(); this.windFilterB.type = 'bandpass'; this.windFilterB.frequency.value = 640; this.windFilterB.Q.value = 2.6;
        const lfoA = this.ctx.createOscillator(), lgA = this.ctx.createGain(); lfoA.frequency.value = 0.07; lgA.gain.value = 135; lfoA.connect(lgA); lgA.connect(this.windFilterA.frequency); lfoA.start();
        const lfoB = this.ctx.createOscillator(), lgB = this.ctx.createGain(); lfoB.frequency.value = 0.11; lgB.gain.value = 280; lfoB.connect(lgB); lgB.connect(this.windFilterB.frequency); lfoB.start();
        this.windGain = this.ctx.createGain(); this.windGain.gain.value = 0.12;
        const wpA = this.panner(-0.22), wpB = this.panner(0.24);
        wSrc.connect(this.windFilterA); wSrc.connect(this.windFilterB);
        if (wpA && wpB) { this.windFilterA.connect(wpA); this.windFilterB.connect(wpB); wpA.connect(this.windGain); wpB.connect(this.windGain); }
        else { this.windFilterA.connect(this.windGain); this.windFilterB.connect(this.windGain); }
        this.spatial(this.windGain, 0, 0.36, 0); wSrc.start();

        // 2. BGM Layer 1: Dark Industrial Drone (45Hz - 90Hz)
        this.droneGain = this.ctx.createGain(); this.droneGain.gain.value = 0.075;
        this.droneFilter = this.ctx.createBiquadFilter(); this.droneFilter.type = 'lowpass'; this.droneFilter.frequency.value = 185; this.droneFilter.Q.value = 2.2;
        const dLfo = this.ctx.createOscillator(), dLg = this.ctx.createGain(); dLfo.frequency.value = 0.13; dLg.gain.value = 75; dLfo.connect(dLg); dLg.connect(this.droneFilter.frequency); dLfo.start();
        const pDrift = this.ctx.createOscillator(), pDg = this.ctx.createGain(); pDrift.frequency.value = 0.08; pDg.gain.value = 14; pDrift.connect(pDg); pDrift.start();
        [[46.25,'sawtooth',0.42],[69.3,'triangle',0.48],[82.41,'sawtooth',0.25]].forEach(([f, tp, v]) => {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = tp; o.frequency.value = f; g.gain.value = v;
          pDg.connect(o.detune); o.connect(g); g.connect(this.droneFilter); o.start();
        });
        this.droneFilter.connect(this.droneGain); this.spatial(this.droneGain, 0, 0.48, 0);

        // 3. BGM Layer 3A: FM Rusted Metallic Scrape
        this.scrapeGain = this.ctx.createGain(); this.scrapeGain.gain.value = 0;
        this.scrapeFilter = this.ctx.createBiquadFilter(); this.scrapeFilter.type = 'bandpass'; this.scrapeFilter.frequency.value = 920; this.scrapeFilter.Q.value = 4.2;
        const sLfo = this.ctx.createOscillator(), sLg = this.ctx.createGain(); sLfo.frequency.value = 0.23; sLg.gain.value = 420; sLfo.connect(sLg); sLg.connect(this.scrapeFilter.frequency); sLfo.start();
        const scCar = this.ctx.createOscillator(); scCar.type = 'sawtooth'; scCar.frequency.value = 186;
        const smA = this.ctx.createOscillator(), smAg = this.ctx.createGain(); smA.type = 'sine'; smA.frequency.value = 73; smAg.gain.value = 210; smA.connect(smAg); smAg.connect(scCar.frequency);
        const smB = this.ctx.createOscillator(), smBg = this.ctx.createGain(); smB.type = 'triangle'; smB.frequency.value = 293; smBg.gain.value = 135; smB.connect(smBg); smBg.connect(scCar.frequency);
        scCar.connect(this.scrapeFilter); this.scrapeFilter.connect(this.scrapeGain); this.spatial(this.scrapeGain, 0, 0.55, 0);
        scCar.start(); smA.start(); smB.start();

        // 4. BGM Layer 3B: Proximity Radio Static
        this.staticGain = this.ctx.createGain(); this.staticGain.gain.value = 0;
        this.staticFilter = this.ctx.createBiquadFilter(); this.staticFilter.type = 'bandpass'; this.staticFilter.frequency.value = 1480; this.staticFilter.Q.value = 2.6;
        const stSrc = this.ctx.createBufferSource(); stSrc.buffer = this.whiteNoise; stSrc.loop = true;
        stSrc.connect(this.staticFilter); this.staticFilter.connect(this.staticGain); this.spatial(this.staticGain, 0, 0.25, 0); stSrc.start();

        // 5. Ambient Stigma Formant Whispers (Babak II, III, IV)
        this.whisperGain = this.ctx.createGain(); this.whisperGain.gain.value = 0;
        this.whisperPanner = this.panner(0);
        const whSrc = this.ctx.createBufferSource(); whSrc.buffer = this.noise; whSrc.loop = true;
        const wbLfo = this.ctx.createOscillator(), wbg = this.ctx.createGain(); wbLfo.frequency.value = 0.29; wbg.gain.value = 0.35;
        wbLfo.connect(wbg); wbg.connect(this.whisperGain.gain); wbLfo.start();
        [680, 1380, 2450].forEach((ff, idx) => {
          const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = 7.5 + idx;
          const fl = this.ctx.createOscillator(), fg = this.ctx.createGain(); fl.frequency.value = 0.16 + idx * 0.07; fg.gain.value = 110 + idx * 60;
          fl.connect(fg); fg.connect(bp.frequency); fl.start();
          const outG = this.ctx.createGain(); outG.gain.value = 0.45 / (idx + 1);
          whSrc.connect(bp); bp.connect(outG); outG.connect(this.whisperGain);
        });
        if (this.whisperPanner) {
          this.whisperGain.connect(this.whisperPanner); this.whisperPanner.connect(this.dryBus);
          const ww = this.ctx.createGain(); ww.gain.value = 0.65; this.whisperPanner.connect(ww); ww.connect(this.reverb);
        } else this.spatial(this.whisperGain, 0, 0.65, 0);
        whSrc.start();

        // 6. Calm Late-Afternoon Campus Ambient Pad (only heard when horrorBlend < 1)
        this.calmPadGain = this.ctx.createGain(); this.calmPadGain.gain.value = 0.055;
        const cFilt = this.ctx.createBiquadFilter(); cFilt.type = 'lowpass'; cFilt.frequency.value = 380;
        [130.81, 196.0, 261.63].forEach((f, idx) => {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine'; o.frequency.value = f; g.gain.value = 0.28 / (idx + 1);
          o.connect(g); g.connect(cFilt); o.start();
        });
        const brSrc = this.ctx.createBufferSource(); brSrc.buffer = this.noise; brSrc.loop = true;
        const brLp = this.ctx.createBiquadFilter(); brLp.type = 'bandpass'; brLp.frequency.value = 340; brLp.Q.value = 1.1;
        const brG = this.ctx.createGain(); brG.gain.value = 0.12;
        brSrc.connect(brLp); brLp.connect(brG); brG.connect(cFilt); cFilt.connect(this.calmPadGain);
        this.spatial(this.calmPadGain, 0, 0.25, 0); brSrc.start();

        // 7. Player Stress Breathing Layer (Part 4: activates below 75% stability)
        this.breathGain = this.ctx.createGain(); this.breathGain.gain.value = 0;
        this.breathFilter = this.ctx.createBiquadFilter(); this.breathFilter.type = 'bandpass'; this.breathFilter.frequency.value = 440; this.breathFilter.Q.value = 2.4;
        const bSrc = this.ctx.createBufferSource(); bSrc.buffer = this.noise; bSrc.loop = true;
        bSrc.connect(this.breathFilter); this.breathFilter.connect(this.breathGain);
        this.spatial(this.breathGain, 0, 0.14, 0); bSrc.start();
      }
      setMuted(m) { this.muted = m; if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.78, this.ctx.currentTime, 0.05); }
      tone(freq, dur, vol, type = 'triangle', startOffset = 0, pan = 0, revMix = 0.35, echoMix = 0) {
        if (!this.ctx || !this.dryBus || this.muted) return;
        const t = this.ctx.currentTime + startOffset;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g); this.spatial(g, pan, revMix, echoMix); o.start(t); o.stop(t + dur + 0.05);
      }
      playBgmNote(freq, detune, vol, pan) {
        if (!this.ctx || !this.dryBus || this.muted) return;
        const now = this.ctx.currentTime;
        const o1 = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(), o3 = this.ctx.createOscillator();
        const lp = this.ctx.createBiquadFilter(), g = this.ctx.createGain(), bg = this.ctx.createGain();
        o1.type = 'triangle'; o1.frequency.value = freq; o1.detune.value = detune;
        o2.type = 'sine'; o2.frequency.value = freq * 2; o2.detune.value = detune * 1.2;
        o3.type = 'sine'; o3.frequency.value = freq * 0.5; o3.detune.value = detune * 0.4;
        bg.gain.setValueAtTime(0.32, now); bg.gain.exponentialRampToValueAtTime(0.02, now + 0.65);
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(2200, now); lp.frequency.exponentialRampToValueAtTime(480, now + 1.8);
        g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(vol, now + 0.014); g.gain.exponentialRampToValueAtTime(0.0008, now + 2.35);
        o1.connect(lp); o3.connect(lp); o2.connect(bg); bg.connect(lp); lp.connect(g);
        this.spatial(g, pan, 0.58, 0.42);
        o1.start(now); o2.start(now); o3.start(now); o1.stop(now + 2.4); o2.stop(now + 2.4); o3.stop(now + 2.4);
      }
      noiseBurst(freq, q, dur, vol, filterType = 'bandpass', pan = 0, revMix = 0.3) {
        if (!this.ctx || !this.dryBus || !this.noise || this.muted) return;
        const t = this.ctx.currentTime;
        const s = this.ctx.createBufferSource(); s.buffer = this.noise;
        const f = this.ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
        const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        s.connect(f); f.connect(g); this.spatial(g, pan, revMix, 0); s.start(t, Math.random() * 0.8, dur + 0.02);
      }
      lanternPulse() {
        if (!this.ctx || !this.dryBus || this.muted) return;
        const now = this.ctx.currentTime;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(440, now); o.frequency.exponentialRampToValueAtTime(110, now + 0.78);
        g.gain.setValueAtTime(0.24, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        o.connect(g); this.spatial(g, 0, 0.62, 0.2); o.start(now); o.stop(now + 0.95);
      }
      chainRattle() {
        if (!this.ctx || !this.dryBus || !this.noise || this.muted) return;
        const now = this.ctx.currentTime;
        for (let i = 0; i < 4; i++) {
          const t = now + i * 0.085, pan = (Math.random() - 0.5) * 0.9;
          const car = this.ctx.createOscillator(), mod = this.ctx.createOscillator(), mg = this.ctx.createGain();
          const hp = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
          car.type = 'square'; car.frequency.value = 1520 + i * 280;
          mod.type = 'sine'; mod.frequency.value = 537 + i * 70; mg.gain.value = 920;
          hp.type = 'highpass'; hp.frequency.value = 1800;
          g.gain.setValueAtTime(0.001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          mod.connect(mg); mg.connect(car.frequency); car.connect(hp); hp.connect(g);
          this.spatial(g, pan, 0.65, 0.12);
          car.start(t); mod.start(t); car.stop(t + 0.18); mod.stop(t + 0.18);
          this.noiseBurst(2400, 1.5, 0.11, 0.14, 'highpass', pan, 0.55);
        }
      }
      jumpscareShriek() {
        if (!this.ctx || !this.dryBus || !this.whiteNoise || this.muted) return;
        const now = this.ctx.currentTime;
        const sub = this.ctx.createOscillator(), sg = this.ctx.createGain();
        sub.type = 'sine'; sub.frequency.setValueAtTime(58, now); sub.frequency.exponentialRampToValueAtTime(35, now + 0.18); sub.frequency.exponentialRampToValueAtTime(26, now + 0.85);
        sg.gain.setValueAtTime(0.68, now); sg.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
        sub.connect(sg); sg.connect(this.dryBus); sub.start(now); sub.stop(now + 1.0);

        const car = this.ctx.createOscillator(), mod = this.ctx.createOscillator(), mg = this.ctx.createGain();
        const sh = this.ctx.createWaveShaper(), scG = this.ctx.createGain();
        car.type = 'sawtooth'; car.frequency.setValueAtTime(720, now); car.frequency.linearRampToValueAtTime(1520, now + 0.14); car.frequency.exponentialRampToValueAtTime(520, now + 1.15);
        mod.type = 'sine'; mod.frequency.setValueAtTime(237, now); mod.frequency.linearRampToValueAtTime(389, now + 0.32);
        mg.gain.setValueAtTime(950, now); mg.gain.exponentialRampToValueAtTime(280, now + 1.15);
        if (this.distCurve) sh.curve = this.distCurve;
        scG.gain.setValueAtTime(0.28, now); scG.gain.exponentialRampToValueAtTime(0.001, now + 1.18);
        mod.connect(mg); mg.connect(car.frequency); car.connect(sh); sh.connect(scG);
        this.spatial(scG, 0, 0.52, 0.18);
        car.start(now); mod.start(now); car.stop(now + 1.2); mod.stop(now + 1.2);

        const st = this.ctx.createBufferSource(); st.buffer = this.whiteNoise;
        const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(2300, now); bp.frequency.linearRampToValueAtTime(1450, now + 1.18); bp.Q.value = 1.15;
        const nSh = this.ctx.createWaveShaper(); if (this.distCurve) nSh.curve = this.distCurve;
        const ng = this.ctx.createGain(); ng.gain.setValueAtTime(0.46, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        st.connect(bp); bp.connect(nSh); nSh.connect(ng); this.spatial(ng, 0, 0.38, 0); st.start(now, 0, 1.22);
      }
      glassShatter() {
        if (!this.ctx || !this.dryBus || !this.whiteNoise || this.muted) return;
        const now = this.ctx.currentTime;
        const bm = this.ctx.createOscillator(), bg = this.ctx.createGain();
        bm.type = 'sawtooth'; bm.frequency.setValueAtTime(92, now); bm.frequency.exponentialRampToValueAtTime(28, now + 0.65);
        bg.gain.setValueAtTime(0.28, now); bg.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
        bm.connect(bg); this.spatial(bg, 0, 0.52, 0); bm.start(now); bm.stop(now + 0.75);

        const src = this.ctx.createBufferSource(); src.buffer = this.whiteNoise;
        const hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
        const ng = this.ctx.createGain(); ng.gain.setValueAtTime(0.36, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        src.connect(hp); hp.connect(ng); this.spatial(ng, 0, 0.64, 0); src.start(now, 0, 0.9);

        [2450, 3180, 3820, 4650, 2890, 5120].forEach((f, i) => {
          this.tone(f, 0.21, 0.15, i % 2 === 0 ? 'triangle' : 'sine', i * 0.042, (i % 2 === 0 ? -1 : 1) * (0.2 + i * 0.1), 0.65, 0.12);
        });
      }
      metalBang() {
        this.tone(150, 0.35, 0.38, 'triangle', 0, 0.2, 0.65, 0);
        this.noiseBurst(1480, 3.5, 0.28, 0.32, 'bandpass', -0.2, 0.6);
      }
      notifGlitch() {
        if (!this.ctx || !this.dryBus || this.muted) return;
        const now = this.ctx.currentTime;
        [1318.5, 1760, 1244.5, 2193].forEach((f, i) => {
          const t = now + i * 0.055;
          const o = this.ctx.createOscillator(), m = this.ctx.createOscillator(), mg = this.ctx.createGain();
          const sh = this.ctx.createWaveShaper(), g = this.ctx.createGain();
          o.type = 'square'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * (i % 2 === 0 ? 0.84 : 1.14), t + 0.11);
          m.type = 'sawtooth'; m.frequency.value = 95 + i * 37; mg.gain.value = 260;
          if (this.distCurve) sh.curve = this.distCurve;
          g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          m.connect(mg); mg.connect(o.frequency); o.connect(sh); sh.connect(g);
          this.spatial(g, (i % 2 === 0 ? -1 : 1) * 0.4, 0.5, 0.32);
          o.start(t); m.start(t); o.stop(t + 0.18); m.stop(t + 0.18);
        });
      }
      electricBuzz() { this.tone(100, 0.14, 0.032, 'sawtooth', 0, (Math.random() - 0.5) * 0.8, 0.45, 0); }
      finalChord() { [220, 261.63, 329.63, 440].forEach((f, i) => this.tone(f, 3.4, 0.11, 'triangle', i * 0.18, (i - 1.5) * 0.24, 0.78, 0.35)); }
      heartBeat(vol) {
        if (!this.ctx || !this.dryBus) return;
        const now = this.ctx.currentTime;
        [[0, 68, vol], [0.16, 54, vol * 0.7]].forEach(([off, p, a]) => {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine'; o.frequency.setValueAtTime(p, now + off); o.frequency.exponentialRampToValueAtTime(28, now + off + 0.12);
          g.gain.setValueAtTime(0.001, now + off); g.gain.exponentialRampToValueAtTime(a, now + off + 0.016); g.gain.exponentialRampToValueAtTime(0.001, now + off + 0.15);
          o.connect(g); g.connect(this.dryBus); o.start(now + off); o.stop(now + off + 0.17);
        });
      }
      apparitionShift(pan = 0) {
        if (!this.ctx || !this.dryBus || !this.noise || this.muted) return;
        const now = this.ctx.currentTime;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(105, now); o.frequency.exponentialRampToValueAtTime(34, now + 0.45);
        g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(0.12, now + 0.04); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        o.connect(g); this.spatial(g, pan, 0.72, 0.25); o.start(now); o.stop(now + 0.52);

        const s = this.ctx.createBufferSource(); s.buffer = this.noise;
        const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(980, now); bp.frequency.exponentialRampToValueAtTime(320, now + 0.45); bp.Q.value = 4.2;
        const ng = this.ctx.createGain(); ng.gain.setValueAtTime(0.08, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.46);
        s.connect(bp); bp.connect(ng); this.spatial(ng, -pan * 0.7, 0.68, 0.18); s.start(now, Math.random() * 0.5, 0.48);
      }
      update(dt, frost, threat, hiding, moving, sprint, surface, layer = 0, inPlay = false, horrorBlend = 1, healthRatio = 1) {
        if (!this.ctx || !this.ready) return;
        const now = this.ctx.currentTime;
        const hMix = Math.max(0, Math.min(1, horrorBlend));
        const hSafe = Math.max(0, Math.min(1, healthRatio));
        const dmgSev = hMix > 0.35 ? 1 - hSafe : 0;
        const danger = Math.max(0, Math.min(1, 1 - (threat - 2) / 13));

        if (this.calmPadGain) {
          this.calmPadGain.gain.setTargetAtTime(Math.max(0, 1 - hMix * 1.15) * 0.068, now, 0.25);
        }
        if (this.windGain) {
          this.windGain.gain.setTargetAtTime((hiding ? 0.065 : 0.11 + frost * 0.14) * hMix, now, 0.25);
          this.windFilterA.frequency.setTargetAtTime(hiding ? 185 : 230 + frost * 170, now, 0.25);
          this.windFilterB.frequency.setTargetAtTime(hiding ? 410 : 560 + frost * 320, now, 0.25);
        }
        if (this.droneGain) {
          const hDrone = dmgSev > 0.2 ? dmgSev * 0.065 : 0;
          this.droneGain.gain.setTargetAtTime((hiding ? 0.045 + danger * 0.03 : 0.068 + danger * 0.095 + hDrone) * hMix, now, 0.22);
          this.droneFilter.frequency.setTargetAtTime(165 + danger * 220 + dmgSev * 125, now, 0.22);
        }
        if (this.scrapeGain) {
          this.scrapeGain.gain.setTargetAtTime(danger > 0.12 ? (danger - 0.12) * (hiding ? 0.03 : 0.095) * hMix : 0, now, 0.18);
          this.scrapeFilter.frequency.setTargetAtTime(750 + danger * 900, now, 0.2);
        }
        if (this.staticGain) {
          const stThr = Math.max(danger, dmgSev >= 0.75 ? 0.34 : 0);
          this.staticGain.gain.setTargetAtTime(stThr > 0.16 ? (stThr - 0.16) * (hiding ? 0.025 : 0.085) * hMix : 0, now, 0.16);
          this.staticFilter.frequency.setTargetAtTime(1250 + stThr * 1050, now, 0.16);
        }
        if (this.whisperGain) {
          const wOn = inPlay && layer >= 1 && hMix > 0.55;
          this.whisperGain.gain.setTargetAtTime(wOn ? (hiding ? 0.02 : 0.055 + danger * 0.04) * hMix : 0, now, 0.35);
          if (wOn && this.whisperPanner) {
            this.wPanTimer -= dt;
            if (this.wPanTimer <= 0) { this.wPanTimer = 1.6 + Math.random() * 2.2; this.whisperPanner.pan.setTargetAtTime((Math.random() - 0.5) * 1.68, now, 0.65); }
          }
        }
        if (this.breathGain && this.breathFilter) {
          if (inPlay && hMix > 0.45 && hSafe < 0.75) {
            const rate = hSafe < 0.25 ? 0.62 : hSafe < 0.5 ? 0.42 : 0.28;
            this.breathPhase += dt * rate * Math.PI * 2;
            const cyc = Math.max(0, Math.sin(this.breathPhase));
            const amp = hSafe < 0.25 ? 0.115 : hSafe < 0.5 ? 0.068 : 0.032;
            this.breathGain.gain.setTargetAtTime(amp * (0.25 + cyc * 0.75), now, 0.08);
            this.breathFilter.frequency.setTargetAtTime(360 + cyc * 210, now, 0.08);
          } else {
            this.breathGain.gain.setTargetAtTime(0, now, 0.18);
          }
        }
        if (inPlay && hMix > 0.5 && !this.muted) {
          this.creakTimer -= dt;
          if (this.creakTimer <= 0) {
            this.creakTimer = 7.5 + Math.random() * 9.0;
            this.tone(160 + Math.random() * 90, 0.48, 0.024, 'sawtooth', 0, (Math.random() > 0.5 ? 1 : -1) * 0.72, 0.72, 0);
          }
        }
        if (!this.muted && hMix > 0.35) {
          this.bgmTimer -= dt;
          if (this.bgmTimer <= 0) {
            this.bgmTimer = danger > 0.5 || dmgSev >= 0.75 ? 0.58 : 0.72;
            const n = this.notes[this.bgmStep++ % this.notes.length];
            if (n) this.playBgmNote(n, -12 + Math.random() * 27, (danger > 0.55 ? 0.052 : 0.082) * hMix, Math.sin(this.bgmStep * 0.7) * 0.42);
          }
        }
        if (inPlay && moving && !hiding) {
          this.stepTimer -= dt;
          if (this.stepTimer <= 0) {
            this.stepTimer = sprint ? 0.31 : 0.48;
            this.stepPan *= -1;
            const p = this.stepPan * 0.18;
            this.noiseBurst(surface === 'wood' ? 430 : surface === 'tile' ? 1180 : 1720, surface === 'snow' ? 0.95 : 2.3, 0.11, sprint ? 0.2 : 0.12, 'bandpass', p, surface === 'tile' ? 0.45 : 0.26);
          }
        }
        const hDanger = hSafe < 0.25 ? 0.68 : hSafe < 0.5 ? 0.34 : 0;
        const hbDanger = Math.max(danger, hDanger);
        if (inPlay && hMix >= 0.35 && hbDanger > 0.08) {
          this.hbTimer -= dt;
          if (this.hbTimer <= 0) { this.hbTimer = 60 / (58 + hbDanger * (hiding ? 48 : 90)); this.heartBeat(0.13 + hbDanger * 0.28); }
        }
      }
      cue(kind) {
        if (kind === 'clock') [130.8, 196, 261.6, 311.13].forEach((f, i) => this.tone(f, 2.8, 0.14 / (i + 1), i === 0 ? 'triangle' : 'sine', 0, (i - 1.5) * 0.18, 0.72, 0.22));
        else if (kind === 'chime') [523.25, 659.25, 784, 1046.5].forEach((f, i) => this.tone(f, 0.85, 0.14, 'triangle', i * 0.09, (i - 1.5) * 0.25, 0.65, 0.35));
        else if (kind === 'door') { this.tone(95, 0.34, 0.34, 'sawtooth', 0, (Math.random() - 0.5) * 0.7, 0.62, 0); this.noiseBurst(680, 1.0, 0.24, 0.26, 'lowpass', 0, 0.58); }
        else if (kind === 'ice') this.glassShatter();
        else if (kind === 'whisper') this.noiseBurst(1600, 6.0, 0.7, 0.16, 'bandpass', (Math.random() > 0.5 ? 1 : -1) * 0.7, 0.7);
      }
    }
    const audio = new AudioSys();
    const unlockAudioFirst = () => audio.init();
    window.addEventListener('pointerdown', unlockAudioFirst, { once: true, capture: true });
    window.addEventListener('touchstart', unlockAudioFirst, { once: true, capture: true });
    window.addEventListener('keydown', unlockAudioFirst, { once: true, capture: true });

    // --- PROCEDURAL PBR CANVAS TEXTURES (COLOR + BUMP + ROUGHNESS) ---
    function makeTexPair(size, drawFn, repX = 1, repY = 1) {
      const cc = document.createElement('canvas'); cc.width = size; cc.height = size;
      const bc = document.createElement('canvas'); bc.width = size; bc.height = size;
      const rc = document.createElement('canvas'); rc.width = size; rc.height = size;
      drawFn(cc.getContext('2d'), bc.getContext('2d'), rc.getContext('2d'), size);
      const wrap = (cv, isCol) => {
        const t = new THREE.CanvasTexture(cv);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(repX, repY);
        t.colorSpace = isCol ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        return t;
      };
      return { map: wrap(cc, true), bump: wrap(bc, false), rough: wrap(rc, false) };
    }
    function makeSingleTex(w, h, drawFn, clamp = false) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      drawFn(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      return t;
    }

    const WOOD = makeTexPair(256, (c, b, r, s) => {
      c.fillStyle = '#251e1a'; c.fillRect(0, 0, s, s);
      b.fillStyle = '#909090'; b.fillRect(0, 0, s, s);
      r.fillStyle = '#888888'; r.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 32) {
        c.fillStyle = y % 64 === 0 ? '#312620' : '#211915'; c.fillRect(0, y, s, 30);
        c.fillStyle = '#0c0908'; c.fillRect(0, y + 30, s, 2);
        b.fillStyle = '#202020'; b.fillRect(0, y + 30, s, 2);
        for (let i = 0; i < 24; i++) {
          const rx = Math.random() * s, ry = y + Math.random() * 28, rw = 20 + Math.random() * 64, ice = i % 5 === 0;
          c.fillStyle = ice ? 'rgba(186,224,248,0.14)' : 'rgba(10,7,5,0.34)'; c.fillRect(rx, ry, rw, 1.5);
          b.fillStyle = ice ? '#d4d4d4' : '#555555'; b.fillRect(rx, ry, rw, 1.5);
          r.fillStyle = ice ? '#282828' : '#b8b8b8'; r.fillRect(rx, ry, rw, 3);
        }
      }
    }, 4, 4);

    const PLASTER = makeTexPair(256, (c, b, r, s) => {
      c.fillStyle = '#1b232f'; c.fillRect(0, 0, s, s);
      b.fillStyle = '#888888'; b.fillRect(0, 0, s, s);
      r.fillStyle = '#b0b0b0'; r.fillRect(0, 0, s, s);
      for (let i = 0; i < 180; i++) {
        const x = Math.random() * s, y = Math.random() * s, rad = 4 + Math.random() * 16;
        c.fillStyle = i % 3 === 0 ? 'rgba(11,16,23,0.35)' : 'rgba(130,155,178,0.08)';
        c.beginPath(); c.arc(x, y, rad, 0, Math.PI * 2); c.fill();
        b.fillStyle = i % 2 === 0 ? 'rgba(100,100,100,0.3)' : 'rgba(165,165,165,0.25)';
        b.beginPath(); b.arc(x, y, rad * 0.8, 0, Math.PI * 2); b.fill();
      }
    }, 3, 2);

    const TILE = makeTexPair(256, (c, b, r, s) => {
      c.fillStyle = '#182029'; c.fillRect(0, 0, s, s);
      b.fillStyle = '#303030'; b.fillRect(0, 0, s, s);
      r.fillStyle = '#888888'; r.fillRect(0, 0, s, s);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
        c.fillStyle = (x + y) % 2 === 0 ? '#27323f' : '#1b242e'; c.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
        b.fillStyle = '#a8a8a8'; b.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
        r.fillStyle = (x + y) % 2 === 0 ? '#505050' : '#686868'; r.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
      }
    }, 6, 6);

    const ICE = makeTexPair(256, (c, b, r, s) => {
      c.fillStyle = '#7db5d4'; c.fillRect(0, 0, s, s);
      b.fillStyle = '#808080'; b.fillRect(0, 0, s, s);
      r.fillStyle = '#2c2c2c'; r.fillRect(0, 0, s, s);
      for (let i = 0; i < 75; i++) {
        const x1 = Math.random() * s, y1 = Math.random() * s, x2 = x1 + (Math.random() - 0.5) * 90, y2 = y1 + (Math.random() - 0.5) * 90;
        c.strokeStyle = i % 2 === 0 ? 'rgba(235,248,255,0.48)' : 'rgba(20,62,96,0.36)'; c.lineWidth = 1.4;
        b.strokeStyle = i % 2 === 0 ? '#e8e8e8' : '#252525'; b.lineWidth = 1.5;
        r.strokeStyle = i % 2 === 0 ? '#909090' : '#1a1a1a'; r.lineWidth = 2;
        [c, b, r].forEach(ctx => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
      }
    }, 2, 2);

    const FABRIC = makeTexPair(128, (c, b, r, s) => {
      c.fillStyle = '#d4dce6'; c.fillRect(0, 0, s, s);
      b.fillStyle = '#707070'; b.fillRect(0, 0, s, s);
      r.fillStyle = '#c8c8c8'; r.fillRect(0, 0, s, s);
      for (let i = 0; i < s; i += 3) {
        c.fillStyle = 'rgba(15,23,42,0.14)'; c.fillRect(0, i, s, 1); c.fillRect(i, 0, 1, s);
        b.fillStyle = i % 6 === 0 ? '#b8b8b8' : '#404040'; b.fillRect(0, i, s, 1); b.fillRect(i, 0, 1, s);
      }
    }, 4, 4);

    const SHADOW_TEX = makeTexPair(256, (c, b, r, s) => {
      c.fillStyle = '#06080e'; c.fillRect(0, 0, s, s);
      b.fillStyle = '#606060'; b.fillRect(0, 0, s, s);
      r.fillStyle = '#b0b0b0'; r.fillRect(0, 0, s, s);
      for (let i = 0; i < 36; i++) {
        let x = Math.random() * s, y = Math.random() * s;
        c.strokeStyle = i % 3 === 0 ? 'rgba(185,28,28,0.42)' : 'rgba(100,145,175,0.22)'; c.lineWidth = 1.5;
        b.strokeStyle = '#101010'; b.lineWidth = 2.6;
        c.beginPath(); b.beginPath(); c.moveTo(x, y); b.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (Math.random() - 0.5) * 48; y += (Math.random() - 0.5) * 48; c.lineTo(x, y); b.lineTo(x, y); }
        c.stroke(); b.stroke();
      }
    }, 2, 2);

    const TEX = {
      mask: makeSingleTex(256, 256, (c) => {
        c.fillStyle = '#dde2e8'; c.fillRect(0, 0, 256, 256);
        const rim = c.createRadialGradient(128, 124, 54, 128, 128, 148);
        rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(6,10,18,0.44)');
        c.fillStyle = rim; c.fillRect(0, 0, 256, 256);
        c.fillStyle = '#030508';
        c.beginPath(); c.ellipse(90, 110, 22, 16, -0.14, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(166, 110, 22, 16, 0.14, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#1e293b'; c.lineWidth = 2.4;
        [[40,20,96,84,88,128,118,180],[210,35,165,92,182,145,148,210],[128,140,134,195,122,240],[90,126,74,158,82,196],[166,126,184,154,174,192]].forEach(p => {
          c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i+1]); c.stroke();
        });
      }, true),
      snow: makeSingleTex(64, 64, (c) => {
        const g = c.createRadialGradient(32, 32, 2, 32, 32, 30);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      }, true),
      dust: makeSingleTex(32, 32, (c) => {
        const g = c.createRadialGradient(16, 16, 1, 16, 16, 14);
        g.addColorStop(0, 'rgba(255,244,214,0.95)'); g.addColorStop(1, 'rgba(186,214,235,0)');
        c.fillStyle = g; c.fillRect(0, 0, 32, 32);
      }, true),
      bkSign: makeSingleTex(512, 192, (c) => {
        c.fillStyle = '#141920'; c.fillRect(0, 0, 512, 192);
        c.strokeStyle = '#94a3b8'; c.lineWidth = 6; c.strokeRect(8, 8, 496, 176);
        c.fillStyle = '#e2e8f0'; c.font = 'bold 34px Georgia'; c.textAlign = 'center'; c.fillText('RUANG BK', 256, 76);
        c.fillStyle = '#fca5a5'; c.font = 'bold 24px Courier New'; c.fillText('"TAKUT DIHAKIMI"', 256, 134);
      }, true),
      bulletin: makeSingleTex(512, 256, (c) => {
        c.fillStyle = '#3b2b20'; c.fillRect(0, 0, 512, 256);
        [[24,20,'PENGUMUMAN'],[175,32,'RUANG AMAN?'],[336,24,'JANGAN BUNGKAM']].forEach(([x,y,txt]) => {
          c.fillStyle = '#cbd5e1'; c.fillRect(x, y, 135, 160);
          c.fillStyle = '#0f172a'; c.font = 'bold 14px Courier New'; c.fillText(txt, x + 10, y + 32);
        });
      }, true),
      clock: makeSingleTex(256, 256, (c) => {
        c.fillStyle = '#e2e8f0'; c.beginPath(); c.arc(128, 128, 120, 0, Math.PI * 2); c.fill();
        c.strokeStyle = '#0f172a'; c.lineWidth = 8; c.stroke();
      }, true),
      kbgo: makeSingleTex(512, 320, (c) => {
        c.fillStyle = '#0d0914'; c.fillRect(0, 0, 512, 320);
        c.strokeStyle = '#9b6eaf'; c.lineWidth = 5; c.strokeRect(18, 18, 476, 284);
        c.fillStyle = '#f1f5f9'; c.font = 'bold 26px Courier New'; c.fillText('KIRIM PAP SEKARANG', 95, 118);
        c.fillStyle = '#fca5a5'; c.font = 'bold 16px Courier New'; c.fillText('[!] REKAYASA FOTO AI / PEMAKSAAN', 95, 194);
      }, true),
      glitchFace: makeSingleTex(512, 320, (c) => {
        c.fillStyle = '#160409'; c.fillRect(0, 0, 512, 320);
        c.strokeStyle = '#dc2626'; c.lineWidth = 6; c.strokeRect(14, 14, 484, 292);
        c.fillStyle = '#e2e8f0'; c.beginPath(); c.ellipse(256, 142, 76, 98, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#020617'; c.beginPath(); c.ellipse(222, 126, 18, 13, -0.15, 0, Math.PI * 2); c.ellipse(290, 126, 18, 13, 0.15, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#dc2626'; c.fillRect(216, 124, 12, 4); c.fillRect(284, 124, 12, 4);
        c.fillStyle = '#e2e8f0'; c.font = 'bold 24px Courier New'; c.textAlign = 'center'; c.fillText('SUDAH TERSEBAR', 256, 282);
      }, true),
      cityFacade: makeSingleTex(128, 128, (c) => {
        c.fillStyle = '#adb8c4'; c.fillRect(0, 0, 128, 128);
        c.fillStyle = '#8b97a5';
        for (let y = 0; y < 128; y += 32) c.fillRect(0, y, 128, 2);
        for (let r = 0; r < 6; r++) for (let col = 0; col < 5; col++) {
          c.fillStyle = (r * 7 + col * 11) % 9 === 0 ? '#5c6c7c' : '#2f3d4d';
          c.fillRect(8 + col * 24, 6 + r * 20, 14, 12);
        }
      }, false, 2, 2),
      cityEmissive: makeSingleTex(128, 128, (c) => {
        c.fillStyle = '#000000'; c.fillRect(0, 0, 128, 128);
        for (let r = 0; r < 6; r++) for (let col = 0; col < 5; col++) {
          const h = (r * 13 + col * 19) % 11;
          if (h === 2 || h === 7) {
            c.fillStyle = h === 2 ? '#e2a84b' : '#7dd3fc';
            c.fillRect(8 + col * 24, 6 + r * 20, 14, 12);
          }
        }
      }, false, 2, 2),
    };

    // --- THREE.JS SETUP WITH SHADOWS & DUST MOTES ---
    const wrap = document.getElementById('gl-wrap');
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x88a4be);
    const fog = new THREE.FogExp2(0xa9bac6, 0.0042);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.08, 320);
    scene.add(camera);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x5c5346, 0.92);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffe5b8, 1.1);
    dirLight.position.set(8, 16, 10);
    scene.add(dirLight);

    const flashlight = new THREE.SpotLight(0xfef3c7, 5.6, 26, Math.PI / 4.8, 0.55, 1.5);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.set(1024, 1024);
    flashlight.shadow.bias = -0.0005;
    const flTarget = new THREE.Object3D(); flTarget.position.set(0, -0.08, -10);
    camera.add(flashlight); camera.add(flTarget); flashlight.target = flTarget;

    const lanternLight = new THREE.PointLight(0xd4a353, 0, 22, 1.5);
    scene.add(lanternLight);

    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(700 * 3);
    for (let i = 0; i < 700; i++) {
      snowPos[i * 3] = (Math.random() - 0.5) * 48; snowPos[i * 3 + 1] = Math.random() * 11.5; snowPos[i * 3 + 2] = (Math.random() - 0.5) * 48;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({ color: 0xe0f2fe, map: TEX.snow, size: 0.16, transparent: true, opacity: 0, depthWrite: false });
    const snowPoints = new THREE.Points(snowGeo, snowMat);
    snowPoints.visible = false;
    scene.add(snowPoints);

    const dustCount = 2400;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustBase = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustBase[i * 3] = (Math.random() - 0.5) * 20;
      dustBase[i * 3 + 1] = 0.25 + Math.random() * 3.1;
      dustBase[i * 3 + 2] = (Math.random() - 0.5) * 20;
      dustPos[i * 3] = dustBase[i * 3]; dustPos[i * 3 + 1] = dustBase[i * 3 + 1]; dustPos[i * 3 + 2] = dustBase[i * 3 + 2];
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustPoints = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: 0xfef3c7, map: TEX.dust, size: 0.052, transparent: true, opacity: 0.36, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(dustPoints);

    // --- SCULPTED ANATOMICAL CHARACTERS MATCHING REFERENCE SHEETS ---
    function makeSculptHead(gaunt = 0) {
      const geo = new THREE.SphereGeometry(0.114, 24, 20);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i) * 0.88, y = p.getY(i) * 1.1, z = p.getZ(i);
        if (y < 0) {
          const jt = Math.min(1, Math.abs(y) / 0.125);
          x *= 1 - jt * (0.28 + gaunt * 0.14);
          z = z > 0 ? z + Math.max(0, 0.014 * (1 - Math.abs(x) / 0.08)) * (1 - jt * 0.35) : z * (1 - jt * 0.25);
        }
        if (z > 0.02 && y > -0.045 && y < 0.03) {
          const cm = Math.exp(-Math.pow((Math.abs(x) - 0.056) / 0.025, 2));
          z += y > -0.005 ? cm * (0.008 + gaunt * 0.007) : -cm * (0.004 + gaunt * 0.016);
        }
        if (z > 0.065 && y > -0.002 && y < 0.036) {
          const em = Math.exp(-Math.pow((Math.abs(x) - 0.036) / 0.018, 2)) * Math.exp(-Math.pow((y - 0.016) / 0.014, 2));
          z -= em * (0.012 + gaunt * 0.012);
        }
        if (z < -0.02 && y > 0) z -= 0.01;
        p.setXYZ(i, x, y, z);
      }
      geo.computeVertexNormals();
      return geo;
    }

    function createPerson(opts) {
      const root = new THREE.Group();
      const clothStrands = [];
      const isRindi = opts.role === 'rindi';
      const isBima = opts.role === 'bima';
      const bodyRoot = new THREE.Group();
      bodyRoot.scale.setScalar(isRindi ? 0.94 : 1.0);
      root.add(bodyRoot);

      const skinMat = new THREE.MeshStandardMaterial({ color: opts.skin, roughness: 0.56 });
      const coatMat = new THREE.MeshStandardMaterial({ color: opts.coat, map: FABRIC.map, bumpMap: FABRIC.bump, bumpScale: 0.012, roughnessMap: FABRIC.rough, roughness: 0.84 });
      const shirtMat = new THREE.MeshStandardMaterial({ color: 0xedf1f6, map: FABRIC.map, roughness: 0.72 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: opts.pants || 0x181b20, map: FABRIC.map, bumpMap: FABRIC.bump, bumpScale: 0.012, roughness: 0.85 });
      const hairMat = new THREE.MeshStandardMaterial({ color: opts.hair || 0x151414, roughness: 0.5 });
      const metalMat = new THREE.MeshStandardMaterial({ color: 0xc8d2de, roughness: 0.28, metalness: 0.85 });

      const hips = new THREE.Group(); hips.position.y = 0.9; bodyRoot.add(hips);
      const pelvis = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.124, -0.07), new THREE.Vector2(0.146, 0), new THREE.Vector2(0.132, 0.085)], 24), pantsMat);
      pelvis.scale.set(isRindi ? 0.98 : 0.96, 1, 0.76); pelvis.castShadow = true; hips.add(pelvis);

      if (opts.mannequin && opts.skirt) {
        const sk = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.14, 0.05), new THREE.Vector2(0.2, -0.14), new THREE.Vector2(0.24, -0.35)], 22), pantsMat);
        sk.castShadow = true; hips.add(sk);
      }

      const torso = new THREE.Group(); torso.position.y = 0.08; hips.add(torso);
      const chest = new THREE.Mesh(new THREE.LatheGeometry(
        isRindi
          ? [new THREE.Vector2(0.114, 0), new THREE.Vector2(0.106, 0.14), new THREE.Vector2(0.136, 0.29), new THREE.Vector2(0.138, 0.39), new THREE.Vector2(0.088, 0.45)]
          : [new THREE.Vector2(0.124, -0.02), new THREE.Vector2(0.122, 0.14), new THREE.Vector2(0.156, 0.31), new THREE.Vector2(0.162, 0.41), new THREE.Vector2(0.1, 0.47)],
        26), shirtMat);
      chest.scale.set(1.04, 1, 0.78); chest.castShadow = true; torso.add(chest);

      const openGap = isRindi ? 0.56 : 0.6;
      const jacket = new THREE.Mesh(new THREE.LatheGeometry(
        isRindi
          ? [new THREE.Vector2(0.132, -0.04), new THREE.Vector2(0.13, 0.12), new THREE.Vector2(0.154, 0.29), new THREE.Vector2(0.156, 0.4), new THREE.Vector2(0.104, 0.46)]
          : [new THREE.Vector2(0.134, 0.01), new THREE.Vector2(0.134, 0.14), new THREE.Vector2(0.168, 0.31), new THREE.Vector2(0.174, 0.42), new THREE.Vector2(0.11, 0.475)],
        26, openGap, Math.PI * 2 - openGap * 2), coatMat);
      jacket.scale.set(1.05, 1, 0.8); jacket.castShadow = true; torso.add(jacket);

      [-1, 1].forEach(s => {
        const fold = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.39, 4, 8), coatMat);
        fold.position.set(s * 0.056, 0.21, 0.108); fold.rotation.z = s * -0.05; torso.add(fold);
      });

      if (isBima) {
        const crestC = document.createElement('canvas'); crestC.width = 64; crestC.height = 64;
        const cc = crestC.getContext('2d');
        cc.strokeStyle = 'rgba(226,232,240,0.92)'; cc.lineWidth = 3; cc.beginPath(); cc.arc(32, 24, 13, 0, Math.PI * 2); cc.stroke();
        cc.fillStyle = 'rgba(226,232,240,0.92)'; cc.font = 'bold 9px sans-serif'; cc.textAlign = 'center'; cc.fillText('UNIVERSITAS', 32, 50);
        const crest = new THREE.Mesh(new THREE.PlaneGeometry(0.052, 0.052), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(crestC), transparent: true, roughness: 0.7 }));
        crest.position.set(0.095, 0.315, 0.118); crest.rotation.y = 0.52; torso.add(crest);
      }

      const shoulders = new THREE.Group(); shoulders.position.y = 0.42; torso.add(shoulders);
      if (isRindi) {
        const hood = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.075, 0.02, 0.06), new THREE.Vector3(-0.105, 0.04, -0.02), new THREE.Vector3(0, 0.055, -0.095),
          new THREE.Vector3(0.105, 0.04, -0.02), new THREE.Vector3(0.075, 0.02, 0.06)
        ]), 14, 0.036, 8, false), coatMat);
        shoulders.add(hood);
        const toteM = new THREE.MeshStandardMaterial({ color: 0xd8d2c5, map: FABRIC.map, roughness: 0.85 });
        const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.115, 0.045, 0.04), new THREE.Vector3(0.145, -0.06, 0.07), new THREE.Vector3(0.175, -0.24, 0.02),
          new THREE.Vector3(0.175, -0.27, -0.07), new THREE.Vector3(0.14, -0.04, -0.07), new THREE.Vector3(0.108, 0.045, -0.01)
        ]), 14, 0.011, 6, false), toteM);
        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.25, 0.21), toteM);
        bag.scale.set(0.84, 1, 1); bag.position.set(0.18, -0.38, -0.03); bag.rotation.z = 0.08;
        shoulders.add(strap, bag);
      } else if (isBima) {
        [-1, 1].forEach(s => {
          const cf = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.052, 0.018), coatMat);
          cf.position.set(s * 0.062, 0.036, 0.055); cf.rotation.set(0.55, s * -0.45, s * -0.22); shoulders.add(cf);
        });
        if (opts.backpack) {
          const pm = new THREE.MeshStandardMaterial({ color: 0x16181d, map: FABRIC.map, roughness: 0.76 });
          const pk = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.16, 6, 14), pm);
          pk.scale.set(1.1, 1.05, 0.62); pk.position.set(0, 0.22, -0.175); torso.add(pk);
          [-1, 1].forEach(s => {
            const st = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
              new THREE.Vector3(s * 0.09, -0.02, -0.11), new THREE.Vector3(s * 0.115, 0.05, 0.01),
              new THREE.Vector3(s * 0.11, -0.08, 0.11), new THREE.Vector3(s * 0.135, -0.28, 0.06)
            ]), 12, 0.014, 6, false), pm);
            shoulders.add(st);
          });
        }
      }

      const head = new THREE.Group(); head.position.y = 0.055; shoulders.add(head);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(isRindi ? 0.041 : 0.048, isRindi ? 0.048 : 0.055, 0.105, 16), skinMat);
      neck.position.y = 0.038; head.add(neck);
      const cranium = new THREE.Mesh(makeSculptHead(0), skinMat);
      cranium.position.y = 0.175; cranium.castShadow = true; head.add(cranium);

      let leftEyelid = null, rightEyelid = null;
      if (!opts.mannequin) {
        const nose = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.032, 4, 8), skinMat);
        nose.rotation.x = -0.34; nose.position.set(0, 0.168, 0.106); head.add(nose);
        const lipM = new THREE.MeshStandardMaterial({ color: isRindi ? 0xa36b6d : 0x93625c, roughness: 0.42 });
        const lips = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.026, 4, 8), lipM);
        lips.rotation.z = Math.PI / 2; lips.position.set(0, 0.115, 0.112); head.add(lips);
        const buildEye = (side) => {
          const eg = new THREE.Group(); eg.position.set(side * 0.035, 0.188, 0.092);
          const sc = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.14 })); sc.scale.set(1.1, 0.85, 0.72);
          const ir = new THREE.Mesh(new THREE.SphereGeometry(0.0078, 10, 8), new THREE.MeshStandardMaterial({ color: 0x241712, roughness: 0.08 })); ir.position.z = 0.0072;
          const gl = new THREE.Mesh(new THREE.SphereGeometry(0.0024, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); gl.position.set(0.0025, 0.0028, 0.014);
          const lid = new THREE.Mesh(new THREE.SphereGeometry(0.0155, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.56), skinMat);
          lid.rotation.x = -0.22; lid.scale.set(1.16, 0.24, 0.82); lid.position.set(0, 0.0035, 0.001);
          eg.add(sc, ir, gl, lid); head.add(eg); return lid;
        };
        leftEyelid = buildEye(-1); rightEyelid = buildEye(1);
      }

      const cap = new THREE.Mesh(new THREE.SphereGeometry(isBima ? 0.123 : 0.119, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
      cap.scale.set(isBima ? 0.98 : 0.94, 1.06, 1.02); cap.position.set(0, 0.19, -0.016); cap.rotation.x = -0.28; head.add(cap);
      if (isRindi) {
        for (let s = -3; s <= 3; s++) {
          const a = s * 0.28, rx = Math.sin(a) * 0.105, rz = -Math.cos(a) * 0.105 - 0.008;
          const lk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
            new THREE.Vector3(rx * 0.85, 0.24, rz * 0.85), new THREE.Vector3(rx * 1.12, 0.06, rz * 1.2), new THREE.Vector3(rx * 1.05, -0.19, rz * 1.1)
          ]), 10, 0.028, 6, false), hairMat);
          head.add(lk); clothStrands.push(lk);
        }
        [-1, 1].forEach(s => {
          const wisp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
            new THREE.Vector3(s * 0.015, 0.295, 0.04), new THREE.Vector3(s * 0.07, 0.23, 0.095), new THREE.Vector3(s * 0.085, 0.12, 0.085)
          ]), 8, 0.014, 6, false), hairMat);
          head.add(wisp); clothStrands.push(wisp);
        });
      } else if (isBima) {
        [-1, 1].forEach(s => {
          for (let k = 0; k < 2; k++) {
            const wv = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
              new THREE.Vector3(s * (0.01 + k * 0.022), 0.302, 0.048), new THREE.Vector3(s * (0.055 + k * 0.018), 0.265, 0.106), new THREE.Vector3(s * 0.095, 0.2, 0.05)
            ]), 8, 0.019, 6, false), hairMat);
            head.add(wv); clothStrands.push(wv);
          }
        });
      }

      const buildArm = (side) => {
        const p = new THREE.Group(); p.position.set(side * (isRindi ? 0.185 : 0.205), -0.015, 0);
        const u = new THREE.Mesh(new THREE.CylinderGeometry(isRindi ? 0.048 : 0.054, isRindi ? 0.042 : 0.048, 0.23, 14), coatMat); u.position.y = -0.115;
        const f = new THREE.Group(); f.position.y = -0.24; p.add(u, f);
        const ls = new THREE.Mesh(new THREE.CylinderGeometry(isRindi ? 0.041 : 0.046, isRindi ? 0.039 : 0.044, 0.14, 14), coatMat); ls.position.y = -0.075;
        const ba = new THREE.Mesh(new THREE.CylinderGeometry(isRindi ? 0.026 : 0.03, isRindi ? 0.022 : 0.025, 0.105, 12), skinMat); ba.position.y = -0.185;
        const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.032, 4, 8), skinMat); palm.scale.set(0.65, 1, 1.35); palm.position.y = -0.245;
        f.add(ls, ba, palm);
        if (isBima && side === 1) {
          const wt = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.016, 12), new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.35 }));
          wt.position.y = -0.215; f.add(wt);
        }
        shoulders.add(p); return { p, f };
      };
      const armL = buildArm(-1), armR = buildArm(1);

      const buildLeg = (side) => {
        const p = new THREE.Group(); p.position.set(side * (isRindi ? 0.088 : 0.094), -0.02, 0);
        const th = new THREE.Mesh(new THREE.CylinderGeometry(0.075, isRindi ? 0.068 : 0.062, 0.41, 16), pantsMat); th.position.y = -0.205; p.add(th);
        if (isBima) {
          const pk = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.135, 0.105), pantsMat); pk.position.set(side * 0.066, -0.23, 0); p.add(pk);
        }
        const kn = new THREE.Group(); kn.position.y = -0.41; p.add(kn);
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(isRindi ? 0.067 : 0.061, isRindi ? 0.074 : 0.056, 0.39, 16), pantsMat); sh.position.y = -0.195;
        const shoeM = new THREE.MeshStandardMaterial({ color: isRindi ? 0xd8dde4 : 0xd4d8df, roughness: 0.58 });
        const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.11, 6, 12), shoeM);
        shoe.rotation.x = Math.PI / 2; shoe.scale.set(1.02, 1.02, 0.72); shoe.position.set(0, -0.44, 0.032);
        kn.add(sh, shoe); hips.add(p); return { p, kn };
      };
      const legL = buildLeg(-1), legR = buildLeg(1);

      return { root, hips, torso, chest, shoulders, head, leftEyelid, rightEyelid, clothStrands, armL: armL.p, armR: armR.p, forearmL: armL.f, forearmR: armR.f, legL: legL.p, legR: legR.p, kneeL: legL.kn, kneeR: legR.kn };
    }

    function posePerson(rig, mode, t, forceEyesClosed = false) {
      for (let i = 0; i < rig.clothStrands.length; i++) rig.clothStrands[i].rotation.z = Math.sin(t * 2.1 + i) * 0.032;
      if (rig.leftEyelid && rig.rightEyelid) {
        const sc = forceEyesClosed ? 1.08 : (t % 4.3 > 4.12 ? 1.05 : 0.24);
        rig.leftEyelid.scale.y = sc; rig.rightEyelid.scale.y = sc;
      }
      const br = 1 + Math.sin(t * 2.2) * 0.02;
      rig.chest.scale.set(1.04 * br, 1, 0.78 * br);
      if (mode === 'seated') {
        rig.hips.position.y = 0.5; rig.torso.rotation.x = 0.22 + Math.sin(t * 2.1) * 0.024;
        rig.shoulders.position.x = Math.sin(t * 25) * 0.0035; rig.shoulders.rotation.z = Math.sin(t * 17) * 0.01;
        rig.head.rotation.x = 0.3 + Math.sin(t * 1.4) * 0.03;
        rig.legL.rotation.x = -1.5; rig.legR.rotation.x = -1.5;
        if (rig.kneeL) rig.kneeL.rotation.x = 1.42; if (rig.kneeR) rig.kneeR.rotation.x = 1.42;
        rig.armL.rotation.x = -0.72; rig.armL.rotation.z = -0.2; rig.armR.rotation.x = -0.72; rig.armR.rotation.z = 0.2;
        if (rig.forearmL) { rig.forearmL.rotation.x = -0.88; rig.forearmL.rotation.z = 0.54; }
        if (rig.forearmR) { rig.forearmR.rotation.x = -0.88; rig.forearmR.rotation.z = -0.54; }
      } else if (mode === 'walk') {
        const p = t * 6.5;
        rig.hips.position.y = 0.9 + Math.abs(Math.sin(p)) * 0.024; rig.torso.rotation.x = 0.05;
        rig.legL.rotation.x = Math.sin(p) * 0.52; rig.legR.rotation.x = -Math.sin(p) * 0.52;
        if (rig.kneeL) rig.kneeL.rotation.x = Math.max(0.05, -Math.cos(p) * 0.42);
        if (rig.kneeR) rig.kneeR.rotation.x = Math.max(0.05, Math.cos(p) * 0.42);
        rig.armL.rotation.x = -Math.sin(p) * 0.42; rig.armR.rotation.x = Math.sin(p) * 0.42;
        if (rig.forearmL) { rig.forearmL.rotation.x = -0.22; rig.forearmL.rotation.z = 0; }
        if (rig.forearmR) { rig.forearmR.rotation.x = -0.22; rig.forearmR.rotation.z = 0; }
      } else {
        rig.hips.position.y = 0.9; rig.torso.rotation.x = Math.sin(t * 1.8) * 0.018;
        rig.legL.rotation.x = 0; rig.legR.rotation.x = 0;
        if (rig.kneeL) rig.kneeL.rotation.x = 0; if (rig.kneeR) rig.kneeR.rotation.x = 0;
        rig.armL.rotation.x = 0.04; rig.armR.rotation.x = 0.04; rig.armL.rotation.z = 0.07; rig.armR.rotation.z = -0.07;
        if (rig.forearmL) { rig.forearmL.rotation.x = -0.14; rig.forearmL.rotation.z = 0; }
        if (rig.forearmR) { rig.forearmR.rotation.x = -0.14; rig.forearmR.rotation.z = 0; }
      }
    }

    function createShadow(tall = false) {
      const root = new THREE.Group();
      const sc = tall ? 1.24 : 1.06;
      const cloakMat = new THREE.MeshStandardMaterial({
        color: 0x0a0d14, map: SHADOW_TEX.map, bumpMap: SHADOW_TEX.bump, bumpScale: 0.035,
        emissive: tall ? 0x1a0810 : 0x100814, emissiveIntensity: 0.56, roughness: 0.88, metalness: 0.06, side: THREE.DoubleSide
      });
      const darkBodyMat = new THREE.MeshStandardMaterial({
        color: 0x05070c, map: SHADOW_TEX.map, bumpMap: SHADOW_TEX.bump, bumpScale: 0.03, roughness: 0.82, metalness: 0.1
      });
      const maskMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, map: TEX.mask, roughness: 0.22, metalness: 0.05 });
      const pinMat = new THREE.MeshBasicMaterial({ color: tall ? 0xef4444 : 0x7dd3fc });
      const shardMat = new THREE.MeshStandardMaterial({
        color: tall ? 0x7f1d1d : 0x38bdf8, emissive: tall ? 0xdc2626 : 0x0284c7, emissiveIntensity: 0.85,
        roughness: 0.22, metalness: 0.25, transparent: true, opacity: 0.84
      });

      const hips = new THREE.Group(); hips.position.y = 0.9; hips.scale.setScalar(sc); root.add(hips);
      const robe = new THREE.Mesh(
        new THREE.LatheGeometry([new THREE.Vector2(0.42, -0.88), new THREE.Vector2(0.32, -0.58), new THREE.Vector2(0.22, -0.28), new THREE.Vector2(0.145, 0.08)], 24),
        cloakMat
      );
      robe.castShadow = true; hips.add(robe);
      for (let s = 0; s < 10; s++) {
        const ang = (s / 10) * Math.PI * 2, len = 0.34 + (s % 3) * 0.12;
        const strand = new THREE.Mesh(new THREE.ConeGeometry(0.068, len, 5), cloakMat);
        strand.scale.set(1, 1, 0.26); strand.position.set(Math.sin(ang) * 0.34, -0.72, Math.cos(ang) * 0.34);
        strand.rotation.set(Math.PI + 0.12, ang, 0); hips.add(strand);
      }

      const torso = new THREE.Group(); torso.position.y = 0.08; hips.add(torso);
      const chest = new THREE.Mesh(
        new THREE.LatheGeometry([new THREE.Vector2(0.128, -0.02), new THREE.Vector2(0.118, 0.14), new THREE.Vector2(0.168, 0.34), new THREE.Vector2(0.178, 0.44), new THREE.Vector2(0.105, 0.5)], 20),
        cloakMat
      );
      chest.scale.set(1.04, 1, 0.78); chest.castShadow = true; torso.add(chest);
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.34, 18, 1, true), cloakMat);
      drape.position.y = 0.36; drape.scale.set(1.12, 1, 0.85); torso.add(drape);

      const shoulders = new THREE.Group(); shoulders.position.y = 0.44; shoulders.rotation.z = tall ? 0.065 : -0.055; torso.add(shoulders);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.138, 0.145, 18, 1, true, Math.PI * 0.35, Math.PI * 1.3), cloakMat);
      collar.position.set(0, 0.065, -0.015); shoulders.add(collar);
      const gauntNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.048, 0.14, 12), darkBodyMat);
      gauntNeck.position.set(0, 0.05, 0.01); shoulders.add(gauntNeck);

      const head = new THREE.Group(); head.position.y = 0.095; shoulders.add(head);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.148, 22, 18), darkBodyMat);
      skull.scale.set(0.82, 1.28, 0.92); skull.position.y = 0.17; skull.castShadow = true; head.add(skull);

      const mask = new THREE.Mesh(new THREE.SphereGeometry(0.136, 22, 18, -Math.PI * 0.38, Math.PI * 0.76, Math.PI * 0.18, Math.PI * 0.66), maskMat);
      mask.scale.set(0.92, 1.18, 0.98); mask.position.set(0, 0.17, 0.028); mask.castShadow = true; head.add(mask);
      const sockRimM = new THREE.MeshBasicMaterial({ color: 0x020306 });
      [-1, 1].forEach(side => {
        const sock = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0085, 8, 14), sockRimM);
        sock.position.set(side * 0.042, 0.186, 0.132); sock.rotation.z = side * -0.14; head.add(sock);
        const eyePin = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 10, 10), pinMat);
        eyePin.position.set(side * 0.042, 0.185, 0.139); head.add(eyePin);
      });
      const maskAnchor = new THREE.Object3D(); maskAnchor.position.set(0, 0.17, 0.16); head.add(maskAnchor);

      const armList = [];
      [-1, 1].forEach(side => {
        const arm = new THREE.Group(); arm.position.set(side * 0.215, -0.01, 0.01);
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.033, 0.34, 12), cloakMat); sleeve.position.y = -0.17;
        const tatter = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.22, 5), cloakMat); tatter.scale.set(1, 1, 0.28); tatter.position.set(side * 0.024, -0.3, -0.015); tatter.rotation.x = Math.PI;
        const forearm = new THREE.Group(); forearm.position.y = -0.34;
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.015, 0.33, 10), darkBodyMat); lower.position.y = -0.165;
        forearm.add(lower);
        for (let c = 0; c < 5; c++) {
          const sp = c - 2;
          const claw = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.155, 6), darkBodyMat);
          claw.position.set(sp * 0.016, -0.38, 0.026); claw.rotation.x = Math.PI + 0.22 + (c % 2) * 0.1; claw.rotation.z = sp * -0.085;
          forearm.add(claw);
        }
        arm.add(sleeve, tatter, forearm); shoulders.add(arm);
        armList.push({ arm, forearm });
      });

      const shardA = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), shardMat);
      shardA.position.set(-0.62, 1.25 * sc, 0.14); shardA.rotation.set(0.4, 0.6, 0.2);
      const shardB = new THREE.Mesh(new THREE.OctahedronGeometry(0.072, 0), shardMat);
      shardB.position.set(0.62, 1.5 * sc, -0.12); shardB.rotation.set(-0.3, 0.8, 0.5);
      root.add(shardA, shardB);

      const cg = new THREE.BufferGeometry(); const cp = new Float32Array(80 * 3);
      for (let i = 0; i < 80; i++) {
        const a = Math.random() * Math.PI * 2, r = 0.38 + Math.random() * 0.45;
        cp[i * 3] = Math.cos(a) * r; cp[i * 3 + 1] = 0.22 + Math.random() * 1.95 * sc; cp[i * 3 + 2] = Math.sin(a) * r;
      }
      cg.setAttribute('position', new THREE.BufferAttribute(cp, 3));
      const cloud = new THREE.Points(cg, new THREE.PointsMaterial({ color: 0x090d16, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
      const aura = new THREE.PointLight(tall ? 0xdc2626 : 0x78a9c4, 1.5, 6.5, 2); aura.position.set(0, 1.65 * sc, 0.32);
      root.add(cloud, aura);
      return { root, hips, torso, shoulders, head, leftArm: armList[0].arm, rightArm: armList[1].arm, leftForearm: armList[0].forearm, rightForearm: armList[1].forearm, maskAnchor, cloud, shardA, shardB, aura };
    }

    function poseShadow(rig, mode, t, speed = 1) {
      const isStare = mode === 'shadowStare';
      const stride = t * (isStare ? 0.5 : 4.8 * Math.max(0.75, speed));
      const gate = Math.sin(t * 1.15 + Math.cos(t * 0.47));
      const snap = gate > 0.72 ? 0.62 + Math.sin(t * 28) * 0.045 : gate < -0.78 ? -0.58 + Math.cos(t * 25) * 0.04 : Math.sin(t * 1.65) * 0.24 + (Math.sin(t * 19) > 0.88 ? 0.18 : 0);
      rig.hips.rotation.z = isStare ? 0.03 : Math.sin(stride * 0.5) * 0.045;
      rig.torso.rotation.x = (isStare ? 0.26 : 0.22) + Math.sin(t * 2.1) * 0.045;
      rig.shoulders.rotation.z = (isStare ? 0.09 : 0.07) + Math.sin(t * 15.5) * 0.012;
      rig.head.position.y = 0.095 + Math.sin(t * 2.9) * 0.015;
      rig.head.rotation.x = -0.18 + (gate > 0.72 ? -0.12 : 0);
      rig.head.rotation.z = snap;
      rig.head.rotation.y = Math.sin(t * 21) > 0.91 ? Math.sin(t * 41) * 0.16 : 0;
      if (isStare) {
        rig.leftArm.rotation.x = -0.24 + Math.sin(t * 19) * 0.025; rig.rightArm.rotation.x = -0.72 + Math.cos(t * 22) * 0.035;
        rig.leftArm.rotation.z = 0.18; rig.rightArm.rotation.z = -0.14;
        rig.leftForearm.rotation.x = -0.22 + Math.sin(t * 24) * 0.04; rig.rightForearm.rotation.x = -0.58 + Math.cos(t * 26) * 0.05;
      } else {
        const sp = Math.sin(t * 23) * 0.042;
        rig.leftArm.rotation.x = -0.62 + Math.sin(t * 2.8) * 0.22 + sp; rig.rightArm.rotation.x = -0.48 - Math.sin(t * 2.5) * 0.24 - sp;
        rig.leftArm.rotation.z = 0.16 + Math.sin(t * 3.3) * 0.05; rig.rightArm.rotation.z = -0.16 - Math.cos(t * 3.1) * 0.05;
        rig.leftForearm.rotation.x = -0.44 + Math.sin(t * 26) * 0.05; rig.rightForearm.rotation.x = -0.32 + Math.cos(t * 24) * 0.05;
      }
      rig.cloud.rotation.y += isStare ? 0.012 : 0.028;
      if (rig.aura) rig.aura.intensity = 1.15 + Math.sin(t * 13) * 0.35 + (Math.sin(t * 39) > 0.8 ? 0.7 : 0);
    }

    // --- LEVEL STATE & PROPS ---
    let worldRoot = new THREE.Group(); scene.add(worldRoot);
    let colliders = [], interactables = [], hidingSpots = [], enemies = [], mannequins = [];
    let autoDoors = [], storyTriggers = [], envScares = [], animated = [];
    let curtains = [], clockHands = [], flickerLights = [], beaconRipples = [];
    let campusRindi = null, campusBima = null, domeCtrl = null;
    let droppedLight = null, cutsceneShadows = [];
    let storyPhase = 'calm_before', horrorBlend = 0, targetHorrorBlend = 0;
    let navGrid = null, extraDoorCols = [], mirrorFrames = [], mirrorPeekCd = 0;
    let campusEnv = null;

    function resetSceneGroup() {
      scene.remove(worldRoot); worldRoot = new THREE.Group(); scene.add(worldRoot);
      colliders = []; interactables = []; hidingSpots = []; enemies = []; mannequins = [];
      autoDoors = []; storyTriggers = []; envScares = []; animated = [];
      curtains = []; clockHands = []; flickerLights = []; beaconRipples = [];
      campusRindi = null; campusBima = null; domeCtrl = null;
      droppedLight = null; cutsceneShadows = [];
      extraDoorCols = []; mirrorFrames = []; campusEnv = null;
    }

    function addWall(x, y, z, w, h, d, mat, solid = true) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; worldRoot.add(m);
      if (solid) colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
      return m;
    }

    function buildWinterTree(x, z) {
      const g = new THREE.Group(); g.position.set(x, 0, z);
      const bMat = new THREE.MeshStandardMaterial({ map: WOOD.map, bumpMap: WOOD.bump, bumpScale: 0.03, color: 0x2a201b, roughness: 0.9 });
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 3.0, 14), bMat); tr.position.y = 1.5; tr.castShadow = true; g.add(tr);
      [[-0.45, 2.7, 0.15, 0.22, 0.68], [0.48, 2.88, -0.2, -0.24, -0.62], [0.1, 3.15, 0.48, 0.58, 0.14], [-0.2, 3.35, -0.45, -0.55, -0.16]].forEach(([bx, by, bz, rx, rz]) => {
        const br = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.85, 8), bMat);
        br.position.set(bx, by, bz); br.rotation.set(rx, 0, rz); g.add(br);
        const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 0.9, 6), bMat);
        tw.position.set(bx * 1.6, by + 0.65, bz * 1.6); tw.rotation.z = rz * 1.3; g.add(tw);
      });
      worldRoot.add(g);
    }

    function buildDesk(x, z, ry) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
      const wMat = new THREE.MeshStandardMaterial({ map: WOOD.map, bumpMap: WOOD.bump, bumpScale: 0.015, color: 0x614634, roughness: 0.72 });
      const sMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.8 });
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.045, 0.56), wMat); top.position.y = 0.74; top.castShadow = true; g.add(top);
      [[-0.36,-0.22],[0.36,-0.22],[-0.36,0.22],[0.36,0.22]].forEach(([lx,lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8), sMat); leg.position.set(lx, 0.36, lz); g.add(leg);
      });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.035, 0.42), wMat); seat.position.set(0, 0.44, 0.52);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.035), wMat); back.position.set(0, 0.72, 0.71);
      const nb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.016, 0.2), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })); nb.position.set(-0.12, 0.77, 0.04);
      g.add(seat, back, nb);
      worldRoot.add(g);
      colliders.push({ minX: x - 0.48, maxX: x + 0.48, minZ: z - 0.35, maxZ: z + 0.65 });
    }

    function buildCloset(x, z, yaw, label, style = 'wood') {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw;
      const bMat = new THREE.MeshStandardMaterial({ map: style === 'wood' ? WOOD.map : undefined, color: style === 'wood' ? 0x3b2a22 : 0x1e3240, roughness: 0.68 });
      const shell = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.25, 0.9), bMat); shell.position.y = 1.125; shell.castShadow = true;
      const pL = new THREE.Group(); pL.position.set(-0.53, 1.08, 0.46);
      const dL = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.08, 0.05), bMat); dL.position.x = 0.26; pL.add(dL);
      const pR = new THREE.Group(); pR.position.set(0.53, 1.08, 0.46);
      const dR = new THREE.Mesh(new THREE.BoxGeometry(0.52, 2.08, 0.05), bMat); dR.position.x = -0.26; pR.add(dR);
      g.add(shell, pL, pR); worldRoot.add(g);
      const rot90 = Math.abs(Math.sin(yaw)) > 0.7;
      const hw = rot90 ? 0.45 : 0.58, hd = rot90 ? 0.58 : 0.45;
      colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd });
      hidingSpots.push({ position: new THREE.Vector3(x, 1.48, z), lookOutYaw: yaw, label });
      return { group: g, pL, pR };
    }

    const _cCalmBg = new THREE.Color(0x88a4be), _cCalmFog = new THREE.Color(0xa9bac6), _cNightBg = new THREE.Color(0x04080f);
    const _cCalmSky = new THREE.Color(0xdbeafe), _cNightSky = new THREE.Color(0x78a9c4);
    const _cCalmGnd = new THREE.Color(0x5c5346), _cNightGnd = new THREE.Color(0x0f172a);
    const _cCalmDir = new THREE.Color(0xffe5b8), _cNightDir = new THREE.Color(0xffedd5);
    const _cWarmSun = new THREE.Color(0xffe2b0), _cColdSun = new THREE.Color(0x93c5fd);
    const _cWarmFloor = new THREE.Color(0x5f7165), _cColdFloor = new THREE.Color(0x1e2c3a);
    const _cWarmWalk = new THREE.Color(0x475569), _cColdWalk = new THREE.Color(0x26313d);

    function buildCityscapeInline(innerClearRadius, isWarmDay, isDawn = false) {
      const group = new THREE.Group();
      let seed = 20261125;
      const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      const fgWallMat = new THREE.MeshStandardMaterial({ map: TEX.cityFacade, emissive: 0xd4a353, emissiveMap: TEX.cityEmissive, emissiveIntensity: 0, color: 0xc2ccd6, roughness: 0.78 });
      const fgRoofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.74 });
      const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a333f, roughness: 0.88 });
      [
        [-34, -6, 7.2, 7.6, 16], [34, -5, 7.6, 8.2, 18],
        [-24, -34, 15, 6.8, 6.5], [24, -34, 15, 6.8, 6.5],
        [-28, 26, 13, 6.2, 6.2], [28, 26, 13, 6.2, 6.2]
      ].forEach(([bx, bz, bw, bh, bd]) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), fgWallMat); b.position.set(bx, bh / 2, bz);
        const rf = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.8, 0.5, bd + 0.8), fgRoofMat); rf.position.set(bx, bh + 0.25, bz);
        group.add(b, rf);
      });
      [[0, -44, 180, 7.5], [0, 44, 180, 7.5], [-44, 0, 7.5, 180], [44, 0, 7.5, 180]].forEach(([rx, rz, rw, rd]) => {
        const rdMesh = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), roadMat);
        rdMesh.rotation.x = -Math.PI / 2; rdMesh.position.set(rx, 0.015, rz); group.add(rdMesh);
      });

      const unitBox = new THREE.BoxGeometry(1, 1, 1); unitBox.translate(0, 0.5, 0);
      const midMat = new THREE.MeshStandardMaterial({ map: TEX.cityFacade, emissive: 0xffffff, emissiveMap: TEX.cityEmissive, emissiveIntensity: 0, color: 0xffffff, roughness: 0.84 });
      const bgMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const farMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });

      const dummy = new THREE.Object3D();
      const midList = [], bgList = [], farList = [];
      const midPal = [0xc7bfb4, 0xb8c0c8, 0xaab4be, 0xc3b7a6], bgPal = [0x8899aa, 0x7c8ea0, 0x94a1ae];
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2 + (rng() - 0.5) * 0.08, dist = 54 + rng() * 38;
        const x = Math.round(Math.cos(a) * dist / 4) * 4, z = Math.round(Math.sin(a) * dist / 4) * 4;
        if (Math.hypot(x, z) < innerClearRadius + 10) continue;
        midList.push({ x, z, w: 7.5 + rng() * 7, h: 9 + rng() * 17, d: 6.5 + rng() * 6, yaw: Math.floor(rng() * 4) * (Math.PI / 2), c: new THREE.Color(midPal[i % midPal.length]) });
      }
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 + (rng() - 0.5) * 0.07, dist = 104 + rng() * 50;
        bgList.push({ x: Math.cos(a) * dist, z: Math.sin(a) * dist, w: 10 + rng() * 10, h: 22 + rng() * 32, d: 9 + rng() * 9, yaw: Math.floor(rng() * 4) * (Math.PI / 2), c: new THREE.Color(bgPal[i % bgPal.length]) });
      }
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2, dist = 166 + rng() * 54;
        farList.push({ x: Math.cos(a) * dist, z: Math.sin(a) * dist, w: 14 + rng() * 15, h: 28 + rng() * 46, d: 12 + rng() * 12, yaw: a + Math.PI / 2, c: new THREE.Color(0x7c8fa4) });
      }
      const makeInst = (list, mat) => {
        const im = new THREE.InstancedMesh(unitBox, mat, list.length);
        list.forEach((s, i) => {
          dummy.position.set(s.x, 0, s.z); dummy.rotation.set(0, s.yaw, 0); dummy.scale.set(s.w, s.h, s.d); dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix); im.setColorAt(i, s.c);
        });
        im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.computeBoundingSphere();
        group.add(im); return im;
      };
      const midInst = makeInst(midList, midMat), bgInst = makeInst(bgList, bgMat), farInst = makeInst(farList, farMat);
      const tmpC = new THREE.Color(), nightC = new THREE.Color(0x1b2636), farNightC = new THREE.Color(0x0c1420), dawnC = new THREE.Color(0xd6b88d);
      const applyAtmosphere = (blend, dawnMode = false) => {
        const b = Math.max(0, Math.min(1, blend));
        if (dawnMode) {
          fgWallMat.color.setHex(0xd4c8b8); fgWallMat.emissiveIntensity = 0.06; midMat.emissiveIntensity = 0.08;
        } else {
          fgWallMat.color.setHex(0xc2ccd6).lerp(new THREE.Color(0x253244), b);
          fgWallMat.emissiveIntensity = Math.max(0, (b - 0.3) / 0.7) * 0.36;
          midMat.emissiveIntensity = Math.max(0, (b - 0.25) / 0.75) * 0.44;
        }
        midList.forEach((s, i) => { tmpC.copy(s.c).lerp(dawnMode ? dawnC : nightC, dawnMode ? 0.28 : b * 0.78); midInst.setColorAt(i, tmpC); });
        bgList.forEach((s, i) => { tmpC.copy(s.c).lerp(dawnMode ? dawnC : nightC, dawnMode ? 0.22 : b * 0.84); bgInst.setColorAt(i, tmpC); });
        farList.forEach((s, i) => { tmpC.copy(s.c).lerp(dawnMode ? new THREE.Color(0x526074) : farNightC, dawnMode ? 0.45 : b * 0.88); farInst.setColorAt(i, tmpC); });
        if (midInst.instanceColor) midInst.instanceColor.needsUpdate = true;
        if (bgInst.instanceColor) bgInst.instanceColor.needsUpdate = true;
        if (farInst.instanceColor) farInst.instanceColor.needsUpdate = true;
      };
      applyAtmosphere(isWarmDay ? 0 : 1, isDawn);
      worldRoot.add(group);
      return { applyAtmosphere };
    }

    function applyCampusAtmos(blend) {
      const b = Math.max(0, Math.min(1, blend));
      scene.background = _cCalmBg.clone().lerp(_cNightBg, b);
      fog.color.copy(_cCalmFog).lerp(_cNightBg, b);
      fog.density = THREE.MathUtils.lerp(0.0042, 0.0175, b);
      hemiLight.color.copy(_cCalmSky).lerp(_cNightSky, b);
      hemiLight.groundColor.copy(_cCalmGnd).lerp(_cNightGnd, b);
      hemiLight.intensity = THREE.MathUtils.lerp(0.92, 0.46, b);
      dirLight.color.copy(_cCalmDir).lerp(_cNightDir, b);
      dirLight.intensity = THREE.MathUtils.lerp(1.1, 0.36, b);
      if (campusEnv) {
        campusEnv.sunLight.color.copy(_cWarmSun).lerp(_cColdSun, b);
        campusEnv.sunLight.intensity = THREE.MathUtils.lerp(1.45, 0.35, b);
        campusEnv.groundMat.color.copy(_cWarmFloor).lerp(_cColdFloor, b);
        campusEnv.walkMat.color.copy(_cWarmWalk).lerp(_cColdWalk, b);
        campusEnv.lamp.intensity = Math.max(0, Math.min(1, (b - 0.22) / 0.65)) * 2.8;
        campusEnv.snowMounds.visible = b > 0.48;
        campusEnv.cityscape?.applyAtmosphere(b, false);
      }
      snowPoints.visible = b > 0.25;
      snowMat.opacity = Math.max(0, Math.min(1, (b - 0.25) / 0.65)) * 0.72;
    }

    function buildCampus(mode) {
      resetSceneGroup();
      const dawn = mode === 'true';
      const isWarmDay = mode === 'title' || mode === 'prologue';

      const groundMat = new THREE.MeshStandardMaterial({ color: dawn ? 0x475569 : isWarmDay ? 0x5f7165 : 0x1e2c3a, roughness: 0.85 });
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), groundMat);
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; worldRoot.add(ground);

      const walkMat = new THREE.MeshStandardMaterial({ color: isWarmDay ? 0x475569 : 0x26313d, roughness: 0.72 });
      const walkway = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 52), walkMat);
      walkway.position.set(0, 0.02, 2); walkway.receiveShadow = true; worldRoot.add(walkway);

      const snowMounds = new THREE.Group();
      const moundMat = new THREE.MeshStandardMaterial({ color: 0xbfdbfe, roughness: 0.85 });
      [[-2.8, 1.5], [2.9, 2.8], [-3.4, -3.5], [3.6, -4.2], [-4.8, 6.2], [4.5, 6.8]].forEach(([mx, mz]) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.68, 10, 6), moundMat);
        m.scale.set(1.5, 0.24, 1.1); m.position.set(mx, 0.04, mz); snowMounds.add(m);
      });
      snowMounds.visible = !isWarmDay && !dawn;
      worldRoot.add(snowMounds);

      const bench = new THREE.Group();
      const bWood = new THREE.MeshStandardMaterial({ map: WOOD.map, bumpMap: WOOD.bump, color: 0x6b4b38, roughness: 0.72 });
      const iron = new THREE.MeshStandardMaterial({ color: 0x1a222d, metalness: 0.82, roughness: 0.35 });
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.048, 0.12), bWood); s.position.set(0, 0.45, -0.18 + i * 0.13); bench.add(s);
        if (i < 3) { const b = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.11, 0.045), bWood); b.position.set(0, 0.65 + i * 0.145, -0.27); bench.add(b); }
      }
      [-0.92, 0.92].forEach(lx => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.45, 12), iron); leg.position.set(lx, 0.225, 0.22); bench.add(leg); });
      bench.position.set(0, 0, -1.2); worldRoot.add(bench);

      const bulletin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.15, 0.1), bWood); bulletin.position.set(-3.2, 1.55, -4.6); bulletin.rotation.y = 0.42; worldRoot.add(bulletin);
      const flyers = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 0.98), new THREE.MeshStandardMaterial({ map: TEX.bulletin })); flyers.position.set(-3.16, 1.55, -4.54); flyers.rotation.y = 0.42; worldRoot.add(flyers);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.072, 3.8, 12), iron); pole.position.set(-2.35, 1.9, -1.8); worldRoot.add(pole);
      const lamp = new THREE.PointLight(dawn ? 0xfde68a : 0x93c5fd, isWarmDay ? 0 : dawn ? 5 : 2.8, 14); lamp.position.set(-2.35, 3.8, -1.8); worldRoot.add(lamp);

      const fac = new THREE.Mesh(new THREE.BoxGeometry(22, 8.5, 6), new THREE.MeshStandardMaterial({ color: 0x16202c, roughness: 0.8 }));
      fac.position.set(0, 4.25, -23.5); worldRoot.add(fac);
      [[-6.2, -5.5], [6.5, -4.8], [-8.5, 3.8], [8.2, 4.4], [-13.0, -13.0], [13.5, -12.5]].forEach(([tx, tz]) => buildWinterTree(tx, tz));
      const cityscape = buildCityscapeInline(27, isWarmDay, dawn);

      campusRindi = createPerson({ role: 'rindi', coat: 0xc4bdb2, pants: 0x3b5470, skin: 0xd8b194, hair: 0x181412 });
      campusRindi.root.position.set(mode === 'true' ? -0.65 : 0, mode === 'true' ? 0 : 0.02, mode === 'true' ? 0.4 : -1.16);
      worldRoot.add(campusRindi.root);

      if (mode !== 'title') {
        campusBima = createPerson({ role: 'bima', coat: 0x1c2c44, pants: 0x181b20, skin: 0xcfa485, hair: 0x141418, backpack: true });
        campusBima.root.position.set(mode === 'true' ? 0.75 : 1.45, 0, mode === 'true' ? 0.55 : 0.65);
        campusBima.root.rotation.y = mode === 'true' ? -0.35 : -0.82;
        worldRoot.add(campusBima.root);
      }

      const sunLight = new THREE.DirectionalLight(dawn ? 0xfde68a : isWarmDay ? 0xffe2b0 : 0x93c5fd, dawn ? 1.55 : isWarmDay ? 1.45 : 0.35);
      sunLight.position.set(10, 14, 12);
      worldRoot.add(sunLight);
      campusEnv = { groundMat, walkMat, lamp, sunLight, snowMounds, cityscape };

      if (isWarmDay) {
        storyPhase = 'calm_before'; horrorBlend = 0; targetHorrorBlend = 0;
        applyCampusAtmos(0);
      } else if (dawn) {
        storyPhase = 'horror_after'; horrorBlend = 1; targetHorrorBlend = 1;
        scene.background = new THREE.Color(0x1f2d42);
        fog.color.setHex(0x1f2d42); fog.density = 0.0085;
        cityscape.applyAtmosphere(0.15, true);
        hemiLight.color.setHex(0xfde68a); hemiLight.groundColor.setHex(0x334155); hemiLight.intensity = 0.88;
        dirLight.color.setHex(0xfef3c7); dirLight.intensity = 1.05;
        snowPoints.visible = false; snowMat.opacity = 0;
      } else {
        storyPhase = 'horror_after'; horrorBlend = 1; targetHorrorBlend = 1;
        applyCampusAtmos(1);
      }
    }

    function addFragMesh(id, label, x, y, z, color, hex) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color, emissive: hex, emissiveIntensity: 1.5 }));
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.68, 14), new THREE.MeshStandardMaterial({ map: WOOD.map, color: 0x3b2c22 })); ped.position.y = -0.5;
      const light = new THREE.PointLight(hex, 2.3, 6);
      g.add(orb, ped, light); worldRoot.add(g);
      colliders.push({ minX: x - 0.36, maxX: x + 0.36, minZ: z - 0.36, maxZ: z + 0.36 });
      animated.push({ mesh: orb, mode: 'bob' });
      interactables.push({ id, label, kind: 'fragment', position: new THREE.Vector3(x, y, z), radius: 2.3, mesh: g, collected: false });
    }

    function buildGameplayLayer(idx, frost, diff) {
      resetSceneGroup();
      scene.background = new THREE.Color(0x04080f);
      fog.color.setHex(0x04080f);
      fog.density = idx === 3 ? (0.0135 + frost * 0.012) : (0.036 + frost * 0.042);
      snowPoints.visible = true;
      const spdScale = (diff === 'story' ? 0.58 : 1.0) * (1 + frost * 0.35);

      if (idx === 0) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 40), new THREE.MeshStandardMaterial({ map: WOOD.map, bumpMap: WOOD.bump, bumpScale: 0.025, roughnessMap: WOOD.rough, color: 0xa4bdd4 }));
        floor.rotation.x = -Math.PI / 2; floor.position.z = -3; floor.receiveShadow = true; worldRoot.add(floor);
        const wallM = new THREE.MeshStandardMaterial({ map: PLASTER.map, bumpMap: PLASTER.bump, bumpScale: 0.03, color: 0x3b4858, roughness: 0.85 });
        addWall(0, 1.85, 15.2, 15.4, 3.7, 0.45, wallM); addWall(-7.5, 1.85, 12.35, 0.45, 3.7, 5.8, wallM); addWall(7.5, 1.85, 11.6, 0.45, 3.7, 7.2, wallM);
        addWall(-12.6, 1.85, -3.0, 0.45, 3.7, 25.4, wallM); addWall(-10.05, 1.85, 9.5, 5.1, 3.7, 0.45, wallM); addWall(-8.0, 1.85, -15.5, 9.2, 3.7, 0.45, wallM);
        addWall(-3.8, 1.85, 7.55, 0.38, 3.7, 3.9, wallM); addWall(-3.8, 1.85, 0.4, 0.38, 3.7, 4.4, wallM);
        addWall(-9.55, 1.85, 0.5, 6.1, 3.7, 0.38, wallM); addWall(-3.8, 1.85, -8.0, 0.38, 3.7, 7.0, wallM);
        addWall(12.6, 1.65, -1.25, 0.45, 3.3, 18.5, wallM); addWall(10.05, 1.65, 8.0, 5.1, 3.3, 0.45, wallM);
        addWall(10.05, 1.65, 0.5, 5.1, 3.3, 0.38, wallM); addWall(8.0, 1.65, -10.5, 9.2, 3.3, 0.45, wallM);
        addWall(4.2, 1.65, -4.5, 0.38, 3.3, 5.6, wallM); addWall(8.5, 1.65, -5.0, 0.35, 3.3, 4.6, wallM);
        addWall(-3.4, 1.85, -18.35, 0.45, 3.7, 5.7, wallM); addWall(3.4, 1.85, -15.85, 0.45, 3.7, 10.7, wallM); addWall(0, 1.85, -21.2, 7.2, 3.7, 0.45, wallM);

        const stairLight = new THREE.PointLight(0xd4a353, 4.5, 14); stairLight.position.set(5.6, -0.6, 6.2); worldRoot.add(stairLight);
        addWall(3.55, 0.55, 5.6, 0.22, 1.1, 4.8, wallM);
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.45, 2.35), new THREE.MeshStandardMaterial({ map: FABRIC.map, bumpMap: FABRIC.bump, color: 0x3f5e78 }));
        bed.position.set(-10.2, 0.25, 6.5); bed.rotation.y = Math.PI / 2; bed.castShadow = true; worldRoot.add(bed);
        colliders.push({ minX: -11.5, maxX: -8.9, minZ: 5.5, maxZ: 7.5 });

        const curt = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.9), new THREE.MeshStandardMaterial({ map: FABRIC.map, color: 0x64748b, side: THREE.DoubleSide }));
        curt.position.set(-12.34, 1.85, 5.2); curt.rotation.y = Math.PI / 2; worldRoot.add(curt); curtains.push(curt);

        buildCloset(-4.6, 8.2, Math.PI / 2, 'Lemari Pakaian Kamar', 'wood');
        buildCloset(-4.6, -13.5, Math.PI / 2, 'Lemari Ruang Musik', 'wood');
        const cNorth = buildCloset(2.55, -13.2, -Math.PI / 2, 'Lemari Lorong Utara', 'wood');
        envScares.push({ id: 'env_wardrobe', kind: 'wardrobe', position: new THREE.Vector3(1.1, 0, -13.2), radius: 2.4, fired: false, focus: new THREE.Vector3(2.55, 1.4, -13.2), pL: cNorth.pL, pR: cNorth.pR });

        addFragMesh('frag_1_phone', 'Periksa Ponsel di Atas Meja Nakas', -10.2, 0.85, 3.1, 0x38bdf8, 0x0284c7);
        addFragMesh('frag_1_music', 'Ambil Kotak Musik Panggilan Ibu', -9.4, 0.85, -9.2, 0xfbbf24, 0xd97706);

        const wallIce = addWall(0, 1.85, -20.2, 5.8, 3.7, 0.45, new THREE.MeshPhysicalMaterial({ map: ICE.map, bumpMap: ICE.bump, color: 0x99cbe8, transparent: true, opacity: 0.8 }), true);
        interactables.push({ id: 'exit_1', label: 'Hadapi Tembok Es Keheningan', kind: 'exit', position: new THREE.Vector3(0, 1.4, -19.8), radius: 2.9, mesh: wallIce, collected: false });
        storyTriggers.push({ id: 'stair_warmth', position: new THREE.Vector3(2.1, 0, 6.0), radius: 2.5, fired: false });

        const sh = createShadow(false); sh.root.position.set(-8.5, 0, -11.5); worldRoot.add(sh.root);
        enemies.push({ rig: sh, waypoints: [new THREE.Vector3(-8.5,0,-11.5), new THREE.Vector3(0,0,-12.2), new THREE.Vector3(6.0,0,-9.2), new THREE.Vector3(6.2,0,-1.2), new THREE.Vector3(0,0,1.8), new THREE.Vector3(-7.5,0,2.2)], wp: 1, speed: 2.2 * spdScale, frozen: 0, chase: false });
        return { bounds: { minX: -12.1, maxX: 12.1, minZ: -20.7, maxZ: 14.7 }, spawn: new THREE.Vector3(0, 1.65, 13.6), yaw: 0 };
      }

      if (idx === 1) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 52), new THREE.MeshStandardMaterial({ map: TILE.map, bumpMap: TILE.bump, roughnessMap: TILE.rough, color: 0xa4bed4 }));
        floor.rotation.x = -Math.PI / 2; floor.position.z = -9; floor.receiveShadow = true; worldRoot.add(floor);
        const wallM = new THREE.MeshStandardMaterial({ map: PLASTER.map, bumpMap: PLASTER.bump, color: 0x314050, roughness: 0.84 });
        addWall(0, 1.925, 15.0, 21.4, 3.85, 0.45, wallM); addWall(-10.5, 1.925, 5.25, 0.45, 3.85, 19.5, wallM);
        addWall(10.5, 1.925, 12.4, 0.45, 3.85, 5.2, wallM); addWall(10.5, 1.925, 4.35, 0.45, 3.85, 5.7, wallM); addWall(10.5, 1.925, -2.85, 0.45, 3.85, 3.3, wallM);
        addWall(-6.95, 1.925, -4.5, 7.1, 3.85, 0.45, wallM); addWall(6.95, 1.925, -4.5, 7.1, 3.85, 0.45, wallM);
        addWall(15.4, 1.65, 4.25, 0.45, 3.3, 12.9, wallM); addWall(12.95, 1.65, -2.0, 4.9, 3.3, 0.45, wallM); addWall(12.95, 1.65, 10.5, 4.9, 3.3, 0.45, wallM);
        addWall(3.4, 1.8, -15.0, 0.45, 3.6, 21.0, wallM); addWall(-3.4, 1.8, -12.15, 0.45, 3.6, 15.3, wallM); addWall(-3.4, 1.8, -24.25, 0.45, 3.6, 2.5, wallM);
        addWall(-12.6, 1.7, -20.85, 0.45, 3.4, 9.7, wallM); addWall(-8.0, 1.7, -16.2, 9.2, 3.4, 0.45, wallM); addWall(-8.0, 1.7, -25.5, 9.2, 3.4, 0.45, wallM);
        addWall(-2.9, 1.58, -25.5, 1.2, 3.16, 0.45, wallM); addWall(2.9, 1.58, -25.5, 1.2, 3.16, 0.45, wallM);
        addWall(-2.4, 1.58, -29.55, 0.45, 3.16, 8.1, wallM); addWall(2.4, 1.58, -29.55, 0.45, 3.16, 8.1, wallM); addWall(0, 1.58, -33.6, 5.2, 3.16, 0.45, wallM);

        [[-8.2,11.2],[-8.2,8.2],[-8.2,5.2],[-8.2,2.2],[-8.2,-0.8],[-5.6,11.2],[-5.6,8.2],[-5.6,2.2],[-5.6,-0.8],[5.6,11.2],[5.6,8.2],[5.6,2.2],[5.6,-0.8],[8.2,11.2],[8.2,8.2],[8.2,5.2],[8.2,2.2],[8.2,-0.8]].forEach(([dx,dz]) => buildDesk(dx, dz, dx < 0 ? 0.14 : -0.14));

        const cFace = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), new THREE.MeshStandardMaterial({ map: TEX.clock }));
        cFace.position.set(10.18, 2.65, 4.4); cFace.rotation.y = -Math.PI / 2; worldRoot.add(cFace);
        const minH = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.22, 0.01), new THREE.MeshBasicMaterial({ color: 0x991b1b }));
        minH.position.set(10.14, 2.65, 4.4); worldRoot.add(minH); clockHands.push(minH);

        [[-4.2,3.75,8.5],[4.2,3.75,2.0],[13.0,3.15,4.2],[0,3.5,-11.5],[-8.0,3.3,-20.8],[0,3.08,-28.5]].forEach(([fx,fy,fz], i) => {
          const tubeMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, emissive: 0xbae6fd, emissiveIntensity: 1.5 });
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.4, 10), tubeMat);
          tube.rotation.z = Math.PI / 2; tube.position.set(fx, fy, fz);
          const fl = new THREE.PointLight(0xdbeafe, 2.1, 11, 2); fl.position.set(fx, fy - 0.2, fz);
          worldRoot.add(tube, fl); flickerLights.push({ light: fl, mat: tubeMat, seed: i * 3.7 + 1.1 });
        });

        const pencil = new THREE.Group(); pencil.position.set(0, 1.5, 5.2);
        const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0xb8860b })); pBody.rotation.z = Math.PI / 2 - 0.14; pencil.add(pBody);
        const pTip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0xdeb887 })); pTip.rotation.z = -Math.PI / 2 - 0.14; pTip.position.set(1.9, 0.26, 0); pencil.add(pTip);
        worldRoot.add(pencil); animated.push({ mesh: pencil, mode: 'pencil' });
        colliders.push({ minX: -0.7, maxX: 0.7, minZ: 4.5, maxZ: 5.9 });

        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.35;
          const mx = Math.cos(a) * 3.7, mz = 5.2 + Math.sin(a) * 3.7;
          const man = createPerson({ coat: 0x94a3b8, skin: 0xcbd5e1, mannequin: true, skirt: i % 2 === 0 });
          man.root.position.set(mx, 0, mz);
          man.root.lookAt(0, 0, 5.2); worldRoot.add(man.root); mannequins.push(man);
          colliders.push({ minX: mx - 0.35, maxX: mx + 0.35, minZ: mz - 0.35, maxZ: mz + 0.35 });
        }
        envScares.push({ id: 'env_mannequins', kind: 'mannequins', position: new THREE.Vector3(0, 0, -3.2), radius: 2.4, fired: false, focus: new THREE.Vector3(0, 1.55, 5.2) });

        buildCloset(14.4, 3.8, -Math.PI / 2, 'Loker Ruang Alat Timur', 'locker');
        buildCloset(-11.4, -18.0, Math.PI / 2, 'Loker Ruang Arsip', 'locker');
        buildCloset(-2.6, -14.8, Math.PI / 2, 'Loker Koridor BK', 'locker');

        addFragMesh('frag_2_note', 'Ambil Catatan Undian Putaran Pensil', -6.8, 0.9, -2.5, 0x38bdf8, 0x0284c7);
        addFragMesh('frag_2_badge', 'Periksa Berkas Laporan Sekolah Membeku', -8.8, 0.9, -21.0, 0xfbbf24, 0xd97706);

        const bkDoor = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.8, 0.2), new THREE.MeshStandardMaterial({ map: TEX.bkSign }));
        bkDoor.position.set(0, 1.4, -32.9); worldRoot.add(bkDoor);
        interactables.push({ id: 'exit_2', label: 'Buka Rantai Pintu Ruang BK', kind: 'exit', position: new THREE.Vector3(0, 1.4, -32.9), radius: 2.8, mesh: bkDoor, collected: false });
        storyTriggers.push({ id: 'bk_hallway', position: new THREE.Vector3(0, 0, -14.2), radius: 2.6, fired: false });

        const sh = createShadow(true); sh.root.position.set(0, 0, -27.5); worldRoot.add(sh.root);
        enemies.push({ rig: sh, waypoints: [new THREE.Vector3(0,0,-28), new THREE.Vector3(0,0,-17.5), new THREE.Vector3(-7.2,0,-20.8), new THREE.Vector3(0,0,-9.5), new THREE.Vector3(-4.2,0,1.2), new THREE.Vector3(12.6,0,3.8)], wp: 1, speed: 2.3 * spdScale, frozen: 0, chase: false });
        return { bounds: { minX: -14.8, maxX: 14.8, minZ: -33.1, maxZ: 14.4 }, spawn: new THREE.Vector3(0, 1.65, 13.0), yaw: 0 };
      }

      if (idx === 2) {
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 54), new THREE.MeshStandardMaterial({ map: TILE.map, bumpMap: TILE.bump, color: 0x475569, roughness: 0.25, metalness: 0.4 }));
        floor.rotation.x = -Math.PI / 2; floor.position.z = -10.5; floor.receiveShadow = true; worldRoot.add(floor);
        const glassM = new THREE.MeshPhysicalMaterial({ map: PLASTER.map, bumpMap: PLASTER.bump, color: 0x1e293b, emissive: 0x1a152e, emissiveIntensity: 0.35, roughness: 0.16, metalness: 0.65 });
        addWall(0, 1.925, 15.0, 31.2, 3.85, 0.45, glassM); addWall(-15.4, 1.925, -3.6, 0.45, 3.85, 37.6, glassM); addWall(15.4, 1.925, -3.6, 0.45, 3.85, 37.6, glassM);
        addWall(-9.75, 1.925, 5.5, 10.5, 3.85, 0.38, glassM); addWall(9.75, 1.925, 5.5, 10.5, 3.85, 0.38, glassM);
        addWall(-7.5, 1.925, -0.5, 0.38, 3.85, 6.0, glassM); addWall(-12.8, 1.925, -6.5, 4.8, 3.85, 0.38, glassM);
        addWall(-3.6, 1.925, -5.0, 0.38, 3.85, 7.0, glassM); addWall(3.6, 1.925, -7.0, 0.38, 3.85, 7.0, glassM); addWall(0, 1.925, -14.5, 14.0, 3.85, 0.38, glassM);
        addWall(12.8, 1.925, -5.5, 4.8, 3.85, 0.38, glassM); addWall(7.5, 1.925, -11.0, 0.38, 3.85, 5.0, glassM);
        addWall(-9.45, 1.925, -22.2, 12.1, 3.85, 0.45, glassM); addWall(9.45, 1.925, -22.2, 12.1, 3.85, 0.45, glassM);
        addWall(-2.65, 1.65, -22.2, 1.5, 3.3, 0.45, glassM); addWall(2.65, 1.65, -22.2, 1.5, 3.3, 0.45, glassM);
        addWall(-3.4, 1.65, -29.2, 0.45, 3.3, 14.0, glassM); addWall(3.4, 1.65, -29.2, 0.45, 3.3, 14.0, glassM); addWall(0, 1.65, -36.2, 7.2, 3.3, 0.45, glassM);

        const mFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.72, roughness: 0.28 });
        const mGlassMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.12, emissive: 0x0c1724, emissiveIntensity: 0.35 });
        [[-15.0, 10.2, Math.PI / 2], [15.0, 10.2, -Math.PI / 2], [-3.2, -5.0, Math.PI / 2], [3.2, -7.0, -Math.PI / 2], [-15.0, -14.2, Math.PI / 2], [-3.0, -28.0, Math.PI / 2]].forEach(([mx, mz, mry]) => {
          const mf = new THREE.Group(); mf.position.set(mx, 0, mz); mf.rotation.y = mry;
          const border = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.05, 0.08), mFrameMat); border.position.y = 1.55;
          const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.88), mGlassMat); pane.position.set(0, 1.55, 0.045);
          mf.add(border, pane); worldRoot.add(mf); mirrorFrames.push(mf);
        });

        [[-6.4,9.2,0.45],[6.4,9.2,-0.45],[-9.8,-12.0,0.5],[5.5,-2.0,-0.5],[10.5,-18.5,-0.6],[-2.8,-26.5,Math.PI/2]].forEach(([kx,kz,kry]) => {
          const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 1.0), new THREE.MeshStandardMaterial({ map: TEX.kbgo, emissive: 0x581c87, emissiveMap: TEX.kbgo, emissiveIntensity: 1.05 }));
          scr.position.set(kx, 1.75, kz); scr.rotation.y = kry; worldRoot.add(scr); animated.push({ mesh: scr, mode: 'bob' });
        });

        const ambushScr = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.45), new THREE.MeshStandardMaterial({ map: TEX.glitchFace, emissive: 0x991b1b, emissiveMap: TEX.glitchFace, emissiveIntensity: 1.55 }));
        ambushScr.position.set(-1.6, 1.75, -4.5); ambushScr.visible = false; worldRoot.add(ambushScr);
        envScares.push({ id: 'env_glitchphone', kind: 'glitchPhone', position: new THREE.Vector3(-0.6, 0, -1.8), radius: 2.5, fired: false, focus: new THREE.Vector3(-1.6, 1.75, -4.5), glitchGroup: ambushScr });

        const pivot = new THREE.Group(); pivot.position.set(-1.9, 0, -22.2);
        const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.2, 0.16), new THREE.MeshStandardMaterial({ map: WOOD.map, color: 0x3f2a22 }));
        doorLeaf.position.set(1.05, 1.6, 0); pivot.add(doorLeaf); worldRoot.add(pivot);
        autoDoors.push({ pivot, triggerZ: -23.2, targetYaw: 0.12, triggered: false }); pivot.rotation.y = 1.1;

        buildCloset(14.1, 7.8, -Math.PI / 2, 'Sekat Kaca Selatan', 'locker');
        buildCloset(14.1, -14.2, -Math.PI / 2, 'Sekat Kaca Ruang Suar', 'locker');
        buildCloset(-14.1, -14.2, Math.PI / 2, 'Sekat Kaca Barat', 'locker');

        addFragMesh('frag_3_kbgo', 'Amankan Bukti Pesan PAP & Rekayasa AI', -11.8, 0.9, -0.5, 0xa855f7, 0x9333ea);
        addFragMesh('frag_3_shareloc', 'Aktifkan Suar Biru Share-Loc Penyelamatan', 11.6, 0.9, -10.5, 0x38bdf8, 0x0284c7);

        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 4.8, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.4 }));
        beacon.position.set(0, 2.4, -34.8); worldRoot.add(beacon);
        const rip = new THREE.Mesh(new THREE.RingGeometry(0.65, 0.82, 28), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }));
        rip.rotation.x = -Math.PI / 2; rip.position.set(0, 0.04, -34.8); worldRoot.add(rip); beaconRipples.push(rip);

        interactables.push({ id: 'exit_3', label: 'Tembus Lorong Fitnah Menuju Sudut Kampus', kind: 'exit', position: new THREE.Vector3(0, 1.4, -34.8), radius: 2.8, mesh: beacon, collected: false });
        storyTriggers.push({ id: 'slam_house', position: new THREE.Vector3(0, 0, -23.8), radius: 2.6, fired: false });
        storyTriggers.push({ id: 'whisper_corridor', position: new THREE.Vector3(0, 0, -29.8), radius: 2.6, fired: false });

        const sh1 = createShadow(false); sh1.root.position.set(9.2, 0, 2.2); worldRoot.add(sh1.root);
        enemies.push({ rig: sh1, waypoints: [new THREE.Vector3(9.2,0,2.2), new THREE.Vector3(-10.5,0,2.2), new THREE.Vector3(-10.5,0,-11.5), new THREE.Vector3(-10.5,0,-18.5), new THREE.Vector3(10.5,0,-18.5), new THREE.Vector3(10.5,0,-8.5), new THREE.Vector3(0,0,1.5)], wp: 1, speed: 2.4 * spdScale, frozen: 0, chase: false });
        return { bounds: { minX: -14.8, maxX: 14.8, minZ: -35.6, maxZ: 14.4 }, spawn: new THREE.Vector3(0, 1.65, 13.4), yaw: 0 };
      }

      // BABAK IV: Expanded Campus Courtyard + Layered Cityscape + Glass Dome + 4 Pillars
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), new THREE.MeshStandardMaterial({ color: 0x1e2c3a, roughness: 0.82 }));
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; worldRoot.add(floor);
      const fac = new THREE.Mesh(new THREE.BoxGeometry(22, 8.5, 6), new THREE.MeshStandardMaterial({ color: 0x16202c, roughness: 0.8 }));
      fac.position.set(0, 4.25, -35.5); worldRoot.add(fac);
      buildCityscapeInline(30, false, false);
      [[-19.5,-18.5],[20.5,-18.5],[-21.0,18.5],[21.0,18.5],[-24.0,-7.5],[24.0,7.5]].forEach(([tx, tz]) => buildWinterTree(tx, tz));

      const domeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(2.28, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.56),
        new THREE.MeshPhysicalMaterial({ map: ICE.map, bumpMap: ICE.bump, color: 0xb8d8eb, transparent: true, opacity: 0.52, clearcoat: 1, side: THREE.DoubleSide })
      );
      domeMesh.position.y = 0.28; worldRoot.add(domeMesh);

      const tendrilGroup = new THREE.Group(); tendrilGroup.position.y = 0.28; tendrilGroup.scale.set(1, 0.01, 1); tendrilGroup.visible = false;
      const thornM = new THREE.MeshStandardMaterial({ map: SHADOW_TEX.map, bumpMap: SHADOW_TEX.bump, color: 0x0b0f17, roughness: 0.55 });
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, r = 0.65 + (i % 3) * 0.2;
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1.9, 7), thornM);
        sp.position.set(Math.cos(a) * r, 0.72, Math.sin(a) * r); sp.lookAt(0, 1.15, 0); sp.rotateX(Math.PI * 0.35);
        tendrilGroup.add(sp);
      }
      worldRoot.add(tendrilGroup);

      const rindi = createPerson({ role: 'rindi', coat: 0xc4bdb2, pants: 0x3b5470, skin: 0xd8b194, hair: 0x181412 });
      rindi.root.position.set(0, 0.28, -0.05); worldRoot.add(rindi.root);
      const iceSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.43, 10), new THREE.MeshStandardMaterial({ map: ICE.map, color: 0x93c5fd, emissive: 0x0c4a6e, emissiveIntensity: 0.35, roughness: 0.28 }));
      iceSeat.position.set(0, 0.495, -0.06); worldRoot.add(iceSeat);
      const domeLight = new THREE.PointLight(0x78a9c4, 2.8, 12); domeLight.position.set(0, 1.85, 0); worldRoot.add(domeLight);
      domeCtrl = { domeMesh, domeLight, rindi, tendrilGroup };
      colliders.push({ minX: -2.4, maxX: 2.4, minZ: -2.4, maxZ: 2.4 });
      buildCloset(-21.5, 0, Math.PI / 2, 'Pos Perlindungan Barat', 'locker');
      buildCloset(21.5, 0, -Math.PI / 2, 'Pos Perlindungan Timur', 'locker');

      [[-15.5,14.5,'pillar_1','Nyalakan Pilar I: Keberanian Bersuara'], [15.5,13.5,'pillar_2','Nyalakan Pilar II: Ruang Aman & Satgas Proaktif'], [15.5,-14.5,'pillar_3','Nyalakan Pilar III: Sanksi Tanpa Kompromi'], [-15.5,-14.5,'pillar_4','Nyalakan Pilar IV: Pemulihan & Martabat']].forEach(([px, pz, id, label]) => {
        const pg = new THREE.Group(); pg.position.set(px, 0, pz);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 1.65, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b })); base.position.y = 0.825; pg.add(base);
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), new THREE.MeshStandardMaterial({ color: 0x78a9c4, emissive: 0x38bdf8, emissiveIntensity: 0.9 })); core.position.y = 2.08; core.name = 'core'; pg.add(core);
        const pl = new THREE.PointLight(0x38bdf8, 1.8, 7.5); pl.position.y = 2.15; pl.name = 'pl'; pg.add(pl);
        worldRoot.add(pg);
        colliders.push({ minX: px - 0.42, maxX: px + 0.42, minZ: pz - 0.42, maxZ: pz + 0.42 });
        interactables.push({ id, label, kind: 'pillar', position: new THREE.Vector3(px, 1.4, pz), radius: 2.6, mesh: pg, collected: false });
      });

      interactables.push({ id: 'exit_4', label: 'Sentuh Kubah Kaca untuk Membebaskan Rindi', kind: 'exit', position: new THREE.Vector3(0, 0, 0), radius: 4.1, mesh: domeMesh, collected: false });

      const sh = createShadow(true); sh.root.position.set(-18, 0, -18); worldRoot.add(sh.root);
      enemies.push({ rig: sh, waypoints: [new THREE.Vector3(-18,0,-18), new THREE.Vector3(18,0,-18), new THREE.Vector3(18,0,18), new THREE.Vector3(-18,0,18)], wp: 1, speed: 2.35 * spdScale, frozen: 0, chase: false });
      return { bounds: { minX: -26.8, maxX: 26.8, minZ: -26.8, maxZ: 26.8 }, spawn: new THREE.Vector3(0, 1.65, 22.8), yaw: 0 };
    }

    // --- GAME STATE, CONTROL MODE, STABILITY, JUMPSCARE & CINEMATIC CUTSCENE ENGINE ---
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    let controlMode = isTouchDevice ? 'mobile' : 'pc';
    let cinematicEffects = true;
    let dismissedPortrait = false;
    let virtX = 0, virtY = 0, virtAutoSprint = false, mobileSprintHeld = false;
    let phase = 'title', difficulty = 'standard', layerIdx = 0, frost = 0.38, score = 0;
    let responses = [], totalFrags = 0, collected = 0, exitOpen = false;
    let warmth = 100, stamina = 100, stability = 5, jumpscareCount = 0, graceTimer = 0;
    let jumpscareTimer = 0, jumpscareKind = null, activeEnemy = null, scareFocus = new THREE.Vector3();
    let mannequinsAlerted = false, wardrobeSlamFired = false;
    let lanternCd = 0, lanternActive = 0, hiding = false, savedPos = new THREE.Vector3();
    let playerPos = new THREE.Vector3(0, 1.65, 11), yaw = 0, pitch = 0, bounds = { minX: -6, maxX: 6, minZ: -13, maxZ: 12 };
    let keys = {}, dragLook = false, lx = 0, ly = 0, endingType = 'true';

    let activeCutsceneId = null, cutsceneTime = 0, cutsceneDuration = 0, cutsceneSkipLock = 0.5;
    let cutsceneTriggeredCues = new Set(), cutsceneFiredScenes = new Set();
    let cutsceneDomeLoaded = false, cutsceneOnComplete = null;
    let csSavedPos = new THREE.Vector3(), csSavedYaw = 0, csSavedPitch = 0, csSavedEnemies = [];
    const _csLook = new THREE.Vector3();

    const CUTSCENES = {
      prologue_collapse: {
        duration: 5.2, skipLock: 0.45,
        subs: [
          [0.3, 2.35, 'Bima', 'Dingin itu tidak datang dari salju... ia menjalar dari kesunyian yang selama ini kita biarkan.'],
          [2.95, 5.0, 'Bima', 'Di lorong atas rumah masa kecil ini, seluruh suara hangat seakan membeku di balik pintu.']
        ],
        cues: [[0.25, 'clock'], [1.5, 'whisper'], [2.55, 'ice']]
      },
      babak1_stalker_reveal: {
        duration: 5.4, skipLock: 0.5,
        subs: [[1.0, 4.5, 'Bima', 'Jangan bergerak... ada bayangan di ujung lorong. Wajahnya tertutup topeng porselen tanpa mulut.']],
        cues: [[1.35, 'whisper'], [2.75, 'clock']]
      },
      babak2_authority_reveal: {
        duration: 5.2, skipLock: 0.5,
        subs: [[0.85, 4.4, 'Bima', 'Rantai pintu Ruang BK bergetar... sosok bertubuh tinggi itu menjaga lorong agar tak seorang pun berani melapor.']],
        cues: [[0.9, 'chain'], [2.3, 'whisper']]
      },
      babak3_corridor_dread: {
        duration: 4.8, skipLock: 0.5,
        subs: [[0.75, 4.2, 'Bima', 'Pintunya terbanting menutup jalan pulang. Hanya suar biru Share-Loc di ujung lorong yang masih menyala.']],
        cues: [[0.2, 'door'], [1.65, 'whisper']]
      },
      babak4_dome_intro: {
        duration: 5.4, skipLock: 0.5,
        subs: [[0.45, 4.6, 'Bima', 'Rindi... Kubah Kaca itu menguncinya di tengah badai. Aku harus menyalakan keempat Pilar Perlindungan.']],
        cues: [[0.35, 'clock'], [2.6, 'chime']]
      },
      babak4_liberation: {
        duration: 4.4, skipLock: 0.5,
        subs: [[0.35, 3.6, 'Rindiani', 'Cahaya pilar ini hangat, Bima... es di sekelilingku mulai retak dan mencair.']],
        cues: [[0.2, 'ice'], [1.4, 'chime'], [2.4, 'finalChord']]
      },
      fatal_12s: {
        duration: 12.0, skipLock: 1.6,
        subs: [[6.0, 9.0, 'Rindiani · Suara Melemah', '“' + STORY.cutsceneFatalLine + '”']],
        cues: [[3.05, 'ice'], [9.05, 'finalChord']]
      }
    };

    const easeSine = (v) => -(Math.cos(Math.PI * Math.max(0, Math.min(1, v))) - 1) / 2;
    const easeOut3 = (v) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
    const easeInOut3 = (v) => { const c = Math.max(0, Math.min(1, v)); return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2; };

    function setFadeOpacity(val) {
      document.getElementById('fade-curtain').style.opacity = String(Math.max(0, Math.min(1, val)));
    }

    function applyCinematicEffects(enabled) {
      cinematicEffects = enabled;
      const lbl = 'Efek Kamera Sinematik: ' + (enabled ? 'Aktif' : 'Minimal');
      const bTitle = document.getElementById('btn-fx-title');
      const bPause = document.getElementById('btn-fx-pause');
      if (bTitle) { bTitle.textContent = lbl; bTitle.style.borderColor = enabled ? '#78a9c4' : '#3d4959'; }
      if (bPause) { bPause.textContent = lbl; bPause.style.borderColor = enabled ? '#78a9c4' : '#3d4959'; }
      document.getElementById('fx-scanlines').classList.toggle('hidden-fx', !enabled);
      document.getElementById('fx-grain').classList.toggle('hidden-fx', !enabled);
      document.getElementById('vignette').classList.toggle('hidden-fx', !enabled);
      document.getElementById('cutscene-bar-top').classList.toggle('collapsed', !enabled);
      document.getElementById('cutscene-bar-bot').classList.toggle('collapsed', !enabled);
    }

    const showScreen = (id) => {
      document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
      if (id) document.getElementById(id).classList.add('active');
      document.getElementById('touch-controls').classList.toggle('active', id === 'hud-screen' && controlMode === 'mobile');
      updatePortraitBanner();
    };

    function updatePortraitBanner() {
      const b = document.getElementById('portrait-banner');
      const show = controlMode === 'mobile' && phase === 'playing' && !dismissedPortrait && window.innerHeight > window.innerWidth;
      b.style.display = show ? 'flex' : 'none';
    }

    function applyControlMode(mode) {
      controlMode = mode;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mode === 'mobile' ? 1.5 : 2));
      if (mode === 'mobile' && document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock?.();
      }
      virtX = 0; virtY = 0; virtAutoSprint = false; mobileSprintHeld = false; dragLook = false;
      document.getElementById('ctrl-pc').classList.toggle('selected', mode === 'pc');
      document.getElementById('ctrl-mobile').classList.toggle('selected', mode === 'mobile');
      document.getElementById('ctrl-status-lbl').textContent = mode === 'mobile' ? 'Touchscreen Aktif' : 'Keyboard & Mouse Aktif';
      document.getElementById('btn-ctrl-hud').textContent = mode === 'mobile' ? 'HP' : 'PC';
      document.getElementById('btn-ctrl-pause').textContent = mode === 'mobile' ? 'Mode Kontrol: Mobile' : 'Mode Kontrol: PC';
      document.getElementById('hud-pc-hint').style.display = mode === 'mobile' ? 'none' : 'block';
      document.getElementById('hud-frost-badge').style.display = mode === 'mobile' ? 'none' : 'block';
      document.getElementById('hud-lantern-row').style.display = mode === 'mobile' ? 'none' : 'block';
      document.getElementById('title-hint-line').textContent = mode === 'mobile'
        ? 'Analog Kiri Gerak · Geser Kanan Kamera · Tombol AKSI / LENTERA / LARI · Ketuk Dialog'
        : 'WASD Bergerak · Mouse / Geser Lihat · Shift Lari · F Lentera · E Aksi / Sembunyi · Esc Jeda';
      document.getElementById('pause-ctrl-hint').textContent = mode === 'mobile'
        ? 'Analog Kiri: Gerak (>85% Lari) · Geser Kanan: Kamera · LARI / LENTERA / AKSI: Tombol Kanan Bawah'
        : 'WASD/Panah: Gerak · Mouse/Geser: Lihat · Shift: Lari · F: Lentera Bekukan Bayangan · E: Ambil/Sembunyi/Buka Segel';

      const barsEl = document.getElementById('hud-bars-wrap');
      const slot = document.getElementById(mode === 'mobile' ? 'hud-mobile-bars-slot' : 'hud-pc-bars-slot');
      if (barsEl && slot && barsEl.parentElement !== slot) slot.appendChild(barsEl);

      document.getElementById('touch-controls').classList.toggle('active', phase === 'playing' && mode === 'mobile');
      updatePortraitBanner();
    }

    function updateStabilityUI() {
      const cracks = 5 - stability;
      document.getElementById('hud-stab-txt').textContent = stability + '/5';
      document.getElementById('hud-stab-txt').style.color = stability <= 1 ? '#f87171' : '#78a9c4';
      const bars = document.getElementById('hud-stab-bars').children;
      for (let i = 0; i < 5; i++) {
        const intact = i < stability;
        bars[i].style.borderColor = intact ? (stability <= 1 ? '#f87171' : '#78a9c4') : '#334155';
        bars[i].style.background = intact ? (stability <= 1 ? '#dc2626' : '#38bdf8') : 'rgba(15,23,42,0.75)';
      }
      document.getElementById('crack-t1').style.display = cracks >= 1 ? 'inline' : 'none';
      document.getElementById('crack-t2').style.display = cracks >= 2 ? 'inline' : 'none';
      document.getElementById('crack-t3').style.display = cracks >= 3 ? 'inline' : 'none';
      document.getElementById('crack-t4').style.display = cracks >= 4 ? 'inline' : 'none';
    }

    function playCsCue(c) {
      if (c === 'chain') audio.chainRattle();
      else if (c === 'finalChord') audio.finalChord();
      else audio.cue(c);
    }

    function startCutscene(id, onDone) {
      const spec = CUTSCENES[id];
      if (!spec) { if (onDone) onDone(); return; }
      activeCutsceneId = id; cutsceneTime = 0; cutsceneDuration = spec.duration;
      cutsceneSkipLock = spec.skipLock; cutsceneTriggeredCues = new Set();
      cutsceneDomeLoaded = false; cutsceneOnComplete = onDone || null;
      phase = 'cutscene'; jumpscareTimer = 0; keys = {};
      virtX = 0; virtY = 0; virtAutoSprint = false; mobileSprintHeld = false; dragLook = false;
      document.getElementById('strobe-fx').style.display = 'none';
      document.exitPointerLock?.();

      csSavedPos.copy(playerPos); csSavedYaw = yaw; csSavedPitch = pitch;
      csSavedEnemies = enemies.map(en => ({ pos: en.rig.root.position.clone(), rotY: en.rig.root.rotation.y }));
      enemies.forEach(en => { en.rig.root.visible = true; en.hidden = false; });

      showScreen('cutscene-screen');
      document.getElementById('cutscene-sub-box').style.display = 'none';
      document.getElementById('btn-skip-cutscene').style.display = 'none';
      document.getElementById('cutscene-bar-top').classList.toggle('collapsed', !cinematicEffects);
      document.getElementById('cutscene-bar-bot').classList.toggle('collapsed', !cinematicEffects);

      if (id === 'fatal_12s') {
        audio.glassShatter(); audio.jumpscareShriek();
        const flGroup = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.24, 14), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 }));
        body.rotation.z = Math.PI / 2;
        const lensMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, emissive: 0xfef3c7, emissiveIntensity: 2.0 });
        const beam = new THREE.SpotLight(0xfef3c7, 6.0, 14, Math.PI / 4, 0.5, 1.4);
        const tgt = new THREE.Object3D(); tgt.position.set(4.5, -0.2, 0); beam.target = tgt;
        flGroup.add(body, beam, tgt);
        flGroup.position.set(playerPos.x - Math.sin(yaw) * 1.1, 0.055, playerPos.z - Math.cos(yaw) * 1.1);
        worldRoot.add(flGroup);
        droppedLight = { group: flGroup, beam, lensMat };
      } else if (id === 'prologue_collapse') {
        buildCampus('prologue');
        storyPhase = 'transitioning';
        horrorBlend = Math.max(horrorBlend, 0.85);
        targetHorrorBlend = 1.0;
        applyCampusAtmos(horrorBlend);
      }
    }

    function finishCutscene(skipped = false) {
      const doneId = activeCutsceneId, cb = cutsceneOnComplete;
      if (skipped && (doneId === 'babak1_stalker_reveal' || doneId === 'babak2_authority_reveal' || doneId === 'babak3_corridor_dread')) {
        playerPos.copy(csSavedPos); yaw = csSavedYaw; pitch = csSavedPitch;
        enemies.forEach((en, idx) => { if (csSavedEnemies[idx]) { en.rig.root.position.copy(csSavedEnemies[idx].pos); en.rig.root.rotation.y = csSavedEnemies[idx].rotY; en.rig.root.visible = true; en.hidden = false; } });
      }
      if (doneId === 'babak1_stalker_reveal' || doneId === 'babak2_authority_reveal' || doneId === 'babak3_corridor_dread') {
        enemies.forEach((en, idx) => { if (csSavedEnemies[idx]) { en.rig.root.position.copy(csSavedEnemies[idx].pos); en.rig.root.rotation.y = csSavedEnemies[idx].rotY; en.rig.root.visible = true; en.hidden = false; } });
        graceTimer = Math.max(graceTimer, 2.8);
      }
      activeCutsceneId = null; cutsceneOnComplete = null;
      camera.fov = 72; camera.updateProjectionMatrix(); camera.rotation.z = 0;
      setFadeOpacity(0);
      document.getElementById('cutscene-sub-box').style.display = 'none';
      document.getElementById('btn-skip-cutscene').style.display = 'none';
      if (cb) cb();
      else if (doneId === 'fatal_12s') showGameOver();
    }

    function skipCutscene() {
      if (phase !== 'cutscene' || !activeCutsceneId || cutsceneTime < cutsceneSkipLock) return;
      if (activeCutsceneId === 'prologue_collapse' && !cutsceneDomeLoaded) {
        cutsceneDomeLoaded = true;
        enterLayerRaw(0);
      }
      finishCutscene(true);
    }

    function showGameOver() {
      phase = 'gameover';
      setFadeOpacity(0);
      document.getElementById('cutscene-sub-box').style.display = 'none';
      document.getElementById('btn-skip-cutscene').style.display = 'none';
      const resp = document.getElementById('resp-input').value.trim() || 'Anonim';
      document.getElementById('go-resp').textContent = 'RINGKASAN EVALUASI PjBL · ' + resp.toUpperCase();
      document.getElementById('go-layer').textContent = STORY.layers[layerIdx].roman;
      document.getElementById('go-frags').textContent = totalFrags + '/6';
      document.getElementById('go-score').textContent = Math.round(score) + '%';
      showScreen('gameover-screen');
    }

    // Dialogue Engine
    let dlgLines = [], dlgIdx = 0, dlgChars = 0, dlgTimer = null, dlgCb = null;
    function openDialogue(lines, cb) {
      phase = 'dialogue'; dlgLines = lines; dlgIdx = 0; dlgCb = cb;
      showScreen('dialogue-screen'); renderLine();
    }
    function renderLine() {
      clearInterval(dlgTimer);
      const line = dlgLines[dlgIdx];
      if (!line) { showScreen(null); if (dlgCb) dlgCb(); return; }
      if (dlgLines === STORY.prologue) {
        if (dlgIdx <= 2) { storyPhase = 'calm_before'; targetHorrorBlend = 0; }
        else if (dlgIdx === 3) { storyPhase = 'transitioning'; targetHorrorBlend = 0.52; }
        else { storyPhase = 'transitioning'; targetHorrorBlend = 0.92; }
      }
      if (line.cue) audio.cue(line.cue);
      document.getElementById('dlg-speaker').textContent = line.speaker;
      document.getElementById('dlg-emotion').textContent = line.emotion;
      document.getElementById('dlg-count').textContent = (dlgIdx + 1) + ' / ' + dlgLines.length;
      const textEl = document.getElementById('dlg-text'), hintEl = document.getElementById('dlg-hint');
      dlgChars = 0; textEl.textContent = '';
      const tapTxt = controlMode === 'mobile' ? '[Ketuk Layar]' : '[Spasi / Klik]';
      hintEl.textContent = tapTxt + ' Tampilkan penuh';
      dlgTimer = setInterval(() => {
        dlgChars++; textEl.textContent = line.text.slice(0, dlgChars);
        if (dlgChars % 3 === 1) audio.tone(540, 0.03, 0.025, 'sine');
        if (dlgChars >= line.text.length) { clearInterval(dlgTimer); hintEl.textContent = tapTxt + ' Lanjutkan'; }
      }, 22);
    }
    function advanceDialogue() {
      const line = dlgLines[dlgIdx]; if (!line) return;
      const tapTxt = controlMode === 'mobile' ? '[Ketuk Layar]' : '[Spasi / Klik]';
      if (dlgChars < line.text.length) { clearInterval(dlgTimer); dlgChars = line.text.length; document.getElementById('dlg-text').textContent = line.text; document.getElementById('dlg-hint').textContent = tapTxt + ' Lanjutkan'; return; }
      dlgIdx++; if (dlgIdx < dlgLines.length) renderLine(); else { showScreen(null); if (dlgCb) dlgCb(); }
    }
    document.getElementById('dialogue-screen').onclick = advanceDialogue;

    function enterLayerRaw(idx) {
      layerIdx = idx; collected = 0; exitOpen = false; hiding = false; warmth = Math.min(100, warmth + 25); stamina = 100;
      graceTimer = 2.0; jumpscareTimer = 0; mannequinsAlerted = false; wardrobeSlamFired = false;
      storyPhase = 'horror_after'; horrorBlend = 1; targetHorrorBlend = 1; extraDoorCols = []; mirrorPeekCd = 0;
      hemiLight.color.setHex(0x78a9c4); hemiLight.groundColor.setHex(0x0f172a); hemiLight.intensity = 0.46;
      dirLight.color.setHex(0xffedd5); dirLight.intensity = 0.36;
      snowMat.opacity = 0.72;
      const info = buildGameplayLayer(idx, frost, difficulty);
      bounds = info.bounds; playerPos.copy(info.spawn); yaw = info.yaw; pitch = 0;
      navGrid = buildNavGrid(bounds, colliders, 0.36, idx === 3 ? 0.65 : 0.55);
      enemies.forEach(en => {
        en.aiState = 'patrol'; en.stateTimer = 0; en.repositionCooldown = 3.5;
        en.path = []; en.pathTimer = 0; en.stuckTimer = 0; en.hidden = false; en.lastWhisper = 0;
      });
      const meta = STORY.layers[idx];
      document.getElementById('hud-era').textContent = meta.roman + ' · ' + meta.era;
      document.getElementById('hud-title').textContent = meta.title;
      document.getElementById('hud-hint').textContent = meta.ambientHint;
      updateStabilityUI();
    }

    function enterLayer(idx) {
      enterLayerRaw(idx);
      const finishIntro = () => {
        const intro = STORY.layerIntros[idx];
        if (intro) openDialogue(intro, () => { phase = 'playing'; showScreen('hud-screen'); });
        else { phase = 'playing'; showScreen('hud-screen'); }
      };
      if (idx === 3) startCutscene('babak4_dome_intro', finishIntro);
      else finishIntro();
    }

    function openMirror(mIdx) {
      phase = 'mirror'; document.exitPointerLock?.();
      const q = STORY.mirrors[mIdx];
      document.getElementById('mir-between').textContent = q.betweenLabel;
      document.getElementById('mir-frost').textContent = 'Tingkat Kebekuan: ' + Math.round(frost * 100) + '%';
      document.getElementById('mir-prompt').textContent = q.prompt;
      document.getElementById('mir-context').textContent = q.contextNote;
      const box = document.getElementById('mir-options'); box.innerHTML = '';
      q.options.forEach((opt, i) => {
        const b = document.createElement('button'); b.className = 'choice-btn';
        b.innerHTML = '<div class="serif" style="font-size:15px;font-weight:bold;">' + (i + 1) + '. ' + opt.label + '</div><div class="mono" style="font-size:12px;color:#9aa8b8;margin-top:4px;">' + opt.sublabel + '</div>';
        b.onclick = () => {
          score += opt.awarenessDelta; frost = Math.max(0.15, Math.min(1.0, frost + opt.frostDelta));
          responses.push({ betweenLabel: q.betweenLabel, chosenLabel: opt.label, tag: opt.tag });
          enterLayer(mIdx + 1);
        };
        box.appendChild(b);
      });
      showScreen('mirror-screen');
    }

    function showEnding() {
      phase = 'ending';
      const clamped = Math.max(0, Math.min(100, Math.round(score)));
      endingType = clamped >= 75 ? 'true' : clamped >= 45 ? 'neutral' : 'bad';
      const end = STORY.endings[endingType];
      buildCampus(endingType);
      openDialogue(STORY.epilogues[endingType], () => {
        document.getElementById('end-sub').textContent = end.subtitle;
        document.getElementById('end-sub').style.color = end.accentColor;
        document.getElementById('end-badge').textContent = end.badgeText;
        document.getElementById('end-title').textContent = end.title;
        document.getElementById('end-narr').textContent = end.narrative;
        document.getElementById('end-const').textContent = end.constitutionalSynthesis;
        const mapBox = document.getElementById('end-mappings'); mapBox.innerHTML = '';
        STORY.constitutionalMappings.forEach(m => {
          const d = document.createElement('div');
          d.style.cssText = 'border:1px solid #26303d;background:#080c13;padding:10px;font-size:11px;';
          d.innerHTML = '<div class="mono" style="color:#e2e8f0;font-weight:bold;">' + m.pillar + '</div><div class="mono" style="color:#d4a353;margin-top:3px;">' + m.pancasilaRef + '</div><div class="mono" style="color:#78a9c4;">' + m.uudRef + '</div><div class="mono" style="color:#9aa8b8;margin-top:4px;">' + m.explanation + '</div>';
          mapBox.appendChild(d);
        });
        const resp = document.getElementById('resp-input').value.trim() || 'Anonim';
        document.getElementById('end-resp').textContent = 'REKAP DATA RISET PjBL · RESPONDEN: ' + resp + ' · Fragmen: ' + totalFrags + '/6 · Pilar: 4/4';
        document.getElementById('end-score').textContent = clamped + '%';
        document.getElementById('end-score').style.color = end.accentColor;
        document.getElementById('end-frost').textContent = Math.round(frost * 100) + '%';
        document.getElementById('end-cat').textContent = clamped >= 75 ? 'Tinggi (Sadar Konstitusi & Berpihak pada Korban)' : clamped >= 45 ? 'Sedang (Parsial / Seremonial)' : 'Rendah (Normalisasi Pembiaran)';
        document.getElementById('end-log').innerHTML = responses.map((r, i) => '<div>Cermin ' + (i + 1) + ': ' + r.chosenLabel + ' -> <span style="color:#d4a353;">[' + r.tag + ']</span></div>').join('');
        showScreen('ending-screen');
      });
    }

    // Buttons & Events
    document.getElementById('ctrl-pc').onclick = () => applyControlMode('pc');
    document.getElementById('ctrl-mobile').onclick = () => applyControlMode('mobile');
    document.getElementById('btn-ctrl-hud').onclick = (e) => { e.stopPropagation(); applyControlMode(controlMode === 'pc' ? 'mobile' : 'pc'); };
    document.getElementById('btn-ctrl-pause').onclick = () => applyControlMode(controlMode === 'pc' ? 'mobile' : 'pc');
    document.getElementById('btn-close-portrait').onclick = () => { dismissedPortrait = true; updatePortraitBanner(); };
    window.addEventListener('contextmenu', (e) => e.preventDefault());

    document.getElementById('mode-std').onclick = () => { difficulty = 'standard'; document.getElementById('mode-std').style.cssText = 'border-color:#d4a353;color:#d4a353;'; document.getElementById('mode-story').style.cssText = 'border-color:#3d4959;color:#94a3b8;'; };
    document.getElementById('mode-story').onclick = () => { difficulty = 'story'; document.getElementById('mode-story').style.cssText = 'border-color:#78a9c4;color:#78a9c4;'; document.getElementById('mode-std').style.cssText = 'border-color:#3d4959;color:#94a3b8;'; };
    document.getElementById('toggle-ctrl').onclick = () => {
      const b = document.getElementById('subpanel-box'); b.style.display = b.style.display === 'block' ? 'none' : 'block';
      b.innerHTML = controlMode === 'mobile'
        ? '<b>KONTROL MOBILE:</b> Analog Kiri (Gerak, tarik &gt;85% untuk Lari) · Geser Layar Kanan (Kamera) · [AKSI] (Ambil/Sembunyi/Segel) · [LENTERA] (Bekukan Bayangan) · [LARI] (Toggle Sprint).'
        : '<b>KONTROL PC:</b> WASD/Panah (Gerak) · Mouse/Geser (Lihat) · Shift (Lari) · F (Lentera Bekukan Bayangan) · E (Ambil/Sembunyi/Buka Segel) · Spasi/Klik (Lanjutkan Dialog).';
    };
    document.getElementById('toggle-about').onclick = () => {
      const b = document.getElementById('subpanel-box'); b.style.display = b.style.display === 'block' ? 'none' : 'block';
      b.innerHTML = '<b>RISET PjBL KEWARGANEGARAAN:</b> Media analisis kesadaran mahasiswa terhadap normalisasi budaya pembiaran kekerasan seksual (rape culture). Tinjauan Pancasila &amp; UUD NRI 1945 disajikan pada arsip akhir.';
    };

    const toggleMute = () => {
      audio.init(); audio.setMuted(!audio.muted);
      document.getElementById('btn-mute-title').textContent = audio.muted ? 'Suara Mati' : 'Suara Aktif';
      document.getElementById('btn-mute-hud').textContent = audio.muted ? 'Mati' : 'Suara';
    };
    document.getElementById('btn-mute-title').onclick = toggleMute;
    document.getElementById('btn-mute-hud').onclick = toggleMute;

    function triggerLanternAction() {
      audio.init();
      if (phase !== 'playing' || jumpscareTimer > 0 || hiding || lanternCd > 0) return;
      lanternCd = 8; lanternActive = 1.0; lanternLight.position.set(playerPos.x, 1.5, playerPos.z); lanternLight.intensity = 9;
      audio.lanternPulse();
      enemies.forEach(en => { if (Math.hypot(en.rig.root.position.x - playerPos.x, en.rig.root.position.z - playerPos.z) < 12.5) en.frozen = 4.8; });
    }

    function startNew() {
      audio.init(); score = 0; frost = 0.38; responses = []; totalFrags = 0; warmth = 100; stamina = 100;
      stability = 5; jumpscareCount = 0; graceTimer = 0; jumpscareTimer = 0;
      cutsceneFiredScenes = new Set(); setFadeOpacity(0);
      virtX = 0; virtY = 0; virtAutoSprint = false; mobileSprintHeld = false;
      document.getElementById('strobe-fx').style.display = 'none';
      updateStabilityUI();
      buildCampus('prologue'); phase = 'prologue';
      openDialogue(STORY.prologue, () => {
        startCutscene('prologue_collapse', () => {
          const intro = STORY.layerIntros[0];
          if (intro) openDialogue(intro, () => { phase = 'playing'; showScreen('hud-screen'); });
          else { phase = 'playing'; showScreen('hud-screen'); }
        });
      });
    }
    document.getElementById('btn-start').onclick = startNew;
    document.getElementById('btn-fx-title').onclick = () => applyCinematicEffects(!cinematicEffects);
    document.getElementById('btn-fx-pause').onclick = () => applyCinematicEffects(!cinematicEffects);
    document.getElementById('btn-skip-cutscene').onclick = () => skipCutscene();
    document.getElementById('btn-restart-pause').onclick = startNew;
    document.getElementById('btn-restart-end').onclick = startNew;
    document.getElementById('btn-go-restart').onclick = startNew;
    document.getElementById('btn-title-pause').onclick = () => { phase = 'title'; setFadeOpacity(0); buildCampus('title'); showScreen('title-screen'); };
    document.getElementById('btn-go-title').onclick = () => { phase = 'title'; setFadeOpacity(0); buildCampus('title'); showScreen('title-screen'); };
    document.getElementById('btn-pause').onclick = () => { phase = 'paused'; document.exitPointerLock?.(); document.getElementById('pause-title').textContent = STORY.layers[layerIdx].title; showScreen('pause-screen'); };
    document.getElementById('btn-resume').onclick = () => { phase = 'playing'; showScreen('hud-screen'); if (controlMode === 'pc') renderer.domElement.requestPointerLock?.(); };
    document.getElementById('btn-copy').onclick = () => {
      const txt = document.getElementById('end-resp').textContent + '\\nEnding: ' + document.getElementById('end-title').textContent + '\\nSkor: ' + document.getElementById('end-score').textContent + '\\n' + document.getElementById('end-log').innerText;
      navigator.clipboard?.writeText(txt); document.getElementById('btn-copy').textContent = 'Tersalin ke Clipboard!';
    };
    document.getElementById('btn-go-copy').onclick = () => {
      const txt = document.getElementById('go-resp').textContent + '\\nStatus: GAME OVER (0/5 Kestabilan)\\nLokasi: ' + STORY.layers[layerIdx].roman + '\\nFragmen: ' + totalFrags + '/6\\nKesadaran: ' + Math.round(score) + '%';
      navigator.clipboard?.writeText(txt); document.getElementById('btn-go-copy').textContent = 'DATA EVALUASI TERSALIN!';
    };

    window.addEventListener('keydown', (e) => {
      if (phase === 'cutscene' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape')) { e.preventDefault(); skipCutscene(); return; }
      if (phase === 'dialogue' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) { e.preventDefault(); advanceDialogue(); return; }
      if (e.code === 'Escape' && phase === 'playing') { document.getElementById('btn-pause').click(); return; }
      if (phase !== 'playing' || jumpscareTimer > 0) return;
      if (!keys[e.code]) {
        if (e.code === 'KeyE') interactAction();
        if (e.code === 'KeyF') triggerLanternAction();
      }
      keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { keys[e.code] = false; });
    renderer.domElement.addEventListener('mousedown', (e) => {
      if (controlMode === 'mobile' || phase !== 'playing') return;
      audio.init(); dragLook = true; lx = e.clientX; ly = e.clientY;
      renderer.domElement.requestPointerLock?.();
    });
    window.addEventListener('mouseup', () => { dragLook = false; });
    window.addEventListener('mousemove', (e) => {
      if (controlMode === 'mobile' || phase !== 'playing' || jumpscareTimer > 0) return;
      if (document.pointerLockElement === renderer.domElement) {
        yaw -= e.movementX * 0.0022; pitch = Math.max(-1.2, Math.min(1.2, pitch - e.movementY * 0.0022));
      } else if (dragLook) {
        yaw -= (e.clientX - lx) * 0.0045; pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - ly) * 0.0045));
        lx = e.clientX; ly = e.clientY;
      }
    });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, controlMode === 'mobile' ? 1.5 : 2));
      updatePortraitBanner();
    });
    window.addEventListener('orientationchange', updatePortraitBanner);

    // Multi-Touch Virtual Stick & Camera Zone Handlers
    (function setupTouchControls() {
      const stickZone = document.getElementById('touch-stick-zone');
      const stickBase = document.getElementById('touch-stick-base');
      const stickKnob = document.getElementById('touch-stick-knob');
      const stickLbl = document.getElementById('touch-stick-lbl');
      const camZone = document.getElementById('touch-cam-zone');
      const btnSprint = document.getElementById('touch-sprint');
      const btnLantern = document.getElementById('touch-lantern');
      const btnInteract = document.getElementById('touch-interact');
      const STICK_R = 60;
      let leftId = null, camId = null, camLx = 0, camLy = 0;

      function moveStick(t) {
        const rect = stickBase.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const dx = t.clientX - cx, dy = t.clientY - cy;
        const dist = Math.hypot(dx, dy), cDist = Math.min(STICK_R, dist), ang = Math.atan2(dy, dx);
        const kx = dist > 0.001 ? Math.cos(ang) * cDist : 0, ky = dist > 0.001 ? Math.sin(ang) * cDist : 0;
        stickKnob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
        virtX = kx / STICK_R; virtY = -ky / STICK_R;
        virtAutoSprint = (cDist / STICK_R) > 0.85;
        stickBase.style.borderColor = virtAutoSprint ? 'rgba(212,163,83,0.85)' : 'rgba(120,169,196,0.45)';
        stickLbl.textContent = virtAutoSprint ? 'LARI OTOMATIS' : 'GERAK';
        stickLbl.style.color = virtAutoSprint ? '#d4a353' : 'rgba(138,164,184,0.8)';
      }
      function resetStick() {
        leftId = null; virtX = 0; virtY = 0; virtAutoSprint = false;
        stickKnob.style.transform = 'translate(0px,0px)';
        stickBase.style.borderColor = 'rgba(120,169,196,0.45)';
        stickLbl.textContent = 'GERAK'; stickLbl.style.color = 'rgba(138,164,184,0.8)';
      }

      stickZone.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (leftId !== null || !e.changedTouches[0]) return;
        leftId = e.changedTouches[0].identifier; audio.init(); moveStick(e.changedTouches[0]);
      }, { passive: false });

      camZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (camId !== null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier !== leftId) { camId = t.identifier; camLx = t.clientX; camLy = t.clientY; audio.init(); break; }
        }
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (controlMode !== 'mobile' || phase !== 'playing') return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === leftId) { e.preventDefault(); moveStick(t); }
          else if (t.identifier === camId && jumpscareTimer <= 0) {
            e.preventDefault();
            yaw -= (t.clientX - camLx) * 0.0052;
            pitch = Math.max(-1.25, Math.min(1.25, pitch - (t.clientY - camLy) * 0.0044));
            camLx = t.clientX; camLy = t.clientY;
          }
        }
      }, { passive: false });

      const endTouch = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const id = e.changedTouches[i].identifier;
          if (id === leftId) resetStick();
          if (id === camId) camId = null;
        }
      };
      window.addEventListener('touchend', endTouch, { passive: false });
      window.addEventListener('touchcancel', endTouch, { passive: false });

      btnSprint.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        mobileSprintHeld = !mobileSprintHeld;
        btnSprint.style.borderColor = mobileSprintHeld ? '#d4a353' : 'rgba(120,169,196,0.48)';
        btnSprint.style.color = mobileSprintHeld ? '#f3d28f' : '#cbd5e1';
      }, { passive: false });
      btnLantern.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); triggerLanternAction(); }, { passive: false });
      btnInteract.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); audio.init(); if (phase === 'playing' && jumpscareTimer <= 0) interactAction(); }, { passive: false });
    })();

    applyControlMode(controlMode);

    function findClosest() {
      let best = null, bd = Infinity;
      for (const it of interactables) {
        if (it.collected) continue;
        const d = Math.hypot(playerPos.x - it.position.x, playerPos.z - it.position.z);
        if (d <= it.radius && d < bd) { bd = d; best = it; }
      }
      if (best) return { item: best, hide: -1 };
      let hi = -1, hd = 2.3;
      hidingSpots.forEach((h, i) => { const d = Math.hypot(playerPos.x - h.position.x, playerPos.z - h.position.z); if (d < hd) { hd = d; hi = i; } });
      return { item: null, hide: hi };
    }

    function interactAction() {
      if (hiding) { hiding = false; playerPos.copy(savedPos); return; }
      const { item, hide } = findClosest();
      if (item) {
        if (item.kind === 'fragment' || item.kind === 'pillar') {
          item.collected = true; collected++;
          if (item.kind === 'fragment') { totalFrags++; item.mesh.visible = false; audio.cue('chime'); }
          else {
            const c = item.mesh.getObjectByName('core'), l = item.mesh.getObjectByName('pl');
            if (c) c.material.emissive.setHex(0xd4a353);
            if (l) l.color.setHex(0xd4a353);
            audio.cue('chime');
            if (domeCtrl) domeCtrl.domeLight.color.setHex(collected >= 4 ? 0xd4a353 : 0x78a9c4);
          }
          if (collected >= STORY.layers[layerIdx].totalTargets) exitOpen = true;
          const lines = STORY.fragments[item.id];
          if (lines) openDialogue(lines, () => { phase = 'playing'; showScreen('hud-screen'); });
          return;
        }
        if (item.kind === 'exit') {
          if (!exitOpen) {
            if (layerIdx === 1) audio.chainRattle();
            openDialogue([{ speaker: 'Bima', emotion: 'Memeriksa segel', text: 'Segel masih terkunci. Aku masih perlu mengumpulkan target di area ini.' }], () => { phase = 'playing'; showScreen('hud-screen'); });
            return;
          }
          audio.cue('ice');
          const finish = () => { if (layerIdx < 3) openMirror(layerIdx); else showEnding(); };
          const lines = STORY.fragments[item.id];
          if (layerIdx === 3) { startCutscene('babak4_liberation', finish); return; }
          if (lines && layerIdx < 3) openDialogue(lines, finish); else finish();
          return;
        }
      }
      if (hide >= 0) {
        savedPos.copy(playerPos); hiding = true;
        playerPos.copy(hidingSpots[hide].position); yaw = hidingSpots[hide].lookOutYaw; pitch = 0;
      }
    }

    // --- 2D NAVGRID, AABB & LINE-OF-SIGHT HELPERS ---
    function testAABBs(x, z, r, list) {
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) return true;
      }
      return false;
    }
    function collidesWorld(x, z, r = 0.42, extraCols = null) {
      if (x < bounds.minX + r || x > bounds.maxX - r || z < bounds.minZ + r || z > bounds.maxZ - r) return true;
      if (testAABBs(x, z, r, colliders)) return true;
      if (extraCols && extraCols.length > 0 && testAABBs(x, z, r, extraCols)) return true;
      return false;
    }
    function collides(x, z) { return collidesWorld(x, z, 0.42, extraDoorCols); }

    function resolveCircleAABB(x, z, r, extraCols = null) {
      let px = Math.max(bounds.minX + r, Math.min(bounds.maxX - r, x));
      let pz = Math.max(bounds.minZ + r, Math.min(bounds.maxZ - r, z));
      const pushList = (list) => {
        for (let i = 0; i < list.length; i++) {
          const c = list[i];
          const cx = Math.max(c.minX, Math.min(px, c.maxX)), cz = Math.max(c.minZ, Math.min(pz, c.maxZ));
          const dx = px - cx, dz = pz - cz, d2 = dx * dx + dz * dz;
          if (d2 === 0) {
            const pL = px - c.minX, pR = c.maxX - px, pT = pz - c.minZ, pB = c.maxZ - pz;
            const mp = Math.min(pL, pR, pT, pB);
            if (mp === pL) px = c.minX - r - 0.002;
            else if (mp === pR) px = c.maxX + r + 0.002;
            else if (mp === pT) pz = c.minZ - r - 0.002;
            else pz = c.maxZ + r + 0.002;
          } else if (d2 < r * r) {
            const d = Math.sqrt(d2), push = r - d + 0.001;
            px += (dx / d) * push; pz += (dz / d) * push;
          }
        }
      };
      for (let it = 0; it < 3; it++) {
        pushList(colliders);
        if (extraCols && extraCols.length > 0) pushList(extraCols);
        px = Math.max(bounds.minX + r, Math.min(bounds.maxX - r, px));
        pz = Math.max(bounds.minZ + r, Math.min(bounds.maxZ - r, pz));
      }
      return { x: px, z: pz };
    }

    function segHitsAABB(ax, az, dx, dz, c, pad) {
      const minX = c.minX - pad, maxX = c.maxX + pad, minZ = c.minZ - pad, maxZ = c.maxZ + pad;
      let tMin = 0, tMax = 1;
      if (Math.abs(dx) < 1e-8) { if (ax < minX || ax > maxX) return false; }
      else {
        const inv = 1 / dx; let t1 = (minX - ax) * inv, t2 = (maxX - ax) * inv;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1); tMax = Math.min(tMax, t2); if (tMin > tMax) return false;
      }
      if (Math.abs(dz) < 1e-8) { if (az < minZ || az > maxZ) return false; }
      else {
        const inv = 1 / dz; let t1 = (minZ - az) * inv, t2 = (maxZ - az) * inv;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
        tMin = Math.max(tMin, t1); tMax = Math.min(tMax, t2); if (tMin > tMax) return false;
      }
      return tMax >= 0 && tMin <= 1;
    }

    function hasLOS(ax, az, bx, bz, extraCols = null, pad = 0.08) {
      const dx = bx - ax, dz = bz - az;
      for (let i = 0; i < colliders.length; i++) if (segHitsAABB(ax, az, dx, dz, colliders[i], pad)) return false;
      if (extraCols) for (let i = 0; i < extraCols.length; i++) if (segHitsAABB(ax, az, dx, dz, extraCols[i], pad)) return false;
      return true;
    }

    function inViewCone(px, pz, pyaw, tx, tz, minCos = 0.45) {
      const dx = tx - px, dz = tz - pz, len = Math.hypot(dx, dz);
      if (len < 0.001) return true;
      return ((-Math.sin(pyaw) * dx - Math.cos(pyaw) * dz) / len) >= minCos;
    }

    function buildNavGrid(b, cols, agentR = 0.36, cell = 0.55) {
      const nCols = Math.max(4, Math.ceil((b.maxX - b.minX) / cell));
      const nRows = Math.max(4, Math.ceil((b.maxZ - b.minZ) / cell));
      const blocked = new Uint8Array(nCols * nRows);
      for (let r = 0; r < nRows; r++) {
        const wz = b.minZ + (r + 0.5) * cell;
        for (let c = 0; c < nCols; c++) {
          const wx = b.minX + (c + 0.5) * cell;
          if (wx < b.minX + agentR || wx > b.maxX - agentR || wz < b.minZ + agentR || wz > b.maxZ - agentR || testAABBs(wx, wz, agentR, cols)) {
            blocked[r * nCols + c] = 1;
          }
        }
      }
      return { minX: b.minX, minZ: b.minZ, cell, cols: nCols, rows: nRows, agentR, blocked };
    }

    function cellOk(g, c, r, extraCols) {
      if (c < 0 || c >= g.cols || r < 0 || r >= g.rows) return false;
      if (g.blocked[r * g.cols + c] === 1) return false;
      if (extraCols && extraCols.length > 0) {
        const wx = g.minX + (c + 0.5) * g.cell, wz = g.minZ + (r + 0.5) * g.cell;
        if (testAABBs(wx, wz, g.agentR, extraCols)) return false;
      }
      return true;
    }

    function snapCell(g, c0, r0, extraCols) {
      const cc = Math.max(0, Math.min(g.cols - 1, c0)), rr = Math.max(0, Math.min(g.rows - 1, r0));
      if (cellOk(g, cc, rr, extraCols)) return [cc, rr];
      for (let rad = 1; rad <= 5; rad++) {
        let best = null, bd = Infinity;
        for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
          if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
          const nc = cc + dc, nr = rr + dr;
          if (cellOk(g, nc, nr, extraCols)) { const d = dc * dc + dr * dr; if (d < bd) { bd = d; best = [nc, nr]; } }
        }
        if (best) return best;
      }
      return null;
    }

    const NAV_DIRS = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];
    function findPath(g, sx, sz, gx, gz, extraCols) {
      if (!g) return [];
      const sc0 = Math.floor((sx - g.minX) / g.cell), sr0 = Math.floor((sz - g.minZ) / g.cell);
      const gc0 = Math.floor((gx - g.minX) / g.cell), gr0 = Math.floor((gz - g.minZ) / g.cell);
      const sCell = snapCell(g, sc0, sr0, extraCols), gCell = snapCell(g, gc0, gr0, extraCols);
      if (!sCell || !gCell) return [];
      const [sc, sr] = sCell, [gc, gr] = gCell;
      if (sc === gc && sr === gr) return [{ x: gx, z: gz }];
      const total = g.cols * g.rows;
      const gSc = new Float32Array(total).fill(1e9), fSc = new Float32Array(total).fill(1e9);
      const par = new Int32Array(total).fill(-1), cls = new Uint8Array(total), opn = new Uint8Array(total);
      const sIdx = sr * g.cols + sc, gIdx = gr * g.cols + gc;
      const oct = (c, r) => { const dx = Math.abs(c - gc), dz = Math.abs(r - gr); return dx + dz + (1.4142 - 2) * Math.min(dx, dz); };
      gSc[sIdx] = 0; fSc[sIdx] = oct(sc, sr);
      const heap = [sIdx]; opn[sIdx] = 1;
      const hPush = (v) => { heap.push(v); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (fSc[heap[p]] <= fSc[heap[i]]) break; const tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp; i = p; } };
      const hPop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length > 0) {
          heap[0] = last; let i = 0, n = heap.length;
          while (true) {
            let b = i, l = i * 2 + 1, r = l + 1;
            if (l < n && fSc[heap[l]] < fSc[heap[b]]) b = l;
            if (r < n && fSc[heap[r]] < fSc[heap[b]]) b = r;
            if (b === i) break;
            const tmp = heap[i]; heap[i] = heap[b]; heap[b] = tmp; i = b;
          }
        }
        return top;
      };
      let found = false, exp = 0, maxExp = total * 2;
      while (heap.length > 0 && exp < maxExp) {
        exp++; const cur = hPop(); opn[cur] = 0;
        if (cur === gIdx) { found = true; break; }
        if (cls[cur]) continue; cls[cur] = 1;
        const cc = cur % g.cols, cr = Math.floor(cur / g.cols), cg = gSc[cur];
        for (let i = 0; i < 8; i++) {
          const [dc, dr, cost] = NAV_DIRS[i], nc = cc + dc, nr = cr + dr;
          if (!cellOk(g, nc, nr, extraCols)) continue;
          if (dc !== 0 && dr !== 0 && (!cellOk(g, cc + dc, cr, extraCols) || !cellOk(g, cc, cr + dr, extraCols))) continue;
          const nIdx = nr * g.cols + nc;
          if (cls[nIdx]) continue;
          const tg = cg + cost;
          if (tg < gSc[nIdx]) { par[nIdx] = cur; gSc[nIdx] = tg; fSc[nIdx] = tg + oct(nc, nr); if (!opn[nIdx]) { opn[nIdx] = 1; hPush(nIdx); } }
        }
      }
      if (!found) return [];
      const raw = []; let tr = gIdx;
      while (tr !== -1 && tr !== sIdx) { raw.push({ x: g.minX + (tr % g.cols + 0.5) * g.cell, z: g.minZ + (Math.floor(tr / g.cols) + 0.5) * g.cell }); tr = par[tr]; }
      raw.reverse();
      if (raw.length > 0 && !testAABBs(gx, gz, g.agentR * 0.8, colliders) && (!extraCols || !testAABBs(gx, gz, g.agentR * 0.8, extraCols))) raw[raw.length - 1] = { x: gx, z: gz };
      if (raw.length <= 2) return raw;
      const sm = []; let ax = sx, az = sz, idx = 0;
      while (idx < raw.length) {
        let far = idx;
        for (let j = raw.length - 1; j > idx; j--) {
          if (hasLOS(ax, az, raw[j].x, raw[j].z, extraCols, g.agentR * 0.92)) { far = j; break; }
        }
        sm.push(raw[far]); ax = raw[far].x; az = raw[far].z; idx = far + 1;
      }
      return sm;
    }

    buildCampus('title');
    const clock = new THREE.Clock();
    let titleAng = 0.4, buzzCd = 0;
    const _scareWorld = new THREE.Vector3();

    function animate() {
      requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const vigEl = document.getElementById('vignette');
      const glitchEl = document.getElementById('edge-glitch');

      if (snowPoints.visible) {
        const arr = snowPoints.geometry.attributes.position.array;
        const mult = phase === 'cutscene' ? 2.4 : 1.0;
        for (let i = 0; i < 700; i++) {
          arr[i * 3 + 1] -= 1.6 * mult * dt;
          if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 11.5;
        }
        snowPoints.geometry.attributes.position.needsUpdate = true;
      }

      dustPoints.visible = phase === 'playing';
      if (dustPoints.visible) {
        const dArr = dustPoints.geometry.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
          const idx = i * 3;
          dArr[idx] = playerPos.x + dustBase[idx] + Math.sin(t * 0.45 + i) * 0.16;
          dArr[idx + 1] = dustBase[idx + 1] + Math.cos(t * 0.35 + i) * 0.12;
          dArr[idx + 2] = playerPos.z + dustBase[idx + 2] + Math.cos(t * 0.42 + i) * 0.16;
        }
        dustPoints.geometry.attributes.position.needsUpdate = true;
      }

      if (phase !== 'playing') {
        vigEl.classList.remove('low-health-pulse');
        if (storyPhase === 'calm_before') vigEl.style.background = 'none';
        if (glitchEl) glitchEl.style.display = 'none';
      }

      if (phase === 'cutscene' && activeCutsceneId) {
        cutsceneTime += dt;
        const spec = CUTSCENES[activeCutsceneId];
        if (!spec || cutsceneTime >= cutsceneDuration) { finishCutscene(false); return; }

        spec.cues.forEach(([at, cue], ci) => {
          if (cutsceneTime >= at && !cutsceneTriggeredCues.has(ci)) { cutsceneTriggeredCues.add(ci); playCsCue(cue); }
        });

        let sub = null;
        for (let si = 0; si < spec.subs.length; si++) {
          if (cutsceneTime >= spec.subs[si][0] && cutsceneTime <= spec.subs[si][1]) { sub = spec.subs[si]; break; }
        }
        const subBox = document.getElementById('cutscene-sub-box');
        if (sub) {
          subBox.style.display = 'block';
          document.getElementById('cutscene-sub-speaker').textContent = sub[2];
          document.getElementById('cutscene-sub-text').textContent = sub[3];
        } else {
          subBox.style.display = 'none';
        }
        document.getElementById('btn-skip-cutscene').style.display = cutsceneTime >= cutsceneSkipLock ? 'inline-block' : 'none';

        let fade = 0;
        if (activeCutsceneId === 'prologue_collapse') {
          if (cutsceneTime >= 2.1 && cutsceneTime <= 2.65) fade = easeSine((cutsceneTime - 2.1) / 0.55);
          else if (cutsceneTime > 2.65 && cutsceneTime <= 3.45) fade = 1 - easeOut3((cutsceneTime - 2.65) / 0.8);
        } else if (activeCutsceneId === 'babak4_liberation') {
          fade = cutsceneTime >= 3.25 ? easeSine((cutsceneTime - 3.25) / 1.15) : (cutsceneTime < 0.45 ? 0.45 * (1 - easeOut3(cutsceneTime / 0.45)) : 0);
        } else if (activeCutsceneId === 'fatal_12s') {
          fade = cutsceneTime >= 11.1 ? easeSine((cutsceneTime - 11.1) / 0.9) : 0;
        } else {
          if (cutsceneTime < 0.35) fade = 0.35 * (1 - easeOut3(cutsceneTime / 0.35));
          else if (cutsceneTime > cutsceneDuration - 0.35) fade = 0.35 * easeSine((cutsceneTime - (cutsceneDuration - 0.35)) / 0.35);
        }
        setFadeOpacity(fade);

        if (activeCutsceneId === 'prologue_collapse') {
          flashlight.intensity = 0;
          if (cutsceneTime < 2.65) {
            horrorBlend += (1 - horrorBlend) * (1 - Math.exp(-3.2 * dt));
            applyCampusAtmos(horrorBlend);
            const p = easeInOut3(cutsceneTime / 2.65);
            if (campusRindi) posePerson(campusRindi, 'seated', t);
            if (campusBima) posePerson(campusBima, 'idle', t);
            camera.position.set(THREE.MathUtils.lerp(2.45, 0.72, p), THREE.MathUtils.lerp(1.68, 1.32, p), THREE.MathUtils.lerp(2.1, 0.25, p));
            _csLook.set(THREE.MathUtils.lerp(0.25, 0.0, p), THREE.MathUtils.lerp(1.02, 0.92, p), THREE.MathUtils.lerp(-0.45, -1.16, p));
            camera.lookAt(_csLook); camera.rotation.z = cinematicEffects ? -0.025 * p : 0;
            if (cinematicEffects) { camera.fov = THREE.MathUtils.lerp(72, 62, p); camera.updateProjectionMatrix(); }
          } else {
            if (!cutsceneDomeLoaded) { cutsceneDomeLoaded = true; enterLayerRaw(0); }
            const p = easeOut3((cutsceneTime - 2.65) / 2.55);
            flashlight.intensity = THREE.MathUtils.lerp(0.8, 5.2, p);
            camera.position.set(0, THREE.MathUtils.lerp(1.42, 1.65, p), THREE.MathUtils.lerp(7.4, 13.6, p));
            camera.lookAt(0, THREE.MathUtils.lerp(1.25, 1.58, p), THREE.MathUtils.lerp(-2.5, 4.0, p));
            camera.rotation.z = 0;
            if (cinematicEffects) { camera.fov = THREE.MathUtils.lerp(64, 72, p); camera.updateProjectionMatrix(); }
          }
          audio.update(dt, 0.45, 99, false, false, false, 'snow', 0, false, horrorBlend, 1);
        } else if (activeCutsceneId === 'babak1_stalker_reveal') {
          flashlight.intensity = 3.2 + Math.sin(t * 17) * 0.8;
          const en = enemies[0];
          const p = cutsceneTime / cutsceneDuration;
          if (en) {
            poseShadow(en.rig, 'shadowStalk', t, 0.95);
            if (cutsceneTime < 1.9) {
              const s = easeInOut3(cutsceneTime / 1.9);
              en.rig.root.position.set(THREE.MathUtils.lerp(-2.2, 0.1, s), 0, -9.5);
              en.rig.root.rotation.y = Math.PI / 2;
            } else if (cutsceneTime < 3.7) {
              poseShadow(en.rig, 'shadowStare', t, 0.8);
              en.rig.root.position.set(0.1, 0, -9.5);
              en.rig.root.rotation.y = THREE.MathUtils.lerp(Math.PI / 2, 0, easeOut3((cutsceneTime - 1.9) / 0.8));
            } else {
              const r = easeInOut3((cutsceneTime - 3.7) / 1.7);
              en.rig.root.position.set(THREE.MathUtils.lerp(0.1, 3.8, r), 0, -9.5);
              en.rig.root.rotation.y = Math.PI / 2;
            }
          }
          const camP = easeInOut3(p);
          camera.position.set(THREE.MathUtils.lerp(csSavedPos.x, 0, Math.min(1, camP * 1.4)), 1.55, THREE.MathUtils.lerp(csSavedPos.z, -2.1, camP));
          camera.lookAt(0, 1.48, -9.5);
          if (cinematicEffects) { camera.fov = THREE.MathUtils.lerp(72, 54, Math.sin(Math.PI * Math.min(1, p * 1.15))); camera.updateProjectionMatrix(); }
          audio.update(dt, frost, 4.8, false, false, false, 'wood', 0, false, 1, 1);
        } else if (activeCutsceneId === 'babak2_authority_reveal') {
          flashlight.intensity = Math.sin(t * 24) > -0.3 ? 3.8 : 0.45;
          const en = enemies[0];
          const p = cutsceneTime / cutsceneDuration;
          if (en) {
            poseShadow(en.rig, 'shadowStalk', t, 0.9);
            if (cutsceneTime < 3.4) {
              en.rig.root.position.set(0, 0, THREE.MathUtils.lerp(-18.5, -14.8, easeInOut3(cutsceneTime / 3.4)));
              en.rig.root.rotation.y = 0;
            } else {
              en.rig.root.position.set(0, 0, THREE.MathUtils.lerp(-14.8, -20.5, easeInOut3((cutsceneTime - 3.4) / 1.8)));
              en.rig.root.rotation.y = Math.PI;
            }
          }
          flickerLights.forEach(fl => { const on = Math.sin(t * 22 + fl.seed) > -0.45; fl.light.intensity = on ? 2.3 : 0.1; fl.mat.emissiveIntensity = on ? 1.8 : 0.08; });
          camera.position.set(Math.sin(p * Math.PI) * 0.24, 1.48, THREE.MathUtils.lerp(csSavedPos.z, -10.4, easeSine(p)));
          camera.lookAt(0, 1.65, -16.2);
          if (cinematicEffects) { camera.fov = THREE.MathUtils.lerp(72, 56, easeSine(p)); camera.updateProjectionMatrix(); }
          audio.update(dt, frost, 4.2, false, false, false, 'tile', 1, false, 1, 1);
        } else if (activeCutsceneId === 'babak3_corridor_dread') {
          flashlight.intensity = 4.4;
          const p = cutsceneTime / cutsceneDuration;
          autoDoors.forEach(d => { d.pivot.rotation.y += (d.targetYaw - d.pivot.rotation.y) * Math.min(1, dt * 14); });
          beaconRipples.forEach(r => { const rp = (t * 0.85) % 1; r.scale.set(0.75 + rp * 2.2, 0.75 + rp * 2.2, 1); r.material.opacity = (1 - rp) * 0.72; });
          const en = enemies[0];
          if (en) {
            poseShadow(en.rig, 'shadowStare', t, 0.9);
            en.rig.root.position.set(THREE.MathUtils.lerp(2.2, 0.15, easeOut3(p)), 0, -28.5);
            en.rig.root.rotation.y = 0;
          }
          camera.position.set(THREE.MathUtils.lerp(csSavedPos.x, 0, Math.min(1, p * 1.5)), 1.58, THREE.MathUtils.lerp(csSavedPos.z, -24.6, easeInOut3(p)));
          camera.lookAt(0, 1.45, -30.5);
          if (cinematicEffects) { camera.fov = THREE.MathUtils.lerp(72, 58, Math.sin(Math.PI * p)); camera.updateProjectionMatrix(); }
          audio.update(dt, frost, 4.0, false, false, false, 'tile', 2, false, 1, 1);
        } else if (activeCutsceneId === 'babak4_dome_intro') {
          flashlight.intensity = 1.2;
          const p = easeInOut3(cutsceneTime / cutsceneDuration);
          if (domeCtrl) posePerson(domeCtrl.rindi, 'seated', t);
          const ang = THREE.MathUtils.lerp(-0.35, 0.52, p);
          const rad = THREE.MathUtils.lerp(13.5, 5.4, p);
          camera.position.set(Math.sin(ang) * rad, THREE.MathUtils.lerp(4.4, 1.78, p), Math.cos(ang) * rad);
          camera.lookAt(0, 1.08, 0);
          if (cinematicEffects) { camera.fov = THREE.MathUtils.lerp(76, 62, p); camera.updateProjectionMatrix(); }
          audio.update(dt, frost, 14, false, false, false, 'snow', 3, false, 1, 1);
        } else if (activeCutsceneId === 'babak4_liberation') {
          flashlight.intensity = 0;
          const p = easeInOut3(cutsceneTime / cutsceneDuration);
          if (domeCtrl) {
            posePerson(domeCtrl.rindi, p > 0.35 ? 'idle' : 'seated', t);
            domeCtrl.domeMesh.material.opacity = THREE.MathUtils.lerp(0.52, 0.08, p);
            domeCtrl.domeMesh.material.color.setHex(0xd4a353);
            domeCtrl.domeLight.color.setHex(0xd4a353);
            domeCtrl.domeLight.intensity = THREE.MathUtils.lerp(2.8, 6.2, p);
          }
          camera.position.set(THREE.MathUtils.lerp(0.45, 0.0, p), THREE.MathUtils.lerp(1.45, 1.62, p), THREE.MathUtils.lerp(4.2, 2.55, p));
          camera.lookAt(0, 1.15, 0);
          if (cinematicEffects) { camera.fov = THREE.MathUtils.lerp(68, 56, p); camera.updateProjectionMatrix(); }
          audio.update(dt, 0.15, 99, false, false, false, 'snow', 3, false, 1 - p, 1);
        } else if (activeCutsceneId === 'fatal_12s') {
          flashlight.intensity = 0;
          if (cutsceneTime < 3.0) {
            if (droppedLight) {
              droppedLight.group.position.z -= dt * 0.14;
              droppedLight.group.rotation.x = Math.min(0.65, cutsceneTime * 0.28);
              const flk = (cutsceneTime > 0.7 && cutsceneTime < 0.88) || (cutsceneTime > 1.35 && cutsceneTime < 1.54) || (cutsceneTime > 2.05 && cutsceneTime < 2.26);
              droppedLight.beam.intensity = cutsceneTime >= 2.55 ? 0 : (flk ? 0.4 : 6.2);
            }
            const dp = droppedLight ? droppedLight.group.position : playerPos;
            camera.position.set(playerPos.x + Math.sin(yaw) * 0.35, THREE.MathUtils.lerp(1.3, 0.22, Math.min(1, cutsceneTime * 1.8)), playerPos.z + Math.cos(yaw) * 0.35);
            camera.lookAt(dp.x, 0.06, dp.z);
            camera.rotation.z = THREE.MathUtils.lerp(0, 1.31, Math.min(1, cutsceneTime * 2.2));
          } else {
            if (!cutsceneDomeLoaded) {
              cutsceneDomeLoaded = true;
              buildGameplayLayer(3, 0.9, difficulty);
              enemies = [];
              if (domeCtrl) domeCtrl.tendrilGroup.visible = true;
              for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 + 0.25;
                const sh = createShadow(i % 2 === 0);
                sh.root.position.set(Math.cos(a) * 3.85, 0, Math.sin(a) * 3.85);
                sh.root.lookAt(0, 0, 0); worldRoot.add(sh.root); cutsceneShadows.push(sh);
              }
              audio.glassShatter();
            }
            cutsceneShadows.forEach((sh, i) => poseShadow(sh, 'shadowStalk', t + i, 0.9));
            if (cutsceneTime < 6.0) {
              const lt = (cutsceneTime - 3.0) / 3.0;
              if (domeCtrl) {
                domeCtrl.tendrilGroup.scale.set(1, THREE.MathUtils.lerp(0.05, 1.18, Math.min(1, lt * 1.4)), 1);
                posePerson(domeCtrl.rindi, 'seated', t);
              }
              const oa = 0.3 + lt * 0.7;
              camera.position.set(Math.sin(oa) * 5.6, 1.85, Math.cos(oa) * 5.6);
              camera.lookAt(0, 1.05, 0); camera.rotation.z = 0;
            } else if (cutsceneTime < 9.0) {
              const lt = (cutsceneTime - 6.0) / 3.0;
              if (domeCtrl) {
                posePerson(domeCtrl.rindi, 'seated', t, lt > 0.42);
                domeCtrl.domeMesh.material.opacity = THREE.MathUtils.lerp(0.5, 0.97, Math.max(0, (lt - 0.3) / 0.7));
                domeCtrl.domeMesh.material.color.setHex(0x0c1b2e);
                if (lt > 0.92) domeCtrl.rindi.root.visible = false;
              }
              camera.position.set(0.18, 1.05, 1.62 + lt * 0.75); camera.lookAt(0, 0.92, 0.05);
            } else {
              const lt = (cutsceneTime - 9.0) / 3.0;
              camera.position.set(0, THREE.MathUtils.lerp(2.4, 10.5, lt), THREE.MathUtils.lerp(4.2, 13.5, lt));
              camera.lookAt(0, 0.8, 0);
            }
          }
          audio.update(dt, 1.0, 2.5, false, false, false, 'snow', layerIdx, false, 1, 0);
        }
        renderer.render(scene, camera);
        return;
      }

      const isPrologueState = phase === 'prologue' || (phase === 'dialogue' && dlgLines === STORY.prologue);
      if (phase === 'title') {
        flashlight.intensity = 0; titleAng += dt * 0.14;
        horrorBlend += (targetHorrorBlend - horrorBlend) * (1 - Math.exp(-2.4 * dt));
        applyCampusAtmos(horrorBlend);
        camera.position.set(Math.sin(titleAng) * 4.8, 1.85, 1.6 + Math.cos(titleAng) * 2.8);
        camera.lookAt(0, 0.95, -1.0); camera.rotation.z = 0;
        if (campusRindi) posePerson(campusRindi, 'seated', t);
        audio.update(dt, frost, 99, false, false, false, 'snow', 0, false, horrorBlend, 1);
      } else if (isPrologueState || phase === 'ending' || (phase === 'dialogue' && campusRindi)) {
        flashlight.intensity = 0;
        if (isPrologueState) {
          horrorBlend += (targetHorrorBlend - horrorBlend) * (1 - Math.exp(-2.4 * dt));
          applyCampusAtmos(horrorBlend);
          const pushIn = horrorBlend * 0.55;
          camera.position.set(2.55 - pushIn * 0.45, 1.72 - pushIn * 0.18, 2.35 - pushIn * 0.8);
          camera.lookAt(0.35 - pushIn * 0.18, 1.05 - pushIn * 0.05, -0.5 - pushIn * 0.35);
          if (campusRindi) posePerson(campusRindi, 'seated', t);
          if (campusBima) posePerson(campusBima, 'idle', t);
          audio.update(dt, frost, 99, false, false, false, 'snow', 0, false, horrorBlend, 1);
        } else if (endingType === 'true') {
          camera.position.set(0.2, 1.78, 4.4); camera.lookAt(0, 1.15, -1.5);
          if (campusRindi) posePerson(campusRindi, 'idle', t);
          if (campusBima) posePerson(campusBima, 'idle', t);
          audio.update(dt, frost, 99, false, false, false, 'snow', 0, false, 0, 1);
        } else {
          camera.position.set(2.55, 1.72, 2.35); camera.lookAt(0.35, 1.05, -0.5);
          if (campusRindi) posePerson(campusRindi, 'seated', t);
          if (campusBima) posePerson(campusBima, 'idle', t);
          audio.update(dt, frost, 99, false, false, false, 'snow', 0, false, 1, 1);
        }
      } else if (phase !== 'playing') {
        audio.update(dt, frost, 99, hiding, false, false, 'snow', layerIdx, false, horrorBlend, stability / 5);
      } else if (phase === 'playing') {
        animated.forEach(a => {
          if (a.mode === 'pencil') a.mesh.rotation.y += dt * 0.72;
          else { a.mesh.rotation.y += dt * 1.1; a.mesh.position.y += Math.sin(t * 2.4) * 0.0018; }
        });
        curtains.forEach((c, i) => { c.rotation.z = Math.sin(t * 1.6 + i) * 0.05; });
        clockHands.forEach(h => { h.rotation.z -= dt * (2.6 + (Math.sin(t * 7.5) > 0.35 ? 1.8 : -0.4)); });
        if (buzzCd > 0) buzzCd -= dt;
        flickerLights.forEach(fl => {
          const on = Math.sin(t * 19 + fl.seed) * Math.sin(t * 7.3 + fl.seed) > -0.58;
          fl.light.intensity = on ? 2.1 : 0.12; fl.mat.emissiveIntensity = on ? 1.6 : 0.08;
          if (!on && buzzCd <= 0) { buzzCd = 2.6; audio.electricBuzz(); }
        });
        beaconRipples.forEach(r => {
          const p = (t * 0.85) % 1; r.scale.set(0.75 + p * 2.2, 0.75 + p * 2.2, 1); r.material.opacity = (1 - p) * 0.72;
        });
        mannequins.forEach(m => { posePerson(m, 'idle', t); if (mannequinsAlerted) m.head.lookAt(playerPos.x, 1.55, playerPos.z); });
        if (domeCtrl) posePerson(domeCtrl.rindi, 'seated', t);

        if (jumpscareTimer > 0) {
          jumpscareTimer -= dt;
          const st = Math.floor(t * 22) % 2;
          const sEl = document.getElementById('strobe-fx');
          sEl.style.display = 'block';
          sEl.style.background = st === 0 ? 'rgba(220,38,38,0.28)' : 'rgba(37,99,235,0.28)';
          flashlight.color.setHex(st === 0 ? 0xff3b3b : 0x3b82f6); flashlight.intensity = 9.0;
          if (jumpscareKind === 'entity' && activeEnemy) { activeEnemy.rig.maskAnchor.getWorldPosition(_scareWorld); scareFocus.copy(_scareWorld); }
          camera.position.set(playerPos.x + (Math.random() - 0.5) * 0.14, playerPos.y + (Math.random() - 0.5) * 0.14, playerPos.z);
          camera.lookAt(scareFocus); camera.rotation.z = (Math.random() - 0.5) * 0.12;
          if (jumpscareTimer <= 0) {
            sEl.style.display = 'none'; flashlight.color.setHex(0xfef3c7); camera.rotation.z = 0;
            if (jumpscareKind === 'entity') {
              const bx = playerPos.x + Math.sin(yaw) * 1.4, bz = playerPos.z + Math.cos(yaw) * 1.4;
              if (!collides(bx, playerPos.z)) playerPos.x = bx; if (!collides(playerPos.x, bz)) playerPos.z = bz;
              graceTimer = 4.0;
              if (activeEnemy) { activeEnemy.rig.root.position.copy(activeEnemy.waypoints[0]); activeEnemy.frozen = 4.2; activeEnemy = null; }
            }
            jumpscareKind = null;
          }
          renderer.render(scene, camera);
          return;
        }

        flashlight.color.setHex(0xfef3c7);
        if (graceTimer > 0) graceTimer = Math.max(0, graceTimer - dt);
        if (lanternCd > 0) lanternCd = Math.max(0, lanternCd - dt);
        if (lanternActive > 0) { lanternActive = Math.max(0, lanternActive - dt); lanternLight.intensity = lanternActive * 10; }

        let moving = false, sprint = false;
        if (!hiding) {
          const kz = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
          const kx = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
          let mz = kz + virtY, mx = kx + virtX;
          const rawMag = Math.hypot(mx, mz);
          if (rawMag > 0.08) {
            moving = true;
            const cMag = Math.min(1, rawMag);
            mx /= rawMag; mz /= rawMag;
            if ((keys['ShiftLeft'] || keys['ShiftRight'] || virtAutoSprint || mobileSprintHeld) && stamina > 5) { sprint = true; stamina = Math.max(0, stamina - 28 * dt); }
            else stamina = Math.min(100, stamina + 12 * dt);
            const spd = (sprint ? 6.2 : 3.85) * cMag;
            const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
            const vx = fx * mz + rx * mx, vz = fz * mz + rz * mx;
            const nx = playerPos.x + vx * spd * dt, nz = playerPos.z + vz * spd * dt;
            if (!collides(nx, playerPos.z)) playerPos.x = nx;
            if (!collides(playerPos.x, nz)) playerPos.z = nz;
          } else stamina = Math.min(100, stamina + 20 * dt);
        } else stamina = Math.min(100, stamina + 24 * dt);

        autoDoors.forEach(d => {
          if (!d.triggered && playerPos.z < d.triggerZ) {
            d.triggered = true; audio.cue('door'); audio.cue('whisper');
            if (layerIdx === 2 && !cutsceneFiredScenes.has('babak3_corridor_dread')) {
              cutsceneFiredScenes.add('babak3_corridor_dread');
              startCutscene('babak3_corridor_dread', () => { phase = 'playing'; showScreen('hud-screen'); });
            }
          }
          if (d.triggered) d.pivot.rotation.y += (d.targetYaw - d.pivot.rotation.y) * Math.min(1, dt * 14);
        });
        if (phase !== 'playing') { renderer.render(scene, camera); return; }

        if (layerIdx === 0 && !hiding && !cutsceneFiredScenes.has('babak1_stalker_reveal') && Math.abs(playerPos.x) < 1.85 && playerPos.z < 1.8 && playerPos.z > -1.6) {
          cutsceneFiredScenes.add('babak1_stalker_reveal');
          startCutscene('babak1_stalker_reveal', () => { phase = 'playing'; showScreen('hud-screen'); });
          renderer.render(scene, camera); return;
        }
        if (layerIdx === 1 && !hiding && !cutsceneFiredScenes.has('babak2_authority_reveal') && Math.abs(playerPos.x) < 2.1 && playerPos.z < -6.8 && playerPos.z > -10.2) {
          cutsceneFiredScenes.add('babak2_authority_reveal');
          startCutscene('babak2_authority_reveal', () => { phase = 'playing'; showScreen('hud-screen'); });
          renderer.render(scene, camera); return;
        }

        envScares.forEach(sc => {
          if (!sc.fired && !hiding && Math.hypot(playerPos.x - sc.position.x, playerPos.z - sc.position.z) <= sc.radius) {
            sc.fired = true; jumpscareKind = sc.kind; jumpscareTimer = 0.72; scareFocus.copy(sc.focus);
            if (sc.kind === 'wardrobe') { wardrobeSlamFired = true; audio.cue('door'); audio.jumpscareShriek(); }
            else if (sc.kind === 'mannequins') { mannequinsAlerted = true; audio.metalBang(); }
            else if (sc.kind === 'glitchPhone') { if (sc.glitchGroup) { sc.glitchGroup.visible = true; sc.glitchGroup.lookAt(playerPos.x, 1.75, playerPos.z); } audio.notifGlitch(); audio.jumpscareShriek(); }
          }
          if (sc.fired && sc.kind === 'wardrobe' && wardrobeSlamFired) {
            if (sc.pL) sc.pL.rotation.y += (-1.9 - sc.pL.rotation.y) * Math.min(1, dt * 15);
            if (sc.pR) sc.pR.rotation.y += (1.9 - sc.pR.rotation.y) * Math.min(1, dt * 15);
          }
        });

        storyTriggers.forEach(tr => {
          if (!tr.fired && Math.hypot(playerPos.x - tr.position.x, playerPos.z - tr.position.z) <= tr.radius) {
            tr.fired = true; const lines = STORY.triggers[tr.id];
            if (lines) openDialogue(lines, () => { phase = 'playing'; showScreen('hud-screen'); });
          }
        });

        extraDoorCols = (layerIdx === 2 && autoDoors.some(d => d.triggered))
          ? [{ minX: -1.95, maxX: 1.95, minZ: -22.45, maxZ: -21.95 }]
          : [];

        if (mirrorPeekCd > 0) mirrorPeekCd = Math.max(0, mirrorPeekCd - dt);
        if (layerIdx === 2 && !hiding && mirrorPeekCd <= 0 && mirrorFrames.length > 0) {
          for (let mi = 0; mi < mirrorFrames.length; mi++) {
            const mf = mirrorFrames[mi];
            if (Math.hypot(playerPos.x - mf.position.x, playerPos.z - mf.position.z) < 4.2 && inViewCone(playerPos.x, playerPos.z, yaw, mf.position.x, mf.position.z, 0.55)) {
              mirrorPeekCd = 14.0;
              audio.apparitionShift(mf.position.x > playerPos.x ? 0.55 : -0.55);
              audio.cue('whisper');
              break;
            }
          }
        }

        let near = 99;
        for (let ei = 0; ei < enemies.length; ei++) {
          const en = enemies[ei], ep = en.rig.root.position;
          const dist = Math.hypot(ep.x - playerPos.x, ep.z - playerPos.z);
          if (!en.hidden && dist < near) near = dist;
          if (en.repositionCooldown > 0) en.repositionCooldown = Math.max(0, en.repositionCooldown - dt);
          if (en.pathTimer > 0) en.pathTimer = Math.max(0, en.pathTimer - dt);

          if (en.frozen > 0) {
            en.frozen -= dt; en.aiState = 'frozenByLantern'; en.rig.root.visible = true; en.hidden = false;
            poseShadow(en.rig, 'shadowStare', t + ei, 0.25); continue;
          }

          if (en.aiState === 'repositionHidden') {
            en.stateTimer = Math.max(0, (en.stateTimer || 0) - dt);
            en.rig.root.visible = false; en.hidden = true;
            if (en.stateTimer <= 0) {
              let relocated = false;
              for (let att = 0; att < 16; att++) {
                const ang = Math.random() * Math.PI * 2, rad = 5.6 + Math.random() * 5.2;
                const cx = playerPos.x + Math.cos(ang) * rad, cz = playerPos.z + Math.sin(ang) * rad;
                if (inViewCone(playerPos.x, playerPos.z, yaw, cx, cz, 0.2)) continue;
                if (collidesWorld(cx, cz, 0.46, extraDoorCols)) continue;
                if (!hasLOS(cx, cz, playerPos.x, playerPos.z, extraDoorCols, 0.15)) continue;
                ep.set(cx, 0, cz); relocated = true; break;
              }
              en.rig.root.visible = true; en.hidden = false; en.path = []; en.stuckTimer = 0;
              en.aiState = relocated ? 'stalkWatch' : 'patrol';
              en.stateTimer = relocated ? 2.4 : 0; en.repositionCooldown = 11.0;
              if (relocated) {
                const pan = Math.sin(yaw) * (ep.z - playerPos.z) - Math.cos(yaw) * (ep.x - playerPos.x);
                audio.apparitionShift(Math.max(-0.85, Math.min(0.85, -pan * 0.12)));
              }
            }
            continue;
          }

          en.rig.root.visible = true; en.hidden = false;
          const los = hasLOS(ep.x, ep.z, playerPos.x, playerPos.z, extraDoorCols, 0.08);
          const cone = inViewCone(playerPos.x, playerPos.z, yaw, ep.x, ep.z, 0.52);
          const det = difficulty === 'story' ? 6.2 : 9.5 + frost * 4;
          const canChase = !hiding && graceTimer <= 0 && dist < det && (los || dist < 5.0);

          if (hiding || graceTimer > 0) {
            en.aiState = 'patrol'; en.chase = false;
          } else if (en.aiState !== 'chase' && los && cone && dist > 3.8 && dist < 13.5) {
            if (en.aiState !== 'freezeOnLook') { en.aiState = 'freezeOnLook'; en.stateTimer = 0; }
            else {
              en.stateTimer += dt;
              if (en.stateTimer > 1.55) {
                if (dist < 7.5) en.aiState = 'chase';
                else if (en.repositionCooldown <= 0 && difficulty !== 'story') {
                  en.aiState = 'repositionHidden'; en.stateTimer = 0.85; en.repositionCooldown = 10.0;
                  audio.apparitionShift(0); continue;
                } else en.aiState = 'chase';
              }
            }
            en.chase = false;
          } else if (canChase) {
            en.aiState = (!cone && dist > 5.4 && dist < 12.2 && en.aiState !== 'chase') ? 'stalkWatch' : 'chase';
            en.chase = en.aiState === 'chase';
          } else if (en.aiState === 'chase' && dist < det + 3.2 && los) {
            en.chase = true;
          } else {
            en.aiState = 'patrol'; en.chase = false;
          }

          if (en.aiState === 'freezeOnLook') {
            poseShadow(en.rig, 'shadowStare', t + ei, 0.9);
            en.rig.root.rotation.y = Math.atan2(playerPos.x - ep.x, playerPos.z - ep.z);
            if (dist < 7.0 && t - (en.lastWhisper || 0) > 6.5) { en.lastWhisper = t; audio.cue('whisper'); }
            continue;
          }

          poseShadow(en.rig, 'shadowStalk', t + ei, en.aiState === 'chase' ? 1.18 : 0.88);
          const tgt = (en.aiState === 'chase' || en.aiState === 'stalkWatch') ? playerPos : en.waypoints[en.wp];
          const gDist = Math.hypot(tgt.x - ep.x, tgt.z - ep.z);
          if (en.aiState === 'patrol' && gDist < 0.72) {
            en.wp = (en.wp + 1) % en.waypoints.length; en.path = [];
          } else {
            let sx = tgt.x, sz = tgt.z;
            if (!hasLOS(ep.x, ep.z, tgt.x, tgt.z, extraDoorCols, 0.42) && navGrid) {
              if (!en.path || en.path.length === 0 || en.pathTimer <= 0) {
                en.path = findPath(navGrid, ep.x, ep.z, tgt.x, tgt.z, extraDoorCols);
                en.pathTimer = 0.36;
              }
              while (en.path.length > 0 && Math.hypot(en.path[0].x - ep.x, en.path[0].z - ep.z) < 0.42) en.path.shift();
              if (en.path.length > 0) { sx = en.path[0].x; sz = en.path[0].z; }
            } else { en.path = []; }

            const dx = sx - ep.x, dz = sz - ep.z, td = Math.hypot(dx, dz);
            if (td > 0.04) {
              const ms = en.aiState === 'chase' ? en.speed * 1.15 : en.aiState === 'stalkWatch' ? en.speed * 0.86 : en.speed * 0.72;
              const px0 = ep.x, pz0 = ep.z;
              ep.x += (dx / td) * ms * dt; ep.z += (dz / td) * ms * dt;
              const res = resolveCircleAABB(ep.x, ep.z, 0.42, extraDoorCols);
              ep.x = res.x; ep.z = res.z;
              if (Math.hypot(ep.x - px0, ep.z - pz0) < ms * dt * 0.14) {
                en.stuckTimer += dt;
                if (en.stuckTimer > 0.75) {
                  en.stuckTimer = 0; en.path = []; en.pathTimer = 0;
                  if (en.aiState === 'patrol') en.wp = (en.wp + 1) % en.waypoints.length;
                  else if (en.repositionCooldown <= 0) { en.aiState = 'repositionHidden'; en.stateTimer = 0.75; en.repositionCooldown = 8.0; continue; }
                }
              } else en.stuckTimer = 0;
              en.rig.root.rotation.y = Math.atan2(dx, dz);
            }
          }

          if (dist < 6.5 && t - (en.lastWhisper || 0) > 7.0) { en.lastWhisper = t; audio.cue('whisper'); }
          if (!hiding && dist < 1.22 && graceTimer <= 0 && jumpscareTimer <= 0 && los) {
            jumpscareCount++; stability = Math.max(0, stability - 1); updateStabilityUI();
            warmth = Math.max(15, warmth - (difficulty === 'story' ? 10 : 20));
            audio.jumpscareShriek(); audio.glassShatter();
            if (stability <= 0) { startCutscene('fatal_12s'); return; }
            jumpscareKind = 'entity'; jumpscareTimer = 1.05; activeEnemy = en;
            const ap = resolveCircleAABB(playerPos.x - Math.sin(yaw) * 0.92, playerPos.z - Math.cos(yaw) * 0.92, 0.36, extraDoorCols);
            en.rig.root.position.set(ap.x, 0, ap.z);
            en.rig.root.lookAt(playerPos.x, 0, playerPos.z); en.frozen = 5.2;
          }
        }

        const healthRatio = stability / 5;
        let tFlash = 5.6;
        if (storyPhase !== 'calm_before') {
          if (healthRatio < 0.25) tFlash = (Math.sin(t * 29) * Math.cos(t * 17) > 0.78) ? 1.8 : 4.2 + Math.sin(t * 7) * 0.6;
          else if (healthRatio < 0.5) tFlash = Math.sin(t * 19) > 0.88 ? 2.6 : 4.85;
          else if (healthRatio < 0.75) tFlash = 5.15;
          const bFog = layerIdx === 3 ? (0.0135 + frost * 0.012) : (0.036 + frost * 0.042);
          fog.density = bFog + (1 - healthRatio) * (layerIdx === 3 ? 0.004 : 0.011);
        }
        if (near < 5.5 && Math.random() < 0.25) tFlash = 1.5;
        flashlight.intensity = tFlash;

        if (near > 10 || hiding) warmth = Math.min(100, warmth + 3 * dt);
        const hRoll = (cinematicEffects && storyPhase !== 'calm_before' && healthRatio < 0.5)
          ? Math.sin(t * (healthRatio < 0.25 ? 2.4 : 1.5)) * (healthRatio < 0.25 ? 0.018 : 0.008) : 0;
        camera.position.set(playerPos.x, playerPos.y + (moving && !hiding ? Math.sin(t * 9) * (cinematicEffects ? 0.04 : 0.015) : 0), playerPos.z);
        camera.rotation.order = 'YXZ'; camera.rotation.y = yaw; camera.rotation.x = pitch; camera.rotation.z = hRoll;

        const cl = findClosest();
        const pBox = document.getElementById('hud-prompt');
        const touchAct = document.getElementById('touch-interact');
        const actPrefix = controlMode === 'mobile' ? '[Ketuk AKSI] ' : '[E] ';
        const hasNearby = hiding || Boolean(cl.item) || cl.hide >= 0;
        if (touchAct) {
          touchAct.textContent = hiding ? 'KELUAR' : 'AKSI';
          touchAct.style.borderColor = hasNearby ? '#d4a353' : 'rgba(120,169,196,0.48)';
          touchAct.style.background = hasNearby ? 'rgba(212,163,83,0.28)' : 'rgba(7,12,20,0.6)';
          touchAct.style.color = hasNearby ? '#fef08a' : '#cbd5e1';
        }
        const ringEl = document.getElementById('lantern-ring-progress');
        if (ringEl) {
          const lProg = Math.max(0, Math.min(1, 1 - lanternCd / 8));
          ringEl.setAttribute('stroke-dashoffset', String(163.36 * (1 - lProg)));
          ringEl.setAttribute('stroke', lanternCd <= 0 && !hiding ? '#d4a353' : '#78a9c4');
        }
        if (hiding) { document.getElementById('hud-hiding').style.display = 'block'; pBox.style.display = 'block'; document.getElementById('hud-prompt-main').textContent = actPrefix + 'Keluar dari Persembunyian'; document.getElementById('hud-prompt-sub').textContent = ''; }
        else {
          document.getElementById('hud-hiding').style.display = 'none';
          if (cl.item) { pBox.style.display = 'block'; document.getElementById('hud-prompt-main').textContent = actPrefix + cl.item.label; document.getElementById('hud-prompt-sub').textContent = cl.item.kind === 'exit' && !exitOpen ? 'Masih terkunci, lengkapi target dulu.' : ''; }
          else if (cl.hide >= 0) { pBox.style.display = 'block'; document.getElementById('hud-prompt-main').textContent = actPrefix + 'Sembunyi di ' + hidingSpots[cl.hide].label; document.getElementById('hud-prompt-sub').textContent = 'Berlindung dari kejaran.'; }
          else pBox.style.display = 'none';
        }
        const gEl = document.getElementById('hud-grace');
        if (graceTimer > 0) { gEl.style.display = 'block'; gEl.textContent = 'JEDA PEMULIHAN AMAN · ' + graceTimer.toFixed(1) + 'd'; } else gEl.style.display = 'none';

        document.getElementById('hud-progress').textContent = collected + '/' + STORY.layers[layerIdx].totalTargets;
        document.getElementById('hud-warmth').textContent = Math.round(warmth) + '%';
        document.getElementById('bar-warmth').style.width = warmth + '%';
        document.getElementById('bar-warmth').style.background = warmth > 50 ? '#78a9c4' : '#c25959';
        document.getElementById('hud-stamina').textContent = Math.round(stamina) + '%';
        document.getElementById('bar-stamina').style.width = stamina + '%';
        document.getElementById('hud-lantern').textContent = lanternCd <= 0 ? 'SIAP' : 'MENGISI';
        document.getElementById('bar-lantern').style.width = Math.round((1 - lanternCd / 8) * 100) + '%';
        document.getElementById('hud-frost').textContent = Math.round(frost * 100) + '%';

        const dng = Math.max(0, Math.min(1, 1 - (near - 2) / 11));
        const lowH = storyPhase !== 'calm_before' ? (1 - healthRatio) : 0;
        const redM = dng > 0.35 || lowH >= 0.4;
        const vigAlpha = Math.min(0.86, 0.20 + frost * 0.24 + dng * 0.34 + lowH * 0.36);
        vigEl.style.background = 'radial-gradient(circle at center, transparent ' + Math.round(48 - lowH * 14) + '%, rgba(' + (redM ? '138,24,24' : '12,54,78') + ',' + vigAlpha.toFixed(3) + ') 100%)';
        vigEl.classList.toggle('low-health-pulse', storyPhase !== 'calm_before' && healthRatio < 0.5);
        if (glitchEl) glitchEl.style.display = (storyPhase !== 'calm_before' && healthRatio < 0.25) ? 'block' : 'none';

        audio.update(dt, frost, near, hiding, moving, sprint, STORY.layers[layerIdx].surface, layerIdx, true, horrorBlend, healthRatio);
      }
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtml(): void {
  const html = buildStandaloneHtml();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ShatteredMemories_SudutBekuRindiani.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
