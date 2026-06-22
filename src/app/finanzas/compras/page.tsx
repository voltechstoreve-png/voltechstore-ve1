'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft, FaPlus, FaMinus, FaEdit, FaTrash, FaSave, FaShoppingCart,
  FaDollarSign, FaCalendarAlt, FaUser, FaBox, FaBarcode
} from 'react-icons/fa';

interface Proveedor { id: string; nombre: string; telefono?: string; }
interface Categoria { id: string; nombre: string; }
interface Marca { id: string; nombre: string; }
interface Producto { 
  id: string; 
  nombre: string; 
  sku?: string; 
  marca?: string; 
  categoria_id?: string; 
  stock: number;
  precio_venta_usd?: number;
  precio_mayor_usd?: number;
}

interface Compra {
  id: string;
  fecha: string;
  proveedor_id?: string;
  proveedor_nombre?: string;
  producto_id?: string;
  producto_nombre?: string;
  marca?: string;
  categoria_id?: string;
  categoria_nombre?: string;
  sku?: string;
  cantidad: number;
  precio_unitario_usd: number;
  tasa_aplicada: number;
  precio_unitario_bs: number;
  total_usd: number;
  total_bs: number;
  notas?: string;
  creado_por_nombre?: string;
  created_at: string;
}

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// ✅ SKU: CAT-MAR-PROD-001 (ej: AUD-XIA-AUD-001)
const generarSKU = (categoria: string, marca: string, producto: string, existente: string[] = []) => {
  const cat = categoria ? categoria.substring(0, 3).toUpperCase().replace(/\s/g, '') : 'GEN';
  const mar = marca ? marca.substring(0, 3).toUpperCase().replace(/\s/g, '') : 'GEN';
  const prod = producto ? producto.substring(0, 3).toUpperCase().replace(/\s/g, '') : 'XXX';
  
  let num = 1;
  let sku = `${cat}-${mar}-${prod}-${String(num).padStart(3, '0')}`;
  
  while (existente.includes(sku)) {
    num++;
    sku = `${cat}-${mar}-${prod}-${String(num).padStart(3, '0')}`;
  }
  
  return sku;
};

export default function ComprasProductosPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tasaBCV, setTasaBCV] = useState(690);
  const [skusExistentes, setSkusExistentes] = useState<string[]>([]);
  
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [showNuevaMarca, setShowNuevaMarca] = useState(false);
  const [showNuevoProducto, setShowNuevoProducto] = useState(false);
  const [nuevoProveedor, setNuevoProveedor] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [nuevoProducto, setNuevoProducto] = useState('');
  const [nuevoProductoSku, setNuevoProductoSku] = useState('');
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    proveedor_id: '',
    producto_id: '',
    producto_nombre: '',
    marca: '',
    categoria_id: '',
    sku: '',
    cantidad: 1,
    precio_unitario_usd: 0,
    tasa_aplicada: 690,
    notas: '',
  });

  useEffect(() => {
    fetchCompras();
    fetchProveedores();
    fetchCategorias();
    fetchMarcas();
    fetchProductos();
    fetchTasa();
    fetchSkusExistentes();
  }, []);

  const fetchSkusExistentes = async () => {
    const { data } = await supabase.from('productos').select('sku').not('sku', 'is', null);
    const skus = data?.map(p => p.sku).filter(Boolean) || [];
    setSkusExistentes(skus);
  };

  const fetchTasa = async () => {
    const { data } = await supabase.from('tasa_dia').select('tasa_bs').eq('fecha', new Date().toISOString().split('T')[0]).single();
    if (data) {
      setTasaBCV(data.tasa_bs);
      setFormData(f => ({...f, tasa_aplicada: data.tasa_bs}));
    }
  };

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('compras_productos').select('*').order('created_at', {ascending: false});
      if (error) throw error;
      setCompras(data || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    const { data } = await supabase.from('proveedores').select('*').eq('activo', true).order('nombre');
    setProveedores(data || []);
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
    const { data } = await supabase
      .from('productos')
      .select('id,nombre,sku,marca,categoria_id,stock,precio_venta_usd,precio_mayor_usd')
      .not('nombre', 'like', '__MARCA__%')
      .order('nombre');
    setProductos(data || []);
  };

  const agregarProveedor = async () => {
    if (!nuevoProveedor.trim()) return;
    if (proveedores.some(p => normalizar(p.nombre) === normalizar(nuevoProveedor))) {
      alert('⚠️ Ya existe');
      return;
    }
    const { data, error } = await supabase.from('proveedores')
      .insert([{ nombre: nuevoProveedor.trim(), creado_por: user?.id }])
      .select()
      .single();
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setProveedores([...proveedores, data]);
    setFormData({...formData, proveedor_id: data.id});
    setNuevoProveedor('');
    setShowNuevoProveedor(false);
  };

  const agregarCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    if (categorias.some(c => normalizar(c.nombre) === normalizar(nuevaCategoria))) {
      alert('⚠️ Ya existe');
      return;
    }
    const { data, error } = await supabase.from('categorias_productos')
      .insert([{ nombre: nuevaCategoria.trim(), color: '#4f46e5' }])
      .select()
      .single();
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setCategorias([...categorias, data]);
    setFormData({...formData, categoria_id: data.id});
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

  // ✅ CORREGIDO: Solo genera SKU si NO hay producto seleccionado
  const actualizarSKU = () => {
    // Si hay un producto seleccionado, NO generar SKU
    if (formData.producto_id) {
      return;
    }
    
    // Obtener valores actuales del formulario
    const cat = categorias.find(c => c.id === formData.categoria_id);
    const nombreCat = cat?.nombre || '';
    const nombreMarca = formData.marca || '';
    const nombreProd = formData.producto_nombre || '';
    
    // Solo generar si hay al menos marca o categoría
    if (!nombreMarca && !nombreCat && !nombreProd) {
      return;
    }
    
    const skuAuto = generarSKU(
      nombreCat,
      nombreMarca,
      nombreProd,
      skusExistentes
    );
    
    setFormData(prev => ({
      ...prev,
      sku: skuAuto,
    }));
  };

  const buscarProductoPorSKU = async (sku: string) => {
    if (!sku.trim()) return;
    
    const { data, error } = await supabase
      .from('productos')
      .select('id,nombre,sku,marca,categoria_id,stock,precio_venta_usd,precio_mayor_usd')
      .eq('sku', sku.trim())
      .single();
    
    if (error || !data) {
      return;
    }
    
    setFormData({
      ...formData,
      producto_id: data.id,
      producto_nombre: data.nombre,
      sku: data.sku || '',
      marca: data.marca || formData.marca,
      categoria_id: data.categoria_id || formData.categoria_id,
      cantidad: 1,
    });
  };

  const agregarProducto = async () => {
    if (!nuevoProducto.trim()) return;
    const nombreUsuario = profile ? `${profile.nombre} ${profile.apellido}` : '';
    
    const cat = categorias.find(c => c.id === formData.categoria_id);
    const skuFinal = nuevoProductoSku.trim() || generarSKU(
      cat?.nombre || '',
      formData.marca || '',
      nuevoProducto,
      skusExistentes
    );
    
    const { data, error } = await supabase.from('productos').insert([{
      nombre: nuevoProducto.trim(),
      sku: skuFinal,
      marca: formData.marca || null,
      categoria_id: formData.categoria_id || null,
      stock: 0,
      creado_por: user?.id,
      creado_por_nombre: nombreUsuario,
    }]).select().single();
    
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    
    setProductos([...productos, data]);
    setSkusExistentes([...skusExistentes, skuFinal]);
    setFormData({
      ...formData,
      producto_id: data.id,
      producto_nombre: data.nombre,
      sku: skuFinal,
    });
    setNuevoProducto('');
    setNuevoProductoSku('');
    setShowNuevoProducto(false);
  };

  const totalUsd = formData.cantidad * formData.precio_unitario_usd;
  const totalBs = totalUsd * formData.tasa_aplicada;
  const precioUnitBs = formData.precio_unitario_usd * formData.tasa_aplicada;

  // ✅ CORREGIDO: Al seleccionar producto, genera SKU basado en cat+marca+producto
  const handleProductoChange = (productoId: string) => {
    const prod = productos.find(p => p.id === productoId);
    if (prod) {
      // Obtener categoría y marca del producto seleccionado
      const cat = categorias.find(c => c.id === prod.categoria_id);
      const nombreCat = cat?.nombre || '';
      const nombreMarca = prod.marca || '';
      
      // Generar NUEVO SKU basado en los datos del producto
      const nuevoSKU = generarSKU(
        nombreCat,
        nombreMarca,
        prod.nombre,
        skusExistentes
      );
      
      setFormData({
        ...formData,
        producto_id: productoId,
        producto_nombre: prod.nombre,
        marca: prod.marca || '',
        categoria_id: prod.categoria_id || '',
        sku: nuevoSKU,  // ← Usar el SKU generado
      });
    } else {
      setFormData({
        ...formData, 
        producto_id: productoId, 
        producto_nombre: '',
        marca: '',
        categoria_id: '',
        sku: ''
      });
      // Generar SKU automático si no hay producto
      setTimeout(() => actualizarSKU(), 100);
    }
  };

  const handleGuardar = async () => {
    if (!formData.proveedor_id || !formData.cantidad || !formData.precio_unitario_usd) {
      alert('⚠️ Completa proveedor, cantidad y precio');
      return;
    }

    try {
      const nombreUsuario = profile ? `${profile.nombre} ${profile.apellido}` : '';
      const prod = productos.find(p => p.id === formData.producto_id);
      const prov = proveedores.find(p => p.id === formData.proveedor_id);
      const cat = categorias.find(c => c.id === formData.categoria_id);
      
      const dataToSave: any = {
        ...formData,
        proveedor_nombre: prov?.nombre || '',
        producto_nombre: formData.producto_nombre || prod?.nombre || 'Producto nuevo',
        categoria_nombre: cat?.nombre || '',
        precio_unitario_bs: precioUnitBs,
        total_usd: totalUsd,
        total_bs: totalBs,
        creado_por: user?.id,
        creado_por_nombre: nombreUsuario,
      };

      if (editingId) {
        await supabase.from('compras_productos').update(dataToSave).eq('id', editingId);
      } else {
        const { error } = await supabase.from('compras_productos')
          .insert([dataToSave]);
        
        if (error) throw error;
        
        if (formData.producto_id) {
          const prodActual = productos.find(p => p.id === formData.producto_id);
          const nuevoStock = (prodActual?.stock || 0) + formData.cantidad;
          await supabase.from('productos').update({
            stock: nuevoStock,
            precio_mayor_usd: formData.precio_unitario_usd,
            updated_at: new Date().toISOString(),
          }).eq('id', formData.producto_id);
        } else if (formData.producto_nombre) {
          await supabase.from('productos').insert([{
            nombre: formData.producto_nombre,
            marca: formData.marca || null,
            categoria_id: formData.categoria_id || null,
            sku: formData.sku || null,
            stock: formData.cantidad,
            precio_mayor_usd: formData.precio_unitario_usd,
            creado_por: user?.id,
            creado_por_nombre: nombreUsuario,
          }]);
        }
      }
      
      alert('✅ Compra registrada y stock actualizado');
      setShowForm(false);
      resetForm();
      fetchCompras();
      fetchProductos();
      fetchSkusExistentes();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      proveedor_id: '',
      producto_id: '',
      producto_nombre: '',
      marca: '',
      categoria_id: '',
      sku: '',
      cantidad: 1,
      precio_unitario_usd: 0,
      tasa_aplicada: tasaBCV,
      notas: '',
    });
    setEditingId(null);
  };

  const handleEditar = (c: Compra) => {
    setEditingId(c.id);
    setFormData({
      fecha: c.fecha,
      proveedor_id: c.proveedor_id || '',
      producto_id: c.producto_id || '',
      producto_nombre: c.producto_nombre || '',
      marca: c.marca || '',
      categoria_id: c.categoria_id || '',
      sku: c.sku || '',
      cantidad: c.cantidad,
      precio_unitario_usd: c.precio_unitario_usd,
      tasa_aplicada: c.tasa_aplicada,
      notas: c.notas || '',
    });
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta compra?')) return;
    await supabase.from('compras_productos').delete().eq('id', id);
    fetchCompras();
  };

  const totalGeneralUsd = compras.reduce((s, c) => s + c.total_usd, 0);
  const totalGeneralBs = compras.reduce((s, c) => s + c.total_bs, 0);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#1a1f3a',
    border: '1px solid #2a2f4a',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    boxSizing: 'border-box',
  };
  
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: '#8b92a8',
    marginBottom: '6px',
  };

  if (loading) {
    return <div style={{padding:'32px',textAlign:'center'}}><p>Cargando...</p></div>;
  }

  return (
    <div style={{minHeight:'100vh',background:'#0a0e1a',color:'#ffffff',padding:'32px'}}>
      <div style={{maxWidth:'1400px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <button onClick={()=>router.push('/panel')} style={{width:'40px',height:'40px',background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',color:'#ffffff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <FaArrowLeft />
            </button>
            <div>
              <h1 style={{fontSize:'24px',fontWeight:'700',margin:0}}>Compras de Productos</h1>
              <p style={{color:'#8b92a8',fontSize:'14px',margin:'4px 0 0 0'}}>
                {compras.length} compras • Total: ${totalGeneralUsd.toFixed(2)} / Bs {totalGeneralBs.toFixed(2)}
              </p>
            </div>
          </div>
          <button 
            onClick={()=>{setShowForm(!showForm); if(showForm) resetForm()}} 
            style={{padding:'10px 20px',background:showForm?'#ef4444':'#10b981',border:'none',borderRadius:'8px',color:'#ffffff',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}
          >
            {showForm ? <FaMinus /> : <FaPlus />} {showForm ? 'Cancelar' : 'Nueva Compra'}
          </button>
        </div>

        {showForm && (
          <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:'12px',padding:'32px',marginBottom:'32px'}}>
            <h2 style={{fontSize:'20px',fontWeight:'700',margin:'0 0 24px 0'}}>
              {editingId ? '✏️ Editar Compra' : '➕ Nueva Compra'}
            </h2>
            
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input 
                  type="date" 
                  value={formData.fecha} 
                  onChange={(e)=>setFormData({...formData,fecha:e.target.value})} 
                  style={inputStyle} 
                />
              </div>
              
              <div>
                <label style={labelStyle}>Proveedor *</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <select 
                    value={formData.proveedor_id} 
                    onChange={(e)=>setFormData({...formData,proveedor_id:e.target.value})} 
                    style={{...inputStyle,flex:1}}
                  >
                    <option value="">Seleccionar...</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <button 
                    onClick={()=>setShowNuevoProveedor(true)} 
                    style={{padding:'0 12px',background:'#4f46e5',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}} 
                    title="Añadir proveedor"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>
                  <FaBarcode style={{marginRight:'6px'}} />
                  SKU (auto-generado: CAT-MAR-PROD-001)
                </label>
                <input 
                  type="text" 
                  value={formData.sku} 
                  onChange={(e)=>setFormData({...formData,sku:e.target.value})}
                  onBlur={(e)=>buscarProductoPorSKU(e.target.value)}
                  placeholder="Se genera automáticamente"
                  style={{...inputStyle, backgroundColor: formData.sku && formData.sku.split('-').length === 4 ? '#0f3d2e' : '#1a1f3a'}}
                  readOnly={!!formData.producto_id}
                />
              </div>
              
              <div>
                <label style={labelStyle}>Producto (opcional, para actualizar stock)</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <select 
                    value={formData.producto_id} 
                    onChange={(e)=>handleProductoChange(e.target.value)}
                    style={{...inputStyle,flex:1}}
                  >
                    <option value="">Sin producto / Crear nuevo</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} - Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={()=>setShowNuevoProducto(true)} 
                    style={{padding:'0 12px',background:'#4f46e5',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}} 
                    title="Añadir producto"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Marca</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <select 
                    value={formData.marca} 
                    onChange={(e)=>{
                      setFormData({...formData,marca:e.target.value});
                      setTimeout(() => actualizarSKU(), 100);
                    }} 
                    style={{...inputStyle,flex:1}}
                  >
                    <option value="">Sin marca</option>
                    {marcas.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                  </select>
                  <button 
                    onClick={()=>setShowNuevaMarca(true)} 
                    style={{padding:'0 12px',background:'#4f46e5',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Categoría</label>
                <div style={{display:'flex',gap:'8px'}}>
                  <select 
                    value={formData.categoria_id} 
                    onChange={(e)=>{
                      setFormData({...formData,categoria_id:e.target.value});
                      setTimeout(() => actualizarSKU(), 100);
                    }} 
                    style={{...inputStyle,flex:1}}
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                  <button 
                    onClick={()=>setShowNuevaCategoria(true)} 
                    style={{padding:'0 12px',background:'#4f46e5',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Cantidad *</label>
                <input 
                  type="number" 
                  value={formData.cantidad} 
                  onChange={(e)=>setFormData({...formData,cantidad:parseInt(e.target.value)||0})} 
                  style={inputStyle} 
                />
              </div>
              
              <div>
                <label style={labelStyle}>💲 Precio Unitario USD *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.precio_unitario_usd||''} 
                  onChange={(e)=>setFormData({...formData,precio_unitario_usd:parseFloat(e.target.value)||0})} 
                  style={inputStyle} 
                />
              </div>
              
              <div>
                <label style={labelStyle}>💱 Tasa BCV (personalizable)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={formData.tasa_aplicada} 
                  onChange={(e)=>setFormData({...formData,tasa_aplicada:parseFloat(e.target.value)||0})} 
                  style={inputStyle} 
                />
              </div>
              
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelStyle}>Notas</label>
                <textarea 
                  value={formData.notas} 
                  onChange={(e)=>setFormData({...formData,notas:e.target.value})} 
                  rows={2} 
                  style={{...inputStyle,resize:'vertical'}} 
                />
              </div>
            </div>

            <div style={{background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',padding:'20px',marginBottom:'24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                <span>Precio Unitario Bs:</span>
                <span style={{fontWeight:'600',color:'#3b82f6'}}>Bs {precioUnitBs.toFixed(2)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                <span>Total USD:</span>
                <span style={{fontWeight:'700',color:'#10b981'}}>${totalUsd.toFixed(2)}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',paddingTop:'8px',borderTop:'1px solid #2a2f4a'}}>
                <span style={{fontWeight:'700'}}>Total Bs:</span>
                <span style={{fontWeight:'700',color:'#3b82f6'}}>Bs {totalBs.toFixed(2)}</span>
              </div>
            </div>

            {showNuevoProveedor && (
              <div style={{background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
                <h4 style={{margin:'0 0 12px 0',fontSize:'14px'}}>Nuevo Proveedor</h4>
                <div style={{display:'flex',gap:'8px'}}>
                  <input 
                    type="text" 
                    value={nuevoProveedor} 
                    onChange={(e)=>setNuevoProveedor(e.target.value)} 
                    placeholder="Nombre" 
                    style={{...inputStyle,flex:1}} 
                  />
                  <button 
                    onClick={agregarProveedor} 
                    style={{padding:'10px 16px',background:'#10b981',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    <FaSave /> Guardar
                  </button>
                  <button 
                    onClick={()=>{setShowNuevoProveedor(false);setNuevoProveedor('')}} 
                    style={{padding:'10px 16px',background:'#ef4444',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {showNuevaCategoria && (
              <div style={{background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
                <h4 style={{margin:'0 0 12px 0',fontSize:'14px'}}>Nueva Categoría</h4>
                <div style={{display:'flex',gap:'8px'}}>
                  <input 
                    type="text" 
                    value={nuevaCategoria} 
                    onChange={(e)=>setNuevaCategoria(e.target.value)} 
                    placeholder="Nombre" 
                    style={{...inputStyle,flex:1}} 
                  />
                  <button 
                    onClick={agregarCategoria} 
                    style={{padding:'10px 16px',background:'#10b981',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    <FaSave />
                  </button>
                  <button 
                    onClick={()=>{setShowNuevaCategoria(false);setNuevaCategoria('')}} 
                    style={{padding:'10px 16px',background:'#ef4444',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {showNuevaMarca && (
              <div style={{background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
                <h4 style={{margin:'0 0 12px 0',fontSize:'14px'}}>Nueva Marca</h4>
                <div style={{display:'flex',gap:'8px'}}>
                  <input 
                    type="text" 
                    value={nuevaMarca} 
                    onChange={(e)=>setNuevaMarca(e.target.value)} 
                    placeholder="Nombre" 
                    style={{...inputStyle,flex:1}} 
                  />
                  <button 
                    onClick={agregarMarca} 
                    style={{padding:'10px 16px',background:'#10b981',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    <FaSave />
                  </button>
                  <button 
                    onClick={()=>{setShowNuevaMarca(false);setNuevaMarca('')}} 
                    style={{padding:'10px 16px',background:'#ef4444',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            
            {showNuevoProducto && (
              <div style={{background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
                <h4 style={{margin:'0 0 12px 0',fontSize:'14px'}}>Nuevo Producto (se creará en inventario)</h4>
                <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                  <input 
                    type="text" 
                    value={nuevoProducto} 
                    onChange={(e)=>setNuevoProducto(e.target.value)} 
                    placeholder="Nombre del producto" 
                    style={{...inputStyle,flex:1}} 
                  />
                </div>
                <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                  <input 
                    type="text" 
                    value={nuevoProductoSku} 
                    onChange={(e)=>setNuevoProductoSku(e.target.value)} 
                    placeholder="SKU (déjalo vacío para generar automático)" 
                    style={{...inputStyle,flex:1}} 
                  />
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button 
                    onClick={agregarProducto} 
                    style={{padding:'10px 16px',background:'#10b981',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    <FaSave /> Crear
                  </button>
                  <button 
                    onClick={()=>{setShowNuevoProducto(false);setNuevoProducto('');setNuevoProductoSku('')}} 
                    style={{padding:'10px 16px',background:'#ef4444',border:'none',borderRadius:'6px',color:'white',cursor:'pointer'}}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
              <button 
                onClick={()=>{setShowForm(false);resetForm()}} 
                style={{padding:'12px 24px',background:'#1a1f3a',border:'1px solid #2a2f4a',borderRadius:'8px',color:'#ffffff',fontWeight:'600',cursor:'pointer'}}
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardar} 
                style={{padding:'12px 24px',background:'#10b981',border:'none',borderRadius:'8px',color:'#ffffff',fontWeight:'600',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}
              >
                <FaSave /> {editingId?'Actualizar':'Registrar Compra'}
              </button>
            </div>
          </div>
        )}

        {compras.length === 0 ? (
          <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:'12px',padding:'60px 20px',textAlign:'center'}}>
            <FaShoppingCart style={{fontSize:'48px',color:'#6b7280',marginBottom:'16px'}} />
            <h3>No hay compras registradas</h3>
            <p style={{color:'#8b92a8'}}>Haz click en "Nueva Compra"</p>
          </div>
        ) : (
          <div style={{display:'grid',gap:'12px'}}>
            {compras.map(c => (
              <div 
                key={c.id} 
                style={{background:'#111827',border:'1px solid #1f2937',borderRadius:'12px',padding:'20px',display:'flex',gap:'16px',alignItems:'center'}}
              >
                <div style={{width:'50px',height:'50px',background:'linear-gradient(135deg,#f59e0b,#d97706)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',color:'white',flexShrink:0}}>
                  <FaShoppingCart />
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'8px',alignItems:'center'}}>
                    <h3 style={{fontSize:'16px',fontWeight:'700',margin:0}}>
                      {c.producto_nombre || 'Producto'}
                    </h3>
                    {c.marca && (
                      <span style={{padding:'4px 10px',background:'rgba(59,130,246,0.2)',color:'#3b82f6',borderRadius:'20px',fontSize:'11px',fontWeight:'600'}}>
                        {c.marca}
                      </span>
                    )}
                    {c.categoria_nombre && (
                      <span style={{padding:'4px 10px',background:'rgba(139,92,246,0.2)',color:'#a78bfa',borderRadius:'20px',fontSize:'11px',fontWeight:'600'}}>
                        {c.categoria_nombre}
                      </span>
                    )}
                    {c.sku && (
                      <span style={{padding:'4px 10px',background:'rgba(107,114,128,0.2)',color:'#9ca3af',borderRadius:'20px',fontSize:'11px',fontFamily:'monospace'}}>
                        SKU: {c.sku}
                      </span>
                    )}
                    <span style={{padding:'4px 10px',background:'rgba(16,185,129,0.2)',color:'#10b981',borderRadius:'20px',fontSize:'11px',fontWeight:'600'}}>
                      x{c.cantidad}
                    </span>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',fontSize:'13px',color:'#8b92a8'}}>
                    <div>
                      <div>📅 {new Date(c.fecha).toLocaleDateString('es-VE')}</div>
                      <div>🏪 Proveedor: <strong style={{color:'#ffffff'}}>{c.proveedor_nombre||'N/A'}</strong></div>
                      <div>💲 Unitario: ${c.precio_unitario_usd.toFixed(2)} ≈ Bs {c.precio_unitario_bs.toFixed(2)}</div>
                    </div>
                    <div>
                      <div>👤 {c.creado_por_nombre}</div>
                      {c.notas && <div style={{fontSize:'11px',color:'#6b7280'}}>📝 {c.notas}</div>}
                    </div>
                  </div>
                </div>
                <div style={{textAlign:'right',marginRight:'16px'}}>
                  <div style={{fontSize:'20px',fontWeight:'700',color:'#10b981'}}>${c.total_usd.toFixed(2)}</div>
                  <div style={{fontSize:'12px',color:'#3b82f6'}}>Bs {c.total_bs.toFixed(2)}</div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button 
                    onClick={()=>handleEditar(c)} 
                    style={{padding:'8px 12px',background:'rgba(59,130,246,0.1)',border:'none',borderRadius:'6px',color:'#3b82f6',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:'600'}}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={()=>handleEliminar(c.id)} 
                    style={{padding:'8px 12px',background:'rgba(239,68,68,0.1)',border:'none',borderRadius:'6px',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',fontWeight:'600'}}
                  >
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