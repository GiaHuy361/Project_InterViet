import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

type AuthAlertVariant = 'error' | 'success' | 'info';

const styles: Record<AuthAlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

const icons: Record<AuthAlertVariant, React.ReactNode> = {
  error: <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />,
  success: <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />,
  info: <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />,
};

type AuthAlertProps = {
  message: string;
  variant?: AuthAlertVariant;
};

export const AuthAlert: React.FC<AuthAlertProps> = ({ message, variant = 'error' }) => {
  if (!message) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -8, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -4, height: 0 }}
        transition={{ duration: 0.25 }}
        className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}
        role="alert"
      >
        {icons[variant]}
        <p className="leading-relaxed">{message}</p>
      </motion.div>
    </AnimatePresence>
  );
};
