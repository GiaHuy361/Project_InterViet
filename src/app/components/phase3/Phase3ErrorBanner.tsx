import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '../ui/card';

export function Phase3ErrorBanner({ message }: { message: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm">{message}</p>
      </div>
    </Card>
  );
}
