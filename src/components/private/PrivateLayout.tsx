'use client';

import { ReactNode } from 'react';
import { PrivateSidebarProvider } from '@/contexts/PrivateSidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePrivateSidebar } from '@/contexts/PrivateSidebarContext';
import PrivateNavbar from './PrivateNavbar';
import PrivateSidebar from './PrivateSidebar';

function PrivateLayoutContent({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const { isCollapsed, isMobile } = usePrivateSidebar();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.background.primary,
        color: theme.colors.text.primary,
      }}
    >
      {/* Navbar fijo arriba (full width) */}
      <PrivateNavbar />

      {/* Sidebar fijo a la izquierda (debajo del navbar) */}
      <PrivateSidebar />

      {/* Contenido principal */}
      <main
        style={{
          marginLeft: isMobile ? 0 : isCollapsed ? '72px' : '280px',
          marginTop: '64px',
          padding: '24px',
          transition: 'margin-left 0.3s ease',
          minHeight: 'calc(100vh - 64px)',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>{children}</div>
      </main>
    </div>
  );
}

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <PrivateSidebarProvider>
      <PrivateLayoutContent>{children}</PrivateLayoutContent>
    </PrivateSidebarProvider>
  );
}