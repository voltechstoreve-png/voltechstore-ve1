'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  FaShoppingCart, FaPlus, FaWhatsapp,
  FaEdit, FaTrash, FaCalendar, FaUser,
  FaMoneyBillWave, FaTruck, FaSearch, FaTimes,
  FaChevronDown, FaChevronUp, FaSave, FaFilePdf,
  FaBan, FaUndo
} from 'react-icons/fa';

// ============================================
// INTERFACES
// ============================================

interface Producto {
  id: string;
  nombre: string;
  precio_venta_usd: number;
  categoria: string;
  marca: string;
  stock: number;
}

interface Cuenta {
  id: string;
  nombre: string;
  moneda: string;
  saldo_usd: number;
  saldo_bs: number;
}

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
}

interface EquipoMember {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  telefono?: string;
}

interface VentaProductoItem {
  id: string;
  nombre: string;
  precio_venta_usd: number;
  cantidad: number;
  subtotal_usd: number;
  subtotal_bs: number;
}

interface Venta {
  id: string;
  numero_orden?: string;
  fecha: string;
  vendedor: string;
  cliente_nombre: string;
  cliente_telefono: string;
  metodo_pago: string;
  cuenta_destino_id?: string;
  total_usd: number;
  monto_pagado: number;
  saldo_pendiente: number;
  estado_pago: string;
  es_financiado: boolean;
  monto_financiado?: number;
  incluye_delivery: boolean;
  monto_delivery?: number;
  fecha_estimada_pago?: string;
  created_at: string;
  productos?: Array<{
    producto_nombre: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
  }>;
}

interface Orden {
  id: string;
  numero_orden: string;
  venta_id?: string;
  estado: string;
  categoria: string;
  observacion?: string;
  fecha: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  vendedor?: string;
  metodo_pago?: string;
  total_usd?: number;
  creado_en: string;
}

type TabType = 'ventas' | 'ordenes';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function VentasProductosPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, profile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('ventas');
  const [showModal, setShowModal] = useState(false);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'ventas') cargarVentas();
    if (activeTab === 'ordenes') cargarOrdenes();
  }, [activeTab]);

  const cargarVentas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*, productos:ventas_items(producto_nombre, cantidad, precio_unitario, total)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error cargando ventas:', error);
      } else {
        setVentas(data || []);
      }
    } catch (err) {
      console.error('Error crítico cargando ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarOrdenes = async () => {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error cargando órdenes:', error);
      } else {
        setOrdenes(data || []);
      }
    } catch (err) {
      console.error('Error crítico cargando órdenes:', err);
    }
  };

  const eliminarVenta = async (venta: Venta) => {
    const observacion = prompt('Motivo de la eliminación:');
    if (!observacion) return;
    try {
      if (venta.numero_orden) {
        await supabase.from('ordenes').update({ estado: 'eliminada', categoria: 'Venta eliminada', observacion }).eq('numero_orden', venta.numero_orden);
      }
      await supabase.from('ventas').delete().eq('id', venta.id);
      cargarVentas();
      cargarOrdenes();
    } catch (err) {
      console.error('Error eliminando venta:', err);
      alert('❌ Error al eliminar');
    }
  };

  const cambiarEstadoOrden = async (orden: Orden, nuevoEstado: string, categoria: string) => {
    const observacion = prompt(`Motivo (${categoria}):`);
    if (!observacion) return;
    try {
      await supabase.from('ordenes').update({ estado: nuevoEstado, categoria, observacion }).eq('id', orden.id);
      cargarOrdenes();
    } catch (err) {
      console.error('Error actualizando orden:', err);
      alert('❌ Error al actualizar');
    }
  };

  const enviarWhatsApp = (venta: Venta) => {
    const msg = `🔔 *RECORDATORIO DE PAGO*\n\nHola ${venta.cliente_nombre},\n\nSaldo pendiente: $${venta.saldo_pendiente}\nOrden: ${venta.numero_orden || 'N/A'}\n\n¡Gracias!`;
    const tel = venta.cliente_telefono.replace(/\D/g, '');
    window.open(`https://wa.me/58${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const getEstadoColor = (estado: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pagada: { bg: 'rgba(34,197,94,0.2)', text: '#22c55e', label: 'Pagada' },
      pendiente: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b', label: 'Pendiente' },
      parcial: { bg: 'rgba(59,130,246,0.2)', text: '#3b82f6', label: 'Parcial' },
    };
    return map[estado] || { bg: 'rgba(107,114,128,0.2)', text: '#6b7280', label: estado };
  };

  const getOrdenColor = (estado: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      activa: { bg: 'rgba(34,197,94,0.2)', text: '#22c55e' },
      eliminada: { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' },
      cancelada: { bg: 'rgba(245,158,11,0.2)', text: '#f59e0b' },
      modificada: { bg: 'rgba(59,130,246,0.2)', text: '#3b82f6' },
    };
    return map[estado] || { bg: 'rgba(107,114,128,0.2)', text: '#6b7280' };
  };

  const ventasFiltradas = ventas.filter(v =>
    v.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vendedor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generarPDF = async (venta: Venta) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const pw = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(10);
      doc.text('VOLTECHSTORE.VE', pw / 2, 15, { align: 'center' });
      doc.setFontSize(8);
      doc.text('TECNOLOGÍA A TU ALCANCE | Caracas, Venezuela', pw / 2, 20, { align: 'center' });
      doc.text('Instagram: @VoltechStore.ve | WhatsApp: 04125378515', pw / 2, 25, { align: 'center' });
      doc.line(10, 28, pw - 10, 28);

      // Título
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTA DE ENTREGA Y GARANTÍA', pw / 2, 35, { align: 'center' });

      // Info superior
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const fechaFormateada = new Date(venta.fecha).toLocaleDateString('es-VE');

      doc.text(`FECHA: ${fechaFormateada}`, 10, 45);
      doc.text(`N° ORDEN: ${venta.numero_orden || 'N/A'}`, pw / 2 + 5, 45);
      doc.text(`CLIENTE: ${venta.cliente_nombre}`, 10, 52);
      doc.text(`TELÉFONO: ${venta.cliente_telefono || 'N/A'}`, pw / 2 + 5, 52);
      doc.text(`VENDEDOR: ${venta.vendedor}`, 10, 59);
      doc.text(`TELÉFONO: 04125378515`, pw / 2 + 5, 59);
      doc.text(`METODO DE PAGO: ${venta.metodo_pago}`, 10, 66);

      // Tabla de productos
      const productosData = venta.productos?.map(p => [
        p.producto_nombre || 'Producto',
        p.cantidad?.toString() || '1',
        `$${(p.precio_unitario || 0).toFixed(2)}`,
        `$${(p.total || 0).toFixed(2)}`,
      ]) || [['Sin productos', '0', '$0.00', '$0.00']];

      autoTable(doc, {
        startY: 72,
        head: [['DESCRIPCIÓN DEL PRODUCTO', 'CANT.', 'PRECIO U.', 'TOTAL']],
        body: productosData,
        theme: 'grid',
        headStyles: { fillColor: [30, 30, 50], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30, halign: 'right' },
        },
      });

      // Total general
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL GENERAL:', pw - 50, finalY);
      doc.text(`$${venta.total_usd.toFixed(2)}`, pw - 15, finalY, { align: 'right' });

      // Políticas
      const polY = finalY + 15;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('POLÍTICAS DE VENTA Y GARANTÍA', 10, polY);

      doc.setFont('helvetica', 'normal');
      const politicas = [
        '1. POLÍTICA DE PAGO ANTICIPADO: Para garantizar la disponibilidad de inventario y el procesamiento logístico con nuestros proveedores, todo despacho se gestionará exclusivamente previa recepción y conciliación del pago total.',
        '2. PRESENTACIÓN: Es obligatorio presentar este comprobante para cualquier reclamo.',
        '3. TIEMPO DE GARANTÍA: El producto tiene una garantía de 3 días continuos.',
        '4. EXCLUSIONES: No cubre daños físicos, humedad, sobrecargas o sellos removidos.',
        '5. EMPAQUE: Es obligatorio conservar la caja y accesorios originales en buen estado.',
        '6. GESTIÓN DE CAMBIOS: Sujeto a revisión técnica (24-48h). Es condición indispensable la entrega del producto defectuoso en su empaque original; no se entregará un reemplazo sin la verificación previa del equipo anterior.',
        '7. REEMBOLSOS Y CONFORMIDAD: Al recibir, el cliente acepta el estado del producto. Bajo ninguna circunstancia se realizará la devolución de dinero; se procederá exclusivamente al cambio por un producto igual o de similares características.',
      ];

      let currentY = polY + 5;
      politicas.forEach((p) => {
        doc.text(p, 10, currentY);
        currentY += 4;
      });

      // Guardar
      doc.save(`Nota_Entrega_${venta.numero_orden || venta.id.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      alert('❌ Error al generar PDF');
    }
  };

  const styleInput: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: theme.colors.background.tertiary,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: '8px',
    color: theme.colors.text.primary,
    fontSize: '14px',
    boxSizing: 'border-box',
  };

  const styleLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    color: theme.colors.text.secondary,
    marginBottom: '6px',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(34,197,94,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e', fontSize: '22px' }}>
            <FaShoppingCart />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>Ventas de Productos</h1>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>Registra ventas y gestiona órdenes</p>
          </div>
        </div>

        {/* Tabs - SOLO 2: Ventas y Órdenes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['ventas', 'ordenes'] as TabType[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '10px 20px',
                background: activeTab === tab ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : theme.colors.background.tertiary,
                border: `1px solid ${activeTab === tab ? 'transparent' : theme.colors.border.default}`,
                borderRadius: '10px',
                color: activeTab === tab ? 'white' : theme.colors.text.primary,
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
              }}>
                {tab === 'ventas' && <><FaShoppingCart style={{ marginRight: '8px' }} />Ventas</>}
                {tab === 'ordenes' && <><FaFilePdf style={{ marginRight: '8px' }} />Órdenes</>}
              </button>
            ))}
          </div>

          {activeTab === 'ventas' && (
            <button onClick={() => setShowModal(true)} style={{
              padding: '10px 20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none', borderRadius: '10px', color: 'white', fontSize: '14px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <FaPlus /> Nuevo Registro
            </button>
          )}
        </div>
      </div>

      {/* ============ TAB: VENTAS ============ */}
      {activeTab === 'ventas' && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', maxWidth: '600px' }}>
              <FaSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.colors.text.secondary }} />
              <input type="text" placeholder="Buscar por cliente o vendedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...styleInput, paddingLeft: '48px' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: theme.colors.text.secondary }}>Cargando...</div>
          ) : ventasFiltradas.length === 0 ? (
            <div style={{ background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border.default}`, borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
              <FaShoppingCart style={{ fontSize: '48px', color: theme.colors.text.muted, marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ color: theme.colors.text.secondary }}>No hay ventas registradas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ventasFiltradas.map((venta) => {
                const est = getEstadoColor(venta.estado_pago);
                return (
                  <div key={venta.id} style={{
                    background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
                  }}>
                    <div style={{ width: '56px', height: '56px', background: 'rgba(139,92,246,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontSize: '24px', flexShrink: 0 }}>
                      <FaShoppingCart />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>{venta.cliente_nombre}</h3>
                        {venta.numero_orden && <span style={{ padding: '3px 10px', background: 'rgba(139,92,246,0.2)', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: '#a855f7' }}>{venta.numero_orden}</span>}
                        <span style={{ padding: '3px 10px', background: est.bg, borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: est.text }}>{est.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: theme.colors.text.secondary, marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span><FaUser style={{ marginRight: '4px', fontSize: '11px' }} />{venta.vendedor}</span>
                        <span><FaCalendar style={{ marginRight: '4px', fontSize: '11px' }} />{new Date(venta.fecha).toLocaleDateString('es-VE')}</span>
                        <span>{venta.metodo_pago}</span>
                        {venta.incluye_delivery && <span style={{ color: '#22c55e' }}><FaTruck style={{ marginRight: '4px' }} />Delivery</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.colors.text.muted }}>{venta.cliente_telefono}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>${venta.total_usd.toFixed(2)}</div>
                        <div style={{ fontSize: '12px', color: theme.colors.text.muted }}>Bs {(venta.total_usd * 530).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => generarPDF(venta)} title="PDF" style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaFilePdf /></button>
                        {venta.estado_pago === 'pendiente' && venta.cliente_telefono && <button onClick={() => enviarWhatsApp(venta)} title="WhatsApp" style={{ width: '32px', height: '32px', background: 'rgba(37,211,102,0.2)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '6px', color: '#25D366', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaWhatsapp /></button>}
                        <button onClick={() => eliminarVenta(venta)} title="Eliminar" style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTrash /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============ TAB: ÓRDENES ============ */}
      {activeTab === 'ordenes' && (
        <div>
          <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ margin: 0, color: theme.colors.text.primary, fontSize: '14px' }}>
              <FaFilePdf style={{ marginRight: '8px' }} />
              <strong>Órdenes de Ventas Registradas</strong>
              <span style={{ color: theme.colors.text.secondary, marginLeft: '8px' }}>
                (Las órdenes se generan automáticamente al crear una venta)
              </span>
            </p>
          </div>

          {ordenes.length === 0 ? (
            <div style={{ background: theme.colors.background.secondary, border: `1px solid ${theme.colors.border.default}`, borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
              <FaFilePdf style={{ fontSize: '48px', color: theme.colors.text.muted, marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ color: theme.colors.text.secondary }}>No hay órdenes registradas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ordenes.map((orden) => {
                const c = getOrdenColor(orden.estado);
                return (
                  <div key={orden.id} style={{ background: theme.colors.background.secondary, border: `1px solid ${c.text}40`, borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ width: '56px', height: '56px', background: `${c.text}20`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.text, fontSize: '24px', flexShrink: 0 }}>
                      <FaFilePdf />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: theme.colors.text.primary, fontFamily: 'monospace' }}>{orden.numero_orden}</h3>
                        <span style={{ padding: '3px 10px', background: c.bg, borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: c.text }}>{orden.estado.toUpperCase()}</span>
                        {orden.categoria && <span style={{ padding: '3px 10px', background: 'rgba(139,92,246,0.2)', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: '#a855f7' }}>{orden.categoria}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: theme.colors.text.secondary, flexWrap: 'wrap' }}>
                        <span><FaUser style={{ marginRight: '4px', fontSize: '11px' }} />{orden.cliente_nombre || 'N/A'}</span>
                        <span><FaCalendar style={{ marginRight: '4px', fontSize: '11px' }} />{new Date(orden.fecha).toLocaleDateString('es-VE')}</span>
                        {orden.vendedor && <span>Vendedor: {orden.vendedor}</span>}
                      </div>
                      {orden.observacion && <div style={{ fontSize: '12px', color: theme.colors.text.muted, fontStyle: 'italic', marginTop: '4px' }}>💬 {orden.observacion}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#22c55e' }}>${orden.total_usd?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {orden.estado === 'activa' && (
                        <>
                          <button onClick={() => cambiarEstadoOrden(orden, 'cancelada', 'Venta cancelada')} title="Cancelar" style={{ width: '32px', height: '32px', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaBan /></button>
                          <button onClick={() => cambiarEstadoOrden(orden, 'modificada', 'Venta modificada')} title="Modificar" style={{ width: '32px', height: '32px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaEdit /></button>
                        </>
                      )}
                      {orden.estado !== 'activa' && (
                        <button onClick={() => cambiarEstadoOrden(orden, 'activa', 'Restaurada')} title="Restaurar" style={{ width: '32px', height: '32px', background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaUndo /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL NUEVA VENTA */}
      {showModal && (
        <NuevoRegistroModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); cargarVentas(); cargarOrdenes(); }}
          theme={theme}
          profile={profile}
          styleInput={styleInput}
          styleLabel={styleLabel}
        />
      )}
    </div>
  );
}

// ============================================
// MODAL NUEVO REGISTRO - CON LÓGICA REAL
// ============================================

function NuevoRegistroModal({ onClose, onSuccess, theme, profile, styleInput, styleLabel }: {
  onClose: () => void;
  onSuccess: () => void;
  theme: any;
  profile: any;
  styleInput: React.CSSProperties;
  styleLabel: React.CSSProperties;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [numeroOrden, setNumeroOrden] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [comprador, setComprador] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [esFinanciado, setEsFinanciado] = useState(false);
  const [montoFinanciado, setMontoFinanciado] = useState(0);
  const [fechaEstimadaPago, setFechaEstimadaPago] = useState('');
  const [incluyeDelivery, setIncluyeDelivery] = useState(false);
  const [montoDelivery, setMontoDelivery] = useState(0);
  const [deliveryTipo, setDeliveryTipo] = useState('');
  const [deliveryNombre, setDeliveryNombre] = useState('');

  const [equipo, setEquipo] = useState<EquipoMember[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [clientesDB, setClientesDB] = useState<Cliente[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [marcaFilter, setMarcaFilter] = useState('');
  const [productoSel, setProductoSel] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState<VentaProductoItem[]>([]);
  const [showDetalle, setShowDetalle] = useState(true);
  const [showSugerencias, setShowSugerencias] = useState(false);

  // ✅ TASA BCV REAL DE LA APP
  const tasaBCV = 530;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      // 1. CARGAR PRODUCTOS DEL INVENTARIO (sin streaming)
      const { data: productosData, error: errorProductos } = await supabase
        .from('productos')
        .select('*')
        .eq('estado', 'publicado')
        .is('etiqueta_streaming', false)
        .order('nombre', { ascending: true });

      if (errorProductos) {
        console.error('Error cargando productos:', errorProductos);
      } else {
        setProductos(productosData || []);
      }

      // 2. CARGAR CUENTAS
      const { data: cuentasData, error: errorCuentas } = await supabase
        .from('cuentas')
        .select('*')
        .eq('activa', true)
        .order('nombre', { ascending: true });

      if (errorCuentas) {
        console.error('Error cargando cuentas:', errorCuentas);
      } else {
        setCuentas(cuentasData || []);
      }

      // 3. CARGAR EQUIPO SEGÚN ROL DEL USUARIO LOGUEADO
      let equipoQuery = supabase
        .from('profiles')
        .select('id, nombre, apellido, rol, telefono')
        .order('nombre', { ascending: true });

      // ✅ FILTRO DE ROLES CORREGIDO
      if (profile?.rol === 'admin') {
        // Admin ve: admin + ejecutivo
        equipoQuery = equipoQuery.in('rol', ['admin', 'ejecutivo']);
      } else if (profile?.rol === 'socio') {
        // Socio ve: socio + ejecutivo
        equipoQuery = equipoQuery.in('rol', ['socio', 'ejecutivo']);
      } else if (profile?.rol === 'ejecutivo') {
        // Ejecutivo ve: solo él mismo
        equipoQuery = equipoQuery.eq('id', profile.id);
      }

      const { data: equipoData, error: errorEquipo } = await equipoQuery;

      if (errorEquipo) {
        console.error('Error cargando equipo:', errorEquipo);
      } else {
        setEquipo(equipoData || []);

        // Auto-seleccionar si es ejecutivo
        if (profile?.rol === 'ejecutivo' && equipoData && equipoData.length > 0) {
          setVendedor(`${equipoData[0].nombre} ${equipoData[0].apellido}`);
        } else if (profile) {
          setVendedor(`${profile.nombre} ${profile.apellido}`);
        }
      }

      // 4. CARGAR CLIENTES EXISTENTES
      // ✅ CORRECCIÓN: Usar .not() correctamente para campos no nulos
      const { data: clientesData, error: errorClientes } = await supabase
        .from('profiles')
        .select('id, nombre, telefono')
        .not('telefono', 'is', null)
        .order('nombre', { ascending: true });

      if (errorClientes) {
        console.error('Error cargando clientes:', errorClientes);
      } else {
        setClientesDB(clientesData || []);
      }

      // 5. Generar número de orden
      await generarNumeroOrden();

    } catch (error) {
      console.error('Error crítico en cargarDatos:', error);
    }
  };

  const generarNumeroOrden = async () => {
    try {
      const hoy = new Date();
      const dia = String(hoy.getDate()).padStart(2, '0');
      const mes = String(hoy.getMonth() + 1).padStart(2, '0');
      const fechaStr = hoy.toISOString().split('T')[0];

      const { count, error } = await supabase
        .from('ordenes')
        .select('*', { count: 'exact', head: true })
        .eq('fecha', fechaStr);

      if (error) {
        console.error('Error contando órdenes:', error);
      }

      const numero = (count || 0) + 1;
      setNumeroOrden(`#${dia}${mes}-V${numero}`);
    } catch (error) {
      console.error('Error generando número de orden:', error);
      setNumeroOrden(`#ORD-${Date.now()}`);
    }
  };

  const clientesSugeridos = clientesDB.filter(c => {
    if (!comprador && !whatsapp) return false;
    const matchNombre = comprador && c.nombre?.toLowerCase().includes(comprador.toLowerCase());
    const matchTel = whatsapp && c.telefono?.includes(whatsapp);
    return matchNombre || matchTel;
  }).slice(0, 5);

  const seleccionarCliente = (cliente: Cliente) => {
    setComprador(cliente.nombre);
    setWhatsapp(cliente.telefono || '');
    setShowSugerencias(false);
  };

  // ✅ REGISTRO AUTOMÁTICO EN TABLA CLIENTES
  const registrarCliente = async (nombre: string, telefono: string) => {
    if (!nombre || !telefono) return;
    try {
      const { data: existente } = await supabase.from('profiles').select('id').eq('telefono', telefono).single();
      if (existente) {
        await supabase.from('profiles').update({ ultima_venta: new Date().toISOString(), nombre }).eq('id', existente.id);
      } else {
        await supabase.from('profiles').insert([{
          nombre, telefono, rol: 'cliente', fuente: 'ventas_productos',
          informacion_completa: false, ultima_venta: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error('Error registrando cliente:', error);
    }
  };

  const agregarProducto = () => {
    if (!productoSel) { alert('⚠️ Selecciona un producto'); return; }
    if (cantidad <= 0) { alert('⚠️ Cantidad mayor a 0'); return; }
    const prod = productos.find(p => p.id === productoSel);
    if (!prod) return;

    const existe = items.find(i => i.id === prod.id);
    if (existe) {
      setItems(items.map(i => i.id === prod.id
        ? { ...i, cantidad: i.cantidad + cantidad, subtotal_usd: (i.cantidad + cantidad) * i.precio_venta_usd, subtotal_bs: (i.cantidad + cantidad) * i.precio_venta_usd * tasaBCV }
        : i
      ));
    } else {
      const sub = prod.precio_venta_usd * cantidad;
      setItems([...items, { id: prod.id, nombre: prod.nombre, precio_venta_usd: prod.precio_venta_usd, cantidad, subtotal_usd: sub, subtotal_bs: sub * tasaBCV }]);
    }
    setProductoSel('');
    setCantidad(1);
  };

  const eliminarItem = (idx: number) => { const n = [...items]; n.splice(idx, 1); setItems(n); };

  const subtotal = items.reduce((s, i) => s + i.subtotal_usd, 0);
  const subtotalBS = subtotal * tasaBCV;
  const totalUSD = subtotal + (incluyeDelivery ? montoDelivery : 0);
  const totalBS = totalUSD * tasaBCV;

  const registrar = async () => {
    if (!comprador || items.length === 0) { alert('⚠️ Comprador y productos requeridos'); return; }
    if (!vendedor) { alert('⚠️ Selecciona un vendedor'); return; }

    setLoading(true);
    try {
      // 1. Registrar cliente automáticamente
      await registrarCliente(comprador, whatsapp);

      const estPago = esFinanciado ? 'pendiente' : 'pagada';

      // 2. Crear venta
      const { data: venta, error } = await supabase.from('ventas').insert([{
        numero_orden: numeroOrden, fecha, vendedor,
        cliente_nombre: comprador, cliente_telefono: whatsapp,
        metodo_pago: metodoPago, cuenta_destino_id: cuentaDestino || null,
        total_usd: totalUSD,
        monto_pagado: esFinanciado ? (totalUSD - montoFinanciado) : totalUSD,
        saldo_pendiente: esFinanciado ? montoFinanciado : 0,
        estado_pago: estPago, es_financiado: esFinanciado,
        monto_financiado: esFinanciado ? montoFinanciado : 0,
        incluye_delivery: incluyeDelivery,
        monto_delivery: incluyeDelivery ? montoDelivery : 0,
        fecha_estimada_pago: fechaEstimadaPago || null,
        creado_por: user?.id,
      }]).select().single();

      if (error) throw error;

      // 3. Crear items
      await supabase.from('ventas_items').insert(items.map(i => ({
        venta_id: venta.id, producto_id: i.id, producto_nombre: i.nombre,
        cantidad: i.cantidad, precio_unitario: i.precio_venta_usd,
        subtotal_usd: i.subtotal_usd, subtotal_bs: i.subtotal_bs, total: i.subtotal_usd,
      })));

      // 4. Actualizar stock
      for (const i of items) {
        const { data: productoActual } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', i.id)
          .single();

        if (productoActual) {
          const nuevoStock = Math.max(0, productoActual.stock - i.cantidad);
          await supabase.from('productos').update({ stock: nuevoStock }).eq('id', i.id);
        }
      }

      // 5. Actualizar cuenta
      if (cuentaDestino && totalUSD > 0) {
        const ct = cuentas.find(c => c.id === cuentaDestino);
        if (ct) {
          const ns = ct.moneda === 'USD' ? ct.saldo_usd + totalUSD : ct.saldo_bs + totalBS;
          await supabase.from('cuentas').update({
            saldo_usd: ct.moneda === 'USD' ? ns : ct.saldo_usd,
            saldo_bs: ct.moneda === 'VES' ? ns : ct.saldo_bs,
          }).eq('id', cuentaDestino);
        }
      }

      // 6. Crear orden
      await supabase.from('ordenes').insert([{
        numero_orden: numeroOrden, venta_id: venta.id,
        estado: 'activa', categoria: 'Venta activa',
        fecha, cliente_nombre: comprador, cliente_telefono: whatsapp,
        vendedor, metodo_pago: metodoPago, total_usd: totalUSD, creado_por: user?.id,
      }]);

      // 7. Redirigir a Clientes
      const confirmacion = confirm(`✅ Venta registrada exitosamente\n\n¿Deseas completar la información del cliente "${comprador}"?`);
      
      if (confirmacion) {
        router.push(`/admin/clientes?nombre=${encodeURIComponent(comprador)}&telefono=${encodeURIComponent(whatsapp)}&fuente=ventas`);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error registrando venta:', err);
      alert('❌ Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  const marcas = [...new Set(productos.map(p => p.marca).filter(Boolean))];
  const prodsF = productos.filter(p => (!categoriaFilter || p.categoria === categoriaFilter) && (!marcaFilter || p.marca === marcaFilter));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: theme.colors.background.secondary, borderRadius: '16px', padding: '32px', maxWidth: '1000px', width: '100%', maxHeight: '95vh', overflowY: 'auto', border: `1px solid ${theme.colors.border.default}` }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>🛒 Nueva Venta</h2>
          <button onClick={onClose} style={{ width: '36px', height: '36px', background: theme.colors.background.tertiary, border: `1px solid ${theme.colors.border.default}`, borderRadius: '8px', color: theme.colors.text.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTimes /></button>
        </div>

        {/* Orden */}
        <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '11px', color: theme.colors.text.secondary, display: 'block' }}>N° ORDEN</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#a855f7', fontFamily: 'monospace' }}>{numeroOrden}</span>
          </div>
          <span style={{ fontSize: '11px', color: theme.colors.text.muted }}>Auto-generado</span>
        </div>

        {/* Datos Generales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={styleLabel}><FaCalendar style={{ marginRight: '6px' }} /> Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={styleInput} />
          </div>
          <div>
            <label style={styleLabel}><FaUser style={{ marginRight: '6px' }} /> Vendedor *</label>
            <select 
              value={vendedor} 
              onChange={e => setVendedor(e.target.value)} 
              disabled={profile?.rol === 'ejecutivo'}
              style={{ ...styleInput, opacity: profile?.rol === 'ejecutivo' ? 0.7 : 1, cursor: profile?.rol === 'ejecutivo' ? 'not-allowed' : 'pointer' }}
            >
              <option value="">Seleccionar...</option>
              {equipo.map(m => <option key={m.id} value={`${m.nombre} ${m.apellido}`}>{m.nombre} {m.apellido} ({m.rol})</option>)}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={styleLabel}>Comprador *</label>
            <input type="text" value={comprador} onChange={e => { setComprador(e.target.value); setShowSugerencias(true); }}
              onFocus={() => setShowSugerencias(true)} placeholder="Nombre del cliente" style={styleInput} />
            {showSugerencias && clientesSugeridos.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: theme.colors.background.tertiary, border: `1px solid ${theme.colors.border.default}`, borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                {clientesSugeridos.map(c => (
                  <button key={c.id} onClick={() => seleccionarCliente(c)} style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderBottom: `1px solid ${theme.colors.border.default}`, color: theme.colors.text.primary, cursor: 'pointer', textAlign: 'left', fontSize: '13px' }}>
                    <strong>{c.nombre}</strong> - {c.telefono}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={styleLabel}><FaWhatsapp style={{ marginRight: '6px' }} /> WhatsApp</label>
            <input type="text" value={whatsapp} onChange={e => { setWhatsapp(e.target.value); setShowSugerencias(true); }}
              onFocus={() => setShowSugerencias(true)} placeholder="4121234567" style={styleInput} />
          </div>

          <div>
            <label style={styleLabel}><FaMoneyBillWave style={{ marginRight: '6px' }} /> Método de Pago</label>
            <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)} style={styleInput}>
              <option value="efectivo">Efectivo</option>
              <option value="pago_movil">Pago Móvil</option>
              <option value="transferencia">Transferencia</option>
              <option value="zelle">Zelle</option>
              <option value="binance">Binance</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <div>
            <label style={styleLabel}>Cuenta Destino</label>
            <select value={cuentaDestino} onChange={e => setCuentaDestino(e.target.value)} style={styleInput}>
              <option value="">Seleccionar...</option>
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
            </select>
          </div>
        </div>

        {/* Delivery */}
        <div style={{ padding: '16px', background: theme.colors.background.tertiary, borderRadius: '8px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" checked={incluyeDelivery} onChange={e => setIncluyeDelivery(e.target.checked)} style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: '600' }}><FaTruck style={{ marginRight: '6px' }} />Incluye Delivery</span>
          </label>
          {incluyeDelivery && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <select value={deliveryTipo} onChange={e => setDeliveryTipo(e.target.value)} style={styleInput}>
                <option value="">Tipo...</option>
                <option value="administrador">Administrador</option>
                <option value="socio">Socio</option>
                <option value="delivery">Delivery</option>
                <option value="ejecutivo">Ejecutivo de Ventas</option>
              </select>
              <input type="text" value={deliveryNombre} onChange={e => setDeliveryNombre(e.target.value)} placeholder="Nombre" style={styleInput} />
              <div>
                <label style={{ ...styleLabel, fontSize: '11px' }}>Monto Delivery (USD)</label>
                <input type="number" step="0.01" min="0" value={montoDelivery} onChange={e => setMontoDelivery(parseFloat(e.target.value) || 0)} style={styleInput} />
              </div>
            </div>
          )}
        </div>

        {/* Financiado */}
        <div style={{ padding: '16px', background: esFinanciado ? 'rgba(245,158,11,0.1)' : theme.colors.background.tertiary, border: esFinanciado ? '1px solid rgba(245,158,11,0.3)' : 'none', borderRadius: '8px', marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" checked={esFinanciado} onChange={e => setEsFinanciado(e.target.checked)} style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '14px', color: theme.colors.text.primary, fontWeight: '600' }}>💳 Es Financiado</span>
          </label>
          {esFinanciado && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div>
                <label style={{ ...styleLabel, fontSize: '11px' }}>Monto que debe (USD)</label>
                <input type="number" step="0.01" min="0" value={montoFinanciado} onChange={e => setMontoFinanciado(parseFloat(e.target.value) || 0)} style={styleInput} />
              </div>
              <div>
                <label style={{ ...styleLabel, fontSize: '11px' }}>Fecha Estimada de Pago</label>
                <input type="date" value={fechaEstimadaPago} onChange={e => setFechaEstimadaPago(e.target.value)} style={styleInput} />
              </div>
            </div>
          )}
        </div>

        {/* Productos */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>📦 Agregar Productos</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ ...styleLabel, fontSize: '11px' }}>Categoría</label>
              <select value={categoriaFilter} onChange={e => setCategoriaFilter(e.target.value)} style={styleInput}>
                <option value="">Todas las categorías</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...styleLabel, fontSize: '11px' }}>Marca</label>
              <select value={marcaFilter} onChange={e => setMarcaFilter(e.target.value)} style={styleInput}>
                <option value="">Todas las marcas</option>
                {marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ ...styleLabel, fontSize: '11px' }}>Producto</label>
              <select value={productoSel} onChange={e => setProductoSel(e.target.value)} style={styleInput}>
                <option value="">Seleccionar producto...</option>
                {prodsF.map(p => <option key={p.id} value={p.id}>{p.nombre} - Stock: {p.stock} - ${p.precio_venta_usd}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...styleLabel, fontSize: '11px' }}>Cantidad</label>
              <input type="number" min="1" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 1)} style={styleInput} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={agregarProducto} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><FaPlus /> Agregar</button>
            </div>
          </div>

          {items.length > 0 && (
            <div style={{ background: theme.colors.background.tertiary, borderRadius: '8px', padding: '16px' }}>
              <button onClick={() => setShowDetalle(!showDetalle)} style={{ background: 'none', border: 'none', color: theme.colors.accent.primary, fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {showDetalle ? <FaChevronUp /> : <FaChevronDown />} Productos ({items.length})
              </button>
              {showDetalle && items.map((p, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 60px 100px 100px 32px', alignItems: 'center', gap: '12px', padding: '12px', background: theme.colors.background.secondary, borderRadius: '6px', marginBottom: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', color: theme.colors.text.primary, fontSize: '13px' }}>{p.nombre}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: theme.colors.text.secondary }}>${p.precio_venta_usd} c/u</p>
                  </div>
                  <div style={{ textAlign: 'center' }}><span style={{ fontWeight: '600', color: theme.colors.text.primary }}>x{p.cantidad}</span></div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.colors.text.secondary }}>USD</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>${p.subtotal_usd.toFixed(2)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: theme.colors.text.secondary }}>BS</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>Bs {p.subtotal_bs.toFixed(2)}</p>
                  </div>
                  <button onClick={() => eliminarItem(idx)} style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.2)', border: 'none', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTrash /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen */}
        <div style={{ background: theme.colors.background.tertiary, borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: theme.colors.text.primary }}>💰 Resumen</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: theme.colors.text.secondary }}>Subtotal ({items.length} items)</span>
            <span style={{ fontWeight: '700', color: theme.colors.text.primary }}>${subtotal.toFixed(2)} <span style={{ fontSize: '12px', color: theme.colors.text.muted }}>Bs {subtotalBS.toFixed(2)}</span></span>
          </div>
          {incluyeDelivery && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: theme.colors.text.secondary }}><FaTruck style={{ marginRight: '6px' }} />Delivery</span>
              <span style={{ fontWeight: '700', color: '#22c55e' }}>+ ${montoDelivery.toFixed(2)} <span style={{ fontSize: '12px', color: theme.colors.text.muted }}>Bs {(montoDelivery * tasaBCV).toFixed(2)}</span></span>
            </div>
          )}
          <div style={{ height: '1px', background: theme.colors.border.default, margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>TOTAL</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#22c55e' }}>${totalUSD.toFixed(2)}</span>
              <span style={{ fontSize: '14px', color: '#22c55e', marginLeft: '12px' }}>Bs {totalBS.toFixed(2)}</span>
            </div>
          </div>
          {esFinanciado && montoFinanciado > 0 && (
            <>
              <div style={{ height: '1px', background: 'rgba(245,158,11,0.3)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f59e0b', fontWeight: '600' }}>💳 Financiado</span>
                <span style={{ fontWeight: '700', color: '#f59e0b' }}>${montoFinanciado.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: theme.colors.text.secondary }}>Pagado ahora</span>
                <span style={{ fontWeight: '700', color: '#22c55e' }}>${(totalUSD - montoFinanciado).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 24px', background: theme.colors.background.tertiary, border: `1px solid ${theme.colors.border.default}`, borderRadius: '8px', color: theme.colors.text.primary, fontWeight: '600', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={registrar} disabled={loading || items.length === 0 || !comprador || !vendedor}
            style={{ padding: '12px 24px', background: (loading || items.length === 0 || !comprador || !vendedor) ? theme.colors.background.elevated : 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', borderRadius: '8px', color: (loading || items.length === 0 || !comprador || !vendedor) ? theme.colors.text.muted : 'white', fontWeight: '700', fontSize: '16px', cursor: (loading || items.length === 0 || !comprador || !vendedor) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaSave /> {loading ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      </div>
    </div>
  );
}