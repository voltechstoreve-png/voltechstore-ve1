'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft, FaStar, FaCheck, FaTimes, FaEye, FaTrash,
  FaFilter, FaSearch
} from 'react-icons/fa';

interface Opinion {
  id: string;
  producto_id?: string;
  producto_nombre?: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_email?: string;
  es_anonimo: boolean;
  calificacion: number;
  comentario: string;
  imagenes: string[];
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  es_publica: boolean;
  created_at: string;
}

export default function AdminOpinionesPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [viewingImages, setViewingImages] = useState<string[]>([]);

  useEffect(() => {
    fetchOpiniones();
  }, []);

  const fetchOpiniones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('opiniones')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOpiniones(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const aprobarOpinion = async (id: string) => {
    try {
      await supabase
        .from('opiniones')
        .update({ 
          estado: 'aprobada',
          es_publica: true 
        })
        .eq('id', id);
      
      alert('✅ Opinión aprobada y publicada');
      fetchOpiniones();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const rechazarOpinion = async (id: string) => {
    if (!confirm('¿Rechazar esta opinión?')) return;
    
    try {
      await supabase
        .from('opiniones')
        .update({ 
          estado: 'rechazada',
          es_publica: false 
        })
        .eq('id', id);
      
      alert('🚫 Opinión rechazada');
      fetchOpiniones();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const eliminarOpinion = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente esta opinión?')) return;
    
    try {
      await supabase
        .from('opiniones')
        .delete()
        .eq('id', id);
      
      alert('🗑️ Opinión eliminada');
      fetchOpiniones();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const verImagenes = (imagenes: string[]) => {
    setViewingImages(imagenes);
  };

  const opinionesFiltradas = opiniones.filter(op => {
    const matchEstado = filtroEstado === 'todas' || op.estado === filtroEstado;
    const matchBusqueda = 
      op.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (op.producto_nombre?.toLowerCase().includes(busqueda.toLowerCase())) ||
      op.comentario.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const estadisticas = {
    total: opiniones.length,
    pendientes: opiniones.filter(o => o.estado === 'pendiente').length,
    aprobadas: opiniones.filter(o => o.estado === 'aprobada').length,
    rechazadas: opiniones.filter(o => o.estado === 'rechazada').length,
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#ffffff', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando opiniones...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#ffffff', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/panel')}
              style={{
                width: '40px',
                height: '40px',
                background: '#1a1f3a',
                border: '1px solid #2a2f4a',
                borderRadius: '8px',
                color: '#ffffff',
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
                Gestión de Opiniones
              </h1>
              <p style={{ color: '#8b92a8', fontSize: '14px', margin: '4px 0 0 0' }}>
                Aprueba o rechaza las opiniones de los clientes
              </p>
            </div>
          </div>
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
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '12px', color: '#8b92a8', margin: '0 0 8px 0' }}>Total Opiniones</p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{estadisticas.total}</p>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '12px', color: '#f59e0b', margin: '0 0 8px 0' }}>Pendientes</p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#f59e0b' }}>{estadisticas.pendientes}</p>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '12px', color: '#10b981', margin: '0 0 8px 0' }}>Aprobadas</p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#10b981' }}>{estadisticas.aprobadas}</p>
          </div>
          <div style={{
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '12px', color: '#ef4444', margin: '0 0 8px 0' }}>Rechazadas</p>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#ef4444' }}>{estadisticas.rechazadas}</p>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '250px' }}>
            <FaSearch style={{ color: '#8b92a8' }} />
            <input
              type="text"
              placeholder="Buscar por cliente, producto o comentario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaFilter style={{ color: '#8b92a8' }} />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: '8px 16px',
                background: '#1a1f3a',
                border: '1px solid #2a2f4a',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
              }}
            >
              <option value="todas">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>
        </div>

        {/* Lista de Opiniones */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {opinionesFiltradas.length === 0 ? (
            <div style={{
              background: '#111827',
              border: '1px solid #1f2937',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
            }}>
              <FaStar style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#ffffff' }}>No hay opiniones</h3>
              <p style={{ color: '#8b92a8' }}>
                {busqueda ? 'No se encontraron resultados' : 'Aún no hay opiniones para mostrar'}
              </p>
            </div>
          ) : (
            opinionesFiltradas.map(opinion => (
              <div
                key={opinion.id}
                style={{
                  background: '#111827',
                  border: `1px solid ${
                    opinion.estado === 'pendiente' ? 'rgba(245, 158, 11, 0.3)' :
                    opinion.estado === 'aprobada' ? 'rgba(16, 185, 129, 0.3)' :
                    'rgba(239, 68, 68, 0.3)'
                  }`,
                  borderRadius: '12px',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {/* Estrellas */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <FaStar
                            key={star}
                            style={{
                              color: star <= opinion.calificacion ? '#fbbf24' : '#374151',
                              fontSize: '16px',
                            }}
                          />
                        ))}
                      </div>
                      
                      {/* Estado */}
                      <span style={{
                        padding: '4px 12px',
                        background: opinion.estado === 'pendiente' ? 'rgba(245, 158, 11, 0.2)' :
                                   opinion.estado === 'aprobada' ? 'rgba(16, 185, 129, 0.2)' :
                                   'rgba(239, 68, 68, 0.2)',
                        color: opinion.estado === 'pendiente' ? '#f59e0b' :
                               opinion.estado === 'aprobada' ? '#10b981' : '#ef4444',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}>
                        {opinion.estado}
                      </span>

                      {opinion.es_publica && (
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(139, 92, 246, 0.2)',
                          color: '#a78bfa',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          Pública
                        </span>
                      )}

                      {opinion.es_anonimo && (
                        <span style={{
                          padding: '4px 12px',
                          background: 'rgba(107, 114, 128, 0.2)',
                          color: '#6b7280',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                        }}>
                          Anónimo
                        </span>
                      )}
                    </div>

                    {/* Info del cliente */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '14px', color: '#8b92a8' }}>
                        <strong style={{ color: '#ffffff' }}>
                          {opinion.cliente_nombre}
                        </strong>
                        {opinion.cliente_telefono && (
                          <>
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span>{opinion.cliente_telefono}</span>
                          </>
                        )}
                        {opinion.cliente_email && (
                          <>
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span>{opinion.cliente_email}</span>
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {new Date(opinion.created_at).toLocaleString('es-VE')}
                      </div>
                    </div>

                    {/* Producto */}
                    {opinion.producto_nombre && (
                      <div style={{
                        padding: '6px 12px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#a78bfa',
                        marginBottom: '12px',
                        display: 'inline-block',
                      }}>
                        📦 {opinion.producto_nombre}
                      </div>
                    )}

                    {/* Comentario */}
                    <p style={{
                      fontSize: '15px',
                      color: '#d1d5db',
                      lineHeight: '1.6',
                      margin: '0 0 16px 0',
                    }}>
                      {opinion.comentario}
                    </p>

                    {/* Imágenes */}
                    {opinion.imagenes && opinion.imagenes.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {opinion.imagenes.map((img, i) => (
                            <div
                              key={i}
                              onClick={() => verImagenes(opinion.imagenes!)}
                              style={{
                                width: '100px',
                                height: '100px',
                                cursor: 'pointer',
                                position: 'relative',
                              }}
                            >
                              <img
                                src={img}
                                alt={`Foto ${i+1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.5)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                              }}>
                                <FaEye style={{ color: 'white', fontSize: '20px' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {opinion.estado === 'pendiente' && (
                      <>
                        <button
                          onClick={() => aprobarOpinion(opinion.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid #10b981',
                            borderRadius: '6px',
                            color: '#10b981',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                          title="Aprobar y publicar"
                        >
                          <FaCheck /> Aprobar
                        </button>
                        <button
                          onClick={() => rechazarOpinion(opinion.id)}
                          style={{
                            padding: '8px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                          }}
                          title="Rechazar"
                        >
                          <FaTimes /> Rechazar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => eliminarOpinion(opinion.id)}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                      title="Eliminar permanentemente"
                    >
                      <FaTrash /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de imágenes */}
        {viewingImages.length > 0 && (
          <div
            onClick={() => setViewingImages([])}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '32px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', maxWidth: '1200px' }}>
              {viewingImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Foto ${i+1}`}
                  style={{
                    maxWidth: '500px',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    borderRadius: '12px',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => setViewingImages([])}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '50%',
                color: 'white',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}