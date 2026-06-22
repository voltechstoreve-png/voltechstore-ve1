'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePrivateSidebar } from '@/contexts/PrivateSidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FaHome, FaBox, FaUsers, FaUserTie, FaStar, FaGift,
  FaChartLine, FaShoppingCart, FaTruck, FaExchangeAlt,
  FaPalette, FaCog, FaClipboardList, FaTv,
  FaChevronDown, FaUserShield, FaWallet, FaStore, FaBars
} from 'react-icons/fa';

interface SubMenuItem {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  path: string;
  description?: string;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  items: SubMenuItem[];
}

const menuSections: MenuSection[] = [
  {
    id: 'admin',
    title: 'Panel de Administración',
    icon: FaUserShield,
    items: [
      { icon: FaHome, label: 'Dashboard', path: '/panel', description: 'Resumen general' },
      { icon: FaBox, label: 'Productos', path: '/admin/productos', description: 'Gestión de inventario' },
      { icon: FaUsers, label: 'Clientes', path: '/admin/clientes', description: 'Base de clientes' },
      { icon: FaUserTie, label: 'Equipo', path: '/admin/equipo', description: 'Vendedores y staff' },
      { icon: FaStar, label: 'Opiniones', path: '/admin/opiniones', description: 'Reseñas de clientes' },
      { icon: FaPalette, label: 'Personalización', path: '/admin/personalizacion', description: 'Diseño y colores' },
      { icon: FaGift, label: 'Sorteos', path: '/admin/sorteos', description: 'Promociones y sorteos' },
      { icon: FaCog, label: 'Ajustes', path: '/admin/ajustes', description: 'Configuración general' },
    ],
  },
  {
    id: 'finanzas',
    title: 'Panel de Finanzas',
    icon: FaWallet,
    items: [
      { icon: FaChartLine, label: 'Dashboard', path: '/finanzas/dashboard', description: 'Resumen financiero' },
      { icon: FaShoppingCart, label: 'Ventas Productos', path: '/finanzas/ventas-productos', description: 'Registro de ventas' },
      { icon: FaTruck, label: 'Compras', path: '/finanzas/compras', description: 'Registro de compras' },
      { icon: FaTv, label: 'Ventas Streaming', path: '/finanzas/ventas-streaming', description: 'Servicios streaming' },
      { icon: FaClipboardList, label: 'Inventario', path: '/finanzas/inventario', description: 'Control de stock' },
      { icon: FaExchangeAlt, label: 'Cambios', path: '/finanzas/cambios', description: 'Devoluciones y cambios' },
      { icon: FaUserTie, label: 'Empleados', path: '/finanzas/empleados', description: 'Gestión de personal' },
    ],
  },
];

export default function PrivateSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { isCollapsed, isOpen, toggleSidebar, isMobile } = usePrivateSidebar();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    admin: true,
    finanzas: false,
  });

  const activeSection = pathname.startsWith('/finanzas') ? 'finanzas' : 'admin';

  useEffect(() => {
    setExpandedMenus(prev => ({
      ...prev,
      [activeSection]: true,
    }));
  }, [activeSection]);

  useEffect(() => {
    if (isCollapsed) {
      setExpandedMenus({ admin: false, finanzas: false });
    }
  }, [isCollapsed]);

  const toggleMenu = (menuId: string) => {
    if (isCollapsed) return;
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      toggleSidebar();
    }
  };

  const renderSectionHeader = (section: MenuSection) => {
    const isExpanded = expandedMenus[section.id];
    const isActive = section.id === activeSection;
    const Icon = section.icon;

    return (
      <button
        key={section.id}
        onClick={() => toggleMenu(section.id)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: isCollapsed ? '10px 8px' : '10px 12px',
          background: isActive ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
          border: 'none',
          borderRadius: '10px',
          cursor: isCollapsed ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          marginBottom: '4px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!isCollapsed && !isActive) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCollapsed && !isActive) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
        title={isCollapsed ? section.title : ''}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            background: isActive ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? '#c084fc' : theme.colors.text.secondary,
            fontSize: '16px',
            transition: 'all 0.3s ease',
          }}
        >
          <Icon />
        </div>

        {!isCollapsed && (
          <>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  margin: 0,
                  color: isActive ? '#d8b4fe' : theme.colors.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {section.title}
              </p>
            </div>
            <FaChevronDown
              style={{
                color: theme.colors.text.secondary,
                fontSize: '11px',
                transition: 'transform 0.3s ease',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                flexShrink: 0,
              }}
            />
          </>
        )}
      </button>
    );
  };

  const renderSubMenuItem = (item: SubMenuItem) => {
    const isActive = pathname === item.path;
    const Icon = item.icon;

    return (
      <button
        key={item.path}
        onClick={() => handleNavigation(item.path)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: isCollapsed ? '10px 8px' : '8px 12px',
          background: isActive ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
          border: isActive ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid transparent',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          marginBottom: '3px',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.border = '1px solid transparent';
          }
        }}
        title={isCollapsed ? item.label : ''}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            minWidth: '32px',
            background: isActive ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? '#d8b4fe' : theme.colors.text.secondary,
            fontSize: '14px',
            transition: 'all 0.2s ease',
          }}
        >
          <Icon />
        </div>

        {!isCollapsed && (
          <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left', minWidth: 0 }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: '600',
                margin: '0 0 1px 0',
                color: isActive ? '#e9d5ff' : theme.colors.text.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {item.label}
            </p>
            {item.description && (
              <p
                style={{
                  fontSize: '11px',
                  margin: 0,
                  color: theme.colors.text.secondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.description}
              </p>
            )}
          </div>
        )}

        {!isCollapsed && isActive && (
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#a855f7',
              boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
              flexShrink: 0,
            }}
          />
        )}
      </button>
    );
  };

  const renderMenuContent = (section: MenuSection) => {
    const isExpanded = expandedMenus[section.id];

    return (
      <div
        style={{
          maxHeight: isExpanded ? `${section.items.length * 55}px` : '0',
          opacity: isExpanded ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.3s ease',
          marginBottom: isExpanded ? '8px' : '0',
        }}
      >
        <div style={{ paddingLeft: isCollapsed ? '0' : '4px' }}>
          {section.items.map(renderSubMenuItem)}
        </div>
      </div>
    );
  };

  // Mobile - Drawer flotante
  if (isMobile && isOpen) {
    return (
      <>
        <div
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
          }}
        />

        <aside
          style={{
            position: 'fixed',
            left: 0,
            top: '64px',
            height: 'calc(100vh - 64px)',
            width: '280px',
            background: theme.colors.background.secondary,
            borderRight: `1px solid ${theme.colors.border.default}`,
            zIndex: 50,
            overflowY: 'auto',
            padding: '16px',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Botón Hamburguesa */}
          <button
            onClick={toggleSidebar}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '10px',
              color: '#a855f7',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
            }}
          >
            <FaBars />
            <span>Contraer menú</span>
          </button>

          {/* Menús */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {menuSections.map(section => (
              <div key={section.id}>
                {renderSectionHeader(section)}
                {renderMenuContent(section)}
              </div>
            ))}
          </div>

          {/* Botón Volver a Tienda */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: `1px solid ${theme.colors.border.default}`,
              marginTop: '16px',
            }}
          >
            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '10px',
                color: '#22c55e',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
              }}
            >
              <FaStore />
              <span>Ver Tienda Pública</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // Desktop - Sidebar fijo
  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: '64px',
        height: 'calc(100vh - 64px)',
        width: isCollapsed ? '72px' : '280px',
        background: theme.colors.background.secondary,
        borderRight: `1px solid ${theme.colors.border.default}`,
        zIndex: 30,
        overflowY: 'auto',
        padding: '16px 12px',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Botón Hamburguesa */}
      <button
        onClick={toggleSidebar}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'center',
          gap: '10px',
          padding: isCollapsed ? '12px' : '12px',
          background: 'rgba(168, 85, 247, 0.15)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '10px',
          color: '#a855f7',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
        }}
        title={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
      >
        <FaBars style={{ fontSize: '16px' }} />
        {!isCollapsed && <span>Contraer menú</span>}
      </button>

      {/* Menús desplegables */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {menuSections.map(section => (
          <div key={section.id}>
            {renderSectionHeader(section)}
            {renderMenuContent(section)}
          </div>
        ))}
      </div>

      {/* Botón Volver a Tienda */}
      <div
        style={{
          paddingTop: '16px',
          borderTop: `1px solid ${theme.colors.border.default}`,
          marginTop: '16px',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: isCollapsed ? '12px' : '12px 16px',
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            color: '#22c55e',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
          }}
          title={isCollapsed ? 'Ver Tienda Pública' : ''}
        >
          <FaStore />
          {!isCollapsed && <span style={{ flex: 1 }}>Ver Tienda Pública</span>}
        </button>
      </div>
    </aside>
  );
}