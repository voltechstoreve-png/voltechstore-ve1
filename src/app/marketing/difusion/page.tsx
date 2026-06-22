'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  FaWhatsapp, FaBox, FaUsers, FaPaperPlane, FaClock,
  FaCheck, FaTimes, FaExclamationTriangle, FaPlay, FaPause
} from 'react-icons/fa';

interface Producto {
  id: string;
  nombre: string;
  precio_venta_usd: number;
  precio_oferta_usd?: number;
  imagen_url: string;
  descripcion?: string;
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
}

interface MensajeCola {
  id: string;
  cliente_nombre: string;
  telefono: string;
  mensaje_texto: string;
  estado: string;
  intentos: number;
  fecha_programada: string;
  enviado_en?: string;
}

export default function DifusionPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [ritmo, setRitmo] = useState('50_manana_50_noche');
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cola, setCola] = useState<MensajeCola[]>([]);
  const [stats, setStats] = useState({ total: 0, enviados: 0, pendientes: 0, fallidos: 0 });

  useEffect(() => {
    cargarProductos();
    cargarClientes();
    cargarCola();
  }, []);

  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('estado', 'publicado')
      .order('nombre');
    setProductos(data || []);
  };

  const cargarClientes = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, nombre, telefono')
      .not('telefono', 'is', null);
    setClientes(data || []);
  };

  const cargarCola = async () => {
    const { data } = await supabase
      .from('cola_difusion')
      .select('*')
      .order('fecha_programada', { ascending: false })
      .limit(50);
    setCola(data || []);

    const total = data?.length || 0;
    const enviados = data?.filter(m => m.estado === 'enviado').length || 0;
    const pendientes = data?.filter(m => m.estado === 'pendiente').length || 0;
    const fallidos = data?.filter(m => m.estado === 'fallido').length || 0;
    setStats({ total, enviados, pendientes, fallidos });
  };

  const generarPlantilla = (cliente: Cliente) => {
    if (!productoSeleccionado) return '';

    const precioOferta = productoSeleccionado.precio_oferta_usd || productoSeleccionado.precio_venta_usd;
    const tieneOferta = productoSeleccionado.precio_oferta_usd && productoSeleccionado.precio_oferta_usd < productoSeleccionado.precio_venta_usd;

    let mensaje = `¡Hola ${cliente.nombre}! 👋\n\n`;
    mensaje += `🔥 *OFERTA EXCLUSIVA PARA TI* 🔥\n\n`;
    mensaje += `*${productoSeleccionado.nombre}*\n`;
    if (productoSeleccionado.descripcion) {
      mensaje += `_${productoSeleccionado.descripcion}_\n\n`;
    }

    if (tieneOferta) {
      mensaje += `💰 Antes: $${productoSeleccionado.precio_venta_usd}\n`;
      mensaje += `✅ *AHORA: $${precioOferta}*\n`;
      mensaje += `🎉 ¡Ahorra ${Math.round(((productoSeleccionado.precio_venta_usd - precioOferta) / productoSeleccionado.precio_venta_usd) * 100)}%!\n\n`;
    } else {
      mensaje += `💰 Precio: $${precioOferta}\n\n`;
    }

    if (productoSeleccionado.imagen_url) {
      mensaje += `📸 Ver producto: ${productoSeleccionado.imagen_url}\n\n`;
    }

    mensaje += `🛍️ Catálogo completo: https://voltechstore.ve\n`;
    mensaje += `💬 Respóndeme aquí para más info`;

    if (mensajePersonalizado) {
      mensaje = `${mensajePersonalizado}\n\n---\n${mensaje}`;
    }

    return mensaje;
  };

  const iniciarCampana = async () => {
    if (!productoSeleccionado) {
      alert('⚠️ Selecciona un producto');
      return;
    }
    if (clientes.length === 0) {
      alert('⚠️ No hay clientes con teléfono registrado');
      return;
    }

    if (!confirm(`¿Iniciar campaña para ${clientes.length} clientes?`)) return;

    setCargando(true);

    try {
      // Crear campaña
      const { data: campana, error: errorCampana } = await supabase
        .from('campanas')
        .insert([{
          nombre: `Campaña ${productoSeleccionado.nombre} - ${new Date().toLocaleDateString('es-VE')}`,
          producto_id: productoSeleccionado.id,
          plantilla_mensaje: generarPlantilla(clientes[0]),
          imagen_url: productoSeleccionado.imagen_url,
          total_mensajes: clientes.length,
          ritmo,
          creado_por: user?.id,
        }])
        .select()
        .single();

      if (errorCampana) throw errorCampana;

      // Generar mensajes en lote
      const mensajes = clientes.map((cliente, index) => {
        let fechaProgramada = new Date();

        // Aplicar ritmo
        if (ritmo === '50_manana_50_noche') {
          if (index < clientes.length / 2) {
            // Mañana: 9am - 12pm
            fechaProgramada.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
          } else {
            // Noche: 6pm - 9pm
            fechaProgramada.setHours(18 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
            fechaProgramada.setDate(fechaProgramada.getDate() + 1);
          }
        } else if (ritmo === 'fraccionado_2h') {
          // Cada 2 horas
          fechaProgramada = new Date(fechaProgramada.getTime() + index * 2 * 60 * 60 * 1000);
        }

        return {
          campana_id: campana.id,
          cliente_nombre: cliente.nombre,
          telefono: cliente.telefono,
          mensaje_texto: generarPlantilla(cliente),
          imagen_url: productoSeleccionado.imagen_url,
          producto_id: productoSeleccionado.id,
          fecha_programada: fechaProgramada.toISOString(),
        };
      });

      // Bulk insert
      const { error: errorMensajes } = await supabase
        .from('cola_difusion')
        .insert(mensajes);

      if (errorMensajes) throw errorMensajes;

      alert(`✅ Campaña creada: ${mensajes.length} mensajes programados`);
      cargarCola();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'enviado': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', icon: FaCheck };
      case 'enviando': return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', icon: FaPaperPlane };
      case 'pendiente': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', icon: FaClock };
      case 'fallido': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', icon: FaTimes };
      default: return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', icon: FaClock };
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(37, 211, 102, 0.15)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#25D366',
            fontSize: '22px',
          }}>
            <FaWhatsapp />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
              Cola de Difusión WhatsApp
            </h1>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
              Envíos masivos seguros con retrasos inteligentes
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div style={{ padding: '16px', background: theme.colors.background.tertiary, border: `1px solid ${theme.colors.border.default}`, borderRadius: '12px' }}>
          <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '0 0 4px 0' }}>Total</p>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>{stats.total}</p>
        </div>
        <div style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '12px' }}>
          <p style={{ fontSize: '11px', color: '#22c55e', margin: '0 0 4px 0' }}>Enviados</p>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#22c55e' }}>{stats.enviados}</p>
        </div>
        <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px' }}>
          <p style={{ fontSize: '11px', color: '#f59e0b', margin: '0 0 4px 0' }}>Pendientes</p>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#f59e0b' }}>{stats.pendientes}</p>
        </div>
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px' }}>
          <p style={{ fontSize: '11px', color: '#ef4444', margin: '0 0 4px 0' }}>Fallidos</p>
          <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: '#ef4444' }}>{stats.fallidos}</p>
        </div>
      </div>

      {/* Configuración de Campaña */}
      <div style={{
        background: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0', color: theme.colors.text.primary }}>
          🚀 Nueva Campaña
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Producto */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
              <FaBox style={{ marginRight: '6px' }} /> Producto a promocionar *
            </label>
            <select
              value={productoSeleccionado?.id || ''}
              onChange={(e) => {
                const p = productos.find(p => p.id === e.target.value);
                setProductoSeleccionado(p || null);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
              }}
            >
              <option value="">Seleccionar producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} - ${p.precio_venta_usd}</option>
              ))}
            </select>
          </div>

          {/* Ritmo */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
              <FaClock style={{ marginRight: '6px' }} /> Ritmo de envío
            </label>
            <select
              value={ritmo}
              onChange={(e) => setRitmo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                color: theme.colors.text.primary,
                fontSize: '14px',
              }}
            >
              <option value="50_manana_50_noche">50 mañana / 50 noche</option>
              <option value="fraccionado_2h">Fraccionado cada 2 horas</option>
              <option value="lento_30min">Lento (1 cada 30 min)</option>
            </select>
          </div>
        </div>

        {/* Mensaje personalizado */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>
            Mensaje personalizado (opcional - se agrega al inicio)
          </label>
          <textarea
            value={mensajePersonalizado}
            onChange={(e) => setMensajePersonalizado(e.target.value)}
            rows={2}
            placeholder="Ej: ¡Hola! Tenemos una oferta especial para ti..."
            style={{
              width: '100%',
              padding: '10px 12px',
              background: theme.colors.background.tertiary,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: '8px',
              color: theme.colors.text.primary,
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Preview */}
        {productoSeleccionado && clientes.length > 0 && (
          <div style={{
            padding: '16px',
            background: 'rgba(37, 211, 102, 0.05)',
            border: '1px solid rgba(37, 211, 102, 0.2)',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '11px', color: '#25D366', margin: '0 0 8px 0', fontWeight: '600' }}>
              📱 VISTA PREVIA (para {clientes[0].nombre}):
            </p>
            <pre style={{
              fontSize: '12px',
              color: theme.colors.text.primary,
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              lineHeight: '1.5',
            }}>
              {generarPlantilla(clientes[0])}
            </pre>
          </div>
        )}

        <button
          onClick={iniciarCampana}
          disabled={cargando || !productoSeleccionado}
          style={{
            padding: '12px 24px',
            background: cargando || !productoSeleccionado ? theme.colors.background.elevated : 'linear-gradient(135deg, #25D366, #128C7E)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            fontSize: '14px',
            cursor: cargando || !productoSeleccionado ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FaPlay /> {cargando ? 'Procesando...' : 'Iniciar Campaña'}
        </button>
      </div>

      {/* Cola de mensajes */}
      <div style={{
        background: theme.colors.background.secondary,
        border: `1px solid ${theme.colors.border.default}`,
        borderRadius: '16px',
        padding: '24px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0', color: theme.colors.text.primary }}>
          📋 Cola de Mensajes (últimos 50)
        </h2>

        {cola.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: theme.colors.text.secondary }}>
            <FaWhatsapp style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }} />
            <p>No hay mensajes en cola</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cola.map((mensaje) => {
              const estadoInfo = getEstadoColor(mensaje.estado);
              const Icon = estadoInfo.icon;
              return (
                <div
                  key={mensaje.id}
                  style={{
                    padding: '12px 16px',
                    background: estadoInfo.bg,
                    border: `1px solid ${estadoInfo.text}30`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Icon style={{ color: estadoInfo.text, fontSize: '16px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: theme.colors.text.primary }}>
                      {mensaje.cliente_nombre}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: theme.colors.text.secondary }}>
                      📞 {mensaje.telefono} • 🕐 {new Date(mensaje.fecha_programada).toLocaleString('es-VE')}
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: `${estadoInfo.text}20`,
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: estadoInfo.text,
                    textTransform: 'uppercase',
                  }}>
                    {mensaje.estado}
                    {mensaje.intentos > 0 && ` (${mensaje.intentos})`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}