import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import {
  Mic,
  PhoneOff,
  Volume2,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  BarChart3,
  Undo2,
  FileText,
  User,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';
import { ApiError } from '../../lib/api/apiError';
import {
  getInterview,
  startInterviewRealtime,
  endInterviewRealtime,
  finalizeInterviewRealtime,
  completeInterview,
  type InterviewSession,
  type FinalizeRealtimeQaPair,
  type InterviewReport
} from '../../services/interviewService';
import { OpenAiWebRtcClient } from '../../lib/realtime/openAiWebRtcClient';
import { GeminiLiveClient } from '../../lib/realtime/geminiLiveClient';
import { TranscriptBuilder } from '../../lib/realtime/transcriptBuilder';

type VoiceState =
  | 'Starting'
  | 'Connecting'
  | 'Live'
  | 'Ended'
  | 'Finalizing'
  | 'ReadyToComplete'
  | 'Completing'
  | 'Report'
  | 'Error';

export const InterviewVoiceLivePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Voice configurations from location state (forwarded from pre-call)
  const voice = location.state?.voice || 'alloy';
  const language = location.state?.language || 'vi';
  const enableTranscript = location.state?.enableTranscript !== false;

  // Session state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [state, setState] = useState<VoiceState>('Starting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isAudioSuspended, setIsAudioSuspended] = useState(false);

  // Realtime token and endpoints (kept in memory, never persisted)
  const realtimeSessionIdRef = useRef<string | null>(null);
  const clientSecretRef = useRef<string | null>(null);
  const connectUrlRef = useRef<string | null>(null);

  // WebRTC / WebSocket Client and Transcript Builder
  const rtcClientRef = useRef<OpenAiWebRtcClient | GeminiLiveClient | null>(null);
  const builderRef = useRef<TranscriptBuilder>(new TranscriptBuilder());
  const [turns, setTurns] = useState<any[]>([]);

  // Audio Visualizer refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Manual Review Editor state
  const [manualTranscript, setManualTranscript] = useState('');
  const [manualQaPairs, setManualQaPairs] = useState<FinalizeRealtimeQaPair[]>([]);
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null);

  // Final Report details
  const [completedReport, setCompletedReport] = useState<InterviewReport | null>(null);

  // 1. Prevent accidental page reload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === 'Live' || state === 'Connecting') {
        e.preventDefault();
        e.returnValue = 'Cuộc phỏng vấn đang diễn ra. Nếu rời đi hoặc tải lại trang, kết nối sẽ bị ngắt và không thể khôi phục.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  // 2. Call duration timer
  useEffect(() => {
    let timer: any;
    if (state === 'Live') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state]);

  // 2b. Audio context state checker (checks if browser autoplay is blocking audio)
  useEffect(() => {
    let checkInterval: any;
    if (state === 'Live' && rtcClientRef.current) {
      checkInterval = setInterval(() => {
        const client = rtcClientRef.current as any;
        if (client && typeof client.isSuspended === 'function') {
          setIsAudioSuspended(client.isSuspended());
        }
      }, 1000);
    } else {
      setIsAudioSuspended(false);
    }
    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [state]);

  // 3. Initialize & Start Realtime session
  useEffect(() => {
    if (!id) {
      navigate('/phong-van-setup');
      return;
    }

    const initCall = async () => {
      try {
        setState('Starting');
        setErrorMessage(null);

        // Fetch session detail first
        const detail = await getInterview(id);
        setSession(detail);

        // Start realtime session on backend
        const validModels = [
          'gpt-4o-mini',
          'gpt-4o',
          'gemini-3-flash-preview',
          'gemini-3.1-pro',
          'gemini-3.1-flash-live-preview',
          'gemini-2.5-flash-native-audio-preview-12-2025',
          'standard',
          'basic',
          'advanced'
        ];
        const selectedModel = (detail.aiModelRaw && validModels.includes(detail.aiModelRaw))
          ? detail.aiModelRaw
          : detail.aiModel && validModels.includes(detail.aiModel)
            ? detail.aiModel
            : 'gpt-4o-mini';

        const realtimePayload = {
          mode: 'voice' as const,
          aiModel: selectedModel,
          voice,
          language,
          enableTranscript,
        };
        console.log('[InterviewVoiceLive] startInterviewRealtime payload:', {
          sessionId: id,
          payload: realtimePayload,
          sessionDetailModel: detail.aiModel,
          sessionDetailModelRaw: detail.aiModelRaw,
        });

        const startResponse = await startInterviewRealtime(id, realtimePayload);

        realtimeSessionIdRef.current = startResponse.realtimeSessionId;
        clientSecretRef.current = startResponse.clientSecret || null;
        connectUrlRef.current = startResponse.connectUrl || null;

        if (startResponse.isIdempotent && !startResponse.clientSecret) {
          // Don't throw — present a recoverable error state and let user end the active
          // realtime session. Keep realtimeSessionIdRef so the frontend can ask server to end it.
          setState('Error');
          setErrorMessage(
            'Phiên realtime đã active nhưng không thể khôi phục clientSecret. Vui lòng kết thúc phiên hiện tại trước khi tạo mới.'
          );
          return;
        }

        // Validate supported provider: warn but don't block if server provided connect info
        const provider = startResponse.provider?.toLowerCase() || 'openai';
        if (provider !== 'openai') {
          console.warn(
            `[InterviewVoiceLive] Realtime provider "${startResponse.provider}" is not 'openai'. Proceeding if server returned connectUrl/clientSecret.`,
            startResponse
          );
        }

        if (!startResponse.connectUrl || !startResponse.clientSecret) {
          throw new Error('Thiếu thông tin kết nối WebRTC từ máy chủ.');
        }

        // Move to connecting state
        setState('Connecting');

        // Initialize appropriate client based on provider
        const callbacks = {
          onConnectionStateChange: (connectionState: any) => {
            console.log(`${provider} State Change:`, connectionState);
            if (connectionState === 'connected') {
              setState('Live');
              // Start visualizer using mic stream
              const stream = rtcClientRef.current?.getLocalStream();
              if (stream) {
                startAudioAnalysis(stream);
              }
            } else if (connectionState === 'failed' || connectionState === 'closed') {
              // Handle unexpected connection drop
              if (state === 'Live' || state === 'Connecting') {
                handleCallEnd('connection_lost');
              }
            }
          },
          onUserTranscript: (text: string, itemId: string) => {
            if (enableTranscript) {
              builderRef.current.updateTurn(itemId, 'user', text);
              setTurns(builderRef.current.getTurns());
            }
          },
          onAssistantTranscriptDelta: (delta: string, itemId: string) => {
            if (enableTranscript) {
              builderRef.current.appendDelta(itemId, 'assistant', delta);
              setTurns(builderRef.current.getTurns());
            }
          },
          onAssistantTranscriptDone: (text: string, itemId: string) => {
            if (enableTranscript) {
              builderRef.current.updateTurn(itemId, 'assistant', text);
              setTurns(builderRef.current.getTurns());
            }
          },
          onError: (err: any) => {
            console.error(`${provider} Client Error:`, err);
            setState('Error');
            setErrorMessage(err.message || 'Lỗi kết nối âm thanh realtime.');
          }
        };

        if (provider === 'gemini') {
          rtcClientRef.current = new GeminiLiveClient(callbacks);
        } else {
          rtcClientRef.current = new OpenAiWebRtcClient(callbacks);
        }

        // Establish the connection (retry once by refreshing server-issued token if needed)
        try {
          await rtcClientRef.current.connect(
            startResponse.connectUrl,
            startResponse.clientSecret,
            startResponse.instructions
          );
        } catch (connErr) {
          console.warn('[InterviewVoiceLive] Initial realtime connect failed:', connErr);
          // Try to refresh token by requesting a new realtime start from server
          try {
            const refreshResponse = await startInterviewRealtime(id, realtimePayload);
            realtimeSessionIdRef.current = refreshResponse.realtimeSessionId;
            clientSecretRef.current = refreshResponse.clientSecret || null;
            connectUrlRef.current = refreshResponse.connectUrl || null;

            if (!refreshResponse.connectUrl || !refreshResponse.clientSecret) {
              throw new Error('Không thể tái cấp token kết nối realtime từ server.');
            }

            await rtcClientRef.current.connect(
              refreshResponse.connectUrl,
              refreshResponse.clientSecret,
              refreshResponse.instructions
            );
          } catch (refreshErr) {
            console.error('[InterviewVoiceLive] Reconnect after refresh failed:', refreshErr);
            throw refreshErr;
          }
        }

      } catch (err: any) {
        setState('Error');
        const apiErr = err instanceof ApiError ? err : null;

        if (apiErr?.status === 503) {
          setErrorMessage('Tính năng phỏng vấn realtime hiện chưa khả dụng hoặc đang bận. Vui lòng thử lại sau.');
        } else if (apiErr?.status === 403) {
          setErrorMessage('Bạn đã dùng hết lượt phỏng vấn AI trong gói hiện tại. Vui lòng nâng cấp gói.');
        } else {
          setErrorMessage(apiErr?.getUserMessage() || err.message || 'Không thể bắt đầu cuộc gọi phỏng vấn.');
        }
      }
    };

    void initCall();

    // Cleanup connection on unmount
    return () => {
      cleanupAudioAnalysis();
      if (rtcClientRef.current) {
        rtcClientRef.current.disconnect();
      }
    };
  }, [id, navigate]);

  const handleResumeAudio = async () => {
    const client = rtcClientRef.current as any;
    if (client && typeof client.resumeContexts === 'function') {
      await client.resumeContexts();
      setIsAudioSuspended(client.isSuspended());
    }
  };

  // 4. Web Audio API analysis
  const startAudioAnalysis = (stream: MediaStream) => {
    try {
      cleanupAudioAnalysis();
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Scale to 0-100 level
        const level = Math.min(100, Math.max(0, (average / 128) * 100));
        setVolumeLevel(level);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error('Visualizer error:', err);
    }
  };

  const cleanupAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // 5. Handle end call
  const handleCallEnd = async (reason: string = 'user_ended') => {
    if (!id) return;

    // Stop local tracks and close WebRTC
    cleanupAudioAnalysis();
    if (rtcClientRef.current) {
      rtcClientRef.current.disconnect();
    }

    setState('Ended');

    // Call End API to log on C# server
    if (realtimeSessionIdRef.current) {
      try {
        await endInterviewRealtime(id, {
          realtimeSessionId: realtimeSessionIdRef.current,
          reason
        });
      } catch (err) {
        console.error('Failed to end realtime session in backend:', err);
      }
    }

    // Populate manual review fields from the builder data
    setManualTranscript(builderRef.current.getRawTranscript());
    setManualQaPairs(builderRef.current.getQaPairs());
  };

  // 5b. Force end an active realtime session (used when server reports an idempotent session
  // that cannot restore clientSecret). This lets the user terminate the orphaned session
  // and then retry starting a new one.
  const handleForceEndSession = async () => {
    if (!id || !realtimeSessionIdRef.current) return;
    setErrorMessage(null);
    try {
      await endInterviewRealtime(id, { realtimeSessionId: realtimeSessionIdRef.current, reason: 'force_end_by_user' });
      // Clear local refs and reload to attempt a fresh start
      realtimeSessionIdRef.current = null;
      clientSecretRef.current = null;
      connectUrlRef.current = null;
      // reload to re-run init sequence
      window.location.reload();
    } catch (err: any) {
      const apiErr = err instanceof ApiError ? err : null;
      setErrorMessage(apiErr?.getUserMessage() || 'Không thể kết thúc phiên realtime hiện tại. Vui lòng thử lại sau.');
    }
  };

  const handleRetry = async () => {
    // Nếu bị lỗi timeout/mất WebRTC nhưng vẫn còn secret thì thử reconnect WebRTC
    if (clientSecretRef.current && connectUrlRef.current && rtcClientRef.current) {
      setErrorMessage(null);
      setState('Connecting');
      try {
        await rtcClientRef.current.connect(
          connectUrlRef.current,
          clientSecretRef.current,
          undefined
        );
        return;
      } catch (err: any) {
        console.warn('Retry WebRTC failed, falling back to force end', err);
      }
    }

    // Nếu secret bị null (vì idempotent) hoặc reconnect tiếp tục thất bại, gọi handleForceEndSession để reset hoàn toàn
    if (realtimeSessionIdRef.current) {
      await handleForceEndSession();
    } else {
      window.location.reload();
    }
  };

  // 6. QA Pairs Editor functions
  const handleAddQaPair = () => {
    setManualQaPairs((prev) => [
      ...prev,
      {
        questionNumber: prev.length + 1,
        questionText: '',
        answerText: '',
        questionType: 'general',
        difficulty: 'mid'
      }
    ]);
  };

  const handleUpdateQaPair = (index: number, field: keyof FinalizeRealtimeQaPair, value: any) => {
    setManualQaPairs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteQaPair = (index: number) => {
    setManualQaPairs((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Re-number remaining questions
      return filtered.map((pair, idx) => ({ ...pair, questionNumber: idx + 1 }));
    });
  };

  // 7. Finalize and submit transcripts
  const handleFinalize = async () => {
    if (!id || !realtimeSessionIdRef.current) return;

    // Validate that there is at least one non-empty QA pair
    const hasValidAnswer = manualQaPairs.some(
      (p) => p.questionText.trim().length > 0 && p.answerText && p.answerText.trim().length > 0
    );

    if (!hasValidAnswer) {
      setErrorMessage('Chưa có câu trả lời hợp lệ để chấm điểm. Vui lòng thêm hoặc chỉnh sửa ít nhất một cặp câu hỏi và trả lời.');
      return;
    }

    setState('Finalizing');
    setErrorMessage(null);
    setFinalizeMessage(null);

    try {
      const response = await finalizeInterviewRealtime(id, {
        realtimeSessionId: realtimeSessionIdRef.current,
        transcriptText: manualTranscript,
        qaPairs: manualQaPairs
      });

      if (response.canComplete) {
        setState('ReadyToComplete');
        setFinalizeMessage(response.message || 'Bản nháp hội thoại đã được lưu và sẵn sàng chấm điểm.');
      } else {
        setState('Ended');
        setErrorMessage('Chưa có câu trả lời hợp lệ từ buổi phỏng vấn theo yêu cầu của hệ thống.');
      }
    } catch (err: any) {
      setState('Ended');
      const apiErr = err instanceof ApiError ? err : null;
      setErrorMessage(apiErr?.getUserMessage() || 'Có lỗi xảy ra khi nộp kết quả phỏng vấn.');
    }
  };

  // 8. Complete & Grade interview
  const handleCompleteGrade = async () => {
    if (!id) return;
    setState('Completing');
    setErrorMessage(null);

    try {
      const response = await completeInterview(id);
      setCompletedReport(response.report || null);
      setState('Report');

      // Update session detail to completed
      const detail = await getInterview(id);
      setSession(detail);
    } catch (err: any) {
      setState('ReadyToComplete');
      const apiErr = err instanceof ApiError ? err : null;
      setErrorMessage(apiErr?.getUserMessage() || 'Gặp lỗi trong quá trình phân tích và chấm điểm.');
    }
  };

  // 9. Format timer
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render setup/loading status
  if (state === 'Starting') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader title="Phỏng vấn Voice Realtime" subtitle="Đang khởi tạo phiên..." />
        <Card className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <h3 className="text-xl font-bold">Vui lòng chờ</h3>
          <p className="text-gray-500">Đang chuẩn bị phiên làm việc và cấu hình microphone...</p>
        </Card>
      </div>
    );
  }

  if (state === 'Connecting') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader title="Phỏng vấn Voice Realtime" subtitle="Đang thiết lập cuộc gọi..." />
        <Card className="glass-card p-12 text-center flex flex-col items-center justify-center space-y-4">
          <Volume2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
          <h3 className="text-xl font-bold">Đang kết nối tới AI Interviewer...</h3>
          <p className="text-gray-500">Đang tạo đường truyền âm thanh WebRTC bảo mật.</p>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold max-w-sm mt-4">
            ⚠️ Lưu ý không F5 hoặc làm mới trình duyệt lúc này để tránh gián đoạn.
          </div>
        </Card>
      </div>
    );
  }

  // Render Error state
  if (state === 'Error') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <AppPageHeader title="Lỗi Kết Nối" subtitle="Đã xảy ra sự cố trong quá trình phỏng vấn voice" />
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-bold text-lg">Không thể bắt đầu phỏng vấn voice</h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {realtimeSessionIdRef.current && (
              <Button variant="destructive" onClick={() => void handleForceEndSession()}>
                Kết thúc phiên hiện tại
              </Button>
            )}
            <Button onClick={() => navigate('/phong-van-setup')}>
              Quay lại thiết lập
            </Button>
            <Button variant="outline" onClick={() => void handleRetry()}>
              Thử lại ngay
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render LIVE CALL screen
  if (state === 'Live') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader
          title={session?.position || 'Phỏng vấn Voice Live'}
          subtitle="Cuộc gọi đang diễn ra"
        />

        {/* Live Call Canvas */}
        <Card
          onClick={() => { void handleResumeAudio(); }}
          className="relative overflow-hidden bg-slate-900 border-slate-800 text-white rounded-3xl p-8 min-h-[400px] flex flex-col justify-between items-center shadow-xl cursor-pointer"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-50 dark:bg-red-900/300 rounded-full animate-ping"></span>
              <span className="text-sm font-semibold tracking-wide text-red-400">REC</span>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
              <Clock className="w-4 h-4 text-sky-400" />
              <span className="font-mono text-sm font-bold">{formatTime(callDuration)}</span>
            </div>
          </div>

          {isAudioSuspended && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                void handleResumeAudio();
              }}
              className="z-20 w-full max-w-md bg-amber-50 dark:bg-amber-900/300 hover:bg-amber-600 text-slate-900 px-4 py-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer shadow-lg animate-bounce transition-all my-2"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Volume2 className="w-5 h-5 flex-shrink-0 animate-pulse" />
                <span>Trình duyệt đang chặn âm thanh. Nhấn vào đây để bật tiếng!</span>
              </div>
              <span className="text-xs bg-slate-900/10 px-2.5 py-1 rounded-md font-bold uppercase">BẬT</span>
            </div>
          )}

          {/* Glowing pulsing visualizer circles */}
          <div className="relative my-8 flex items-center justify-center w-48 h-48">
            <>
              <div
                className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-full blur-xl transition-all duration-75"
                style={{ transform: `scale(${1 + volumeLevel / 150})` }}
              ></div>
              <div
                className="absolute w-36 h-36 bg-blue-600/35 rounded-full border border-blue-400/40 transition-all duration-75"
                style={{ transform: `scale(${1 + volumeLevel / 180})` }}
              ></div>
              <div
                className="absolute w-28 h-28 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-75"
                style={{ transform: `scale(${1 + volumeLevel / 220})` }}
              ></div>

              <Mic className="relative z-10 w-10 h-10 text-white" />
            </>
          </div>

          {/* Live transcript scroll box */}
          {enableTranscript && (
            <div className="w-full max-w-2xl bg-white/5 rounded-2xl p-4 border border-white/10 max-h-[160px] overflow-y-auto mb-6 z-10 custom-scrollbar flex flex-col gap-2">
              {turns.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-4 italic">
                  Chờ cuộc hội thoại bắt đầu... AI Interviewer sẽ chào bạn trước.
                </div>
              ) : (
                turns.map((turn, i) => (
                  <div
                    key={turn.id || i}
                    className={`flex flex-col text-sm max-w-[85%] rounded-2xl p-3 ${turn.role === 'assistant'
                      ? 'bg-blue-600/20 border border-blue-500/30 self-start text-sky-100'
                      : 'bg-white/10 border border-white/5 self-end text-slate-100'
                      }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-0.5">
                      {turn.role === 'assistant' ? 'AI Interviewer' : 'Bạn'}
                    </span>
                    <p>{turn.text}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Action button */}
          <div className="z-10 flex gap-4 mt-2">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full px-8 py-6 h-auto text-base font-semibold shadow-lg hover:bg-red-700 transition"
              onClick={() => handleCallEnd('user_ended')}
            >
              <PhoneOff className="mr-2 w-5 h-5" />
              Kết thúc phỏng vấn
            </Button>
          </div>
        </Card>

        {/* Browser warn */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-900/30 text-amber-900 text-sm flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Lưu ý quan trọng:</strong> Vui lòng không đóng tab hoặc tải lại trang (F5). Bản quyền cuộc gọi được xác thực bằng token ngắn hạn chạy hoàn toàn trên RAM; nếu tải lại, bạn sẽ bị mất liên kết và không thể tiếp tục phiên này.
          </div>
        </div>
      </div>
    );
  }

  // Render POST-CALL transcript review & QA manual editor (Ended state)
  if (state === 'Ended' || state === 'Finalizing' || state === 'ReadyToComplete' || state === 'Completing') {
    const isEditingMode = state === 'Ended';

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader
          title="Xác nhận nội dung phỏng vấn"
          subtitle="Đọc lại bản ghi hội thoại và chỉnh sửa nếu cần trước khi chấm điểm"
        />

        {errorMessage && (
          <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-xl text-sm flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {finalizeMessage && (
          <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-xl text-sm flex gap-2 items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>{finalizeMessage}</div>
          </div>
        )}

        {/* 2 columns layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Transcript Text Column */}
          <div className="md:col-span-1 space-y-4">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                Raw Transcript (Văn bản thô)
              </h3>
              <p className="text-xs text-gray-500">
                Toàn bộ nội dung hội thoại được ghi nhận. Bạn có thể xem hoặc chỉnh sửa để lưu trữ đầy đủ.
              </p>
              <Textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Nhập nội dung hội thoại..."
                rows={18}
                disabled={!isEditingMode}
                className="text-sm font-sans"
              />
            </Card>
          </div>

          {/* QA Pairs Editor Column */}
          <div className="md:col-span-2 space-y-4">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <User size={20} className="text-blue-600 dark:text-blue-400" />
                  Danh sách câu hỏi & trả lời ({manualQaPairs.length})
                </h3>
                {isEditingMode && (
                  <Button size="sm" variant="outline" onClick={handleAddQaPair} className="h-9">
                    <Plus size={16} className="mr-1" /> Thêm Cặp Q/A
                  </Button>
                )}
              </div>

              {manualQaPairs.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl space-y-3">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">Chưa có câu hỏi nào được trích xuất tự động.</p>
                  {isEditingMode && (
                    <Button size="sm" onClick={handleAddQaPair}>
                      Tự thêm câu hỏi đầu tiên
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {manualQaPairs.map((pair, index) => (
                    <div key={index} className="p-4 rounded-xl border border-gray-150 bg-gray-50/40 relative group space-y-3">
                      {isEditingMode && (
                        <button
                          onClick={() => handleDeleteQaPair(index)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600">Câu hỏi {pair.questionNumber}</Badge>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-600">Nội dung câu hỏi của AI</Label>
                        <Input
                          value={pair.questionText}
                          onChange={(e) => handleUpdateQaPair(index, 'questionText', e.target.value)}
                          placeholder="Ví dụ: Bạn hãy tự giới thiệu về bản thân?"
                          disabled={!isEditingMode}
                          className="bg-white text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-600">Câu trả lời của bạn</Label>
                        <Textarea
                          value={pair.answerText || ''}
                          onChange={(e) => handleUpdateQaPair(index, 'answerText', e.target.value)}
                          placeholder="Ví dụ: Tôi tên là Cường, có kinh nghiệm..."
                          disabled={!isEditingMode}
                          rows={3}
                          className="bg-white text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirm submit actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                {state === 'Ended' && (
                  <Button size="lg" onClick={handleFinalize} className="px-6 h-12 text-base font-semibold">
                    <Save className="mr-2" size={18} />
                    Nộp và Tiếp tục
                  </Button>
                )}

                {state === 'Finalizing' && (
                  <Button size="lg" disabled className="px-6 h-12 text-base font-semibold">
                    <RefreshCw className="mr-2 animate-spin" size={18} />
                    Đang nộp...
                  </Button>
                )}

                {(state === 'ReadyToComplete' || state === 'Completing') && (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setState('Ended')}
                      disabled={state === 'Completing'}
                      className="px-6 h-12"
                    >
                      <Undo2 className="mr-2" size={18} />
                      Sửa lại Q/A
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleCompleteGrade}
                      disabled={state === 'Completing'}
                      className="px-6 h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {state === 'Completing' ? (
                        <>
                          <RefreshCw className="mr-2 animate-spin" size={18} />
                          Đang chấm điểm...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="mr-2" size={18} />
                          Chấm điểm & Hoàn thành
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render final completed report
  if (state === 'Report' && completedReport) {
    const overallScore = completedReport.overallScore ?? null;
    const normalizedScore =
      overallScore == null ? null : overallScore > 10 ? overallScore / 10 : overallScore;
    const scoreLabel =
      normalizedScore == null
        ? 'Chưa có dữ liệu'
        : normalizedScore >= 8
          ? 'Xuất sắc'
          : normalizedScore >= 7
            ? 'Tốt'
            : 'Cần cải thiện';

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <AppPageHeader
          title="Kết quả phỏng vấn"
          subtitle={session ? `${session.position} — ${session.interviewType}` : 'Báo cáo phỏng vấn'}
          icon={BarChart3}
          iconGradient="from-green-500 to-emerald-600"
        />

        {/* Overall Score */}
        <Card className="glass-card rounded-2xl p-8 text-center bg-gradient-to-b from-blue-50/50 to-white">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center justify-center gap-2">
            <Sparkles className="text-yellow-500 dark:text-yellow-500" size={20} />
            Điểm tổng thể từ AI
          </h3>
          <div className="text-7xl font-extrabold text-blue-600 dark:text-blue-400 mb-4 animate-bounce">
            {overallScore ?? '—'}
          </div>
          <Badge className="text-lg px-6 py-1.5 bg-blue-600">
            {scoreLabel}
          </Badge>
        </Card>

        {/* Core Metrics */}
        <Card className="p-6 dark:bg-slate-900/50 border dark:border-slate-800">
          <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-100">Điểm số chi tiết</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center space-y-1 dark:border dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Confidence (Tự tin)</span>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {completedReport.confidenceScore ?? '—'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center space-y-1 dark:border dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Clarity (Mạch lạc)</span>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {completedReport.clarityScore ?? '—'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center space-y-1 dark:border dark:border-slate-700">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Relevance (Liên quan)</span>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {completedReport.relevanceScore ?? '—'}
              </div>
            </div>
          </div>
        </Card>

        {/* Strengths & Weaknesses & Recommendations */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 border-green-100 dark:border-green-800/50 bg-green-50 dark:bg-green-900/30">
            <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
              👍 Ưu điểm (Strengths)
            </h3>
            {completedReport.strengths && completedReport.strengths.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {completedReport.strengths.map((item, index) => (
                  <li key={`strength-${index}`} className="flex items-start gap-1">
                    <span className="text-green-600 dark:text-green-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">Chưa có đánh giá</p>
            )}
          </Card>

          <Card className="p-6 border-red-100 dark:border-red-800/50 bg-red-50 dark:bg-red-900/30">
            <h3 className="font-bold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
              👎 Điểm yếu (Weaknesses)
            </h3>
            {completedReport.weaknesses && completedReport.weaknesses.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {completedReport.weaknesses.map((item, index) => (
                  <li key={`weakness-${index}`} className="flex items-start gap-1">
                    <span className="text-red-500">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">Chưa có đánh giá</p>
            )}
          </Card>

          <Card className="p-6 border-amber-100 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/30">
            <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
              💡 Khuyên dùng (Recommendations)
            </h3>
            {completedReport.recommendations && completedReport.recommendations.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {completedReport.recommendations.map((item, index) => (
                  <li key={`recommend-${index}`} className="flex items-start gap-1">
                    <span className="text-amber-600 dark:text-amber-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">Chưa có đánh giá</p>
            )}
          </Card>
        </div>

        {/* Detailed Breakdowns */}
        {completedReport.scoreBreakdowns && completedReport.scoreBreakdowns.length > 0 && (
          <Card className="p-6 space-y-4 dark:bg-slate-900/50 border dark:border-slate-800">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Chi tiết các tiêu chí</h3>
            <div className="space-y-4">
              {completedReport.scoreBreakdowns.map((item, index) => (
                <div key={`breakdown-${index}`} className="border-b dark:border-slate-800 pb-3 last:border-0 last:pb-0 space-y-1 text-sm">
                  <div className="flex justify-between items-center font-semibold text-gray-800 dark:text-gray-100">
                    <span>{item.dimension}</span>
                    <span>{item.score} / {item.maxScore}</span>
                  </div>
                  {item.comment && <p className="text-gray-600 dark:text-gray-400 text-xs italic">{item.comment}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Feedback List */}
        {completedReport.feedbackItems && completedReport.feedbackItems.length > 0 && (
          <Card className="p-6 space-y-4 dark:bg-slate-900/50 border dark:border-slate-800">
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Ý kiến phản hồi từ AI</h3>
            <div className="grid gap-3">
              {completedReport.feedbackItems.map((item, index) => (
                <div key={`feedback-${index}`} className="p-3 border dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 space-y-1 text-gray-800 dark:text-gray-100">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span>{item.title}</span>
                    <Badge variant="secondary" className="text-[10px] dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600">{item.category}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Questions and Answers Review */}
        <Card className="p-6 space-y-4 dark:bg-slate-900/50 border dark:border-slate-800">
          <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Hội thoại chi tiết</h3>
          <div className="space-y-4">
            {session?.questions && session.questions.map((q) => {
              const answer = session.answers?.find((a) => a.questionId === q.questionId);
              return (
                <div key={q.questionId} className="border dark:border-slate-700 rounded-xl p-4 bg-slate-50/40 dark:bg-slate-800/50 text-sm space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">AI: {q.questionText}</p>
                  <p className="text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-950 p-3 rounded-lg border border-gray-150 dark:border-slate-700">
                    Bạn: {answer?.answerText || 'Chưa trả lời'}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Navigation Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={() => navigate('/phong-van-setup')} size="lg" className="flex-1">
            <Mic className="mr-2" size={18} />
            Luyện phỏng vấn mới
          </Button>
          <Button variant="outline" onClick={() => navigate('/bao-cao')} size="lg" className="flex-1">
            <BarChart3 className="mr-2" size={18} />
            Xem lịch sử báo cáo
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
