'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaUser, FaPhone, FaEnvelope, FaLock, FaKey, FaCamera, FaUserPlus, FaArrowLeft, FaIdCard } from 'react-icons/fa';

export default function RegistroPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    emailPersonal: '', // ✅ NUEVO: Email personal
    whatsapp: '',
    password: '',
    pin: '',
    confirmPassword: '',
    confirmPin: '',
  });
  const [fotoUrl, setFotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailGenerado, setEmailGenerado] = useState('');

  const generarEmail = (nombre: string, apellido: string) => {
    const inicial = nombre.charAt(0).toLowerCase();
    const apellidoClean = apellido.toLowerCase().replace(/\s/g, '');
    return `${inicial}${apellidoClean}@voltechstore.ve`;
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.value;
    setFormData({ ...formData, nombre });
    if (formData.apellido) {
      setEmailGenerado(generarEmail(nombre, formData.apellido));
    }
  };

  const handleApellidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const apellido = e.target.value;
    setFormData({ ...formData, apellido });
    if (formData.nombre) {
      setEmailGenerado(generarEmail(formData.nombre, apellido));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      setError('Los PINs no coinciden');
      return;
    }

    if (formData.pin.length !== 4) {
      setError('El PIN debe tener 4 dígitos');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      nombre: formData.nombre,
      apellido: formData.apellido,
      emailPersonal: formData.emailPersonal, // ✅ NUEVO
      whatsapp: formData.whatsapp,
      password: formData.password,
      pin: formData.pin,
      foto_url: fotoUrl || undefined,
    });

    if (error) {
      setError(error.message);
    } else {
      // ✅ Mostrar mensaje con las credenciales
      alert(
        `✅ Registro exitoso!\n\n` +
        `Tu correo corporativo es:\n${emailGenerado}\n\n` +
        `Usa este correo y tu contraseña para iniciar sesión.\n\n` +
        `Tu cuenta está pendiente de aprobación por el administrador.`
      );
      router.push('/auth/login');
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
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
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
          <FaArrowLeft /> Volver al catálogo
        </a>

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
            Crear Cuenta
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Regístrate para acceder al sistema
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
          {/* Foto URL */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              <FaCamera style={{ marginRight: '6px' }} />
              Foto de Perfil (URL - Opcional)
            </label>
            <input
              type="url"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Nombre y Apellido */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                <FaUser style={{ marginRight: '6px' }} />
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={handleNombreChange}
                placeholder="Juan"
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                Apellido *
              </label>
              <input
                type="text"
                value={formData.apellido}
                onChange={handleApellidoChange}
                placeholder="Pérez"
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
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* ✅ NUEVO: Email Personal */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              <FaEnvelope style={{ marginRight: '6px' }} />
              Correo Personal *
            </label>
            <input
              type="email"
              value={formData.emailPersonal}
              onChange={(e) => setFormData({ ...formData, emailPersonal: e.target.value })}
              placeholder="tucorreo@gmail.com"
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
                boxSizing: 'border-box',
              }}
            />
            <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '6px', margin: 0 }}>
              Usaremos este correo para enviarte tus credenciales
            </p>
          </div>

          {/* Email Generado (corporativo) */}
          {emailGenerado && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                <FaIdCard style={{ marginRight: '6px' }} />
                Tu Correo Corporativo (se generará automáticamente)
              </label>
              <input
                type="text"
                value={emailGenerado}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '10px',
                  color: '#22c55e',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '6px', margin: 0 }}>
                Este será tu correo para iniciar sesión
              </p>
            </div>
          )}

          {/* WhatsApp */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#9ca3af',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
            }}>
              <FaPhone style={{ marginRight: '6px' }} />
              WhatsApp *
            </label>
            <input
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="04121234567"
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
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Contraseña y Confirmar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                <FaLock style={{ marginRight: '6px' }} />
                Contraseña *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                Confirmar *
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* PIN y Confirmar PIN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                <FaKey style={{ marginRight: '6px' }} />
                PIN (4 dígitos) *
              </label>
              <input
                type="password"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
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
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500',
                marginBottom: '8px',
              }}>
                Confirmar PIN *
              </label>
              <input
                type="password"
                value={formData.confirmPin}
                onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
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
                  boxSizing: 'border-box',
                }}
              />
            </div>
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
            }}
          >
            <FaUserPlus /> {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          paddingTop: '24px',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            ¿Ya tienes cuenta?{' '}
            <a
              href="/auth/login"
              style={{
                color: '#8b5cf6',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}