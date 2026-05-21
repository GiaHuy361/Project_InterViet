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

function base64ToUint8Array(base64: string): Uint8Array {
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
  private microphone: MediaStreamAudioSourceNode | null = null;
  private localStream: MediaStream | null = null;
  private callbacks: OpenAiWebRtcClientCallbacks;
  
  private playbackCtx: AudioContext | null = null;
  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  
  private currentAssistantItemId: string | null = null;
  private accumulatedAssistantText: string = '';
  
  constructor(callbacks: OpenAiWebRtcClientCallbacks) {
    this.callbacks = callbacks;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return null;
  }

  public async connect(connectUrl: string, clientSecret: string, instructions?: string | null): Promise<void> {
    try {
      // 1. Request microphone permission
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        let friendlyErr = new Error('Microphone permission denied.');
        if (err.name === 'NotAllowedError') {
          friendlyErr = new Error('Người dùng chưa cấp quyền microphone.');
        } else if (err.name === 'NotFoundError') {
          friendlyErr = new Error('Không tìm thấy microphone trên thiết bị.');
        } else if (err.name === 'NotReadableError') {
          friendlyErr = new Error('Microphone đang được sử dụng bởi một ứng dụng khác.');
        }
        throw friendlyErr;
      }

      // 2. Initialize AudioContexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      // Recording at 16kHz
      this.audioContext = new AudioContextClass({ sampleRate: 16000 });
      this.playbackCtx = new AudioContextClass(); // Playback at default sample rate, but buffers created at 24kHz

      // 3. Connect to WebSocket
      let wsUrl = connectUrl;
      if (clientSecret) {
        const sep = wsUrl.includes('?') ? '&' : '?';
        wsUrl = `${wsUrl}${sep}client_secret=${encodeURIComponent(clientSecret)}`;
      }

      this.ws = new WebSocket(wsUrl);

      await new Promise<void>((resolve, reject) => {
        if (!this.ws) return reject(new Error('WebSocket was not created'));

        const timeout = setTimeout(() => {
          this.disconnect();
          reject(new Error('WebSocket connection timeout'));
        }, 15000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[GeminiLiveClient] WebSocket connection established');
          if (this.callbacks.onConnectionStateChange) {
            this.callbacks.onConnectionStateChange('connected');
          }
          
          // Start recording after connection open
          this.startRecording();
          resolve();
        };

        this.ws.onerror = (err) => {
          clearTimeout(timeout);
          console.error('[GeminiLiveClient] WebSocket connection error:', err);
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error('Failed to connect to backend proxy'));
          }
          reject(err);
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event);
        };

        this.ws.onclose = () => {
          console.log('[GeminiLiveClient] WebSocket connection closed');
          if (this.callbacks.onConnectionStateChange) {
            this.callbacks.onConnectionStateChange('closed');
          }
        };
      });

    } catch (error: any) {
      this.disconnect();
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  private startRecording(): void {
    if (!this.audioContext || !this.localStream) return;

    this.microphone = this.audioContext.createMediaStreamSource(this.localStream);
    // Buffer size 2048 samples: ~128ms latency at 16kHz
    this.processor = this.audioContext.createScriptProcessor(2048, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBuffer = new Int16Array(inputData.length);
      
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      const base64Audio = arrayBufferToBase64(pcmBuffer.buffer);
      const clientMessage = {
        realtime_input: {
          audio: {
            mime_type: 'audio/pcm;rate=16000',
            data: base64Audio
          }
        }
      };

      try {
        this.ws.send(JSON.stringify(clientMessage));
      } catch (err) {
        console.error('[GeminiLiveClient] Error sending audio chunk:', err);
      }
    };

    this.microphone.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    console.log('[GeminiLiveClient] Audio recording started at 16kHz');
  }

  private handleServerMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      // Handle interruption signal (barge-in)
      if (message.interrupted) {
        console.log('[GeminiLiveClient] Server interrupted current turn');
        this.stopAudioPlayback();
        return;
      }

      if (message.serverContent) {
        const { modelTurn, turnComplete } = message.serverContent;
        
        if (modelTurn) {
          // Lazy generate current assistant item ID if not present
          if (!this.currentAssistantItemId) {
            this.currentAssistantItemId = 'gemini-assistant-' + generateUuid();
            this.accumulatedAssistantText = '';
          }

          const parts = modelTurn.parts || [];
          for (const part of parts) {
            // 1. Play Audio
            if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/')) {
              const base64Data = part.inlineData.data;
              if (base64Data) {
                this.playAudioChunk(base64Data);
              }
            }
            
            // 2. Show Text Delta
            if (part.text) {
              this.accumulatedAssistantText += part.text;
              if (this.callbacks.onAssistantTranscriptDelta) {
                this.callbacks.onAssistantTranscriptDelta(part.text, this.currentAssistantItemId);
              }
            }
          }
        }

        if (turnComplete) {
          console.log('[GeminiLiveClient] Turn complete');
          if (this.currentAssistantItemId && this.callbacks.onAssistantTranscriptDone) {
            this.callbacks.onAssistantTranscriptDone(this.accumulatedAssistantText, this.currentAssistantItemId);
          }
          this.currentAssistantItemId = null;
          this.accumulatedAssistantText = '';
        }
      }
    } catch (err) {
      console.error('[GeminiLiveClient] Error processing server message:', err);
    }
  }

  private playAudioChunk(base64: string): void {
    if (!this.playbackCtx) return;

    try {
      const uint8 = base64ToUint8Array(base64);
      const int16 = new Int16Array(uint8.buffer, uint8.byteOffset, uint8.byteLength / 2);
      
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      // Create an AudioBuffer at 24kHz (since Gemini output audio is 24kHz PCM)
      const playBuffer = this.playbackCtx.createBuffer(1, float32.length, 24000);
      playBuffer.getChannelData(0).set(float32);

      const source = this.playbackCtx.createBufferSource();
      source.buffer = playBuffer;
      source.connect(this.playbackCtx.destination);

      // Track active sources for stopping on interruption
      this.activeSources.push(source);
      source.onended = () => {
        this.activeSources = this.activeSources.filter(s => s !== source);
      };

      const startTime = Math.max(this.playbackCtx.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + playBuffer.duration;

    } catch (err) {
      console.error('[GeminiLiveClient] Error playing audio chunk:', err);
    }
  }

  private stopAudioPlayback(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might have already finished
      }
    });
    this.activeSources = [];
    this.nextPlayTime = this.playbackCtx ? this.playbackCtx.currentTime : 0;
  }

  public sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open.');
    }

    const clientMessage = {
      client_content: {
        turns: [
          {
            role: 'user',
            parts: [
              {
                text: text
              }
            ]
          }
        ],
        turn_complete: true
      }
    };

    try {
      this.ws.send(JSON.stringify(clientMessage));
    } catch (err) {
      console.error('[GeminiLiveClient] Error sending text message:', err);
      throw err;
    }
  }

  public disconnect(): void {
    // 1. Stop recording nodes
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    // 2. Stop microphone track
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // 3. Stop audio contexts
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    this.stopAudioPlayback();
    if (this.playbackCtx) {
      this.playbackCtx.close().catch(console.error);
      this.playbackCtx = null;
    }

    // 4. Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
