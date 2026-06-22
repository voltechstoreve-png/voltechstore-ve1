'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import PrivateLayout from '@/components/private/PrivateLayout';
import {
  FaBox,
  FaUsers,
  FaStar,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaDollarSign,
  FaShoppingCart,
  FaEye,
  FaClock
} from 'react-icons/fa';

interface DashboardStats {
  productosActivos: number;
  clientes: number;
  opinionesPendientes: number;
  ventasHoy: number;
  ingresosMes: number;
  productosBajoStock: number;
}

export default function PanelControl() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    productosActivos: 0,
    clientes: 0,
    opinionesPendientes: 0,
    ventasHoy: 0,
    ingresosMes: 0,
    productosBajoStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Productos activos
      const { count: productosActivos } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'publicado');

      // Productos bajo stock
      const { count: productosBajoStock } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'publicado')
        .lt('stock', 5);

      // Opiniones pendientes
      const { count: opinionesPendientes } = await supabase
        .from('opiniones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente');

      // Clientes (usuarios con rol cliente)
      const { count: clientes } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'cliente');

      setStats({
        productosActivos: productosActivos || 0,
        clientes: clientes || 0,
        opinionesPendientes: opinionesPendientes || 0,
        ventasHoy: 0,
        ingresosMes: 0,
        productosBajoStock: productosBajoStock || 0,
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const metricCards = [
    {
      label: 'Productos Activos',
      value: stats.productosActivos.toString(),
      icon: FaBox,
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      trend: '+2 esta semana',
      trendUp: true,
    },
    {
      label: 'Clientes Registrados',
      value: stats.clientes.toString(),
      icon: FaUsers,
      color: '#22c55e',
      bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      trend: '+5 este mes',
      trendUp: true,
    },
    {
      label: 'Opiniones Pendientes',
      value: stats.opinionesPendientes.toString(),
      icon: FaStar,
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      trend: 'Requieren revisión',
      trendUp: false,
    },
    {
      label: 'Productos Bajo Stock',
      value: stats.productosBajoStock.toString(),
      icon: FaClock,
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      trend: 'Reponer inventario',
      trendUp: false,
    },
  ];

  const quickActions = [
    { label: 'Productos', icon: FaBox, path: '/admin/productos', color: '#3b82f6' },
    { label: 'Clientes', icon: FaUsers, path: '/admin/clientes', color: '#22c55e' },
    { label: 'Opiniones', icon: FaStar, path: '/admin/opiniones', color: '#f59e0b' },
    { label: 'Finanzas', icon: FaChartLine, path: '/finanzas/dashboard', color: '#a855f7' },
  ];

  if (loading) {
    return (
      <PrivateLayout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              border: '3px solid rgba(139, 92, 246, 0.2)',
              borderTopColor: '#8b5cf6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: theme.colors.text.secondary }}>Cargando dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </PrivateLayout>
    );
  }

  return (
    <PrivateLayout>
      <div>
        {/* Header del Dashboard */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: theme.colors.text.primary }}>
            Bienvenido, {profile?.nombre || 'Admin'}
          </h1>
          <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: 0 }}>
            Resumen administrativo de VoltechStore
          </p>
        </div>

        {/* Tarjetas de Métricas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                style={{
                  background: metric.bgGradient,
                  border: metric.border,
                  borderRadius: '16px',
                  padding: '24px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${metric.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: `${metric.color}20`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: metric.color,
                      fontSize: '22px',
                    }}
                  >
                    <Icon />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: metric.trendUp ? '#22c55e' : '#f59e0b',
                      fontWeight: '600',
                    }}
                  >
                    {metric.trendUp ? <FaArrowUp /> : <FaArrowDown />}
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 0 4px 0', fontWeight: '500' }}>
                    {metric.label}
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
                    {metric.value}
                  </p>
                </div>

                <p style={{ fontSize: '12px', color: metric.trendUp ? '#22c55e' : '#f59e0b', margin: 0, fontWeight: '500' }}>
                  {metric.trend}
                </p>
              </div>
            );
          })}
        </div>

        {/* Acciones Rápidas */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: theme.colors.text.primary }}>
            Acciones Rápidas
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => router.push(action.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 20px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '12px',
                    color: theme.colors.text.primary,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = action.color;
                    e.currentTarget.style.background = `${action.color}10`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors.border.default;
                    e.currentTarget.style.background = theme.colors.background.tertiary;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      background: `${action.color}20`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color,
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    <Icon />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                      {action.label}
                    </p>
                    <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                      Ir al módulo
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de Información */}
        <div
          style={{
            background: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: theme.colors.text.primary }}>
            Estado del Sistema
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                }}
              />
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: theme.colors.text.primary }}>
                  Sistema Operativo
                </p>
                <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                  Todos los servicios activos
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                }}
              />
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: theme.colors.text.primary }}>
                  Base de Datos
                </p>
                <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                  Conexión establecida
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#a855f7',
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.6)',
                }}
              />
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', margin: 0, color: theme.colors.text.primary }}>
                  Usuario
                </p>
                <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '2px 0 0 0' }}>
                  {profile?.rol || 'admin'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PrivateLayout>
  );
}