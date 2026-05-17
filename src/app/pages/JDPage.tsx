import React from 'react';
import { CVMatchingPage } from './CVMatchingPage';

export const JDPage: React.FC = () => {
  return <CVMatchingPage initialSection="jd" showSectionSwitcher={false} pageTitle="Thêm mô tả công việc" pageSubtitle="Tạo và quản lý mô tả công việc" />;
};
