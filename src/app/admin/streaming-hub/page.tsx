'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft,
  FaPlus,
  FaCopy,
  FaTrash,
  FaEdit,
  FaTv,
  FaSave,
  FaEye,
  FaEyeSlash,
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaUser
} from 'react-icons/fa';

interface CuentaStreaming {
  id: string;
  plataforma: string;
  nombre_perfil?: string;
  correo: string;
  contrasena: string;
  pin?: string;
  vendedor_id?: string;
  vendedor_nombre?: string;
  cliente_id?: string;
  cliente_nombre?: string;
  estado: 'disponible' | 'asignada' | 'vencida';
  fecha_vencimiento?: string;
  observaciones?: string;
  ultima_actualizacion: string;
  creado_por?: string;
  created_at?: string;
}

interface Vendedor {
  id: string;
  nombre: string;
  apellido: string;
  rol?: string;
  supervisor_id?: string;
}

interface PlataformaExistente {
  id: string;
  plataforma: string;
}

interface HistorialCambio {
  id: string;
  cuenta_id: string;
  campo: string;
  valor_anterior: string;
  valor_nuevo: string;
  changed_by: string;
  changed_by_nombre: string;
  changed_at: string;
}

export default function StreamingHubPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  
  const [cuentas, setCuentas] = useState<CuentaStreaming[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [plataformasExistentes, setPlataformasExistentes] = useState<PlataformaExistente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mostrarPass, setMostrarPass] = useState<{[key: string]: boolean}>({});
  const [historialOpen, setHistorialOpen] = useState<{[key: string]: boolean}>({});
  const [historial, setHistorial] = useState<{[key: string]: HistorialCambio[]}>({});
  const [showNuevaPlataforma, setShowNuevaPlataforma] = useState(false);
  const [nuevaPlataformaNombre, setNuevaPlataformaNombre] = useState('');
  
  const [formData, setFormData] = useState({
    plataforma: '',
    nombre_perfil: '',
    correo: '',
    contrasena: '',
    pin: '',
    observaciones: '',
    vendedor_id: '',
    fecha_vencimiento: '',
  });

  useEffect(() => {
    fetchCuentas();
    fetchVendedores();
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

  const fetchVendedores = async () => {
    try {
      console.log('👤 User role:', profile?.rol);
      console.log('👤 User ID:', user?.id);
      
      const { data: allData, error } = await supabase
        .from('profiles')
        .select('id, nombre, apellido, rol, supervisor_id')
        .eq('estado', 'activo');
      
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      
      console.log('📋 Todos los usuarios:', allData);
      
      let filteredData = allData || [];
      
      // Admin ve admin y socio
      if (profile?.rol === 'admin') {
        filteredData = filteredData.filter(p => p.rol === 'admin' || p.rol === 'socio');
      } 
      // Socio ve solo sus empleados
      else if (profile?.rol === 'socio') {
        filteredData = filteredData.filter(p => p.supervisor_id === user?.id && p.rol === 'empleado');
      } 
      // Empleado solo se ve a sí mismo
      else if (profile?.rol === 'empleado') {
        filteredData = filteredData.filter(p => p.id === user?.id);
      }
      
      console.log('✅ Vendedores filtrados:', filteredData);
      setVendedores(filteredData);
    } catch (error) {
      console.error('Error fetching vendedores:', error);
    }
  };

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('streaming_hub')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('📋 Cuentas cargadas:', data);
      setCuentas(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorial = async (cuentaId: string) => {
    try {
      console.log('📥 Fetching historial para:', cuentaId);
      
      const { data, error } = await supabase
        .from('streaming_hub_historial')
        .select('*')
        .eq('cuenta_id', cuentaId)
        .order('changed_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching historial:', error);
        return;
      }
      
      console.log(' Historial:', data);
      
      if (data) {
        setHistorial(prev => ({ ...prev, [cuentaId]: data }));
      }
    } catch (error) {
      console.error('Error fetching historial:', error);
    }
  };

  const toggleHistorial = async (cuentaId: string) => {
    const nuevoEstado = !historialOpen[cuentaId];
    setHistorialOpen(prev => ({ ...prev, [cuentaId]: nuevoEstado }));
    
    // Si se está abriendo y no hay historial cargado, fetchear
    if (nuevoEstado && !historial[cuentaId]) {
      await fetchHistorial(cuentaId);
    }
  };

  const guardarHistorial = async (cuentaId: string, campo: string, valorAnterior: string, valorNuevo: string) => {
    try {
      const nombreUsuario = profile ? `${profile.nombre} ${profile.apellido}` : 'Desconocido';
      
      await supabase.from('streaming_hub_historial').insert([{
        cuenta_id: cuentaId,
        campo,
        valor_anterior: valorAnterior || '',
        valor_nuevo: valorNuevo || '',
        changed_by: user?.id,
        changed_by_nombre: nombreUsuario,
      }]);
    } catch (error) {
      console.error('Error guardando historial:', error);
    }
  };

  const handleGuardar = async () => {
    if (!formData.plataforma || !formData.correo || !formData.contrasena) {
      alert('️ Completa los campos obligatorios');
      return;
    }

    try {
      const vendedor = vendedores.find(v => v.id === formData.vendedor_id);
      
      const dataToSave = {
        ...formData,
        vendedor_nombre: vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : '',
        estado: 'disponible',
        ultima_actualizacion: new Date().toISOString(),
      };

      if (editingId) {
        // Guardar historial de cambios
        const cuentaAnterior = cuentas.find(c => c.id === editingId);
        if (cuentaAnterior) {
          const camposAComparar = ['plataforma', 'nombre_perfil', 'correo', 'contrasena', 'pin', 'observaciones', 'vendedor_id', 'fecha_vencimiento'];
          
          for (const campo of camposAComparar) {
            const valorAnterior = cuentaAnterior[campo as keyof CuentaStreaming] || '';
            const valorNuevo = formData[campo as keyof typeof formData] || '';
            
            if (String(valorAnterior) !== String(valorNuevo)) {
              await guardarHistorial(editingId, campo, String(valorAnterior), String(valorNuevo));
            }
          }
        }

        await supabase.from('streaming_hub').update(dataToSave).eq('id', editingId);
      } else {
        await supabase.from('streaming_hub').insert([dataToSave]);
      }

      alert('✅ Cuenta guardada exitosamente');
      setShowForm(false);
      resetForm();
      fetchCuentas();
    } catch (error: any) {
      console.error('Error:', error);
      alert('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      plataforma: '',
      nombre_perfil: '',
      correo: '',
      contrasena: '',
      pin: '',
      observaciones: '',
      vendedor_id: '',
      fecha_vencimiento: '',
    });
    setEditingId(null);
  };

  const handleEditar = (cuenta: CuentaStreaming) => {
    setEditingId(cuenta.id);
    setFormData({
      plataforma: cuenta.plataforma,
      nombre_perfil: cuenta.nombre_perfil || '',
      correo: cuenta.correo,
      contrasena: cuenta.contrasena,
      pin: cuenta.pin || '',
      observaciones: cuenta.observaciones || '',
      vendedor_id: cuenta.vendedor_id || '',
      fecha_vencimiento: cuenta.fecha_vencimiento || '',
    });
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta cuenta?')) return;
    await supabase.from('streaming_hub').delete().eq('id', id);
    fetchCuentas();
  };

  const copiarID = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('✅ ID copiado al portapapeles');
  };

  const copiarCredenciales = (cuenta: CuentaStreaming) => {
    const texto = ` *${cuenta.plataforma.toUpperCase()}${cuenta.nombre_perfil ? ` - ${cuenta.nombre_perfil}` : ''}*\n\n *Correo:* ${cuenta.correo}\n🔑 *Contraseña:* ${cuenta.contrasena}${cuenta.pin ? `\n🔐 *PIN:* ${cuenta.pin}` : ''}\n\n✅ ¡Disfruta tu servicio!`;
    navigator.clipboard.writeText(texto);
    alert('✅ Credenciales copiadas al portapapeles');
  };

  const toggleMostrarPass = (id: string) => {
    setMostrarPass(prev => ({ ...prev, [id]: !prev[id] }));
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

  const formatearCampo = (campo: string) => {
    const nombres: {[key: string]: string} = {
      plataforma: 'Plataforma',
      nombre_perfil: 'Nombre Perfil',
      correo: 'Correo',
      contrasena: 'Contraseña',
      pin: 'PIN',
      observaciones: 'Observaciones',
      vendedor_id: 'Vendedor',
      fecha_vencimiento: 'Fecha Vencimiento',
    };
    return nombres[campo] || campo;
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
              onClick={() => router.push('/panel')}
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
                Streaming Hub
              </h1>
              <p style={{ color: '#8b92a8', fontSize: '14px', margin: '4px 0 0 0' }}>
                Cuentas compartidas • {cuentas.length} cuentas
              </p>
            </div>
          </div>

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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {showForm ? <FaPlus /> : <FaPlus />} 
            {showForm ? 'Cancelar' : 'Nueva Cuenta'}
          </button>
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
            onClick={() => router.push('/finanzas/inventario-streaming')}
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
            Inventario Plataformas
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
            <FaTv style={{ marginRight: '8px' }} />
            Streaming Hub
          </button>
        </div>

        {/* Formulario */}
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
              {editingId ? 'Editar Cuenta' : 'Nueva Cuenta de Streaming'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
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
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Nombre Perfil</label>
                <input
                  type="text"
                  value={formData.nombre_perfil}
                  onChange={(e) => setFormData({ ...formData, nombre_perfil: e.target.value })}
                  placeholder="Perfil 1, Principal, etc."
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
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Correo *</label>
                <input
                  type="email"
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                  placeholder="correo@ejemplo.com"
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
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Contraseña *</label>
                <input
                  type="text"
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>PIN</label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Vendedor *</label>
                <select
                  value={formData.vendedor_id}
                  onChange={(e) => setFormData({ ...formData, vendedor_id: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                >
                  <option value="">Seleccionar vendedor...</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.nombre} {v.apellido} {v.rol && `(${v.rol})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
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
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
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
                <FaSave /> {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Cuentas */}
        {cuentas.length === 0 ? (
          <div style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <FaTv style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#ffffff' }}>No hay cuentas en el hub</h3>
            <p style={{ color: '#8b92a8' }}>
              Haz click en "Nueva Cuenta" para agregar tu primera cuenta
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {cuentas.map((cuenta) => (
              <div key={cuenta.id}>
                <div
                  style={{
                    background: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        color: 'white',
                      }}>
                        <FaTv />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: '#ffffff' }}>
                          {cuenta.plataforma} {cuenta.nombre_perfil && `- ${cuenta.nombre_perfil}`}
                        </h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span 
                            style={{
                              padding: '4px 10px',
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#a78bfa',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onClick={() => copiarID(cuenta.id)}
                            title="Click para copiar"
                          >
                            ID: {cuenta.id.substring(0, 8)}... <FaCopy style={{ fontSize: '10px' }} />
                          </span>
                          <span style={{
                            padding: '4px 10px',
                            background: cuenta.estado === 'disponible' ? 'rgba(16, 185, 129, 0.2)' : 
                                       cuenta.estado === 'asignada' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: cuenta.estado === 'disponible' ? '#10b981' : 
                                   cuenta.estado === 'asignada' ? '#3b82f6' : '#ef4444',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                          }}>
                            {cuenta.estado}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleHistorial(cuenta.id)}
                        style={{
                          padding: '8px 12px',
                          background: historialOpen[cuenta.id] ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.1)',
                          border: 'none', borderRadius: '6px',
                          color: '#f59e0b', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: '600',
                        }}
                        title="Ver historial"
                      >
                        <FaHistory /> {historialOpen[cuenta.id] ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                      <button
                        onClick={() => copiarCredenciales(cuenta)}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: 'none', borderRadius: '6px',
                          color: '#3b82f6', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: '600',
                        }}
                      >
                        <FaCopy /> Copiar
                      </button>
                      <button
                        onClick={() => handleEditar(cuenta)}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: 'none', borderRadius: '6px',
                          color: '#f59e0b', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: '600',
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleEliminar(cuenta.id)}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none', borderRadius: '6px',
                          color: '#ef4444', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: '600',
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#8b92a8' }}>📧 Correo:</span>
                        <span style={{ marginLeft: '8px', color: '#ffffff' }}>{cuenta.correo}</span>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#8b92a8' }}>🔑 Contraseña:</span>
                        <span style={{ marginLeft: '8px', color: '#ffffff', fontFamily: 'monospace' }}>
                          {mostrarPass[cuenta.id] ? cuenta.contrasena : '••••••••'}
                        </span>
                        <button
                          onClick={() => toggleMostrarPass(cuenta.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8b92a8',
                            cursor: 'pointer',
                            marginLeft: '8px',
                            fontSize: '12px',
                          }}
                        >
                          {mostrarPass[cuenta.id] ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {cuenta.pin && (
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#8b92a8' }}> PIN:</span>
                          <span style={{ marginLeft: '8px', color: '#ffffff' }}>{cuenta.pin}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: '#8b92a8' }}>👤 Vendedor:</span>
                        <span style={{ marginLeft: '8px', color: '#ffffff' }}>{cuenta.vendedor_nombre || 'Sin asignar'}</span>
                      </div>
                      {cuenta.observaciones && (
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ color: '#8b92a8' }}>📝 Observaciones:</span>
                          <span style={{ marginLeft: '8px', color: '#ffffff' }}>{cuenta.observaciones}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Historial de Cambios */}
                {historialOpen[cuenta.id] && (
                  <div style={{
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    padding: '16px',
                    marginTop: '-12px',
                    marginBottom: '12px',
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaHistory />
                      Historial de Cambios
                      {historial[cuenta.id] && historial[cuenta.id].length > 0 && (
                        <span style={{ fontSize: '11px', color: '#8b92a8', fontWeight: '400' }}>
                          ({historial[cuenta.id].length} cambio{historial[cuenta.id].length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </h4>
                    
                    {!historial[cuenta.id] ? (
                      <p style={{ color: '#8b92a8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                        Cargando historial...
                      </p>
                    ) : historial[cuenta.id].length === 0 ? (
                      <p style={{ color: '#8b92a8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                        No hay cambios registrados para esta cuenta
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {historial[cuenta.id].map((cambio) => (
                          <div
                            key={cambio.id}
                            style={{
                              background: '#111827',
                              border: '1px solid #1f2937',
                              borderRadius: '6px',
                              padding: '12px',
                              fontSize: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{ 
                                color: '#a78bfa', 
                                fontWeight: '600',
                                background: 'rgba(167, 139, 250, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}>
                                {formatearCampo(cambio.campo)}
                              </span>
                              <span style={{ color: '#6b7280', fontSize: '11px' }}>
                                🕐 {new Date(cambio.changed_at).toLocaleString('es-VE')}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                              <div>
                                <span style={{ color: '#ef4444', fontSize: '11px' }}>❌ Antes:</span>
                                <div style={{ color: '#ffffff', marginTop: '2px', wordBreak: 'break-all' }}>
                                  {cambio.valor_anterior || <span style={{ color: '#6b7280' }}>Vacío</span>}
                                </div>
                              </div>
                              <div>
                                <span style={{ color: '#10b981', fontSize: '11px' }}>✅ Ahora:</span>
                                <div style={{ color: '#ffffff', marginTop: '2px', wordBreak: 'break-all' }}>
                                  {cambio.valor_nuevo || <span style={{ color: '#6b7280' }}>Vacío</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ 
                              borderTop: '1px solid #2a2f4a', 
                              paddingTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              color: '#8b92a8',
                            }}>
                              <FaUser style={{ fontSize: '10px' }} />
                              <span>Modificado por: <strong style={{ color: '#ffffff' }}>{cambio.changed_by_nombre || 'Desconocido'}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}