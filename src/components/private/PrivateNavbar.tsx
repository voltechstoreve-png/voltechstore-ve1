'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { FaSignOutAlt, FaStore } from 'react-icons/fa';

export default function PrivateNavbar() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { theme, mode, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        zIndex: 40,
        borderBottom: `1px solid ${theme.colors.border.default}`,
        background: theme.colors.background.secondary,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* IZQUIERDA: Identidad de Marca */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            V
          </div>
          <div>
            <h1
              style={{
                fontSize: '16px',
                fontWeight: '700',
                margin: 0,
                color: theme.colors.text.primary,
                lineHeight: 1.2,
              }}
            >
              VoltechStore.ve
            </h1>
            <p
              style={{
                fontSize: '11px',
                color: theme.colors.text.secondary,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Centro de Control
            </p>
          </div>
        </div>

        {/* DERECHA: Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Botón Tienda Pública */}
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              color: '#22c55e',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
            }}
            title="Ver Tienda Pública"
          >
            <FaStore />
            <span>Ver Tienda</span>
          </button>

          {/* Toggle Tema */}
          <button
            onClick={toggleTheme}
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
              fontSize: '18px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.colors.background.tertiary;
            }}
            title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Info Usuario */}
          {user && profile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingLeft: '16px',
                marginLeft: '4px',
                borderLeft: `1px solid ${theme.colors.border.default}`,
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                  }}
                >
                  {profile.nombre}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: '11px',
                    color: theme.colors.text.secondary,
                  }}
                >
                  {profile.rol}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                }}
                title="Cerrar sesión"
              >
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}