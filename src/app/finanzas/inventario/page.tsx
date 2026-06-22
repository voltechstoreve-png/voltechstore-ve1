'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft, FaPlus, FaMinus, FaEdit, FaTrash, FaSave, FaBox,
  FaImage, FaTimes, FaUpload, FaDollarSign, FaSearch
} from 'react-icons/fa';

interface Categoria { id: string; nombre: string; color: string; }
interface Marca { id: string; nombre: string; }
interface Producto {
  id: string; nombre: string; descripcion: string; marca: string;
  categoria_id: string; categoria_nombre?: string; sku: string;
  fotos: string[]; stock: number; precio_venta_usd: number;
  precio_mayor_usd: number; tasa_bcv: number;
  estado: 'borrador' | 'pendiente' | 'publicado';
  creado_por_nombre?: string; created_at: string;
}

const normalizar = (texto: string) => 
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export default function InventarioProductosPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tasaBCV, setTasaBCV] = useState(690);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [showNuevaMarca, setShowNuevaMarca] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', marca: '', categoria_id: '',
    sku: '', fotos: [] as string[], stock: 0,
    precio_venta_usd: 0, precio_mayor_usd: 0,
    tasa_bcv: 690, estado: 'borrador' as 'borrador' | 'pendiente' | 'publicado',
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchProductos(),
        fetchCategorias(),
        fetchMarcas(),
        fetchTasa(),
      ]);
    };
    loadData();
  }, []);

  const fetchTasa = async () => {
    const { data } = await supabase.from('tasa_dia')
      .select('tasa_bs').eq('fecha', new Date().toISOString().split('T')[0]).single();
    if (data) setTasaBCV(data.tasa_bs);
  };

  const fetchCategorias = async () => {
    const { data } = await supabase.from('categorias_productos').select('*').order('nombre');
    setCategorias(data || []);
  };

  const fetchMarcas = async () => {
    try {
      const { data, error } = await supabase
        .from('marcas_productos')
        .select('*')
        .order('nombre');
      
      if (error) {
        const { data: productosData } = await supabase
          .from('productos')
          .select('marca')
          .not('marca', 'is', null)
          .not('nombre', 'like', '__MARCA__%');
        
        const unicas = Array.from(new Set(productosData?.map(p => p.marca).filter(Boolean) || []))
          .map((n, i) => ({ id: `m-${i}`, nombre: n }));
        setMarcas(unicas);
        return;
      }
      
      setMarcas(data || []);
    } catch (error) {
      console.error('Error fetching marcas:', error);
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
        ...p, categoria_nombre: (p as any).categoria?.nombre || 'Sin categoría'
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

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    if (categorias.some(c => normalizar(c.nombre) === normalizar(nuevaCategoria))) {
      alert('⚠️ Esta categoría ya existe');
      return;
    }
    
    const { data, error } = await supabase.from('categorias_productos')
      .insert([{ nombre: nuevaCategoria.trim(), color: '#4f46e5' }]).select().single();
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    
    setCategorias([...categorias, data]);
    setFormData({ ...formData, categoria_id: data.id });
    setNuevaCategoria('');
    setShowNuevaCategoria(false);
  };

  const agregarMarca = async () => {
    if (!nuevaMarca.trim()) return;
    
    const marcaNormalizada = normalizar(nuevaMarca);
    if (marcas.some(m => normalizar(m.nombre) === marcaNormalizada)) {
      alert('⚠️ Ya existe');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('marcas_productos')
        .insert([{ nombre: nuevaMarca.trim() }])
        .select()
        .single();
      
      if (error) {
        const nueva = { id: `m-${Date.now()}`, nombre: nuevaMarca.trim() };
        setMarcas([...marcas, nueva]);
        setFormData({...formData, marca: nuevaMarca.trim()});
        setNuevaMarca('');
        setShowNuevaMarca(false);
        return;
      }
      
      const nueva = { id: data.id, nombre: data.nombre };
      setMarcas([...marcas, nueva]);
      setFormData({...formData, marca: nuevaMarca.trim()});
      setNuevaMarca('');
      setShowNuevaMarca(false);
      
    } catch (error) {
      console.error('Error guardando marca:', error);
      const nueva = { id: `m-${Date.now()}`, nombre: nuevaMarca.trim() };
      setMarcas([...marcas, nueva]);
      setFormData({...formData, marca: nuevaMarca.trim()});
      setNuevaMarca('');
      setShowNuevaMarca(false);
    }
  };

  const handleGuardar = async () => {
    if (!formData.nombre) {
      alert('⚠️ El nombre es obligatorio');
      return;
    }
    try {
      const nombreUsuario = profile ? `${profile.nombre} ${profile.apellido}` : '';
      const dataToSave: any = {
        descripcion: formData.descripcion,
        fotos: formData.fotos,
        precio_venta_usd: formData.precio_venta_usd,
        precio_bs: formData.precio_venta_usd * formData.tasa_bcv,
        precio_mayor_usd: formData.precio_mayor_usd,
        precio_mayor_bs: formData.precio_mayor_usd * formData.tasa_bcv,
        tasa_bcv: formData.tasa_bcv,
        updated_at: new Date().toISOString(),
      };
      
      if (editingId) {
        await supabase.from('productos').update(dataToSave).eq('id', editingId);
      } else {
        dataToSave.nombre = formData.nombre;
        dataToSave.marca = formData.marca;
        dataToSave.categoria_id = formData.categoria_id;
        dataToSave.sku = formData.sku;
        dataToSave.stock = formData.stock;
        dataToSave.estado = formData.estado;
        dataToSave.creado_por = user?.id;
        dataToSave.creado_por_nombre = nombreUsuario;
        await supabase.from('productos').insert([dataToSave]);
      }
      
      alert('✅ Producto guardado');
      setShowForm(false);
      resetForm();
      fetchProductos();
      fetchMarcas();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '', descripcion: '', marca: '', categoria_id: '',
      sku: '', fotos: [], stock: 0, precio_venta_usd: 0,
      precio_mayor_usd: 0, tasa_bcv: tasaBCV, estado: 'borrador',
    });
    setEditingId(null);
  };

  const handleEditar = async (p: Producto) => {
    // Asegurar que categorías y marcas estén cargadas
    if (categorias.length === 0) {
      await fetchCategorias();
    }
    if (marcas.length === 0) {
      await fetchMarcas();
    }
    
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
      tasa_bcv: p.tasa_bcv || tasaBCV,
      estado: p.estado,
    });
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await supabase.from('productos').delete().eq('id', id);
    fetchProductos();
  };

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(p => {
    const termino = busqueda.toLowerCase();
    return p.nombre.toLowerCase().includes(termino) || 
           p.sku.toLowerCase().includes(termino);
  });

  if (loading) return <div style={{padding:'32px',textAlign:'center'}}><p>Cargando...</p></div>;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: '#1a1f3a',
    border: '1px solid #2a2f4a', borderRadius: '6px', color: '#ffffff', fontSize: '14px', boxSizing: 'border-box',
  };
  
  const inputReadOnlyStyle: React.CSSProperties = {
    ...inputStyle,
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    cursor: 'not-allowed',
  };
  
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#ffffff', padding: '32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => router.push('/panel')} style={{
              width: '40px', height: '40px', background: '#1a1f3a', border: '1px solid #2a2f4a',
              borderRadius: '8px', color: '#ffffff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FaArrowLeft />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Inventario de Productos</h1>
              <p style={{ color: '#8b92a8', fontSize: '14px', margin: '4px 0 0 0' }}>
                {productosFiltrados.length} productos
              </p>
            </div>
          </div>
          <button onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }} style={{
            padding: '10px 20px', background: showForm ? '#ef4444' : '#10b981',
            border: 'none', borderRadius: '8px', color: '#ffffff', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {showForm ? <FaMinus /> : <FaPlus />} {showForm ? 'Cancelar' : 'Nuevo Producto'}
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div style={{
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <FaSearch style={{ color: '#8b92a8', fontSize: '18px' }} />
            <input
              type="text"
              placeholder="Buscar por nombre del producto o SKU..."
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
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#ef4444',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '32px', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 24px 0' }}>
              {editingId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
            </h2>

            {/* Fotos - EDITABLE */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Fotos del Producto (múltiples) - Editable</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {formData.fotos.map((foto, i) => (
                  <div key={i} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img src={foto} alt={`Foto ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    <button onClick={() => eliminarFoto(i)} style={{
                      position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px',
                      background: '#ef4444', border: 'none', borderRadius: '50%', color: 'white',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} style={{
                  width: '100px', height: '100px', background: '#1a1f3a', border: '2px dashed #2a2f4a',
                  borderRadius: '8px', color: '#8b92a8', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}>
                  <FaUpload />
                  <span style={{fontSize:'11px'}}>Subir</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFotoUpload} style={{display:'none'}} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              {/* Producto - SOLO LECTURA */}
              <div>
                <label style={labelStyle}>Producto * (No editable)</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={(e) => !editingId && setFormData({...formData, nombre: e.target.value})} 
                  style={editingId ? inputReadOnlyStyle : inputStyle}
                  readOnly={!!editingId}
                />
              </div>
              
              {/* Categoría - SOLO LECTURA */}
              <div>
                <label style={labelStyle}>Categoría (No editable)</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <select 
                    value={formData.categoria_id} 
                    disabled={!!editingId}
                    style={editingId ? inputReadOnlyStyle : inputStyle}
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  {!editingId && (
                    <button onClick={() => setShowNuevaCategoria(true)} style={{
                      padding:'0 12px',background:'#4f46e5',border:'none',borderRadius:'6px',color:'white',cursor:'pointer',
                    }} title="Añadir categoría">
                      <FaPlus />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Marca - SOLO LECTURA */}
              <div>
                <label style={labelStyle}>Marca (No editable)</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <select 
                    value={formData.marca} 
                    disabled={!!editingId}
                    style={editingId ? inputReadOnlyStyle : inputStyle}
                  >
                    <option value="">Sin marca</option>
                    {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                  </select>
                  {!editingId && (
                    <button onClick={() => setShowNuevaMarca(true)} style={{
                      padding:'0 12px',background:'#4f46e5',border:'none',borderRadius:'6px',color:'white',cursor:'pointer',
                    }} title="Añadir marca">
                      <FaPlus />
                    </button>
                  )}
                </div>
              </div>
              
              {/* SKU - SOLO LECTURA */}
              <div>
                <label style={labelStyle}>SKU (No editable)</label>
                <input 
                  type="text" 
                  value={formData.sku} 
                  style={inputReadOnlyStyle}
                  readOnly
                />
              </div>
              
              {/* Descripción - EDITABLE */}
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelStyle}>Descripción - Editable</label>
                <textarea 
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                  rows={2} 
                  style={{...inputStyle,resize:'vertical'}} 
                />
              </div>
              
              {/* Stock - SOLO LECTURA */}
              <div>
                <label style={labelStyle}>Cantidad (Stock) - Solo lectura</label>
                <input 
                  type="number" 
                  value={formData.stock} 
                  style={inputReadOnlyStyle}
                  readOnly
                />
              </div>
              
              {/* Tasa BCV - EDITABLE */}
              <div>
                <label style={labelStyle}>💱 Tasa BCV (se aplica a todos los precios Bs) - Editable</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.tasa_bcv} 
                  onChange={(e) => setFormData({...formData, tasa_bcv: parseFloat(e.target.value)||0})} 
                  style={inputStyle} 
                />
              </div>
              
              {/* Precio Venta USD - EDITABLE */}
              <div>
                <label style={labelStyle}>💲 Precio Venta USD - Editable</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.precio_venta_usd||''} 
                  onChange={(e) => setFormData({...formData, precio_venta_usd: parseFloat(e.target.value)||0})} 
                  style={inputStyle} 
                />
                <div style={{fontSize:'11px',color:'#3b82f6',marginTop:'4px'}}>
                  ≈ Bs {((formData.precio_venta_usd||0)*formData.tasa_bcv).toFixed(2)}
                </div>
              </div>
              
              {/* Precio Mayor USD - EDITABLE */}
              <div>
                <label style={labelStyle}>💲 Precio Mayor USD - Editable</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.precio_mayor_usd||''} 
                  onChange={(e) => setFormData({...formData, precio_mayor_usd: parseFloat(e.target.value)||0})} 
                  style={inputStyle} 
                />
                <div style={{fontSize:'11px',color:'#3b82f6',marginTop:'4px'}}>
                  ≈ Bs {((formData.precio_mayor_usd||0)*formData.tasa_bcv).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Modal Nueva Categoría */}
            {!editingId && showNuevaCategoria && (
              <div style={{background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
                <h4 style={{margin:'0 0 12px 0',fontSize:'14px'}}>Nueva Categoría</h4>
                <div style={{display:'flex',gap:'8px'}}>
                  <input type="text" value={nuevaCategoria} onChange={(e)=>setNuevaCategoria(e.target.value)} placeholder="Nombre" style={{...inputStyle,flex:1}} />
                  <button onClick={agregarCategoria} style={{padding:'10px 16px',background:'#10b981',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}>
                    <FaSave /> Guardar
                  </button>
                  <button onClick={()=>{setShowNuevaCategoria(false);setNuevaCategoria('')}} style={{padding:'10px 16px',background:'#ef4444',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {/* Modal Nueva Marca */}
            {!editingId && showNuevaMarca && (
              <div style={{background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
                <h4 style={{margin:'0 0 12px 0',fontSize:'14px'}}>Nueva Marca</h4>
                <div style={{display:'flex',gap:'8px'}}>
                  <input type="text" value={nuevaMarca} onChange={(e)=>setNuevaMarca(e.target.value)} placeholder="Nombre" style={{...inputStyle,flex:1}} />
                  <button onClick={agregarMarca} style={{padding:'10px 16px',background:'#10b981',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}>
                    <FaSave />
                  </button>
                  <button onClick={()=>{setShowNuevaMarca(false);setNuevaMarca('')}} style={{padding:'10px 16px',background:'#ef4444',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button onClick={()=>{setShowForm(false);resetForm()}} style={{padding:'12px 24px',background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',color:'#ffffff',fontWeight:'600',cursor:'pointer'}}>
                Cancelar
              </button>
              <button onClick={handleGuardar} style={{padding:'12px 24px',background:'#10b981',border:'none',borderRadius:'8px',color:'#ffffff',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}>
                <FaSave /> {editingId?'Actualizar':'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista */}
        {productosFiltrados.length === 0 ? (
          <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:'12px',padding:'60px 20px',textAlign:'center'}}>
            <FaBox style={{fontSize:'48px',color:'#6b7280',marginBottom:'16px'}} />
            <h3>{busqueda ? 'No se encontraron productos' : 'No hay productos'}</h3>
            <p style={{color:'#8b92a8'}}>{busqueda ? 'Intenta con otra búsqueda' : 'Haz click en "Nuevo Producto"'}</p>
          </div>
        ) : (
          <div style={{display:'grid',gap:'12px'}}>
            {productosFiltrados.map(p => (
              <div key={p.id} style={{background:'#111827',border:'1px solid #1f2937',borderRadius:'12px',padding:'20px',display:'flex',gap:'16px',alignItems:'center'}}>
                <div style={{width:'80px',height:'80px',background:'#1a1f3a',borderRadius:'8px',overflow:'hidden',flexShrink:0}}>
                  {p.fotos && p.fotos.length > 0 ? (
                    <img src={p.fotos[0]} alt={p.nombre} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  ) : (
                    <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280'}}>
                      <FaImage />
                    </div>
                  )}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px',alignItems:'center'}}>
                    <h3 style={{fontSize:'16px',fontWeight:'700',margin:0}}>{p.nombre}</h3>
                    {p.marca && (
                      <span style={{padding:'4px 10px',background:'rgba(59,130,246,0.2)',color:'#3b82f6',borderRadius:'20px',fontSize:'11px',fontWeight:'600'}}>
                        {p.marca}
                      </span>
                    )}
                    {p.categoria_nombre && (
                      <span style={{padding:'4px 10px',background:'rgba(139,92,246,0.2)',color:'#a78bfa',borderRadius:'20px',fontSize:'11px',fontWeight:'600'}}>
                        {p.categoria_nombre}
                      </span>
                    )}
                    {p.sku && (
                      <span style={{padding:'4px 10px',background:'rgba(107,114,128,0.2)',color:'#9ca3af',borderRadius:'20px',fontSize:'11px',fontFamily:'monospace'}}>
                        SKU: {p.sku}
                      </span>
                    )}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',fontSize:'13px',color:'#8b92a8'}}>
                    <div>
                      <div>📦 Stock: <strong style={{color:'#ffffff'}}>{p.stock}</strong></div>
                      <div>💲 Venta: <strong style={{color:'#10b981'}}>${p.precio_venta_usd.toFixed(2)}</strong> ≈ Bs {(p.precio_venta_usd*(p.tasa_bcv||tasaBCV)).toFixed(2)}</div>
                      <div>💲 Mayor: <strong style={{color:'#f59e0b'}}>${(p.precio_mayor_usd||0).toFixed(2)}</strong> ≈ Bs {((p.precio_mayor_usd||0)*(p.tasa_bcv||tasaBCV)).toFixed(2)}</div>
                    </div>
                    <div>
                      <div>👤 Creado por: <strong style={{color:'#ffffff'}}>{p.creado_por_nombre||'Desconocido'}</strong></div>
                      <div style={{fontSize:'11px',color:'#6b7280'}}>📅 {new Date(p.created_at).toLocaleDateString('es-VE')}</div>
                    </div>
                  </div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={()=>handleEditar(p)} style={{padding:'8px 12px',background:'rgba(59,130,246,0.1)',border:'none',borderRadius:'6px',color:'#3b82f6',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:'600'}}>
                    <FaEdit />
                  </button>
                  <button onClick={()=>handleEliminar(p.id)} style={{padding:'8px 12px',background:'rgba(239,68,68,0.1)',border:'none',borderRadius:'6px',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:'600'}}>
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