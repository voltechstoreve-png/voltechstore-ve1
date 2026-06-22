'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft,
  FaChartLine,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaGift,
  FaTrophy,
  FaUserTie,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaClock,
  FaDollarSign,
  FaEye,
  FaTicketAlt
} from 'react-icons/fa';

interface Vendedor {
  id: string;
  nombre: string;
  apellido: string;
  total_ventas: number;
  cantidad_ventas: number;
}

interface VentaReciente {
  id: string;
  cliente_nombre: string;
  producto: string;
  monto: number;
  fecha: string;
  vendedor: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    productosPublicados: 0,
    totalVentas: 0,
    ingresosMes: 0,
    ingresosMesAnterior: 0,
    clientesNuevos: 0,
    stockBajo: 0,
    sorteosRegistro: 0,
    sorteosVentas: 0,
  });
  const [topVendedores, setTopVendedores] = useState<Vendedor[]>([]);
  const [ventasRecientes, setVentasRecientes] = useState<VentaReciente[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Productos publicados
      const { count: productosCount } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('publicado', true);

      // Stock bajo
      const { count: stockBajoCount } = await supabase
        .from('inventario')
        .select('*', { count: 'exact', head: true })
        .lt('stock_actual', 5)
        .eq('estado', 'activo');

      // Ventas del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: ventasMes, count: ventasCount } = await supabase
        .from('ventas_productos')
        .select('monto_total, created_at', { count: 'exact' })
        .gte('created_at', inicioMes.toISOString());

      // Ventas del mes anterior
      const inicioMesAnterior = new Date();
      inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
      inicioMesAnterior.setDate(1);
      inicioMesAnterior.setHours(0, 0, 0, 0);

      const { data: ventasMesAnterior } = await supabase
        .from('ventas_productos')
        .select('monto_total')
        .gte('created_at', inicioMesAnterior.toISOString())
        .lt('created_at', inicioMes.toISOString());

      // Clientes nuevos este mes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', inicioMes.toISOString());

      // Sorteos de registro
      const { count: sorteosRegCount } = await supabase
        .from('sorteos_registro')
        .select('*', { count: 'exact', head: true });

      // Sorteos de ventas
      const { count: sorteosVentCount } = await supabase
        .from('sorteos_ventas')
        .select('*', { count: 'exact', head: true });

      // Top vendedores (simulado - necesitas tabla ventas_vendedor)
      const { data: vendedoresData } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, rol')
        .eq('rol', 'empleado')
        .limit(3);

      // Ventas recientes
      const { data: ventasRecientesData } = await supabase
        .from('ventas_productos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const ingresosMesTotal = ventasMes?.reduce((sum, v) => sum + (v.monto_total || 0), 0) || 0;
      const ingresosMesAnteriorTotal = ventasMesAnterior?.reduce((sum, v) => sum + (v.monto_total || 0), 0) || 0;

      setStats({
        productosPublicados: productosCount || 0,
        totalVentas: ventasCount || 0,
        ingresosMes: ingresosMesTotal,
        ingresosMesAnterior: ingresosMesAnteriorTotal,
        clientesNuevos: clientesCount || 0,
        stockBajo: stockBajoCount || 0,
        sorteosRegistro: sorteosRegCount || 0,
        sorteosVentas: sorteosVentCount || 0,
      });

      // Simular top vendedores (reemplazar con datos reales)
      if (vendedoresData) {
        setTopVendedores(vendedoresData.map((v, i) => ({
          id: v.id,
          nombre: v.nombre,
          apellido: v.apellido,
          total_ventas: Math.floor(Math.random() * 5000) + 1000,
          cantidad_ventas: Math.floor(Math.random() * 50) + 10,
        })));
      }

      if (ventasRecientesData) {
        setVentasRecientes(ventasRecientesData.map(v => ({
          id: v.id,
          cliente_nombre: v.cliente_nombre || 'Cliente',
          producto: v.producto || 'Producto',
          monto: v.monto_total || 0,
          fecha: v.created_at,
          vendedor: v.vendedor_nombre || 'Admin',
        })));
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const porcentajeCambio = stats.ingresosMesAnterior > 0 
    ? ((stats.ingresosMes - stats.ingresosMesAnterior) / stats.ingresosMesAnterior * 100).toFixed(1)
    : '0';

  const getMedalla = (index: number) => {
    switch (index) {
      case 0: return '';
      case 1: return '';
      case 2: return '';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{
          width: '50px', height: '50px',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p>Cargando dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.background.primary,
      color: theme.colors.text.primary,
      padding: '32px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push('/panel')}
            style={{
              width: '40px',
              height: '40px',
              background: theme.colors.background.tertiary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '8px',
              color: theme.colors.text.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Dashboard Administrativo
            </h1>
            <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: 0 }}>
              Rendimiento de VoltechStore.ve
            </p>
          </div>
        </div>

        <div style={{
          padding: '8px 16px',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '20px',
          color: '#8b5cf6',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          {new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Métricas Principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {/* Ingresos del Mes */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: '600' }}>Ingresos del Mes</span>
            <FaDollarSign style={{ color: '#22c55e', fontSize: '24px' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e', marginBottom: '8px' }}>
            ${stats.ingresosMes.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: parseFloat(porcentajeCambio) >= 0 ? '#22c55e' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            {parseFloat(porcentajeCambio) >= 0 ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(parseFloat(porcentajeCambio))}% vs mes anterior
          </div>
        </div>

        {/* Total Ventas */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>Total Ventas</span>
            <FaShoppingCart style={{ color: '#3b82f6', fontSize: '24px' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
            {stats.totalVentas}
          </div>
          <div style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
            Este mes
          </div>
        </div>

        {/* Productos Publicados */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#a855f7', fontWeight: '600' }}>Productos Publicados</span>
            <FaBox style={{ color: '#a855f7', fontSize: '24px' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#a855f7', marginBottom: '8px' }}>
            {stats.productosPublicados}
          </div>
          <div style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
            En el catálogo
          </div>
        </div>

        {/* Clientes Nuevos */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05))',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#ec4899', fontWeight: '600' }}>Clientes Nuevos</span>
            <FaUsers style={{ color: '#ec4899', fontSize: '24px' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ec4899', marginBottom: '8px' }}>
            {stats.clientesNuevos}
          </div>
          <div style={{ fontSize: '13px', color: theme.colors.text.secondary }}>
            Este mes
          </div>
        </div>
      </div>

      {/* Alertas y Sorteos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {/* Alerta Stock Bajo */}
        {stats.stockBajo > 0 && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/finanzas/inventario')}
          >
            <FaExclamationTriangle style={{ color: '#f59e0b', fontSize: '32px' }} />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f59e0b', margin: '0 0 4px 0' }}>
                Stock Bajo
              </h3>
              <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
                {stats.stockBajo} productos con stock menor a 5 unidades
              </p>
            </div>
          </div>
        )}

        {/* Sorteos de Registro */}
        <div style={{
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <FaTicketAlt style={{ color: '#fbbf24', fontSize: '32px' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fbbf24', margin: '0 0 4px 0' }}>
              Sorteos de Registro
            </h3>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
              {stats.sorteosRegistro} personas registradas
            </p>
          </div>
        </div>

        {/* Sorteos de Ventas */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <FaGift style={{ color: '#8b5cf6', fontSize: '32px' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#8b5cf6', margin: '0 0 4px 0' }}>
              Sorteos de Ventas
            </h3>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
              {stats.sorteosVentas} participantes
            </p>
          </div>
        </div>
      </div>

      {/* Top Vendedores y Ventas Recientes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
      }}>
        {/* Top 3 Vendedores */}
        <div style={{
          background: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FaTrophy style={{ color: '#fbbf24' }} />
            Top 3 Vendedores
          </h2>

          {topVendedores.length === 0 ? (
            <p style={{ color: theme.colors.text.secondary, textAlign: 'center', padding: '20px' }}>
              No hay vendedores registrados
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {topVendedores.map((vendedor, index) => (
                <div
                  key={vendedor.id}
                  style={{
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>
                      {getMedalla(index)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0' }}>
                        {vendedor.nombre} {vendedor.apellido}
                      </h3>
                      <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: 0 }}>
                        {vendedor.cantidad_ventas} ventas realizadas
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e' }}>
                      ${vendedor.total_ventas.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.colors.text.muted }}>
                      Total vendido
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ventas Recientes */}
        <div style={{
          background: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FaClock style={{ color: '#3b82f6' }} />
            Ventas Recientes
          </h2>

          {ventasRecientes.length === 0 ? (
            <p style={{ color: theme.colors.text.secondary, textAlign: 'center', padding: '20px' }}>
              No hay ventas recientes
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {ventasRecientes.map(venta => (
                <div
                  key={venta.id}
                  style={{
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {venta.producto}
                    </h3>
                    <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 0 4px 0' }}>
                      {venta.cliente_nombre}
                    </p>
                    <p style={{ fontSize: '11px', color: theme.colors.text.muted, margin: 0 }}>
                      Por: {venta.vendedor} • {new Date(venta.fecha).toLocaleDateString('es-VE')}
                    </p>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#22c55e' }}>
                    ${venta.monto.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}