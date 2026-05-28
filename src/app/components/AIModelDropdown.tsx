import React, { useState, useEffect } from 'react';
import { ChevronDown, Lock, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'motion/react';

interface AIModel {
  value: string;
  label: string;
  description: string;
  premium: boolean;
}

const AI_MODELS: AIModel[] = [
  {
    value: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    description: 'Nhanh & tiết kiệm',
    premium: false,
  },
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    description: 'Chất lượng cao, phản biện sâu',
    premium: false,
  },
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini Flash',
    description: 'Phản hồi nhanh, cân bằng chi phí',
    premium: false,
  },
  {
    value: 'gemini-3.1-pro',
    label: 'Gemini Pro',
    description: 'Ngữ cảnh dài, phân tích sâu',
    premium: false,
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Cấu hình chuẩn, ổn định',
    premium: false,
  },
  {
    value: 'basic',
    label: 'Basic',
    description: 'Nhẹ, phù hợp luyện tập nhanh',
    premium: false,
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Phân tích nâng cao',
    premium: false,
  },
];

interface AIModelDropdownProps {
  selectedModel: string;
  onSelect: (modelValue: string) => void;
  isPremium: boolean;
  onUpgradeClick: () => void;
}

export const AIModelDropdown: React.FC<AIModelDropdownProps> = ({
  selectedModel,
  onSelect,
  isPremium,
  onUpgradeClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selected = AI_MODELS.find(m => m.value === selectedModel) || AI_MODELS[0];
  const freeModels = AI_MODELS.filter(m => !m.premium);
  const premiumModels = AI_MODELS.filter(m => m.premium);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById('ai-model-dropdown');
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleModelClick = (model: AIModel) => {
    if (!isPremium && model.premium) {
      onUpgradeClick();
      setIsOpen(false);
      return;
    }
    onSelect(model.value);
    setIsOpen(false);
    
    // Persist to localStorage
    localStorage.setItem('interviet_selected_model', model.value);
  };

  return (
    <div id="ai-model-dropdown" className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-lg border-2 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 transition-all text-left bg-white dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{selected.label}</span>
              {selected.premium && !isPremium ? (
                <Badge variant="secondary" className="text-xs">
                  <Lock size={10} className="mr-1" />
                  Premium
                </Badge>
              ) : selected.premium ? (
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  Miễn phí
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{selected.description}</div>
          </div>
          <ChevronDown 
            size={20} 
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Free Models Section */}
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Miễn phí
              </div>
              {freeModels.map(model => (
                <button
                  key={model.value}
                  onClick={() => handleModelClick(model)}
                  className={`w-full p-3 rounded-md text-left transition-all ${
                    selectedModel === model.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-600 dark:border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{model.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{model.description}</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Miễn phí
                    </Badge>
                  </div>
                </button>
              ))}
            </div>

            {/* Premium Models Section */}
            <div className="p-2 border-t dark:border-slate-800">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                <Sparkles size={12} className="text-blue-600 dark:text-blue-400" />
                Premium
              </div>
              {premiumModels.map(model => (
                <button
                  key={model.value}
                  onClick={() => handleModelClick(model)}
                  disabled={!isPremium}
                  className={`w-full p-3 rounded-md text-left transition-all ${
                    selectedModel === model.value
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-600 dark:border-blue-500'
                      : !isPremium
                      ? 'opacity-60 cursor-not-allowed border-2 border-transparent'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{model.label}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{model.description}</div>
                    </div>
                    {!isPremium && (
                      <Badge variant="secondary" className="text-xs">
                        <Lock size={10} className="mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Upgrade CTA for free users */}
            {!isPremium && (
              <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <p className="text-sm font-medium">Mở khóa tất cả 7 model AI</p>
                <p className="text-xs opacity-90">Nâng cấp để trải nghiệm chất lượng tốt nhất</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
