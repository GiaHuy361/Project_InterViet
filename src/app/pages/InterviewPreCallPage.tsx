import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { AlertCircle, Mic, Wifi, Check, X, Headphones } from 'lucide-react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

export const InterviewPreCallPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId;
  const voice = location.state?.voice || 'alloy';
  const language = location.state?.language || 'vi';
  const enableTranscript = location.state?.enableTranscript !== false;
  
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      navigate('/phong-van-setup');
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    if (isTesting) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isTesting]);

  const handleTestMic = async () => {
    setIsTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setTimeout(() => {
        setMicPermission('granted');
        setTimeout(() => {
          setIsTesting(false);
        }, 2000);
      }, 500);
    } catch (err) {
      setMicPermission('denied');
      setIsTesting(false);
    }
  };

  const handleStart = () => {
    if (micPermission !== 'granted') {
      alert('Vui lòng cho phép truy cập microphone trước khi bắt đầu');
      return;
    }

    // Pre-initialize and resume AudioContexts in user-gesture handler
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      try {
        const audioContext = new AudioContextClass({ sampleRate: 16000 });
        const playbackCtx = new AudioContextClass();
        audioContext.resume().catch(console.error);
        playbackCtx.resume().catch(console.error);
        (window as any).__realtimeAudioContext = audioContext;
        (window as any).__realtimePlaybackContext = playbackCtx;
        console.log('[PreCall] AudioContexts pre-initialized and resumed successfully on click');
      } catch (e) {
        console.error('[PreCall] Failed to pre-initialize AudioContexts:', e);
      }
    }

    navigate(`/phong-van-voice-live/${sessionId}`, {
      state: {
        voice,
        language,
        enableTranscript,
      },
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <AppPageHeader
        title="Chuẩn bị phỏng vấn Voice"
        subtitle="Kiểm tra thiết bị trước khi bắt đầu phỏng vấn bằng giọng nói"
        icon={Mic}
        iconGradient="from-fuchsia-500 to-pink-600"
      />

      {/* System Check */}
      <Card className="p-6 dark:bg-slate-900/50 border dark:border-slate-800">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />
          Kiểm tra hệ thống
        </h3>
        
        <div className="space-y-4">
          {/* Internet Connection */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg dark:border dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Wifi className="text-green-600 dark:text-green-400" size={24} />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Kết nối Internet</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tốt</div>
              </div>
            </div>
            <Check className="text-green-600 dark:text-green-400" size={24} />
          </div>

          {/* Microphone */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg dark:border dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Mic className={micPermission === 'granted' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'} size={24} />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Microphone</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {micPermission === 'pending' && 'Chưa kiểm tra'}
                  {micPermission === 'granted' && 'Hoạt động tốt'}
                  {micPermission === 'denied' && 'Không có quyền truy cập'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isTesting && micPermission !== 'granted' && (
                <Button size="sm" onClick={handleTestMic}>
                  Kiểm tra
                </Button>
              )}
              {isTesting && (
                <div className="flex items-end gap-1 h-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-600 rounded-full transition-all"
                      style={{
                        height: `${(Math.sin(Date.now() / 100 + i) + 1) * audioLevel / 6}%`,
                        minHeight: '4px'
                      }}
                    ></div>
                  ))}
                </div>
              )}
              {micPermission === 'granted' && <Check className="text-green-600 dark:text-green-400" size={24} />}
              {micPermission === 'denied' && <X className="text-red-600 dark:text-red-400" size={24} />}
            </div>
          </div>

          {/* Audio Output */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg dark:border dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Headphones className="text-green-600 dark:text-green-400" size={24} />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Loa / Tai nghe</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Sẵn sàng</div>
              </div>
            </div>
            <Check className="text-green-600 dark:text-green-400" size={24} />
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-yellow-50 dark:bg-slate-900/50 border-yellow-200 dark:border-yellow-900/50">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
          💡 Gợi ý cho buổi phỏng vấn tốt nhất
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5"></div>
            <span>Tìm một không gian yên tĩnh, tránh tiếng ồn xung quanh</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5"></div>
            <span>Đảm bảo microphone ở vị trí gần miệng, không quá xa</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5"></div>
            <span>Nói rõ ràng và tự nhiên như đang trò chuyện thật</span>
          </li>
          <li className="flex items-start gap-2 text-amber-700 dark:text-amber-400 font-medium">
            <div className="w-1.5 h-1.5 bg-amber-700 rounded-full mt-1.5"></div>
            <span>⚠️ Không tải lại trang (F5) trong khi phỏng vấn voice để tránh mất kết nối.</span>
          </li>
        </ul>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          size="lg" 
          className="flex-1"
          onClick={handleStart}
          disabled={micPermission !== 'granted'}
        >
          <Mic className="mr-2" size={20} />
          Bắt đầu phỏng vấn
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          onClick={() => navigate('/phong-van-setup')}
        >
          Quay lại
        </Button>
      </div>

      {micPermission !== 'granted' && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Vui lòng kiểm tra microphone trước khi bắt đầu
        </p>
      )}
    </div>
  );
};