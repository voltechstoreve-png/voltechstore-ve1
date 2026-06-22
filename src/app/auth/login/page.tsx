'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaEnvelope, FaLock, FaKey, FaSignInAlt, FaArrowLeft } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password, pin);

    if (error) {
      setError(error.message);
    } else {
      router.push('/');
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(31, 41, 55, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        padding: '40px',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Botón Volver */}
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#9ca3af',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '24px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#8b5cf6'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
        >
          <FaArrowLeft /> Volver al inicio
        </a>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '36px',
            fontWeight: 'bold',
            color: 'white',
          }}>
            V
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'white',
            margin: '0 0 8px 0',
          }}>
            Iniciar Sesión
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Accede a VoltechStore.ve
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              <FaEnvelope style={{ marginRight: '6px' }} />
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jperes@voltechstore.ve"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              <FaLock style={{ marginRight: '6px' }} />
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              <FaKey style={{ marginRight: '6px' }} />
              PIN de Seguridad
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              maxLength={4}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '6px', margin: 0 }}>
              Ingresa tu PIN de 4 dígitos
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <FaSignInAlt /> {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          paddingTop: '24px',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            ¿No tienes cuenta?{' '}
            <a
              href="/auth/registro"
              style={{
                color: '#8b5cf6',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}