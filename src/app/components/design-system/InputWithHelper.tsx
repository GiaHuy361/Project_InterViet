import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface InputWithHelperProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export const InputWithHelper: React.FC<InputWithHelperProps> = ({
  label,
  helperText,
  error,
  id,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s/g, '-')}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input 
        id={inputId} 
        {...props} 
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};
