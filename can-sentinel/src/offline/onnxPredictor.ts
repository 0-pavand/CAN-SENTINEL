/**
 * ONNX inference using onnxruntime-web (WASM).
 * Mirrors backend app/ml/inference.py OnnxPredictor exactly.
 * Model input: [1, 16, 66] float32
 * Model output: [1, 1] logit → sigmoid → probability
 */

import * as ort from 'onnxruntime-web';

export interface ScalerConfig {
  features: string[];
  means: Record<string, number>;
  stds: Record<string, number>;
}

export class OnnxPredictor {
  private session: ort.InferenceSession | null = null;
  private config: ScalerConfig | null = null;
  private inputName = 'input';
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Set WASM paths to use locally served files
    ort.env.wasm.wasmPaths = '/';
  }

  async initialize(modelPath: string, scalerPath: string): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInit(modelPath, scalerPath);
    return this.initPromise;
  }

  private async _doInit(modelPath: string, scalerPath: string): Promise<void> {
    // Load scaler config
    const scalerResp = await fetch(scalerPath);
    if (!scalerResp.ok) throw new Error(`Failed to fetch scaler config: ${scalerPath}`);
    this.config = await scalerResp.json() as ScalerConfig;

    // Load ONNX model
    this.session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['wasm'],
    });

    // Get input name from model
    this.inputName = this.session.inputNames[0];
  }

  isReady(): boolean {
    return this.session !== null && this.config !== null;
  }

  preprocessSequence(rawSequence: Array<Record<string, number>>): Float32Array {
    if (!this.config) throw new Error('OnnxPredictor not initialized');
    const { features, means, stds } = this.config;
    const seqLen = rawSequence.length;
    const numFeatures = features.length;

    const arr = new Float32Array(seqLen * numFeatures);

    for (let i = 0; i < seqLen; i++) {
      const row = rawSequence[i];
      for (let j = 0; j < numFeatures; j++) {
        const col = features[j];
        let val = row[col] ?? 0.0;
        if (!isFinite(val)) val = 1e6;
        const mean = means[col] ?? 0.0;
        const std = stds[col] === 0 ? 1.0 : (stds[col] ?? 1.0);
        arr[i * numFeatures + j] = (val - mean) / std;
      }
    }
    return arr;
  }

  async predict(rawSequence: Array<Record<string, number>>): Promise<number> {
    if (!this.session || !this.config) throw new Error('OnnxPredictor not initialized');
    const { features } = this.config;
    const seqLen = rawSequence.length;
    const numFeatures = features.length;

    const arr = this.preprocessSequence(rawSequence);

    // Model expects [1, seqLen, numFeatures]
    const tensor = new ort.Tensor('float32', arr, [1, seqLen, numFeatures]);
    const feeds = { [this.inputName]: tensor };
    const results = await this.session.run(feeds);
    const outputName = this.session.outputNames[0];
    const logit = (results[outputName].data as Float32Array)[0];

    // Sigmoid
    return 1.0 / (1.0 + Math.exp(-logit));
  }
}
