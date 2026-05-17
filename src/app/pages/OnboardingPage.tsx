import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  const roles = [
    'Software Engineer',
    'Product Manager',
    'Data Analyst',
    'Marketing Manager',
    'Designer',
    'Khác'
  ];

  const experiences = [
    'Sinh viên / Thực tập',
    '0-2 năm',
    '2-5 năm',
    '5+ năm'
  ];

  const goalOptions = [
    'Tối ưu CV',
    'Luyện phỏng vấn',
    'Chuẩn bị chuyển việc',
    'Tìm việc mới',
    'Phát triển kỹ năng'
  ];

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigate('/dashboard');
    }
  };

  const canProceed = () => {
    if (step === 1) return role !== '';
    if (step === 2) return experience !== '';
    if (step === 3) return goals.length > 0;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <Card className="glass-card card-aurora w-full max-w-2xl rounded-2xl p-8 shadow-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Chào mừng đến INTER-VIET!</h2>
            <span className="text-sm text-gray-600">Bước {step}/3</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Bạn đang làm công việc gì?</h3>
              <p className="text-gray-600 mb-4">
                Điều này giúp chúng tôi cá nhân hóa trải nghiệm cho bạn
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    role === r 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r}</span>
                    {role === r && <CheckCircle className="text-blue-600" size={20} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Bạn có bao nhiêu năm kinh nghiệm?</h3>
              <p className="text-gray-600 mb-4">
                Chúng tôi sẽ điều chỉnh độ khó phỏng vấn phù hợp
              </p>
            </div>
            
            <div className="space-y-3">
              {experiences.map(exp => (
                <button
                  key={exp}
                  onClick={() => setExperience(exp)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    experience === exp 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{exp}</span>
                    {experience === exp && <CheckCircle className="text-blue-600" size={20} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Mục tiêu của bạn là gì?</h3>
              <p className="text-gray-600 mb-4">
                Chọn một hoặc nhiều mục tiêu
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {goalOptions.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    goals.includes(goal)
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{goal}</span>
                    {goals.includes(goal) && <CheckCircle className="text-blue-600" size={20} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
            >
              Quay lại
            </Button>
          )}
          <Button 
            className="flex-1"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {step === 3 ? 'Hoàn thành' : 'Tiếp theo'}
            <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
};
