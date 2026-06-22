'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaUsers, 
  FaUserCheck, 
  FaUserTimes, 
  FaEdit, 
  FaTrash, 
  FaArrowLeft,
  FaSearch,
  FaKey,
  FaEnvelope,
  FaPhone,
  FaUserCircle,
  FaCheck,
  FaTimes,
  FaSave,
  FaPlus,
  FaCalendarAlt,
  FaMotorcycle,
  FaUserTie,
  FaCrown,
  FaUserClock,
  FaUser,
  FaBell
} from 'react-icons/fa';

interface EquipoMember {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  email_personal?: string;
  whatsapp?: string;
  rol: 'admin' | 'socio' | 'empleado';
  estado: 'activo' | 'pendiente' | 'inactivo';
  cargo?: 'ejecutivo_ventas' | 'delivery' | 'admin' | 'socio';
  supervisor_id?: string | null;
  fecha_ingreso?: string;
  pin?: string;
  foto_url?: string;
  created_at: string;
}

export default function EquipoPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [miembros, setMiembros] = useState<EquipoMember[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<EquipoMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<EquipoMember>>({});
  const [showNewMember, setShowNewMember] = useState(false);
  const [newMember, setNewMember] = useState({
    nombre: '',
    apellido: '',
    email_personal: '',
    whatsapp: '',
    cargo: 'ejecutivo_ventas' as 'ejecutivo_ventas' | 'delivery',
    fecha_ingreso: new Date().toISOString().split('T')[0],
  });
  
  const [aprobarRol, setAprobarRol] = useState<{[key: string]: 'socio' | 'empleado'}>({});

  useEffect(() => {
    fetchMiembros();
    if (profile?.rol === 'admin') {
      fetchSolicitudesPendientes();
    }
  }, [profile?.rol]);

  const fetchMiembros = async () => {
    try {
      if (profile?.rol === 'admin' || profile?.rol === 'socio') {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`supervisor_id.eq.${user?.id},id.eq.${user?.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setMiembros(data || []);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (error) throw error;
        setMiembros(data ? [data] : []);
      }
    } catch (error) {
      console.error('Error fetching equipo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSolicitudesPendientes = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('estado', 'pendiente')
        .is('supervisor_id', null)
        .neq('rol', 'admin')
        .neq('rol', 'socio')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitudesPendientes(data || []);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
    }
  };

  const handleAprobar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ estado: 'activo' })
        .eq('id', id);

      if (error) throw error;

      setMiembros(miembros.map(m => 
        m.id === id ? { ...m, estado: 'activo' } : m
      ));
    } catch (error) {
      console.error('Error aprobando usuario:', error);
    }
  };

  const handleRechazar = async (id: string) => {
    if (!confirm('¿Estás seguro de rechazar a este usuario?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ estado: 'inactivo' })
        .eq('id', id);

      if (error) throw error;

      setMiembros(miembros.map(m => 
        m.id === id ? { ...m, estado: 'inactivo' } : m
      ));
    } catch (error) {
      console.error('Error rechazando usuario:', error);
    }
  };

  const handleAprobarSolicitud = async (id: string) => {
    const rolSeleccionado = aprobarRol[id] || 'empleado';
    
    if (!confirm(`¿Aprobar como ${rolSeleccionado === 'socio' ? 'SOCIO' : 'EJECUTIVO EN VENTAS'}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          estado: 'activo',
          rol: rolSeleccionado,
          supervisor_id: user?.id,
          cargo: rolSeleccionado === 'socio' ? 'socio' : 'ejecutivo_ventas',
          fecha_ingreso: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (error) throw error;

      setSolicitudesPendientes(solicitudesPendientes.filter(s => s.id !== id));
      fetchMiembros();
      
      alert(`✅ Usuario aprobado como ${rolSeleccionado === 'socio' ? 'SOCIO' : 'EJECUTIVO EN VENTAS'}`);
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      alert('❌ Error al aprobar la solicitud');
    }
  };

  const handleRechazarSolicitud = async (id: string) => {
    if (!confirm('¿Estás seguro de rechazar esta solicitud? El usuario será eliminado.')) {
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) {
        console.warn('No se pudo eliminar de auth (puede requerir permisos):', authError);
      }

      setSolicitudesPendientes(solicitudesPendientes.filter(s => s.id !== id));
      alert('✅ Solicitud rechazada');
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      alert('❌ Error al rechazar la solicitud');
    }
  };

  // ✅ NUEVO: Activar/Desactivar usuario (soft delete)
  const handleToggleEstado = async (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    
    if (!confirm(`¿Estás seguro de ${accion} a este usuario?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;

      setMiembros(miembros.map(m => 
        m.id === id ? { ...m, estado: nuevoEstado } : m
      ));
      
      alert(`✅ Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('❌ Error al cambiar el estado');
    }
  };

  // ✅ NUEVO: Cambiar rol
  const handleCambiarRol = async (id: string, nuevoRol: 'socio' | 'empleado') => {
    if (!confirm(`¿Cambiar rol a ${nuevoRol === 'socio' ? 'SOCIO' : 'EJECUTIVO EN VENTAS'}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          rol: nuevoRol,
          cargo: nuevoRol === 'socio' ? 'socio' : 'ejecutivo_ventas'
        })
        .eq('id', id);

      if (error) throw error;

      setMiembros(miembros.map(m => 
        m.id === id ? { ...m, rol: nuevoRol, cargo: nuevoRol === 'socio' ? 'socio' : 'ejecutivo_ventas' } : m
      ));
      
      alert('✅ Rol actualizado correctamente');
    } catch (error) {
      console.error('Error cambiando rol:', error);
      alert('❌ Error al cambiar el rol');
    }
  };

  const handleCrearMiembro = async () => {
    if (!user) return;

    if (!newMember.nombre || !newMember.apellido) {
      alert('⚠️ Nombre y apellido son obligatorios');
      return;
    }

    try {
      const tempPassword = Math.random().toString(36).slice(-8);
      const tempPIN = Math.floor(1000 + Math.random() * 9000).toString();
      
      const inicial = newMember.nombre.charAt(0).toLowerCase();
      const apellido = newMember.apellido.toLowerCase().replace(/\s/g, '');
      const emailCorporativo = `${inicial}${apellido}@voltechstore.ve`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailCorporativo,
        password: tempPassword,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            nombre: newMember.nombre,
            apellido: newMember.apellido,
            email: emailCorporativo,
            email_personal: newMember.email_personal,
            whatsapp: newMember.whatsapp,
            cargo: newMember.cargo,
            supervisor_id: user.id,
            fecha_ingreso: newMember.fecha_ingreso,
            rol: 'empleado',
            estado: 'activo',
            pin: tempPIN,
            created_at: new Date().toISOString(),
          }]);

        if (profileError) throw profileError;

        alert(`✅ Miembro creado exitosamente\n\nEmail: ${emailCorporativo}\nContraseña temporal: ${tempPassword}\nPIN: ${tempPIN}`);
      }

      setShowNewMember(false);
      setNewMember({
        nombre: '',
        apellido: '',
        email_personal: '',
        whatsapp: '',
        cargo: 'ejecutivo_ventas',
        fecha_ingreso: new Date().toISOString().split('T')[0],
      });
      fetchMiembros();
    } catch (error) {
      console.error('Error creando miembro:', error);
      alert('Error al crear el miembro');
    }
  };

  const handleGuardarEdicion = async () => {
    if (!editingId || !editData) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nombre: editData.nombre,
          apellido: editData.apellido,
          email_personal: editData.email_personal,
          whatsapp: editData.whatsapp,
          cargo: editData.cargo,
          fecha_ingreso: editData.fecha_ingreso,
        })
        .eq('id', editingId);

      if (error) throw error;

      setMiembros(miembros.map(m => 
        m.id === editingId ? { ...m, ...editData } as EquipoMember : m
      ));
      
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Error guardando edición:', error);
    }
  };

  const handleCambiarPIN = async (id: string) => {
    const nuevoPIN = prompt('Nuevo PIN (4 dígitos):');
    if (nuevoPIN && nuevoPIN.length === 4 && /^\d+$/.test(nuevoPIN)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ pin: nuevoPIN })
          .eq('id', id);

        if (error) throw error;

        setMiembros(miembros.map(m => 
          m.id === id ? { ...m, pin: nuevoPIN } : m
        ));
        
        alert('✅ PIN actualizado correctamente');
      } catch (error) {
        console.error('Error cambiando PIN:', error);
      }
    } else {
      alert('⚠️ El PIN debe tener exactamente 4 dígitos');
    }
  };

  const filteredMiembros = miembros.filter(m => {
    const matchBusqueda = 
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.email.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchCargo = !filtroCargo || m.cargo === filtroCargo;
    const matchEstado = !filtroEstado || m.estado === filtroEstado;

    return matchBusqueda && matchCargo && matchEstado;
  });

  const jefe = filteredMiembros.find(m => m.id === user?.id);
  const empleados = filteredMiembros.filter(m => m.id !== user?.id);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return '#22c55e';
      case 'pendiente': return '#f59e0b';
      case 'inactivo': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCargoIcon = (cargo?: string) => {
    switch (cargo) {
      case 'ejecutivo_ventas': return <FaUserTie />;
      case 'delivery': return <FaMotorcycle />;
      case 'admin': return <FaCrown />;
      case 'socio': return <FaCrown />;
      default: return <FaUserCircle />;
    }
  };

  const getCargoColor = (cargo?: string) => {
    switch (cargo) {
      case 'ejecutivo_ventas': return '#3b82f6';
      case 'delivery': return '#f59e0b';
      case 'admin': return '#8b5cf6';
      case 'socio': return '#a855f7';
      default: return '#6b7280';
    }
  };

  const getCargoLabel = (cargo?: string) => {
    switch (cargo) {
      case 'ejecutivo_ventas': return 'Ejecutivo en Ventas';
      case 'delivery': return 'Delivery';
      case 'admin': return 'Administrador';
      case 'socio': return 'Socio';
      default: return cargo || 'Sin cargo';
    }
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin': return 'Administrador';
      case 'socio': return 'Socio';
      case 'empleado': return 'Empleado';
      default: return rol;
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.colors.background.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.text.primary,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Cargando equipo...</p>
        </div>
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
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                Gestión de Equipo
              </h1>
              <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: '4px 0 0 0' }}>
                {profile?.rol === 'admin' ? 'Administración de Socios y Empleados' : 
                  profile?.rol === 'socio' ? 'Mis ejecutivos y delivery' : 
                  'Mi información'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {solicitudesPendientes.length > 0 && (
              <div style={{
                padding: '8px 16px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                color: '#f59e0b',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FaBell />
                {solicitudesPendientes.length} pendiente{solicitudesPendientes.length !== 1 ? 's' : ''}
              </div>
            )}

            {(profile?.rol === 'admin' || profile?.rol === 'socio') && (
              <button
                onClick={() => setShowNewMember(!showNewMember)}
                style={{
                  padding: '12px 24px',
                  background: showNewMember 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
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
                {showNewMember ? <FaTimes /> : <FaPlus />} 
                {showNewMember ? 'Cancelar' : 'Nuevo Miembro'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        {/* SOLICITUDES PENDIENTES (Solo Admin) */}
        {solicitudesPendientes.length > 0 && profile?.rol === 'admin' && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '700', 
              marginBottom: '16px',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <FaUserClock /> Solicitudes de Registro Pendientes ({solicitudesPendientes.length})
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              {solicitudesPendientes.map(solicitud => (
                <div
                  key={solicitud.id}
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: 'white',
                        flexShrink: 0,
                      }}>
                        <FaUser />
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0' }}>
                          {solicitud.nombre} {solicitud.apellido}
                        </h3>
                        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: theme.colors.text.secondary, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaEnvelope /> {solicitud.email}
                          </span>
                          {solicitud.email_personal && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FaEnvelope /> {solicitud.email_personal}
                            </span>
                          )}
                          {solicitud.whatsapp && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FaPhone /> {solicitud.whatsapp}
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaCalendarAlt /> {new Date(solicitud.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                      <select
                        value={aprobarRol[solicitud.id] || 'empleado'}
                        onChange={(e) => setAprobarRol({...aprobarRol, [solicitud.id]: e.target.value as 'socio' | 'empleado'})}
                        style={{
                          padding: '10px 16px',
                          background: theme.colors.background.tertiary,
                          border: `1px solid ${theme.colors.border.default}`,
                          borderRadius: '6px',
                          color: theme.colors.text.primary,
                          fontSize: '14px',
                          cursor: 'pointer',
                          minWidth: '180px',
                        }}
                      >
                        <option value="empleado">Ejecutivo en Ventas</option>
                        <option value="socio">Socio</option>
                      </select>

                      <button
                        onClick={() => handleAprobarSolicitud(solicitud.id)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '600',
                        }}
                      >
                        <FaCheck /> Aprobar
                      </button>
                      <button
                        onClick={() => handleRechazarSolicitud(solicitud.id)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '600',
                        }}
                      >
                        <FaTimes /> Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario Nuevo Miembro */}
        {showNewMember && (profile?.rol === 'admin' || profile?.rol === 'socio') && (
          <div style={{
            background: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
              Nuevo Miembro del Equipo
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newMember.nombre}
                  onChange={(e) => setNewMember({ ...newMember, nombre: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.tertiary,
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
                  Apellido *
                </label>
                <input
                  type="text"
                  value={newMember.apellido}
                  onChange={(e) => setNewMember({ ...newMember, apellido: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.tertiary,
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
                  Email Personal (opcional)
                </label>
                <input
                  type="email"
                  value={newMember.email_personal}
                  onChange={(e) => setNewMember({ ...newMember, email_personal: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.tertiary,
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
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={newMember.whatsapp}
                  onChange={(e) => setNewMember({ ...newMember, whatsapp: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.tertiary,
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
                  Cargo
                </label>
                <select
                  value={newMember.cargo}
                  onChange={(e) => setNewMember({ ...newMember, cargo: e.target.value as 'ejecutivo_ventas' | 'delivery' })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px',
                    color: theme.colors.text.primary,
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="ejecutivo_ventas">Ejecutivo en Ventas</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                  Fecha de Ingreso
                </label>
                <input
                  type="date"
                  value={newMember.fecha_ingreso}
                  onChange={(e) => setNewMember({ ...newMember, fecha_ingreso: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: theme.colors.background.tertiary,
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
                onClick={() => setShowNewMember(false)}
                style={{
                  padding: '10px 20px',
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '6px',
                  color: theme.colors.text.primary,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearMiembro}
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
                <FaCheck /> Crear Miembro
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={{
          background: theme.colors.background.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <FaSearch style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: theme.colors.text.secondary,
              }} />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '8px',
                  color: theme.colors.text.primary,
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <select
              value={filtroCargo}
              onChange={(e) => setFiltroCargo(e.target.value)}
              style={{
                padding: '12px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="">Todos los cargos</option>
              <option value="ejecutivo_ventas">Ejecutivo en Ventas</option>
              <option value="delivery">Delivery</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: '12px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="pendiente">Pendiente</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Sección: Jefe (Admin o Socio) */}
        {jefe && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: theme.colors.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <FaCrown style={{ color: '#fbbf24' }} />
              {profile?.rol === 'admin' ? 'Administrador' : 'Socio'}
            </h2>
            
            <div style={{
              background: `linear-gradient(135deg, ${getCargoColor(jefe.rol)}15, ${getCargoColor(jefe.rol)}05)`,
              border: `2px solid ${getCargoColor(jefe.rol)}40`,
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getCargoColor(jefe.rol)}, ${getCargoColor(jefe.rol)}dd)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    color: 'white',
                    boxShadow: `0 4px 12px ${getCargoColor(jefe.rol)}40`,
                  }}>
                    <FaCrown />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                        {jefe.nombre} {jefe.apellido}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        background: `${getCargoColor(jefe.rol)}20`,
                        color: getCargoColor(jefe.rol),
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        {getRolLabel(jefe.rol)}
                      </span>
                      <span style={{
                        padding: '4px 12px',
                        background: `${getEstadoColor(jefe.estado)}20`,
                        color: getEstadoColor(jefe.estado),
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}>
                        {jefe.estado}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: theme.colors.text.secondary, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaEnvelope /> {jefe.email}
                      </span>
                      {jefe.email_personal && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaEnvelope /> {jefe.email_personal}
                        </span>
                      )}
                      {jefe.whatsapp && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaPhone /> {jefe.whatsapp}
                        </span>
                      )}
                      {jefe.fecha_ingreso && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaCalendarAlt /> Ingreso: {new Date(jefe.fecha_ingreso).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      setEditingId(jefe.id);
                      setEditData(jefe);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: theme.colors.background.tertiary,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      cursor: 'pointer',
                    }}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleCambiarPIN(jefe.id)}
                    style={{
                      padding: '8px 12px',
                      background: theme.colors.background.tertiary,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      cursor: 'pointer',
                    }}
                    title="Cambiar PIN"
                  >
                    <FaKey />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección: Empleados (Solo Admin y Socios) */}
        {(profile?.rol === 'admin' || profile?.rol === 'socio') && (
          <div>
            <h2 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: theme.colors.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <FaUsers />
              {profile?.rol === 'admin' ? 'Socios y Ejecutivos' : 'Mi Equipo'} ({empleados.length})
            </h2>

            {empleados.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: theme.colors.background.secondary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '12px',
              }}>
                <FaUsers style={{ fontSize: '48px', color: theme.colors.text.muted, marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
                  {profile?.rol === 'admin' ? 'No hay socios ni ejecutivos aún' : 'No tienes empleados aún'}
                </h3>
                <p style={{ color: theme.colors.text.secondary }}>
                  Haz click en "Nuevo Miembro" para agregar ejecutivos o delivery
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {empleados.map(miembro => (
                  <div
                    key={miembro.id}
                    style={{
                      background: theme.colors.background.secondary,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.3s',
                      opacity: miembro.estado === 'inactivo' ? 0.6 : 1,
                    }}
                  >
                    {editingId === miembro.id ? (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Nombre</label>
                            <input
                              type="text"
                              value={editData.nombre || ''}
                              onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: theme.colors.background.tertiary,
                                border: `1px solid ${theme.colors.border.default}`,
                                borderRadius: '6px',
                                color: theme.colors.text.primary,
                                fontSize: '14px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Apellido</label>
                            <input
                              type="text"
                              value={editData.apellido || ''}
                              onChange={(e) => setEditData({ ...editData, apellido: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: theme.colors.background.tertiary,
                                border: `1px solid ${theme.colors.border.default}`,
                                borderRadius: '6px',
                                color: theme.colors.text.primary,
                                fontSize: '14px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Email Personal</label>
                            <input
                              type="email"
                              value={editData.email_personal || ''}
                              onChange={(e) => setEditData({ ...editData, email_personal: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: theme.colors.background.tertiary,
                                border: `1px solid ${theme.colors.border.default}`,
                                borderRadius: '6px',
                                color: theme.colors.text.primary,
                                fontSize: '14px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>WhatsApp</label>
                            <input
                              type="tel"
                              value={editData.whatsapp || ''}
                              onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: theme.colors.background.tertiary,
                                border: `1px solid ${theme.colors.border.default}`,
                                borderRadius: '6px',
                                color: theme.colors.text.primary,
                                fontSize: '14px',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Cargo</label>
                            <select
                              value={editData.cargo || 'ejecutivo_ventas'}
                              onChange={(e) => setEditData({ ...editData, cargo: e.target.value as 'ejecutivo_ventas' | 'delivery' })}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: theme.colors.background.tertiary,
                                border: `1px solid ${theme.colors.border.default}`,
                                borderRadius: '6px',
                                color: theme.colors.text.primary,
                                fontSize: '14px',
                                boxSizing: 'border-box',
                              }}
                            >
                              <option value="ejecutivo_ventas">Ejecutivo en Ventas</option>
                              <option value="delivery">Delivery</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '4px' }}>Fecha de Ingreso</label>
                            <input
                              type="date"
                              value={editData.fecha_ingreso || ''}
                              onChange={(e) => setEditData({ ...editData, fecha_ingreso: e.target.value })}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: theme.colors.background.tertiary,
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
                            onClick={() => { setEditingId(null); setEditData({}); }}
                            style={{
                              padding: '10px 20px',
                              background: theme.colors.background.tertiary,
                              border: `1px solid ${theme.colors.border.default}`,
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              cursor: 'pointer',
                            }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleGuardarEdicion}
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
                            <FaSave /> Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${getCargoColor(miembro.cargo)}, ${getCargoColor(miembro.cargo)}dd)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            color: 'white',
                          }}>
                            {getCargoIcon(miembro.cargo)}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                                {miembro.nombre} {miembro.apellido}
                              </h3>
                              <span style={{
                                padding: '4px 12px',
                                background: `${getCargoColor(miembro.cargo)}20`,
                                color: getCargoColor(miembro.cargo),
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}>
                                {getCargoIcon(miembro.cargo)} {getCargoLabel(miembro.cargo)}
                              </span>
                              <span style={{
                                padding: '4px 12px',
                                background: `${getEstadoColor(miembro.estado)}20`,
                                color: getEstadoColor(miembro.estado),
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                              }}>
                                {miembro.estado}
                              </span>
                              {miembro.rol === 'socio' && (
                                <span style={{
                                  padding: '4px 12px',
                                  background: 'rgba(168, 85, 247, 0.2)',
                                  color: '#a855f7',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                }}>
                                  SOCIO
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: theme.colors.text.secondary, flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaEnvelope /> {miembro.email}
                              </span>
                              {miembro.email_personal && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FaEnvelope /> {miembro.email_personal}
                                </span>
                              )}
                              {miembro.whatsapp && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FaPhone /> {miembro.whatsapp}
                                </span>
                              )}
                              {miembro.fecha_ingreso && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FaCalendarAlt /> Ingreso: {new Date(miembro.fecha_ingreso).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {/* ✅ Botón Activar/Desactivar */}
                          <button
                            onClick={() => handleToggleEstado(miembro.id, miembro.estado)}
                            style={{
                              padding: '8px 12px',
                              background: miembro.estado === 'activo' 
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #22c55e, #16a34a)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                            title={miembro.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          >
                            {miembro.estado === 'activo' ? <FaUserTimes /> : <FaUserCheck />}
                            {miembro.estado === 'activo' ? 'Desactivar' : 'Activar'}
                          </button>

                          {/* ✅ Selector de Rol */}
                          <select
                            value={miembro.rol}
                            onChange={(e) => handleCambiarRol(miembro.id, e.target.value as 'socio' | 'empleado')}
                            style={{
                              padding: '8px 12px',
                              background: theme.colors.background.tertiary,
                              border: `1px solid ${theme.colors.border.default}`,
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '600',
                            }}
                            title="Cambiar Rol"
                          >
                            <option value="empleado">Ejecutivo</option>
                            <option value="socio">Socio</option>
                          </select>

                          {/* Botón Editar */}
                          <button
                            onClick={() => {
                              setEditingId(miembro.id);
                              setEditData(miembro);
                            }}
                            style={{
                              padding: '8px 12px',
                              background: theme.colors.background.tertiary,
                              border: `1px solid ${theme.colors.border.default}`,
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              cursor: 'pointer',
                            }}
                            title="Editar"
                          >
                            <FaEdit />
                          </button>

                          {/* Botón Cambiar PIN */}
                          <button
                            onClick={() => handleCambiarPIN(miembro.id)}
                            style={{
                              padding: '8px 12px',
                              background: theme.colors.background.tertiary,
                              border: `1px solid ${theme.colors.border.default}`,
                              borderRadius: '6px',
                              color: theme.colors.text.primary,
                              cursor: 'pointer',
                            }}
                            title="Cambiar PIN"
                          >
                            <FaKey />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}