import React from 'react';
import Sidebar from './sidebar';
import MobileSidebar from './mobile-sidebar';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile.tsx';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  const isMobile = useMobile();

  return (
    <div className="min-h-screen bg-background flex">
      {isMobile ? <MobileSidebar /> : <Sidebar />}
      <main className={cn("flex-1 p-8 pt-6", className)}>
        {children}
      </main>
    </div>
  );
}

export { Layout };