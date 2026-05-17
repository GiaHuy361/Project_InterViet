import React from 'react';
import { CVMatchingPage } from './CVMatchingPage';

export const CVPage: React.FC = () => {
  return <CVMatchingPage initialSection="cv" showSectionSwitcher={false} pageTitle="Tải CV" pageSubtitle="Tải lên, quản lý và xem chi tiết CV" />;
};
