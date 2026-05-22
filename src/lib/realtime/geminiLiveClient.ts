import { OpenAiWebRtcClientCallbacks } from './openAiWebRtcClient';

function generateUuid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

function base64ToUint8Array(base64Str: string): Uint8Array {
  let base64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');

  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }

  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private localStream: MediaStream | null = null;
  private callbacks: OpenAiWebRtcClientCallbacks;

  private playbackCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  private setupComplete: boolean = false;
  private hasSentInitialKickoff: boolean = false;

  private currentAssistantItemId: string | null = null;
  private currentUserId: string | null = null;
  private accumulatedAssistantText: string = '';
  private accumulatedUserText: string = '';
  private userTranscriptDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingUserTranscriptText: string = '';
  private pendingUserTranscriptId: string | null = null;

  public isMuted: boolean = false;

  constructor(callbacks: OpenAiWebRtcClientCallbacks) {
    this.callbacks = callbacks;
  }

  // Expose local stream for callers that expect a WebRTC-like client
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Informational: whether playback/context is currently suspended (used by UI)
  public isSuspended(): boolean {
    if (!this.playbackCtx) return false;
    return this.playbackCtx.state === 'suspended';
  }

  public async connect(connectUrl: string, clientSecret: string): Promise<void> {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    this.audioContext = new AudioContextClass({ sampleRate: 16000 });
    this.playbackCtx = new AudioContextClass();

    let wsUrl = connectUrl;

    if (clientSecret) {
      const sep = wsUrl.includes('?') ? '&' : '?';
      wsUrl = `${wsUrl}${sep}client_secret=${encodeURIComponent(clientSecret)}`;
    }

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[GeminiLiveClient] Connected');
      void this.resumeContexts();
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange('connected');
      }
      // Do NOT start sending audio until server sends setupComplete.
      console.debug('[GeminiLiveClient] Waiting for setupComplete before starting capture');
    };

    this.ws.onmessage = (event) => {
      void this.handleServerMessage(event);
    };

    this.ws.onerror = (err) => {
      console.error('[GeminiLiveClient] WebSocket error:', err);
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange('failed');
      }
    };

    this.ws.onclose = (ev) => {
      console.warn('[GeminiLiveClient] WebSocket connection closed', {
        code: ev.code,
        reason: ev.reason
      });
      if (this.callbacks.onConnectionStateChange) {
        this.callbacks.onConnectionStateChange('closed');
      }
    };
  }

  private async startRecording(): Promise<void> {
    if (!this.audioContext || !this.localStream) return;

    await this.audioContext.resume();

    this.microphone = this.audioContext.createMediaStreamSource(this.localStream);

    try {
      await this.audioContext.audioWorklet.addModule('/audio-processor.js');

      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'pcm-audio-processor'
      );

      this.audioWorkletNode.port.onmessage = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (this.isMuted) return;

        const originalData: Float32Array = e.data.audioData;

        const pcmBuffer = new Int16Array(originalData.length);

        for (let i = 0; i < originalData.length; i++) {
          const s = Math.max(-1, Math.min(1, originalData[i]));
          pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        if (pcmBuffer.length === 0) return;

        const base64Audio = arrayBufferToBase64(pcmBuffer.buffer);

        const payload = {
          realtimeInput: {
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }
          }
        };

        console.debug('[GeminiLiveClient] Sending audio chunk (base64 len)', base64Audio.length);

        this.ws.send(JSON.stringify(payload));
      };

      this.microphone.connect(this.audioWorkletNode);

      const silentGain = this.audioContext.createGain();
      silentGain.gain.value = 0;

      this.audioWorkletNode.connect(silentGain);
      silentGain.connect(this.audioContext.destination);

      console.log('[GeminiLiveClient] Recording started');
    } catch (err) {
      console.warn('[GeminiLiveClient] Falling back to ScriptProcessorNode', err);

      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        if (this.isMuted) return;

        const input = e.inputBuffer.getChannelData(0);

        const pcmBuffer = new Int16Array(input.length);

        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        if (pcmBuffer.length === 0) return;

        const base64Audio = arrayBufferToBase64(pcmBuffer.buffer);

        const payload = {
          realtimeInput: {
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }
          }
        };

        console.debug('[GeminiLiveClient] Sending audio chunk (scriptProcessor) base64 len', base64Audio.length);

        this.ws.send(JSON.stringify(payload));
      };

      this.microphone.connect(this.processor);

      const silentGain = this.audioContext.createGain();
      silentGain.gain.value = 0;

      this.processor.connect(silentGain);
      silentGain.connect(this.audioContext.destination);
    }
  }

  private async handleServerMessage(event: MessageEvent): Promise<void> {
    try {
      const data =
        typeof event.data === 'string'
          ? event.data
          : await event.data.text();

      const message = JSON.parse(data);

      // Detect setupComplete messages from Gemini
      if (message.setupComplete || message.setup_complete) {
        console.debug('[GeminiLiveClient] Received setupComplete from server');
        this.setupComplete = true;
        // start recording after setupComplete (if not already started)
        void this.startRecording();
        this.sendInitialKickoffIfNeeded();
      }

      console.debug('[GeminiLiveClient] Received message keys:', Object.keys(message));

      const serverContent = message.serverContent || message.server_content;

      if (!serverContent) return;

      const interrupted = Boolean(serverContent.interrupted);
      const turnComplete = Boolean(serverContent.turnComplete || serverContent.turn_complete);
      const generationComplete = Boolean(serverContent.generationComplete || serverContent.generation_complete);

      // If model turn is interrupted, stop queued playback immediately to avoid stale audio overlap.
      if (interrupted) {
        console.debug('[GeminiLiveClient] serverContent.interrupted=true, clearing playback queue');
        this.clearPlaybackQueue();
        this.resetUserTurn();
      }

      const modelTurn = serverContent.modelTurn || serverContent.model_turn;

      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          const inlineData = part.inlineData || part.inline_data;

          if (!inlineData) continue;

          const mimeType = inlineData.mimeType || inlineData.mime_type;

          if (!mimeType?.startsWith('audio/')) continue;

          const base64Data = inlineData.data;

          if (base64Data) {
            console.debug('[GeminiLiveClient] Received audio chunk (base64 len)', base64Data.length, 'mimeType', mimeType);
            this.playAudioChunk(base64Data);
          }
        }
      }

      // Handle output transcription (may arrive independently of serverContent)
      const outputTranscription = serverContent.outputTranscription || serverContent.output_transcription || message.outputTranscription || message.output_transcription;
      if (outputTranscription?.text) {
        const text = outputTranscription.text;

        console.debug('[GeminiLiveClient] Received outputTranscription:', text);

        // Assistant started/continued speaking; user turn is considered committed.
        this.resetUserTurn();

        if (!this.currentAssistantItemId) {
          this.currentAssistantItemId = 'gemini-' + generateUuid();
          this.accumulatedAssistantText = '';
        }

        this.accumulatedAssistantText += text;

        if (this.callbacks.onAssistantTranscriptDelta) {
          this.callbacks.onAssistantTranscriptDelta(text, this.currentAssistantItemId);
        }
      }

      // Gemini marks end of model turn with turnComplete; finalize the current assistant transcript.
      if (turnComplete || generationComplete) {
        this.finalizeAssistantTurn();
      }

      // Also handle input transcription (user speech -> transcript)
      const inputTranscription = serverContent.inputTranscription || serverContent.input_transcription || message.inputTranscription || message.input_transcription;
      if (inputTranscription?.text) {
        const text = String(inputTranscription.text || '').trim();
        if (!text) return;

        console.debug('[GeminiLiveClient] Received inputTranscription:', text);
        this.handleUserTranscription(text);
      }
    } catch (err) {
      console.error('[GeminiLiveClient] Message parse error:', err);
    }
  }

  private playAudioChunk(base64: string): void {
    if (!this.playbackCtx) return;

    const uint8 = base64ToUint8Array(base64);

    const sampleCount = uint8.byteLength / 2;
    const float32 = new Float32Array(sampleCount);

    const view = new DataView(uint8.buffer);

    for (let i = 0; i < sampleCount; i++) {
      float32[i] = view.getInt16(i * 2, true) / 32768;
    }

    // Gemini Live audio chunks are 16-bit PCM at 24kHz.
    const sampleRate = 24000;
    const audioBuffer = this.playbackCtx.createBuffer(1, float32.length, sampleRate);

    audioBuffer.getChannelData(0).set(float32);

    const source = this.playbackCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackCtx.destination);
    this.activeSources.push(source);

    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
    };

    const startTime = Math.max(
      this.playbackCtx.currentTime,
      this.nextPlayTime
    );

    source.start(startTime);

    this.nextPlayTime = startTime + audioBuffer.duration;
  }

  private clearPlaybackQueue(): void {
    if (!this.playbackCtx) return;

    for (const source of this.activeSources) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        // Ignore "cannot stop" race conditions.
      }
    }

    this.activeSources = [];
    this.nextPlayTime = this.playbackCtx.currentTime;
  }

  private finalizeAssistantTurn(): void {
    if (!this.currentAssistantItemId) return;

    const finalText = this.accumulatedAssistantText.trim();
    if (finalText && this.callbacks.onAssistantTranscriptDone) {
      this.callbacks.onAssistantTranscriptDone(finalText, this.currentAssistantItemId);
    }

    this.currentAssistantItemId = null;
    this.accumulatedAssistantText = '';
  }

  public sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open.');
    }

    const clientMessage = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text }]
          }
        ],
        turnComplete: true
      }
    };

    this.ws.send(JSON.stringify(clientMessage));
  }

  public endTurn(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const endMsg = {
      realtimeInput: {
        activityEnd: true
      }
    };

    this.ws.send(JSON.stringify(endMsg));
    this.resetUserTurn();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public disconnect(): void {
    this.finalizeAssistantTurn();
    this.clearPlaybackQueue();

    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    if (this.playbackCtx) {
      this.playbackCtx.close().catch(console.error);
      this.playbackCtx = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.userTranscriptDebounceTimer) {
      clearTimeout(this.userTranscriptDebounceTimer);
      this.userTranscriptDebounceTimer = null;
    }
  }

  public async resumeContexts(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    if (this.playbackCtx && this.playbackCtx.state === 'suspended') {
      await this.playbackCtx.resume();
    }
  }

  private handleUserTranscription(text: string): void {
    if (!this.callbacks.onUserTranscript) return;

    if (!this.currentUserId) {
      this.currentUserId = 'user-' + generateUuid();
      this.accumulatedUserText = '';
    }

    // De-dup repeated server updates.
    if (text === this.accumulatedUserText) return;

    // Most updates are incremental revisions of the same utterance.
    if (
      this.accumulatedUserText &&
      !(text.startsWith(this.accumulatedUserText) || this.accumulatedUserText.startsWith(text))
    ) {
      // New utterance in same stream => start a fresh turn id.
      this.currentUserId = 'user-' + generateUuid();
    }

    this.accumulatedUserText = text;
    this.emitUserTranscriptDebounced(text, this.currentUserId);
  }

  private resetUserTurn(): void {
    this.flushPendingUserTranscript();
    this.currentUserId = null;
    this.accumulatedUserText = '';
  }

  private emitUserTranscriptDebounced(text: string, itemId: string): void {
    this.pendingUserTranscriptText = text;
    this.pendingUserTranscriptId = itemId;

    if (this.userTranscriptDebounceTimer) {
      clearTimeout(this.userTranscriptDebounceTimer);
    }

    this.userTranscriptDebounceTimer = setTimeout(() => {
      this.flushPendingUserTranscript();
    }, 150);
  }

  private flushPendingUserTranscript(): void {
    if (!this.callbacks.onUserTranscript) return;
    if (!this.pendingUserTranscriptId || !this.pendingUserTranscriptText) return;

    this.callbacks.onUserTranscript(this.pendingUserTranscriptText, this.pendingUserTranscriptId);
    this.pendingUserTranscriptText = '';
    this.pendingUserTranscriptId = null;

    if (this.userTranscriptDebounceTimer) {
      clearTimeout(this.userTranscriptDebounceTimer);
      this.userTranscriptDebounceTimer = null;
    }
  }

  private sendInitialKickoffIfNeeded(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!this.setupComplete || this.hasSentInitialKickoff) return;

    this.hasSentInitialKickoff = true;
    const kickoffMessage = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [
              {
                text: 'Bắt đầu phỏng vấn ngay bây giờ. Hãy chào ứng viên và hỏi câu đầu tiên.'
              }
            ]
          }
        ],
        turnComplete: true
      }
    };

    this.ws.send(JSON.stringify(kickoffMessage));
  }
}
