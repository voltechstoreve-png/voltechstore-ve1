'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSave, FaBox,
  FaImage, FaTimes, FaUpload, FaSearch, FaFilter,
  FaCheckCircle, FaClock, FaBan, FaStar, FaEye, FaEyeSlash,
  FaChartLine, FaThLarge, FaList, FaDownload, FaWhatsapp
} from 'react-icons/fa';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  marca: string;
  categoria_id: string;
  categoria_nombre?: string;
  sku: string;
  fotos: string[];
  stock: number;
  precio_venta_usd: number;
  precio_mayor_usd: number;
  precio_oferta_usd?: number;
  precio_bs: number;
  tasa_bcv: number;
  estado: 'borrador' | 'publicado' | 'agotado';
  destacado: boolean;
  etiqueta_nuevo: boolean;
  etiqueta_oferta: boolean;
  etiqueta_agotado: boolean;
  etiqueta_kit_combo: boolean;
  etiqueta_streaming: boolean;
  creado_por_nombre?: string;
  created_at: string;
}

interface Categoria { id: string; nombre: string; color: string; }
interface Marca { id: string; nombre: string; }

export default function AdminProductosPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [vistaGrid, setVistaGrid] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    marca: '',
    categoria_id: '',
    sku: '',
    fotos: [] as string[],
    stock: 0,
    precio_venta_usd: 0,
    precio_mayor_usd: 0,
    precio_oferta_usd: 0,
    tasa_bcv: 690,
    estado: 'borrador' as 'borrador' | 'publicado' | 'agotado',
    destacado: false,
    etiqueta_nuevo: false,
    etiqueta_oferta: false,
    etiqueta_agotado: false,
    etiqueta_kit_combo: false,
    etiqueta_streaming: false,
  });

  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    fetchMarcas();
  }, []);

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias_productos').select('*').order('nombre');
    setCategorias(data || []);
  };

  const fetchMarcas = async () => {
    try {
      const { data } = await supabase.from('marcas_productos').select('*').order('nombre');
      setMarcas(data || []);
    } catch (error) {
      const { data } = await supabase.from('productos').select('marca').not('marca', 'is', null);
      const unicas = Array.from(new Set(data?.map(p => p.marca).filter(Boolean) || []))
        .map((n, i) => ({ id: `m-${i}`, nombre: n }));
      setMarcas(unicas);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*, categoria:categorias_productos(nombre)')
        .not('nombre', 'like', '__MARCA__%')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProductos(data?.map(p => ({
        ...p,
        categoria_nombre: (p as any).categoria?.nombre || 'Sin categoría'
      })) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setFormData(prev => ({ ...prev, fotos: [...prev.fotos, ev.target!.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const eliminarFoto = (index: number) => {
    setFormData(prev => ({ ...prev, fotos: prev.fotos.filter((_, i) => i !== index) }));
  };

  const handleGuardar = async () => {
    if (!formData.nombre) {
      alert('⚠️ El nombre es obligatorio');
      return;
    }

    try {
      const nombreUsuario = profile ? `${profile.nombre} ${profile.apellido}` : '';
      const dataToSave: any = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        marca: formData.marca,
        categoria_id: formData.categoria_id || null,
        sku: formData.sku,
        fotos: formData.fotos,
        stock: formData.stock,
        precio_venta_usd: formData.precio_venta_usd,
        precio_mayor_usd: formData.precio_mayor_usd,
        precio_oferta_usd: formData.precio_oferta_usd || null,
        precio_bs: formData.precio_venta_usd * formData.tasa_bcv,
        tasa_bcv: formData.tasa_bcv,
        estado: formData.estado,
        destacado: formData.destacado,
        etiqueta_nuevo: formData.etiqueta_nuevo,
        etiqueta_oferta: formData.etiqueta_oferta,
        etiqueta_agotado: formData.etiqueta_agotado,
        etiqueta_kit_combo: formData.etiqueta_kit_combo,
        etiqueta_streaming: formData.etiqueta_streaming,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        await supabase.from('productos').update(dataToSave).eq('id', editingId);
      } else {
        dataToSave.creado_por = user?.id;
        dataToSave.creado_por_nombre = nombreUsuario;
        if (formData.estado === 'publicado') {
          dataToSave.fecha_publicacion = new Date().toISOString();
        }
        await supabase.from('productos').insert([dataToSave]);
      }

      alert('✅ Producto guardado');
      setShowForm(false);
      resetForm();
      fetchProductos();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      marca: '',
      categoria_id: '',
      sku: '',
      fotos: [],
      stock: 0,
      precio_venta_usd: 0,
      precio_mayor_usd: 0,
      precio_oferta_usd: 0,
      tasa_bcv: 690,
      estado: 'borrador',
      destacado: false,
      etiqueta_nuevo: false,
      etiqueta_oferta: false,
      etiqueta_agotado: false,
      etiqueta_kit_combo: false,
      etiqueta_streaming: false,
    });
    setEditingId(null);
  };

  const handleEditar = (p: Producto) => {
    setEditingId(p.id);
    setFormData({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      marca: p.marca || '',
      categoria_id: p.categoria_id || '',
      sku: p.sku || '',
      fotos: p.fotos || [],
      stock: p.stock,
      precio_venta_usd: p.precio_venta_usd,
      precio_mayor_usd: p.precio_mayor_usd || 0,
      precio_oferta_usd: p.precio_oferta_usd || 0,
      tasa_bcv: p.tasa_bcv || 690,
      estado: p.estado,
      destacado: p.destacado,
      etiqueta_nuevo: p.etiqueta_nuevo || false,
      etiqueta_oferta: p.etiqueta_oferta || false,
      etiqueta_agotado: p.etiqueta_agotado || false,
      etiqueta_kit_combo: p.etiqueta_kit_combo || false,
      etiqueta_streaming: p.etiqueta_streaming || false,
    });
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await supabase.from('productos').delete().eq('id', id);
      alert('🗑️ Producto eliminado');
      fetchProductos();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: 'borrador' | 'publicado' | 'agotado') => {
    try {
      const updateData: any = {
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      };
      
      if (nuevoEstado === 'publicado') {
        updateData.fecha_publicacion = new Date().toISOString();
      }

      await supabase.from('productos').update(updateData).eq('id', id);
      alert(`✅ Producto ${nuevoEstado === 'publicado' ? 'publicado' : nuevoEstado === 'agotado' ? 'marcado como agotado' : 'movido a borrador'}`);
      fetchProductos();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const toggleDestacado = async (id: string, actual: boolean) => {
    try {
      await supabase.from('productos').update({ destacado: !actual }).eq('id', id);
      fetchProductos();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const generarPDF = async (tipo: 'detalle' | 'socio') => {
    try {
      const productosPublicados = productos.filter(p => p.estado === 'publicado');
      
      let contenido = `VOLTECHSTORE.VE - Catálogo de Productos\n`;
      contenido += `Generado: ${new Date().toLocaleDateString('es-VE')}\n\n`;
      
      productosPublicados.forEach(p => {
        const precio = tipo === 'socio' ? p.precio_mayor_usd : p.precio_venta_usd;
        const precioBs = precio * p.tasa_bcv;
        
        contenido += `${p.nombre}\n`;
        contenido += `SKU: ${p.sku || 'N/A'}\n`;
        contenido += `Marca: ${p.marca || 'N/A'}\n`;
        contenido += `Precio ${tipo === 'socio' ? 'Mayor' : 'Detalle'}: $${precio.toFixed(2)} / Bs ${precioBs.toFixed(2)}\n`;
        if (p.precio_oferta_usd) {
          const ofertaBs = p.precio_oferta_usd * p.tasa_bcv;
          contenido += ` OFERTA: $${p.precio_oferta_usd.toFixed(2)} / Bs ${ofertaBs.toFixed(2)}\n`;
        }
        contenido += `Stock: ${p.stock}\n`;
        if (p.etiqueta_nuevo) contenido += '🆕 NUEVO\n';
        if (p.etiqueta_oferta) contenido += '🔥 OFERTA\n';
        if (p.etiqueta_streaming) contenido += ' STREAMING\n';
        contenido += '\n' + '-'.repeat(50) + '\n\n';
      });

      const blob = new Blob([contenido], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `catalogo_${tipo}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert(`✅ PDF ${tipo === 'detalle' ? 'Detalle' : 'Socio'} generado`);
    } catch (error: any) {
      alert(' Error: ' + error.message);
    }
  };

  const compartirWhatsApp = (p: Producto) => {
    const precioBs = p.precio_venta_usd * p.tasa_bcv;
    let mensaje = `🛍️ *${p.nombre}*\n\n`;
    mensaje += `💲 Precio: $${p.precio_venta_usd.toFixed(2)} / Bs ${precioBs.toFixed(2)}\n`;
    if (p.precio_oferta_usd) {
      const ofertaBs = p.precio_oferta_usd * p.tasa_bcv;
      mensaje += `🔥 OFERTA: $${p.precio_oferta_usd.toFixed(2)} / Bs ${ofertaBs.toFixed(2)}\n`;
    }
    if (p.precio_mayor_usd) {
      const mayorBs = p.precio_mayor_usd * p.tasa_bcv;
      mensaje += ` Precio Mayor: $${p.precio_mayor_usd.toFixed(2)} / Bs ${mayorBs.toFixed(2)}\n`;
    }
    mensaje += `\n📦 Stock disponible: ${p.stock} unidades\n`;
    mensaje += `\n¡Contáctanos para más información!`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                         p.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
                         p.marca.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const matchCategoria = filtroCategoria === 'todas' || p.categoria_id === filtroCategoria;
    return matchBusqueda && matchEstado && matchCategoria;
  });

  const stats = {
    total: productos.length,
    publicados: productos.filter(p => p.estado === 'publicado').length,
    borradores: productos.filter(p => p.estado === 'borrador').length,
    agotados: productos.filter(p => p.estado === 'agotado').length,
    destacados: productos.filter(p => p.destacado).length,
    valorInventario: productos.reduce((sum, p) => sum + (p.precio_venta_usd * p.stock), 0),
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'publicado': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981' };
      case 'borrador': return { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' };
      case 'agotado': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' };
      default: return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'publicado': return <FaCheckCircle />;
      case 'borrador': return <FaClock />;
      case 'agotado': return <FaBan />;
      default: return <FaBox />;
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: theme.colors.background.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: theme.colors.text.primary }}>Cargando productos...</p>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: '6px',
    color: theme.colors.text.primary,
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: theme.colors.text.secondary,
    marginBottom: '6px',
  };

  return (
    <div style={{ minHeight: '100vh', background: theme.colors.background.primary, color: theme.colors.text.primary, padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
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
                Inventario
              </h1>
              <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: '4px 0 0 0' }}>
                {stats.publicados} productos publicados
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => generarPDF('detalle')}
              style={{
                padding: '10px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              <FaDownload /> PDF Detall
            </button>
            <button
              onClick={() => generarPDF('socio')}
              style={{
                padding: '10px 16px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              <FaDownload /> PDF Socio
            </button>
            <button
              onClick={() => { setShowForm(true); resetForm(); }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
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
              <FaPlus /> Nuevo producto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          background: theme.colors.background.tertiary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.colors.text.secondary }} />
              <input
                type="text"
                placeholder="Buscar por nombre o marca..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingLeft: '40px',
                }}
              />
            </div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
            >
              <option value="todas">Todas</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setVistaGrid(true)}
                style={{
                  padding: '10px 16px',
                  background: vistaGrid ? '#a855f7' : theme.colors.background.secondary,
                  border: `1px solid ${vistaGrid ? '#a855f7' : theme.colors.border.default}`,
                  borderRadius: '8px',
                  color: vistaGrid ? 'white' : theme.colors.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaThLarge />
              </button>
              <button
                onClick={() => setVistaGrid(false)}
                style={{
                  padding: '10px 16px',
                  background: !vistaGrid ? '#a855f7' : theme.colors.background.secondary,
                  border: `1px solid ${!vistaGrid ? '#a855f7' : theme.colors.border.default}`,
                  borderRadius: '8px',
                  color: !vistaGrid ? 'white' : theme.colors.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {/* Formulario */}
        {showForm && (
          <div style={{
            background: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 24px 0' }}>
              {editingId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
            </h2>

            {/* Fotos */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Fotos del Producto</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {formData.fotos.map((foto, i) => (
                  <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img src={foto} alt={`Foto ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    <button
                      onClick={() => eliminarFoto(i)}
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
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFotoUpload} style={{ display: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Nombre del Producto *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Audífonos Bluetooth JBL"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Marca</label>
                <select
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Sin marca</option>
                  {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Categoría</label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="AUD-JBL-001"
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  placeholder="Describe el producto..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>💲 Precio Venta USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_venta_usd || ''}
                  onChange={(e) => setFormData({ ...formData, precio_venta_usd: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}> Precio Mayor USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_mayor_usd || ''}
                  onChange={(e) => setFormData({ ...formData, precio_mayor_usd: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>🔥 Precio Oferta USD</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_oferta_usd || ''}
                  onChange={(e) => setFormData({ ...formData, precio_oferta_usd: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>💱 Tasa BCV</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tasa_bcv}
                  onChange={(e) => setFormData({ ...formData, tasa_bcv: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
                <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginTop: '4px' }}>
                  ≈ Bs {(formData.precio_venta_usd * formData.tasa_bcv).toFixed(2)}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  style={inputStyle}
                >
                  <option value="borrador">Borrador</option>
                  <option value="publicado">Publicado</option>
                  <option value="agotado">Agotado</option>
                </select>
              </div>
            </div>

            {/* Etiquetas */}
            <div style={{
              background: theme.colors.background.secondary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <label style={{ ...labelStyle, marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>
                Etiquetas
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.etiqueta_nuevo}
                    onChange={(e) => setFormData({ ...formData, etiqueta_nuevo: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: '14px' }}>🆕 Nuevo</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.etiqueta_agotado}
                    onChange={(e) => setFormData({ ...formData, etiqueta_agotado: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: '14px' }}>❌ Agotado</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.etiqueta_oferta}
                    onChange={(e) => setFormData({ ...formData, etiqueta_oferta: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: '14px' }}>🔥 Oferta</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.etiqueta_kit_combo}
                    onChange={(e) => setFormData({ ...formData, etiqueta_kit_combo: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: '14px' }}>📦 Kit/Combo</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.etiqueta_streaming}
                    onChange={(e) => setFormData({ ...formData, etiqueta_streaming: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: '14px' }}>📺 Streaming</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.destacado}
                    onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#a855f7' }}
                  />
                  <span style={{ fontSize: '14px' }}>⭐ Producto Destacado</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
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
                onClick={handleGuardar}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
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
                <FaSave /> {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Productos */}
        {productosFiltrados.length === 0 ? (
          <div style={{
            background: theme.colors.background.tertiary,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <FaBox style={{ fontSize: '48px', color: theme.colors.text.secondary, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No hay productos</h3>
            <p style={{ color: theme.colors.text.secondary }}>
              {busqueda || filtroCategoria !== 'todas'
                ? 'No se encontraron productos con esos filtros'
                : 'Haz click en "Nuevo producto" para comenzar'}
            </p>
          </div>
        ) : vistaGrid ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}>
            {productosFiltrados.map(p => (
              <div
                key={p.id}
                style={{
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
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
                <div style={{ position: 'relative', height: '200px', background: theme.colors.background.secondary }}>
                  {p.fotos && p.fotos.length > 0 ? (
                    <img src={p.fotos[0]} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.secondary }}>
                      <FaImage style={{ fontSize: '48px' }} />
                    </div>
                  )}
                  {p.destacado && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(251, 191, 36, 0.9)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <FaStar /> Destacado
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: getEstadoColor(p.estado).bg,
                    color: getEstadoColor(p.estado).text,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {getEstadoIcon(p.estado)} {p.estado}
                  </div>
                </div>

                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>{p.nombre}</h3>
                  <div style={{ fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '12px' }}>
                    {p.marca && <span>{p.marca} • </span>}
                    {p.categoria_nombre}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                        ${p.precio_venta_usd.toFixed(2)}
                      </div>
                      {p.precio_mayor_usd && (
                        <div style={{ fontSize: '12px', color: theme.colors.text.secondary }}>
                          Mayor: ${p.precio_mayor_usd.toFixed(2)}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: theme.colors.text.secondary }}>
                        Bs {(p.precio_venta_usd * p.tasa_bcv).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600' }}>Stock: {p.stock}</div>
                      {p.sku && <div style={{ fontSize: '11px', color: theme.colors.text.secondary, fontFamily: 'monospace' }}>{p.sku}</div>}
                    </div>
                  </div>

                  {/* Etiquetas */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {p.etiqueta_nuevo && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Nuevo</span>
                    )}
                    {p.etiqueta_oferta && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Oferta</span>
                    )}
                    {p.etiqueta_kit_combo && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Kit/Combo</span>
                    )}
                    {p.etiqueta_streaming && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Streaming</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditar(p)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      <FaEdit /> Editar
                    </button>
                    {p.estado !== 'publicado' && (
                      <button
                        onClick={() => cambiarEstado(p.id, 'publicado')}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#10b981',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        title="Publicar"
                      >
                        <FaEye />
                      </button>
                    )}
                    {p.estado === 'publicado' && (
                      <button
                        onClick={() => cambiarEstado(p.id, 'borrador')}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#f59e0b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        title="Despublicar"
                      >
                        <FaEyeSlash />
                      </button>
                    )}
                    <button
                      onClick={() => compartirWhatsApp(p)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(37, 211, 102, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#25d366',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '12px',
                      }}
                      title="Compartir en WhatsApp"
                    >
                      <FaWhatsapp />
                    </button>
                    <button
                      onClick={() => handleEliminar(p.id)}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '12px',
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
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {productosFiltrados.map(p => (
              <div
                key={p.id}
                style={{
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                <div style={{ width: '80px', height: '80px', background: theme.colors.background.secondary, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  {p.fotos && p.fotos.length > 0 ? (
                    <img src={p.fotos[0]} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.text.secondary }}>
                      <FaImage />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{p.nombre}</h3>
                    <span style={{
                      padding: '4px 10px',
                      background: getEstadoColor(p.estado).bg,
                      color: getEstadoColor(p.estado).text,
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {getEstadoIcon(p.estado)} {p.estado}
                    </span>
                    {p.destacado && (
                      <span style={{
                        padding: '4px 10px',
                        background: 'rgba(251, 191, 36, 0.2)',
                        color: '#fbbf24',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FaStar /> Destacado
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '13px', color: theme.colors.text.secondary }}>
                    <div>
                      <div>💲 <strong style={{ color: '#10b981' }}>${p.precio_venta_usd.toFixed(2)}</strong></div>
                      {p.precio_mayor_usd && <div> Mayor: ${p.precio_mayor_usd.toFixed(2)}</div>}
                      <div>Bs {(p.precio_venta_usd * p.tasa_bcv).toFixed(2)}</div>
                    </div>
                    <div>
                      <div>🏷️ {p.marca || 'Sin marca'}</div>
                      <div>📁 {p.categoria_nombre}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'monospace' }}>SKU: {p.sku || 'N/A'}</div>
                      <div>👤 {p.creado_por_nombre || 'Desconocido'}</div>
                    </div>
                  </div>
                  {/* Etiquetas en vista lista */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {p.etiqueta_nuevo && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Nuevo</span>
                    )}
                    {p.etiqueta_oferta && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Oferta</span>
                    )}
                    {p.etiqueta_kit_combo && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Kit/Combo</span>
                    )}
                    {p.etiqueta_streaming && (
                      <span style={{ padding: '3px 8px', background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>Streaming</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => compartirWhatsApp(p)} style={{ padding: '8px 12px', background: 'rgba(37, 211, 102, 0.1)', border: 'none', borderRadius: '6px', color: '#25d366', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }} title="Compartir en WhatsApp">
                    <FaWhatsapp />
                  </button>
                  <button onClick={() => handleEditar(p)} style={{ padding: '8px 12px', background: 'rgba(59, 130, 246, 0.1)', border: 'none', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
                    <FaEdit />
                  </button>
                  {p.estado !== 'publicado' ? (
                    <button onClick={() => cambiarEstado(p.id, 'publicado')} style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: 'none', borderRadius: '6px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
                      <FaEye /> Publicar
                    </button>
                  ) : (
                    <button onClick={() => cambiarEstado(p.id, 'borrador')} style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', border: 'none', borderRadius: '6px', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' }}>
                      <FaEyeSlash /> Despublicar
                    </button>
                  )}
                  <button onClick={() => handleEliminar(p.id)} style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '12px' }}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}