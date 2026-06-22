'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft, FaChartLine, FaArrowUp, FaArrowDown,
  FaDollarSign, FaExchangeAlt, FaWallet, FaPlus,
  FaTrash, FaSave, FaBitcoin, FaMoneyBillWave, FaMobileAlt
} from 'react-icons/fa';

interface Cuenta {
  id: string;
  nombre: string;
  tipo: string;
  moneda: string;
  saldo_usd: number;
  saldo_bs: number;
  descripcion?: string;
  activa: boolean;
}

interface Movimiento {
  id: string;
  fecha: string;
  tipo: 'ingreso' | 'gasto';
  concepto: string;
  cuenta_id: string;
  monto_usd: number;
  monto_bs: number;
  tasa_aplicada?: number;
  descripcion?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [tasaDia, setTasaDia] = useState<number>(0);
  const [tasaInput, setTasaInput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
  const [nuevaCuenta, setNuevaCuenta] = useState({
    nombre: '',
    tipo: 'divisas',
    moneda: 'USD',
    descripcion: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: cuentasData } = await supabase
        .from('cuentas')
        .select('*')
        .eq('activa', true)
        .order('created_at', { ascending: true });

      const { data: tasaData } = await supabase
        .from('tasa_dia')
        .select('*')
        .eq('fecha', new Date().toISOString().split('T')[0])
        .single();

      const inicioMes = new Date();
      inicioMes.setDate(1);
      
      const { data: movimientosData } = await supabase
        .from('movimientos')
        .select('*')
        .gte('fecha', inicioMes.toISOString())
        .order('fecha', { ascending: false });

      if (cuentasData) setCuentas(cuentasData);
      if (tasaData) {
        setTasaDia(tasaData.tasa_bs);
        setTasaInput(tasaData.tasa_bs.toString());
      }
      if (movimientosData) setMovimientos(movimientosData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarTasa = async () => {
    const nuevaTasa = parseFloat(tasaInput);
    if (!nuevaTasa || nuevaTasa <= 0) {
      alert('⚠️ Ingresa una tasa válida');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasa_dia')
        .upsert({
          fecha: new Date().toISOString().split('T')[0],
          tasa_bs: nuevaTasa,
          creado_por: user?.id,
        }, { onConflict: 'fecha' });

      if (error) {
        console.error('Error guardando tasa:', error);
        alert('❌ Error al guardar la tasa: ' + error.message);
        return;
      }
      
      setTasaDia(nuevaTasa);
      alert('✅ Tasa actualizada correctamente');
    } catch (error: any) {
      console.error('Error guardando tasa:', error);
      alert('❌ Error al guardar la tasa: ' + error.message);
    }
  };

  const handleCrearCuenta = async () => {
    if (!nuevaCuenta.nombre) {
      alert('️ El nombre es obligatorio');
      return;
    }

    try {
      const { error } = await supabase
        .from('cuentas')
        .insert([{
          ...nuevaCuenta,
          saldo_usd: 0,
          saldo_bs: 0,
          creado_por: user?.id,
        }]);

      if (error) {
        console.error('Error creando cuenta:', error);
        alert('❌ Error al crear la cuenta: ' + error.message);
        return;
      }
      
      alert('✅ Cuenta creada exitosamente');
      setShowNuevaCuenta(false);
      setNuevaCuenta({ nombre: '', tipo: 'divisas', moneda: 'USD', descripcion: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error creando cuenta:', error);
      alert('❌ Error al crear la cuenta: ' + error.message);
    }
  };

  const handleEliminarCuenta = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cuenta "${nombre}"?`)) return;

    try {
      const { error } = await supabase
        .from('cuentas')
        .update({ activa: false })
        .eq('id', id);

      if (error) {
        console.error('Error eliminando cuenta:', error);
        alert('❌ Error al eliminar la cuenta: ' + error.message);
        return;
      }
      
      alert('✅ Cuenta eliminada');
      fetchData();
    } catch (error: any) {
      console.error('Error eliminando cuenta:', error);
      alert('❌ Error al eliminar la cuenta: ' + error.message);
    }
  };

  const totalIngresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + (m.monto_usd || 0), 0);

  const totalGastos = movimientos
    .filter(m => m.tipo === 'gasto')
    .reduce((sum, m) => sum + (m.monto_usd || 0), 0);

  const balance = totalIngresos - totalGastos;

  const getCuentaIcon = (tipo: string) => {
    switch (tipo) {
      case 'cripto': return <FaBitcoin style={{ color: '#f7931a', fontSize: '24px' }} />;
      case 'divisas': return <FaMoneyBillWave style={{ color: '#22c55e', fontSize: '24px' }} />;
      case 'bolivares': return <FaMobileAlt style={{ color: '#3b82f6', fontSize: '24px' }} />;
      default: return <FaWallet style={{ fontSize: '24px' }} />;
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
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
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
              fontSize: '16px',
            }}
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Dashboard
            </h1>
            <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: 0 }}>
              Resumen financiero actualizado
            </p>
          </div>
        </div>

        {/* Tasa del día */}
        <div style={{
          background: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: '12px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <FaExchangeAlt style={{ color: '#fbbf24', fontSize: '20px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>1 USD =</span>
            <input
              type="number"
              value={tasaInput}
              onChange={(e) => setTasaInput(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100px',
                padding: '8px 12px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '6px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Bs</span>
          </div>
          <button
            onClick={handleGuardarTasa}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FaSave /> Guardar
          </button>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {/* Ingresos */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#22c55e', fontWeight: '600' }}>Ingresos</span>
            <FaArrowUp style={{ color: '#22c55e', fontSize: '20px' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e', marginBottom: '4px' }}>
            ${totalIngresos.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
            Bs {(totalIngresos * tasaDia).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Gastos */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>Gastos</span>
            <FaArrowDown style={{ color: '#ef4444', fontSize: '20px' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444', marginBottom: '4px' }}>
            ${totalGastos.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
            Bs {(totalGastos * tasaDia).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Balance */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>Balance</span>
            <FaDollarSign style={{ color: '#3b82f6', fontSize: '20px' }} />
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: balance >= 0 ? '#3b82f6' : '#ef4444',
            marginBottom: '4px' 
          }}>
            ${balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
            Bs {(balance * tasaDia).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Tasa del Día */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', color: '#fbbf24', fontWeight: '600' }}>Tasa del Día</span>
            <FaExchangeAlt style={{ color: '#fbbf24', fontSize: '20px' }} />
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fbbf24', marginBottom: '4px' }}>
            Bs {tasaDia.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
            por 1 USD
          </div>
        </div>
      </div>

      {/* Botón Inversiones */}
      <button
        onClick={() => router.push('/finanzas/inversiones')}
        style={{
          padding: '12px 24px',
          background: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: '8px',
          color: theme.colors.text.primary,
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '32px',
        }}
      >
        <FaChartLine /> Inversiones
      </button>

      {/* Cuentas / Bolsillos */}
      <div style={{
        background: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: '12px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaWallet /> Cuentas / Bolsillos
          </h2>
          <button
            onClick={() => setShowNuevaCuenta(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FaPlus /> Nueva
          </button>
        </div>

        {/* Modal Nueva Cuenta */}
        {showNuevaCuenta && (
          <div style={{
            background: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
              Nueva Cuenta
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nuevaCuenta.nombre}
                  onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, nombre: e.target.value })}
                  placeholder="Ej: PayPal"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Tipo *
                </label>
                <select
                  value={nuevaCuenta.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value;
                    const moneda = tipo === 'bolivares' ? 'VES' : 'USD';
                    setNuevaCuenta({ ...nuevaCuenta, tipo, moneda });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="divisas">Divisas (USD)</option>
                  <option value="bolivares">Bolívares (Bs)</option>
                  <option value="cripto">Cripto (USDT)</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Descripción
                </label>
                <input
                  type="text"
                  value={nuevaCuenta.descripcion}
                  onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.secondary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNuevaCuenta(false)}
                style={{
                  padding: '10px 20px',
                  background: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '6px',
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCuenta}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaSave /> Crear Cuenta
              </button>
            </div>
          </div>
        )}

        {/* Lista de Cuentas */}
        {cuentas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme.colors.text.secondary,
          }}>
            <FaWallet style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No hay cuentas registradas</h3>
            <p style={{ fontSize: '14px' }}>Haz click en "Nueva" para crear tu primera cuenta</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            {cuentas.map(cuenta => {
              const esBolivares = cuenta.moneda === 'VES';
              const montoPrincipal = esBolivares ? cuenta.saldo_bs : cuenta.saldo_usd;
              const montoSecundario = esBolivares 
                ? (cuenta.saldo_bs / tasaDia) 
                : (cuenta.saldo_usd * tasaDia);

              return (
                <div
                  key={cuenta.id}
                  style={{
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '12px',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: 'rgba(139, 92, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {getCuentaIcon(cuenta.tipo)}
                    </div>
                    <div>
                      <h3 style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        margin: '0 0 4px 0', 
                        color: theme.colors.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {cuenta.nombre}
                      </h3>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: '700',
                        color: theme.colors.text.primary,
                      }}>
                        {esBolivares ? 'Bs ' : '$'}
                        {montoPrincipal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: theme.colors.text.muted,
                        marginTop: '4px',
                      }}>
                        {esBolivares ? 'VES' : 'USD'}
                        {tasaDia > 0 && (
                          <span style={{ marginLeft: '8px', color: theme.colors.text.secondary }}>
                            ≈ {esBolivares ? '$' : 'Bs '}{montoSecundario.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEliminarCuenta(cuenta.id, cuenta.nombre)}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    title="Eliminar cuenta"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}