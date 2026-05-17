import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  FileUp, 
  FileText, 
  Mic, 
  BarChart3, 
  CreditCard,
  Settings,
  Home,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  const commands = [
    {
      group: 'Tính năng chính',
      items: [
        { label: 'Tải CV lên', icon: FileUp, action: () => navigate('/cv-matching') },
        { label: 'So khớp JD', icon: FileText, action: () => navigate('/cv-matching') },
        { label: 'Bắt đầu phỏng vấn', icon: Mic, action: () => navigate('/phong-van-setup') },
        { label: 'Xem báo cáo', icon: BarChart3, action: () => navigate('/bao-cao') },
      ],
    },
    {
      group: 'Điều hướng',
      items: [
        { label: 'Bảng điều khiển', icon: Home, action: () => navigate('/dashboard') },
        { label: 'Cài đặt', icon: Settings, action: () => navigate('/cai-dat') },
        { label: 'Gói dịch vụ', icon: CreditCard, action: () => navigate('/goi-dich-vu') },
        { label: 'Trung tâm trợ giúp', icon: HelpCircle, action: () => navigate('/ho-tro') },
      ],
    },
  ];

  const handleSelect = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Tìm kiếm tính năng, trang..." />
      <CommandList>
        <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
        {commands.map((group, idx) => (
          <CommandGroup key={idx} heading={group.group}>
            {group.items.map((item, itemIdx) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={itemIdx}
                  onSelect={() => handleSelect(item.action)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
