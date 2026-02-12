// ═══════════════════════════════════════════════════
// Royal Music — Audio Processing Utilities
// Uses Web Audio API (OfflineAudioContext) for
// normalization, EQ, compression, and WAV export.
// ═══════════════════════════════════════════════════

export interface EnhanceSettings {
  gain: number;          // normalization multiplier (e.g. 1.0–2.0)
  bass: number;          // low-shelf EQ in dB  (–12 to +12)
  mid: number;           // peaking EQ in dB    (–12 to +12)
  treble: number;        // high-shelf EQ in dB (–12 to +12)
  presence: number;      // peaking EQ in dB    (–12 to +12)
  compThreshold: number; // compressor threshold in dB (–50 to 0)
  compRatio: number;     // compression ratio    (1 to 20)
  compAttack: number;    // attack in seconds    (0.001 to 1)
  compRelease: number;   // release in seconds   (0.01 to 1)
  makeupGain: number;    // post-compression gain in dB (0 to 12)
}

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  peakLevel: number;
  rmsLevel: number;
}

/**
 * Analyse an AudioBuffer and return loudness / peak info.
 */
export function analyzeAudio(buffer: AudioBuffer): AudioAnalysis {
  let peakLevel = 0;
  let rmsSum = 0;
  let totalSamples = 0;

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peakLevel) peakLevel = abs;
      rmsSum += data[i] * data[i];
      totalSamples++;
    }
  }

  return {
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,
    peakLevel,
    rmsLevel: Math.sqrt(rmsSum / totalSamples),
  };
}

/**
 * Run the full enhancement chain on an AudioBuffer using OfflineAudioContext.
 *
 * Chain: source → gain → bass EQ → mid EQ → treble EQ → presence EQ
 *        → compressor → makeup gain → destination
 */
export async function processAudio(
  buffer: AudioBuffer,
  settings: EnhanceSettings,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate,
  );

  // ── Source ──
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // ── Input gain (normalization) ──
  const gainNode = ctx.createGain();
  gainNode.gain.value = settings.gain;

  // ── EQ: Bass (low shelf @ 100 Hz) ──
  const bassEQ = ctx.createBiquadFilter();
  bassEQ.type = "lowshelf";
  bassEQ.frequency.value = 100;
  bassEQ.gain.value = settings.bass;

  // ── EQ: Mid (peaking @ 1 kHz) ──
  const midEQ = ctx.createBiquadFilter();
  midEQ.type = "peaking";
  midEQ.frequency.value = 1000;
  midEQ.Q.value = 1.0;
  midEQ.gain.value = settings.mid;

  // ── EQ: Treble (high shelf @ 4 kHz) ──
  const trebleEQ = ctx.createBiquadFilter();
  trebleEQ.type = "highshelf";
  trebleEQ.frequency.value = 4000;
  trebleEQ.gain.value = settings.treble;

  // ── EQ: Presence (peaking @ 3 kHz) ──
  const presenceEQ = ctx.createBiquadFilter();
  presenceEQ.type = "peaking";
  presenceEQ.frequency.value = 3000;
  presenceEQ.Q.value = 1.5;
  presenceEQ.gain.value = settings.presence;

  // ── Dynamics compressor ──
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = settings.compThreshold;
  compressor.ratio.value = settings.compRatio;
  compressor.attack.value = settings.compAttack;
  compressor.release.value = settings.compRelease;
  compressor.knee.value = 6;

  // ── Makeup gain (dB → linear) ──
  const makeupNode = ctx.createGain();
  makeupNode.gain.value = Math.pow(10, settings.makeupGain / 20);

  // ── Connect the chain ──
  source.connect(gainNode);
  gainNode.connect(bassEQ);
  bassEQ.connect(midEQ);
  midEQ.connect(trebleEQ);
  trebleEQ.connect(presenceEQ);
  presenceEQ.connect(compressor);
  compressor.connect(makeupNode);
  makeupNode.connect(ctx.destination);

  source.start(0);
  return ctx.startRendering();
}

// ── WAV encoder ─────────────────────────────────────────────────────────────

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Encode an AudioBuffer to a 16-bit PCM WAV Blob.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const totalLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);           // chunk size
  view.setUint16(20, 1, true);            // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Interleave channel samples
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

/**
 * Draw a simple waveform onto a canvas from an AudioBuffer.
 */
export function drawWaveform(
  canvas: HTMLCanvasElement,
  buffer: AudioBuffer,
  color: string = "#8533ff",
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / width);
  const mid = height / 2;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  for (let x = 0; x < width; x++) {
    let min = 1.0;
    let max = -1.0;
    const start = x * step;
    const end = Math.min(start + step, data.length);

    for (let j = start; j < end; j++) {
      if (data[j] < min) min = data[j];
      if (data[j] > max) max = data[j];
    }

    const yLow = mid + min * mid;
    const yHigh = mid + max * mid;

    ctx.moveTo(x, yLow);
    ctx.lineTo(x, yHigh);
  }

  ctx.stroke();
}
