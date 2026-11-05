// Minimal types for the parts of essentia.js 0.1.3 we use (the package ships none for its Node entry).
declare module 'essentia.js' {
  type Vector = { delete?: () => void };
  export class Essentia {
    constructor(wasm: unknown);
    arrayToVector(a: Float32Array): Vector;
    RhythmExtractor2013(signal: Vector, maxTempo?: number, method?: string, minTempo?: number): { bpm: number; confidence: number; ticks: Vector };
    KeyExtractor(
      audio: Vector, averageDetuningCorrection?: boolean, frameSize?: number, hopSize?: number, hpcpSize?: number,
      maxFrequency?: number, maximumSpectralPeaks?: number, minFrequency?: number, pcpThreshold?: number, profileType?: string,
      sampleRate?: number, spectralPeaksThreshold?: number, tuningFrequency?: number, weightType?: string, windowType?: string,
    ): { key: string; scale: string; strength: number };
  }
  export const EssentiaWASM: unknown;
}
