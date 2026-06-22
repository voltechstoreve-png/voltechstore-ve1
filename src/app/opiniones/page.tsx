'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { FaStar, FaUpload, FaCheck, FaTimes, FaCommentDots, FaArrowLeft } from 'react-icons/fa';

interface Opinion {
  id: string;
  producto_id?: string;
  producto_nombre?: string;
  cliente_nombre: string;
  es_anonimo: boolean;
  calificacion: number;
  comentario: string;
  imagenes: string[];
  created_at: string;
}

interface Producto {
  id: string;
  nombre: string;
}

export default function OpinionesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submittingOpinion, setSubmittingOpinion] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [opinionForm, setOpinionForm] = useState({
    producto_id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    cliente_email: '',
    es_anonimo: false,
    calificacion: 0,
    comentario: '',
    imagenes: [] as string[],
  });

  useEffect(() => {
    fetchOpiniones();
    fetchProductos();
  }, []);

  const fetchOpiniones = async () => {
    try {
      const { data, error } = await supabase
        .from('opiniones')
        .select('*')
        .eq('estado', 'aprobada')
        .eq('es_publica', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOpiniones(data || []);
    } catch (error) {
      console.error('Error fetching opiniones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('id, nombre')
      .eq('estado', 'publicado')
      .order('nombre');
    setProductos(data || []);
  };

  const handleOpinionFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setOpinionForm(prev => ({ 
            ...prev, 
            imagenes: [...prev.imagenes, ev.target!.result as string] 
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const eliminarOpinionFoto = (index: number) => {
    setOpinionForm(prev => ({ 
      ...prev, 
      imagenes: prev.imagenes.filter((_, i) => i !== index) 
    }));
  };

  const handleSubmitOpinion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (opinionForm.calificacion === 0) {
      alert('⚠️ Por favor califica con estrellas');
      return;
    }
    
    if (!opinionForm.comentario.trim()) {
      alert('⚠️ Por favor escribe un comentario');
      return;
    }

    setSubmittingOpinion(true);
    
    try {
      const { error } = await supabase.from('opiniones').insert([{
        producto_id: opinionForm.producto_id || null,
        producto_nombre: productos.find(p => p.id === opinionForm.producto_id)?.nombre || null,
        cliente_nombre: opinionForm.es_anonimo ? 'Cliente Anónimo' : opinionForm.cliente_nombre,
        cliente_telefono: opinionForm.cliente_telefono,
        cliente_email: opinionForm.cliente_email,
        es_anonimo: opinionForm.es_anonimo,
        calificacion: opinionForm.calificacion,
        comentario: opinionForm.comentario,
        imagenes: opinionForm.imagenes,
        estado: 'pendiente',
        es_publica: false,
      }]);
      
      if (error) throw error;
      
      alert('✅ ¡Gracias por tu opinión! Será revisada y publicada pronto.');
      setShowForm(false);
      setOpinionForm({
        producto_id: '',
        cliente_nombre: '',
        cliente_telefono: '',
        cliente_email: '',
        es_anonimo: false,
        calificacion: 0,
        comentario: '',
        imagenes: [],
      });
      fetchOpiniones();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setSubmittingOpinion(false);
    }
  };

  const StarRating = ({ rating, interactive = false, onRate }: { rating: number, interactive?: boolean, onRate?: (r: number) => void }) => {
    const [hover, setHover] = useState(0);
    
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: interactive ? 'pointer' : 'default',
              fontSize: '24px',
              color: star <= (hover || rating) ? '#fbbf24' : '#374151',
              transition: 'color 0.2s',
              padding: 0,
            }}
          >
            <FaStar />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.primary }}>
        <p>Cargando opiniones...</p>
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
              Opiniones de Nuestros Clientes
            </h1>
            <p style={{ fontSize: '16px', color: theme.colors.text.secondary }}>
              {opiniones.length} {opiniones.length === 1 ? 'opinión' : 'opiniones'} de clientes satisfechos
            </p>
          </div>
        </div>

        {/* Botón Dejar Opinión */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '14px 32px',
              background: showForm 
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FaStar /> {showForm ? 'Cancelar' : 'Dejar mi Opinión'}
          </button>
        </div>

        {/* Formulario de Opinión */}
        {showForm && (
          <div style={{
            background: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '48px',
            maxWidth: '800px',
            margin: '0 auto 48px',
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              Comparte tu Experiencia
            </h3>

            <form onSubmit={handleSubmitOpinion}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                  }}>
                    Producto (opcional)
                  </label>
                  <select
                    value={opinionForm.producto_id}
                    onChange={(e) => setOpinionForm({ ...opinionForm, producto_id: e.target.value })}
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
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                  }}>
                    Calificación *
                  </label>
                  <StarRating 
                    rating={opinionForm.calificacion} 
                    interactive={true} 
                    onRate={(r) => setOpinionForm({ ...opinionForm, calificacion: r })} 
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                  }}>
                    Tu Nombre {opinionForm.es_anonimo && '(aparecerá como "Cliente Anónimo")'}
                  </label>
                  <input
                    type="text"
                    value={opinionForm.cliente_nombre}
                    onChange={(e) => setOpinionForm({ ...opinionForm, cliente_nombre: e.target.value })}
                    disabled={opinionForm.es_anonimo}
                    placeholder="Tu nombre completo"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: theme.colors.background.secondary,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '8px',
                      color: theme.colors.text.primary,
                      fontSize: '14px',
                      opacity: opinionForm.es_anonimo ? 0.5 : 1,
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                  }}>
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={opinionForm.cliente_telefono}
                    onChange={(e) => setOpinionForm({ ...opinionForm, cliente_telefono: e.target.value })}
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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                  }}>
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={opinionForm.cliente_email}
                    onChange={(e) => setOpinionForm({ ...opinionForm, cliente_email: e.target.value })}
                    placeholder="tu@email.com"
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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={opinionForm.es_anonimo}
                      onChange={(e) => setOpinionForm({ ...opinionForm, es_anonimo: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: theme.colors.text.primary }}>
                      Publicar como anónimo
                    </span>
                  </label>
                  {opinionForm.es_anonimo && (
                    <p style={{ 
                      marginTop: '8px', 
                      padding: '12px', 
                      background: 'rgba(251, 191, 36, 0.1)', 
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#fbbf24',
                    }}>
                      💡 <strong>Consejo:</strong> Las opiniones públicas con tu nombre generan más confianza y tienen más probabilidades de ser publicadas. ¡Los clientes confían más en reseñas verificadas!
                    </p>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                  }}>
                    Tu Opinión *
                  </label>
                  <textarea
                    value={opinionForm.comentario}
                    onChange={(e) => setOpinionForm({ ...opinionForm, comentario: e.target.value })}
                    rows={5}
                    placeholder="Cuéntanos sobre tu experiencia con el producto..."
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

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    color: theme.colors.text.secondary,
                    marginBottom: '8px',
                  }}>
                    Fotos del Producto (opcional)
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {opinionForm.imagenes.map((foto, i) => (
                      <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <img 
                          src={foto} 
                          alt={`Foto ${i+1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                        <button
                          type="button"
                          onClick={() => eliminarOpinionFoto(i)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '24px',
                            height: '24px',
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
                    ))}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100px',
                        height: '100px',
                        background: theme.colors.background.secondary,
                        border: '2px dashed #2a2f4a',
                        borderRadius: '8px',
                        color: theme.colors.text.secondary,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                    >
                      <FaUpload />
                      <span style={{ fontSize: '11px' }}>Subir</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleOpinionFotoUpload}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); }}
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
                  disabled={submittingOpinion}
                  style={{
                    padding: '12px 24px',
                    background: submittingOpinion ? '#6b7280' : '#10b981',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: submittingOpinion ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FaCheck /> {submittingOpinion ? 'Enviando...' : 'Enviar Opinión'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Opiniones */}
        <div style={{
          display: 'grid',
          gap: '24px',
        }}>
          {opiniones.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: theme.colors.background.tertiary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '16px',
            }}>
              <FaCommentDots style={{ fontSize: '48px', color: theme.colors.text.secondary, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Aún no hay opiniones</h3>
              <p style={{ color: theme.colors.text.secondary }}>¡Sé el primero en compartir tu experiencia!</p>
            </div>
          ) : (
            opiniones.map(opinion => (
              <div
                key={opinion.id}
                style={{
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '16px',
                  padding: '24px',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <StarRating rating={opinion.calificacion} />
                    {opinion.producto_nombre && (
                      <span style={{
                        padding: '4px 12px',
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: '#a78bfa',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {opinion.producto_nombre}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
                    <strong style={{ color: theme.colors.text.primary }}>
                      {opinion.es_anonimo ? 'Cliente Anónimo' : opinion.cliente_nombre}
                    </strong>
                    <span style={{ margin: '0 8px' }}>•</span>
                    <span>{new Date(opinion.created_at).toLocaleDateString('es-VE')}</span>
                  </div>
                </div>

                {opinion.comentario && (
                  <p style={{
                    fontSize: '15px',
                    color: theme.colors.text.primary,
                    marginBottom: '16px',
                    lineHeight: '1.6',
                  }}>
                    {opinion.comentario}
                  </p>
                )}

                {opinion.imagenes && opinion.imagenes.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {opinion.imagenes.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Foto ${i+1}`}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}