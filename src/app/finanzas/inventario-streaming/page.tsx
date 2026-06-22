'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft,
  FaPlus,
  FaFileImport,
  FaFileExport,
  FaTrash,
  FaEdit,
  FaBox,
  FaSave,
  FaCalendarAlt
} from 'react-icons/fa';

interface InventarioItem {
  id: string;
  fecha: string;
  proveedor: string;
  plataforma: string;
  dias_disponibles: number;
  costo_unitario_usd: number;
  total_usd: number;
  tasa_aplicada: number;
  total_bs: number;
  fecha_vencimiento?: string;
  precio_venta_sugerido?: number;
  notas?: string;
  created_at: string;
}

interface PlataformaExistente {
  id: string;
  plataforma: string;
}

export default function InventarioStreamingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tasaBCV, setTasaBCV] = useState(477.14);
  const [plataformasExistentes, setPlataformasExistentes] = useState<PlataformaExistente[]>([]);
  const [showNuevaPlataforma, setShowNuevaPlataforma] = useState(false);
  const [nuevaPlataformaNombre, setNuevaPlataformaNombre] = useState('');
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    plataforma: '',
    dias_disponibles: 30,
    costo_unitario_usd: 0,
    tasa_personalizada: 0,
    fecha_vencimiento: '',
    precio_venta_sugerido: 0,
    notas: '',
  });

  useEffect(() => {
    fetchInventario();
    fetchTasa();
    fetchPlataformasExistentes();
  }, []);

  const fetchPlataformasExistentes = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario_streaming')
        .select('id, plataforma')
        .order('plataforma');
      if (error) throw error;
      
      const plataformasUnicas = Array.from(
        new Set(data?.map(item => item.plataforma) || [])
      ).map((plataforma, index) => ({
        id: `plat-${index}`,
        plataforma
      }));
      
      setPlataformasExistentes(plataformasUnicas);
    } catch (error) {
      console.error('Error fetching plataformas:', error);
    }
  };

  const fetchInventario = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('inventario_streaming')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInventario(data || []);
    } catch (error) {
      console.error('❌ Error en fetchInventario:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasa = async () => {
    const { data } = await supabase
      .from('tasa_dia')
      .select('tasa_bs')
      .eq('fecha', new Date().toISOString().split('T')[0])
      .single();
    if (data) setTasaBCV(data.tasa_bs);
  };

  // ✅ CALCULAR DÍAS DESDE FECHA VENCIMIENTO
  const calcularDiasDisponibles = (fechaInicio: string, fechaVencimiento: string) => {
    if (!fechaInicio || !fechaVencimiento) return 0;
    const inicio = new Date(fechaInicio);
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // ✅ CALCULAR FECHA VENCIMIENTO DESDE DÍAS
  const calcularFechaVencimiento = (fechaInicio: string, diasDisponibles: number) => {
    if (!fechaInicio || diasDisponibles <= 0) return '';
    const inicio = new Date(fechaInicio);
    inicio.setDate(inicio.getDate() + diasDisponibles);
    return inicio.toISOString().split('T')[0];
  };

  // ✅ CAMBIO EN DÍAS → ACTUALIZA FECHA VENCIMIENTO
  const handleDiasChange = (dias: number) => {
    const nuevaFechaVenc = calcularFechaVencimiento(formData.fecha, dias);
    setFormData({
      ...formData,
      dias_disponibles: dias,
      fecha_vencimiento: nuevaFechaVenc,
    });
  };

  // ✅ CAMBIO EN FECHA VENCIMIENTO → ACTUALIZA DÍAS
  const handleFechaVencimientoChange = (fecha: string) => {
    const dias = calcularDiasDisponibles(formData.fecha, fecha);
    setFormData({
      ...formData,
      fecha_vencimiento: fecha,
      dias_disponibles: dias,
    });
  };

  // ✅ CAMBIO EN FECHA INICIO → RECALCULA FECHA VENCIMIENTO (si hay días)
  const handleFechaChange = (fecha: string) => {
    let nuevaFechaVenc = formData.fecha_vencimiento;
    if (formData.dias_disponibles > 0) {
      nuevaFechaVenc = calcularFechaVencimiento(fecha, formData.dias_disponibles);
    }
    
    setFormData({
      ...formData,
      fecha: fecha,
      fecha_vencimiento: nuevaFechaVenc,
    });
  };

  const calcularTotales = () => {
    const total_usd = formData.costo_unitario_usd * (formData.dias_disponibles / 30);
    const tasa = formData.tasa_personalizada || tasaBCV;
    const total_bs = total_usd * tasa;
    return { total_usd, total_bs, tasa };
  };

  const handleGuardar = async () => {
    if (!formData.proveedor || !formData.plataforma) {
      alert('️ Completa los campos obligatorios');
      return;
    }

    try {
      const { total_usd, total_bs, tasa } = calcularTotales();

      const dataToSave = {
        fecha: formData.fecha,
        proveedor: formData.proveedor,
        plataforma: formData.plataforma,
        dias_disponibles: formData.dias_disponibles,
        costo_unitario_usd: formData.costo_unitario_usd,
        total_usd,
        tasa_aplicada: tasa,
        total_bs,
        fecha_vencimiento: formData.fecha_vencimiento || null,
        precio_venta_sugerido: formData.precio_venta_sugerido || null,
        notas: formData.notas || null,
        creado_por: user?.id,
        supervisor_id: profile?.rol === 'socio' 
          ? (profile as any).supervisor_id || user?.id 
          : user?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        await supabase
          .from('inventario_streaming')
          .update(dataToSave)
          .eq('id', editingId);
      } else {
        await supabase
          .from('inventario_streaming')
          .insert([dataToSave]);
      }

      alert('✅ Registro guardado exitosamente');
      setShowForm(false);
      resetForm();
      await fetchInventario();
      await fetchPlataformasExistentes();
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('❌ Error: ' + (error.message || 'Error al guardar'));
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      proveedor: '',
      plataforma: '',
      dias_disponibles: 30,
      costo_unitario_usd: 0,
      tasa_personalizada: 0,
      fecha_vencimiento: '',
      precio_venta_sugerido: 0,
      notas: '',
    });
    setEditingId(null);
  };

  const handleEditar = (item: InventarioItem) => {
    setEditingId(item.id);
    setFormData({
      fecha: item.fecha,
      proveedor: item.proveedor,
      plataforma: item.plataforma,
      dias_disponibles: item.dias_disponibles || 30,
      costo_unitario_usd: item.costo_unitario_usd,
      tasa_personalizada: item.tasa_aplicada,
      fecha_vencimiento: item.fecha_vencimiento || '',
      precio_venta_sugerido: item.precio_venta_sugerido || 0,
      notas: item.notas || '',
    });
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return;
    await supabase.from('inventario_streaming').delete().eq('id', id);
    fetchInventario();
    fetchPlataformasExistentes();
  };

  const agregarNuevaPlataforma = async () => {
    if (!nuevaPlataformaNombre) {
      alert('️ Ingresa el nombre de la plataforma');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('inventario_streaming')
        .insert([{
          plataforma: nuevaPlataformaNombre,
          proveedor: 'Sin proveedor',
          dias_disponibles: 30,
          costo_unitario_usd: 0,
          total_usd: 0,
          tasa_aplicada: 0,
          total_bs: 0,
          creado_por: user?.id,
          updated_at: new Date().toISOString(),
        }]);
      
      if (error) throw error;
      
      await fetchInventario();
      await fetchPlataformasExistentes();
      
      setFormData({
        ...formData,
        plataforma: nuevaPlataformaNombre,
      });
      
      setNuevaPlataformaNombre('');
      setShowNuevaPlataforma(false);
      alert('✅ Plataforma agregada y seleccionada');
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ Error al agregar plataforma: ' + error.message);
    }
  };

  const { total_usd, total_bs, tasa } = calcularTotales();

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
        <p>Cargando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      color: '#ffffff',
      padding: '32px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/finanzas/ventas-streaming')}
              style={{
                width: '40px', height: '40px',
                background: '#1a1f3a',
                border: '1px solid #2a2f4a',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#ffffff' }}>
                Inventario de Plataformas
              </h1>
              <p style={{ color: '#8b92a8', fontSize: '14px', margin: '4px 0 0 0' }}>
                Compras a proveedores • {inventario.length} registros
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              padding: '10px 20px',
              background: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <FaFileImport /> Importar
            </button>
            <button style={{
              padding: '10px 20px',
              background: '#1a1f3a',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <FaFileExport /> Exportar
            </button>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
              style={{
                padding: '10px 20px',
                background: showForm ? '#ef4444' : '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {showForm ? <FaPlus /> : <FaPlus />} 
              {showForm ? 'Cancelar' : 'Nuevo Registro'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/finanzas/ventas-streaming')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              color: '#8b92a8',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Ventas Streaming
          </button>
          <button
            style={{
              padding: '10px 20px',
              background: '#4f46e5',
              border: '1px solid #4f46e5',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Inventario Plataformas
          </button>
          <button
            onClick={() => router.push('/admin/streaming-hub')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              color: '#8b92a8',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Streaming Hub
          </button>
        </div>

        {/* Formulario Inline */}
        {showForm && (
          <div style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 24px 0', color: '#ffffff' }}>
              <FaPlus style={{ marginRight: '8px', color: '#10b981' }} />
              {editingId ? 'Editar Compra' : 'Nueva Compra a Proveedor'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Fecha *</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Proveedor *</label>
                <input
                  type="text"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  placeholder="Nombre del proveedor"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Plataforma *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={formData.plataforma}
                    onChange={(e) => {
                      if (e.target.value === '__nueva__') {
                        setShowNuevaPlataforma(true);
                      } else {
                        setFormData({ ...formData, plataforma: e.target.value });
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: '#1a1f3a',
                      border: '1px solid #2a2f4a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {plataformasExistentes.map(p => (
                      <option key={p.id} value={p.plataforma}>
                        {p.plataforma}
                      </option>
                    ))}
                    <option value="__nueva__">+ Agregar nueva...</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Días Disponibles *</label>
                <input
                  type="number"
                  value={formData.dias_disponibles}
                  onChange={(e) => handleDiasChange(parseInt(e.target.value) || 0)}
                  placeholder="30"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Costo Unitario USD *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costo_unitario_usd || ''}
                  onChange={(e) => setFormData({ ...formData, costo_unitario_usd: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Precio Venta Sugerido USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_venta_sugerido || ''}
                  onChange={(e) => setFormData({ ...formData, precio_venta_sugerido: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>
                  Tasa Personalizada <span style={{ color: '#f59e0b' }}>(BCV: {tasaBCV})</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tasa_personalizada || ''}
                  onChange={(e) => setFormData({ ...formData, tasa_personalizada: parseFloat(e.target.value) || 0 })}
                  placeholder="Dejar vacío para usar BCV"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Fecha Vencimiento</label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => handleFechaVencimientoChange(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box', resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Modal Nueva Plataforma */}
            {showNuevaPlataforma && (
              <div style={{
                background: '#111827',
                border: '1px solid #2a2f4a',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
                  Agregar Nueva Plataforma
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={nuevaPlataformaNombre}
                    onChange={(e) => setNuevaPlataformaNombre(e.target.value)}
                    placeholder="Nombre de la plataforma"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: '#1a1f3a',
                      border: '1px solid #2a2f4a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={agregarNuevaPlataforma}
                    style={{
                      padding: '10px 16px',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <FaSave /> Guardar
                  </button>
                  <button
                    onClick={() => { setShowNuevaPlataforma(false); setNuevaPlataformaNombre(''); }}
                    style={{
                      padding: '10px 16px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Resumen */}
            <div style={{
              background: '#1a1f3a',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>Total USD:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>${total_usd.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>Tasa Aplicada:</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>Bs {tasa.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #2a2f4a' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>Total Bs:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#3b82f6' }}>Bs {total_bs.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{
                  padding: '12px 24px',
                  background: '#1a1f3a',
                  border: '1px solid #2a2f4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaSave /> {editingId ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Inventario */}
        {inventario.length === 0 ? (
          <div style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <FaBox style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#ffffff' }}>No hay registros de inventario</h3>
            <p style={{ color: '#8b92a8' }}>
              Haz click en "Nuevo Registro" para agregar tu primera compra
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {inventario.map(item => (
              <div
                key={item.id}
                style={{
                  background: '#111827',
                  border: '1px solid #1f2937',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                  <div style={{
                    width: '50px', height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: 'white',
                    fontWeight: '700',
                  }}>
                    <FaBox />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#ffffff' }}>
                        {item.plataforma}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        {item.proveedor}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        background: item.dias_disponibles <= 7 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: item.dias_disponibles <= 7 ? '#ef4444' : '#10b981',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FaCalendarAlt /> {item.dias_disponibles} días
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#8b92a8' }}>
                      <div>
                        <div style={{ marginBottom: '4px' }}>
                          📅 Fecha: {new Date(item.fecha).toLocaleDateString('es-VE')}
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          💵 Costo: ${item.costo_unitario_usd.toFixed(2)}
                        </div>
                        <div>
                          💱 Tasa: Bs {item.tasa_aplicada}
                        </div>
                      </div>
                      <div>
                        {item.fecha_vencimiento && (
                          <div style={{ marginBottom: '4px' }}>
                            ⏰ Vence: {new Date(item.fecha_vencimiento).toLocaleDateString('es-VE')}
                          </div>
                        )}
                        {item.precio_venta_sugerido && (
                          <div style={{ marginBottom: '4px' }}>
                            💰 Precio sugerido: ${item.precio_venta_sugerido.toFixed(2)}
                          </div>
                        )}
                        {item.notas && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            📝 {item.notas}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                      ${item.total_usd.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                      Bs {item.total_bs.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditar(item)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: 'none', borderRadius: '6px',
                        color: '#3b82f6', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', fontWeight: '600',
                      }}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleEliminar(item.id)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none', borderRadius: '6px',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', fontWeight: '600',
                      }}
                      title="Eliminar"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}