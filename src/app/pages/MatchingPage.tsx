import React from 'react';
import { CVMatchingPage } from './CVMatchingPage';

export const MatchingPage: React.FC = () => {
  return <CVMatchingPage initialSection="matching" showSectionSwitcher={false} pageTitle="Đối sánh CV với mô tả công việc" pageSubtitle="Chọn CV, chọn mô tả công việc và xem kết quả" />;
};
