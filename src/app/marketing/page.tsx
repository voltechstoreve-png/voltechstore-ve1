'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import {
  FaWhatsapp, FaInstagram, FaTelegram, FaChartLine,
  FaEnvelope, FaRobot, FaBullhorn, FaArrowRight
} from 'react-icons/fa';

const modulos = [
  {
    id: 'difusion',
    titulo: 'Cola de Difusión WhatsApp',
    descripcion: 'Envía mensajes masivos de forma segura con retrasos inteligentes anti-baneo',
    icon: FaWhatsapp,
    color: '#25D366',
    path: '/marketing/difusion',
    stats: { label: 'Mensajes hoy', value: '0' },
  },
  {
    id: 'copys',
    titulo: 'Generador de Copys',
    descripcion: 'Crea textos persuasivos para redes sociales en 1 clic con tu marca',
    icon: FaInstagram,
    color: '#E1306C',
    path: '/marketing/copys',
    stats: { label: 'Copys generados', value: '0' },
  },
  {
    id: 'telegram',
    titulo: 'Bot de Alertas Telegram',
    descripcion: 'Recibe notificaciones de opiniones, sorteos, cobros y más en tiempo real',
    icon: FaTelegram,
    color: '#0088CC',
    path: '/marketing/telegram',
    stats: { label: 'Alertas activas', value: '0' },
  },
];

export default function MarketingDashboard() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #f59e0b, #ec4899)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '22px',
          }}>
            <FaBullhorn />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>
              Centro de Marketing
            </h1>
            <p style={{ fontSize: '14px', color: theme.colors.text.secondary, margin: 0 }}>
              Automatiza campañas, genera contenido y recibe alertas
            </p>
          </div>
        </div>
      </div>

      {/* Stats Globales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.1), rgba(37, 211, 102, 0.05))',
          border: '1px solid rgba(37, 211, 102, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <FaWhatsapp style={{ color: '#25D366', fontSize: '24px', marginBottom: '8px' }} />
          <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 0 4px 0' }}>WhatsApp Enviados</p>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>0</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.1), rgba(225, 48, 108, 0.05))',
          border: '1px solid rgba(225, 48, 108, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <FaInstagram style={{ color: '#E1306C', fontSize: '24px', marginBottom: '8px' }} />
          <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 0 4px 0' }}>Copys Generados</p>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>0</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.1), rgba(0, 136, 204, 0.05))',
          border: '1px solid rgba(0, 136, 204, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <FaTelegram style={{ color: '#0088CC', fontSize: '24px', marginBottom: '8px' }} />
          <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 0 4px 0' }}>Alertas Telegram</p>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>0</p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <FaChartLine style={{ color: '#f59e0b', fontSize: '24px', marginBottom: '8px' }} />
          <p style={{ fontSize: '12px', color: theme.colors.text.secondary, margin: '0 0 4px 0' }}>Campañas Activas</p>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: theme.colors.text.primary }}>0</p>
        </div>
      </div>

      {/* Módulos */}
      <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0', color: theme.colors.text.primary }}>
        Módulos Disponibles
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {modulos.map((modulo) => {
          const Icon = modulo.icon;
          return (
            <button
              key={modulo.id}
              onClick={() => router.push(modulo.path)}
              style={{
                background: theme.colors.background.tertiary,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = modulo.color;
                e.currentTarget.style.boxShadow = `0 12px 32px ${modulo.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = theme.colors.border.default;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: `${modulo.color}20`,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: modulo.color,
                  fontSize: '26px',
                }}>
                  <Icon />
                </div>
                <div style={{
                  padding: '6px 12px',
                  background: `${modulo.color}15`,
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: modulo.color,
                }}>
                  {modulo.stats.value} {modulo.stats.label}
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px 0', color: theme.colors.text.primary }}>
                {modulo.titulo}
              </h3>
              <p style={{ fontSize: '13px', color: theme.colors.text.secondary, margin: '0 0 16px 0', lineHeight: '1.5' }}>
                {modulo.descripcion}
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: modulo.color,
                fontSize: '13px',
                fontWeight: '600',
              }}>
                <span>Abrir módulo</span>
                <FaArrowRight style={{ fontSize: '12px' }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}