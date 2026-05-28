/**
 * AudioWorklet processor chạy trên dedicated audio thread (không bị block bởi main thread).
 * Gom 4096 samples (~85ms @ 48kHz) rồi gửi về main thread để forward tới Gemini.
 * Buffer lớn hơn giúp Gemini nhận diện giọng nói chính xác hơn.
 */
class PCMAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Choose chunk duration ~120ms to balance latency and ASR accuracy.
    // Use global `sampleRate` provided by the audio worklet environment.
    const chunkMs = 120;
    const len = Math.max(1024, Math.floor(sampleRate * (chunkMs / 1000)));
    this._buffer = new Float32Array(len);
    this._writeIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._writeIndex++] = channelData[i];

      if (this._writeIndex >= this._buffer.length) {
        // Post a copy of the buffer to the main thread
        this.port.postMessage({ audioData: this._buffer.slice(0) });
        this._writeIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-audio-processor', PCMAudioProcessor);
