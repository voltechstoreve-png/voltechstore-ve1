'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  FaArrowLeft, FaGift, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes,
  FaUsers, FaCalendar, FaWhatsapp, FaImage, FaTicketAlt, FaSave
} from 'react-icons/fa';

interface Sorteo {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: string;
  meta_participantes: number;
  participantes_actuales: number; 
  premio_tipo: string;
  premio_producto_id?: string;
  premio_descuento_porcentaje?: number;
  premio_texto?: string;
  fecha_sorteo?: string;
  estado: string;  
  created_at: string;  
  updated_at?: string;
  premio_producto?: any;
}

interface Participacion {
  id: string;
  sorteo_id: string;
  nombre: string;
  telefono: string;
  whatsapp?: string;
  foto_producto?: string;
  ticket_numero?: number;
  estado: string;
  aprobado_por?: string;
  aprobado_en?: string;
  mensaje_enviado: boolean;
  created_at: string;
  cliente?: any;
}

export default function AdminSorteosPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [participaciones, setParticipaciones] = useState<Participacion[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewParticipaciones, setViewParticipaciones] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'compras',
    meta_participantes: 10,
    premio_tipo: 'producto',
    premio_producto_id: '',
    premio_descuento_porcentaje: 10,
    premio_texto: '',
    fecha_sorteo: '',
  });

  useEffect(() => {
    if (!user || (profile?.rol !== 'admin' && profile?.rol !== 'socio')) {
      router.push('/auth/login');
      return;
    }
    fetchSorteos();
    fetchParticipaciones();
    fetchProductos();
  }, [user, profile]);

  const fetchSorteos = async () => {
    try {
      const { data, error } = await supabase
        .from('sorteos')
        .select(`
          *,
          premio_producto:productos(nombre, precio_oferta)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSorteos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipaciones = async () => {
    try {
      const { data, error } = await supabase
        .from('sorteos_participaciones')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setParticipaciones(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio_oferta')
        .eq('estado', 'publicado')
        .order('nombre');
      
      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const dataToSave: any = {  // ✅ CAMBIO: Usar 'any' para evitar errores de tipo
      ...formData,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      await supabase.from('sorteos').update(dataToSave).eq('id', editingId);
    } else {
      dataToSave.created_at = new Date().toISOString();
      dataToSave.estado = 'activo';
      dataToSave.participantes_actuales = 0;
      await supabase.from('sorteos').insert([dataToSave]);
    }
    
    alert('✅ Sorteo guardado');
    setShowForm(false);
    resetForm();
    fetchSorteos();
  } catch (error: any) {
    alert('❌ Error: ' + error.message);
  }
};

  const handleAprobar = async (participacionId: string, sorteoId: string, ticketNumero: number) => {
    try {
      // Aprobar participación
      await supabase
        .from('sorteos_participaciones')
        .update({
          estado: 'aprobado',
          aprobado_por: user?.id,
          aprobado_en: new Date().toISOString(),
          ticket_numero: ticketNumero,
        })
        .eq('id', participacionId);

      // Actualizar contador de participantes
      const { data: currentSorteo } = await supabase
        .from('sorteos')
        .select('participantes_actuales')
        .eq('id', sorteoId)
        .single();

      const nuevosParticipantes = (currentSorteo?.participantes_actuales || 0) + 1;

      await supabase
        .from('sorteos')
        .update({ participantes_actuales: nuevosParticipantes })
        .eq('id', sorteoId);

      // Verificar si se alcanzó la meta
      const { data: sorteoData } = await supabase
        .from('sorteos')
        .select('meta_participantes, fecha_sorteo')
        .eq('id', sorteoId)
        .single();

      if (sorteoData && nuevosParticipantes >= sorteoData.meta_participantes && !sorteoData.fecha_sorteo) {
        // Programar sorteo automáticamente (7 días después)
        const fechaSorteo = new Date();
        fechaSorteo.setDate(fechaSorteo.getDate() + 7);
        
        await supabase
          .from('sorteos')
          .update({ fecha_sorteo: fechaSorteo.toISOString() })
          .eq('id', sorteoId);

        alert(`🎉 ¡Meta alcanzada! El sorteo se realizará el ${fechaSorteo.toLocaleDateString('es-VE')}`);
      }

      alert(`✅ Participación aprobada\nTicket: TKT-${ticketNumero}`);
      fetchSorteos();
      fetchParticipaciones();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleRechazar = async (participacionId: string) => {
    if (!confirm('¿Rechazar esta participación?')) return;
    
    try {
      await supabase
        .from('sorteos_participaciones')
        .update({ estado: 'rechazado' })
        .eq('id', participacionId);
      
      alert('🚫 Participación rechazada');
      fetchParticipaciones();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleEnviarMensaje = async (participacion: Participacion) => {
    const mensaje = `¡Hola ${participacion.nombre}! 🎉\n\nTu participación en el sorteo ha sido aprobada.\n\n🎟️ Tu número de ticket es: TKT-${participacion.ticket_numero}\n\n¡Mucha suerte! 🍀`;
    
    const numero = participacion.whatsapp || participacion.telefono;
    const whatsappUrl = `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    
    try {
      await supabase
        .from('sorteos_participaciones')
        .update({ mensaje_enviado: true })
        .eq('id', participacion.id);
      
      window.open(whatsappUrl, '_blank');
      fetchParticipaciones();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este sorteo?')) return;
    
    try {
      await supabase.from('sorteos').delete().eq('id', id);
      alert('🗑️ Sorteo eliminado');
      fetchSorteos();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'compras',
      meta_participantes: 10,
      premio_tipo: 'producto',
      premio_producto_id: '',
      premio_descuento_porcentaje: 10,
      premio_texto: '',
      fecha_sorteo: '',
    });
    setEditingId(null);
  };

  const participacionesPendientes = participaciones.filter(p => p.estado === 'pendiente');
  const participacionesAprobadas = participaciones.filter(p => p.estado === 'aprobado');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.primary }}>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background.primary, color: theme.colors.text.primary, padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
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
              <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
                Gestión de Sorteos
              </h1>
              <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: '4px 0 0 0' }}>
                Administra sorteos y participaciones
              </p>
            </div>
          </div>
          
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
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
            <FaPlus /> Nuevo Sorteo
          </button>
        </div>

        {/* Estadísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}>
          <div style={{
            padding: '20px',
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '12px', color: '#a855f7', margin: '0 0 8px 0' }}>Sorteos Activos</p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#a855f7' }}>{sorteos.filter(s => s.estado === 'activo').length}</p>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '12px', color: '#f59e0b', margin: '0 0 8px 0' }}>Participaciones Pendientes</p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#f59e0b' }}>{participacionesPendientes.length}</p>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '12px', color: '#10b981', margin: '0 0 8px 0' }}>Participaciones Aprobadas</p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#10b981' }}>{participacionesAprobadas.length}</p>
          </div>
        </div>

        {/* Participaciones Pendientes */}
        {participacionesPendientes.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
              Participaciones Pendientes de Aprobación
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {participacionesPendientes.map(part => {
                const sorteo = sorteos.find(s => s.id === part.sorteo_id);
                return (
                  <div
                    key={part.id}
                    style={{
                      background: theme.colors.background.tertiary,
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '12px',
                      padding: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                          {part.nombre}
                        </h3>
                        <p style={{ fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                          📱 {part.telefono}
                        </p>
                        {part.whatsapp && (
                          <p style={{ fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '4px' }}>
                            💬 WhatsApp: {part.whatsapp}
                          </p>
                        )}
                        {sorteo && (
                          <p style={{ fontSize: '14px', color: '#a855f7', marginBottom: '8px' }}>
                            🎁 Sorteo: {sorteo.titulo}
                          </p>
                        )}
                        <p style={{ fontSize: '12px', color: theme.colors.text.muted }}>
                          📅 {new Date(part.created_at).toLocaleString('es-VE')}
                        </p>
                        {part.foto_producto && (
                          <div style={{ marginTop: '12px' }}>
                            <img
                              src={part.foto_producto}
                              alt="Foto del producto"
                              style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleAprobar(part.id, part.sorteo_id, (participacionesAprobadas.length + 1))}
                          style={{
                            padding: '10px 16px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            color: '#10b981',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          <FaCheck /> Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(part.id)}
                          style={{
                            padding: '10px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          <FaTimes /> Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de Sorteos */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>
            Sorteos Activos
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {sorteos.filter(s => s.estado === 'activo').map(sorteo => (
              <div
                key={sorteo.id}
                style={{
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                      {sorteo.titulo}
                    </h3>
                    {sorteo.descripcion && (
                      <p style={{ color: theme.colors.text.secondary, marginBottom: '12px' }}>
                        {sorteo.descripcion}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaUsers style={{ color: '#a855f7' }} />
                        <span style={{ fontSize: '14px' }}>
                          <strong>{sorteo.participantes_actuales}</strong> / {sorteo.meta_participantes} participantes
                        </span>
                      </div>
                      {sorteo.fecha_sorteo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaCalendar style={{ color: '#22c55e' }} />
                          <span style={{ fontSize: '14px', color: '#22c55e' }}>
                            Sorteo: {new Date(sorteo.fecha_sorteo).toLocaleDateString('es-VE')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: theme.colors.background.secondary,
                      borderRadius: '4px',
                      overflow: 'hidden',
                      maxWidth: '400px',
                    }}>
                      <div style={{
                        width: `${Math.min((sorteo.participantes_actuales / sorteo.meta_participantes) * 100, 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setViewParticipaciones(sorteo.id);
                      }}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      <FaUsers /> Ver Participantes
                    </button>
                    <button
                      onClick={() => handleEliminar(sorteo.id)}
                      style={{
                        padding: '10px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                      }}
                    >
                      <FaTrash /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de Sorteo */}
        {showForm && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '32px',
          }}>
            <div style={{
              background: theme.colors.background.tertiary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
                {editingId ? '✏️ Editar Sorteo' : '➕ Nuevo Sorteo'}
              </h2>

              <form onSubmit={handleGuardar}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                      Título del Sorteo *
                    </label>
                    <input
                      type="text"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: theme.colors.background.secondary,
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                      Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: theme.colors.background.secondary,
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '14px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                        Meta de Participantes *
                      </label>
                      <input
                        type="number"
                        value={formData.meta_participantes}
                        onChange={(e) => setFormData({ ...formData, meta_participantes: parseInt(e.target.value) || 10 })}
                        required
                        min="1"
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.default}`,
                          borderRadius: '8px',
                          color: theme.colors.text.primary,
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                        Fecha del Sorteo (opcional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.fecha_sorteo}
                        onChange={(e) => setFormData({ ...formData, fecha_sorteo: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.default}`,
                          borderRadius: '8px',
                          color: theme.colors.text.primary,
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                      Tipo de Premio *
                    </label>
                    <select
                      value={formData.premio_tipo}
                      onChange={(e) => setFormData({ ...formData, premio_tipo: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: theme.colors.background.secondary,
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: '8px',
                        color: theme.colors.text.primary,
                        fontSize: '14px',
                      }}
                    >
                      <option value="producto">Producto del Inventario</option>
                      <option value="descuento">Descuento</option>
                      <option value="texto_libre">Texto Libre</option>
                    </select>
                  </div>

                  {formData.premio_tipo === 'producto' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                        Producto Premio
                      </label>
                      <select
                        value={formData.premio_producto_id}
                        onChange={(e) => setFormData({ ...formData, premio_producto_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.default}`,
                          borderRadius: '8px',
                          color: theme.colors.text.primary,
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Seleccionar producto...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} - ${p.precio_oferta || '0'}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.premio_tipo === 'descuento' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                        Porcentaje de Descuento
                      </label>
                      <input
                        type="number"
                        value={formData.premio_descuento_porcentaje}
                        onChange={(e) => setFormData({ ...formData, premio_descuento_porcentaje: parseInt(e.target.value) || 10 })}
                        min="1"
                        max="100"
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.default}`,
                          borderRadius: '8px',
                          color: theme.colors.text.primary,
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  )}

                  {formData.premio_tipo === 'texto_libre' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                        Descripción del Premio
                      </label>
                      <textarea
                        value={formData.premio_texto}
                        onChange={(e) => setFormData({ ...formData, premio_texto: e.target.value })}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.default}`,
                          borderRadius: '8px',
                          color: theme.colors.text.primary,
                          fontSize: '14px',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    style={{
                      padding: '12px 24px',
                      background: theme.colors.background.secondary,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
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
                    <FaSave /> Guardar Sorteo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Participantes */}
        {viewParticipaciones && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '32px',
          }}>
            <div style={{
              background: theme.colors.background.tertiary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                  Participantes del Sorteo
                </h2>
                <button
                  onClick={() => setViewParticipaciones(null)}
                  style={{
                    width: '36px',
                    height: '36px',
                    background: theme.colors.background.secondary,
                    border: 'none',
                    borderRadius: '8px',
                    color: theme.colors.text.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {participaciones
                  .filter(p => p.sorteo_id === viewParticipaciones)
                  .map(part => {
                    const ticketNum = part.ticket_numero || '-';
                    return (
                      <div
                        key={part.id}
                        style={{
                          background: theme.colors.background.secondary,
                          border: `1px solid ${theme.colors.border.default}`,
                          borderRadius: '8px',
                          padding: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <strong style={{ fontSize: '16px' }}>{part.nombre}</strong>
                              <span style={{
                                padding: '4px 10px',
                                background: part.estado === 'aprobado' ? 'rgba(16, 185, 129, 0.2)' :
                                  part.estado === 'rechazado' ? 'rgba(239, 68, 68, 0.2)' :
                                    'rgba(245, 158, 11, 0.2)',
                                color: part.estado === 'aprobado' ? '#10b981' :
                                  part.estado === 'rechazado' ? '#ef4444' : '#f59e0b',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                              }}>
                                {part.estado}
                              </span>
                              {part.ticket_numero && (
                                <span style={{
                                  padding: '4px 10px',
                                  background: 'rgba(139, 92, 246, 0.2)',
                                  color: '#a78bfa',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                }}>
                                  <FaTicketAlt style={{ marginRight: '4px' }} />
                                  TKT-{ticketNum}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: '4px 0' }}>
                              📱 {part.telefono}
                            </p>
                            {part.whatsapp && (
                              <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: '4px 0' }}>
                                💬 {part.whatsapp}
                              </p>
                            )}
                            <p style={{ fontSize: '12px', color: theme.colors.text.muted, marginTop: '8px' }}>
                              📅 {new Date(part.created_at).toLocaleString('es-VE')}
                            </p>
                            {part.mensaje_enviado && (
                              <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                                ✅ Mensaje enviado
                              </p>
                            )}
                          </div>

                          {part.estado === 'aprobado' && !part.mensaje_enviado && (
                            <button
                              onClick={() => handleEnviarMensaje(part)}
                              style={{
                                padding: '8px 16px',
                                background: '#25d366',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '13px',
                                fontWeight: '600',
                              }}
                            >
                              <FaWhatsapp /> Enviar Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}