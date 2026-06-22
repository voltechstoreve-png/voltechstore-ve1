'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { FaTv, FaPlay } from 'react-icons/fa';

interface Streaming {
  id: string;
  plataforma: string;
  categoria: string;
  precio_usd: number;
  precio_bs: number;
  logo_url: string;
  descripcion?: string;
  activo: boolean;
}

export default function StreamingPage() {
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [streaming, setStreaming] = useState<Streaming[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasaBCV] = useState(690);

  useEffect(() => {
    fetchStreaming();
  }, []);

  const fetchStreaming = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('estado', 'publicado')
        .eq('etiqueta_streaming', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.warn('Error en streaming:', error.message);
        setStreaming([]);
        return;
      }

      if (!data || data.length === 0) {
        setStreaming([]);
        return;
      }

      const streamingData: Streaming[] = data.map(p => ({
        id: p.id,
        plataforma: p.nombre,
        categoria: p.categoria || 'Streaming',
        precio_usd: p.precio_venta_usd || 0,
        precio_bs: (p.precio_venta_usd || 0) * tasaBCV,
        logo_url: p.imagen_url || '',
        descripcion: p.descripcion,
        activo: p.stock > 0,
      }));

      setStreaming(streamingData);
    } catch (error: any) {
      console.warn('Error fetching streaming:', error.message);
      setStreaming([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: theme.colors.text.primary }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background.primary }}>
      <Navbar 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />
      <Sidebar 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Banner Premium */}
        <div style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '48px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
            <FaTv style={{ fontSize: '48px', color: 'white' }} />
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: '700', margin: 0, color: 'white' }}>
                Cuentas Premium
              </h1>
              <p style={{ fontSize: '18px', margin: '8px 0 0 0', color: 'rgba(255,255,255,0.9)' }}>
                Selecciona 3+ plataformas y obtén descuentos progresivos
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
            }}>
              3+ → 5% OFF
            </div>
            <div style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
            }}>
              4+ → 7% OFF
            </div>
            <div style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '25px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
            }}>
              5+ → 10% OFF
            </div>
          </div>
        </div>

        {/* Catálogo de Streaming */}
        {streaming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: theme.colors.text.secondary }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📺</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No hay plataformas disponibles</h3>
            <p>Pronto tendremos más opciones de streaming</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {streaming.map(servicio => (
              <div
                key={servicio.id}
                style={{
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  height: '200px',
                  background: theme.colors.background.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  position: 'relative',
                }}>
                  <img
                    src={servicio.logo_url}
                    alt={servicio.plataforma}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                  {!servicio.activo && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '8px 20px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}>
                        Agotado
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 12px 0', color: theme.colors.text.primary }}>
                    {servicio.plataforma}
                  </h3>
                  {servicio.descripcion && (
                    <p style={{ fontSize: '14px', color: theme.colors.text.secondary, marginBottom: '16px' }}>
                      {servicio.descripcion}
                    </p>
                  )}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e', marginBottom: '4px' }}>
                      ${servicio.precio_usd.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '16px', color: theme.colors.text.secondary }}>
                      Bs {servicio.precio_bs.toFixed(2)}
                    </div>
                  </div>
                  <button
                    disabled={!servicio.activo}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: !servicio.activo ? theme.colors.background.elevated : 'linear-gradient(135deg, #a855f7, #ec4899)',
                      border: 'none',
                      borderRadius: '12px',
                      color: !servicio.activo ? theme.colors.text.muted : 'white',
                      fontWeight: '700',
                      fontSize: '16px',
                      cursor: !servicio.activo ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    <FaPlay /> {!servicio.activo ? 'Agotado' : 'Suscribirse Ahora'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}