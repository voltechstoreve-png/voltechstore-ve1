'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { FaGift, FaUpload, FaCheck, FaTimes, FaWhatsapp, FaTrophy, FaArrowLeft, FaUsers } from 'react-icons/fa';

interface Sorteo {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: string;
  meta_participantes: number;
  participantes_actuales: number;
  premio_tipo: string;
  premio_producto?: any;
  premio_descuento_porcentaje?: number;
  premio_texto?: string;
  fecha_sorteo?: string;
  estado: string;
  created_at: string;
}

export default function SorteosPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [sorteos, setSorteos] = useState<Sorteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);  // ✅ CORREGIDO
  const [sorteoSeleccionado, setSorteoSeleccionado] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    sorteo_id: '',
    nombre: '',
    telefono: '',
    whatsapp: '',
    foto_producto: null as string | null,
  });

  useEffect(() => {
    fetchSorteos();
  }, []);

  const fetchSorteos = async () => {
    try {
      const { data, error } = await supabase
        .from('sorteos')
        .select(`
          *,
          premio_producto:productos(nombre, imagen_url, precio_oferta)
        `)
        .eq('estado', 'activo')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSorteos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setFormData({ ...formData, foto_producto: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sorteo_id) {
      alert('⚠️ Selecciona un sorteo');
      return;
    }
    
    if (!formData.nombre || !formData.telefono) {
      alert('⚠️ Completa los campos obligatorios');
      return;
    }

    setSubmitting(true);
    
    try {
      const { data: participaciones } = await supabase
        .from('sorteos_participaciones')
        .select('ticket_numero', { count: 'exact' })
        .eq('sorteo_id', formData.sorteo_id)
        .eq('estado', 'aprobado');
      
      const ticketNumero = (participaciones?.length || 0) + 1;
      
      const { error } = await supabase.from('sorteos_participaciones').insert([{
        sorteo_id: formData.sorteo_id,
        nombre: formData.nombre,
        telefono: formData.telefono,
        whatsapp: formData.whatsapp,
        foto_producto: formData.foto_producto,
        ticket_numero: ticketNumero,
        estado: 'pendiente',
      }]);
      
      if (error) throw error;
      
      alert(`✅ ¡Participación registrada!\nTu número de ticket es: TKT-${ticketNumero}\nTe contactaremos cuando sea aprobada.`);
      setShowForm(false);  // ✅ CORREGIDO
      setFormData({
        sorteo_id: '',
        nombre: '',
        telefono: '',
        whatsapp: '',
        foto_producto: null,
      });
      fetchSorteos();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.primary }}>
        <p>Cargando sorteos...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background.primary, color: theme.colors.text.primary, padding: '32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <button
            onClick={() => router.back()}
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
            <h1 style={{
              fontSize: '36px',
              fontWeight: '700',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              🎉 Sorteos Especiales
            </h1>
            <p style={{ fontSize: '16px', color: theme.colors.text.secondary }}>
              Participa y gana premios increíbles
            </p>
          </div>
        </div>

        {/* Lista de Sorteos */}
        <div style={{ display: 'grid', gap: '32px', marginBottom: '48px' }}>
          {sorteos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: theme.colors.background.tertiary,
              borderRadius: '16px',
            }}>
              <FaGift style={{ fontSize: '48px', color: theme.colors.text.secondary, marginBottom: '16px' }} />
              <h3>No hay sorteos activos</h3>
              <p style={{ color: theme.colors.text.secondary }}>Pronto tendremos nuevos sorteos</p>
            </div>
          ) : (
            sorteos.map(sorteo => (
              <div
                key={sorteo.id}
                style={{
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '16px',
                  padding: '32px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
                      {sorteo.titulo}
                    </h2>
                    {sorteo.descripcion && (
                      <p style={{ color: theme.colors.text.secondary, marginBottom: '16px' }}>
                        {sorteo.descripcion}
                      </p>
                    )}
                    
                    {/* Premio */}
                    <div style={{
                      padding: '16px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '12px',
                      marginBottom: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <FaTrophy style={{ color: '#fbbf24', fontSize: '20px' }} />
                        <strong style={{ color: '#a855f7' }}>Premio:</strong>
                      </div>
                      {sorteo.premio_tipo === 'producto' && sorteo.premio_producto && (
                        <div>
                          <p style={{ fontWeight: '600' }}>{sorteo.premio_producto.nombre}</p>
                          {sorteo.premio_producto.precio_oferta && (
                            <p style={{ color: '#22c55e', fontSize: '18px', fontWeight: '700' }}>
                              ${sorteo.premio_producto.precio_oferta}
                            </p>
                          )}
                        </div>
                      )}
                      {sorteo.premio_tipo === 'descuento' && (
                        <p style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                          {sorteo.premio_descuento_porcentaje}% OFF
                        </p>
                      )}
                      {sorteo.premio_tipo === 'texto_libre' && sorteo.premio_texto && (
                        <p>{sorteo.premio_texto}</p>
                      )}
                    </div>

                    {/* Progreso */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <FaUsers style={{ color: '#a855f7' }} />
                        <span style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
                          Participantes: <strong>{sorteo.participantes_actuales}</strong> / {sorteo.meta_participantes}
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '10px',
                        background: theme.colors.background.secondary,
                        borderRadius: '5px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${Math.min((sorteo.participantes_actuales / sorteo.meta_participantes) * 100, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #a855f7, #ec4899)',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <p style={{ fontSize: '12px', color: theme.colors.text.secondary, marginTop: '4px' }}>
                        {Math.round((sorteo.participantes_actuales / sorteo.meta_participantes) * 100)}% completado
                      </p>
                    </div>

                    {sorteo.fecha_sorteo && (
                      <p style={{ fontSize: '14px', color: '#22c55e', fontWeight: '600' }}>
                        📅 Fecha del sorteo: {new Date(sorteo.fecha_sorteo).toLocaleDateString('es-VE')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSorteoSeleccionado(sorteo.id);
                      setShowForm(true);  // ✅ CORREGIDO
                    }}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <FaGift /> Participar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Formulario de Participación */}
        {showForm && (  // ✅ CORREGIDO
          <div style={{
            background: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>
              Participar en el Sorteo
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Tu nombre"
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="0412-1234567"
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="0412-1234567"
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

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '8px' }}>
                  Foto del Producto (opcional)
                </label>
                {formData.foto_producto ? (
                  <div style={{ position: 'relative', width: '150px', height: '150px', marginBottom: '12px' }}>
                    <img
                      src={formData.foto_producto}
                      alt="Foto"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, foto_producto: null })}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '28px',
                        height: '28px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: '100%',
                      padding: '40px 20px',
                      background: theme.colors.background.secondary,
                      border: `2px dashed ${theme.colors.border.default}`,
                      borderRadius: '8px',
                      color: theme.colors.text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <FaUpload style={{ fontSize: '24px' }} />
                    <span>Click para subir foto</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormData({ sorteo_id: '', nombre: '', telefono: '', whatsapp: '', foto_producto: null }); }}  // ✅ CORREGIDO
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
                  disabled={submitting}
                  style={{
                    padding: '12px 24px',
                    background: submitting ? '#6b7280' : '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaCheck /> {submitting ? 'Enviando...' : 'Participar'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );    
}