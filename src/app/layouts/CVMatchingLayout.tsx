import React from 'react';
import { Outlet } from 'react-router';

export const CVMatchingLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      <Outlet />
    </div>
  );
};
