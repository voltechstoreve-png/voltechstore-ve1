'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PrivateSidebarContextType {
  isOpen: boolean;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

const PrivateSidebarContext = createContext<PrivateSidebarContextType | undefined>(undefined);

export function PrivateSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsOpen(false);
      } else {
        const savedState = localStorage.getItem('privateSidebarCollapsed');
        if (savedState !== null) {
          setIsCollapsed(savedState === 'true');
        }
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('privateSidebarCollapsed', String(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <PrivateSidebarContext.Provider
      value={{ isOpen, isCollapsed, toggleSidebar, isMobile }}
    >
      {children}
    </PrivateSidebarContext.Provider>
  );
}

export function usePrivateSidebar() {
  const context = useContext(PrivateSidebarContext);
  if (context === undefined) {
    throw new Error('usePrivateSidebar must be used within a PrivateSidebarProvider');
  }
  return context;
}