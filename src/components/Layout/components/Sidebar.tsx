import React from 'react';
import { Sidebar as BaseSidebar } from '../../Sidebar';

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  return <BaseSidebar {...props} />;
};

export { Sidebar };
