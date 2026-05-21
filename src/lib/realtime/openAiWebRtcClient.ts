/**
 * WebRTC client wrapper that handles the peer connection to the OpenAI Realtime API (or proxy).
 */

export interface OpenAiWebRtcClientCallbacks {
  onUserTranscript?: (text: string, itemId: string) => void;
  onAssistantTranscriptDelta?: (delta: string, itemId: string) => void;
  onAssistantTranscriptDone?: (text: string, itemId: string) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onAudioTrack?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export class OpenAiWebRtcClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: OpenAiWebRtcClientCallbacks = {};

  constructor(callbacks: OpenAiWebRtcClientCallbacks) {
    this.callbacks = callbacks;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
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

      // 2. Create RTCPeerConnection
      this.pc = new RTCPeerConnection();

      // Set up connection state change handler
      this.pc.onconnectionstatechange = () => {
        if (this.pc && this.callbacks.onConnectionStateChange) {
          this.callbacks.onConnectionStateChange(this.pc.connectionState);
        }
      };

      // Set up remote track handler to receive audio
      this.pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          this.remoteStream = stream;
          if (this.callbacks.onAudioTrack) {
            this.callbacks.onAudioTrack(stream);
          }
          // Simple browser audio playback
          const audio = new Audio();
          audio.srcObject = stream;
          audio.autoplay = true;
          audio.play().catch((audioErr) => {
            console.error('Audio playback failed or was blocked by browser policy:', audioErr);
          });
        }
      };

      // 3. Add local microphone audio track to connection
      this.localStream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });

      // 4. Create data channel for OpenAI Events ('oai-events')
      this.dc = this.pc.createDataChannel('oai-events');
      this.setupDataChannel(this.dc, instructions);

      // 5. Create SDP Offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 6. POST SDP offer to connectUrl
      const headers: Record<string, string> = {
        'Content-Type': 'application/sdp',
      };
      
      if (clientSecret) {
        headers['Authorization'] = `Bearer ${clientSecret}`;
      }

      const response = await fetch(connectUrl, {
        method: 'POST',
        body: offer.sdp,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to establish WebRTC connection with server: ${response.status} ${errorText}`);
      }

      // 7. Parse SDP answer defensively
      const responseText = await response.text();
      let remoteSdp = responseText;
      try {
        const json = JSON.parse(responseText);
        if (json.sdp) {
          remoteSdp = json.sdp;
        } else if (json.answer) {
          remoteSdp = json.answer;
        }
      } catch {
        // Response is raw text SDP
      }

      // 8. Set Remote Description
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: remoteSdp,
      });

    } catch (error: any) {
      this.disconnect();
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      throw error;
    }
  }

  private setupDataChannel(dc: RTCDataChannel, instructions?: string | null) {
    dc.onopen = () => {
      console.log('OpenAI Realtime data channel opened');
      
      // Update session with instructions and audio transcription if needed
      // Most Python proxies or OpenAI direct connect require enabling input_audio_transcription
      const sessionUpdate = {
        type: 'session.update',
        session: {
          input_audio_transcription: {
            model: 'whisper-1'
          },
          ...(instructions ? { instructions } : {})
        }
      };
      dc.send(JSON.stringify(sessionUpdate));
    };

    dc.onmessage = (event) => {
      try {
        const oaiEvent = JSON.parse(event.data);
        this.handleDataChannelEvent(oaiEvent);
      } catch (err) {
        console.error('Error parsing OpenAI event:', err);
      }
    };

    dc.onerror = (err) => {
      console.error('Data channel error:', err);
    };
  }

  private handleDataChannelEvent(event: any) {
    // Check event types
    switch (event.type) {
      case 'conversation.item.input_audio_transcription.completed':
        // Candidate voice has been fully transcribed
        if (event.transcript && this.callbacks.onUserTranscript) {
          this.callbacks.onUserTranscript(event.transcript.trim(), event.item_id || event.itemId);
        }
        break;

      case 'response.audio_transcript.delta':
        // Assistant streaming delta
        if (event.delta && this.callbacks.onAssistantTranscriptDelta) {
          this.callbacks.onAssistantTranscriptDelta(event.delta, event.item_id || event.itemId);
        }
        break;

      case 'response.audio_transcript.done':
        // Assistant finished speaking current turn
        if (event.transcript && this.callbacks.onAssistantTranscriptDone) {
          this.callbacks.onAssistantTranscriptDone(event.transcript.trim(), event.item_id || event.itemId);
        }
        break;
      
      case 'error':
        console.error('OpenAI data channel event error:', event.error);
        if (this.callbacks.onError && event.error?.message) {
          this.callbacks.onError(new Error(event.error.message));
        }
        break;

      default:
        // Ignore unhandled event types
        break;
    }
  }

  public sendTextMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const messageEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };
    this.dc.send(JSON.stringify(messageEvent));

    // Request response generation
    const responseEvent = {
      type: 'response.create'
    };
    this.dc.send(JSON.stringify(responseEvent));
  }

  public disconnect(): void {
    // Stop local microphone track
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close data channel
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    // Close peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    this.remoteStream = null;
  }
}
