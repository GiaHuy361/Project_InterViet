import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Mic, Volume2, Check, X, AlertCircle, Headphones, Wifi } from 'lucide-react';
import { AppPageHeader } from '../components/design-system/AppPageHeader';

export const InterviewPreCallPage: React.FC = () => {
  const navigate = useNavigate();
  const { useInterview } = useApp();
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    // Load config from sessionStorage
    const storedConfig = sessionStorage.getItem('interviewConfig');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    } else {
      navigate('/phong-van-setup');
    }
  }, [navigate]);

  useEffect(() => {
    // Simulate audio level animation when testing
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
    // Simulate microphone permission request
    setTimeout(() => {
      setMicPermission('granted');
      setTimeout(() => {
        setIsTesting(false);
      }, 2000);
    }, 500);
  };

  const handleStart = () => {
    if (micPermission !== 'granted') {
      alert('Vui lòng cho phép truy cập microphone trước khi bắt đầu');
      return;
    }

    const success = useInterview();
    if (!success) {
      navigate('/goi-dich-vu'); // Changed from '/bang-gia' to '/goi-dich-vu'
      return;
    }

    // Store config for the live interview page
    sessionStorage.setItem('liveInterviewConfig', JSON.stringify(config));
    navigate('/phong-van-live');
  };

  if (!config) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="text-center text-6xl mb-2">{config.interviewerIcon}</div>
      <AppPageHeader
        title="Chuẩn bị phỏng vấn"
        subtitle="Kiểm tra thiết bị trước khi bắt đầu"
        icon={Mic}
        iconGradient="from-fuchsia-500 to-pink-600"
      />

      <Card className="glass-card rounded-2xl p-6 border-blue-200/80 bg-gradient-to-r from-blue-50/90 to-violet-50/60">
        <h3 className="font-semibold mb-3">Thông tin phỏng vấn</h3>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">Vị trí:</span>
            <strong>{config.position}</strong>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">Cấp độ:</span>
            <strong>{config.level}</strong>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">Mục tiêu:</span>
            <strong>{config.goal}</strong>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">Thời lượng:</span>
            <strong>{config.duration}</strong>
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">Phong cách phỏng vấn:</span>
            <strong>{config.interviewerMode}</strong>
          </div>
        </div>
      </Card>

      {/* System Check */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-blue-600" />
          Kiểm tra hệ thống
        </h3>
        
        <div className="space-y-4">
          {/* Internet Connection */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Wifi className="text-green-600" size={24} />
              <div>
                <div className="font-medium">Kết nối Internet</div>
                <div className="text-sm text-gray-600">Tốt</div>
              </div>
            </div>
            <Check className="text-green-600" size={24} />
          </div>

          {/* Microphone */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mic className={micPermission === 'granted' ? 'text-green-600' : 'text-gray-400'} size={24} />
              <div>
                <div className="font-medium">Microphone</div>
                <div className="text-sm text-gray-600">
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
              {micPermission === 'granted' && <Check className="text-green-600" size={24} />}
              {micPermission === 'denied' && <X className="text-red-600" size={24} />}
            </div>
          </div>

          {/* Audio Output */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Headphones className="text-green-600" size={24} />
              <div>
                <div className="font-medium">Loa / Tai nghe</div>
                <div className="text-sm text-gray-600">Sẵn sàng</div>
              </div>
            </div>
            <Check className="text-green-600" size={24} />
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          💡 Gợi ý cho buổi phỏng vấn tốt nhất
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
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
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5"></div>
            <span>Thư giãn và tự tin - đây là cơ hội để bạn luyện tập</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-1.5"></div>
            <span>AI sẽ lắng nghe và tương tác như một cuộc phỏng vấn thật</span>
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
        <p className="text-center text-sm text-gray-600">
          Vui lòng kiểm tra microphone trước khi bắt đầu
        </p>
      )}
    </div>
  );
};