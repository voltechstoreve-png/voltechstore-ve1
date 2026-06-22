'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FaTelegram, FaBell, FaStar, FaGift, FaTv, FaMoneyBillWave,
  FaBox, FaSave, FaClock, FaToggleOn, FaToggleOff
} from 'react-icons/fa';

interface Alerta {
  id: string;
  tipo: string;
  activo: boolean;
  mensaje_plantilla: string;
  fecha_programada?: string;
  estado: string;
}

const TIPOS_ALERTA = [
  {
    id: 'opinion',
    label: 'Nuevas Opiniones',
    icon: FaStar,
    color: '#fbbf24',
    descripcion: 'Alerta inmediata cuando un cliente deja una reseña',
    plantilla: '🔔 Nueva opinión de {{cliente}} sobre {{producto}}. Pendiente por aprobación',
    inmediato: true,
  },
  {
    id: 'sorteo',
    label: 'Registros de Sorteos',
    icon: FaGift,
    color: '#a855f7',
    descripcion: 'Notificación cuando alguien se registra en un sorteo',
    plantilla: '🎉 Nuevo registro en sorteo: {{nombre}} - {{telefono}}. Validar datos en el panel',
    inmediato: true,
  },
  {
    id: 'streaming_hub',
    label: 'Hub de Streaming',
    icon: FaTv,
    color: '#3b82f6',
    descripcion: 'Auditoría cuando se actualizan cuentas compartidas',
    plantilla: '📺 Cuentas actualizadas en el Hub. Modificado por: {{empleado}} a las {{hora}}',
    inmediato: true,
  },
  {
    id: 'cobro_streaming',
    label: 'Cobranza Streaming',
    icon: FaMoneyBillWave,
    color: '#22c55e',
    descripcion: 'Recordatorio 2 días antes del vencimiento',
    plantilla: '⏰ Recordatorio de pago: A {{cliente}} se le vence su servicio de {{streaming}} en 2 días',
    inmediato: false,
  },
  {
    id: 'cobro_producto',
    label: 'Cobranza Productos',
    icon: FaBox,
    color: '#ef4444',
    descripcion: 'Alerta en la fecha estimada de pago',
    plantilla: '💸 Recordatorio de factura: Hoy se cumple la fecha estimada de pago del cliente {{cliente}} por la compra de {{producto}}',
    inmediato: false,
  },
];

export default function TelegramPage() {
  const { theme } = useTheme();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [fechaEditada, setFechaEditada] = useState<string>('');

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    const { data } = await supabase
      .from('telegram_alertas')
      .select('*')
      .order('creado_en', { ascending: false });
    setAlertas(data || []);
  };

  const toggleAlerta = async (tipo: string) => {
    const existente = alertas.find(a => a.tipo === tipo);
    const config = TIPOS_ALERTA.find(t => t.id === tipo);

    if (existente) {
      await supabase
        .from('telegram_alertas')
        .update({ activo: !existente.activo })
        .eq('id', existente.id);
    } else {
      await supabase
        .from('telegram_alertas')
        .insert([{
          tipo,
          activo: true,
          mensaje_plantilla: config?.plantilla || '',
        }]);
    }
    cargarAlertas();
  };

  const guardarFecha = async (id: string) => {
    await supabase
      .from('telegram_alertas')
      .update({ fecha_programada: fechaEditada })
      .eq('id', id);
    setEditandoId(null);
    cargarAlertas();
  };

  const enviarPrueba = async (tipo: string) => {
    const config = TIPOS_ALERTA.find(t => t.id === tipo);
    if (!confirm(`¿Enviar alerta de prueba "${config?.label}" a Telegram?`)) return;

    try {
      const response = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo }),
      });

      if (response.ok) {
        alert('✅ Alerta de prueba enviada');
      } else {
        alert('❌ Error al enviar');
      }
    } catch (error) {
      alert('❌ Error: ' + (error as Error).message);
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
            background: 'rgba(0, 136, 204, 0.15)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0088CC',
            fontSize: '22px',
          }}>
            <FaTelegram />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
              Bot de Alertas Telegram
            </h1>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
              Notificaciones automáticas y recordatorios de cobro
            </p>
          </div>
        </div>
      </div>

      {/* Info Bot */}
      <div style={{
        background: 'rgba(0, 136, 204, 0.08)',
        border: '1px solid rgba(0, 136, 204, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <FaBell style={{ color: '#0088CC', fontSize: '20px' }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: theme.colors.text.primary }}>
            Bot activo y conectado
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: theme.colors.text.secondary }}>
            Las alertas se envían en tiempo real a tu Telegram
          </p>
        </div>
        <div style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
        }} />
      </div>

      {/* Tipos de Alerta */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: theme.colors.text.primary }}>
        Configuración de Alertas
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {TIPOS_ALERTA.map((tipo) => {
          const Icon = tipo.icon;
          const alerta = alertas.find(a => a.tipo === tipo.id);
          const estaActiva = alerta?.activo || false;

          return (
            <div
              key={tipo.id}
              style={{
                background: theme.colors.background.secondary,
                border: `1px solid ${estaActiva ? `${tipo.color}50` : theme.colors.border.default}`,
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `${tipo.color}20`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tipo.color,
                  fontSize: '22px',
                }}>
                  <Icon />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
                    {tipo.label}
                  </h3>
                  <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '4px 0 0 0' }}>
                    {tipo.descripcion}
                  </p>
                </div>
                <button
                  onClick={() => toggleAlerta(tipo.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: estaActiva ? '#22c55e' : theme.colors.text.muted,
                    fontSize: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={estaActiva ? 'Desactivar' : 'Activar'}
                >
                  {estaActiva ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>

              {/* Plantilla */}
              <div style={{
                padding: '12px',
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '8px',
                marginBottom: '12px',
              }}>
                <p style={{ fontSize: '11px', color: theme.colors.text.secondary, margin: '0 0 4px 0', fontWeight: '600' }}>
                  PLANTILLA:
                </p>
                <p style={{ fontSize: '13px', color: theme.colors.text.primary, margin: 0, fontFamily: 'monospace' }}>
                  {alerta?.mensaje_plantilla || tipo.plantilla}
                </p>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!tipo.inmediato && (
                  <button
                    onClick={() => {
                      setEditandoId(alerta?.id || null);
                      setFechaEditada(alerta?.fecha_programada || '');
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#3b82f6',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FaClock /> Programar hora
                  </button>
                )}
                <button
                  onClick={() => enviarPrueba(tipo.id)}
                  style={{
                    padding: '8px 14px',
                    background: `${tipo.color}20`,
                    border: `1px solid ${tipo.color}40`,
                    borderRadius: '8px',
                    color: tipo.color,
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FaBell /> Enviar prueba
                </button>
              </div>

              {/* Editor de fecha */}
              {editandoId === alerta?.id && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: theme.colors.background.tertiary,
                  border: `1px solid ${theme.colors.border.default}`,
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}>
                  <input
                    type="datetime-local"
                    value={fechaEditada}
                    onChange={(e) => setFechaEditada(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: theme.colors.background.secondary,
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '6px',
                      color: theme.colors.text.primary,
                      fontSize: '13px',
                    }}
                  />
                  <button
                    onClick={() => guardarFecha(alerta!.id)}
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <FaSave /> Guardar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}