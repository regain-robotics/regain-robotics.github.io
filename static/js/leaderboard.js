// Interactive benchmark leaderboards.
(() => {
  const TRACK1_DATA = [
    // Lightweight monitors
    {
      name: 'Hide-and-Seek', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 57.58, bacc: 72.93, recall: 69.60, fpr: 23.73, lat: 6.31, w10: 39.20 },
      clean: { twa: 58.89, bacc: 74.40, recall: 69.40, tnr: 79.40, mae: 16.28, lat: 6.31 },
      random: { cleanTwa: 59.87, randTwa: 54.97, delta: -4.90, cleanBacc: 75.6, randBacc: 70.0 },
      domains: { ms: 72.25, rw: 54.19, rl: 49.82 },
      note: 'Source-policy-specific learned signal monitor; selects among 5 seeds on validation.'
    },
    {
      name: 'FailureSpot', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 55.49, bacc: 66.73, recall: 54.13, fpr: 20.67, lat: 1.08, w10: 31.60 },
      clean: { twa: 55.79, bacc: 66.80, recall: 54.20, tnr: 79.40, mae: 13.50, lat: 1.08 },
      random: { cleanTwa: 54.34, randTwa: 54.89, delta: 0.55, cleanBacc: 65.2, randBacc: 66.6 },
      domains: { ms: 52.45, rw: 57.52, rl: 53.91 },
      note: 'Source-policy-specific learned timestamp-level detector; lowest query latency (1.08 ms).'
    },
    {
      name: 'ActProbe', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 54.58, bacc: 70.07, recall: 54.53, fpr: 14.40, lat: 1.37, w10: 23.60 },
      clean: { twa: 54.82, bacc: 70.70, recall: 55.20, tnr: 86.20, mae: 22.40, lat: 1.37 },
      random: { cleanTwa: 54.10, randTwa: 54.10, delta: 0.00, cleanBacc: 68.8, randBacc: 68.8 },
      domains: { ms: 58.70, rw: 53.44, rl: 52.62 },
      note: 'Action-space probe; unchanged Clean/Random score reflects identical action inputs during replay.'
    },
    {
      name: 'SAFE-LSTM', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 54.51, bacc: 62.13, recall: 33.20, fpr: 8.93, lat: 12.91, w10: 17.87 },
      clean: { twa: 54.93, bacc: 62.80, recall: 33.60, tnr: 92.00, mae: 16.55, lat: 12.91 },
      random: { cleanTwa: 54.91, randTwa: 53.66, delta: -1.24, cleanBacc: 62.4, randBacc: 60.8 },
      domains: { ms: 61.38, rw: 52.90, rl: 48.50 },
      note: 'Source-policy-specific LSTM failure detector with low false-positive rate (8.93%).'
    },
    {
      name: 'SAFE-MLP', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 53.49, bacc: 68.67, recall: 46.80, fpr: 9.47, lat: 9.96, w10: 14.27 },
      clean: { twa: 54.36, bacc: 70.00, recall: 48.40, tnr: 91.60, mae: 26.52, lat: 9.96 },
      random: { cleanTwa: 54.16, randTwa: 51.73, delta: -2.42, cleanBacc: 70.0, randBacc: 66.0 },
      domains: { ms: 61.97, rw: 51.60, rl: 49.42 },
      note: 'Source-policy-specific MLP failure detector.'
    },
    {
      name: 'STAC', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 53.44, bacc: 70.60, recall: 49.60, fpr: 8.40, lat: 12728.80, w10: 14.13 },
      clean: { twa: 54.30, bacc: 71.40, recall: 49.40, tnr: 93.40, mae: 31.30, lat: 12728.80 },
      random: { cleanTwa: 52.29, randTwa: 51.72, delta: -0.58, cleanBacc: 70.2, randBacc: 69.0 },
      domains: { ms: 64.79, rw: 50.63, rl: 49.89 },
      note: 'High episode bACC (70.60) but delayed alarms limit TWA_Δ (53.44, W10 14.13%).'
    },
    {
      name: 'FIPER', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 50.82, bacc: 64.80, recall: 55.73, fpr: 26.13, lat: 17255.08, w10: 26.13 },
      clean: { twa: 54.23, bacc: 66.90, recall: 50.60, tnr: 83.20, mae: 19.28, lat: 17255.08 },
      random: { cleanTwa: 54.49, randTwa: 43.99, delta: -10.50, cleanBacc: 67.0, randBacc: 60.6 },
      domains: { ms: 62.62, rw: 50.74, rl: 49.63 },
      note: 'Runtime uncertainty/consistency monitor with task-specific conformal calibration where ≥19 rollouts exist.'
    },
    {
      name: 'STAC-Single', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 50.52, bacc: 60.00, recall: 36.13, fpr: 16.13, lat: 1792.96, w10: 16.53 },
      clean: { twa: 51.44, bacc: 60.30, recall: 34.80, tnr: 85.80, mae: 18.11, lat: 1792.96 },
      random: { cleanTwa: 51.62, randTwa: 48.69, delta: -2.93, cleanBacc: 60.0, randBacc: 59.4 },
      domains: { ms: 58.24, rw: 50.29, rl: 42.48 },
      note: 'Single-sample resampled STAC variant.'
    },
    {
      name: 'LogpZO', group: 'Lightweight monitors', family: 'lightweight',
      pooled: { twa: 40.05, bacc: 56.07, recall: 52.53, fpr: 40.40, lat: 118.44, w10: 18.53 },
      clean: { twa: 51.45, bacc: 59.50, recall: 34.00, tnr: 85.00, mae: 18.27, lat: 118.44 },
      random: { cleanTwa: 52.94, randTwa: 17.25, delta: -35.69, cleanBacc: 61.0, randBacc: 49.2 },
      domains: { ms: 55.73, rw: 50.69, rl: 42.04 },
      note: 'Large drop under background randomization (−35.69 TWA_Δ points).'
    },

    // Small-scale VLM monitors
    {
      name: 'LLaVA-OV-7B FailSafe', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 64.58, bacc: 77.80, recall: 94.80, fpr: 39.20, lat: 222.20, w10: 71.33 },
      clean: { twa: 68.88, bacc: 81.40, recall: 94.20, tnr: 68.60, mae: 8.16, lat: 222.20 },
      random: { cleanTwa: 70.72, randTwa: 56.00, delta: -14.72, cleanBacc: 82.8, randBacc: 70.6 },
      domains: { ms: 63.99, rw: 68.68, rl: 73.42 },
      note: 'Top local VLM monitor; achieves highest W10 (71.33%) and lowest clean onset MAE (8.16 s), sensitive to visual shift (−14.72).'
    },
    {
      name: 'Qwen3.5-0.8B FailSafe†', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 63.08, bacc: 76.67, recall: 93.87, fpr: 40.53, lat: 114.25, w10: 69.07 },
      clean: { twa: 65.56, bacc: 78.70, recall: 93.20, tnr: 64.20, mae: 8.71, lat: 114.25 },
      random: { cleanTwa: 65.61, randTwa: 58.12, delta: -7.49, cleanBacc: 79.8, randBacc: 72.6 },
      domains: { ms: 61.50, rw: 64.34, rl: 73.54 },
      note: '† FailSafe adaptation to Qwen3.5-0.8B backbone; outperforms base model by +23.97 TWA_Δ points.'
    },
    {
      name: 'Qwen3.5-4B FailSafe†', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 60.38, bacc: 73.93, recall: 94.93, fpr: 47.07, lat: 167.00, w10: 70.80 },
      clean: { twa: 65.43, bacc: 77.60, recall: 93.20, tnr: 62.00, mae: 8.32, lat: 167.00 },
      random: { cleanTwa: 67.24, randTwa: 50.27, delta: -16.97, cleanBacc: 79.6, randBacc: 66.6 },
      domains: { ms: 64.84, rw: 64.38, rl: 65.35 },
      note: '† FailSafe adaptation to Qwen3.5-4B backbone; outperforms base model by +15.11 TWA_Δ points.'
    },
    {
      name: 'Robo-Dopamine', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 53.74, bacc: 75.27, recall: 95.07, fpr: 44.53, lat: 500.37, w10: 50.40 },
      clean: { twa: 53.59, bacc: 75.30, recall: 95.60, tnr: 55.00, mae: 15.43, lat: 500.37 },
      random: { cleanTwa: 55.40, randTwa: 54.04, delta: -1.36, cleanBacc: 76.2, randBacc: 75.2 },
      domains: { ms: 61.82, rw: 50.45, rl: 44.94 },
      note: 'General process reward model; robust to background randomization (−1.36).'
    },
    {
      name: 'RoboMeter', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 47.14, bacc: 70.00, recall: 98.40, fpr: 58.40, lat: 402.40, w10: 50.27 },
      clean: { twa: 46.80, bacc: 70.00, recall: 98.60, tnr: 41.40, mae: 15.62, lat: 402.40 },
      random: { cleanTwa: 49.00, randTwa: 47.80, delta: -1.20, cleanBacc: 71.4, randBacc: 70.0 },
      domains: { ms: 55.80, rw: 41.47, rl: 49.43 },
      note: 'General-purpose robotic reward model.'
    },
    {
      name: 'Qwen3.5-4B Base', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 45.27, bacc: 54.73, recall: 51.20, fpr: 41.73, lat: 416.82, w10: 33.33 },
      clean: { twa: 45.04, bacc: 53.90, recall: 49.00, tnr: 58.80, mae: 13.55, lat: 416.82 },
      random: { cleanTwa: 44.73, randTwa: 45.73, delta: 1.00, cleanBacc: 54.0, randBacc: 56.4 },
      domains: { ms: 47.09, rw: 41.41, rl: 49.77 },
      note: 'Zero-shot / unadapted multimodal backbone.'
    },
    {
      name: 'Qwen3.5-0.8B Base', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 39.11, bacc: 58.20, recall: 78.93, fpr: 62.53, lat: 472.35, w10: 39.87 },
      clean: { twa: 40.18, bacc: 58.80, recall: 76.40, tnr: 41.20, mae: 19.05, lat: 472.35 },
      random: { cleanTwa: 40.89, randTwa: 36.96, delta: -3.93, cleanBacc: 57.6, randBacc: 57.0 },
      domains: { ms: 59.89, rw: 33.83, rl: 27.69 },
      note: 'Unadapted 0.8B multimodal backbone.'
    },
    {
      name: 'Qwen3-VL-4B', group: 'Small-scale VLM monitors', family: 'vlm',
      pooled: { twa: 38.50, bacc: 59.87, recall: 82.53, fpr: 62.80, lat: 484.95, w10: 37.60 },
      clean: { twa: 41.78, bacc: 62.10, recall: 80.00, tnr: 44.20, mae: 18.19, lat: 484.95 },
      random: { cleanTwa: 42.81, randTwa: 31.93, delta: -10.88, cleanBacc: 63.2, randBacc: 55.4 },
      domains: { ms: 60.93, rw: 35.48, rl: 28.84 },
      note: 'Qwen3-VL-4B-Instruct zero-shot baseline.'
    },

    // API monitors — Prefix-style
    {
      name: 'GPT 6.1 Sol (Prefix)', group: 'API monitors · Prefix-style', family: 'api',
      pooled: { twa: 66.93, bacc: 85.33, recall: 80.53, fpr: 9.87, lat: 5461.77, w10: null },
      clean: { twa: 66.88, bacc: 85.50, recall: 80.20, tnr: 90.80, mae: 18.24, lat: 5461.77 },
      random: { cleanTwa: 67.13, randTwa: 67.03, delta: -0.11, cleanBacc: 85.8, randBacc: 85.0 },
      domains: null,
      note: 'Highest pooled TWA_Δ (66.93) and bACC (85.33); stable under visual shift (−0.11) with 9.87% FPR.'
    },
    {
      name: 'DeepSeek V4.1 Flash (Prefix)', group: 'API monitors · Prefix-style', family: 'api',
      pooled: { twa: 59.85, bacc: 79.93, recall: 73.87, fpr: 14.00, lat: 6318.00, w10: null },
      clean: { twa: 59.88, bacc: 79.40, recall: 72.60, tnr: 86.20, mae: 23.41, lat: 6318.00 },
      random: { cleanTwa: 60.01, randTwa: 59.79, delta: -0.23, cleanBacc: 79.6, randBacc: 81.0 },
      domains: null,
      note: 'Prefix-style API protocol; visual-shift delta −0.23 points.'
    },
    {
      name: 'Gemini 3.8 Flash (Prefix)', group: 'API monitors · Prefix-style', family: 'api',
      pooled: { twa: 58.69, bacc: 76.87, recall: 98.00, fpr: 44.27, lat: 41169.71, w10: null },
      clean: { twa: 59.07, bacc: 77.10, recall: 98.40, tnr: 55.80, mae: 11.23, lat: 41169.71 },
      random: { cleanTwa: 59.44, randTwa: 57.93, delta: -1.51, cleanBacc: 78.2, randBacc: 76.4 },
      domains: null,
      note: 'High recall (98.00%) and low clean MAE (11.23 s), higher FPR (44.27%) and API latency.'
    },

    // API monitors — Window-style
    {
      name: 'GPT 6.1 Sol (Window)', group: 'API monitors · Window-style', family: 'api',
      pooled: { twa: 32.72, bacc: 55.13, recall: 99.60, fpr: 89.33, lat: 9811.25, w10: null },
      clean: { twa: 34.28, bacc: 55.90, recall: 99.60, tnr: 12.20, mae: 15.12, lat: 9811.25 },
      random: { cleanTwa: 34.20, randTwa: 29.61, delta: -4.59, cleanBacc: 55.6, randBacc: 53.6 },
      domains: null,
      note: 'Window-style protocol triggers 89.33% false alarms on successful episodes (vs. 9.87% under prefix-style).'
    },
    {
      name: 'Gemini 3.8 Flash (Window)', group: 'API monitors · Window-style', family: 'api',
      pooled: { twa: 23.39, bacc: 50.40, recall: 100.00, fpr: 99.20, lat: 84443.93, w10: null },
      clean: { twa: 23.73, bacc: 50.20, recall: 100.00, tnr: 0.40, mae: 19.87, lat: 84443.93 },
      random: { cleanTwa: 24.17, randTwa: 22.71, delta: -1.46, cleanBacc: 50.2, randBacc: 50.8 },
      domains: null,
      note: 'Window-style protocol produces 99.20% FPR.'
    },
    {
      name: 'DeepSeek V4.1 Flash (Window)', group: 'API monitors · Window-style', family: 'api',
      pooled: { twa: 21.94, bacc: 51.80, recall: 100.00, fpr: 96.40, lat: 5910.33, w10: null },
      clean: { twa: 21.87, bacc: 51.90, recall: 100.00, tnr: 3.80, mae: 22.69, lat: 5910.33 },
      random: { cleanTwa: 22.28, randTwa: 22.08, delta: -0.20, cleanBacc: 51.8, randBacc: 51.6 },
      domains: null,
      note: 'Window-style protocol produces 96.40% FPR.'
    }
  ];

  const TRACK2_DATA = [
    // Common cohort (750 cases)
    {
      name: 'Astra', cohort: 'common',
      overall: 32.99, ci: '[28.76, 36.65]', vla: 37.89, rdt: 29.38, wam: 23.99, ratio: '248/750',
      visual: { clean: 38.53, rand: 39.73, delta: 1.20, cleanRatio: '97/250', randRatio: '98/250' },
      resumption: '128/248 final completions (55 native gate, 73 source completes, 120 incomplete)',
      access: 'RGB, proprioception, camera calibration, declared motion tools (24-turn limit, gpt-6-astra)'
    },
    {
      name: 'FailSafe (anchor)', cohort: 'common',
      overall: 15.46, ci: '[12.72, 18.24]', vla: 16.47, rdt: 16.85, wam: 11.80, ratio: '121/750',
      visual: { clean: 18.06, rand: 14.21, delta: -3.85, cleanRatio: '46/250', randRatio: '36/250' },
      resumption: 'Not included in 388-endpoint continuation diagnostic',
      access: 'Anchored corrective-policy execution (fresh weights excluding all 500 evaluation families)'
    },
    {
      name: 'Source-policy continuation', cohort: 'common',
      overall: 13.14, ci: '[10.59, 15.81]', vla: 14.15, rdt: 9.79, wam: 13.63, ratio: '100/750',
      visual: { clean: 12.29, rand: 13.09, delta: 0.80, cleanRatio: '32/250', randRatio: '34/250' },
      resumption: 'Fixed-anchor baseline control',
      access: 'Original source-policy checkpoint restarted from failed physical state under Track 2 budget'
    },
    {
      name: 'Retract-and-Retry', cohort: 'common',
      overall: 11.29, ci: '[9.07, 13.70]', vla: 13.30, rdt: 5.11, wam: 12.24, ratio: '88/750',
      visual: { clean: 11.60, rand: 9.79, delta: -1.81, cleanRatio: '32/250', randRatio: '26/250' },
      resumption: 'Fixed-anchor retrial control',
      access: 'One native neutral-return trajectory followed by original source-policy inference (no learned critic)'
    },
    {
      name: 'Recovery-SFT', cohort: 'common',
      overall: 10.27, ci: '[7.55, 13.10]', vla: 16.95, rdt: 3.83, wam: 7.59, ratio: '67/750',
      visual: { clean: 10.76, rand: 10.39, delta: -0.37, cleanRatio: '21/250', randRatio: '22/250' },
      resumption: '40/67 final completions (24 native gate, 16 source completes, 27 incomplete)',
      access: 'Task-conditioned native corrective-action policy trained on REGAIN Y-branches (500 test families excluded)'
    },
    {
      name: 'AgentChord', cohort: 'common',
      overall: 8.67, ci: '[6.67, 10.81]', vla: 6.58, rdt: 14.56, wam: 7.41, ratio: '73/750',
      visual: { clean: 5.52, rand: 10.62, delta: 5.10, cleanRatio: '19/250', randRatio: '29/250' },
      resumption: '27/73 final completions (20 native gate, 7 source completes, 46 incomplete)',
      access: 'Public RGB-D, camera geometry, segmentation, generated motion programs (24 turns, 64 transitions)'
    },
    {
      name: 'Phoenix', cohort: 'common',
      overall: 2.97, ci: '[1.67, 4.46]', vla: 3.69, rdt: 3.99, wam: 0.77, ratio: '24/750',
      visual: { clean: 4.13, rand: 2.37, delta: -1.76, cleanRatio: '13/250', randRatio: '7/250' },
      resumption: 'Evaluated under weak motion/correction supervision in ManiSkill; 2/8 ManiSkill joint-8 completions in playback',
      access: 'Motion predictor, correction model, and motion-conditioned policy (500 test families excluded)'
    },

    // Evaluated subsets & partial runs
    {
      name: 'ReCoVLA (MS subset)', cohort: 'subset',
      overall: 15.79, ci: 'Subset (n=279)', vla: null, rdt: null, wam: null, ratio: '48/279',
      visual: null,
      resumption: 'Compatible ManiSkill subset only (10 trained residual experts); separate from 750-case ranking',
      access: 'Frozen source representations + 7D residual-policy catalog with expert selection'
    },
    {
      name: 'BGR (source critic)', cohort: 'subset',
      overall: 1.04, ci: 'Subset (n=78)', vla: null, rdt: null, wam: null, ratio: '1/78',
      visual: null,
      resumption: 'RoboTwin source-control Monte Carlo critic with K=10 candidate sampling',
      access: 'Source-policy candidate sampling, progress monitoring, physical retract/retry'
    },
    {
      name: 'BGR (expert critic)', cohort: 'subset',
      overall: 0.00, ci: 'Subset (n=16)', vla: null, rdt: null, wam: null, ratio: '0/16',
      visual: null,
      resumption: 'ManiSkill shared-expert critic with 20 Hz execution and K=10 selection',
      access: 'Source-policy candidate sampling + shared-expert critic'
    },
    {
      name: 'MiniMax-H3 + IDM (partial)', cohort: 'subset',
      overall: null, ci: 'Partial (n=8)', vla: null, rdt: null, wam: null, ratio: '1/8',
      visual: null,
      resumption: 'Earlier restricted 186-case ManiSkill comparison (16k IDM): 1.47% Stage SR (3/186); reference-video IDM component test: 31/447 across MS/RW/RL',
      access: '107-frame visual plan generation + embodiment-specific IDM action decoding'
    }
  ];

  const TRACK3_DATA = [
    {
      system: 'BGR', source: 'VLA', platform: 'RoboTwin', ratio: '172/172',
      off: 63.95, on: 59.88, rescue: 4, harm: 11, delta: -4.07,
      accounting: '4 rescues vs. 11 disruptions across 172 pairs (source-rollout value critic).',
      access: 'Source-policy candidate sampling, progress monitoring, physical retract/retry'
    },
    {
      system: 'VLA-Corrector', source: 'VLA', platform: 'RoboTwin', ratio: '172/172',
      off: 62.79, on: 59.88, rescue: 8, harm: 13, delta: -2.91,
      accounting: '8 rescues vs. 13 disruptions across 172 RoboTwin APM pairs (horizon 50, prefix 5).',
      access: 'Policy visual features, action queue truncation, and differentiable replanning'
    },
    {
      system: 'VLA-Corrector (all-phase)*', source: 'VLA', platform: 'RoboTwin', ratio: '169/172*',
      off: 66.27, on: 60.36, rescue: 4, harm: 14, delta: -5.92,
      accounting: '4 rescues vs. 14 disruptions; *3 initial-identity admission holds remain unresolved.',
      access: 'All-phase APM replanning over converted source VLA checkpoint'
    },
    {
      system: 'VLA-Corrector', source: 'VLA', platform: 'ManiSkill', ratio: '82/82',
      off: 35.37, on: 40.24, rescue: 5, harm: 1, delta: 4.88,
      accounting: '29/82 OFF → 33/82 ON (5 rescues, 1 disruption) with APM-7 (horizon 10, prefix 5).',
      access: 'Policy visual features, action queue, and guided replanning (25k-step source checkpoint)'
    },
    {
      system: 'CARE (2 tasks)', source: 'VLA', platform: 'ManiSkill', ratio: '19/19',
      off: 15.79, on: 21.05, rescue: 1, harm: 0, delta: 5.26,
      accounting: 'Compatible 2-task subset (10 PickCube + 9 StackCube pairs): 3/19 OFF → 4/19 ON.',
      access: 'Stage-conditioned policy execution and public RGB-D/TCP monitoring'
    },
    {
      system: 'CycleVLA (4 tasks)', source: 'VLA', platform: 'ManiSkill', ratio: '36/36',
      off: 25.00, on: 11.11, rescue: 1, harm: 6, delta: -13.89,
      accounting: '9/36 OFF → 4/36 ON (1 rescue, 6 disruptions); physical backtracking consumes shared budget.',
      access: 'Trained progress/subtask interface, candidate selection, and physical backtracking'
    },
    {
      system: 'ReCoVLA', source: 'VLA', platform: 'ManiSkill', ratio: '82/82',
      off: 42.68, on: 37.80, rescue: 0, harm: 4, delta: -4.88,
      accounting: '35/82 OFF → 31/82 ON (0 rescues, 4 disruptions) across compatible ManiSkill pairs.',
      access: 'Frozen source representations and 7D residual-policy expert selection'
    },
    {
      system: 'Astra', source: 'VLA', platform: 'RoboTwin', ratio: '172/172',
      off: 56.98, on: 59.30, rescue: 8, harm: 4, delta: 2.33,
      accounting: '98/172 OFF → 102/172 ON: 94 preserved, 66 unresolved, 8 rescued, 4 harmed (π0.5 source).',
      access: 'Local screener, gpt-6-astra confirmation/repair/verification, frozen experience library'
    },
    {
      system: 'Astra', source: 'RDT', platform: 'RoboTwin', ratio: '172/172',
      off: 27.91, on: 30.81, rescue: 5, harm: 0, delta: 2.91,
      accounting: '48/172 OFF → 53/172 ON: 48 preserved, 119 unresolved, 5 rescued, 0 harmed (RDT source).',
      access: 'Local screener, gpt-6-astra confirmation/repair/verification, frozen experience library'
    },
    {
      system: 'Astra', source: 'WAM', platform: 'RoboTwin', ratio: '172/172',
      off: 76.74, on: 76.74, rescue: 0, harm: 0, delta: 0.00,
      accounting: '132/172 OFF → 132/172 ON: 21/40 failures repaired, 19 self-verified, 17 handed off, yet 0 net rescue.',
      access: 'Local screener, gpt-6-astra confirmation/repair/verification, frozen experience library'
    }
  ];

  const fmt = (val, digits = 2) => (val === null || val === undefined ? '—' : Number(val).toFixed(digits));
  const fmtSigned = val => (val === null || val === undefined ? '—' : `${val > 0 ? '+' : ''}${Number(val).toFixed(2)}`);

  function makeScoreCell(val, maxVal = 100) {
    const td = document.createElement('td');
    td.className = 'board-score';
    if (val === null || val === undefined) {
      td.textContent = '—';
      return td;
    }
    const fill = document.createElement('span');
    fill.className = 'score-fill';
    fill.style.width = `${Math.min(100, Math.max(0, (Number(val) / maxVal) * 100))}%`;
    fill.setAttribute('aria-hidden', 'true');
    const num = document.createElement('span');
    num.className = 'score-number';
    num.textContent = fmt(val);
    td.append(fill, num);
    return td;
  }

  function makeDeltaBadgeCell(val) {
    const td = document.createElement('td');
    td.className = 'board-delta';
    if (val === null || val === undefined) {
      td.textContent = '—';
      return td;
    }
    const badge = document.createElement('span');
    badge.className = `delta-badge ${val > 0 ? 'is-pos' : val < 0 ? 'is-neg' : 'is-zero'}`;
    badge.textContent = fmtSigned(val);
    td.append(badge);
    return td;
  }

  function makeCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
  }

  function attachDetailToggle(tr, tbody, detailId, rankText, labelText, detailContent, colSpan, isSubset = false) {
    const th = document.createElement('th');
    th.scope = 'row';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'method-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', detailId);
    btn.innerHTML = `${rankText ? '<span class="board-rank"></span>' : ''}<span class="method-name"></span><span class="method-expand" aria-hidden="true">+</span>`;
    if (rankText) btn.querySelector('.board-rank').textContent = rankText;
    btn.querySelector('.method-name').textContent = labelText;
    th.append(btn);
    tr.prepend(th);
    if (isSubset) tr.classList.add('row-subset');

    const detailRow = document.createElement('tr');
    detailRow.className = 'method-detail-row';
    detailRow.hidden = true;
    detailRow.id = detailId;
    const detailCell = document.createElement('td');
    detailCell.colSpan = colSpan;
    detailCell.append(detailContent);
    detailRow.append(detailCell);

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(expanded));
      detailRow.hidden = !expanded;
    });

    tbody.append(tr, detailRow);
  }

  function buildDetailBlock(familyLabel, kvPairs, rightHeading, rightPairs, noteText) {
    const info = document.createElement('div');
    info.className = 'method-info';
    const fam = document.createElement('p');
    fam.className = 'method-family';
    fam.textContent = familyLabel;
    const dl = document.createElement('dl');
    kvPairs.forEach(([k, v]) => {
      const wrap = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      wrap.append(dt, dd);
      dl.append(wrap);
    });
    const right = document.createElement('div');
    right.className = 'platform-breakdown';
    const hLeft = document.createElement('span');
    hLeft.textContent = rightHeading[0];
    const hRight = document.createElement('span');
    hRight.textContent = rightHeading[1];
    right.append(hLeft, hRight);
    rightPairs.forEach(([k, v]) => {
      const s1 = document.createElement('span');
      s1.textContent = k;
      const s2 = document.createElement('span');
      s2.textContent = v;
      right.append(s1, s2);
    });
    info.append(fam, dl, right);
    if (noteText) {
      const note = document.createElement('p');
      note.className = 'method-detail-note';
      note.textContent = noteText;
      info.append(note);
    }
    return info;
  }

  // ---- Track 1: Streaming Failure Detection ----
  function initTrack1() {
    const panel = document.getElementById('board-detection');
    if (!panel) return;
    const intro = panel.querySelector('.board-intro');
    const metricBadge = document.createElement('span');
    metricBadge.className = 'board-metric';
    metricBadge.innerHTML = 'Primary · TWA<sub>Δ</sub> (τ = 10 s)';
    intro.append(metricBadge);

    const controls = document.createElement('div');
    controls.className = 'board-controls';
    controls.innerHTML = `
      <label>Cohort / View
        <select aria-label="Detection view">
          <option value="pooled">Pooled (1,500 sequences)</option>
          <option value="clean">Clean cohort (1,000 sequences)</option>
          <option value="random">Paired visual shift (500 pairs)</option>
          <option value="domain">Domain breakdown (Clean TWAΔ)</option>
        </select>
      </label>
      <label>Monitor family
        <select aria-label="Detection family">
          <option value="all">All families (23)</option>
          <option value="lightweight">Lightweight monitors (9)</option>
          <option value="vlm">Small-scale VLM monitors (8)</option>
          <option value="api">API monitors (6)</option>
        </select>
      </label>
      <label>Order
        <select aria-label="Detection order">
          <option value="grouped">Grouped by family (Paper Table II)</option>
          <option value="twa">Primary TWAΔ ↓</option>
          <option value="bacc">Episode bACC ↓</option>
          <option value="latency">Fastest latency ↑</option>
        </select>
      </label>
    `;
    intro.after(controls);

    const table = panel.querySelector('table');
    const thead = table.tHead;
    const tbody = table.tBodies[0];
    const [viewSel, familySel, orderSel] = controls.querySelectorAll('select');

    const protocol = document.createElement('details');
    protocol.className = 'board-protocol';
    protocol.innerHTML = `<summary>Evaluation details &amp; footnotes</summary><p>TWA<sub>Δ</sub> evaluates causal onset alignment at τ = 10 s on a 0–100% scale (a monitor that never alarms scores 50%). Pooled results span 1,500 sequences (750 failures, 750 successes); clean results span 1,000 rollouts; paired visual shift compares 500 matched clean/background-randomized pairs. † Denotes adaptation of FailSafe to a Qwen backbone. Domain breakdown reflects each domain's task and source-policy composition rather than an isolated domain-transfer effect.</p>`;
    panel.append(protocol);

    function render() {
      const view = viewSel.value;
      const family = familySel.value;
      const order = orderSel.value;
      orderSel.disabled = view === 'domain';

      let rows = TRACK1_DATA.filter(item => family === 'all' || item.family === family);
      if (view === 'domain') {
        metricBadge.innerHTML = 'Domain TWA<sub>Δ</sub> (Clean 1,000)';
        thead.innerHTML = '<tr><th scope="col">Monitor</th><th scope="col">ManiSkill (243)</th><th scope="col">RoboTwin (639)</th><th scope="col">RoboLab (118)</th><th scope="col">Clean Overall ↑</th></tr>';
      } else if (view === 'random') {
        metricBadge.innerHTML = 'Visual Shift · Δ TWA<sub>Δ</sub> (pp)';
        thead.innerHTML = '<tr><th scope="col">Monitor</th><th scope="col">Clean TWA<sub>Δ</sub></th><th scope="col">Random TWA<sub>Δ</sub></th><th scope="col">Δ (pp)</th><th scope="col">Clean bACC</th><th scope="col">Random bACC</th></tr>';
      } else if (view === 'clean') {
        metricBadge.innerHTML = 'Primary · Clean TWA<sub>Δ</sub> (1,000)';
        thead.innerHTML = '<tr><th scope="col">Monitor</th><th scope="col">TWA<sub>Δ</sub> (%) ↑</th><th scope="col">bACC (%) ↑</th><th scope="col">Recall (%)</th><th scope="col">TNR (%)</th><th scope="col">MAE (s) ↓</th><th scope="col">Latency (ms) ↓</th></tr>';
      } else {
        metricBadge.innerHTML = 'Primary · Pooled TWA<sub>Δ</sub> (1,500)';
        thead.innerHTML = '<tr><th scope="col">Monitor</th><th scope="col">TWA<sub>Δ</sub> (%) ↑</th><th scope="col">bACC (%) ↑</th><th scope="col">Recall (%)</th><th scope="col">FPR (%)</th><th scope="col">Latency (ms) ↓</th></tr>';
      }

      const sortMetric = item => {
        if (order === 'bacc') return view === 'clean' ? item.clean.bacc : view === 'random' ? item.random.randBacc : item.pooled.bacc;
        if (order === 'latency') return -item.pooled.lat;
        return view === 'clean' ? item.clean.twa : view === 'random' ? item.random.randTwa : item.pooled.twa;
      };

      if (order !== 'grouped' && view !== 'domain') {
        rows = [...rows].sort((a, b) => sortMetric(b) - sortMetric(a));
      }

      tbody.innerHTML = '';
      const colSpan = thead.rows[0].cells.length;
      let lastGroup = '';

      rows.forEach((item, idx) => {
        if ((order === 'grouped' || view === 'domain') && item.group !== lastGroup) {
          lastGroup = item.group;
          const groupRow = document.createElement('tr');
          groupRow.className = 'method-group';
          const th = document.createElement('th');
          th.colSpan = colSpan;
          th.scope = 'rowgroup';
          th.textContent = item.group;
          groupRow.append(th);
          tbody.append(groupRow);
        }

        const tr = document.createElement('tr');
        if (view === 'domain') {
          tr.append(
            makeCell(item.domains ? fmt(item.domains.ms) : '—'),
            makeCell(item.domains ? fmt(item.domains.rw) : '—'),
            makeCell(item.domains ? fmt(item.domains.rl) : '—'),
            makeScoreCell(item.clean.twa)
          );
        } else if (view === 'random') {
          tr.append(
            makeCell(fmt(item.random.cleanTwa)),
            makeScoreCell(item.random.randTwa),
            makeDeltaBadgeCell(item.random.delta),
            makeCell(fmt(item.random.cleanBacc, 1)),
            makeCell(fmt(item.random.randBacc, 1))
          );
        } else if (view === 'clean') {
          tr.append(
            makeScoreCell(item.clean.twa),
            makeCell(fmt(item.clean.bacc)),
            makeCell(fmt(item.clean.recall)),
            makeCell(fmt(item.clean.tnr)),
            makeCell(fmt(item.clean.mae)),
            makeCell(fmt(item.clean.lat))
          );
        } else {
          tr.append(
            makeScoreCell(item.pooled.twa),
            makeCell(fmt(item.pooled.bacc)),
            makeCell(fmt(item.pooled.recall)),
            makeCell(fmt(item.pooled.fpr)),
            makeCell(fmt(item.pooled.lat))
          );
        }

        const detail = buildDetailBlock(
          item.group,
          [
            ['Pooled W10 (±10 s)', item.pooled.w10 === null ? 'Unavailable' : `${fmt(item.pooled.w10)}%`],
            ['Clean onset MAE', `${fmt(item.clean.mae)} s`],
            ['Visual shift Δ', `${fmtSigned(item.random.delta)} pp`],
            ['Query latency', `${fmt(item.pooled.lat)} ms`]
          ],
          ['Domain (Clean)', 'TWAΔ (%)'],
          item.domains
            ? [['ManiSkill (243)', fmt(item.domains.ms)], ['RoboTwin (639)', fmt(item.domains.rw)], ['RoboLab (118)', fmt(item.domains.rl)]]
            : [['ManiSkill / RoboTwin / RoboLab', 'Not exported']],
          item.note
        );
        const rankStr = order === 'grouped' || view === 'domain' ? '' : String(idx + 1).padStart(2, '0');
        attachDetailToggle(tr, tbody, `det-t1-${idx}`, rankStr, item.name, detail, colSpan);
      });
    }

    controls.addEventListener('change', render);
    render();
  }

  // ---- Track 2: State-Conditioned Stage Recovery ----
  function initTrack2() {
    const panel = document.getElementById('board-recovery');
    if (!panel) return;
    const intro = panel.querySelector('.board-intro');
    const metricBadge = document.createElement('span');
    metricBadge.className = 'board-metric';
    metricBadge.textContent = 'Primary · Task-macro Stage SR';
    intro.append(metricBadge);

    const controls = document.createElement('div');
    controls.className = 'board-controls';
    controls.innerHTML = `
      <label>Cohort / View
        <select aria-label="Recovery view">
          <option value="common">Common cohort + Subsets (750 cases)</option>
          <option value="visual">Paired visual variation (250 clean vs. randomized)</option>
        </select>
      </label>
      <label>Sort common cohort
        <select aria-label="Recovery sort">
          <option value="overall">Overall Stage SR ↓</option>
          <option value="vla">VLA Stage SR (N=351) ↓</option>
          <option value="rdt">RDT Stage SR (N=185) ↓</option>
          <option value="wam">WAM Stage SR (N=214) ↓</option>
        </select>
      </label>
    `;
    intro.after(controls);

    const table = panel.querySelector('table');
    const thead = table.tHead;
    const tbody = table.tBodies[0];
    const [viewSel, sortSel] = controls.querySelectorAll('select');

    const protocol = document.createElement('details');
    protocol.className = 'board-protocol';
    protocol.innerHTML = `<summary>Evaluation details &amp; footnotes</summary><p>Task-macro Stage SR weights all 33 platform/tasks equally (the overall score is not the unweighted mean of the three source-family columns). Clean cohort contains 500 parent failures and 250 paired background-randomized variants. Subset and partial rows (ReCoVLA MS subset, BGR critics, MiniMax-H3 + IDM partial) cover non-identical case pools and are separated from the 7-method common comparison. Wall time is omitted because timing boundaries differ across exports.</p>`;
    panel.append(protocol);

    function render() {
      const view = viewSel.value;
      const sortKey = sortSel.value;
      sortSel.disabled = view === 'visual';
      tbody.innerHTML = '';

      if (view === 'visual') {
        metricBadge.textContent = 'Paired Visual Shift · 250 parents';
        thead.innerHTML = '<tr><th scope="col">Method</th><th scope="col">Clean SR (%)</th><th scope="col">Randomized SR (%)</th><th scope="col">Δ (pp)</th><th scope="col">Clean / 250</th><th scope="col">Randomized / 250</th></tr>';
        const colSpan = 6;
        TRACK2_DATA.filter(d => d.cohort === 'common').forEach((item, idx) => {
          const tr = document.createElement('tr');
          tr.append(
            makeScoreCell(item.visual.clean, 50),
            makeScoreCell(item.visual.rand, 50),
            makeDeltaBadgeCell(item.visual.delta),
            makeCell(item.visual.cleanRatio),
            makeCell(item.visual.randRatio)
          );
          const detail = buildDetailBlock(
            'Common cohort · Paired visual shift (250 clean vs. 250 randomized)',
            [
              ['Overall Stage SR', `${fmt(item.overall)}%`],
              ['95% Bootstrap CI', item.ci],
              ['Visual shift Δ', `${fmtSigned(item.visual.delta)} pp`],
              ['Common success', item.ratio]
            ],
            ['Source Family', 'Stage SR (%)'],
            [['VLA (N=351)', fmt(item.vla)], ['RDT (N=185)', fmt(item.rdt)], ['WAM (N=214)', fmt(item.wam)]],
            `${item.access}. ${item.resumption}.`
          );
          attachDetailToggle(tr, tbody, `det-t2-v-${idx}`, String(idx + 1).padStart(2, '0'), item.name, detail, colSpan);
        });
        return;
      }

      metricBadge.textContent = 'Primary · Task-macro Stage SR';
      thead.innerHTML = '<tr><th scope="col">Method</th><th scope="col">Overall Stage SR (%) ↑</th><th scope="col">VLA (N=351)</th><th scope="col">RDT (N=185)</th><th scope="col">WAM (N=214)</th><th scope="col">Success / n</th></tr>';
      const colSpan = 6;

      const common = [...TRACK2_DATA.filter(d => d.cohort === 'common')].sort((a, b) => b[sortKey] - a[sortKey]);
      const subsets = TRACK2_DATA.filter(d => d.cohort === 'subset');

      const addGroup = label => {
        const groupRow = document.createElement('tr');
        groupRow.className = 'method-group';
        const th = document.createElement('th');
        th.colSpan = colSpan;
        th.scope = 'rowgroup';
        th.textContent = label;
        groupRow.append(th);
        tbody.append(groupRow);
      };

      addGroup('Common cohort · 750 cases (500 clean, 250 randomized) · 33 platform/tasks');
      common.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.append(
          makeScoreCell(item.overall, 50),
          makeCell(fmt(item.vla)),
          makeCell(fmt(item.rdt)),
          makeCell(fmt(item.wam)),
          makeCell(item.ratio)
        );
        const detail = buildDetailBlock(
          'Common cohort (750 cases · 10,000 parent-bootstrap replicates)',
          [
            ['95% Bootstrap CI', item.ci],
            ['Paired Clean SR', `${fmt(item.visual.clean)}%`],
            ['Paired Random SR', `${fmt(item.visual.rand)}%`],
            ['Visual shift Δ', `${fmtSigned(item.visual.delta)} pp`]
          ],
          ['Resumption', 'Outcome'],
          [['Post-repair status', item.resumption]],
          `Execution access: ${item.access}.`
        );
        attachDetailToggle(tr, tbody, `det-t2-c-${idx}`, String(idx + 1).padStart(2, '0'), item.name, detail, colSpan);
      });

      addGroup('Evaluated subsets & partial runs · reported separately');
      subsets.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.append(
          makeScoreCell(item.overall, 50),
          makeCell(fmt(item.vla)),
          makeCell(fmt(item.rdt)),
          makeCell(fmt(item.wam)),
          makeCell(item.ratio)
        );
        const detail = buildDetailBlock(
          'Subset / partial evaluation (not ranked against 750-case cohort)',
          [
            ['Scope', item.ci],
            ['Success / evaluated', item.ratio],
            ['Stage SR', item.overall === null ? 'Partial' : `${fmt(item.overall)}%`],
            ['Access', 'Method-specific']
          ],
          ['Evaluation note', 'Status'],
          [['Scope detail', item.resumption]],
          `Execution access: ${item.access}.`
        );
        attachDetailToggle(tr, tbody, `det-t2-s-${idx}`, '—', item.name, detail, colSpan, true);
      });
    }

    controls.addEventListener('change', render);
    render();
  }

  // ---- Track 3: Online Task Rescue ----
  function initTrack3() {
    const panel = document.getElementById('board-rescue');
    if (!panel) return;
    const intro = panel.querySelector('.board-intro');
    const metricBadge = document.createElement('span');
    metricBadge.className = 'board-metric';
    metricBadge.textContent = 'Primary · Net gain ΔSR (pp)';
    intro.append(metricBadge);

    const controls = document.createElement('div');
    controls.className = 'board-controls';
    controls.innerHTML = `
      <label>Platform
        <select aria-label="Rescue platform">
          <option value="all">All platforms</option>
          <option value="RoboTwin">RoboTwin (RW)</option>
          <option value="ManiSkill">ManiSkill (MS)</option>
        </select>
      </label>
      <label>Source family
        <select aria-label="Rescue source family">
          <option value="all">All families</option>
          <option value="VLA">VLA</option>
          <option value="RDT">RDT</option>
          <option value="WAM">WAM</option>
        </select>
      </label>
    `;
    intro.after(controls);

    const table = panel.querySelector('table');
    const tbody = table.tBodies[0];
    const [platformSel, sourceSel] = controls.querySelectorAll('select');

    const protocol = document.createElement('details');
    protocol.className = 'board-protocol';
    protocol.innerHTML = `<summary>Evaluation details &amp; footnotes</summary><p>Each system uses its own matched OFF baseline from the frozen 300-scenario challenge pool; compatible subsets and source checkpoints differ across rows, so rows are not ranked against a shared denominator. R counts rescued OFF failures; H counts disrupted OFF successes; ΔSR = ON SR − OFF SR = (R − H) / n in percentage points. * VLA-Corrector (all-phase) retains 3 unresolved initial-identity admission holds (169/172 scored).</p>`;
    panel.append(protocol);

    function render() {
      const plat = platformSel.value;
      const src = sourceSel.value;
      const filtered = TRACK3_DATA.filter(
        d => (plat === 'all' || d.platform === plat) && (src === 'all' || d.source === src)
      );
      tbody.innerHTML = '';
      const colSpan = 9;

      if (!filtered.length) {
        const emptyRow = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colSpan;
        td.className = 'empty';
        td.textContent = 'No online systems evaluated for this platform and source-family combination.';
        emptyRow.append(td);
        tbody.append(emptyRow);
        return;
      }

      filtered.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.append(
          makeCell(item.source),
          makeCell(item.platform),
          makeCell(item.ratio),
          makeCell(fmt(item.off)),
          makeCell(fmt(item.on)),
          makeCell(String(item.rescue)),
          makeCell(String(item.harm)),
          makeDeltaBadgeCell(item.delta)
        );
        const detail = buildDetailBlock(
          `${item.source} · ${item.platform} matched OFF/ON evaluation`,
          [
            ['Evaluated pairs', item.ratio],
            ['OFF → ON SR', `${fmt(item.off)}% → ${fmt(item.on)}%`],
            ['Rescue / Harm', `${item.rescue} rescued · ${item.harm} harmed`],
            ['Net gain ΔSR', `${fmtSigned(item.delta)} pp`]
          ],
          ['Outcome summary', 'Detail'],
          [['Paired trace', item.accounting]],
          `Interface: ${item.access}.`
        );
        attachDetailToggle(tr, tbody, `det-t3-${idx}`, '', item.system, detail, colSpan);
      });
    }

    controls.addEventListener('change', render);
    render();
  }

  initTrack1();
  initTrack2();
  initTrack3();
})();
