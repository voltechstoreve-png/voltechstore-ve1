'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaStore, 
  FaUserShield, 
  FaChartLine, 
  FaBoxes,
  FaUsers,
  FaTachometerAlt,
  FaStar,
  FaPalette,
  FaGift,
  FaShoppingCart,
  FaExchangeAlt,
  FaUserTie,
  FaClipboardList,
  FaTv,
  FaArrowRight,
  FaLock,
  FaGlobe,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';

interface SubMenu {
  id: string;
  label: string;
  icon: any;
  path: string;
  description: string;
}

interface MainModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  colorDark: string;
  path: string;
  public: boolean;
  subMenus?: SubMenu[];
}

export default function PanelControl() {
  const router = useRouter();
  const { theme, mode, toggleTheme } = useTheme();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const modules: MainModule[] = [
    {
      id: 'catalogo',
      title: 'Catálogo Público',
      description: 'La tienda que ven tus clientes',
      icon: FaStore,
      color: '#22c55e',
      colorDark: 'rgba(34, 197, 94, 0.15)',
      path: '/',
      public: true,
      subMenus: [
        { id: 'tienda', label: 'Ver Tienda', icon: FaStore, path: '/', description: 'Catálogo de productos' },
        { id: 'carrito', label: 'Carrito', icon: FaShoppingCart, path: '/carrito', description: 'Tu carrito de compras' },
      ],
    },
    {
      id: 'admin',
      title: 'Panel de Administración',
      description: 'Gestiona toda tu tienda',
      icon: FaUserShield,
      color: '#3b82f6',
      colorDark: 'rgba(59, 130, 246, 0.15)',
      path: '/admin',
      public: false,
      subMenus: [
        { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt, path: '/admin/dashboard', description: 'Resumen general' },
        { id: 'productos', label: 'Productos', icon: FaBoxes, path: '/admin/productos', description: 'Gestión de productos' },
        { id: 'clientes', label: 'Clientes', icon: FaUsers, path: '/admin/clientes', description: 'Base de clientes' },
        { id: 'equipo', label: 'Equipo', icon: FaUserTie, path: '/admin/equipo', description: 'Vendedores y staff' },
        { id: 'opiniones', label: 'Opiniones', icon: FaStar, path: '/admin/opiniones', description: 'Reseñas de clientes' },
        { id: 'personalizacion', label: 'Personalización', icon: FaPalette, path: '/admin/personalizacion', description: 'Diseño y colores' },
        { id: 'sorteos', label: 'Sorteos', icon: FaGift, path: '/admin/sorteos', description: 'Promociones y sorteos' },
        { id: 'ajustes', label: 'Ajustes', icon: FaCog, path: '/admin/ajustes', description: 'Configuración general' },
      ],
    },
    {
      id: 'finanzas',
      title: 'Panel de Finanzas',
      description: 'Control total de ventas e inventario',
      icon: FaChartLine,
      color: '#a855f7',
      colorDark: 'rgba(168, 85, 247, 0.15)',
      path: '/finanzas',
      public: false,
      subMenus: [
        { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt, path: '/finanzas/dashboard', description: 'Resumen financiero' },
        { id: 'ventas-productos', label: 'Ventas Productos', icon: FaShoppingCart, path: '/finanzas/ventas-productos', description: 'Registro de ventas' },
        { id: 'compras', label: 'Compras', icon: FaBoxes, path: '/finanzas/compras', description: 'Registro de compras' },
        { id: 'ventas-streaming', label: 'Ventas Streaming', icon: FaTv, path: '/finanzas/ventas-streaming', description: 'Servicios streaming' },
        { id: 'inventario', label: 'Inventario', icon: FaClipboardList, path: '/finanzas/inventario', description: 'Control de stock' },
        { id: 'cambios', label: 'Cambios', icon: FaExchangeAlt, path: '/finanzas/cambios', description: 'Devoluciones y cambios' },
        { id: 'empleados', label: 'Empleados', icon: FaUserTie, path: '/finanzas/empleados', description: 'Gestión de personal' },
      ],
    },
  ];

  const handleModuleClick = (module: MainModule, subMenu?: SubMenu) => {
    const path = subMenu ? subMenu.path : module.path;
    router.push(path);
  };

  const toggleExpand = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  if (loading || authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: theme.colors.background.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.colors.text.primary,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              border: `3px solid ${theme.colors.border.light}`,
              borderTopColor: theme.colors.accent.primary,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p>Cargando...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.background.primary,
        color: theme.colors.text.primary,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '20px 32px',
          borderBottom: `1px solid ${theme.colors.border.default}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme.colors.background.secondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Logo decorativo */}
          <div
            style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '22px',
              fontWeight: 'bold',
              cursor: 'default',
              userSelect: 'none',
            }}
            title="VoltechStore.ve"
          >
            V
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
              VoltechStore.ve
            </h1>
            <p style={{ color: theme.colors.text.secondary, fontSize: '12px', margin: 0 }}>
              Centro de Control
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && profile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                  {profile.nombre} {profile.apellido}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: theme.colors.text.secondary }}>
                  {profile.rol} • {profile.email}
                </p>
              </div>
              {profile.foto_url && (
                <img
                  src={profile.foto_url}
                  alt={profile.nombre}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `2px solid ${theme.colors.accent.primary}`,
                  }}
                />
              )}
              <button
                onClick={handleSignOut}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border.light}`,
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                title="Cerrar sesión"
              >
                <FaSignOutAlt />
              </button>
            </div>
          ) : null}
          
          <button
            onClick={toggleTheme}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.border.light}`,
              background: theme.colors.background.tertiary,
              color: mode === 'dark' ? '#fbbf24' : '#3b82f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            {mode === 'dark' ? '☀️' : ''}
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
             Bienvenido{profile ? `, ${profile.nombre}` : ''}
          </h2>
          <p style={{ color: theme.colors.text.secondary, fontSize: '15px', margin: 0 }}>
            Selecciona un módulo para comenzar
          </p>
        </div>

        {/* Resumen según rol */}
        {user && profile && (
          <div style={{
            background: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaTachometerAlt style={{ color: theme.colors.accent.primary }} />
              Resumen - {profile.rol === 'admin' ? 'Administración' : profile.rol === 'socio' ? 'Finanzas' : 'Empleado'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {profile.rol === 'admin' ? (
                <>
                  <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <p style={{ color: '#3b82f6', fontSize: '12px', margin: '0 0 4px 0' }}>Productos Activos</p>
                    <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>--</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <p style={{ color: '#22c55e', fontSize: '12px', margin: '0 0 4px 0' }}>Clientes</p>
                    <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>--</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <p style={{ color: '#f59e0b', fontSize: '12px', margin: '0 0 4px 0' }}>Opiniones Pendientes</p>
                    <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>--</p>
                  </div>
                </>
              ) : profile.rol === 'socio' ? (
                <>
                  <div style={{ padding: '16px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                    <p style={{ color: '#a855f7', fontSize: '12px', margin: '0 0 4px 0' }}>Ventas Hoy</p>
                    <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>$0.00</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <p style={{ color: '#22c55e', fontSize: '12px', margin: '0 0 4px 0' }}>Inventario</p>
                    <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>--</p>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <p style={{ color: '#ef4444', fontSize: '12px', margin: '0 0 4px 0' }}>Cambios Pendientes</p>
                    <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>--</p>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <p style={{ color: '#3b82f6', fontSize: '12px', margin: '0 0 4px 0' }}>Estado</p>
                    <p style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>{profile.estado || 'Pendiente'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Grid de Módulos */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          {modules.map((module) => {
            const Icon = module.icon;
            const isLocked = !module.public && !user;
            const isExpanded = expandedModule === module.id;

            return (
              <div
                key={module.id}
                style={{
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${module.public ? module.color : theme.colors.border.default}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  opacity: module.public ? 1 : (user ? 1 : 0.5),
                  boxShadow: module.public ? `0 4px 20px ${module.color}30` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (module.public || user) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = module.public 
                      ? `0 12px 32px ${module.color}40`
                      : `0 12px 32px ${module.color}30`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = module.public ? `0 4px 20px ${module.color}30` : 'none';
                }}
              >
                <div
                  onClick={() => {
                    if (module.public) {
                      toggleExpand(module.id);
                    } else if (!isLocked) {
                      toggleExpand(module.id);
                    }
                  }}
                  style={{
                    padding: '24px',
                    cursor: module.public ? 'pointer' : (isLocked ? 'not-allowed' : 'pointer'),
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          background: module.public 
                            ? `linear-gradient(135deg, ${module.color}, #16a34a)`
                            : (user ? `linear-gradient(135deg, ${module.color}, ${module.color}dd)` : 'rgba(107, 114, 128, 0.2)'),
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: module.public ? '#ffffff' : (user ? '#ffffff' : '#6b7280'),
                          fontSize: '24px',
                          flexShrink: 0,
                          boxShadow: module.public ? `0 4px 16px ${module.color}60` : 'none',
                        }}
                      >
                        <Icon />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: '700', 
                            margin: 0,
                            color: module.public ? theme.colors.text.primary : (user ? theme.colors.text.primary : '#6b7280'),
                          }}>
                            {module.title}
                          </h3>
                          <span
                            style={{
                              padding: '2px 8px',
                              background: module.public ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                              color: module.public ? '#22c55e' : '#ef4444',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {module.public ? <FaGlobe style={{ fontSize: '8px' }} /> : <FaLock style={{ fontSize: '8px' }} />}
                            {module.public ? 'PÚBLICO' : 'PRIVADO'}
                          </span>
                        </div>
                        <p style={{ color: theme.colors.text.secondary, fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
                          {module.description}
                        </p>
                        {module.public && module.subMenus && (
                          <p style={{ color: '#22c55e', fontSize: '11px', marginTop: '8px', margin: 0, fontWeight: '600' }}>
                            ✅ {module.subMenus.length} secciones disponibles
                          </p>
                        )}
                      </div>
                    </div>
                    <FaArrowRight
                      style={{
                        color: module.public ? '#22c55e' : (user ? theme.colors.accent.primary : '#6b7280'),
                        fontSize: '16px',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        marginTop: '4px',
                      }}
                    />
                  </div>
                </div>

                {isExpanded && module.subMenus && (
                  <div
                    style={{
                      borderTop: `1px solid ${theme.colors.border.default}`,
                      padding: '16px 24px 24px',
                      background: theme.colors.background.secondary,
                    }}
                  >
                    <h4 style={{ fontSize: '12px', fontWeight: '600', color: theme.colors.text.secondary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Menús Disponibles
                    </h4>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {module.subMenus.map((subMenu) => {
                        const SubIcon = subMenu.icon;
                        return (
                          <button
                            key={subMenu.id}
                            onClick={() => handleModuleClick(module, subMenu)}
                            style={{
                              padding: '12px 16px',
                              background: theme.colors.background.tertiary,
                              border: `1px solid ${theme.colors.border.light}`,
                              borderRadius: '8px',
                              color: theme.colors.text.primary,
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s',
                              textAlign: 'left',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = module.color;
                              e.currentTarget.style.background = module.colorDark;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = theme.colors.border.light;
                              e.currentTarget.style.background = theme.colors.background.tertiary;
                            }}
                          >
                            <SubIcon style={{ color: module.color, fontSize: '14px' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600' }}>{subMenu.label}</div>
                              <div style={{ fontSize: '11px', color: theme.colors.text.muted }}>
                                {subMenu.description}
                              </div>
                            </div>
                            <FaArrowRight style={{ color: theme.colors.text.muted, fontSize: '12px' }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Overlay de bloqueo SOLO para Admin/Finanzas sin login */}
                {!module.public && !user && (
                  <div
                    onClick={() => router.push('/auth/login?redirect=' + module.path)}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0, 0, 0, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(4px)',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        background: theme.colors.background.tertiary,
                        padding: '24px 32px',
                        borderRadius: '12px',
                        border: `1px solid ${theme.colors.border.default}`,
                        textAlign: 'center',
                        boxShadow: theme.shadows.lg,
                      }}
                    >
                      <FaLock style={{ fontSize: '36px', color: theme.colors.accent.primary, marginBottom: '12px' }} />
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        Iniciar Sesión
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: theme.colors.text.secondary }}>
                        Acceder a {module.title.toLowerCase()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            paddingTop: '24px',
            borderTop: `1px solid ${theme.colors.border.default}`,
            textAlign: 'center',
            color: theme.colors.text.muted,
            fontSize: '13px',
          }}
        >
          <p style={{ margin: 0 }}>
            © 2026 VoltechStore.ve - Todos los derechos reservados
          </p>
        </div>
      </main>
    </div>
  );
}