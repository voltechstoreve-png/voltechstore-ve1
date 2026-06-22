'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { FaSearch, FaFire, FaShoppingCart, FaTimes } from 'react-icons/fa';

interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_venta_usd: number;
  precio_mayor_usd?: number;
  precio_oferta_usd?: number;
  imagen_url: string;
  categoria: string;
  marca: string;
  en_oferta: boolean;
  stock: number;
  etiqueta_nuevo?: boolean;
  etiqueta_oferta?: boolean;
  etiqueta_kit_combo?: boolean;
}

export default function ProductosPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSelect, setCategoriaSelect] = useState('');
  const [marcaSelect, setMarcaSelect] = useState('');
  const [verOfertas, setVerOfertas] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [cartCount] = useState(0);
  const [tasaBCV] = useState(690);

  useEffect(() => {
    fetchProductos();
  }, []);

  useEffect(() => {
    filtrarProductos();
  }, [busqueda, categoriaSelect, marcaSelect, verOfertas, productos]);

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('estado', 'publicado')
        .is('etiqueta_streaming', false)
        .order('nombre', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setProductos([]);
        setCategorias([]);
        setMarcas([]);
        return;
      }

      const productosTransformados = data.map(p => ({
        ...p,
        categoria: p.categoria || 'Sin categoría',
        imagen_url: p.imagen_url || '',
      })) as Producto[];

      setProductos(productosTransformados);
      
      const cats = [...new Set(productosTransformados.map(p => p.categoria).filter(Boolean))] as string[];
      const marcasList = [...new Set(productosTransformados.map(p => p.marca).filter(Boolean))] as string[];
      
      setCategorias(cats.sort());
      setMarcas(marcasList.sort());
    } catch (error) {
      console.error('Error fetching productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarProductos = () => {
    let filtrados = [...productos];

    if (busqueda) {
      filtrados = filtrados.filter(p => 
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.marca?.toLowerCase().includes(busqueda.toLowerCase())
      );
    }

    if (categoriaSelect) {
      filtrados = filtrados.filter(p => p.categoria === categoriaSelect);
    }

    if (marcaSelect) {
      filtrados = filtrados.filter(p => p.marca === marcaSelect);
    }

    if (verOfertas) {
      filtrados = filtrados.filter(p => p.en_oferta || p.precio_oferta_usd || p.etiqueta_oferta);
    }

    setFilteredProductos(filtrados);
  };

  const getProductPrice = (producto: Producto) => {
    return producto.precio_oferta_usd || producto.precio_venta_usd || 0;
  };

  const getDiscount = (producto: Producto) => {
    if (producto.precio_oferta_usd && producto.precio_venta_usd > producto.precio_oferta_usd) {
      return Math.round(((producto.precio_venta_usd - producto.precio_oferta_usd) / producto.precio_venta_usd) * 100);
    }
    return 0;
  };

  const tieneOferta = (producto: Producto) => {
    return !!(producto.precio_oferta_usd && producto.precio_venta_usd > producto.precio_oferta_usd);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: theme.colors.text.primary }}>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background.primary }}>
      <Navbar 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
        cartCount={cartCount}
      />
      <Sidebar 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 20px' }}>
        {/* Filtros */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto 20px' }}>
            <FaSearch style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.text.secondary,
              fontSize: '18px',
            }} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px 16px 55px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '12px',
                color: theme.colors.text.primary,
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
            <select
              value={categoriaSelect}
              onChange={(e) => setCategoriaSelect(e.target.value)}
              style={{
                padding: '12px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '10px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={marcaSelect}
              onChange={(e) => setMarcaSelect(e.target.value)}
              style={{
                padding: '12px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '10px',
                color: theme.colors.text.primary,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="">Todas las marcas</option>
              {marcas.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>

            <button
              onClick={() => setVerOfertas(!verOfertas)}
              style={{
                padding: '12px 24px',
                background: verOfertas ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FaFire /> {verOfertas ? 'Ver Todo' : 'Ver Ofertas'}
            </button>
          </div>
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px', color: theme.colors.text.primary }}>
          {verOfertas ? 'Productos en Oferta' : 'Todos los Productos'}
          <span style={{ fontSize: '16px', color: theme.colors.text.secondary, fontWeight: '400', marginLeft: '12px' }}>
            ({filteredProductos.length})
          </span>
        </h2>

        {filteredProductos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: theme.colors.text.secondary }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No se encontraron productos</h3>
            <p>Intenta con otros filtros o términos de búsqueda</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredProductos.map(producto => {
              const tieneOfertaActiva = tieneOferta(producto);
              const precioFinal = getProductPrice(producto);
              const precioBsFinal = precioFinal * tasaBCV;
              const precioBsOriginal = producto.precio_venta_usd * tasaBCV;
              const descuento = getDiscount(producto);
              
              return (
                <div
                  key={producto.id}
                  style={{
                    background: theme.colors.background.tertiary,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
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
                  {/* Etiquetas */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {producto.etiqueta_nuevo && (
                      <span style={{ background: '#22c55e', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>Nuevo</span>
                    )}
                    {tieneOfertaActiva && (
                      <span style={{ background: '#f59e0b', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>Oferta</span>
                    )}
                    {producto.etiqueta_kit_combo && (
                      <span style={{ background: '#3b82f6', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>Kit/Combo</span>
                    )}
                    {producto.stock === 0 && (
                      <span style={{ background: '#ef4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>Agotado</span>
                    )}
                  </div>

                  {/* Imagen - CORREGIDO */}
                  <div style={{ position: 'relative', height: '250px', background: theme.colors.background.secondary, overflow: 'hidden' }}>
                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          // Si la imagen falla, mostrar placeholder
                          (e.target as HTMLImageElement).style.display = 'none';
                          const placeholder = document.createElement('div');
                          placeholder.style.cssText = `
                            width: 100%;
                            height: 100%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: ${theme.colors.background.secondary};
                            color: ${theme.colors.text.secondary};
                            font-size: 48px;
                          `;
                          placeholder.innerHTML = '📷';
                          (e.target as HTMLImageElement).parentElement?.appendChild(placeholder);
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: theme.colors.background.secondary,
                        color: theme.colors.text.secondary,
                        fontSize: '48px',
                      }}>
                        📷
                      </div>
                    )}
                  </div>

                  {/* Info del producto - SIN NOMBRE DUPLICADO */}
                  <div style={{ padding: '20px' }}>
                    <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase' }}>
                      {producto.categoria}
                    </div>
                    {/* ELIMINADO: Nombre duplicado que estaba aquí */}
                    <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 0 12px 0' }}>
                      {producto.marca}
                    </p>

                    <div style={{ marginBottom: '16px' }}>
                      {tieneOfertaActiva ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: theme.colors.text.muted, textDecoration: 'line-through' }}>
                              ${producto.precio_venta_usd.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '12px', color: theme.colors.text.muted }}>
                              Bs {precioBsOriginal.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                              ${precioFinal.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                              Bs {precioBsFinal.toFixed(2)}
                            </span>
                          </div>
                          <div style={{ 
                            background: 'rgba(245, 158, 11, 0.1)', 
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '11px', 
                            color: '#f59e0b', 
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}>
                            💵 Solo divisas - Ahorra {descuento}%
                          </div>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                          <span style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>
                            ${precioFinal.toFixed(2)}
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e' }}>
                            Bs {precioBsFinal.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={producto.stock === 0}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: producto.stock === 0 ? theme.colors.background.elevated : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        border: 'none',
                        borderRadius: '10px',
                        color: producto.stock === 0 ? theme.colors.text.muted : 'white',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      {producto.stock === 0 ? <><FaTimes /> Agotado</> : <><FaShoppingCart /> Agregar</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}