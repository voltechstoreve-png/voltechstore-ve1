'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaUsers, 
  FaUserPlus, 
  FaEdit, 
  FaArrowLeft,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaTimes,
  FaFileImport,
  FaFileExport,
  FaUserTimes,
  FaUserCheck,
  FaIdCard,
  FaMapMarkerAlt,
  FaTrash,
  FaExclamationTriangle,
  FaCrown,
  FaUserShield
} from 'react-icons/fa';

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  tipo: 'nuevo' | 'frecuente' | 'vip';
  origen: 'manual' | 'registro_web' | 'importado';
  notas?: string;
  creado_por?: string;
  supervisor_id?: string;
  supervisor_nombre?: string;
  estado: 'activo' | 'inactivo';
  created_at: string;
}

export default function ClientesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [duplicado, setDuplicado] = useState<{cliente: string} | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    whatsapp: '',
    email: '',
    direccion: '',
    tipo: 'nuevo' as 'nuevo' | 'frecuente' | 'vip',
    notas: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      let query = supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      // Si es socio, solo ver sus clientes
      if (profile?.rol === 'socio') {
        query = query.eq('supervisor_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      alert('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verificar duplicado SOLO por WhatsApp
  const checkDuplicado = async (whatsapp: string, excludeId?: string) => {
    if (!whatsapp || whatsapp.length < 10) return null;

    let query = supabase
      .from('clientes')
      .select('nombre, apellido, whatsapp')
      .eq('whatsapp', whatsapp);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data } = await query;
    
    if (data && data.length > 0) {
      const cliente = data[0];
      return {
        cliente: `${cliente.nombre} ${cliente.apellido}`,
      };
    }
    
    return null;
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.apellido) {
      alert('⚠️ Nombre y apellido son obligatorios');
      return;
    }

    if (!formData.whatsapp) {
      alert('⚠️ WhatsApp es obligatorio');
      return;
    }

    // Verificar duplicado por WhatsApp
    const dup = await checkDuplicado(formData.whatsapp, editingId || undefined);
    if (dup) {
      if (!confirm(`⚠️ Ya existe un cliente con este WhatsApp:\n\n${dup.cliente}\n\n¿Deseas continuar de todas formas?`)) {
        return;
      }
    }

    try {
      // Obtener nombre del supervisor
      let supervisorNombre = '';
      if (profile?.rol === 'admin') {
        supervisorNombre = `${profile.nombre} ${profile.apellido}`;
      } else {
        // Si es empleado, buscar el supervisor
        const { data: supervisorData } = await supabase
          .from('profiles')
          .select('nombre, apellido')
          .eq('id', (profile as any)?.supervisor_id || user?.id)
          .single();
        
        if (supervisorData) {
          supervisorNombre = `${supervisorData.nombre} ${supervisorData.apellido}`;
        }
      }

      const clienteData = {
        ...formData,
        supervisor_id: profile?.rol === 'admin' ? user?.id : (profile as any)?.supervisor_id || user?.id,
        supervisor_nombre: supervisorNombre,
        creado_por: user?.id,
        estado: 'activo',
      };

      if (editingId) {
        // Actualizar
        const { error } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingId);

        if (error) throw error;
        alert('✅ Cliente actualizado');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('clientes')
          .insert([clienteData]);

        if (error) throw error;
        alert('✅ Cliente creado exitosamente');
      }

      setShowForm(false);
      setEditingId(null);
      setDuplicado(null);
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        whatsapp: '',
        email: '',
        direccion: '',
        tipo: 'nuevo',
        notas: '',
      });
      fetchClientes();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      alert('❌ Error al guardar');
    }
  };

  const handleEdit = async (cliente: Cliente) => {
    setEditingId(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      cedula: cliente.cedula || '',
      whatsapp: cliente.whatsapp || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      tipo: cliente.tipo,
      notas: cliente.notas || '',
    });
    setShowForm(true);
    
    // Verificar si el cliente actual tiene duplicado (no debería, pero por si acaso)
    if (cliente.whatsapp) {
      const dup = await checkDuplicado(cliente.whatsapp, cliente.id);
      setDuplicado(dup);
    }
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de ELIMINAR permanentemente a ${nombre}? Esta acción no se puede deshacer.`)) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setClientes(clientes.filter(c => c.id !== id));
      alert('✅ Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('❌ Error al eliminar el cliente');
    }
  };

  const handleToggleEstado = async (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`¿${nuevoEstado === 'activo' ? 'Activar' : 'Desactivar'} este cliente?`)) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      fetchClientes();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Nombre', 'Apellido', 'Cédula', 'WhatsApp', 'Email', 'Dirección', 'Tipo', 'Dueño', 'Notas'].join(','),
      ...clientes.map(c => [
        c.nombre, c.apellido, c.cedula || '', c.whatsapp || '', 
        c.email || '', c.direccion || '', c.tipo, c.supervisor_nombre || '', c.notas || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `clientes_voltechstore_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const dataLines = lines.slice(1);
      const nuevosClientes = dataLines.map(line => {
        const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
        return {
          nombre: cols[0] || '',
          apellido: cols[1] || '',
          cedula: cols[2] || '',
          whatsapp: cols[3] || '',
          email: cols[4] || '',
          direccion: cols[5] || '',
          tipo: (cols[6] || 'nuevo') as 'nuevo' | 'frecuente' | 'vip',
          supervisor_nombre: profile?.rol === 'admin' ? `${profile.nombre} ${profile.apellido}` : '',
          notas: cols[8] || '',
          supervisor_id: user?.id,
          creado_por: user?.id,
          origen: 'importado',
          estado: 'activo',
        };
      }).filter(c => c.nombre && c.apellido);

      if (nuevosClientes.length === 0) {
        alert('No se encontraron clientes válidos');
        return;
      }

      if (!confirm(`¿Importar ${nuevosClientes.length} clientes?`)) return;

      try {
        const { error } = await supabase
          .from('clientes')
          .insert(nuevosClientes);

        if (error) throw error;
        alert(`✅ ${nuevosClientes.length} clientes importados`);
        fetchClientes();
      } catch (error) {
        console.error('Error importando:', error);
        alert('❌ Error al importar');
      }
    };
    reader.readAsText(file);
  };

  const filteredClientes = clientes.filter(c => {
    const matchBusqueda = 
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.whatsapp?.includes(busqueda) ||
      c.cedula?.includes(busqueda) ||
      c.supervisor_nombre?.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchTipo = !filtroTipo || c.tipo === filtroTipo;
    const matchEstado = !filtroEstado || c.estado === filtroEstado;

    return matchBusqueda && matchTipo && matchEstado;
  });

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'vip': return '#f59e0b';
      case 'frecuente': return '#3b82f6';
      case 'nuevo': return '#22c55e';
      default: return '#6b7280';
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
        <p>Cargando clientes...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.background.primary,
      color: theme.colors.text.primary,
    }}>
      {/* Header */}
      <header style={{
        background: theme.colors.background.secondary,
        borderBottom: `1px solid ${theme.colors.border.default}`,
        padding: '20px 32px',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/panel')}
              style={{
                width: '40px', height: '40px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                Gestión de Clientes
              </h1>
              <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: '4px 0 0 0' }}>
                {profile?.rol === 'admin' ? 'Todos los clientes' : 'Mis clientes'} ({clientes.length})
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <FaFileImport /> Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              style={{ display: 'none' }}
            />

            <button
              onClick={handleExport}
              style={{
                padding: '10px 20px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <FaFileExport /> Exportar
            </button>

            <button
              onClick={() => { setShowForm(true); setEditingId(null); setDuplicado(null); }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <FaUserPlus /> Nuevo Cliente
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* Formulario */}
        {showForm && (
          <div style={{
            background: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
              {editingId ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </h3>
            
            {/* Alerta de duplicado */}
            {duplicado && (
              <div style={{
                padding: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                marginBottom: '20px',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FaExclamationTriangle />
                <span>⚠️ Ya existe un cliente con este WhatsApp: <strong>{duplicado.cliente}</strong></span>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  <FaIdCard style={{ marginRight: '6px' }} /> Cédula (opcional)
                </label>
                <input
                  type="text"
                  value={formData.cedula}
                  onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  <FaPhone style={{ marginRight: '6px' }} /> WhatsApp *
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={async (e) => {
                    const whatsapp = e.target.value;
                    setFormData({ ...formData, whatsapp });
                    
                    // Verificar duplicado en tiempo real solo por WhatsApp
                    if (whatsapp.length >= 10) {
                      const dup = await checkDuplicado(whatsapp, editingId || undefined);
                      setDuplicado(dup);
                    } else {
                      setDuplicado(null);
                    }
                  }}
                  placeholder="04121234567"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: duplicado ? '2px solid #f59e0b' : `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  <FaEnvelope style={{ marginRight: '6px' }} /> Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Tipo de Cliente
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                >
                  <option value="nuevo">Nuevo</option>
                  <option value="frecuente">Frecuente</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  <FaMapMarkerAlt style={{ marginRight: '6px' }} /> Dirección
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px', color: theme.colors.text.primary,
                    fontSize: '14px', boxSizing: 'border-box', resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setDuplicado(null); }}
                style={{
                  padding: '10px 20px',
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '6px', color: theme.colors.text.primary,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  border: 'none', borderRadius: '6px', color: 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <FaSave /> {editingId ? 'Actualizar' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{
          background: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: '12px', padding: '20px', marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: theme.colors.text.secondary,
              }} />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido, WhatsApp o dueño..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 40px',
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '8px', color: theme.colors.text.primary,
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{
                padding: '12px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px', color: theme.colors.text.primary,
                fontSize: '14px', cursor: 'pointer',
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="nuevo">Nuevo</option>
              <option value="frecuente">Frecuente</option>
              <option value="vip">VIP</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: '12px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px', color: theme.colors.text.primary,
                fontSize: '14px', cursor: 'pointer',
              }}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Lista */}
        {filteredClientes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '12px',
          }}>
            <FaUsers style={{ fontSize: '48px', color: theme.colors.text.muted, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No hay clientes</h3>
            <p style={{ color: theme.colors.text.secondary }}>
              Agrega tu primer cliente o importa desde CSV
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {filteredClientes.map(cliente => (
              <div
                key={cliente.id}
                style={{
                  background: theme.colors.background.secondary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '12px', padding: '20px',
                  opacity: cliente.estado === 'inactivo' ? 0.6 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    <div style={{
                      width: '50px', height: '50px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${getTipoColor(cliente.tipo)}, ${getTipoColor(cliente.tipo)}dd)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', color: 'white', fontWeight: '700',
                    }}>
                      {cliente.nombre.charAt(0)}{cliente.apellido.charAt(0)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>
                          {cliente.nombre} {cliente.apellido}
                        </h3>
                        <span style={{
                          padding: '4px 10px',
                          background: `${getTipoColor(cliente.tipo)}20`,
                          color: getTipoColor(cliente.tipo),
                          borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                          textTransform: 'uppercase',
                        }}>
                          {cliente.tipo}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          background: cliente.estado === 'activo' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: cliente.estado === 'activo' ? '#22c55e' : '#ef4444',
                          borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        }}>
                          {cliente.estado}
                        </span>
                        {/* ✅ Badge del dueño */}
                        {cliente.supervisor_nombre && (
                          <span style={{
                            padding: '4px 10px',
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#8b5cf6',
                            borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}>
                            {profile?.rol === 'admin' ? <FaCrown /> : <FaUserShield />}
                            {cliente.supervisor_nombre}
                          </span>
                        )}
                        {cliente.origen === 'importado' && (
                          <span style={{
                            padding: '4px 10px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                          }}>
                            Importado
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: theme.colors.text.secondary, flexWrap: 'wrap' }}>
                        {cliente.whatsapp && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaPhone /> {cliente.whatsapp}
                          </span>
                        )}
                        {cliente.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaEnvelope /> {cliente.email}
                          </span>
                        )}
                        {cliente.cedula && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaIdCard /> {cliente.cedula}
                          </span>
                        )}
                      </div>
                      {cliente.notas && (
                        <p style={{ fontSize: '12px', color: theme.colors.text.muted, marginTop: '8px', margin: '8px 0 0 0' }}>
                          📝 {cliente.notas}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleToggleEstado(cliente.id, cliente.estado)}
                      style={{
                        padding: '8px 12px',
                        background: cliente.estado === 'activo' 
                          ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                          : 'linear-gradient(135deg, #22c55e, #16a34a)',
                        border: 'none', borderRadius: '6px', color: 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px',
                      }}
                    >
                      {cliente.estado === 'activo' ? <FaUserTimes /> : <FaUserCheck />}
                      {cliente.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleEdit(cliente)}
                      style={{
                        padding: '8px 12px',
                        background: theme.colors.background.tertiary,
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: '6px', color: theme.colors.text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id, cliente.nombre)}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        border: 'none', borderRadius: '6px', color: 'white',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px',
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}