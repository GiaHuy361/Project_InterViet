import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../contexts/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Mic, Square, Volume2, VolumeX, User, Sparkles, LogOut, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { motion } from 'motion/react';

interface Message {
  role: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

export const InterviewLivePage: React.FC = () => {
  const { addInterviewReport } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showInstantReportDialog, setShowInstantReportDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [config, setConfig] = useState<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const conversationStarted = useRef(false);

  // Load config
  useEffect(() => {
    const storedConfig = sessionStorage.getItem('liveInterviewConfig');
    if (storedConfig) {
      setConfig(JSON.parse(storedConfig));
    } else {
      navigate('/phong-van-setup');
    }
  }, [navigate]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio level animation
  useEffect(() => {
    if (isUserSpeaking || isAISpeaking) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isUserSpeaking, isAISpeaking]);

  // Start conversation automatically
  useEffect(() => {
    if (config && !conversationStarted.current) {
      conversationStarted.current = true;
      setTimeout(() => {
        addAIMessage(getIntroMessage());
      }, 1000);
    }
  }, [config]);

  const getIntroMessage = () => {
    return `Xin chào! Tôi là ${config?.interviewerMode}. Rất vui được gặp bạn hôm nay. Tôi sẽ phỏng vấn bạn cho vị trí ${config?.position}. Đây là một cuộc trò chuyện tự nhiên, bạn có thể thoải mái chia sẻ suy nghĩ của mình. Để bắt đầu, bạn có thể giới thiệu ngắn gọn về bản thân được không?`;
  };

  const addAIMessage = (text: string) => {
    setIsAISpeaking(true);
    setMessages(prev => [...prev, { role: 'ai', text, timestamp: new Date() }]);
    
    // Simulate AI speaking duration
    setTimeout(() => {
      setIsAISpeaking(false);
      // After AI speaks, enable user to speak
      setTimeout(() => {
        if (messages.length < 20) { // Continue conversation
          setIsUserSpeaking(true);
        }
      }, 500);
    }, 3000 + text.length * 30);
  };

  const addUserMessage = (text: string) => {
    setIsUserSpeaking(false);
    setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);
    
    // AI responds after user speaks
    setTimeout(() => {
      const response = generateAIResponse(messages.length);
      addAIMessage(response);
    }, 1500);
  };

  const generateAIResponse = (messageCount: number): string => {
    const responses = [
      'Cảm ơn bạn đã chia sẻ. Nghe có vẻ rất thú vị! Bạn có thể kể thêm về một dự án mà bạn tự hào nhất không?',
      'Tôi hiểu rồi. Điều đó cho thấy bạn có kinh nghiệm tốt. Vậy trong tình huống có áp lực cao, bạn thường xử lý như thế nào?',
      'Rất ấn tượng! Bạn đã học được gì từ những thử thách đó?',
      'Tuyệt vời. Giờ hãy nói về điểm mạnh lớn nhất mà bạn nghĩ sẽ giúp ích cho vị trí này.',
      'Cảm ơn bạn đã chia sẻ chi tiết. Còn về kỹ năng làm việc nhóm, bạn có thể cho tôi một ví dụ cụ thể không?',
      'Thật tuyệt! Điều gì khiến bạn quan tâm đến công ty và vị trí này?',
      'Rõ ràng bạn đã chuẩn bị kỹ lưỡng. Trong 5 năm tới, bạn nhìn thấy mình ở đâu trong sự nghiệp?',
      'Cảm ơn bạn rất nhiều. Tôi nghĩ chúng ta đã có một cuộc trò chuyện rất tốt. Bạn có câu hỏi nào muốn hỏi tôi không?',
    ];

    if (messageCount >= responses.length * 2) {
      return 'Tuyệt vời! Cảm ơn bạn đã dành thời gian hôm nay. Tôi đã có đủ thông tin cần thiết. Chúc bạn may mắn!';
    }

    const index = Math.floor(messageCount / 2);
    return responses[Math.min(index, responses.length - 1)];
  };

  // Simulate user speaking after 3 seconds
  useEffect(() => {
    if (isUserSpeaking) {
      const timeout = setTimeout(() => {
        const userResponses = [
          'Tôi có hơn 3 năm kinh nghiệm làm việc trong lĩnh vực này. Tôi đã tham gia nhiều dự án thú vị và học hỏi được rất nhiều kỹ năng quý báu.',
          'Dự án tôi tự hào nhất là khi tôi phát triển một hệ thống giúp tăng hiệu suất làm việc của team lên 40%. Tôi đã làm việc chặt chẽ với các bên liên quan và vượt qua nhiều thử thách kỹ thuật.',
          'Khi có áp lực, tôi thường ưu tiên các công việc quan trọng nhất, chia nhỏ chúng thành các task dễ quản lý, và liên tục cập nhật tiến độ với team.',
          'Tôi học được rằng communication là chìa khóa. Việc lắng nghe và thấu hiểu quan điểm của người khác giúp tìm ra giải pháp tốt nhất.',
          'Điểm mạnh của tôi là khả năng học hỏi nhanh và thích nghi với công nghệ mới. Tôi luôn chủ động tìm hiểu và áp dụng best practices.',
          'Tôi có kinh nghiệm làm việc với diverse teams. Một lần team có conflict về technical approach, tôi đã tổ chức meeting để mọi người trình bày ý kiến và tìm ra consensus.',
          'Tôi rất ấn tượng với văn hóa innovation và cách công ty đầu tư vào phát triển nhân viên. Vị trí này phù hợp với kỹ năng và định hướng phát triển của tôi.',
          'Trong 5 năm tới, tôi muốn trở thành technical lead, đóng góp vào các strategic decisions và mentor các junior developers.',
        ];
        
        const index = Math.floor(messages.filter(m => m.role === 'user').length);
        const response = userResponses[Math.min(index, userResponses.length - 1)];
        addUserMessage(response);
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isUserSpeaking]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnd = () => {
    setShowEndDialog(true);
  };

  const handleConfirmEnd = () => {
    setShowEndDialog(false);
    setProcessing(true);
    
    setTimeout(() => {
      const score = Math.floor(Math.random() * 30) + 65;
      addInterviewReport({
        position: config?.position || 'Software Engineer',
        level: config?.level || 'Junior',
        type: config?.interviewerMode || 'HR cơ bản',
        score,
        duration: Math.floor(timer / 60)
      });
      
      navigate('/bao-cao');
    }, 3000);
  };

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    setShowExitDialog(false);
    // Toast notification
    const event = new CustomEvent('toast', {
      detail: { message: 'Đã thoát buổi phỏng vấn' }
    });
    window.dispatchEvent(event);
    navigate('/phong-van-setup');
  };

  const handleInstantReport = () => {
    setShowInstantReportDialog(true);
  };

  const handleConfirmInstantReport = () => {
    setShowInstantReportDialog(false);
    setProcessing(true);
    
    const processingMessages = [
      'Đang phân tích nội dung trả lời...',
      'Đang đánh giá mức độ tự tin...',
      'Đang tổng hợp nhận xét...',
    ];

    let stage = 0;
    const stageInterval = setInterval(() => {
      stage++;
      setProcessingStage(stage);
      if (stage >= 3) {
        clearInterval(stageInterval);
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(stageInterval);
      const score = Math.floor(Math.random() * 30) + 65;
      addInterviewReport({
        position: config?.position || 'Software Engineer',
        level: config?.level || 'Junior',
        type: config?.interviewerMode || 'HR cơ bản',
        score,
        duration: Math.floor(timer / 60)
      });
      
      navigate('/bao-cao');
    }, 3000);
  };

  if (!config) {
    return null;
  }

  if (processing) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <Card className="p-12 max-w-md text-center">
          <motion.div 
            className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="text-white" size={40} />
          </motion.div>
          <h3 className="text-2xl font-bold mb-2">Đang phân tích...</h3>
          <p className="text-gray-600 mb-6">
            AI đang đánh giá toàn bộ buổi phỏng vấn của bạn
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Phân tích nội dung</span>
              <span className="text-blue-600 font-medium">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Đánh giá kỹ năng giao tiếp</span>
              <span className="text-blue-600 font-medium">87%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tạo báo cáo chi tiết</span>
              <span className="text-blue-600 font-medium">45%</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      {/* Minimalist Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl">{config.interviewerIcon}</div>
          <div>
            <div className="font-semibold">{config.position}</div>
            <div className="text-sm text-gray-600">{config.interviewerMode}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Model: {config.aiModel || 'GPT-4o mini'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono tabular-nums">{formatTime(timer)}</div>
          <div className="text-xs text-gray-600">Thời gian</div>
        </div>
      </div>

      {/* Main Interview Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: AI Interviewer */}
        <div className="w-1/3 bg-gradient-to-br from-blue-600 to-purple-600 p-8 flex flex-col items-center justify-center text-white">
          <motion.div 
            className="relative"
            animate={isAISpeaking ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <div className="w-48 h-48 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center mb-6 relative overflow-hidden">
              {isAISpeaking && (
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{ scale: [0, 2], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <div className="text-8xl z-10">{config.interviewerIcon}</div>
            </div>
          </motion.div>
          
          <h3 className="text-2xl font-bold mb-2">{config.interviewerMode}</h3>
          <p className="text-blue-100 mb-6 text-center">
            {isAISpeaking ? 'Đang nói...' : 'Đang lắng nghe...'}
          </p>

          {/* Audio Visualization */}
          {(isAISpeaking || isUserSpeaking) && (
            <div className="flex items-end justify-center gap-2 h-24">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 bg-white rounded-full"
                  animate={{
                    height: isAISpeaking 
                      ? `${20 + Math.sin(Date.now() / 100 + i) * 30}%`
                      : `${10 + Math.random() * 20}%`
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ minHeight: '8px' }}
                />
              ))}
            </div>
          )}

          {/* Mic Control */}
          <div className="mt-8">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              {isMuted ? <VolumeX size={28} /> : <Volume2 size={28} />}
            </button>
          </div>
        </div>

        {/* Right: Live Transcript */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b bg-gray-50">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              Transcript trực tiếp
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Cuộc trò chuyện được ghi lại tự động
            </p>
          </div>

          <div 
            ref={transcriptRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <Mic size={48} className="mx-auto mb-4 opacity-30" />
                <p>Cuộc phỏng vấn sắp bắt đầu...</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'ai' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {msg.role === 'ai' ? config.interviewerIcon : <User size={20} />}
                </div>
                <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block rounded-2xl px-4 py-3 ${
                    msg.role === 'ai'
                      ? 'bg-blue-50 text-gray-900'
                      : 'bg-blue-600 text-white'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {isUserSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3 flex-row-reverse"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-200">
                  <User size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 max-w-[80%] text-right">
                  <div className="inline-block rounded-2xl px-4 py-3 bg-gray-100">
                    <div className="flex gap-1">
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      >●</motion.span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      >●</motion.span>
                      <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      >●</motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Status */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-gray-600">
                {isUserSpeaking ? 'Đang ghi âm...' : 'Đang chờ phản hồi từ AI...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg" style={{ zIndex: 50 }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-600 hidden md:block">
            💡 Demo nhanh — tạo báo cáo trong 2–3 giây
          </p>
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <Button 
              variant="outline"
              size="lg"
              onClick={handleExit}
              className="min-h-[56px] px-6 text-base border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="mr-2" size={20} />
              Thoát phỏng vấn
            </Button>
            <Button 
              size="lg"
              onClick={handleInstantReport}
              className="min-h-[56px] px-6 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="mr-2" size={20} />
              Kết thúc & tạo báo cáo ngay
            </Button>
          </div>
        </div>
      </div>

      {/* End Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kết thúc phỏng vấn?</DialogTitle>
            <DialogDescription>
              Bạn đã trò chuyện được {Math.floor(timer / 60)} phút
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Phỏng vấn của bạn sẽ được phân tích toàn diện bởi AI. 
              Bạn có chắc chắn muốn kết thúc?
            </p>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                💡 Báo cáo sẽ bao gồm: Đánh giá tổng thể, phân tích kỹ năng giao tiếp,
                cấu trúc câu trả lời, và nhận xét từ AI interviewer.
              </p>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleConfirmEnd}>
                Hoàn thành & xem báo cáo
              </Button>
              <Button variant="outline" onClick={() => setShowEndDialog(false)}>
                Tiếp tục
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thoát phỏng vấn?</DialogTitle>
            <DialogDescription>
              Phiên phỏng vấn đang diễn ra sẽ kết thúc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1" 
                onClick={() => setShowExitDialog(false)}
              >
                Tiếp tục
              </Button>
              <Button 
                variant="destructive"
                className="flex-1" 
                onClick={handleConfirmExit}
              >
                Thoát
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instant Report Dialog */}
      <Dialog open={showInstantReportDialog} onOpenChange={setShowInstantReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo cáo tức thì?</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tạo báo cáo dựa trên phần trao đổi hiện tại.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="flex-1" 
                onClick={() => setShowInstantReportDialog(false)}
              >
                Tiếp tục
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleConfirmInstantReport}
              >
                Nhận báo cáo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};