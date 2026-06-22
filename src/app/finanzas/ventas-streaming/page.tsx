'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaFileImport,
  FaFileExport,
  FaTrash,
  FaWhatsapp,
  FaTv,
  FaSave,
  FaUserTie,
  FaEdit,
  FaRedo,
  FaCopy,
  FaEnvelope,
  FaDollarSign,
  FaCalendarAlt,
  FaCheckCircle
} from 'react-icons/fa';

interface Plataforma {
  id: string;
  nombre: string;
  costo_usd: number;
  precio_venta_usd: number;
  duracion_meses: number;
  dias_disponibles: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  dias_regalo: number;
  monto_bs: number;
  renueva: string;
  tiene_descuento: boolean;
}

interface VentaStreaming {
  id: string;
  fecha: string;
  vendedor_id: string;
  vendedor_nombre: string;
  comprador: string;
  contacto_whatsapp: string;
  metodo_pago: string;
  plataforma: string;
  fecha_vencimiento: string;
  dias_disponibles: number;
  total_costo_usd: number;
  total_venta_usd: number;
  total_ganancia_usd: number;
  monto_bs: number;
  renueva: string;
  streaming_hub_id?: string;
  cuenta_id?: string;
  tasa_bcv?: number;
  created_at: string;
}

interface Vendedor {
  id: string;
  nombre: string;
  apellido: string;
  rol?: string;
  supervisor_id?: string;
}

interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  whatsapp: string;
  email?: string;
}

interface CuentaStreaming {
  id: string;
  plataforma: string;
  nombre_perfil?: string;
  correo: string;
  contrasena: string;
  pin?: string;
  fecha_vencimiento?: string;
}

interface PlataformaInventario {
  id: string;
  plataforma: string;
  precio_venta_sugerido?: number;
}

export default function VentasStreamingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('ventas');
  const [ventas, setVentas] = useState<VentaStreaming[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tasaBCV, setTasaBCV] = useState(477.14);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cuentasStreaming, setCuentasStreaming] = useState<CuentaStreaming[]>([]);
  const [plataformasInventario, setPlataformasInventario] = useState<PlataformaInventario[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState<VentaStreaming | null>(null);
  const [whatsappType, setWhatsappType] = useState<'cuenta' | 'cobro'>('cuenta');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [showNuevaPlataforma, setShowNuevaPlataforma] = useState(false);
  const [nuevaPlataformaNombre, setNuevaPlataformaNombre] = useState('');
  
  const [vendedor, setVendedor] = useState('');
  const [comprador, setComprador] = useState('');
  const [contacto, setContacto] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [streamingHubId, setStreamingHubId] = useState('');
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([{
    id: '1',
    nombre: '',
    costo_usd: 0,
    precio_venta_usd: 0,
    duracion_meses: 1,
    dias_disponibles: 30,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_vencimiento: '',
    dias_regalo: 0,
    monto_bs: 0,
    renueva: 'Pendiente',
    tiene_descuento: false,
  }]);

  useEffect(() => {
    fetchVentas();
    fetchCuentas();
    fetchTasa();
    fetchVendedores();
    fetchClientes();
    fetchCuentasStreaming();
    fetchPlataformasInventario();
  }, []);

  const fetchPlataformasInventario = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario_streaming')
        .select('id, plataforma, precio_venta_sugerido')
        .order('plataforma');
      if (error) throw error;
      setPlataformasInventario(data || []);
    } catch (error) {
      console.error('Error fetching plataformas inventario:', error);
    }
  };

  const fetchVendedores = async () => {
    try {
      console.log('📥 Fetching vendedores...');
      console.log('👤 User role:', profile?.rol);
      console.log('👤 User ID:', user?.id);
      
      let query = supabase
        .from('profiles')
        .select('id, nombre, apellido, rol, supervisor_id');

      const { data: allData, error: queryError } = await query;
      
      if (queryError) {
        console.error('❌ Error en query de profiles:', queryError);
        return;
      }
      
      let filteredData = allData || [];
      
      if (profile?.rol === 'admin') {
        filteredData = filteredData.filter(p => p.rol === 'empleado' || p.rol === 'socio');
      } else if (profile?.rol === 'socio') {
        filteredData = filteredData.filter(p => p.supervisor_id === user?.id && p.rol === 'empleado');
      } else if (profile?.rol === 'empleado') {
        filteredData = filteredData.filter(p => p.id === user?.id);
      }
      
      console.log('✅ Vendedores cargados:', filteredData);
      setVendedores(filteredData);
      
      if (profile?.rol === 'empleado' && filteredData.length > 0) {
        setVendedor(`${filteredData[0].nombre} ${filteredData[0].apellido}`);
      }
    } catch (error) {
      console.error('❌ Error completo fetching vendedores:', error);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, apellido, whatsapp, email')
        .eq('estado', 'activo');
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    }
  };

  const fetchCuentasStreaming = async () => {
    try {
      const { data, error } = await supabase
        .from('streaming_hub')
        .select('*')
        .eq('estado', 'disponible');
      if (error) throw error;
      setCuentasStreaming(data || []);
    } catch (error) {
      console.error('Error fetching cuentas streaming:', error);
    }
  };

  const fetchVentas = async () => {
    try {
      const { data, error } = await supabase
        .from('ventas_streaming')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVentas(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCuentas = async () => {
    const { data } = await supabase
      .from('cuentas')
      .select('id, nombre, moneda')
      .eq('activa', true);
    setCuentas(data || []);
  };

  const fetchTasa = async () => {
    const { data } = await supabase
      .from('tasa_dia')
      .select('tasa_bs')
      .eq('fecha', new Date().toISOString().split('T')[0])
      .single();
    if (data) setTasaBCV(data.tasa_bs);
  };

  const handleClienteSelect = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (cliente) {
      setComprador(`${cliente.nombre} ${cliente.apellido}`);
      setContacto(cliente.whatsapp || '');
    }
  };

  const handleStreamingHubSelect = (hubId: string) => {
    setStreamingHubId(hubId);
    const cuenta = cuentasStreaming.find(c => c.id === hubId);
    if (cuenta) {
      if (!comprador) setComprador(cuenta.correo.split('@')[0]);
      setPlataformas([{
        id: '1',
        nombre: cuenta.plataforma,
        costo_usd: 0,
        precio_venta_usd: 0,
        duracion_meses: 1,
        dias_disponibles: 30,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_vencimiento: cuenta.fecha_vencimiento || '',
        dias_regalo: 0,
        monto_bs: 0,
        renueva: 'Pendiente',
        tiene_descuento: false,
      }]);
    }
  };

  const agregarPlataforma = () => {
    setPlataformas([...plataformas, {
      id: Date.now().toString(),
      nombre: '',
      costo_usd: 0,
      precio_venta_usd: 0,
      duracion_meses: 1,
      dias_disponibles: 30,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      dias_regalo: 0,
      monto_bs: 0,
      renueva: 'Pendiente',
      tiene_descuento: false,
    }]);
  };

  const eliminarPlataforma = (id: string) => {
    if (plataformas.length > 1) {
      setPlataformas(plataformas.filter(p => p.id !== id));
    }
  };

  const calcularDiasDisponibles = (fechaInicio: string, fechaVencimiento: string) => {
    if (!fechaInicio || !fechaVencimiento) return 0;
    const inicio = new Date(fechaInicio);
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - inicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calcularFechaVencimiento = (fechaInicio: string, diasDisponibles: number) => {
    if (!fechaInicio || diasDisponibles <= 0) return '';
    const inicio = new Date(fechaInicio);
    inicio.setDate(inicio.getDate() + diasDisponibles);
    return inicio.toISOString().split('T')[0];
  };

  const actualizarPlataforma = (id: string, campo: string, valor: any) => {
    setPlataformas(plataformas.map(p => {
      if (p.id === id) {
        const updated = { ...p, [campo]: valor };
        
        if (campo === 'fecha_inicio') {
          if (p.dias_disponibles > 0) {
            updated.fecha_vencimiento = calcularFechaVencimiento(valor, p.dias_disponibles);
          }
        }
        
        if (campo === 'precio_venta_usd' || campo === 'tiene_descuento') {
          let precioFinal = updated.precio_venta_usd;
          if (updated.tiene_descuento) precioFinal = precioFinal * 0.9;
          updated.monto_bs = precioFinal * tasaBCV;
        }
        
        return updated;
      }
      return p;
    }));
  };

  const handleDiasDisponiblesChange = (platId: string, dias: number) => {
    setPlataformas(plataformas.map(p => {
      if (p.id === platId) {
        const fechaVenc = calcularFechaVencimiento(p.fecha_inicio, dias);
        return {
          ...p,
          dias_disponibles: dias,
          fecha_vencimiento: fechaVenc,
        };
      }
      return p;
    }));
  };

  const handleFechaVencimientoChange = (platId: string, fecha: string) => {
    setPlataformas(plataformas.map(p => {
      if (p.id === platId) {
        const dias = calcularDiasDisponibles(p.fecha_inicio, fecha);
        return {
          ...p,
          fecha_vencimiento: fecha,
          dias_disponibles: dias,
        };
      }
      return p;
    }));
  };

  const calcularTotales = () => {
    const totalCosto = plataformas.reduce((sum, p) => sum + (p.costo_usd || 0), 0);
    const totalVenta = plataformas.reduce((sum, p) => {
      let precio = p.precio_venta_usd || 0;
      if (p.tiene_descuento) precio = precio * 0.9;
      return sum + precio;
    }, 0);
    const totalGanancia = totalVenta - totalCosto;
    const totalBs = plataformas.reduce((sum, p) => sum + (p.monto_bs || 0), 0);
    return { totalCosto, totalVenta, totalGanancia, totalBs };
  };

  const calcularDiasRestantes = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return 0;
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatearFecha = (fechaStr: string | undefined | null) => {
    if (!fechaStr) return 'No definida';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return 'No definida';
    return fecha.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleRegistrar = async () => {
    if (!comprador) {
      alert('⚠️ El comprador es obligatorio');
      return;
    }

    try {
      const { totalCosto, totalVenta, totalGanancia, totalBs } = calcularTotales();
      
      const primeraPlataforma = plataformas[0];
      const fechaVencimiento = primeraPlataforma?.fecha_vencimiento || null;
      const diasDisponibles = primeraPlataforma?.dias_disponibles || 0;
      
      const dataToSave: any = {
        fecha: new Date().toISOString().split('T')[0],
        vendedor_id: user?.id,
        vendedor_nombre: vendedor || profile?.nombre || 'Admin',
        comprador,
        contacto_whatsapp: contacto,
        metodo_pago: metodoPago,
        cuenta_id: cuentaDestino || null,
        total_costo_usd: totalCosto,
        total_venta_usd: totalVenta,
        total_ganancia_usd: totalGanancia,
        tasa_bcv: tasaBCV,
        total_bs: totalBs,
        plataforma: primeraPlataforma?.nombre || '',
        fecha_vencimiento: fechaVencimiento,
        dias_disponibles: diasDisponibles,
        renueva: primeraPlataforma?.renueva || 'Pendiente',
        creado_por: user?.id,
      };

      if (streamingHubId) {
        dataToSave.streaming_hub_id = streamingHubId;
      }

      if (editingId) {
        const { error } = await supabase
          .from('ventas_streaming')
          .update(dataToSave)
          .eq('id', editingId);
        
        if (error) throw error;
        
        await supabase.from('ventas_streaming_detalles').delete().eq('venta_id', editingId);
      } else {
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas_streaming')
          .insert([dataToSave])
          .select()
          .single();
        
        if (ventaError) throw ventaError;
        
        for (const plat of plataformas) {
          await supabase.from('ventas_streaming_detalles').insert([{
            venta_id: ventaData.id,
            plataforma: plat.nombre,
            costo_usd: plat.costo_usd,
            precio_venta_usd: plat.precio_venta_usd,
            duracion_meses: plat.duracion_meses,
            dias_disponibles: plat.dias_disponibles,
            fecha_inicio: plat.fecha_inicio,
            fecha_vencimiento: plat.fecha_vencimiento,
            dias_regalo: plat.dias_regalo,
            monto_bs_editable: plat.monto_bs,
            renueva: plat.renueva,
            tiene_descuento: plat.tiene_descuento,
          }]);
        }
      }

      alert('✅ Venta registrada exitosamente');
      setShowForm(false);
      resetForm();
      await fetchVentas();
    } catch (error: any) {
      console.error('Error completo:', error);
      alert('❌ Error al registrar: ' + error.message);
    }
  };

  const resetForm = () => {
    setVendedor('');
    setComprador('');
    setContacto('');
    setMetodoPago('Efectivo');
    setCuentaDestino('');
    setStreamingHubId('');
    setEditingId(null);
    setPlataformas([{
      id: '1',
      nombre: '',
      costo_usd: 0,
      precio_venta_usd: 0,
      duracion_meses: 1,
      dias_disponibles: 30,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_vencimiento: '',
      dias_regalo: 0,
      monto_bs: 0,
      renueva: 'Pendiente',
      tiene_descuento: false,
    }]);
  };

  const handleEditar = (venta: VentaStreaming) => {
    setEditingId(venta.id);
    setVendedor(venta.vendedor_nombre);
    setComprador(venta.comprador);
    setContacto(venta.contacto_whatsapp);
    setMetodoPago(venta.metodo_pago);
    setStreamingHubId(venta.streaming_hub_id || '');
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta venta? Esta acción no se puede deshacer.')) return;
    
    try {
      console.log('🗑️ Iniciando eliminación de venta:', id);
      
      const { error: errorDetalles } = await supabase
        .from('ventas_streaming_detalles')
        .delete()
        .eq('venta_id', id);
      
      if (errorDetalles) {
        console.error('❌ Error eliminando detalles:', errorDetalles);
        throw errorDetalles;
      }
      console.log('✅ Detalles eliminados');
      
      const { error: errorVenta } = await supabase
        .from('ventas_streaming')
        .delete()
        .eq('id', id);
      
      if (errorVenta) {
        console.error('❌ Error eliminando venta:', errorVenta);
        throw errorVenta;
      }
      console.log('✅ Venta eliminada correctamente');
      
      await fetchVentas();
      
      alert('✅ Venta eliminada correctamente');
    } catch (error: any) {
      console.error('❌ Error completo en handleEliminar:', error);
      console.error('Detalles del error:', JSON.stringify(error, null, 2));
      
      let mensajeError = 'Error al eliminar la venta';
      
      if (error.message) {
        mensajeError = error.message;
      }
      
      alert(`❌ ${mensajeError}\n\nRevisa la consola para más detalles.`);
    }
  };

  const handleRenovar = async (venta: VentaStreaming) => {
    if (!confirm('¿Renovar esta venta? Se creará un nuevo registro con los mismos datos')) return;
    
    try {
      const { data: detallesAnteriores } = await supabase
        .from('ventas_streaming_detalles')
        .select('*')
        .eq('venta_id', venta.id);
      
      const nuevaFecha = new Date();
      const dataToSave: any = {
        fecha: nuevaFecha.toISOString().split('T')[0],
        vendedor_id: user?.id,
        vendedor_nombre: venta.vendedor_nombre,
        comprador: venta.comprador,
        contacto_whatsapp: venta.contacto_whatsapp,
        metodo_pago: venta.metodo_pago,
        cuenta_id: venta.cuenta_id,
        total_costo_usd: venta.total_costo_usd,
        total_venta_usd: venta.total_venta_usd,
        total_ganancia_usd: venta.total_ganancia_usd,
        tasa_bcv: venta.tasa_bcv || tasaBCV,
        total_bs: venta.monto_bs,
        plataforma: venta.plataforma,
        fecha_vencimiento: null,
        dias_disponibles: 0,
        renueva: 'Pendiente',
        creado_por: user?.id,
      };
      
      const { data: nuevaVenta, error } = await supabase
        .from('ventas_streaming')
        .insert([dataToSave])
        .select()
        .single();
      
      if (error) throw error;
      
      if (detallesAnteriores && detallesAnteriores.length > 0) {
        for (const detalle of detallesAnteriores) {
          await supabase.from('ventas_streaming_detalles').insert([{
            venta_id: nuevaVenta.id,
            plataforma: detalle.plataforma,
            costo_usd: detalle.costo_usd,
            precio_venta_usd: detalle.precio_venta_usd,
            duracion_meses: detalle.duracion_meses,
            dias_disponibles: detalle.dias_disponibles,
            fecha_inicio: nuevaFecha.toISOString().split('T')[0],
            fecha_vencimiento: detalle.fecha_vencimiento,
            dias_regalo: detalle.dias_regalo,
            monto_bs_editable: detalle.monto_bs_editable,
            renueva: 'Pendiente',
            tiene_descuento: detalle.tiene_descuento,
          }]);
        }
      }
      
      alert('✅ Venta renovada exitosamente');
      await fetchVentas();
    } catch (error) {
      console.error('Error renovando:', error);
      alert('❌ Error al renovar: ' + (error as any).message);
    }
  };

  const handleWhatsApp = async (venta: VentaStreaming, type: 'cuenta' | 'cobro') => {
    setSelectedVenta(venta);
    setWhatsappType(type);
    
    const { data: detallesData } = await supabase
      .from('ventas_streaming_detalles')
      .select('*')
      .eq('venta_id', venta.id);
    
    const cuenta = cuentasStreaming.find(c => c.id === venta.streaming_hub_id);
    
    if (type === 'cuenta' && cuenta) {
      const fechaVencText = formatearFecha(cuenta.fecha_vencimiento);
      
      const mensaje = `✅ *PERFIL ${cuenta.plataforma.toUpperCase()}${cuenta.nombre_perfil ? ` - ${cuenta.nombre_perfil}` : ''}*

👤 *Perfil:* ${venta.comprador}
📧 *Correo:* ${cuenta.correo}
🔑 *Contraseña:* ${cuenta.contrasena}${cuenta.pin ? `
🔐 *PIN:* ${cuenta.pin}` : ''}

📅 *Vence:* ${fechaVencText}

✅ ¡Disfruta tu servicio!`;
      setWhatsappMessage(mensaje);
    } else if (type === 'cobro') {
      const diasRestantes = calcularDiasRestantes(venta.fecha_vencimiento);
      
      let plataformasTexto = '';
      if (detallesData && detallesData.length > 0) {
        plataformasTexto = detallesData.map(d => d.plataforma).join(', ');
      } else if (cuenta) {
        plataformasTexto = cuenta.plataforma;
      } else {
        plataformasTexto = 'Servicio de Streaming';
      }
      
      const fechaVencText = formatearFecha(venta.fecha_vencimiento);
      
      const mensaje = `💰 *RECORDATORIO DE PAGO*

¡Buen día, *${venta.comprador}*!

Te escribimos de parte de *Voltechstore.ve* para recordarte tu servicio:

📺 *Plataformas:*
${plataformasTexto}

⏰ *Días disponibles:* ${diasRestantes} día(s)
📅 *Vence:* ${fechaVencText}

💵 *Monto a pagar:* $${venta.total_venta_usd}

⚠️ Por favor, realiza el pago antes de esta fecha para evitar la suspensión del servicio.

Si ya realizaste tu pago, ignora este mensaje. ¡Gracias!`;
      
      setWhatsappMessage(mensaje);
    }
    
    setShowWhatsAppModal(true);
  };

  const enviarWhatsApp = () => {
    if (!selectedVenta) return;
    const numero = selectedVenta.contacto_whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/58${numero}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
  };

  const copiarMensaje = () => {
    navigator.clipboard.writeText(whatsappMessage);
    alert('✅ Mensaje copiado al portapapeles');
  };

  const agregarNuevaPlataforma = () => {
    if (!nuevaPlataformaNombre) {
      alert('⚠️ Ingresa el nombre de la plataforma');
      return;
    }
    
    supabase.from('inventario_streaming').insert([{
      plataforma: nuevaPlataformaNombre,
      proveedor: 'Manual',
      cantidad: 1,
      costo_unitario_usd: 0,
      total_usd: 0,
      tasa_aplicada: tasaBCV,
      total_bs: 0,
      creado_por: user?.id,
    }]);
    
    setPlataformasInventario([...plataformasInventario, {
      id: Date.now().toString(),
      plataforma: nuevaPlataformaNombre,
    }]);
    
    setNuevaPlataformaNombre('');
    setShowNuevaPlataforma(false);
  };

  const { totalCosto, totalVenta, totalGanancia, totalBs } = calcularTotales();

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{
          width: '50px', height: '50px',
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p>Cargando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      color: '#ffffff',
      padding: '32px',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/panel')}
              style={{
                width: '40px', height: '40px',
                background: '#1a1f3a',
                border: '1px solid #2a2f4a',
                borderRadius: '8px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#ffffff' }}>
                Plataformas Streaming
              </h1>
              <p style={{ color: '#8b92a8', fontSize: '14px', margin: '4px 0 0 0' }}>
                {ventas.length} registros
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              padding: '10px 20px',
              background: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <FaFileImport /> Importar
            </button>
            <button style={{
              padding: '10px 20px',
              background: '#1a1f3a',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <FaFileExport /> Exportar
            </button>
            <button
              onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
              style={{
                padding: '10px 20px',
                background: showForm ? '#ef4444' : '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              {showForm ? <FaMinus /> : <FaPlus />} 
              {showForm ? 'Cancelar' : 'Nuevo Registro'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('ventas')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'ventas' ? '#4f46e5' : 'transparent',
              border: `1px solid ${activeTab === 'ventas' ? '#4f46e5' : '#2a2f4a'}`,
              borderRadius: '8px',
              color: activeTab === 'ventas' ? '#ffffff' : '#8b92a8',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Ventas Streaming
          </button>
          <button
            onClick={() => router.push('/finanzas/inventario-streaming')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              color: '#8b92a8',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Inventario Plataformas
          </button>
          <button
            onClick={() => router.push('/admin/streaming-hub')}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              color: '#8b92a8',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Streaming Hub
          </button>
        </div>

        {/* Formulario Inline */}
        {showForm && (
          <div style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '32px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 24px 0', color: '#ffffff' }}>
              <FaPlus style={{ marginRight: '8px', color: '#10b981' }} />
              {editingId ? 'Editar Venta' : 'Nuevo Registro de Venta'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Vendedor</label>
                <select
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                >
                  <option value="">{profile?.nombre || 'Admin'}</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={`${v.nombre} ${v.apellido}`}>
                      {v.nombre} {v.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Comprador *</label>
                <select
                  value={clientes.find(c => `${c.nombre} ${c.apellido}` === comprador)?.id || ''}
                  onChange={(e) => handleClienteSelect(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={comprador}
                  onChange={(e) => setComprador(e.target.value)}
                  placeholder="O escribe manualmente..."
                  style={{
                    marginTop: '8px',
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Contacto (WhatsApp)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select style={{
                    padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px',
                  }}>
                    <option>🇻🇪 +58</option>
                  </select>
                  <input
                    type="tel"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="4121234567"
                    style={{
                      flex: 1, padding: '10px 12px',
                      background: '#1a1f3a',
                      border: '1px solid #2a2f4a',
                      borderRadius: '6px', color: '#ffffff',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Método de Pago</label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                >
                  <option>Efectivo</option>
                  <option>Pago Móvil</option>
                  <option>Transferencia</option>
                  <option>Zelle</option>
                  <option>Binance</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>ID Streaming Hub</label>
                <select
                  value={streamingHubId}
                  onChange={(e) => handleStreamingHubSelect(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                >
                  <option value="">Seleccionar cuenta...</option>
                  {cuentasStreaming.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.plataforma} - {c.correo}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>Cuenta Destino</label>
                <select
                  value={cuentaDestino}
                  onChange={(e) => setCuentaDestino(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px', color: '#ffffff',
                    fontSize: '14px', boxSizing: 'border-box',
                  }}
                >
                  <option value="">Sin cuenta</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plataformas */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#ffffff' }}>Plataformas</h3>
                <button
                  onClick={agregarPlataforma}
                  style={{
                    padding: '8px 16px',
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                >
                  <FaPlus /> Agregar Plataforma
                </button>
              </div>

              {plataformas.map((plat, index) => (
                <div
                  key={plat.id}
                  style={{
                    background: '#1a1f3a',
                    border: '1px solid #2a2f4a',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: '#8b92a8' }}>
                      Plataforma {index + 1}
                    </h4>
                    {plataformas.length > 1 && (
                      <button
                        onClick={() => eliminarPlataforma(plat.id)}
                        style={{
                          width: '28px', height: '28px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none', borderRadius: '6px',
                          color: '#ef4444', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <FaMinus />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Plataforma *</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={plat.nombre}
                          onChange={(e) => {
                            if (e.target.value === '__nueva__') {
                              setShowNuevaPlataforma(true);
                            } else {
                              actualizarPlataforma(plat.id, 'nombre', e.target.value);
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            background: '#111827',
                            border: '1px solid #2a2f4a',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '14px',
                          }}
                        >
                          <option value="">Seleccionar...</option>
                          {plataformasInventario.map(p => (
                            <option key={p.id} value={p.plataforma}>
                              {p.plataforma}
                            </option>
                          ))}
                          <option value="__nueva__">+ Agregar nueva...</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Costo USD</label>
                      <input
                        type="number"
                        value={plat.costo_usd || ''}
                        onChange={(e) => actualizarPlataforma(plat.id, 'costo_usd', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Precio Venta USD</label>
                      <input
                        type="number"
                        value={plat.precio_venta_usd || ''}
                        onChange={(e) => actualizarPlataforma(plat.id, 'precio_venta_usd', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Días Disponibles</label>
                      <input
                        type="number"
                        value={plat.dias_disponibles || ''}
                        onChange={(e) => handleDiasDisponiblesChange(plat.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Fecha Inicio</label>
                      <input
                        type="date"
                        value={plat.fecha_inicio}
                        onChange={(e) => actualizarPlataforma(plat.id, 'fecha_inicio', e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Fecha Vencimiento</label>
                      <input
                        type="date"
                        value={plat.fecha_vencimiento}
                        onChange={(e) => handleFechaVencimientoChange(plat.id, e.target.value)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Días Regalo/Falla</label>
                      <input
                        type="number"
                        value={plat.dias_regalo}
                        onChange={(e) => actualizarPlataforma(plat.id, 'dias_regalo', parseInt(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>Monto Bs (editable)</label>
                      <input
                        type="number"
                        value={plat.monto_bs || ''}
                        onChange={(e) => actualizarPlataforma(plat.id, 'monto_bs', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%', padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '4px' }}>¿Renueva?</label>
                      <select
                        value={plat.renueva}
                        onChange={(e) => actualizarPlataforma(plat.id, 'renueva', e.target.value)}
                        style={{
                          padding: '10px 12px',
                          background: '#111827',
                          border: '1px solid #2a2f4a',
                          borderRadius: '6px', color: '#ffffff',
                          fontSize: '14px',
                        }}
                      >
                        <option>Pendiente</option>
                        <option>Sí</option>
                        <option>No</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
                      <input
                        type="checkbox"
                        checked={plat.tiene_descuento}
                        onChange={(e) => actualizarPlataforma(plat.id, 'tiene_descuento', e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <label style={{ fontSize: '14px', color: '#ffffff' }}>¿Descuento?</label>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #2a2f4a',
                    fontSize: '12px',
                    color: '#8b92a8',
                  }}>
                    <span>Ganancia USD: <strong style={{ color: '#10b981' }}>${((plat.precio_venta_usd || 0) - (plat.costo_usd || 0)).toFixed(2)}</strong></span>
                    <span>Monto Bs: <strong style={{ color: '#3b82f6' }}>Bs {(plat.monto_bs || 0).toFixed(2)}</strong></span>
                    <span>Días disp.: <strong>{plat.dias_disponibles || 0}</strong></span>
                    <span>Tasa BCV: <strong>{tasaBCV}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Nueva Plataforma */}
            {showNuevaPlataforma && (
              <div style={{
                background: '#111827',
                border: '1px solid #2a2f4a',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#ffffff' }}>
                  Agregar Nueva Plataforma
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={nuevaPlataformaNombre}
                    onChange={(e) => setNuevaPlataformaNombre(e.target.value)}
                    placeholder="Nombre de la plataforma"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: '#1a1f3a',
                      border: '1px solid #2a2f4a',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={agregarNuevaPlataforma}
                    style={{
                      padding: '10px 16px',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    <FaSave /> Guardar
                  </button>
                  <button
                    onClick={() => { setShowNuevaPlataforma(false); setNuevaPlataformaNombre(''); }}
                    style={{
                      padding: '10px 16px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Totales */}
            <div style={{
              background: '#1a1f3a',
              border: '1px solid #2a2f4a',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>Total Costo:</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>${totalCosto.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#ffffff' }}>Total Venta (- descuentos):</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>${totalVenta.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>Ganancia:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: totalGanancia >= 0 ? '#10b981' : '#ef4444' }}>${totalGanancia.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #2a2f4a' }}>
                <span style={{ fontSize: '12px', color: '#8b92a8' }}>Tasa BCV: Bs {tasaBCV}</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>Total Bs: {totalBs.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowForm(false); resetForm(); }}
                style={{
                  padding: '12px 24px',
                  background: '#1a1f3a',
                  border: '1px solid #2a2f4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrar}
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
                <FaSave /> {editingId ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Ventas */}
        {ventas.length === 0 ? (
          <div style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
          }}>
            <FaTv style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px', color: '#ffffff' }}>No hay registros de streaming</h3>
            <p style={{ color: '#8b92a8' }}>
              Haz click en "Nuevo Registro" para agregar tu primera venta
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {ventas.map(venta => {
              const diasRestantes = calcularDiasRestantes(venta.fecha_vencimiento);
              const cuentaVinculada = cuentasStreaming.find(c => c.id === venta.streaming_hub_id);
              
              return (
                <div
                  key={venta.id}
                  style={{
                    background: '#111827',
                    border: '1px solid #1f2937',
                    borderRadius: '12px',
                    padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                      <div style={{
                        width: '50px', height: '50px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        color: 'white',
                        fontWeight: '700',
                      }}>
                        <FaTv />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: '#ffffff' }}>
                            {venta.comprador}
                          </h3>
                          {venta.streaming_hub_id && (
                            <span style={{
                              padding: '4px 10px',
                              background: 'rgba(139, 92, 246, 0.2)',
                              color: '#a78bfa',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}>
                              ID: {venta.streaming_hub_id.substring(0, 8)}...
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: '#8b92a8' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <FaUserTie /> <strong>Vendedor:</strong> {venta.vendedor_nombre}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <FaEnvelope /> {venta.contacto_whatsapp}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              💳 {venta.metodo_pago}
                              {venta.cuenta_id && (
                                <span style={{ marginLeft: '8px', color: '#10b981' }}>
                                  → {cuentas.find(c => c.id === venta.cuenta_id)?.nombre || 'Cuenta'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <FaCalendarAlt /> Vence: {formatearFecha(venta.fecha_vencimiento)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              ⏰ <strong>Días disponibles:</strong> {venta.dias_disponibles || 0}
                            </div>
                            {cuentaVinculada && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaTv /> {cuentaVinculada.plataforma}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>
                          ${(venta.total_venta_usd || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8b92a8' }}>
                          Bs {(venta.monto_bs || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
                          Ganancia: ${(venta.total_ganancia_usd || 0).toFixed(2)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleWhatsApp(venta, 'cuenta')}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: 'none', borderRadius: '6px',
                            color: '#10b981', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '600',
                          }}
                          title="Enviar cuenta"
                        >
                          <FaWhatsapp /> Cuenta
                        </button>
                        <button
                          onClick={() => handleWhatsApp(venta, 'cobro')}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: 'none', borderRadius: '6px',
                            color: '#f59e0b', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '600',
                          }}
                          title="Enviar cobro"
                        >
                          <FaDollarSign /> Cobro
                        </button>
                        <button
                          onClick={() => handleEditar(venta)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: 'none', borderRadius: '6px',
                            color: '#3b82f6', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '600',
                          }}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleRenovar(venta)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: 'none', borderRadius: '6px',
                            color: '#a78bfa', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '600',
                          }}
                          title="Renovar"
                        >
                          <FaRedo />
                        </button>
                        <button
                          onClick={() => handleEliminar(venta.id)}
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: 'none', borderRadius: '6px',
                            color: '#ef4444', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '600',
                          }}
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal WhatsApp */}
      {showWhatsAppModal && selectedVenta && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 24px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {whatsappType === 'cuenta' ? '📱 Enviar Cuenta' : '💰 Recordatorio de Cobro'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>
                Cliente: <strong style={{ color: '#ffffff' }}>{selectedVenta.comprador}</strong>
              </label>
              <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>
                WhatsApp: <strong style={{ color: '#ffffff' }}>{selectedVenta.contacto_whatsapp}</strong>
              </label>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#8b92a8', marginBottom: '6px' }}>
                Mensaje (editable):
              </label>
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#1a1f3a',
                  border: '1px solid #2a2f4a',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={copiarMensaje}
                style={{
                  padding: '12px 24px',
                  background: '#4f46e5',
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
                <FaCopy /> Copiar
              </button>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#1a1f3a',
                  border: '1px solid #2a2f4a',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={enviarWhatsApp}
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
                <FaWhatsapp /> Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}